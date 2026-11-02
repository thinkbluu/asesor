import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import type { ProductInput, MovementInput, ProductLinkInput } from "@/lib/validation/stocuri"
import type { ProductView, MovementView, LinkedService } from "@/lib/mappers/stocuri"
import { toProductView, toMovementView } from "@/lib/mappers/stocuri"

// Server-only data layer for the Stocuri page (P8 part 1).
//
// Role split enforced here AND by RLS:
//   * owner/manager read the `products` table (cost_price included) and have
//     full CRUD;
//   * every other role reads `products_public` (scripts/008 — postgres-owned
//     view without cost_price), so cost_price never leaves the server for
//     receptionist/staff;
//   * stock changes ONLY by inserting stock_movements rows — the
//     apply_stock_movement trigger (scripts/003) updates products.stock.
//     Nowhere in this codebase is products.stock updated directly.

type DataResult<T = void> = (T extends void ? { ok: true } : { ok: true; data: T }) | { ok: false; error: string }

function dbError(scope: string, error: unknown): { ok: false; error: string } {
  console.error(`[v0] ${scope}:`, error)
  return { ok: false, error: "A apărut o eroare. Încearcă din nou." }
}

export type StockRole = "owner" | "manager" | "receptionist" | "staff"

// ------------------------------------------------------------
// Products
// ------------------------------------------------------------

export async function listProducts(
  salonId: string,
  role: StockRole,
): Promise<DataResult<ProductView[]>> {
  const supabase = await createSupabaseServerClient()
  const canSeeCost = role === "owner" || role === "manager"

  const [productsRes, linksRes, servicesRes] = await Promise.all([
    canSeeCost
      ? supabase
          .from("products")
          .select("*")
          .eq("salon_id", salonId)
          .order("name", { ascending: true })
      : supabase
          .from("products_public")
          .select("*")
          .eq("salon_id", salonId)
          .order("name", { ascending: true }),
    // No FK embed for service_products → services in the generated types —
    // fetch both sides and join in code.
    supabase
      .from("service_products")
      .select("product_id, service_id, quantity_per_use")
      .eq("salon_id", salonId),
    supabase.from("services").select("id, name").eq("salon_id", salonId),
  ])
  if (productsRes.error) return dbError("listProducts", productsRes.error)
  if (linksRes.error) return dbError("listProducts.links", linksRes.error)
  if (servicesRes.error) return dbError("listProducts.services", servicesRes.error)

  const serviceNames = new Map(
    ((servicesRes.data ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]),
  )
  const servicesByProduct = new Map<string, LinkedService[]>()
  for (const link of (linksRes.data ?? []) as {
    product_id: string
    service_id: string
    quantity_per_use: number
  }[]) {
    const list = servicesByProduct.get(link.product_id) ?? []
    list.push({
      serviceId: link.service_id,
      serviceName: serviceNames.get(link.service_id) ?? "",
      quantityPerUse: Number(link.quantity_per_use),
    })
    servicesByProduct.set(link.product_id, list)
  }

  return {
    ok: true,
    data: ((productsRes.data ?? []) as (Database["public"]["Tables"]["products"]["Row"] | Database["public"]["Views"]["products_public"]["Row"])[]).map(
      (row) => toProductView(row, servicesByProduct.get(row.id) ?? []),
    ),
  }
}

export async function createProduct(
  salonId: string,
  input: ProductInput,
): Promise<DataResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("products")
    .insert({
      salon_id: salonId,
      name: input.name,
      brand: input.brand || null,
      category: input.category || null,
      sku: input.sku || null,
      unit: input.unit,
      min_stock: input.minStock,
      cost_price: input.costPrice ?? null,
      retail_price: input.retailPrice ?? null,
      supplier_name: input.supplierName || null,
      supplier_phone: input.supplierPhone || null,
      supplier_email: input.supplierEmail || null,
      notes: input.notes || null,
      active: input.active,
    })
    .select("id")
    .single()
  if (error) return dbError("createProduct", error)
  return { ok: true, data: { id: data.id } }
}

export async function updateProduct(
  salonId: string,
  id: string,
  input: ProductInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      brand: input.brand || null,
      category: input.category || null,
      sku: input.sku || null,
      unit: input.unit,
      min_stock: input.minStock,
      cost_price: input.costPrice ?? null,
      retail_price: input.retailPrice ?? null,
      supplier_name: input.supplierName || null,
      supplier_phone: input.supplierPhone || null,
      supplier_email: input.supplierEmail || null,
      notes: input.notes || null,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("salon_id", salonId)
  if (error) return dbError("updateProduct", error)
  return { ok: true }
}

