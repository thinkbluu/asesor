import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth/session"
import { getDashboardSummary, loadWeeklyRevenue, loadDashboardAlerts } from "@/lib/data/dashboard"
import { DashboardView } from "@/components/app/dashboard-view"
import { todayBucharest } from "@/lib/time"

// Server shell for the dashboard. All numbers come from the database:
// dashboard_summary RPC for KPIs + upcoming appointments, plain RLS-scoped
// queries for the weekly revenue chart and alerts.
export default async function DashboardPage() {
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  if (!session.salon) redirect("/app/onboarding")
  const salonId = session.salon.id
  const today = todayBucharest()

  const [summary, weekly, alerts] = await Promise.all([
    getDashboardSummary(salonId, today),
    loadWeeklyRevenue(salonId),
    loadDashboardAlerts(salonId),
  ])

  return (
    <DashboardView
      summary={summary.ok ? summary.data : null}
      weekly={weekly.ok ? weekly.data : []}
      alerts={alerts.ok ? alerts.data : null}
    />
  )
}
