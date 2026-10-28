import { requireRole } from "@/lib/auth/session"
import { listProducts, listMovements, listLinkableServices, type StockRole } from "@/lib/data/stocuri"
import { StocuriView } from "@/components/app/stocuri/stocuri-view"

// P8 part 1: stock management wired to Supabase.
// cost_price is read ONLY for owner/manager (products table); every other
// role is served from products_public (no cost_price column) — see
// lib/data/stocuri.ts.
export default async function StocuriPage() {
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  const salonId = session.salon!.id
  const role = session.role as StockRole

  const [productsRes, movementsRes, servicesRes] = await Promise.all([
    listProducts(salonId, role),
    listMovements(salonId),
    // Services for the product-form link editor — owner/manager only need it.
    role === "owner" || role === "manager" ? listLinkableServices(salonId) : Promise.resolve({ ok: true as const, data: [] }),
  ])

  return (
    <StocuriView
      role={role}
      products={productsRes.ok ? productsRes.data : []}
      movements={movementsRes.ok ? movementsRes.data : []}
      services={servicesRes.ok ? servicesRes.data : []}
      loadError={!productsRes.ok ? productsRes.error : !movementsRes.ok ? movementsRes.error : null}
    />
  )
}
