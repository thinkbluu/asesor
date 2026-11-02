-- ============================================================
-- ASESOR · 003 — Functions & Triggers
-- Run after 002. Idempotent (create or replace + drop-if-exists triggers).
-- SECURITY DEFINER functions pin search_path = public, pg_temp.
-- ============================================================

-- ------------------------------------------------------------
-- updated_at trigger (applied to every public table at the end of this file)
-- ------------------------------------------------------------

create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Membership helpers (SECURITY DEFINER so RLS policies can call them
-- without recursing into salon_members policies)
-- ------------------------------------------------------------

create or replace function public.is_salon_member(p_salon uuid) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.salon_members m
    where m.salon_id = p_salon
      and m.user_id = auth.uid()
  )
$$;

create or replace function public.salon_role(p_salon uuid) returns public.member_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role
  from public.salon_members m
  where m.salon_id = p_salon
    and m.user_id = auth.uid()
  limit 1
$$;

create or replace function public.has_salon_role(p_salon uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.salon_members m
    where m.salon_id = p_salon
      and m.user_id = auth.uid()
      and m.role = any(p_roles)
  )
$$;

create or replace function public.current_staff_id(p_salon uuid) returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.staff_id
  from public.salon_members m
  where m.salon_id = p_salon
    and m.user_id = auth.uid()
    and m.staff_id is not null
  limit 1
$$;

revoke execute on function public.is_salon_member(uuid) from public, anon;
revoke execute on function public.salon_role(uuid) from public, anon;
revoke execute on function public.has_salon_role(uuid, public.member_role[]) from public, anon;
revoke execute on function public.current_staff_id(uuid) from public, anon;
grant execute on function public.is_salon_member(uuid) to authenticated;
grant execute on function public.salon_role(uuid) to authenticated;
grant execute on function public.has_salon_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.current_staff_id(uuid) to authenticated;

-- ------------------------------------------------------------
-- Salon creation (called from onboarding, as the signed-in user)
-- ------------------------------------------------------------

