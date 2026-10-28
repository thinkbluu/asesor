-- ============================================================
-- ASESOR · tests/rls_isolation.sql
-- Proves tenant isolation: user A cannot touch salon B; anon cannot read
-- clients but CAN call the public booking RPCs.
--
-- RUN ORDER: 001 → 002 → 003 → 004 → 005 → 006 → 007, then this file.
-- (007 must have run: the anon checks call public_services('salonul-ana').)
--
-- Runnable in the Supabase SQL editor (runs as postgres/superuser).
-- Creates two fake auth users + two test salons, asserts isolation with
-- RAISE exceptions, then cleans up after itself.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Setup: two fake users, two salons, memberships, sample rows
-- ------------------------------------------------------------

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'test-user-a@example.invalid', '', now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test User A"}',
   '', '', '', ''),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'test-user-b@example.invalid', '', now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test User B"}',
   '', '', '', '')
on conflict (id) do nothing;

insert into public.salons (id, name, slug, city) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Test Salon A', 'test-salon-a', 'Timișoara'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Salon B', 'test-salon-b', 'Cluj')
on conflict (id) do nothing;

insert into public.salon_members (salon_id, user_id, role) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'owner')
on conflict (salon_id, user_id) do nothing;

-- Sample rows in BOTH salons (inserted as postgres — RLS does not apply)
insert into public.clients (id, salon_id, first_name, last_name, phone) values
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Client', 'A', '+40700000001'),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'Client', 'B', '+40700000002');

insert into public.staff (id, salon_id, first_name, last_name) values
  ('dddddddd-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Staff', 'A'),
  ('dddddddd-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'Staff', 'B');

insert into public.appointments (id, salon_id, client_id, staff_id, starts_at, ends_at, status) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   (current_date + time '10:00') at time zone 'Europe/Bucharest',
   (current_date + time '11:00') at time zone 'Europe/Bucharest',
   'confirmat'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002',
   'cccccccc-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000002',
   (current_date + time '12:00') at time zone 'Europe/Bucharest',
   (current_date + time '13:00') at time zone 'Europe/Bucharest',
   'confirmat');

insert into public.transactions (id, salon_id, appointment_id, client_id, staff_id, amount, status, paid_at) values
  ('ffffffff-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'eeeeeeee-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001',
   'dddddddd-0000-4000-8000-000000000001', 120.00, 'incasat', now()),
  ('ffffffff-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002',
   'eeeeeeee-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002',
   'dddddddd-0000-4000-8000-000000000002', 90.00, 'incasat', now());

-- ------------------------------------------------------------
-- Act as user A (owner of salon A)
-- ------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated", "email": "test-user-a@example.invalid"}',
  true);
set local role authenticated;

-- Sanity: user A CAN see their own salon's rows
do $$
declare v_cnt int;
begin
  select count(*) into v_cnt from public.clients where salon_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  if v_cnt <> 1 then
    raise exception 'FAIL: user A should see exactly 1 client of salon A, saw %', v_cnt;
  end if;
end $$;

-- SELECT isolation: user A sees 0 rows of salon B
do $$
declare v_cnt int;
begin
  select count(*) into v_cnt from public.clients    where salon_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  if v_cnt <> 0 then raise exception 'FAIL: user A selected % clients of salon B', v_cnt; end if;

  select count(*) into v_cnt from public.appointments where salon_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  if v_cnt <> 0 then raise exception 'FAIL: user A selected % appointments of salon B', v_cnt; end if;

  select count(*) into v_cnt from public.transactions where salon_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  if v_cnt <> 0 then raise exception 'FAIL: user A selected % transactions of salon B', v_cnt; end if;
end $$;

-- INSERT isolation: user A cannot insert into salon B
do $$
begin
  begin
    insert into public.clients (salon_id, first_name, last_name, phone)
    values ('bbbbbbbb-0000-4000-8000-000000000002', 'Hacker', 'X', '+40700000009');
    raise exception 'FAIL: user A inserted a client into salon B';
  exception
    when insufficient_privilege then null; -- expected: RLS with-check violation
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
      null; -- any other RLS rejection is acceptable
  end;
end $$;

do $$
begin
  begin
    insert into public.appointments (salon_id, client_id, staff_id, starts_at, ends_at, status)
    values ('bbbbbbbb-0000-4000-8000-000000000002',
            'cccccccc-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000002',
            (current_date + time '15:00') at time zone 'Europe/Bucharest',
            (current_date + time '16:00') at time zone 'Europe/Bucharest',
            'confirmat');
    raise exception 'FAIL: user A inserted an appointment into salon B';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
      null;
  end;
end $$;

-- UPDATE isolation: RLS hides the row → 0 rows updated (no error)
do $$
declare v_cnt int;
begin
  update public.clients set notes = 'hacked'
  where salon_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  get diagnostics v_cnt = row_count;
  if v_cnt <> 0 then raise exception 'FAIL: user A updated % clients of salon B', v_cnt; end if;

  update public.appointments set status = 'anulat'
  where salon_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  get diagnostics v_cnt = row_count;
  if v_cnt <> 0 then raise exception 'FAIL: user A updated % appointments of salon B', v_cnt; end if;

  update public.transactions set amount = 0
  where salon_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  get diagnostics v_cnt = row_count;
  if v_cnt <> 0 then raise exception 'FAIL: user A updated % transactions of salon B', v_cnt; end if;
end $$;

-- DELETE isolation: 0 rows deleted
do $$
declare v_cnt int;
begin
  delete from public.clients where salon_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  get diagnostics v_cnt = row_count;
  if v_cnt <> 0 then raise exception 'FAIL: user A deleted % clients of salon B', v_cnt; end if;
end $$;

-- ------------------------------------------------------------
-- Act as anon
-- ------------------------------------------------------------

select set_config('request.jwt.claims', '', true);
set local role anon;

-- anon cannot read tenant data (RLS enabled, no anon policies)
do $$
declare v_cnt int;
begin
  select count(*) into v_cnt from public.clients;
  if v_cnt <> 0 then raise exception 'FAIL: anon selected % client rows', v_cnt; end if;

  select count(*) into v_cnt from public.appointments;
  if v_cnt <> 0 then raise exception 'FAIL: anon selected % appointment rows', v_cnt; end if;
end $$;

-- anon CAN call the public booking RPCs (requires 007 to have run)
do $$
declare v_cnt int; v_profile json;
begin
  select count(*) into v_cnt from public.public_services('salonul-ana');
  if v_cnt = 0 then raise exception 'FAIL: public_services(''salonul-ana'') returned 0 rows (did 007 run?)'; end if;

  v_profile := public.public_salon_profile('salonul-ana');
  if v_profile is null or v_profile ->> 'name' is distinct from 'Salonul Ana' then
    raise exception 'FAIL: public_salon_profile(''salonul-ana'') returned unexpected value: %', v_profile;
  end if;
end $$;

-- ------------------------------------------------------------
-- Cleanup (back to postgres role)
-- ------------------------------------------------------------

reset role;

delete from public.salons
where id in ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002');

delete from auth.users
where id in ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002');

commit;
