import "server-only"

import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { DataResult } from "@/lib/data/echipa"
import { dbError } from "@/lib/data/echipa"
import {
  mapTransaction,
  mapExpense,
  mapDayClose,
  mapFinReport,
  bucharestDay,
  type TransactionView,
  type ExpenseView,
  type DayCloseView,
  type FinReport,
  type PaymentMethod,
} from "@/lib/mappers/financiar"
import type { Database } from "@/lib/supabase/types"

type TxJoin = {
  transaction: Database["public"]["Tables"]["transactions"]["Row"]
  client: { first_name: string; last_name: string } | null
  staff: { first_name: string; last_name: string } | null
  appointment_services: { name_snapshot: string }[] | null
}

// ------------------------------------------------------------
// Transactions
// ------------------------------------------------------------

export async function listTransactions(
  salonId: string,
  filters: { from?: string; to?: string; staffId?: string; method?: PaymentMethod },
): Promise<DataResult<TransactionView[]>> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from("transactions")
    .select(
      "*, client:clients(first_name, last_name), staff:staff(first_name, last_name), appointment_services(name_snapshot)",
    )
    .eq("salon_id", salonId)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(500)
  if (filters.from) query = query.gte("paid_at", `${filters.from}T00:00:00+03:00`)
  if (filters.to) query = query.lte("paid_at", `${filters.to}T23:59:59+03:00`)
  if (filters.staffId) query = query.eq("staff_id", filters.staffId)
  if (filters.method) query = query.eq("payment_method", filters.method)

  const { data, error } = await query
  if (error) return dbError("listTransactions", error)
  return { ok: true, data: ((data ?? []) as unknown as TxJoin[]).map(mapTransaction) }
}

/** Refund = status → rambursata with a reason. Day lock is enforced by the
 *  014 trigger; the action layer checks it first for a friendly error. */
export async function refundTransaction(
  salonId: string,
  id: string,
  reason: string,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { data: row, error: fetchError } = await supabase
    .from("transactions")
    .select("id, paid_at, created_at")
    .eq("id", id)
    .eq("salon_id", salonId)
    .maybeSingle()
  if (fetchError) return dbError("refundTransaction", fetchError)
  if (!row) return { ok: false, error: "Tranzacția nu a fost găsită." }

  const day = bucharestDay(row.paid_at ?? row.created_at)
  const closed = await isDayClosed(salonId, day)
  if (!closed.ok) return { ok: false, error: closed.error }
  if (closed.data) return { ok: false, error: "Ziua a fost închisă. Redeschiderea se face doar de proprietar." }

  const { error } = await supabase
    .from("transactions")
    .update({ status: "rambursata", notes: reason })
    .eq("id", id)
    .eq("salon_id", salonId)
  if (error) return dbError("refundTransaction", error)
  return { ok: true }
}

// ------------------------------------------------------------
// Day lock
// ------------------------------------------------------------

export async function isDayClosed(
  salonId: string,
  day: string,
): Promise<DataResult<boolean>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("day_closes")
    .select("id, reopened_at")
    .eq("salon_id", salonId)
    .eq("day", day)
    .maybeSingle()
  if (error) return dbError("isDayClosed", error)
  return { ok: true, data: !!data && !data.reopened_at }
}

/** Totals per method for one day (incasat only), for the close dialog. */
export async function getDayTotals(
  salonId: string,
  day: string,
): Promise<DataResult<{ numerar: number; card: number; transfer: number; tips: number; discounts: number }>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, tip, discount, payment_method, status, paid_at, created_at")
    .eq("salon_id", salonId)
    .eq("status", "incasat")
    .gte("paid_at", `${day}T00:00:00+03:00`)
    .lte("paid_at", `${day}T23:59:59+03:00`)
  if (error) return dbError("getDayTotals", error)

  const totals = { numerar: 0, card: 0, transfer: 0, tips: 0, discounts: 0 }
  for (const row of (data ?? []) as {
    amount: number
    tip: number
    discount: number
    payment_method: string
  }[]) {
    const key = row.payment_method as keyof typeof totals
    if (key === "numerar" || key === "card" || key === "transfer") totals[key] += Number(row.amount)
    totals.tips += Number(row.tip)
    totals.discounts += Number(row.discount)
  }
  return { ok: true, data: totals }
}

export async function closeDay(
  salonId: string,
  day: string,
  cashCounted: number,
  notes: string,
  userId: string,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const totals = await getDayTotals(salonId, day)
  if (!totals.ok) return { ok: false, error: totals.error }

  const { data: existing } = await supabase
    .from("day_closes")
    .select("id, reopened_at")
    .eq("salon_id", salonId)
    .eq("day", day)
    .maybeSingle()
  if (existing && !existing.reopened_at) {
    return { ok: false, error: "Ziua a fost închisă. Redeschiderea se face doar de proprietar." }
  }

  const payload = {
    salon_id: salonId,
    day,
    totals: totals.data,
    cash_counted: cashCounted,
    difference: Math.round((cashCounted - totals.data.numerar) * 100) / 100,
    closed_by: userId,
    closed_at: new Date().toISOString(),
    notes: notes || null,
  }

  const { error } = existing
    ? await supabase.from("day_closes").update(payload).eq("id", existing.id)
    : await supabase.from("day_closes").insert(payload)
  if (error) return dbError("closeDay", error)
  return { ok: true }
}

