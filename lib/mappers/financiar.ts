import type { Database } from "@/lib/supabase/types"

// ─── View types ──────────────────────────────────────────────────────────────

export type PaymentMethod = "numerar" | "card" | "transfer"
export type TransactionStatus = "incasat" | "rambursata" | "in_asteptare"
export type ExpenseCategory =
  | "chirie"
  | "salarii"
  | "produse"
  | "marketing"
  | "utilitati"
  | "echipamente"
  | "altele"
export type ExpenseFrequency = "unica" | "lunar" | "saptamanal"

export interface TransactionView {
  id: string
  paidAt: string // ISO
  day: string // yyyy-mm-dd (Europe/Bucharest)
  clientName: string
  clientId: string | null
  appointmentId: string | null
  services: string[]
  staffName: string
  staffId: string | null
  amount: number
  tip: number
  discount: number
  paymentMethod: PaymentMethod
  status: TransactionStatus
  notes: string
}

export interface ExpenseView {
  id: string
  spentOn: string
  category: ExpenseCategory
  description: string
  amount: number
  frequency: ExpenseFrequency
  parentId: string | null
  receiptPath: string | null
  notes: string
}

export interface DayCloseView {
  id: string
  day: string
  totals: { numerar: number; card: number; transfer: number; tips: number; discounts: number }
  cashCounted: number | null
  difference: number | null
  closedAt: string | null
  reopenedAt: string | null
}

export interface FinReport {
  byDay: { day: string; revenue: number; tips: number; count: number }[]
  byStaff: { staffId: string | null; staffName: string; revenue: number; tips: number; count: number }[]
  byService: { serviceName: string; revenue: number; count: number }[]
  paymentMix: { paymentMethod: PaymentMethod; revenue: number; count: number }[]
  avgTicket: number
  refunds: { day: string; amount: number; count: number }[]
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  numerar: "Numerar",
  card: "Card",
  transfer: "Transfer",
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  chirie: "Chirie",
  salarii: "Salarii",
  produse: "Produse",
  marketing: "Marketing",
  utilitati: "Utilități",
  echipamente: "Echipamente",
  altele: "Altele",
}

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  chirie: "#ef4444",
  salarii: "#f97316",
  produse: "#eab308",
  marketing: "#8b5cf6",
  utilitati: "#06b6d4",
  echipamente: "#ec4899",
  altele: "#6b7280",
}

export const FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  unica: "Unică",
  lunar: "Lunar",
  saptamanal: "Săptămânal",
}

export function formatRON(amount: number): string {
  return (
    new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " Lei"
  )
}

export function formatRONShort(amount: number): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(amount / 1000) + "k Lei"
  }
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(amount) + " Lei"
}

// ─── DB row shapes ───────────────────────────────────────────────────────────

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"]
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]
type DayCloseRow = Database["public"]["Tables"]["day_closes"]["Row"]

interface JoinedTx {
  transaction: TransactionRow
  client: { first_name: string; last_name: string } | null
  staff: { first_name: string; last_name: string } | null
  appointment_services: { name_snapshot: string }[] | null
}

/** Bucharest calendar day of a timestamp, as yyyy-mm-dd. */
export function bucharestDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Bucharest" })
}

export function mapTransaction(j: JoinedTx): TransactionView {
  const t = j.transaction
  return {
    id: t.id,
    paidAt: t.paid_at ?? t.created_at,
    day: bucharestDay(t.paid_at ?? t.created_at),
    clientName: j.client ? `${j.client.first_name} ${j.client.last_name}`.trim() : "Fără client",
    clientId: t.client_id,
    appointmentId: t.appointment_id,
    services: (j.appointment_services ?? []).map((s) => s.name_snapshot),
    staffName: j.staff ? `${j.staff.first_name} ${j.staff.last_name}`.trim() : "—",
    staffId: t.staff_id,
    amount: Number(t.amount),
    tip: Number(t.tip),
    discount: Number(t.discount),
    paymentMethod: t.payment_method as PaymentMethod,
    status: t.status as TransactionStatus,
    notes: t.notes ?? "",
  }
}

export function mapExpense(row: ExpenseRow): ExpenseView {
  return {
    id: row.id,
    spentOn: row.spent_on,
    category: row.category as ExpenseCategory,
    description: row.description ?? "",
    amount: Number(row.amount),
    frequency: row.frequency as ExpenseFrequency,
    parentId: row.parent_id,
    receiptPath: row.receipt_path,
    notes: row.notes ?? "",
  }
}

export function mapDayClose(row: DayCloseRow): DayCloseView {
  const raw = (row.totals ?? {}) as Record<string, unknown>
  const num = (k: string) => (typeof raw[k] === "number" ? (raw[k] as number) : 0)
  return {
    id: row.id,
    day: row.day,
    totals: {
      numerar: num("numerar"),
      card: num("card"),
      transfer: num("transfer"),
      tips: num("tips"),
      discounts: num("discounts"),
    },
    cashCounted: row.cash_counted != null ? Number(row.cash_counted) : null,
    difference: row.difference != null ? Number(row.difference) : null,
    closedAt: row.closed_at,
    reopenedAt: row.reopened_at,
  }
}

/** Report JSON from the fin_report RPC (snake_case keys) → typed view. */
export function mapFinReport(raw: unknown): FinReport {
  const r = (raw ?? {}) as Record<string, unknown>
  const arr = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? (v as Record<string, unknown>[]) : []
  const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v))
  const num = (v: unknown) => Number(v ?? 0)
  return {
    byDay: arr(r.byDay).map((d) => ({
      day: str(d.day),
      revenue: num(d.revenue),
      tips: num(d.tips),
      count: num(d.count),
    })),
    byStaff: arr(r.byStaff).map((d) => ({
      staffId: d.staff_id == null ? null : String(d.staff_id),
      staffName: str(d.staff_name, "—"),
      revenue: num(d.revenue),
      tips: num(d.tips),
      count: num(d.count),
    })),
    byService: arr(r.byService).map((d) => ({
      serviceName: str(d.service_name),
      revenue: num(d.revenue),
      count: num(d.count),
    })),
    paymentMix: arr(r.paymentMix).map((d) => ({
      paymentMethod: str(d.payment_method) as PaymentMethod,
      revenue: num(d.revenue),
      count: num(d.count),
    })),
    avgTicket: num(r.avgTicket),
    refunds: arr(r.refunds).map((d) => ({
      day: str(d.day),
      amount: num(d.amount),
      count: num(d.count),
    })),
  }
}
