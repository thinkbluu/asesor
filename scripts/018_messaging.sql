-- ============================================================
-- 018 — Transactional messaging (P12)
-- ============================================================
-- 1. message_log.salon_id becomes nullable: contact_nou is a site-level
--    message (no salon behind it) but must still be logged.
-- 2. feedback_requests.emailed_at: the feedback cron marks the row after the
--    cerere_feedback email goes out; rows with emailed_at null inside the
--    2–3h finalize window are (re)sent, everything else is left alone.
-- 3. on_appointment_finalized is recreated WITHOUT the feedback_requests
--    insert. The trigger only ever stored the sha256(token) hash, so the raw
--    token needed for the /feedback/[token] link was unrecoverable. The
--    feedback cron now creates the row itself (token generated app-side,
--    hash stored, plaintext token used exactly once in the email), keeping
--    the hash-only storage invariant. The trigger's exists-check made the
--    insert idempotent; its removal is safe because the cron is the only
--    writer from now on.
-- ============================================================

alter table public.message_log alter column salon_id drop not null;

alter table public.feedback_requests add column if not exists emailed_at timestamptz;

-- ------------------------------------------------------------
-- Finalize trigger — same body as 016 minus the feedback insert.
-- ------------------------------------------------------------
create or replace function public.on_appointment_finalized() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cfg jsonb;
  v_points int;
begin
  if new.status <> 'finalizat' or old.status = 'finalizat' then
    return new;
  end if;

  -- Idempotency: if consum movements already exist for this appointment, skip everything.
  if exists (
    select 1 from public.stock_movements
    where appointment_id = new.id and type = 'consum'
  ) then
    return new;
  end if;

  -- Stock consum (one movement per service_products row per service line)
  insert into public.stock_movements (salon_id, product_id, type, quantity, appointment_id, note)
  select new.salon_id,
         sp.product_id,
         'consum',
         -(sp.quantity_per_use),
         new.id,
         'Consum automat: ' || aps.name_snapshot
  from public.appointment_services aps
  join public.service_products sp
    on sp.service_id = aps.service_id
   and sp.salon_id = new.salon_id
  where aps.appointment_id = new.id;

  -- Loyalty
  select loyalty_config into v_cfg from public.salons where id = new.salon_id;
  if coalesce((v_cfg ->> 'enabled')::boolean, false)
     and coalesce((v_cfg ->> 'ronPerPoint')::numeric, 0) > 0
     and new.client_id is not null
     and new.total_price is not null then
    v_points := floor(new.total_price / (v_cfg ->> 'ronPerPoint')::numeric);
    if v_points > 0 then
      insert into public.loyalty_ledger (salon_id, client_id, type, points, appointment_id, note)
      values (new.salon_id, new.client_id, 'earned', v_points, new.id, 'Puncte câștigate automat');

      update public.clients
      set loyalty_points = loyalty_points + v_points,
          lifetime_points = lifetime_points + v_points
      where id = new.client_id;
    end if;
  end if;

  -- Feedback request: created by the P12 feedback cron (app-side), which
  -- owns the plaintext token for the email link. See script header.
  return new;
end;
$$;

-- Recreate the trigger binding (same as 016).
drop trigger if exists appointments_finalized on public.appointments;
create trigger appointments_finalized
  after update on public.appointments
  for each row
  when (new.status = 'finalizat' and old.status is distinct from 'finalizat')
  execute function public.on_appointment_finalized();
