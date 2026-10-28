"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"
import {
  productSchema,
  movementSchema,
  productLinkSchema,
  type UserMovementType,
} from "@/lib/validation/stocuri"
import type { ProductView, MovementView } from "@/lib/mappers/stocuri"
import {
  listProducts as dbListProducts,
  listMovements as dbListMovements,
  listLinkableServices as dbListLinkableServices,
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deactivateProduct as dbDeactivateProduct,
  createMovement as dbCreateMovement,
  setProductServiceLinks as dbSetProductServiceLinks,
  type StockRole,
} from "@/lib/data/stocuri"

// Server actions for the Stocuri page (P8 part 1).
//
// Role matrix (mirrors scripts/004 + 013 RLS):
//   * owner/manager: full product CRUD (incl. cost_price), all movement
//     types, service links;
//   * receptionist: movements receptie/pierdere/retur only — no product
//     edits, no ajustare, no consum;
//   * staff: read-only (no mutating action passes the role guard).

const MANAGE_ROLES: StockRole[] = ["owner", "manager"]
const MOVEMENT_ROLES: StockRole[] = ["owner", "manager", "receptionist"]
// Movement types receptionist may create (ajustare/consum excluded).
const RECEPTIONIST_TYPES: UserMovementType[] = ["receptie", "pierdere", "retur"]

function refresh() {
  revalidatePath("/app/stocuri")
  revalidatePath("/app")
}

async function requireStockRole(roles: StockRole[]) {
  // requireRole redirects when the role is not allowed or there is no active
  // salon, so after it returns both are guaranteed — narrow for TS here.
  const session = await requireRole(roles)
  return { session, salon: session.salon!, role: session.role as StockRole }
}

// ------------------------------------------------------------
// Queries (used by the server page; exposed as actions for refresh flows)
// ------------------------------------------------------------

export async function listProductsAction(): Promise<ActionResult<{ items: ProductView[] }>> {
  const guard = await requireStockRole(["owner", "manager", "receptionist", "staff"])
  if (!guard) return { ok: false, error: "Nu ai un salon activ." }
  const result = await dbListProducts(guard.salon.id, guard.role)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

export async function listMovementsAction(): Promise<ActionResult<{ items: MovementView[] }>> {
  const guard = await requireStockRole(["owner", "manager", "receptionist", "staff"])
  if (!guard) return { ok: false, error: "Nu ai un salon activ." }
  const result = await dbListMovements(guard.salon.id)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

export async function listLinkableServicesAction(): Promise<
  ActionResult<{ items: { id: string; name: string }[] }>
> {
  const guard = await requireStockRole(["owner", "manager"])
  if (!guard) return { ok: false, error: "Nu ai un salon activ." }
  const result = await dbListLinkableServices(guard.salon.id)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

// ------------------------------------------------------------
// Products — owner/manager only
// ------------------------------------------------------------

export async function createProductAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const guard = await requireStockRole(MANAGE_ROLES)
  if (!guard) return { ok: false, error: "Nu ai permisiunea să gestionezi produsele." }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await dbCreateProduct(guard.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true, data: { id: result.data.id } }
}

export async function updateProductAction(input: unknown): Promise<ActionResult> {
  const guard = await requireStockRole(MANAGE_ROLES)
  if (!guard) return { ok: false, error: "Nu ai permisiunea să gestionezi produsele." }

  const parsed = z
    .object({ id: z.string().uuid("Produs invalid.") })
    .and(productSchema)
    .safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const { id, ...product } = parsed.data
  const result = await dbUpdateProduct(guard.salon.id, id, product)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true }
}

export async function deactivateProductAction(input: unknown): Promise<ActionResult> {
  const guard = await requireStockRole(MANAGE_ROLES)
  if (!guard) return { ok: false, error: "Nu ai permisiunea să gestionezi produsele." }

  const parsed = z.object({ id: z.string().uuid("Produs invalid.") }).safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await dbDeactivateProduct(guard.salon.id, parsed.data.id)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true }
}

// ------------------------------------------------------------
// Movements — o/m all types; receptionist receptie/pierdere/retur
// ------------------------------------------------------------

export async function createMovementAction(input: unknown): Promise<ActionResult> {
  const guard = await requireStockRole(MOVEMENT_ROLES)
  if (!guard) return { ok: false, error: "Nu ai permisiunea să înregistrezi mișcări de stoc." }

  const parsed = movementSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  // Receptionist restriction — RLS (script 013) enforces the same rule.
  if (guard.role === "receptionist" && !RECEPTIONIST_TYPES.includes(parsed.data.type)) {
    return { ok: false, error: "Nu ai permisiunea pentru acest tip de mișcare." }
  }

  const result = await dbCreateMovement(guard.salon.id, guard.session.user.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true }
}

// ------------------------------------------------------------
// Service links — owner/manager (from the product form)
// ------------------------------------------------------------

export async function setProductServiceLinksAction(input: unknown): Promise<ActionResult> {
  const guard = await requireStockRole(MANAGE_ROLES)
  if (!guard) return { ok: false, error: "Nu ai permisiunea să gestionezi produsele." }

  const parsed = productLinkSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await dbSetProductServiceLinks(guard.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  revalidatePath("/app/setari")
  return { ok: true }
}
