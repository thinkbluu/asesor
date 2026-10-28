"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth/session"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"
import {
  checkoutSchema,
  refundSchema,
  expenseSchema,
  dayCloseSchema,
  dayReopenSchema,
} from "@/lib/validation/financiar"
import { writeAudit } from "@/lib/audit"
import { internalActionError } from "@/lib/action-errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import * as db from "@/lib/data/financiar"
import type { PaymentMethod, TransactionView, ExpenseView, DayCloseView, FinReport } from "@/lib/mappers/financiar"
type DayTotals = { numerar: number; card: number; transfer: number; tips: number; discounts: number }

// Financiar is owner/manager only — the layout guard blocks the page, and
// every action below re-checks the role server-side.
const FIN_ROLES = ["owner", "manager"] as const

function refresh() {
  revalidatePath("/app/financiar")
  revalidatePath("/app")
}

// ─── Checkout (also callable from Programări by receptionist) ────────────────

export async function checkoutAction(input: unknown): Promise<ActionResult<{ total: number }>> {
  // Receptionist runs checkout from Programări, so the role gate here is
  // o/m/r — NOT the financiar page gate.
  const session = await requireRole(["owner", "manager", "receptionist"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }
  const d = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("checkout_appointment_rpc", {
    p_appointment_id: d.appointmentId,
    p_discount: d.discount,
    p_tip: d.tip,
    p_method1: d.method1,
    p_amount1: d.amount1,
    p_method2: d.split ? d.method2 : null,
    p_amount2: d.split ? d.amount2 : null,
    p_redeem_points: d.redeemPoints,
  })
  if (error) return internalActionError("checkoutAction", error)

  const result = data as { total?: number }
  refresh()
  return { ok: true, data: { total: Number(result?.total ?? 0) } }
}

/** Client loyalty balance + ron_per_point for the checkout dialog. */
export async function getClientLoyaltyAction(
  clientId: string,
): Promise<ActionResult<{ points: number; ronPerPoint: number }>> {
  const session = await requireRole(["owner", "manager", "receptionist"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const supabase = await createSupabaseServerClient()
  const [{ data: client, error: clientError }, { data: salon, error: salonError }] = await Promise.all([
    supabase.from("clients").select("loyalty_points").eq("id", clientId).eq("salon_id", session.salon.id).maybeSingle(),
    supabase.from("salons").select("loyalty_config").eq("id", session.salon.id).single(),
  ])
  if (clientError) return { ok: false, error: clientError.message }
  if (salonError) return { ok: false, error: salonError.message }

  const cfg = (salon?.loyalty_config ?? {}) as Record<string, unknown>
  return {
    ok: true,
    data: {
      points: Number((client as { loyalty_points: number } | null)?.loyalty_points ?? 0),
      ronPerPoint: Number(cfg.ron_per_point ?? 0),
    },
  }
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function listTransactionsAction(
  filters: { from?: string; to?: string; staffId?: string; method?: PaymentMethod } = {},
): Promise<ActionResult<{ items: TransactionView[] }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }
  const result = await db.listTransactions(session.salon.id, filters)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

export async function refundTransactionAction(input: unknown): Promise<ActionResult> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = refundSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.refundTransaction(session.salon.id, parsed.data.id, parsed.data.reason)
  if (!result.ok) return { ok: false, error: result.error }

  await writeAudit(session.salon.id, "refund_transaction", "transactions", parsed.data.id, {
    reason: parsed.data.reason,
  })
  refresh()
  return { ok: true }
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function listExpensesAction(
  filters: { from?: string; to?: string } = {},
): Promise<ActionResult<{ items: ExpenseView[] }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }
  const result = await db.listExpenses(session.salon.id, filters)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

export async function saveExpenseAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.upsertExpense(session.salon.id, parsed.data, session.user.id)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true, data: result.data }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const result = await db.deleteExpense(session.salon.id, id)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true }
}

export async function uploadReceiptAction(expenseId: string, formData: FormData): Promise<ActionResult<{ path: string }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false, error: "Niciun fișier atașat." }

  const result = await db.uploadReceipt(session.salon.id, expenseId, file)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true, data: result.data }
}

