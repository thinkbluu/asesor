-- 012: staff statistics views for /app/echipa.
--
-- Both views are postgres-owned (NOT security_invoker) on purpose: they
-- aggregate financial data (revenue, commissions) that the underlying RLS
-- would expose to every salon member. The WHERE guard is the RLS-layer
-- enforcement: owner/manager/receptionist see the whole salon, a staff user
-- sees only their own row. The UI and action layers mirror this.
--
-- Month/day boundaries use Europe/Bucharest so "this month" matches what the
-- salon sees on the wall clock.

-- ------------------------------------------------------------
-- staff_month_stats — one row per active staff member, current month
-- ------------------------------------------------------------
create or replace view public.staff_month_stats as
with bounds as (
  select
    date_trunc('month', (now() at time zone 'Europe/Bucharest'))::date as month_start,
    (date_trunc('month', (now() at time zone 'Europe/Bucharest')) + interval '1 month - 1 day')::date as month_end
),
days as (
  select
    d::date as day,
    (extract(isodow from d)::smallint - 1) as weekday -- 0 = luni … 6 = duminică
  from bounds b
  cross join generate_series(b.month_start, b.month_end, interval '1 day') d
),
sched as (
  select
    s.id as staff_id,
    s.salon_id,
    coalesce(sum(
      case
        when sch.is_working and sch.start_time is not null and sch.end_time is not null
          then extract(epoch from (sch.end_time - sch.start_time)) / 60
               - coalesce(extract(epoch from (sch.break_end - sch.break_start)) / 60, 0)
        else 0
      end
    ), 0)::numeric as scheduled_minutes
  from public.staff s
  cross join days d
  left join public.staff_schedules sch
    on sch.staff_id = s.id and sch.weekday = d.weekday
  group by s.id, s.salon_id
),
appts as (
  select
    a.staff_id,
    a.salon_id,
    count(*)::int as appointments_count,
    count(*) filter (where a.status = 'no_show')::int as no_show_count,
    count(*) filter (where a.status = 'finalizat')::int as finalized_count,
    coalesce(sum(extract(epoch from (a.ends_at - a.starts_at)) / 60), 0)::numeric as booked_minutes,
    coalesce(sum(aps.price) filter (where a.status = 'finalizat'), 0)::numeric as revenue,
    count(aps.id) filter (where a.status = 'finalizat')::int as services_count,
    avg(fr.rating) as avg_rating
  from public.appointments a
  left join public.appointment_services aps on aps.appointment_id = a.id
  left join public.feedback_requests fr on fr.appointment_id = a.id and fr.rating is not null
  where a.status <> 'anulat'
    and (a.starts_at at time zone 'Europe/Bucharest')::date between
        (select month_start from bounds) and (select month_end from bounds)
  group by a.staff_id, a.salon_id
)
select
  s.id as staff_id,
  s.salon_id,
  b.month_start,
  coalesce(a.appointments_count, 0) as appointments_count,
  case
    when coalesce(a.appointments_count, 0) = 0 then null
    else round(coalesce(a.no_show_count, 0)::numeric / a.appointments_count, 4)
  end as no_show_rate,
  coalesce(a.revenue, 0) as revenue,
  coalesce(a.services_count, 0) as services_count,
  coalesce(sch.scheduled_minutes, 0) as scheduled_minutes,
  coalesce(a.booked_minutes, 0) as booked_minutes,
  case
    when coalesce(sch.scheduled_minutes, 0) = 0 then null
    else round(coalesce(a.booked_minutes, 0) / sch.scheduled_minutes, 4)
  end as utilization,
  a.avg_rating,
  s.commission_type,
  s.commission_rate,
  case s.commission_type
    when 'procent' then round(coalesce(a.revenue, 0) * coalesce(s.commission_rate, 0) / 100, 2)
    when 'fix' then round(coalesce(a.services_count, 0) * coalesce(s.commission_rate, 0), 2)
    else 0::numeric -- 'salariu' or null: no per-appointment commission
  end as commission_amount
from public.staff s
cross join bounds b
left join sched sch on sch.staff_id = s.id
left join appts a on a.staff_id = s.id
where s.deleted_at is null
  and (
    public.has_salon_role(s.salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or s.id = public.current_staff_id(s.salon_id)
  );

-- ------------------------------------------------------------
-- staff_week_trend — one row per staff member per day, last 7 days
-- ------------------------------------------------------------
create or replace view public.staff_week_trend as
with bounds as (
  select
    ((now() at time zone 'Europe/Bucharest')::date - interval '6 day')::date as week_start,
    (now() at time zone 'Europe/Bucharest')::date as week_end
),
days as (
  select d::date as day
  from bounds b
  cross join generate_series(b.week_start, b.week_end, interval '1 day') d
),
appts as (
  select
    a.staff_id,
    a.salon_id,
    (a.starts_at at time zone 'Europe/Bucharest')::date as day,
    count(*)::int as appointments_count,
    coalesce(sum(aps.price) filter (where a.status = 'finalizat'), 0)::numeric as revenue
  from public.appointments a
  left join public.appointment_services aps on aps.appointment_id = a.id
  where a.status <> 'anulat'
    and (a.starts_at at time zone 'Europe/Bucharest')::date between
        (select week_start from bounds) and (select week_end from bounds)
  group by a.staff_id, a.salon_id, (a.starts_at at time zone 'Europe/Bucharest')::date
)
select
  s.id as staff_id,
  s.salon_id,
  d.day,
  coalesce(a.appointments_count, 0) as appointments_count,
  coalesce(a.revenue, 0) as revenue
from public.staff s
cross join days d
left join appts a on a.staff_id = s.id and a.day = d.day
where s.deleted_at is null
  and (
    public.has_salon_role(s.salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or s.id = public.current_staff_id(s.salon_id)
  );
