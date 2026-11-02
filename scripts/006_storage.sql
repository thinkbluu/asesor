-- ============================================================
-- ASESOR · 006 — Storage
-- Buckets:
--   client-photos (private) — {salon_id}/...  owner/manager/staff
--   receipts      (private) — {salon_id}/...  owner/manager only
--   salon-public  (public)  — read public, write owner/manager
-- Run after 003 (uses has_salon_role). Idempotent.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('client-photos', 'client-photos', false),
  ('receipts', 'receipts', false),
  ('salon-public', 'salon-public', true)
on conflict (id) do update
  set public = excluded.public;

-- Safe helper: first path segment as uuid (null if not a valid uuid).
create or replace function public.storage_salon_id(p_path text) returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_seg text;
  v_id uuid;
begin
  v_seg := coalesce((storage.foldername(p_path))[1], '');
  begin
    v_id := v_seg::uuid;
  exception when invalid_text_representation then
    v_id := null;
  end;
  return v_id;
end;
$$;

revoke execute on function public.storage_salon_id(text) from public, anon;
grant execute on function public.storage_salon_id(text) to authenticated;

-- ------------------------------------------------------------
-- client-photos: owner/manager/staff of the salon in the first path segment
-- ------------------------------------------------------------

drop policy if exists client_photos_bucket_select on storage.objects;
create policy client_photos_bucket_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-photos'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager', 'staff']::public.member_role[]
    )
  );

drop policy if exists client_photos_bucket_insert on storage.objects;
create policy client_photos_bucket_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-photos'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager', 'staff']::public.member_role[]
    )
  );

drop policy if exists client_photos_bucket_update on storage.objects;
create policy client_photos_bucket_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'client-photos'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager', 'staff']::public.member_role[]
    )
  )
  with check (
    bucket_id = 'client-photos'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager', 'staff']::public.member_role[]
    )
  );

drop policy if exists client_photos_bucket_delete on storage.objects;
create policy client_photos_bucket_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'client-photos'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager', 'staff']::public.member_role[]
    )
  );

-- ------------------------------------------------------------
-- receipts: owner/manager only
-- ------------------------------------------------------------

drop policy if exists receipts_bucket_select on storage.objects;
create policy receipts_bucket_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'receipts'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  );

drop policy if exists receipts_bucket_insert on storage.objects;
create policy receipts_bucket_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  );

drop policy if exists receipts_bucket_update on storage.objects;
create policy receipts_bucket_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'receipts'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  )
  with check (
    bucket_id = 'receipts'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  );

drop policy if exists receipts_bucket_delete on storage.objects;
create policy receipts_bucket_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'receipts'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  );

-- ------------------------------------------------------------
-- salon-public: read public, write owner/manager
-- ------------------------------------------------------------

drop policy if exists salon_public_bucket_select on storage.objects;
create policy salon_public_bucket_select on storage.objects
  for select to public
  using (bucket_id = 'salon-public');

drop policy if exists salon_public_bucket_insert on storage.objects;
create policy salon_public_bucket_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'salon-public'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  );

drop policy if exists salon_public_bucket_update on storage.objects;
create policy salon_public_bucket_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'salon-public'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  )
  with check (
    bucket_id = 'salon-public'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  );

drop policy if exists salon_public_bucket_delete on storage.objects;
create policy salon_public_bucket_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'salon-public'
    and public.storage_salon_id(name) is not null
    and public.has_salon_role(
      public.storage_salon_id(name),
      array['owner', 'manager']::public.member_role[]
    )
  );
