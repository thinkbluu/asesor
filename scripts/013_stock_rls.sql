-- ============================================================
-- 013 — Stock: tighten movement RLS + notes
--
-- P8 part 1 contract:
--   * stock_movements INSERT: owner/manager may insert every type
--     (receptie, ajustare, pierdere, retur — consum is written by the
--     on_appointment_finalized trigger, security definer, unaffected).
--   * receptionist may insert only receptie / pierdere / retur — NOT
--     ajustare (inventory count is a management operation) and NOT consum.
--   * staff: no insert (read-only stock page).
--   * UPDATE stays o/m/r (corrections), DELETE owner/manager only.
--   * products table stays owner/manager for all operations (008);
--     non-managers read products_public (no cost_price).
--   * service_products unchanged (004): select all members,
--     write o/m/r, delete o/m.
--
-- The action layer (app/app/stocuri/actions.ts) mirrors these rules.
-- Run AFTER 001–012. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. stock_movements insert: type-aware per role
-- ------------------------------------------------------------
drop policy if exists stock_movements_insert on public.stock_movements;
create policy stock_movements_insert on public.stock_movements
  for insert to authenticated
  with check (
    public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[])
    or (
      public.has_salon_role(salon_id, array['receptionist']::public.member_role[])
      and type in ('receptie', 'pierdere', 'retur')
    )
  );

-- ------------------------------------------------------------
-- 2. Re-assert the rest (unchanged semantics, kept adjacent for review)
-- ------------------------------------------------------------
drop policy if exists stock_movements_select on public.stock_movements;
create policy stock_movements_select on public.stock_movements
  for select to authenticated
  using (public.is_salon_member(salon_id));

drop policy if exists stock_movements_update on public.stock_movements;
create policy stock_movements_update on public.stock_movements
  for update to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]))
  with check (public.has_salon_role(salon_id, array['owner', 'manager', 'receptionist']::public.member_role[]));

drop policy if exists stock_movements_delete on public.stock_movements;
create policy stock_movements_delete on public.stock_movements
  for delete to authenticated
  using (public.has_salon_role(salon_id, array['owner', 'manager']::public.member_role[]));
