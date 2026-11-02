-- 009 — Programări: RPC-uri atomice (create/update cu servicii) + Realtime
-- Rulează ca utilizator autentificat (SECURITY INVOKER) — RLS pe appointments
-- și appointment_services se aplică integral.
--
-- Coduri de eroare returnate în JSON (nu excepții, ca PostgREST să le poată
-- mapa curat în UI):
--   overlap           — 23P01 exclusion (appointments_no_double_booking) — NU se poate suprascrie
--   outside_schedule  — în afara programului staff-ului (suprascris cu p_override)
--   time_off          — concediu aprobat (suprascris cu p_override)
--   blocked_slot      — interval blocat (suprascris cu p_override)
--   invalid_staff / invalid_client / invalid_appointment — date inconsistente

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime: publică appointments pentru postgres_changes
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificare slot: program / concediu / blocat. NULL = ok, altfel codul motivului.
-- Ziua și ora se evaluează în Europe/Bucharest.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.check_appointment_slot(
  p_salon uuid,
  p_staff uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns text
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_dow int;
  v_start_time time;
  v_end_time time;
begin
  v_dow := extract(dow from (p_starts_at at time zone 'Europe/Bucharest'))::int;
  v_start_time := (p_starts_at at time zone 'Europe/Bucharest')::time;
  v_end_time := (p_ends_at at time zone 'Europe/Bucharest')::time;

  -- Program de lucru (staff_schedules: weekday 0 = duminică, ca extract(dow))
  if not exists (
    select 1
    from public.staff_schedules sc
    where sc.staff_id = p_staff
      and sc.weekday = v_dow
      and sc.is_working
      and sc.start_time is not null
      and sc.end_time is not null
      and v_start_time >= sc.start_time
      and v_end_time <= sc.end_time
  ) then
    return 'outside_schedule';
  end if;

  -- Concediu aprobat
  if exists (
    select 1
    from public.staff_time_off t
    where t.staff_id = p_staff
      and t.status = 'approved'
      and t.starts_at < p_ends_at
      and t.ends_at > p_starts_at
  ) then
    return 'time_off';
  end if;

  -- Interval blocat
  if exists (
    select 1
    from public.blocked_slots b
    where b.staff_id = p_staff
      and b.starts_at < p_ends_at
      and b.ends_at > p_starts_at
  ) then
    return 'blocked_slot';
  end if;

  return null;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Creare programare (+ servicii + recurențe până la 12 săptămâni)
-- p_services: [{service_id, name_snapshot, price, duration_min, sort_order}]
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_appointment_rpc(
  p_salon_id uuid,
  p_client_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_status public.appointment_status,
  p_notes text,
  p_total_price numeric,
  p_discount numeric,
  p_discount_type text,
  p_services jsonb,
  p_recurrence text default 'niciodata',
  p_override boolean default false
) returns json
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_occ_id uuid;
  v_staff_name text;
  v_rec text := coalesce(p_recurrence, 'niciodata');
  v_step interval;
  v_occ_start timestamptz;
  v_occ_end timestamptz;
  v_skipped text[] := '{}';
  v_reason text;
begin
  select st.first_name || ' ' || st.last_name into v_staff_name
  from public.staff st
  where st.id = p_staff_id and st.salon_id = p_salon_id and st.deleted_at is null;
  if v_staff_name is null then
    return json_build_object('ok', false, 'code', 'invalid_staff');
  end if;

  if not exists (
    select 1 from public.clients c
    where c.id = p_client_id and c.salon_id = p_salon_id and c.deleted_at is null
  ) then
    return json_build_object('ok', false, 'code', 'invalid_client');
  end if;

  v_reason := public.check_appointment_slot(p_salon_id, p_staff_id, p_starts_at, p_ends_at);
  if v_reason is not null and not coalesce(p_override, false) then
    return json_build_object('ok', false, 'code', v_reason, 'staff_name', v_staff_name);
  end if;

  insert into public.appointments
    (salon_id, client_id, staff_id, starts_at, ends_at, status, notes,
     total_price, discount, discount_type, recurrence_rule, created_by)
  values
    (p_salon_id, p_client_id, p_staff_id, p_starts_at, p_ends_at, p_status, p_notes,
     p_total_price, p_discount, p_discount_type, nullif(v_rec, 'niciodata'), auth.uid())
  returning id into v_id;

  insert into public.appointment_services
    (appointment_id, salon_id, service_id, name_snapshot, price, duration_min, sort_order)
  select
    v_id, p_salon_id,
    nullif(s->>'service_id', '')::uuid,
    coalesce(s->>'name_snapshot', 'Serviciu'),
    coalesce((s->>'price')::numeric, 0),
    coalesce((s->>'duration_min')::int, 0),
    coalesce((s->>'sort_order')::int, ord)
  from jsonb_array_elements(p_services) with ordinality as t(s, ord);

  -- Recurențe: până la 12 săptămâni în fața primei apariții. Cele care intră
  -- în conflict (program, concediu, blocat sau suprapunere) sunt omise și
  -- raportate, nu anulează operația.
  if v_rec <> 'niciodata' then
    v_step := case v_rec
      when 'saptamanal' then interval '7 days'
      when 'bi_saptamanal' then interval '14 days'
      when 'lunar' then interval '1 month'
      else interval '0 days'
    end;
    v_occ_start := p_starts_at;
    v_occ_end := p_ends_at;
    loop
      v_occ_start := v_occ_start + v_step;
      v_occ_end := v_occ_end + v_step;
      exit when v_occ_start > now() + interval '12 weeks';
      v_reason := public.check_appointment_slot(p_salon_id, p_staff_id, v_occ_start, v_occ_end);
      if v_reason is not null then
        v_skipped := v_skipped || to_char(v_occ_start at time zone 'Europe/Bucharest', 'DD.MM.YYYY HH24:MI');
        continue;
      end if;
      begin
        insert into public.appointments
          (salon_id, client_id, staff_id, starts_at, ends_at, status, notes,
           total_price, discount, discount_type, recurrence_rule, recurrence_parent_id, created_by)
        values
          (p_salon_id, p_client_id, p_staff_id, v_occ_start, v_occ_end, p_status, p_notes,
           p_total_price, p_discount, p_discount_type, nullif(v_rec, 'niciodata'), v_id, auth.uid())
        returning id into v_occ_id;

        insert into public.appointment_services
          (appointment_id, salon_id, service_id, name_snapshot, price, duration_min, sort_order)
        select
          v_occ_id, p_salon_id,
          nullif(s->>'service_id', '')::uuid,
          coalesce(s->>'name_snapshot', 'Serviciu'),
          coalesce((s->>'price')::numeric, 0),
          coalesce((s->>'duration_min')::int, 0),
          coalesce((s->>'sort_order')::int, ord)
        from jsonb_array_elements(p_services) with ordinality as t(s, ord);
      exception when exclusion_violation or unique_violation then
        v_skipped := v_skipped || to_char(v_occ_start at time zone 'Europe/Bucharest', 'DD.MM.YYYY HH24:MI');
      end;
    end loop;
  end if;

  return json_build_object('ok', true, 'appointment_id', v_id, 'skipped', to_jsonb(v_skipped));
exception
  when exclusion_violation or unique_violation then
    return json_build_object('ok', false, 'code', 'overlap', 'staff_name', v_staff_name);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Actualizare programare (+ rescrie serviciile, atomic)
-- p_scope: 'single' | 'rest_of_series' — pentru recurențe, „Aceasta și următoarele"
-- mută toate aparițiile viitoare cu aceeași deltă.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.update_appointment_rpc(
  p_appointment_id uuid,
  p_salon_id uuid,
  p_client_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_status public.appointment_status,
  p_notes text,
  p_total_price numeric,
  p_discount numeric,
  p_discount_type text,
  p_services jsonb,
  p_override boolean default false,
  p_scope text default 'single'
) returns json
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_row public.appointments;
  v_root uuid;
  v_delta interval;
  v_occ record;
  v_staff_name text;
  v_reason text;
begin
  select * into v_row
  from public.appointments a
  where a.id = p_appointment_id and a.salon_id = p_salon_id;
  if not found then
    return json_build_object('ok', false, 'code', 'invalid_appointment');
  end if;

  select st.first_name || ' ' || st.last_name into v_staff_name
  from public.staff st
  where st.id = p_staff_id and st.salon_id = p_salon_id and st.deleted_at is null;
  if v_staff_name is null then
    return json_build_object('ok', false, 'code', 'invalid_staff');
  end if;

  v_root := coalesce(v_row.recurrence_parent_id, v_row.id);

  v_reason := public.check_appointment_slot(p_salon_id, p_staff_id, p_starts_at, p_ends_at);
  if v_reason is not null and not coalesce(p_override, false) then
    return json_build_object('ok', false, 'code', v_reason, 'staff_name', v_staff_name);
  end if;

  update public.appointments
  set client_id = p_client_id,
      staff_id = p_staff_id,
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      status = p_status,
      notes = p_notes,
      total_price = p_total_price,
      discount = p_discount,
      discount_type = p_discount_type,
      updated_at = now()
  where id = p_appointment_id;

  delete from public.appointment_services where appointment_id = p_appointment_id;
  insert into public.appointment_services
    (appointment_id, salon_id, service_id, name_snapshot, price, duration_min, sort_order)
  select
    p_appointment_id, p_salon_id,
    nullif(s->>'service_id', '')::uuid,
    coalesce(s->>'name_snapshot', 'Serviciu'),
    coalesce((s->>'price')::numeric, 0),
    coalesce((s->>'duration_min')::int, 0),
    coalesce((s->>'sort_order')::int, ord)
  from jsonb_array_elements(p_services) with ordinality as t(s, ord);

  if coalesce(p_scope, 'single') = 'rest_of_series' then
    v_delta := p_starts_at - v_row.starts_at;
    for v_occ in
      select id, starts_at, ends_at
      from public.appointments
      where recurrence_parent_id = v_root
        and starts_at > v_row.starts_at
        and id <> p_appointment_id
    loop
      begin
        update public.appointments
        set starts_at = v_occ.starts_at + v_delta,
            ends_at = v_occ.ends_at + v_delta,
            updated_at = now()
        where id = v_occ.id;
      exception when exclusion_violation or unique_violation then
        -- apariția viitoare intră în conflict: rămâne pe loc, nu blocăm seria
        null;
      end;
    end loop;
  end if;

  return json_build_object('ok', true, 'appointment_id', p_appointment_id);
exception
  when exclusion_violation or unique_violation then
    return json_build_object('ok', false, 'code', 'overlap', 'staff_name', v_staff_name);
end;
$$;

revoke execute on function public.check_appointment_slot(uuid, uuid, timestamptz, timestamptz) from public, anon;
revoke execute on function public.create_appointment_rpc(uuid, uuid, uuid, timestamptz, timestamptz, public.appointment_status, text, numeric, numeric, text, jsonb, text, boolean) from public, anon;
revoke execute on function public.update_appointment_rpc(uuid, uuid, uuid, uuid, timestamptz, timestamptz, public.appointment_status, text, numeric, numeric, text, jsonb, boolean, text) from public, anon;
grant execute on function public.check_appointment_slot(uuid, uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.create_appointment_rpc(uuid, uuid, uuid, timestamptz, timestamptz, public.appointment_status, text, numeric, numeric, text, jsonb, text, boolean) to authenticated;
grant execute on function public.update_appointment_rpc(uuid, uuid, uuid, uuid, timestamptz, timestamptz, public.appointment_status, text, numeric, numeric, text, jsonb, boolean, text) to authenticated;
