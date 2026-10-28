import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import * as db from "@/lib/data/financiar"
import type { TransactionView, ExpenseView, DayCloseView, FinReport } from "@/lib/mappers/financiar"

export interface FinanciarState {
  transactions: TransactionView[]
  expenses: ExpenseView[]
  dayCloses: DayCloseView[]
  staff: { id: string; name: string }[]
  report: FinReport | null
  recurringGenerated: number
}

/** One server-side load for the page: lists + report for the current month +
 *  the recurring-expense catch-up (idempotent, runs on first visit after the
 *  due date). Individual tabs refetch via actions when filters change. */
export async function loadFinanciarState(salonId: string): Promise<FinanciarState> {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [tx, expenses, closes, staff, report, recurring] = await Promise.all([
    db.listTransactions(salonId, { from, to }),
    db.listExpenses(salonId, { from, to }),
    db.listDayCloses(salonId),
    db.listStaffNames(salonId),
    db.getReport(salonId, from, to),
    db.generateRecurring(salonId),
  ])

  return {
    transactions: tx.ok ? tx.data : [],
    expenses: expenses.ok ? expenses.data : [],
    dayCloses: closes.ok ? closes.data : [],
    staff: staff.ok ? staff.data : [],
    report: report.ok ? report.data : null,
    recurringGenerated: recurring.ok ? recurring.data.generated : 0,
  }
}

/** Helper for the checkout dialog: nothing to preload — the dialog fetches
 *  loyalty info per client via getClientLoyaltyAction. */
export async function salonHasLoyalty(salonId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from("salons").select("loyalty_config").eq("id", salonId).single()
  const cfg = (data?.loyalty_config ?? {}) as Record<string, unknown>
  return cfg.enabled === true && Number(cfg.ron_per_point ?? 0) > 0
}
