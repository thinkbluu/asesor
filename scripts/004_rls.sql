-- ============================================================
-- ASESOR · 004 — Row Level Security
-- Run after 003 (policies call is_salon_member / has_salon_role / salon_role /
-- current_staff_id). Idempotent (drop + create policies).
--
-- Default tenant pattern:
--   select  → any member of the salon
--   insert  → owner, manager, receptionist
--   update  → owner, manager, receptionist
--   delete  → owner, manager
-- Deviations are documented inline.
-- ============================================================

alter table public.salons               enable row level security;
alter table public.profiles             enable row level security;
alter table public.staff                enable row level security;
alter table public.salon_members        enable row level security;
alter table public.salon_invites        enable row level security;
alter table public.salon_hours          enable row level security;
alter table public.staff_schedules      enable row level security;
alter table public.staff_time_off       enable row level security;
alter table public.blocked_slots        enable row level security;
alter table public.service_categories   enable row level security;
alter table public.services             enable row level security;
alter table public.staff_services       enable row level security;
alter table public.clients              enable row level security;
alter table public.client_sensitive     enable row level security;
alter table public.client_photos        enable row level security;
alter table public.consents             enable row level security;
alter table public.appointments         enable row level security;
alter table public.appointment_services enable row level security;
alter table public.products             enable row level security;
alter table public.service_products     enable row level security;
alter table public.stock_movements      enable row level security;
alter table public.transactions         enable row level security;
alter table public.expenses             enable row level security;
alter table public.day_closes           enable row level security;
alter table public.loyalty_ledger       enable row level security;
alter table public.feedback_requests    enable row level security;
alter table public.message_log          enable row level security;
alter table public.audit_log            enable row level security;
alter table public.contact_requests     enable row level security;
alter table public.rate_limits          enable row level security;

-- ------------------------------------------------------------
-- salons: members select; only owner updates; no delete through the API
-- ------------------------------------------------------------

drop policy if exists salons_select on public.salons;
create policy salons_select on public.salons
  for select to authenticated
  using (public.is_salon_member(id));

drop policy if exists salons_update on public.salons;
create policy salons_update on public.salons
  for update to authenticated
  using (public.salon_role(id) = 'owner')
  with check (public.salon_role(id) = 'owner');

-- ------------------------------------------------------------
-- profiles: own row only
-- ------------------------------------------------------------

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- (insert happens via the handle_new_user trigger, security definer)

-- ------------------------------------------------------------
-- salon_members: owner/manager manage; members see their salon's members;
-- users always see their own membership rows (needed by onboarding).
-- ------------------------------------------------------------

drop policy if exists salon_members_select on public.salon_members;
create policy salon_members_select on public.salon_members
  for select to authenticated
  using (public.is_salon_member(salon_id) or user_id = auth.uid());

drop policy if exists salon_members_insert on public.salon_members;
create policy salon_members_insert on public.salon_members
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists salon_members_update on public.salon_members;
create policy salon_members_update on public.salon_members
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists salon_members_delete on public.salon_members;
create policy salon_members_delete on public.salon_members
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- ------------------------------------------------------------
-- salon_invites: owner/manager manage
-- ------------------------------------------------------------

drop policy if exists salon_invites_select on public.salon_invites;
create policy salon_invites_select on public.salon_invites
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists salon_invites_insert on public.salon_invites;
create policy salon_invites_insert on public.salon_invites
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists salon_invites_update on public.salon_invites;
create policy salon_invites_update on public.salon_invites
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists salon_invites_delete on public.salon_invites;
create policy salon_invites_delete on public.salon_invites
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- ------------------------------------------------------------
-- Default tenant pattern tables
-- ------------------------------------------------------------

