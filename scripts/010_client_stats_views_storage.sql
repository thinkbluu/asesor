-- 010 — P6: client stats view, allergy safety flags, client-photos bucket.
-- Mirrored in lib/supabase/types.ts (Views block).

-- ------------------------------------------------------------
-- client_stats: computed totals per client (never stored by hand).
-- security_invoker = true: rows are filtered by the underlying clients /
-- appointments RLS, so a member only ever sees stats for their own salon.
-- ------------------------------------------------------------
drop view if exists public.client_stats;
create view public.client_stats
with (security_invoker = true) as
select
  c.id as client_id,
  c.salon_id,
  count(a.id) filter (where a.status = 'finalizat')::int as total_visits,
  coalesce(sum(
    case when a.status = 'finalizat' then
      a.total_price - a.discount
    end
  ), 0)::numeric(10, 2) as total_spent,
  max(a.starts_at) filter (where a.status = 'finalizat') as last_visit_at
from public.clients c
left join public.appointments a on a.client_id = c.id
group by c.id, c.salon_id;

grant select on public.client_stats to authenticated;
revoke all on public.client_stats from anon;

-- ------------------------------------------------------------
-- client_safety_flags: boolean allergy marker for the calendar and the
-- appointment dialog. Deliberately NOT security_invoker: it must be readable
-- by every salon role (including receptionist — it is a safety signal), while
-- client_sensitive itself stays owner/manager/staff-only. The view exposes
-- ONLY the boolean — never the ciphertext, never the decrypted text.
-- ------------------------------------------------------------
drop view if exists public.client_safety_flags;
create view public.client_safety_flags
with (security_invoker = false) as
select
  cs.client_id,
  cs.salon_id,
  (cs.allergies_enc is not null and length(cs.allergies_enc) > 0) as has_allergies
from public.client_sensitive cs;

grant select on public.client_safety_flags to authenticated;
revoke all on public.client_safety_flags from anon;

-- ------------------------------------------------------------
-- Storage: private bucket for client photos (before/after gallery).
-- Path convention: {salon_id}/{client_id}/{uuid}.webp
-- Server-side upload validates MIME (jpeg/png/webp/heic) and size <= 8 MB;
-- the bucket limits mirror that as defense in depth.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-photos',
  'client-photos',
  false,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Bucket policies: salon members read; owner/manager/staff write; the path
-- prefix {salon_id}/... is enforced by the app layer (storage_path column).
-- Storage policies live on storage.objects.
drop policy if exists "client-photos read" on storage.objects;
create policy "client-photos read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-photos'
    and public.is_salon_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "client-photos insert" on storage.objects;
create policy "client-photos insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-photos'
    and public.has_salon_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'manager', 'staff']::public.member_role[]
    )
  );

drop policy if exists "client-photos delete" on storage.objects;
create policy "client-photos delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'client-photos'
    and public.has_salon_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'manager']::public.member_role[]
    )
  );
