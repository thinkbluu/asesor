create or replace function public.public_availability(
  p_slug text,
  p_service_ids uuid[],
  p_staff_id uuid default null,
  p_day date default null
)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_salon_id uuid;
  v_settings jsonb;
  v_interval int;
  v_notice int;
  v_max_days int;
  v_total_duration int;
  v_service_count int;
  v_dow int;
  v_day date;
  v_today date;
  v_open time;
  v_close time;
  v_staff_ids uuid[];
  v_staff record;
  v_sched record;
  v_w_start time;
  v_w_end time;
  v_slot timestamptz;
  v_slot_end timestamptz;
  v_window_end timestamptz;
  v_free boolean;
  v_slots jsonb := '[]'::jsonb;
  v_taken jsonb := '[]'::jsonb;
begin
  v_today := (now() at time zone 'Europe/Bucharest')::date;
  v_day := coalesce(p_day, v_today);

  select s.id, coalesce(s.booking_settings, '{}'::jsonb) into v_salon_id, v_settings
  from public.salons s
  where s.slug = p_slug
    and s.deleted_at is null
    and coalesce((s.booking_settings ->> 'online_enabled')::boolean, true)
  limit 1;

  if v_salon_id is null then
    return '[]'::json;
  end if;

  v_interval := greatest(coalesce((v_settings ->> 'slot_interval_min')::int, 15), 5);
  v_notice := greatest(coalesce((v_settings ->> 'min_notice_min')::int, 120), 0);
  v_max_days := greatest(coalesce((v_settings ->> 'max_days_ahead')::int, 60), 1);

  if v_day < v_today or v_day > v_today + v_max_days then
    return '[]'::json;
  end if;

  -- All requested services must exist, be active and bookable in this salon.
  select count(*), coalesce(sum(duration_min + buffer_min), 0)
  into v_service_count, v_total_duration
  from public.services
  where salon_id = v_salon_id
    and id = any(p_service_ids)
    and active
    and online_bookable;

  if v_service_count <> coalesce(array_length(p_service_ids, 1), 0) or v_total_duration <= 0 then
    return '[]'::json;
  end if;

  -- weekday convention: 0 = luni … 6 = duminică
  v_dow := extract(isodow from v_day)::int - 1;

  select h.opens, h.closes into v_open, v_close
  from public.salon_hours h
  where h.salon_id = v_salon_id and h.weekday = v_dow and h.is_open
    and h.opens is not null and h.closes is not null;

  if v_open is null then
    return '[]'::json; -- salon închis în ziua respectivă
  end if;

  if p_staff_id is not null then
    if exists (
      select 1
      from public.staff st
      where st.id = p_staff_id
        and st.salon_id = v_salon_id
        and st.status = 'activ'
        and st.deleted_at is null
        and not exists (
          select 1
          from unnest(p_service_ids) as sid
          where not exists (
            select 1 from public.staff_services ss
            where ss.staff_id = st.id and ss.service_id = sid
          )
        )
    ) then
      v_staff_ids := array[p_staff_id];
    else
      return '[]'::json; -- staff invalid sau nu oferă toate serviciile
    end if;
  else
    select coalesce(array_agg(st.id), '{}'::uuid[]) into v_staff_ids
    from public.staff st
    where st.salon_id = v_salon_id
      and st.status = 'activ'
      and st.deleted_at is null
      and not exists (
        select 1
        from unnest(p_service_ids) as sid
        where not exists (
          select 1 from public.staff_services ss
          where ss.staff_id = st.id and ss.service_id = sid
        )
      );
  end if;

  for v_staff in select * from public.staff where id = any(v_staff_ids) loop
    -- Working window for that weekday (single row per staff/weekday expected;
    -- if several, the widest window wins).
    select min(ss.start_time) as start_time, max(ss.end_time) as end_time
    into v_sched
    from public.staff_schedules ss
    where ss.staff_id = v_staff.id
      and ss.salon_id = v_salon_id
      and ss.weekday = v_dow
      and ss.is_working
      and ss.start_time is not null
      and ss.end_time is not null;

    if v_sched.start_time is null then
      continue; -- nu lucrează în ziua respectivă
    end if;

    -- Intersect with salon hours
    v_w_start := greatest(v_sched.start_time, v_open);
    v_w_end := least(v_sched.end_time, v_close);
    if v_w_start >= v_w_end then
      continue;
    end if;

    v_slot := (v_day + v_w_start) at time zone 'Europe/Bucharest';
    v_window_end := (v_day + v_w_end) at time zone 'Europe/Bucharest';

    while v_slot + (v_total_duration * interval '1 minute') <= v_window_end loop
      v_slot_end := v_slot + (v_total_duration * interval '1 minute');

      if v_slot >= now() + (v_notice * interval '1 minute') then
        v_free := true;

        if v_free and exists (
          select 1 from public.staff_time_off
          where staff_id = v_staff.id
            and status = 'approved'
            and starts_at < v_slot_end
            and ends_at > v_slot
        ) then
          v_free := false;
        end if;

        if v_free and exists (
          select 1 from public.blocked_slots
          where staff_id = v_staff.id
            and starts_at < v_slot_end
            and ends_at > v_slot
        ) then
          v_free := false;
        end if;

        if v_free and exists (
          select 1 from public.appointments
          where staff_id = v_staff.id
            and status not in ('anulat', 'no_show')
            and starts_at < v_slot_end
            and ends_at > v_slot
        ) then
          v_free := false;
        end if;

        if v_free then
          v_slots := v_slots || jsonb_build_object('staff_id', v_staff.id, 'starts_at', v_slot);
        else
          -- 020: candidate slot exists in the grid but is not free for this
          -- staff member — report it so the UI can strike it through.
          v_taken := v_taken || jsonb_build_object('staff_id', v_staff.id, 'starts_at', v_slot, 'taken', true);
        end if;
      end if;

      v_slot := v_slot + (v_interval * interval '1 minute');
    end loop;
  end loop;

  return (v_slots || v_taken)::json;
end;
$$;
