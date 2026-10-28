import { requireRole } from "@/lib/auth/session"
import { listStaff, listTimeOff } from "@/lib/data/echipa"
import { TeamView } from "@/components/app/echipa/team-view"

// Echipa — every salon role can see the list; a staff user is redirected to
// their own detail page only from colleagues' pages, but the financial
// columns are hidden for them here (the guarded views return no data anyway).
export default async function EchipaPage() {
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  const salonId = session.salon!.id

  const [staff, timeOff] = await Promise.all([listStaff(salonId), listTimeOff(salonId)])

  const items = staff.ok ? staff.data : []
  const canSeeFinancials = session.role !== "staff"
  const canManage = session.role === "owner" || session.role === "manager" || session.role === "receptionist"
  const canDelete = session.role === "owner" || session.role === "manager"

  const pendingTimeOff = timeOff.ok ? timeOff.data.filter((t) => t.status === "pending") : []
  const namesById = new Map(items.map((s) => [s.id, `${s.firstName} ${s.lastName}`]))

  return (
    <TeamView
      items={items}
      canSeeFinancials={canSeeFinancials}
      canManage={canManage}
      canDelete={canDelete}
      pendingTimeOff={pendingTimeOff}
      staffNames={Object.fromEntries(namesById)}
    />
  )
}
