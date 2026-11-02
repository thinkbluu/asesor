import type { Database } from "@/lib/supabase/types"

type ProductRow = Database["public"]["Tables"]["products"]["Row"]
type ProductPublicRow = Database["public"]["Views"]["products_public"]["Row"]
type MovementRow = Database["public"]["Tables"]["stock_movements"]["Row"]

export interface LinkedService {
  serviceId: string
  serviceName: string
  quantityPerUse: number
}

export interface ProductView {
  id: string
  name: string
  brand: string | null
  category: string | null
  sku: string | null
  unit: string
  stock: number
  minStock: number
  retailPrice: number | null
  supplierName: string | null
  supplierPhone: string | null
  supplierEmail: string | null
  notes: string | null
  active: boolean
  linkedServices: LinkedService[]
  // Present ONLY for owner/manager (products table). Never set for other
  // roles — the server never reads cost_price on their behalf.
  costPrice?: number | null
}

export type MovementType = "receptie" | "consum" | "ajustare" | "pierdere" | "retur"

export interface MovementView {
  id: string
  productId: string
  productName: string
  unit: string
  type: MovementType
  quantity: number
  note: string | null
  invoiceNumber: string | null
  appointmentId: string | null
  // Start time of the linked appointment (consum rows), ISO string.
  appointmentStartAt: string | null
  createdAt: string
}

export type StockStatus = "ok" | "low" | "out"

export function stockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "out"
  if (minStock > 0 && stock <= minStock) return "low"
  return "ok"
}

/** Suggested order quantity: min_stock × 2 − stock, rounded up, at least 1. */
export function suggestedOrderQuantity(stock: number, minStock: number): number {
  return Math.max(1, Math.ceil(minStock * 2 - stock))
}

export function toProductView(
  row: ProductRow | ProductPublicRow,
  linkedServices: LinkedService[] = [],
): ProductView {
  const base: ProductView = {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    sku: row.sku,
    unit: row.unit,
    stock: Number(row.stock),
    minStock: Number(row.min_stock),
    retailPrice: row.retail_price != null ? Number(row.retail_price) : null,
    supplierName: row.supplier_name,
    supplierPhone: row.supplier_phone,
    supplierEmail: row.supplier_email,
    notes: row.notes,
    active: row.active,
    linkedServices,
  }
  // cost_price exists only on the products table row (owner/manager path).
  if ("cost_price" in row) {
    base.costPrice = row.cost_price != null ? Number(row.cost_price) : null
  }
  return base
}

export function toMovementView(
  row: MovementRow,
  productName: string,
  unit: string,
  appointmentStartAt: string | null,
): MovementView {
  return {
    id: row.id,
    productId: row.product_id,
    productName,
    unit,
    type: row.type,
    quantity: Number(row.quantity),
    note: row.note,
    invoiceNumber: row.invoice_number,
    appointmentId: row.appointment_id,
    appointmentStartAt,
    createdAt: row.created_at,
  }
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  receptie: "Recepție",
  consum: "Consum",
  ajustare: "Ajustare",
  pierdere: "Pierdere",
  retur: "Retur",
}
