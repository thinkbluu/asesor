import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth/session"
import { getStaffDetail, getStaffLinkedUser, listSalonServices } from "@/lib/data/echipa"
import { StaffDetailView } from "@/components/app/echipa/staff-detail-view"

// Detaliu specialist. A staff user may open only their own page — colleagues'
// pages redirect to their own (UI layer; the guarded stats views are the RLS
// layer backstop).
export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  const salonId = session.salon!.id

  if (session.role === "staff") {
    if (!session.staffId) redirect("/app")
    if (session.staffId !== id) redirect(`/app/echipa/${session.staffId}`)
  }

  const [detail, linked, services] = await Promise.all([
    getStaffDetail(salonId, id),
    getStaffLinkedUser(salonId, id),
    session.role === "staff" ? Promise.resolve(null) : listSalonServices(salonId),
  ])

  if (!detail.ok) redirect("/app/echipa")

  const canManage = session.role === "owner" || session.role === "manager" || session.role === "receptionist"
  const canDelete = session.role === "owner" || session.role === "manager"
  const canInvite = session.role === "owner" || session.role === "manager"
  // Staff see their own numbers (the view allows exactly that row).
  const canSeeFinancials = session.role !== "staff" || session.staffId === id

  return (
    <StaffDetailView
      staff={detail.data}
      salonServices={services?.ok ? services.data : []}
      linkedUser={linked.ok ? linked.data : null}
      canManage={canManage}
      canDelete={canDelete}
      canInvite={canInvite}
      canSeeFinancials={canSeeFinancials}
      isSelf={session.role === "staff"}
    />
  )
}
