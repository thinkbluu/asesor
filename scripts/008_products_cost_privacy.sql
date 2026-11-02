-- ============================================================
-- 008 — products cost privacy (P2 follow-up fix)
-- Staff and receptionists must not be able to read products.cost_price
-- through PostgREST.
--
-- Final state (mirrored in 004/005 comments):
--   * products table: select/insert/update/delete for owner/manager ONLY.
--   * products_public: a view NOT using security_invoker (owned by the
--     migration role / postgres, so it bypasses the products table RLS),
--     filtered with where is_salon_member(salon_id), exposing every column
--     EXCEPT cost_price.
--   * select on the view granted to authenticated only (never anon).
--
-- Run AFTER 001–007. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. products table: owner/manager only, all four operations
-- ------------------------------------------------------------

drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists products_insert on public.products;
create policy products_insert on public.products
  for insert to authenticated
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists products_update on public.products;
create policy products_update on public.products
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists products_delete on public.products;
create policy products_delete on public.products
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));

-- ------------------------------------------------------------
-- 2. products_public view: owner-rights view (no security_invoker),
--    membership-filtered, without cost_price
-- ------------------------------------------------------------

drop view if exists public.products_public;

create view public.products_public as
  select p.id,
         p.salon_id,
         p.name,
         p.brand,
         p.category,
         p.sku,
         p.unit,
         p.stock,
         p.min_stock,
         p.retail_price,
         p.supplier_name,
         p.supplier_phone,
         p.supplier_email,
         p.notes,
         p.active,
         p.created_at,
         p.updated_at
  from public.products p
  where public.is_salon_member(p.salon_id);

-- The view is owned by the role that runs this migration (postgres on
-- Supabase). Because it does NOT declare security_invoker, its queries run
-- with the owner's privileges and bypass the products table RLS; the
-- is_salon_member() filter (SECURITY DEFINER) is what restricts rows to
-- salons the caller belongs to. cost_price is not in the projection, so it
-- cannot leak through PostgREST, filters, or embedded resources.

revoke all on public.products_public from anon, authenticated;
grant select on public.products_public to authenticated;
