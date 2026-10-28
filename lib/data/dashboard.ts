import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { civilToUtcIso, toDateStringBucharest, addDaysToDateString } from "@/lib/time"

// Server-only data layer for the /app dashboard. KPIs come from the
// dashboard_summary RPC; the weekly chart and alerts come from plain
// (RLS-scoped) queries. Only real DB numbers are surfaced — no derived trends.

type DataResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

function dbError(scope: string, error: unknown): { ok: false; error: string } {
  console.error(`[v0] ${scope} failed:`, error)
  return { ok: false, error: "S-a produs o eroare la încărcare." }
}

// ─── dashboard_summary RPC ───────────────────────────────────────────────────

export interface DashboardSummary {
  day: string
  appointments_by_status: Record<string, number>
  revenue_today: number
  next_upcoming: {
    id: string
    starts_at: string
    status: string
    client_name: string
    staff_name: string
  }[]
  low_stock_count: number
  new_clients_this_month: number
}

export async function getDashboardSummary(
  salonId: string,
  day: string,
): Promise<DataResult<DashboardSummary>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("dashboard_summary", {
    p_salon: salonId,
    p_day: day,
  })
  if (error) return dbError("getDashboardSummary", error)
  if (!data) return { ok: false, error: "Nu ai acces la acest salon." }

  const raw = data as Record<string, unknown>
  return {
    ok: true,
    data: {
      day: String(raw.day ?? day),
      appointments_by_status: (raw.appointments_by_status as Record<string, number>) ?? {},
      revenue_today: Number(raw.revenue_today ?? 0),
      next_upcoming: (raw.next_upcoming as DashboardSummary["next_upcoming"]) ?? [],
      low_stock_count: Number(raw.low_stock_count ?? 0),
      new_clients_this_month: Number(raw.new_clients_this_month ?? 0),
    },
  }
}

// ─── Weekly revenue (last 7 days, grouped by Bucharest civil date) ───────────

export interface WeeklyRevenueDay {
  date: string
  label: string
  revenue: number
  isToday: boolean
}

export async function loadWeeklyRevenue(
  salonId: string,
): Promise<DataResult<WeeklyRevenueDay[]>> {
  const supabase = await createSupabaseServerClient()
  const today = toDateStringBucharest(new Date())
  const fromIso = civilToUtcIso(addDaysToDateString(today, -6), "00:00")

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, tip, paid_at")
    .eq("salon_id", salonId)
    .eq("status", "incasat")
    .not("paid_at", "is", null)
    .gte("paid_at", fromIso)

  if (error) return dbError("loadWeeklyRevenue", error)

  const byDay = new Map<string, number>()
  for (const t of data ?? []) {
    const day = toDateStringBucharest(new Date(t.paid_at as string))
    byDay.set(day, (byDay.get(day) ?? 0) + Number(t.amount) + Number(t.tip))
  }

  return {
    ok: true,
    data: Array.from({ length: 7 }, (_, i) => {
      const date = addDaysToDateString(today, i - 6)
      return {
        date,
        label: new Date(`${date}T12:00:00`).toLocaleDateString("ro-RO", { weekday: "short" }),
        revenue: byDay.get(date) ?? 0,
        isToday: date === today,
      }
    }),
  }
}

// ─── Alerts (real counts only) ───────────────────────────────────────────────

export interface DashboardAlerts {
  pendingConfirmations: number
  noShowsYesterday: number
  upcomingTimeOff: { staffName: string; startDate: string; endDate: string; reason: string | null }[]
}

export async function loadDashboardAlerts(salonId: string): Promise<DataResult<DashboardAlerts>> {
  const supabase = await createSupabaseServerClient()
  const today = toDateStringBucharest(new Date())
  const yesterday = addDaysToDateString(today, -1)
  const nowIso = new Date().toISOString()

  const [pendingRes, noShowRes, timeOffRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("status", "in_asteptare")
      .gte("starts_at", nowIso),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("status", "no_show")
      .gte("starts_at", civilToUtcIso(yesterday, "00:00"))
      .lte("starts_at", civilToUtcIso(yesterday, "23:59")),
    supabase
      .from("staff_time_off")
      .select("starts_at, ends_at, reason, staff (first_name, last_name)")
      .eq("salon_id", salonId)
      .eq("status", "approved")
      .gte("ends_at", nowIso)
      .order("starts_at")
      .limit(3),
  ])

  if (pendingRes.error) return dbError("loadDashboardAlerts.pending", pendingRes.error)
  if (noShowRes.error) return dbError("loadDashboardAlerts.noShow", noShowRes.error)
  if (timeOffRes.error) return dbError("loadDashboardAlerts.timeOff", timeOffRes.error)

  return {
    ok: true,
    data: {
      pendingConfirmations: pendingRes.count ?? 0,
      noShowsYesterday: noShowRes.count ?? 0,
      upcomingTimeOff: (timeOffRes.data ?? []).map((row) => {
        const staff = row.staff as unknown as { first_name: string; last_name: string } | null
        return {
          staffName: staff ? `${staff.first_name} ${staff.last_name}` : "—",
          startDate: toDateStringBucharest(new Date(row.starts_at)),
          endDate: toDateStringBucharest(new Date(row.ends_at)),
          reason: row.reason,
        }
      }),
    },
  }
}