export async function getReceiptUrlAction(path: string): Promise<ActionResult<{ url: string }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }
  const result = await db.getReceiptUrl(session.salon.id, path)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: result.data }
}

// ─── Day close ───────────────────────────────────────────────────────────────

export async function getDayTotalsAction(
  day: string,
): Promise<ActionResult<{ totals: DayTotals; closed: boolean }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const totals = await db.getDayTotals(session.salon.id, day)
  if (!totals.ok) return { ok: false, error: totals.error }
  const closed = await db.isDayClosed(session.salon.id, day)
  if (!closed.ok) return { ok: false, error: closed.error }
  return { ok: true, data: { totals: totals.data, closed: closed.data } }
}

export async function closeDayAction(input: unknown): Promise<ActionResult> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = dayCloseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.closeDay(
    session.salon.id,
    parsed.data.day,
    parsed.data.cashCounted,
    parsed.data.notes,
    session.user.id,
  )
  if (!result.ok) return { ok: false, error: result.error }

  await writeAudit(session.salon.id, "close_day", "day_closes", null, { day: parsed.data.day })
  refresh()
  return { ok: true }
}

export async function reopenDayAction(input: unknown): Promise<ActionResult> {
  // Reopen is owner-only.
  const session = await requireRole(["owner"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = dayReopenSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.reopenDay(session.salon.id, parsed.data.day, session.user.id)
  if (!result.ok) return { ok: false, error: result.error }

  await writeAudit(session.salon.id, "reopen_day", "day_closes", null, { day: parsed.data.day })
  refresh()
  return { ok: true }
}

export async function listDayClosesAction(): Promise<
  ActionResult<{ items: DayCloseView[] }>
> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }
  const result = await db.listDayCloses(session.salon.id)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

// ─── Reports & export ────────────────────────────────────────────────────────

export async function getReportAction(
  from: string,
  to: string,
): Promise<ActionResult<{ report: FinReport }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }
  const result = await db.getReport(session.salon.id, from, to)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { report: result.data } }
}

export async function listStaffNamesAction(): Promise<
  ActionResult<{ items: { id: string; name: string }[] }>
> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }
  const result = await db.listStaffNames(session.salon.id)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

/** CSV export for the accountant: RON 2 decimals, dd.MM.yyyy dates,
 *  semicolon separator, UTF-8 with BOM (Excel diacritics). */
export async function exportCsvAction(
  kind: "transactions" | "expenses",
  from: string,
  to: string,
): Promise<ActionResult<{ csv: string; filename: string }>> {
  const session = await requireRole([...FIN_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lei = (n: number) => n.toFixed(2).replace(".", ",")
  const roDate = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split("-")
    return `${d}.${m}.${y}`
  }

  let rows: string[]
  let filename: string

  if (kind === "transactions") {
    const result = await db.listTransactions(session.salon.id, { from, to })
    if (!result.ok) return { ok: false, error: result.error }
    rows = [
      ["Data", "Ora", "Client", "Servicii", "Specialist", "Suma (RON)", "Bacsis (RON)", "Reducere (RON)", "Metodă", "Status", "Note"]
        .map(esc)
        .join(";"),
      ...result.data.map((t) =>
        [
          roDate(t.day),
          t.paidAt.slice(11, 16),
          t.clientName,
          t.services.join(", "),
          t.staffName,
          lei(t.amount),
          lei(t.tip),
          lei(t.discount),
          t.paymentMethod,
          t.status,
          t.notes,
        ]
          .map(esc)
          .join(";"),
      ),
    ]
    filename = `tranzactii_${from}_${to}.csv`
  } else {
    const result = await db.listExpenses(session.salon.id, { from, to })
    if (!result.ok) return { ok: false, error: result.error }
    rows = [
      ["Data", "Categorie", "Descriere", "Suma (RON)", "Frecvență", "Note"].map(esc).join(";"),
      ...result.data.map((e) =>
        [roDate(e.spentOn), e.category, e.description, lei(e.amount), e.frequency, e.notes].map(esc).join(";"),
      ),
    ]
    filename = `cheltuieli_${from}_${to}.csv`
  }

  // \uFEFF = UTF-8 BOM so Excel renders diacritics correctly.
  return { ok: true, data: { csv: "\uFEFF" + rows.join("\r\n"), filename } }
}