-- staff
drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists staff_insert on public.staff;
create policy staff_insert on public.staff
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_update on public.staff;
create policy staff_update on public.staff
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_delete on public.staff;
create policy staff_delete on public.staff
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- salon_hours
drop policy if exists salon_hours_select on public.salon_hours;
create policy salon_hours_select on public.salon_hours
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists salon_hours_insert on public.salon_hours;
create policy salon_hours_insert on public.salon_hours
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists salon_hours_update on public.salon_hours;
create policy salon_hours_update on public.salon_hours
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists salon_hours_delete on public.salon_hours;
create policy salon_hours_delete on public.salon_hours
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- staff_schedules
drop policy if exists staff_schedules_select on public.staff_schedules;
create policy staff_schedules_select on public.staff_schedules
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists staff_schedules_insert on public.staff_schedules;
create policy staff_schedules_insert on public.staff_schedules
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_schedules_update on public.staff_schedules;
create policy staff_schedules_update on public.staff_schedules
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_schedules_delete on public.staff_schedules;
create policy staff_schedules_delete on public.staff_schedules
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- staff_time_off
drop policy if exists staff_time_off_select on public.staff_time_off;
create policy staff_time_off_select on public.staff_time_off
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists staff_time_off_insert on public.staff_time_off;
create policy staff_time_off_insert on public.staff_time_off
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_time_off_update on public.staff_time_off;
create policy staff_time_off_update on public.staff_time_off
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_time_off_delete on public.staff_time_off;
create policy staff_time_off_delete on public.staff_time_off
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- blocked_slots
drop policy if exists blocked_slots_select on public.blocked_slots;
create policy blocked_slots_select on public.blocked_slots
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists blocked_slots_insert on public.blocked_slots;
create policy blocked_slots_insert on public.blocked_slots
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists blocked_slots_update on public.blocked_slots;
create policy blocked_slots_update on public.blocked_slots
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists blocked_slots_delete on public.blocked_slots;
create policy blocked_slots_delete on public.blocked_slots
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- service_categories
drop policy if exists service_categories_select on public.service_categories;
create policy service_categories_select on public.service_categories
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists service_categories_insert on public.service_categories;
create policy service_categories_insert on public.service_categories
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists service_categories_update on public.service_categories;
create policy service_categories_update on public.service_categories
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists service_categories_delete on public.service_categories;
create policy service_categories_delete on public.service_categories
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- services
drop policy if exists services_select on public.services;
create policy services_select on public.services
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists services_insert on public.services;
create policy services_insert on public.services
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists services_update on public.services;
create policy services_update on public.services
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists services_delete on public.services;
create policy services_delete on public.services
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- staff_services
drop policy if exists staff_services_select on public.staff_services;
create policy staff_services_select on public.staff_services
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists staff_services_insert on public.staff_services;
create policy staff_services_insert on public.staff_services
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_services_update on public.staff_services;
create policy staff_services_update on public.staff_services
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists staff_services_delete on public.staff_services;
create policy staff_services_delete on public.staff_services
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- clients
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- consents
drop policy if exists consents_select on public.consents;
create policy consents_select on public.consents
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists consents_insert on public.consents;
create policy consents_insert on public.consents
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists consents_update on public.consents;
create policy consents_update on public.consents
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists consents_delete on public.consents;
create policy consents_delete on public.consents
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- appointments
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
-- Staff may update their own appointments (status + notes in the app; RLS is
-- row-level only — column restriction is enforced in the app layer).
drop policy if exists appointments_update_staff_own on public.appointments;
create policy appointments_update_staff_own on public.appointments
  for update to authenticated
  using (public.salon_role(salon_id) = 'staff' and staff_id = public.current_staff_id(salon_id))
  with check (public.salon_role(salon_id) = 'staff' and staff_id = public.current_staff_id(salon_id));
drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists appointments_delete on public.appointments;
create policy appointments_delete on public.appointments
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- appointment_services
drop policy if exists appointment_services_select on public.appointment_services;
create policy appointment_services_select on public.appointment_services
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists appointment_services_insert on public.appointment_services;
create policy appointment_services_insert on public.appointment_services
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists appointment_services_update on public.appointment_services;
create policy appointment_services_update on public.appointment_services
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists appointment_services_delete on public.appointment_services;
create policy appointment_services_delete on public.appointment_services
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- service_products
drop policy if exists service_products_select on public.service_products;
create policy service_products_select on public.service_products
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists service_products_insert on public.service_products;
create policy service_products_insert on public.service_products
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists service_products_update on public.service_products;
create policy service_products_update on public.service_products
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists service_products_delete on public.service_products;
create policy service_products_delete on public.service_products
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- stock_movements
drop policy if exists stock_movements_select on public.stock_movements;
create policy stock_movements_select on public.stock_movements
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists stock_movements_insert on public.stock_movements;
create policy stock_movements_insert on public.stock_movements
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists stock_movements_update on public.stock_movements;
create policy stock_movements_update on public.stock_movements
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists stock_movements_delete on public.stock_movements;
create policy stock_movements_delete on public.stock_movements
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- loyalty_ledger
drop policy if exists loyalty_ledger_select on public.loyalty_ledger;
create policy loyalty_ledger_select on public.loyalty_ledger
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists loyalty_ledger_insert on public.loyalty_ledger;
create policy loyalty_ledger_insert on public.loyalty_ledger
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists loyalty_ledger_update on public.loyalty_ledger;
create policy loyalty_ledger_update on public.loyalty_ledger
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists loyalty_ledger_delete on public.loyalty_ledger;
create policy loyalty_ledger_delete on public.loyalty_ledger
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- feedback_requests
drop policy if exists feedback_requests_select on public.feedback_requests;
create policy feedback_requests_select on public.feedback_requests
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists feedback_requests_insert on public.feedback_requests;
create policy feedback_requests_insert on public.feedback_requests
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists feedback_requests_update on public.feedback_requests;
create policy feedback_requests_update on public.feedback_requests
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists feedback_requests_delete on public.feedback_requests;
create policy feedback_requests_delete on public.feedback_requests
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- message_log
drop policy if exists message_log_select on public.message_log;
create policy message_log_select on public.message_log
  for select to authenticated
  using (public.is_salon_member(salon_id));
drop policy if exists message_log_insert on public.message_log;
create policy message_log_insert on public.message_log
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists message_log_update on public.message_log;
create policy message_log_update on public.message_log
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists message_log_delete on public.message_log;
create policy message_log_delete on public.message_log
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- ------------------------------------------------------------
-- Sensitive client data: owner, manager, staff — receptionist has NO access.
-- (delete: owner/manager only)
-- ------------------------------------------------------------

drop policy if exists client_sensitive_select on public.client_sensitive;
create policy client_sensitive_select on public.client_sensitive
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]));
drop policy if exists client_sensitive_insert on public.client_sensitive;
create policy client_sensitive_insert on public.client_sensitive
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]));
drop policy if exists client_sensitive_update on public.client_sensitive;
create policy client_sensitive_update on public.client_sensitive
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]));
drop policy if exists client_sensitive_delete on public.client_sensitive;
create policy client_sensitive_delete on public.client_sensitive
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists client_photos_select on public.client_photos;
create policy client_photos_select on public.client_photos
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]));
drop policy if exists client_photos_insert on public.client_photos;
create policy client_photos_insert on public.client_photos
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]));
drop policy if exists client_photos_update on public.client_photos;
create policy client_photos_update on public.client_photos
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]));
drop policy if exists client_photos_delete on public.client_photos;
create policy client_photos_delete on public.client_photos
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- ------------------------------------------------------------
-- Financial: owner and manager only
-- ------------------------------------------------------------

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists transactions_update on public.transactions;
create policy transactions_update on public.transactions
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists transactions_delete on public.transactions;
create policy transactions_delete on public.transactions
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists day_closes_select on public.day_closes;
create policy day_closes_select on public.day_closes
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists day_closes_insert on public.day_closes;
create policy day_closes_insert on public.day_closes
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists day_closes_update on public.day_closes;
create policy day_closes_update on public.day_closes
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists day_closes_delete on public.day_closes;
create policy day_closes_delete on public.day_closes
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- ------------------------------------------------------------
-- products: direct table access for owner/manager. Other roles read through
-- the products_public view (005), which omits cost_price.
-- NOTE: Postgres column grants cannot distinguish app roles (all app users are
-- the `authenticated` DB role), so cost_price confidentiality for staff/
-- receptionist is enforced at the application layer via products_public.
-- ------------------------------------------------------------

drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
drop policy if exists products_insert on public.products;
create policy products_insert on public.products
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists products_update on public.products;
create policy products_update on public.products
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));
drop policy if exists products_delete on public.products;
create policy products_delete on public.products
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- ------------------------------------------------------------
-- audit_log: insert by members, select by owner only, no update/delete
-- ------------------------------------------------------------

drop policy if exists audit_log_insert on public.audit_log;
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (public.is_salon_member(salon_id));

drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (public.salon_role(salon_id) = 'owner');

-- ------------------------------------------------------------
-- contact_requests & rate_limits: RLS enabled, NO policies (service role only)
-- (no policies created on purpose)
-- ------------------------------------------------------------
