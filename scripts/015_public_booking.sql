-- ============================================================
-- ASESOR · 015 — Public booking creation (P9 part 1)
-- create_public_booking_rpc: the ONLY path for creating an online booking.
-- SECURITY DEFINER, callable ONLY by service_role (the server action).
-- Order of checks inside the RPC: rate limits → services/staff validation →
-- slot re-check → client find-or-create → insert (exclusion constraint as
-- the final guard). The client lookup never leaks whether a phone already
-- exists: the response contains only the appointment summary.
-- Run after 002/003/005. Idempotent.
-- ============================================================

create or replace function public.create_public_booking_rpc(
  p_slug text,
  p_service_ids uuid[],
  p_staff_id uuid,
  p_day date,
  p_time text,               -- 'HH:MM' Europe/Bucharest local time
  p_first_name text,
  p_last_name text,
  p_phone text,              -- E.164 (+40…), validated in the app layer
  p_email text,
  p_notes text,
  p_marketing_consent boolean,
  p_ip_hash text,            -- sha256 hex of the caller IP (no raw IP stored)
  p_manage_token text        -- plaintext generated in the app; only sha256 stored
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_salon_id uuid;
  v_settings jsonb;
  v_status public.appointment_status;
  v_services jsonb := '[]'::jsonb;
  v_service_count int;
  v_total_price numeric(10,2) := 0;
  v_total_duration int := 0;
  v_svc record;
  v_sort int := 0;
  v_starts timestamptz;
  v_ends timestamptz;
  v_staff_first text;
  v_client_id uuid;
  v_code text;
  v_attempt int := 0;
  v_ip_count int;
  v_phone_count int;
  v_appt_id uuid;
begin
  -- ── 0. Salon ──────────────────────────────────────────────────────────────
  select s.id, coalesce(s.booking_settings, '{}'::jsonb)
    into v_salon_id, v_settings
  from public.salons s
  where s.slug = p_slug
    and s.deleted_at is null
    and coalesce((s.booking_settings ->> 'online_enabled')::boolean, true)
  limit 1;

  if v_salon_id is null then
    return json_build_object('ok', false, 'code', 'not_found');
  end if;

  -- ── 1. Rate limits (before anything else, so probing is expensive) ───────
  -- Max 5 bookings per IP per hour, 3 per phone per day (Europe/Bucharest).
  -- The upsert increments first and the count is checked after, so concurrent
  -- requests cannot slip past the limit.
  insert into public.rate_limits (key, window_start, count)
  values (
    'bkg_ip_' || coalesce(p_ip_hash, 'unknown'),
    date_trunc('hour', now()),
    1
  )
  on conflict (key, window_start) do update
    set count = public.rate_limits.count + 1,
        updated_at = now()
  returning public.rate_limits.count into v_ip_count;

  if v_ip_count > 5 then
    return json_build_object(
      'ok', false, 'code', 'rate_limited',
      'message', 'Ai făcut prea multe programări într-un timp scurt. Sună la salon pentru ajutor.'
    );
  end if;

  insert into public.rate_limits (key, window_start, count)
  values (
    'bkg_ph_' || encode(sha256(convert_to(p_phone, 'UTF8')), 'hex'),
    date_trunc('day', now() at time zone 'Europe/Bucharest') at time zone 'Europe/Bucharest',
    1
  )
  on conflict (key, window_start) do update
    set count = public.rate_limits.count + 1,
        updated_at = now()
  returning public.rate_limits.count into v_phone_count;

  if v_phone_count > 3 then
    return json_build_object(
      'ok', false, 'code', 'rate_limited',
      'message', 'Ai făcut prea multe programări într-un timp scurt. Sună la salon pentru ajutor.'
    );
  end if;

  -- ── 2. Services: must belong to this salon, be active and bookable.
  -- Prices/durations are re-read from the DB — never trusted from the client.
  select count(*), coalesce(sum(price), 0), coalesce(sum(duration_min + buffer_min), 0)
    into v_service_count, v_total_price, v_total_duration
  from public.services
  where salon_id = v_salon_id
    and id = any(p_service_ids)
    and active
    and online_bookable;

  if v_service_count <> coalesce(array_length(p_service_ids, 1), 0)
     or v_total_duration <= 0 then
    return json_build_object('ok', false, 'code', 'invalid');
  end if;

  for v_svc in
    select id, name, price, duration_min
    from public.services
    where salon_id = v_salon_id
      and id = any(p_service_ids)
      and active
      and online_bookable
    order by sort_order, name
  loop
    v_services := v_services || jsonb_build_object(
      'service_id', v_svc.id,
      'name', v_svc.name,
      'price', v_svc.price,
      'duration_min', v_svc.duration_min,
      'sort_order', v_sort
    );
    v_sort := v_sort + 1;
  end loop;

  -- ── 3. Staff: belongs to this salon, active, offers ALL selected services.
  if p_staff_id is null then
    return json_build_object('ok', false, 'code', 'invalid');
  end if;

  select st.first_name into v_staff_first
  from public.staff st
  where st.id = p_staff_id
    and st.salon_id = v_salon_id
    and st.status = 'activ'
    and st.deleted_at is null
    and not exists (
      select 1 from unnest(p_service_ids) as sid
      where not exists (
        select 1 from public.staff_services ss
        where ss.staff_id = st.id and ss.service_id = sid
      )
    );

  if v_staff_first is null then
    return json_build_object('ok', false, 'code', 'invalid');
  end if;

  -- ── 4. Slot re-check (the client could have picked it minutes ago).
  -- DST-safe: let Postgres resolve the Bucharest offset for that date.
  v_starts := (p_day + p_time::time) at time zone 'Europe/Bucharest';
  v_ends := v_starts + (v_total_duration * interval '1 minute');

  if v_starts < now() then
    return json_build_object('ok', false, 'code', 'slot_taken');
  end if;

  if exists (
    select 1 from public.appointments a
    where a.staff_id = p_staff_id
      and a.status not in ('anulat', 'no_show')
      and a.starts_at < v_ends
      and a.ends_at > v_starts
  ) then
    return json_build_object(
      'ok', false, 'code', 'slot_taken',
      'message', 'Ora aleasă tocmai a fost rezervată. Alege altă oră.'
    );
  end if;

  -- ── 5. Client find-or-create. The result NEVER reveals whether the phone
  -- was already known: both paths return the same appointment summary.
  select c.id into v_client_id
  from public.clients c
  where c.salon_id = v_salon_id
    and c.phone = p_phone
    and c.deleted_at is null
  limit 1;

  if v_client_id is null then
    insert into public.clients (salon_id, first_name, last_name, phone, email, source, marketing_consent, marketing_consent_at)
    values (
      v_salon_id, p_first_name, p_last_name, p_phone, nullif(p_email, ''), 'online',
      coalesce(p_marketing_consent, false),
      case when coalesce(p_marketing_consent, false) then now() end
    )
    returning id into v_client_id;
  elsif coalesce(p_marketing_consent, false) then
    update public.clients
    set marketing_consent = true, marketing_consent_at = now()
    where id = v_client_id and marketing_consent = false;
  end if;

  -- ── 6. Status: confirmat, or in_asteptare when the salon requires manual
  -- confirmation of online bookings.
  v_status := case
    when coalesce((v_settings ->> 'require_confirmation')::boolean, false)
    then 'in_asteptare'::public.appointment_status
    else 'confirmat'::public.appointment_status
  end;

  -- ── 7. Confirmation code: 6 chars, alphabet without 0/O/1/I, unique.
  loop
    v_attempt := v_attempt + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.appointments a
      where a.salon_id = v_salon_id and a.confirmation_code = v_code
    ) or v_attempt > 20;
  end loop;

  -- ── 8. Insert. The exclusion constraint is the final double-booking guard:
  -- a concurrent booking between the re-check and here fails with 23P01 and
  -- is reported as slot_taken.
  begin
    insert into public.appointments (
      salon_id, client_id, staff_id, starts_at, ends_at, status, source,
      notes, total_price, confirmation_code, manage_token_hash
    ) values (
      v_salon_id, v_client_id, p_staff_id, v_starts, v_ends, v_status, 'online',
      nullif(p_notes, ''), v_total_price, v_code,
      encode(sha256(convert_to(p_manage_token, 'UTF8')), 'hex')
    )
    returning id into v_appt_id;

    insert into public.appointment_services (appointment_id, salon_id, service_id, name_snapshot, price, duration_min, sort_order)
    select v_appt_id, v_salon_id,
           (s->>'service_id')::uuid,
           s->>'name',
           (s->>'price')::numeric,
           (s->>'duration_min')::int,
           (s->>'sort_order')::int
    from jsonb_array_elements(v_services) as s;

    if coalesce(p_marketing_consent, false) then
      insert into public.consents (salon_id, client_id, kind, granted, text_version, source)
      values (v_salon_id, v_client_id, 'marketing_email', true, 'booking-form-v1', 'booking_online');
    end if;
  exception
    when unique_violation or exclusion_violation then
      return json_build_object(
        'ok', false, 'code', 'slot_taken',
        'message', 'Ora aleasă tocmai a fost rezervată. Alege altă oră.'
      );
  end;

  -- ── 9. Summary (safe fields only — no client data) ────────────────────────
  return json_build_object(
    'ok', true,
    'appointment_id', v_appt_id,
    'code', v_code,
    'status', v_status,
    'starts_at', v_starts,
    'ends_at', v_ends,
    'total_price', v_total_price,
    'duration_min', v_total_duration,
    'services', v_services,
    'staff_first_name', v_staff_first
  );
end;
$$;

revoke execute on function public.create_public_booking_rpc(text, uuid[], uuid, date, text, text, text, text, text, text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.create_public_booking_rpc(text, uuid[], uuid, date, text, text, text, text, text, text, boolean, text, text) to service_role;
