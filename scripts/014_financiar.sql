-- ============================================================
-- 014 — Financiar: checkout RPC, day lock, recurring expenses, reports
-- ============================================================
-- P8 part 2. Adds:
--   * checkout_appointment_rpc — atomic checkout: day-lock check, loyalty
--     redemption, transaction row(s) (split supported), status → finalizat
--     (which fires the stock-consum / loyalty-earn trigger from 003)
--   * day-lock triggers on transactions and appointments — edits/refunds on a
--     closed day are refused at DB level, not just in the actions
--   * expenses.parent_id + unique index — recurring expense instances are
--     idempotent; generate_recurring_expenses fills due entries
--   * fin_report RPC — revenue by day/staff/service, payment mix, avg ticket
--     in one round trip (owner/manager only)
-- Mirrored in lib/supabase/types.ts (Functions + expenses columns).
-- ============================================================

-- ------------------------------------------------------------
-- Day-lock helper: a day is locked when a day_closes row exists and has not
-- been reopened. Days in Europe/Bucharest (same convention as 012).
-- ------------------------------------------------------------
create or replace function public.fin_day_is_closed(p_salon uuid, p_day date)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.day_closes
    where salon_id = p_salon and day = p_day and reopened_at is null
  )
$$;

-- ------------------------------------------------------------
-- Checkout RPC — the single atomic path for "Încasează".
-- security definer because receptionists run checkout but have no direct
-- transactions RLS access (004: o/m only); the role check below is the gate.
-- ------------------------------------------------------------
create or replace function public.checkout_appointment_rpc(
  p_appointment_id uuid,
  p_discount numeric,          -- extra discount at checkout (lei, fix)
  p_tip numeric,
  p_method1 public.payment_method,
  p_amount1 numeric,
  p_method2 public.payment_method default null,
  p_amount2 numeric default null,
  p_redeem_points int default 0
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_apt public.appointments;
  v_salon uuid;
  v_day date;
  v_services_total numeric;
  v_appointment_discount numeric;
  v_ron_per_point numeric;
  v_redeem_points int;
  v_redeem_lei numeric;
  v_base numeric;
  v_total numeric;
  v_tx1 uuid;
  v_tx2 uuid;
  v_cfg jsonb;
  v_balance int;
begin
  select * into v_apt from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'Programarea nu a fost găsită.';
  end if;
  v_salon := v_apt.salon_id;

  -- Receptionist may run checkout; staff and others may not.
  if not public.has_salon_role(v_salon, array['owner', 'manager', 'receptionist']::public.member_role[]) then
    raise exception 'Nu ai permisiunea să încasezi.';
  end if;

  -- Day lock (Bucharest calendar day of the appointment start).
  v_day := (v_apt.starts_at at time zone 'Europe/Bucharest')::date;
  if public.fin_day_is_closed(v_salon, v_day) then
    raise exception 'Ziua a fost închisă. Redeschiderea se face doar de proprietar.';
  end if;

  if v_apt.status = 'finalizat' then
    raise exception 'Programarea a fost deja încasată.';
  end if;
  if v_apt.status in ('anulat', 'no_show') then
    raise exception 'Nu poți încasa o programare anulată sau no-show.';
  end if;

  -- Money math from the appointment lines, not from the client.
  select coalesce(sum(price), 0) into v_services_total
    from public.appointment_services where appointment_id = v_apt.id;

  v_appointment_discount := case v_apt.discount_type
    when 'procent' then round(v_services_total * v_apt.discount / 100, 2)
    else v_apt.discount
  end;

  v_base := greatest(v_services_total - v_appointment_discount - coalesce(p_discount, 0), 0);

  -- Loyalty redemption: capped by the client's balance and by what is left
  -- to pay. Points → lei uses salons.loyalty_config.ron_per_point.
  v_redeem_points := 0;
  v_redeem_lei := 0;
  if coalesce(p_redeem_points, 0) > 0 and v_apt.client_id is not null then
    select loyalty_config into v_cfg from public.salons where id = v_salon;
    v_ron_per_point := coalesce((v_cfg ->> 'ron_per_point')::numeric, 0);
    if v_ron_per_point > 0 then
      select loyalty_points into v_balance from public.clients where id = v_apt.client_id;
      v_redeem_points := least(p_redeem_points, greatest(coalesce(v_balance, 0), 0), ceil(v_base / v_ron_per_point)::int);
      if v_redeem_points > 0 then
        v_redeem_lei := round(v_redeem_points * v_ron_per_point, 2);
        update public.clients
          set loyalty_points = loyalty_points - v_redeem_points
          where id = v_apt.client_id;
        insert into public.loyalty_ledger (salon_id, client_id, type, points, appointment_id, note)
          values (v_salon, v_apt.client_id, 'redeemed', -v_redeem_points, v_apt.id,
                  'Răscumpărate la încasare');
      end if;
    end if;
  end if;

  v_total := greatest(v_base - v_redeem_lei, 0);

  -- Split validation: the two amounts must cover the total exactly.
  if p_method2 is not null then
    if coalesce(p_amount2, 0) <= 0 or coalesce(p_amount1, 0) <= 0
       or round(coalesce(p_amount1, 0) + coalesce(p_amount2, 0), 2) <> round(v_total, 2) then
      raise exception 'Împărțirea plății trebuie să acopere exact totalul.';
    end if;
  end if;

  -- Transaction row(s). Tip rides on the first row.
  insert into public.transactions
    (salon_id, appointment_id, client_id, staff_id, amount, tip, discount,
     payment_method, status, notes, paid_at, created_by)
  values
    (v_salon, v_apt.id, v_apt.client_id, v_apt.staff_id,
     coalesce(p_amount1, v_total), coalesce(p_tip, 0), coalesce(p_discount, 0) + v_redeem_lei,
     p_method1, 'incasat',
     case when v_redeem_lei > 0 then 'Puncte răscumpărate: ' || v_redeem_points else null end,
     now(), auth.uid())
  returning id into v_tx1;

  if p_method2 is not null then
    insert into public.transactions
      (salon_id, appointment_id, client_id, staff_id, amount, tip, discount,
       payment_method, status, notes, paid_at, created_by)
    values
      (v_salon, v_apt.id, v_apt.client_id, v_apt.staff_id,
       coalesce(p_amount2, 0), 0, 0,
       p_method2, 'incasat', 'Plată împărțită', now(), auth.uid())
    returning id into v_tx2;
  end if;

  -- Status change fires on_appointment_finalized (stock consum + points earn).
  update public.appointments set status = 'finalizat' where id = v_apt.id;

  return json_build_object(
    'transactionIds', to_jsonb(case when v_tx2 is null then array[v_tx1] else array[v_tx1, v_tx2] end),
    'total', v_total,
    'redeemPoints', v_redeem_points,
    'redeemLei', v_redeem_lei
  );
end;
$$;

revoke execute on function public.checkout_appointment_rpc(uuid, numeric, numeric, public.payment_method, numeric, public.payment_method, numeric, int) from public, anon;

-- ------------------------------------------------------------
-- Day-lock triggers: no transaction edits/deletes/inserts and no un-finishing
-- of appointments on a closed day. Message matches the action layer.
-- ------------------------------------------------------------
create or replace function public.fin_guard_transactions() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_salon uuid;
  v_paid timestamptz;
  v_day date;
begin
  -- NEW is unassigned on DELETE — pick the row by operation first.
  if tg_op = 'DELETE' then
    v_salon := old.salon_id;
    v_paid := coalesce(old.paid_at, old.created_at);
  else
    v_salon := new.salon_id;
    v_paid := coalesce(new.paid_at, new.created_at, old.paid_at, old.created_at);
  end if;
  v_day := (v_paid at time zone 'Europe/Bucharest')::date;
  if public.fin_day_is_closed(v_salon, v_day) then
    raise exception 'Ziua a fost închisă. Redeschiderea se face doar de proprietar.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists fin_transactions_guard on public.transactions;
create trigger fin_transactions_guard
  before insert or update or delete on public.transactions
  for each row execute function public.fin_guard_transactions();

create or replace function public.fin_guard_appointments() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Once finalized (and paid), an appointment on a closed day cannot be
  -- un-finalized or edited money-wise.
  if old.status = 'finalizat'
     and (new.status is distinct from 'finalizat'
          or new.total_price is distinct from old.total_price
          or new.discount is distinct from old.discount) then
    if public.fin_day_is_closed(
      old.salon_id,
      (old.starts_at at time zone 'Europe/Bucharest')::date
    ) then
      raise exception 'Ziua a fost închisă. Redeschiderea se face doar de proprietar.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists fin_appointments_guard on public.appointments;
create trigger fin_appointments_guard
  before update on public.appointments
  for each row execute function public.fin_guard_appointments();

-- ------------------------------------------------------------
-- Recurring expenses: instances carry parent_id; the unique index makes
-- generation idempotent. Templates keep frequency lunar/saptamanal and have
-- parent_id null.
-- ------------------------------------------------------------
alter table public.expenses
  add column if not exists parent_id uuid references public.expenses (id) on delete cascade;

create unique index if not exists uniq_expense_instance
  on public.expenses (parent_id, spent_on)
  where parent_id is not null;

create or replace function public.generate_recurring_expenses(p_salon uuid)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_template public.expenses;
  v_due date;
  v_step interval;
  v_count int := 0;
  v_generated int;
begin
  if not public.has_salon_role(p_salon, array['owner', 'manager']::public.member_role[]) then
    raise exception 'Nu ai permisiunea să generezi cheltuieli recurente.';
  end if;

  for v_template in
    select * from public.expenses
    where salon_id = p_salon and parent_id is null
      and frequency in ('lunar', 'saptamanal')
  loop
    v_step := case v_template.frequency when 'lunar' then '1 month'::interval else '7 days'::interval end;
    v_generated := 0;
    v_due := (select max(spent_on) from public.expenses
              where parent_id = v_template.id) ;
    if v_due is null then
      -- First generation starts one period after the template's own date.
      v_due := v_template.spent_on + v_step;
    else
      v_due := v_due + v_step;
    end if;

    -- Catch up on every missed period, capped so a stale template cannot
    -- generate hundreds of rows in one call.
    while v_due <= current_date and v_generated < 24 loop
      insert into public.expenses
        (salon_id, spent_on, category, description, amount, frequency,
         parent_id, notes, created_by)
      values
        (p_salon, v_due, v_template.category, v_template.description,
         v_template.amount, 'unica', v_template.id, v_template.notes, v_template.created_by)
      on conflict (parent_id, spent_on) do nothing;
      v_count := v_count + 1;
      v_generated := v_generated + 1;
      v_due := v_due + v_step;
    end loop;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.generate_recurring_expenses(uuid) from public, anon;

-- ------------------------------------------------------------
-- fin_report — one RPC, all report sections for a date range.
-- Owner/manager only (checked inside; transactions RLS is o/m anyway).
-- Revenue counts only status = 'incasat'; refunds excluded.
-- ------------------------------------------------------------
create or replace function public.fin_report(p_salon uuid, p_from date, p_to date)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result json;
begin
  if not public.has_salon_role(p_salon, array['owner', 'manager']::public.member_role[]) then
    raise exception 'Nu ai permisiunea să vezi rapoartele financiare.';
  end if;

  with tx as (
    select t.*,
      (t.paid_at at time zone 'Europe/Bucharest')::date as day
    from public.transactions t
    where t.salon_id = p_salon
      and t.status = 'incasat'
      and (t.paid_at at time zone 'Europe/Bucharest')::date between p_from and p_to
  )
  select json_build_object(
    'byDay', (
      select coalesce(json_agg(x order by x.day), '[]'::json) from (
        select day,
          sum(amount) as revenue,
          sum(tip) as tips,
          count(*) as count
        from tx group by day
      ) x
    ),
    'byStaff', (
      select coalesce(json_agg(x order by revenue desc), '[]'::json) from (
        select t.staff_id,
          coalesce(s.first_name || ' ' || s.last_name, '—') as staff_name,
          sum(t.amount) as revenue,
          sum(t.tip) as tips,
          count(*) as count
        from tx t left join public.staff s on s.id = t.staff_id
        group by t.staff_id, s.first_name, s.last_name
      ) x
    ),
    'byService', (
      select coalesce(json_agg(x order by revenue desc), '[]'::json) from (
        select a_s.name_snapshot as service_name,
          sum(a_s.price) as revenue,
          count(*) as count
        from tx t
        join public.appointments a on a.id = t.appointment_id
        join public.appointment_services a_s on a_s.appointment_id = a.id
        group by a_s.name_snapshot
      ) x
    ),
    'paymentMix', (
      select coalesce(json_agg(x order by revenue desc), '[]'::json) from (
        select payment_method, sum(amount) as revenue, count(*) as count
        from tx group by payment_method
      ) x
    ),
    'avgTicket', (
      select case when count(*) > 0 then round(sum(amount) / count(*), 2) else 0 end
      from tx
    ),
    'refunds', (
      select coalesce(json_agg(x order by x.day), '[]'::json) from (
        select (r.paid_at at time zone 'Europe/Bucharest')::date as day,
          sum(r.amount) as amount, count(*) as count
        from public.transactions r
        where r.salon_id = p_salon and r.status = 'rambursata'
          and (r.paid_at at time zone 'Europe/Bucharest')::date between p_from and p_to
        group by 1
      ) x
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke execute on function public.fin_report(uuid, date, date) from public, anon;
