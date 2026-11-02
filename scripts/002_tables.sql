-- ============================================================
-- ASESOR · 002 — Tables
-- Run after 001. Idempotent (create if not exists semantics via
-- drop-guarded statements are avoided; tables use `create table if not exists`).
-- Conventions:
--   * id uuid primary key default gen_random_uuid()
--   * created_at timestamptz default now()
--   * updated_at timestamptz default now() (kept fresh by set_updated_at() in 003)
--   * every tenant table: salon_id uuid not null → salons(id) on delete cascade + index
-- ============================================================

-- Immutable helper for the clients trigram index (must exist before the index).
create or replace function public.client_search_text(
  p_first text, p_last text, p_phone text
) returns text
language sql
immutable
parallel safe
as $$
  select lower(trim(coalesce(p_first, '') || ' ' || coalesce(p_last, '') || ' ' || coalesce(p_phone, '')))
$$;

-- ------------------------------------------------------------
-- Tenancy root
-- ------------------------------------------------------------

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique check (slug::text ~ '^[a-z0-9-]{3,48}$'),
  city text,
  address text,
  phone text,
  email citext,
  description text,
  cancellation_policy text,
  cancellation_window_hours int not null default 24 check (cancellation_window_hours between 0 and 168),
  timezone text not null default 'Europe/Bucharest',
  booking_settings jsonb not null default jsonb_build_object(
    'slot_interval_min', 15,
    'min_notice_min', 120,
    'max_days_ahead', 60,
    'require_confirmation', false,
    'online_enabled', true,
    'onboarding_step', 1
  ),
  branding jsonb not null default '{}'::jsonb,
  loyalty_config jsonb not null default '{}'::jsonb,
  reviews_config jsonb not null default '{}'::jsonb,
  google_review_url text,
  plan text not null default 'basic',
  trial_ends_at timestamptz,
  pilot_until date,
  stripe_customer_id text,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  terms_accepted_at timestamptz,
  dpa_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  terms_version text,
  dpa_version text,
  privacy_version text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Staff & membership
-- ------------------------------------------------------------

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role_title text,
  phone text,
  email citext,
  status public.staff_status not null default 'activ',
  hired_at date,
  commission_type public.commission_type,
  commission_rate numeric(5, 2) check (commission_rate >= 0),
  color text,
  notes text,
  sort_order int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_staff_salon on public.staff (salon_id);

create table if not exists public.salon_members (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, user_id)
);
create index if not exists idx_salon_members_salon on public.salon_members (salon_id);
create index if not exists idx_salon_members_user on public.salon_members (user_id);

create table if not exists public.salon_invites (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  email citext not null,
  role public.member_role not null,
  staff_id uuid references public.staff (id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_salon_invites_salon on public.salon_invites (salon_id);

create table if not exists public.salon_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = luni … 6 = duminică
  opens time,
  closes time,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, weekday)
);
create index if not exists idx_salon_hours_salon on public.salon_hours (salon_id);

create table if not exists public.staff_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time,
  end_time time,
  break_start time,
  break_end time,
  is_working boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_staff_schedules_salon on public.staff_schedules (salon_id);
create index if not exists idx_staff_schedules_staff on public.staff_schedules (staff_id, weekday);

create table if not exists public.staff_time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists idx_staff_time_off_salon on public.staff_time_off (salon_id);
create index if not exists idx_staff_time_off_staff on public.staff_time_off (staff_id, starts_at);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists idx_blocked_slots_salon on public.blocked_slots (salon_id);
create index if not exists idx_blocked_slots_staff on public.blocked_slots (staff_id, starts_at);

-- ------------------------------------------------------------
-- Services
-- ------------------------------------------------------------

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_service_categories_salon on public.service_categories (salon_id);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  category_id uuid references public.service_categories (id) on delete set null,
  name text not null,
  description text,
  duration_min int not null check (duration_min > 0),
  buffer_min int not null default 0 check (buffer_min >= 0),
  price numeric(10, 2) not null default 0 check (price >= 0),
  price_from boolean not null default false,
  online_bookable boolean not null default true,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_services_salon on public.services (salon_id);
create index if not exists idx_services_category on public.services (category_id);

create table if not exists public.staff_services (
  staff_id uuid not null references public.staff (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  price_override numeric(10, 2) check (price_override >= 0),
  duration_override int check (duration_override > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (staff_id, service_id)
);
create index if not exists idx_staff_services_salon on public.staff_services (salon_id);
create index if not exists idx_staff_services_service on public.staff_services (service_id);

-- ------------------------------------------------------------
-- Clients
-- ------------------------------------------------------------

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'), -- E.164
  whatsapp_phone text check (whatsapp_phone ~ '^\+[1-9][0-9]{6,14}$'),
  email citext,
  birth_date date,
  sex text check (sex in ('F', 'M', 'Nespecificat')),
  source text,
  tags text[] not null default '{}',
  preferred_staff_id uuid references public.staff (id) on delete set null,
  communication_pref text,
  notes text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  balance_due numeric(10, 2) not null default 0,
  loyalty_points int not null default 0,
  lifetime_points int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, phone)
);
create index if not exists idx_clients_salon on public.clients (salon_id);
create index if not exists idx_clients_search_trgm
  on public.clients using gin (public.client_search_text(first_name, last_name, phone) gin_trgm_ops);

