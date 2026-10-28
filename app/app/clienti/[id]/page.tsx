import { notFound, redirect } from "next/navigation"
import { requireRole } from "@/lib/auth/session"
import {
  getClient,
  getClientHistory,
  getLoyaltyLedger,
  getConsents,
  getSensitive,
  listPhotos,
} from "@/lib/data/clienti"
import { ClientDetailView } from "@/components/app/clienti/client-detail-view"

// Server shell: resolves the session once and loads every tab's data in
// parallel. Sensitive data is decrypted server-side only for
// owner/manager/staff; receptionist receives the restricted flag.
export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  if (!session.salon) redirect("/app/onboarding")
  const { id } = await params
  const salonId = session.salon.id
  const role = session.role ?? "staff"

  const canReadSensitive = role === "owner" || role === "manager" || role === "staff"

  const [client, history, loyalty, consents, sensitive, photos] = await Promise.all([
    getClient(salonId, id),
    getClientHistory(salonId, id),
    getLoyaltyLedger(salonId, id),
    getConsents(salonId, id),
    getSensitive(salonId, id, canReadSensitive),
    canReadSensitive ? listPhotos(salonId, id) : Promise.resolve(null),
  ])

  if (!client.ok) notFound()

  return (
    <ClientDetailView
      role={role}
      client={client.data}
      history={history.ok ? history.data : []}
      loyalty={loyalty.ok ? loyalty.data : []}
      consents={consents.ok ? consents.data : []}
      sensitive={sensitive.ok ? sensitive.data : null}
      sensitiveError={sensitive.ok ? null : sensitive.error}
      photos={photos && photos.ok ? photos.data : null}
    />
  )
}
