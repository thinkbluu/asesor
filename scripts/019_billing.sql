-- ============================================================
-- 019 — Subscription billing (P13)
-- ============================================================
-- subscriptions: one row per salon, written ONLY by the Stripe webhook
--   (service role). Owners can read their own row; nobody else can.
-- stripe_events: idempotency ledger for webhook deliveries (service role
--   only — RLS enabled with no policies).
-- protect_billing_columns: salons.plan / pilot_until / stripe_customer_id /
--   trial_ends_at may only be changed by the service role or by migrations,
--   never by a signed-in owner through the anon/user client. Without this an
--   owner could upgrade themselves with a plain UPDATE on their own salon row.
-- ============================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null unique references public.salons(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('basic', 'pro', 'premium')),
  interval text not null default 'month' check (interval in ('month', 'year')),
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  -- Set when the subscription first becomes past_due, cleared when it recovers.
  -- The app grants 7 days of full access from this moment, then goes read-only.
  past_due_since timestamptz,
  -- Stripe `event.created` (unix seconds) of the last applied event, so an
  -- out-of-order delivery of an older event never overwrites newer state.
  last_event_created bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select on public.subscriptions
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner']::public.member_role[]));

-- No insert/update/delete policies: only the service role (webhook) writes.

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

alter table public.stripe_events enable row level security;

-- ------------------------------------------------------------
-- Billing column protection on salons
-- ------------------------------------------------------------
create or replace function public.protect_billing_columns() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' and (
    new.plan is distinct from old.plan
    or new.pilot_until is distinct from old.pilot_until
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.trial_ends_at is distinct from old.trial_ends_at
  ) then
    raise exception 'Coloanele de facturare nu pot fi modificate din aplicație.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists salons_protect_billing_columns on public.salons;
create trigger salons_protect_billing_columns
  before update on public.salons
  for each row execute function public.protect_billing_columns();

create index if not exists subscriptions_status_idx on public.subscriptions (status);