/** Soft delete: products have no deleted_at — deactivate instead. */
export async function deactivateProduct(salonId: string, id: string): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("products")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("salon_id", salonId)
  if (error) return dbError("deactivateProduct", error)
  return { ok: true }
}

// ------------------------------------------------------------
// Movements — stock changes ONLY here (trigger applies the delta)
// ------------------------------------------------------------

export async function listMovements(
  salonId: string,
  limit = 200,
): Promise<DataResult<MovementView[]>> {
  const supabase = await createSupabaseServerClient()
  const [movementsRes, productsRes, appointmentsRes] = await Promise.all([
    supabase
      .from("stock_movements")
      .select("*")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("products_public").select("id, unit").eq("salon_id", salonId),
    supabase.from("appointments").select("id, starts_at").eq("salon_id", salonId),
  ])
  if (movementsRes.error) return dbError("listMovements", movementsRes.error)
  if (productsRes.error) return dbError("listMovements.products", productsRes.error)
  if (appointmentsRes.error) return dbError("listMovements.appointments", appointmentsRes.error)

  const units = new Map(
    ((productsRes.data ?? []) as { id: string; unit: string }[]).map((p) => [p.id, p.unit]),
  )
  const appointmentStarts = new Map(
    ((appointmentsRes.data ?? []) as { id: string; starts_at: string }[]).map((a) => [a.id, a.starts_at]),
  )

  return {
    ok: true,
    data: ((movementsRes.data ?? []) as Database["public"]["Tables"]["stock_movements"]["Row"][]).map((row) =>
      toMovementView(
        row,
        // Product name is resolved client-side from the products list; pass
        // the id through and let the view join on it.
        "",
        units.get(row.product_id) ?? "buc",
        row.appointment_id ? (appointmentStarts.get(row.appointment_id) ?? null) : null,
      ),
    ),
  }
}

export async function createMovement(
  salonId: string,
  userId: string,
  input: MovementInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  let quantity: number
  let note = input.note || null
  let invoiceNumber: string | null = null

  if (input.type === "ajustare") {
    // Inventory count: read the current stock (products_public is readable by
    // every member) and write the difference as one signed movement.
    const { data: product, error: productError } = await supabase
      .from("products_public")
      .select("stock")
      .eq("id", input.productId)
      .eq("salon_id", salonId)
      .maybeSingle()
    if (productError) return dbError("createMovement.stock", productError)
    if (!product) return { ok: false, error: "Produsul nu a fost găsit." }
    const counted = input.countedStock ?? 0
    quantity = counted - Number(product.stock)
    if (quantity === 0) return { ok: true } // nothing to correct
    note = note ?? `Inventar: countat ${counted}.`
  } else {
    quantity = input.quantity ?? 0
    if (input.type === "pierdere" || input.type === "retur") quantity = -Math.abs(quantity)
    if (input.type === "receptie") {
      invoiceNumber = input.invoiceNumber || null
      if (!note) note = "Recepție marfă"
    }
    if (quantity === 0) return { ok: false, error: "Cantitatea nu poate fi 0." }
  }

  const { error } = await supabase.from("stock_movements").insert({
    salon_id: salonId,
    product_id: input.productId,
    type: input.type,
    quantity,
    note,
    invoice_number: invoiceNumber,
    created_by: userId,
  })
  if (error) return dbError("createMovement", error)
  return { ok: true }
}

// ------------------------------------------------------------
// Service ↔ product links (quantity per use)
// ------------------------------------------------------------

export async function listLinkableServices(
  salonId: string,
): Promise<DataResult<{ id: string; name: string }[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("services")
    .select("id, name")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("name", { ascending: true })
  if (error) return dbError("listLinkableServices", error)
  return { ok: true, data: (data ?? []) as { id: string; name: string }[] }
}

export async function setProductServiceLinks(
  salonId: string,
  input: ProductLinkInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error: deleteError } = await supabase
    .from("service_products")
    .delete()
    .eq("product_id", input.productId)
    .eq("salon_id", salonId)
  if (deleteError) return dbError("setProductServiceLinks.delete", deleteError)

  if (input.links.length === 0) return { ok: true }

  const { error: insertError } = await supabase.from("service_products").insert(
    input.links.map((link) => ({
      salon_id: salonId,
      product_id: input.productId,
      service_id: link.serviceId,
      quantity_per_use: link.quantityPerUse,
    })),
  )
  if (insertError) return dbError("setProductServiceLinks.insert", insertError)
  return { ok: true }
}