create or replace function public.create_salon_for_current_user(p_name text, p_city text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_base text;
  v_candidate text;
  v_i int := 0;
  v_salon_id uuid;
begin
  if v_user is null then
    raise exception 'Autentificare necesară.';
  end if;
  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Numele salonului este prea scurt.';
  end if;

  -- slug: lowercase, diacritics stripped (ă→a â→a î→i ș→s ț→t), [a-z0-9-] only
  v_base := lower(trim(p_name));
  v_base := translate(v_base, 'ăâîșțĂÂÎȘȚ', 'aaistAAIST');
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := regexp_replace(v_base, '-+', '-', 'g');
  v_base := trim(both '-' from v_base);
  v_base := left(coalesce(nullif(v_base, ''), 'salon'), 48);

  v_candidate := v_base;
  while exists (select 1 from public.salons s where s.slug = v_candidate) loop
    v_i := v_i + 1;
    v_candidate := left(v_base, 48 - length('-' || v_i::text)) || '-' || v_i::text;
  end loop;

  insert into public.salons (name, slug, city, trial_ends_at)
  values (trim(p_name), v_candidate, nullif(trim(coalesce(p_city, '')), ''), now() + interval '14 days')
  returning id into v_salon_id;

  insert into public.salon_members (salon_id, user_id, role)
  values (v_salon_id, v_user, 'owner');

  -- Program implicit: luni–sâmbătă 09:00–19:00, duminică închis
  insert into public.salon_hours (salon_id, weekday, opens, closes, is_open)
  select v_salon_id, wd, time '09:00', time '19:00', wd < 6
  from generate_series(0, 6) as wd
  on conflict (salon_id, weekday) do nothing;

  return v_salon_id;
end;
$$;

revoke execute on function public.create_salon_for_current_user(text, text) from public, anon;
grant execute on function public.create_salon_for_current_user(text, text) to authenticated;

-- ------------------------------------------------------------
-- Invite acceptance
-- ------------------------------------------------------------

create or replace function public.accept_invite(p_token text) returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.salon_invites%rowtype;
  v_user_email citext;
begin
  select * into v_invite
  from public.salon_invites
  where token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
  for update;

  if not found then
    raise exception 'Invitație invalidă.';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'Invitația a fost deja acceptată.';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Invitația a expirat.';
  end if;

  select email into v_user_email from auth.users where id = auth.uid();
  if v_user_email is null or v_user_email <> v_invite.email then
    raise exception 'Emailul contului nu corespunde invitației.';
  end if;

  insert into public.salon_members (salon_id, user_id, role, staff_id)
  values (v_invite.salon_id, auth.uid(), v_invite.role, v_invite.staff_id)
  on conflict (salon_id, user_id) do update
    set role = excluded.role,
        staff_id = excluded.staff_id;

  update public.salon_invites
  set accepted_at = now()
  where id = v_invite.id;

  return v_invite.salon_id;
end;
$$;

revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;

-- ------------------------------------------------------------
-- Stock: movements update products.stock
-- ------------------------------------------------------------

create or replace function public.apply_stock_movement() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.products
  set stock = stock + new.quantity
  where id = new.product_id;
  return new;
end;
$$;

drop trigger if exists stock_movements_apply_stock on public.stock_movements;
create trigger stock_movements_apply_stock
  after insert on public.stock_movements
  for each row
  execute function public.apply_stock_movement();

-- ------------------------------------------------------------
-- Appointments: on status → 'finalizat'
--   * consum stock per service_products (negative movements, idempotent)
--   * award loyalty points per salons.loyalty_config (ronPerPoint, enabled)
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

  return new;
end;
$$;

drop trigger if exists appointments_finalized on public.appointments;
create trigger appointments_finalized
  after update on public.appointments
  for each row
  when (new.status = 'finalizat' and old.status is distinct from 'finalizat')
  execute function public.on_appointment_finalized();

-- ------------------------------------------------------------
-- Dashboard summary (authenticated, member-only)
-- ------------------------------------------------------------

create or replace function public.dashboard_summary(p_salon uuid, p_day date)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result json;
begin
  if not public.is_salon_member(p_salon) then
    return null;
  end if;

  select json_build_object(
    'day', p_day,
    'appointments_by_status', (
      select coalesce(jsonb_object_agg(s.status, s.cnt), '{}'::jsonb)::json
      from (
        select a.status, count(*) as cnt
        from public.appointments a
        where a.salon_id = p_salon
          and (a.starts_at at time zone 'Europe/Bucharest')::date = p_day
        group by a.status
      ) s
    ),
    'revenue_today', (
      select coalesce(sum(t.amount + t.tip), 0)
      from public.transactions t
      where t.salon_id = p_salon
        and t.status = 'incasat'
        and t.paid_at is not null
        and (t.paid_at at time zone 'Europe/Bucharest')::date = p_day
    ),
    'next_upcoming', (
      select coalesce(json_agg(x), '[]'::json)
      from (
        select a.id, a.starts_at, a.status,
               c.first_name || ' ' || c.last_name as client_name,
               st.first_name || ' ' || st.last_name as staff_name
        from public.appointments a
        join public.clients c on c.id = a.client_id
        join public.staff st on st.id = a.staff_id
        where a.salon_id = p_salon
          and a.starts_at > now()
          and a.status not in ('anulat', 'no_show')
        order by a.starts_at asc
        limit 3
      ) x
    ),
    'low_stock_count', (
      select count(*)
      from public.products p
      where p.salon_id = p_salon
        and p.active
        and p.stock <= p.min_stock
    ),
    'new_clients_this_month', (
      select count(*)
      from public.clients c
      where c.salon_id = p_salon
        and c.created_at >= date_trunc('month', p_day at time zone 'Europe/Bucharest') at time zone 'Europe/Bucharest'
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.dashboard_summary(uuid, date) from public, anon;
grant execute on function public.dashboard_summary(uuid, date) to authenticated;

-- ------------------------------------------------------------
-- auth.users → profiles
-- ------------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Maintenance placeholders (cron later) — service role only
-- ------------------------------------------------------------

-- Demo salons: appointments older than 1 day are deleted.
create or replace function public.purge_demo_bookings() returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.appointments a
  using public.salons s
  where a.salon_id = s.id
    and s.is_demo
    and a.starts_at < now() - interval '1 day';
$$;

-- Loyalty points older than loyalty_config.expirationMonths become 'expired' ledger rows.
create or replace function public.expire_loyalty_points() returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_months int;
  v_cutoff timestamptz;
begin
  for r in
    select id, loyalty_config from public.salons
    where loyalty_config ->> 'expirationMonths' is not null
      and coalesce((loyalty_config ->> 'enabled')::boolean, false)
  loop
    v_months := greatest((r.loyalty_config ->> 'expirationMonths')::int, 1);
    v_cutoff := now() - (v_months::text || ' months')::interval;

    -- Per client: older earned points not yet consumed/redeemed/expired.
    drop table if exists pg_temp.loyalty_expire;
    create temp table loyalty_expire on commit drop as
      select o.client_id,
             greatest(greatest(o.earned, 0) - coalesce(c.used, 0), 0) as to_expire
      from (
        select client_id, sum(points) as earned
        from public.loyalty_ledger
        where salon_id = r.id
          and type in ('earned', 'bonus', 'adjustment')
          and created_at < v_cutoff
        group by client_id
      ) o
      left join (
        select client_id, sum(points) as used
        from public.loyalty_ledger
        where salon_id = r.id
          and type in ('redeemed', 'expired')
        group by client_id
      ) c on c.client_id = o.client_id
      where greatest(greatest(o.earned, 0) - coalesce(c.used, 0), 0) > 0;

    insert into public.loyalty_ledger (salon_id, client_id, type, points, note)
    select r.id, x.client_id, 'expired', -x.to_expire, 'Puncte expirate automat'
    from pg_temp.loyalty_expire x;

    update public.clients cl
    set loyalty_points = greatest(cl.loyalty_points - x.to_expire, 0)
    from pg_temp.loyalty_expire x
    where cl.id = x.client_id;
  end loop;
end;
$$;

-- Retention: feedback/message_log > 12 months, rate_limits > 2 days, audit_log > 24 months.
create or replace function public.retention_cleanup() returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.feedback_requests where created_at < now() - interval '12 months';
  delete from public.message_log where created_at < now() - interval '12 months';
  delete from public.rate_limits where window_start < now() - interval '2 days';
  delete from public.audit_log where created_at < now() - interval '24 months';
$$;

-- Salons soft-deleted more than 30 days ago are hard-deleted (children cascade).
create or replace function public.purge_deleted_salons() returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.salons where deleted_at < now() - interval '30 days';
$$;

revoke execute on function public.purge_demo_bookings() from public, anon, authenticated;
revoke execute on function public.expire_loyalty_points() from public, anon, authenticated;
revoke execute on function public.retention_cleanup() from public, anon, authenticated;
revoke execute on function public.purge_deleted_salons() from public, anon, authenticated;
grant execute on function public.purge_demo_bookings() to service_role;
grant execute on function public.expire_loyalty_points() to service_role;
grant execute on function public.retention_cleanup() to service_role;
grant execute on function public.purge_deleted_salons() to service_role;

-- ------------------------------------------------------------
-- Apply set_updated_at to every public table
-- ------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;