-- Encrypted-at-rest-by-the-app sensitive fields; the DB stores ciphertext only.
create table if not exists public.client_sensitive (
  client_id uuid primary key references public.clients (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  allergies_enc text,
  color_formulas_enc text,
  health_consent_at timestamptz,
  health_consent_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_client_sensitive_salon on public.client_sensitive (salon_id);

create table if not exists public.client_photos (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  storage_path text not null,
  caption text,
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_client_photos_salon on public.client_photos (salon_id);
create index if not exists idx_client_photos_client on public.client_photos (client_id);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null check (kind in ('marketing_email', 'marketing_sms', 'health_data', 'photos')),
  granted boolean not null default true,
  text_version text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_consents_salon on public.consents (salon_id);
create index if not exists idx_consents_client on public.consents (client_id);

-- ------------------------------------------------------------
-- Appointments
-- ------------------------------------------------------------

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'in_asteptare',
  source public.appointment_source not null default 'salon',
  notes text,
  total_price numeric(10, 2) not null default 0 check (total_price >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  discount_type text not null default 'procent' check (discount_type in ('procent', 'fix')),
  recurrence_rule text,
  recurrence_parent_id uuid references public.appointments (id) on delete set null,
  confirmation_code text,
  manage_token_hash text unique,
  reminder_sent_at timestamptz,
  cancel_reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Prevents double booking: one active appointment per staff per time range.
  constraint appointments_no_double_booking
    exclude using gist (
      staff_id with =,
      tstzrange(starts_at, ends_at) with &&
    )
    where (status not in ('anulat', 'no_show'))
);
create index if not exists idx_appointments_salon on public.appointments (salon_id);
create index if not exists idx_appointments_staff_start on public.appointments (staff_id, starts_at);
create index if not exists idx_appointments_salon_start on public.appointments (salon_id, starts_at);
create index if not exists idx_appointments_client on public.appointments (client_id);

create table if not exists public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  name_snapshot text not null,
  price numeric(10, 2) not null default 0,
  duration_min int not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appointment_services_salon on public.appointment_services (salon_id);
create index if not exists idx_appointment_services_appointment on public.appointment_services (appointment_id);

-- ------------------------------------------------------------
-- Products & stock
-- ------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  brand text,
  category text,
  sku text,
  unit text not null default 'buc',
  stock numeric(12, 3) not null default 0,
  min_stock numeric(12, 3) not null default 0,
  cost_price numeric(10, 2),
  retail_price numeric(10, 2),
  supplier_name text,
  supplier_phone text,
  supplier_email citext,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_salon on public.products (salon_id);

create table if not exists public.service_products (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  quantity_per_use numeric(10, 3) not null default 1 check (quantity_per_use > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, product_id)
);
create index if not exists idx_service_products_salon on public.service_products (salon_id);
create index if not exists idx_service_products_product on public.service_products (product_id);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  type public.stock_movement_type not null,
  quantity numeric(12, 3) not null, -- signed: positive = intrare, negative = ieșire
  note text,
  invoice_number text,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_stock_movements_salon on public.stock_movements (salon_id);
create index if not exists idx_stock_movements_product on public.stock_movements (product_id, created_at);
create index if not exists idx_stock_movements_appointment on public.stock_movements (appointment_id);

-- ------------------------------------------------------------
-- Money
-- ------------------------------------------------------------

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  staff_id uuid references public.staff (id) on delete set null,
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  tip numeric(10, 2) not null default 0 check (tip >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  payment_method public.payment_method,
  status public.transaction_status not null default 'incasat',
  notes text,
  paid_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_transactions_salon on public.transactions (salon_id);
create index if not exists idx_transactions_paid on public.transactions (salon_id, paid_at);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  spent_on date not null default current_date,
  category public.expense_category not null,
  description text,
  amount numeric(10, 2) not null check (amount >= 0),
  frequency text not null default 'unica' check (frequency in ('unica', 'lunar', 'saptamanal')),
  receipt_path text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_expenses_salon on public.expenses (salon_id);
create index if not exists idx_expenses_spent_on on public.expenses (salon_id, spent_on);

create table if not exists public.day_closes (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  day date not null,
  totals jsonb,
  cash_counted numeric(10, 2),
  difference numeric(10, 2),
  closed_by uuid references auth.users (id) on delete set null,
  closed_at timestamptz,
  reopened_at timestamptz,
  reopened_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, day)
);
create index if not exists idx_day_closes_salon on public.day_closes (salon_id);

create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  type text not null check (type in ('earned', 'redeemed', 'expired', 'bonus', 'adjustment')),
  points int not null, -- signed: earned/bonus positive, redeemed/expired negative
  appointment_id uuid references public.appointments (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_loyalty_ledger_salon on public.loyalty_ledger (salon_id);
create index if not exists idx_loyalty_ledger_client on public.loyalty_ledger (client_id, created_at);

-- ------------------------------------------------------------
-- Feedback & messaging
-- ------------------------------------------------------------

create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  rating smallint check (rating between 1 and 5),
  comment text,
  routed_to_google boolean not null default false,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_feedback_requests_salon on public.feedback_requests (salon_id);

create table if not exists public.message_log (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  channel text not null default 'email' check (channel = 'email'),
  kind text not null,
  to_address text not null,
  status text not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, kind)
);
create index if not exists idx_message_log_salon on public.message_log (salon_id);

-- ------------------------------------------------------------
-- System
-- ------------------------------------------------------------

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_log_salon on public.audit_log (salon_id, created_at);

-- No salon_id: pre-signup contact form submissions (service role only).
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  email citext,
  phone text,
  salon_name text,
  subject text,
  message text,
  source_page text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple fixed-window rate limiting (service role only).
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (key, window_start)
);
