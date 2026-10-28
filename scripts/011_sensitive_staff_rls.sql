-- 011: P6 follow-up + staff self-service RLS adjustments.
--
-- Part 1 re-asserts the client_sensitive / client_photos policy state the
-- server actions rely on (owner, manager AND staff may write sensitive data
-- and photo rows; delete stays owner/manager; receptionist has no access).
-- 004 already carried these grants — this script makes the contract explicit
-- and keeps it true even if 004 is later relaxed.
--
-- Part 2 lets staff act on their own rows for time off and blocked slots
-- (they are the ones who know when they are away), matching the action layer.

-- ============================================================
-- Part 1 — client_sensitive / client_photos (re-assertion)
-- ============================================================

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

drop policy if exists client_photos_insert on public.client_photos;
create policy client_photos_insert on public.client_photos
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'staff']::public.member_role[]));

-- ============================================================
-- Part 2 — staff self-service: time off and blocked slots
-- ============================================================

-- staff_time_off: staff may request for themselves and withdraw their own
-- pending requests; owner/manager/receptionist keep full control.
drop policy if exists staff_time_off_insert on public.staff_time_off;
create policy staff_time_off_insert on public.staff_time_off
  for insert to authenticated
  with check (
    public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
    )
  );

drop policy if exists staff_time_off_update on public.staff_time_off;
create policy staff_time_off_update on public.staff_time_off
  for update to authenticated
  using (
    public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
      and status = 'pending'
    )
  )
  with check (
    public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
      and status = 'pending'
    )
  );

drop policy if exists staff_time_off_delete on public.staff_time_off;
create policy staff_time_off_delete on public.staff_time_off
  for delete to authenticated
  using (
    public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
      and status = 'pending'
    )
  );

-- blocked_slots: staff may manage their own blocks; o/m/r any block.
drop policy if exists blocked_slots_insert on public.blocked_slots;
create policy blocked_slots_insert on public.blocked_slots
  for insert to authenticated
  with check (
    public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
    )
  );

drop policy if exists blocked_slots_update on public.blocked_slots;
create policy blocked_slots_update on public.blocked_slots
  for update to authenticated
  using (
    public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
    )
  )
  with check (
    public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
    )
  );

drop policy if exists blocked_slots_delete on public.blocked_slots;
create policy blocked_slots_delete on public.blocked_slots
  for delete to authenticated
  using (
    public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['staff']::public.member_role[])
      and staff_id = public.current_staff_id(salon_id)
    )
  );
