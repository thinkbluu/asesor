-- ============================================================
-- ASESOR · 007 — Demo seed
-- Demo salon: 'Salonul Ana' (slug 'salonul-ana'), Timișoara, is_demo = true.
-- 3 staff, 8 services, staff_services, schedules, salon_hours,
-- 5 demo clients and 10 sample appointments for the coming days.
-- No auth user is attached (no salon_members row).
-- Idempotent: delete-then-insert, demo salon only (children cascade).
-- Run after 002–006.
-- ============================================================

begin;

-- Re-seed: remove any previous demo salon (children cascade with it)
delete from public.salons
where slug = 'salonul-ana'
  and is_demo = true;

-- ------------------------------------------------------------
-- Salon
-- ------------------------------------------------------------

insert into public.salons (
  id, name, slug, city, address, phone, description,
  cancellation_policy, cancellation_window_hours, timezone,
  booking_settings, branding, loyalty_config, reviews_config,
  plan, is_demo
) values (
  '00000000-0000-4000-8000-000000000001',
  'Salonul Ana',
  'salonul-ana',
  'Timișoara',
  'Str. Alba Iulia 4, Timișoara',
  '+40771431963',
  'Salon de frumusețe în centrul Timișoarei — păr, unghii și tratamente faciale.',
  'Anularea este gratuită cu cel puțin 24 de ore înainte. La anulare târzie sau neprezentare se poate percepe 50% din valoarea serviciului.',
  24,
  'Europe/Bucharest',
  jsonb_build_object(
    'slot_interval_min', 15,
    'min_notice_min', 120,
    'max_days_ahead', 60,
    'require_confirmation', false,
    'online_enabled', true,
    'onboarding_step', 1
  ),
  jsonb_build_object('primary', '#7c5cff', 'accent', '#f59e0b'),
  jsonb_build_object('enabled', true, 'ronPerPoint', 10, 'expirationMonths', 12),
  jsonb_build_object('enabled', true, 'minRatingToRoute', 4),
  'basic',
  true
);

-- ------------------------------------------------------------
-- Staff (3)
-- ------------------------------------------------------------

insert into public.staff (id, salon_id, first_name, last_name, role_title, phone, email, status, hired_at, commission_type, commission_rate, color, sort_order) values
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Ana',     'Marinescu', 'Stilist Senior', '+407211111101', 'ana@salonul-ana.ro',       'activ',    date '2019-03-04', 'procent', 40.00, '#7c5cff', 0),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Cristina','Voicu',     'Manichiurista',  '+407211111102', 'cristina@salonul-ana.ro',  'activ',    date '2021-06-14', 'procent', 35.00, '#0ea5e9', 1),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Mara',    'Ene',       'Cosmetician',    '+407211111103', 'mara@salonul-ana.ro',      'activ',    date '2022-09-01', 'procent', 35.00, '#f59e0b', 2);

-- ------------------------------------------------------------
-- Salon hours: luni–sâmbătă 09:00–19:00, duminică închis
-- ------------------------------------------------------------

insert into public.salon_hours (salon_id, weekday, opens, closes, is_open)
select '00000000-0000-4000-8000-000000000001', wd, time '09:00', time '19:00', wd < 6
from generate_series(0, 6) as wd;

-- ------------------------------------------------------------
-- Schedules: luni–vineri 09:00–18:00, sâmbătă 10:00–15:00, duminică liber
-- ------------------------------------------------------------

insert into public.staff_schedules (staff_id, salon_id, weekday, start_time, end_time, is_working)
select s.id, s.salon_id, wd,
       case when wd = 5 then time '10:00' else time '09:00' end,
       case when wd = 5 then time '15:00' else time '18:00' end,
       wd < 6
from public.staff s
where s.salon_id = '00000000-0000-4000-8000-000000000001'
  and s.id in (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000004'
  )
cross join generate_series(0, 6) as wd;

-- ------------------------------------------------------------
-- Categories & services (8)
-- ------------------------------------------------------------

insert into public.service_categories (id, salon_id, name, sort_order) values
  ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', 'Păr',    0),
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Unghii', 1),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'Față',   2);

insert into public.services (id, salon_id, category_id, name, description, duration_min, buffer_min, price, price_from, online_bookable, active, sort_order) values
  ('00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010', 'Tuns și aranjat',        'Tuns + spălat + aranjat',                              60,  10, 120.00, false, true, true, 0),
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010', 'Vopsit rădăcini',        'Vopsit rădăcini + spălat + uscat',                     90,  15, 220.00, false, true, true, 1),
  ('00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010', 'Balayage',               'Decolorare + tonifiere + tratament',                   180, 20, 450.00, true,  true, true, 2),
  ('00000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Manichiură gel',         'Manichiură cu aplicare gel',                           60,   5,  90.00, false, true, true, 3),
  ('00000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Pedichiură',             'Pedichiură completă cu ojă',                           60,   5, 100.00, false, true, true, 4),
  ('00000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Tratament facial hidratant', 'Tratament hidratant pentru ten',                   60,  10, 150.00, false, true, true, 5),
  ('00000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Curățare de față',       'Curățare profundă a tenului',                          45,  10, 120.00, false, true, true, 6),
  ('00000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Extensii gene',          'Aplicare extensii gene cu volum',                      90,  10, 180.00, false, true, true, 7);

insert into public.staff_services (staff_id, service_id, salon_id) values
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000025', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000026', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000027', '00000000-0000-4000-8000-000000000001');

