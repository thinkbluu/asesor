import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth/session"
import { loadProgramariBootstrap, loadProgramariRange } from "@/lib/data/programari"
import { ProgramariView } from "@/components/app/programari/programari-view"
import { todayBucharest } from "@/lib/time"

// Server shell: resolves the session once, loads today's appointments and the
// staff/service catalog, then hands off to the client calendar. The calendar
// refetches per visible range through server actions (SWR) and stays live via
// Supabase Realtime.
export default async function ProgramariPage() {
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  if (!session.salon) redirect("/app/onboarding")
  const salonId = session.salon.id

  const today = todayBucharest()
  const [bootstrap, todayRange] = await Promise.all([
    loadProgramariBootstrap(salonId),
    loadProgramariRange(salonId, today, today),
  ])

  return (
    <ProgramariView
      salonId={salonId}
      role={session.role ?? "staff"}
      staffId={session.staffId}
      staff={bootstrap.ok ? bootstrap.data.staff : []}
      services={bootstrap.ok ? bootstrap.data.services : []}
      staffServices={bootstrap.ok ? bootstrap.data.staffServices : []}
      initialAppointments={todayRange.ok ? todayRange.data : []}
      initialDate={today}
    />
  )
}
