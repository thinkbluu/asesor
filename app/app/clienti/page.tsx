import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth/session"
import { listClients } from "@/lib/data/clienti"
import { clientListQuerySchema } from "@/lib/validation/clienti"
import { ClientsView } from "@/components/app/clienti/clients-view"

// Server shell: resolves the session once and loads the first page of
// clients; the view refetches through server actions (SWR) on every
// filter/sort/page change.
export default async function ClientiPage() {
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  if (!session.salon) redirect("/app/onboarding")

  const initial = await listClients(session.salon.id, clientListQuerySchema.parse({}))

  return (
    <ClientsView
      role={session.role ?? "staff"}
      initialList={initial.ok ? initial.data : { items: [], total: 0, page: 1, pageSize: 50 }}
      initialError={initial.ok ? null : initial.error}
    />
  )
}