export async function reopenDay(salonId: string, day: string, userId: string): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("day_closes")
    .update({ reopened_at: new Date().toISOString(), reopened_by: userId })
    .eq("salon_id", salonId)
    .eq("day", day)
  if (error) return dbError("reopenDay", error)
  return { ok: true }
}

export async function listDayCloses(salonId: string): Promise<DataResult<DayCloseView[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("day_closes")
    .select("*")
    .eq("salon_id", salonId)
    .order("day", { ascending: false })
    .limit(90)
  if (error) return dbError("listDayCloses", error)
  return { ok: true, data: ((data ?? []) as DayCloseRowAlias[]).map(mapDayClose) }
}
type DayCloseRowAlias = Database["public"]["Tables"]["day_closes"]["Row"]

// ------------------------------------------------------------
// Expenses
// ------------------------------------------------------------

export async function listExpenses(
  salonId: string,
  filters: { from?: string; to?: string },
): Promise<DataResult<ExpenseView[]>> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("salon_id", salonId)
    .order("spent_on", { ascending: false })
    .limit(500)
  if (filters.from) query = query.gte("spent_on", filters.from)
  if (filters.to) query = query.lte("spent_on", filters.to)
  const { data, error } = await query
  if (error) return dbError("listExpenses", error)
  return { ok: true, data: ((data ?? []) as Database["public"]["Tables"]["expenses"]["Row"][]).map(mapExpense) }
}

export async function upsertExpense(
  salonId: string,
  input: {
    id?: string
    spentOn: string
    category: string
    description: string
    amount: number
    frequency: string
    notes: string
  },
  userId: string,
): Promise<DataResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient()
  const payload = {
    salon_id: salonId,
    spent_on: input.spentOn,
    category: input.category as Database["public"]["Tables"]["expenses"]["Insert"]["category"],
    description: input.description || null,
    amount: input.amount,
    frequency: input.frequency,
    notes: input.notes || null,
    created_by: userId,
  }
  if (input.id) {
    const { data, error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", input.id)
      .eq("salon_id", salonId)
      .select("id")
      .single()
    if (error) return dbError("upsertExpense", error)
    return { ok: true, data: { id: (data as { id: string }).id } }
  }
  const { data, error } = await supabase.from("expenses").insert(payload).select("id").single()
  if (error) return dbError("upsertExpense", error)
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function deleteExpense(salonId: string, id: string): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("salon_id", salonId)
  if (error) return dbError("deleteExpense", error)
  return { ok: true }
}

/** Receipt upload to the private receipts bucket: {salon_id}/receipts/{uuid}.{ext} */
export async function uploadReceipt(
  salonId: string,
  expenseId: string,
  file: File,
): Promise<DataResult<{ path: string }>> {
  const supabase = await createSupabaseServerClient()

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Format nesuportat. Acceptăm JPEG, PNG, WebP sau PDF." }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Fișierul depășește 10 MB." }
  }

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1].replace("jpeg", "jpg")
  const path = `${salonId}/receipts/${randomUUID()}.${ext}`
  const body = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, body, { contentType: file.type, upsert: false })
  if (uploadError) return dbError("uploadReceipt.storage", uploadError)

  const { error } = await supabase
    .from("expenses")
    .update({ receipt_path: path })
    .eq("id", expenseId)
    .eq("salon_id", salonId)
  if (error) {
    await supabase.storage.from("receipts").remove([path])
    return dbError("uploadReceipt", error)
  }
  return { ok: true, data: { path } }
}

/** Short-lived signed URL for viewing a receipt. */
export async function getReceiptUrl(
  salonId: string,
  path: string,
): Promise<DataResult<{ url: string }>> {
  const supabase = await createSupabaseServerClient()
  // Path must belong to this salon — defense in depth against forged paths.
  if (!path.startsWith(`${salonId}/receipts/`)) {
    return { ok: false, error: "Chitanța nu aparține salonului." }
  }
  const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 600)
  if (error) return dbError("getReceiptUrl", error)
  return { ok: true, data: { url: data.signedUrl } }
}

/** Recurring expense catch-up — idempotent, called on page load. */
export async function generateRecurring(salonId: string): Promise<DataResult<{ generated: number }>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("generate_recurring_expenses", { p_salon: salonId })
  if (error) return dbError("generateRecurring", error)
  return { ok: true, data: { generated: Number(data ?? 0) } }
}

// ------------------------------------------------------------
// Reports
// ------------------------------------------------------------

export async function getReport(salonId: string, from: string, to: string): Promise<DataResult<FinReport>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("fin_report", { p_salon: salonId, p_from: from, p_to: to })
  if (error) return dbError("getReport", error)
  return { ok: true, data: mapFinReport(data) }
}

// ------------------------------------------------------------
// Staff list for filters (names only — no financial data)
// ------------------------------------------------------------

export async function listStaffNames(
  salonId: string,
): Promise<DataResult<{ id: string; name: string }[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("staff")
    .select("id, first_name, last_name")
    .eq("salon_id", salonId)
    .is("deleted_at", null)
    .order("first_name")
  if (error) return dbError("listStaffNames", error)
  return {
    ok: true,
    data: ((data ?? []) as { id: string; first_name: string; last_name: string }[]).map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`.trim(),
    })),
  }
}