-- ------------------------------------------------------------
-- Demo clients (5)
-- ------------------------------------------------------------

insert into public.clients (id, salon_id, first_name, last_name, phone, email, sex, source, tags, communication_pref, marketing_consent, loyalty_points, lifetime_points) values
  ('00000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000001', 'Maria',   'Popescu',   '+407221111101', 'maria.popescu@example.ro',   'F', 'Google',       '{VIP,Fidel}',    'WhatsApp', true,  120, 480),
  ('00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000001', 'Elena',   'Dumitrescu','+407221111102', 'elena.dumitrescu@example.ro','F', 'Recomandare',  '{Frecvent}',     'SMS',      true,   45, 210),
  ('00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000001', 'Laura',   'Ion',       '+407221111103', 'laura.ion@example.ro',       'F', 'Instagram',    '{Nou}',          'Email',    false,   0,   0),
  ('00000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000001', 'Andreea', 'Stan',      '+407221111104', 'andreea.stan@example.ro',    'F', 'Walk-in',      '{Inactiv}',      'SMS',      false,  10,  90),
  ('00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000001', 'Cristina','Radu',      '+407221111105', 'cristina.radu@example.ro',   'F', 'Facebook',     '{Frecvent}',     'WhatsApp', true,   60, 150);

-- ------------------------------------------------------------
-- 10 sample appointments for the coming days (no per-staff overlaps)
-- Times are Europe/Bucharest local.
-- ------------------------------------------------------------

insert into public.appointments (id, salon_id, client_id, staff_id, starts_at, ends_at, status, source, total_price, notes) values
  -- azi
  ('00000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000002', (current_date + 0 + time '10:00') at time zone 'Europe/Bucharest', (current_date + 0 + time '11:00') at time zone 'Europe/Bucharest', 'confirmat',      'telefon',  120.00, 'Clientă fidela, preferă uscat cu volum.'),
  ('00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000003', (current_date + 0 + time '10:00') at time zone 'Europe/Bucharest', (current_date + 0 + time '11:00') at time zone 'Europe/Bucharest', 'confirmat',      'online',    90.00, null),
  ('00000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000004', (current_date + 0 + time '11:00') at time zone 'Europe/Bucharest', (current_date + 0 + time '12:00') at time zone 'Europe/Bucharest', 'in_asteptare',   'online',   150.00, 'Prima vizită.'),
  ('00000000-0000-4000-8000-000000000043', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000002', (current_date + 0 + time '12:00') at time zone 'Europe/Bucharest', (current_date + 0 + time '13:30') at time zone 'Europe/Bucharest', 'confirmat',      'salon',    220.00, null),
  -- mâine
  ('00000000-0000-4000-8000-000000000044', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000003', (current_date + 1 + time '10:00') at time zone 'Europe/Bucharest', (current_date + 1 + time '11:00') at time zone 'Europe/Bucharest', 'confirmat',      'whatsapp', 100.00, null),
  ('00000000-0000-4000-8000-000000000045', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000002', (current_date + 1 + time '11:00') at time zone 'Europe/Bucharest', (current_date + 1 + time '14:00') at time zone 'Europe/Bucharest', 'in_asteptare',   'online',   450.00, 'Balayage — necesită test alergologic în prealabil.'),
  ('00000000-0000-4000-8000-000000000046', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000004', (current_date + 1 + time '10:00') at time zone 'Europe/Bucharest', (current_date + 1 + time '10:45') at time zone 'Europe/Bucharest', 'confirmat',      'telefon',  120.00, null),
  ('00000000-0000-4000-8000-000000000047', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000003', (current_date + 1 + time '13:00') at time zone 'Europe/Bucharest', (current_date + 1 + time '14:00') at time zone 'Europe/Bucharest', 'in_asteptare',   'online',    90.00, null),
  -- poimâine
  ('00000000-0000-4000-8000-000000000048', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000002', (current_date + 2 + time '10:00') at time zone 'Europe/Bucharest', (current_date + 2 + time '11:00') at time zone 'Europe/Bucharest', 'confirmat',      'salon',    120.00, null),
  ('00000000-0000-4000-8000-000000000049', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000004', (current_date + 2 + time '14:00') at time zone 'Europe/Bucharest', (current_date + 2 + time '15:30') at time zone 'Europe/Bucharest', 'in_asteptare',   'online',   180.00, null);

insert into public.appointment_services (appointment_id, salon_id, service_id, name_snapshot, price, duration_min, sort_order) values
  ('00000000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000020', 'Tuns și aranjat',            120.00, 60,  0),
  ('00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000023', 'Manichiură gel',              90.00, 60,  0),
  ('00000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000025', 'Tratament facial hidratant', 150.00, 60,  0),
  ('00000000-0000-4000-8000-000000000043', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000021', 'Vopsit rădăcini',            220.00, 90,  0),
  ('00000000-0000-4000-8000-000000000044', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000024', 'Pedichiură',                 100.00, 60,  0),
  ('00000000-0000-4000-8000-000000000045', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000022', 'Balayage',                   450.00, 180, 0),
  ('00000000-0000-4000-8000-000000000046', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000026', 'Curățare de față',           120.00, 45,  0),
  ('00000000-0000-4000-8000-000000000047', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000023', 'Manichiură gel',              90.00, 60,  0),
  ('00000000-0000-4000-8000-000000000048', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000020', 'Tuns și aranjat',            120.00, 60,  0),
  ('00000000-0000-4000-8000-000000000049', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000027', 'Extensii gene',              180.00, 90,  0);

commit;
