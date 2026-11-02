-- ============================================================
-- 016 — Feedback requests
--   * on_appointment_finalized (recreated from 003) now also creates a
--     feedback_requests row when the appointment has a client: token =
--     32 random bytes base64url, only sha256(token) is stored, expires in
--     14 days, single use (answered_at set by submit_feedback_rpc).
--   * submit_feedback_rpc — SECURITY DEFINER, granted ONLY to service_role
--     (the /feedback/[token] server action is the sole caller): validates
--     the token (exists / not expired / not already answered), stores the
--     rating + optional comment and whether the client was routed to Google.
-- Mirrored in lib/supabase/types.ts (Functions).
-- ============================================================

-- ------------------------------------------------------------
-- Finalize trigger — same body as 003 plus the feedback request insert.
-- The token itself is never persisted; only its sha256 hash. The plaintext
-- token would live in the (future) message to the client; until messaging
-- exists the hash is enough to serve /feedback/[token] (the action hashes
-- the token from the URL and looks the row up by hash).
-- ------------------------------------------------------------
create or replace function public.on_appointment_finalized() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cfg jsonb;
  v_points int;
  v_token text;
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

  -- Feedback request (only when the appointment has a client; one row per
  -- appointment — the unique token_hash plus the exists-check keep it
  -- idempotent even if the trigger body ever runs twice for one appointment).
  if new.client_id is not null and not exists (
    select 1 from public.feedback_requests where appointment_id = new.id
  ) then
    -- 32 random bytes → base64url (no padding), alphabet-safe for URLs.
    v_token := translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_');
    v_token := rtrim(v_token, '=');
    insert into public.feedback_requests
      (salon_id, appointment_id, client_id, token_hash, expires_at)
    values
      (new.salon_id, new.id, new.client_id,
       encode(digest(v_token, 'sha256'), 'hex'),
       now() + interval '14 days')
    on conflict (token_hash) do nothing;
  end if;

  return new;
end;
$$;

-- Recreate the trigger binding (same as 003; create or replace on the
-- function does not refresh the trigger, but the binding is identical —
-- kept for clarity so re-running 016 alone is sufficient on a fresh DB).
drop trigger if exists appointments_finalized on public.appointments;
create trigger appointments_finalized
  after update on public.appointments
  for each row
  when (new.status = 'finalizat' and old.status is distinct from 'finalizat')
  execute function public.on_appointment_finalized();

-- ------------------------------------------------------------
-- Submit RPC — single-use, expiry-checked. Callable only by service_role;
-- the public page talks to it through a server action using the admin client.
-- ------------------------------------------------------------
create or replace function public.submit_feedback_rpc(
  p_token_hash text,
  p_rating int,
  p_comment text,
  p_routed_to_google boolean
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.feedback_requests;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'invalid';
  end if;

  select * into v_row from public.feedback_requests
    where token_hash = p_token_hash;
  if not found then
    raise exception 'invalid';
  end if;
  if v_row.answered_at is not null then
    raise exception 'used';
  end if;
  if v_row.expires_at < now() then
    raise exception 'expired';
  end if;

  update public.feedback_requests
    set rating = p_rating,
        comment = nullif(trim(coalesce(p_comment, '')), ''),
        routed_to_google = coalesce(p_routed_to_google, false),
        answered_at = now(),
        updated_at = now()
    where id = v_row.id;

  return json_build_object('ok', true, 'salon_id', v_row.salon_id);
end;
$$;

revoke execute on function public.submit_feedback_rpc(text, int, text, boolean)
  from public, anon, authenticated;
grant execute on function public.submit_feedback_rpc(text, int, text, boolean)
  to service_role;
