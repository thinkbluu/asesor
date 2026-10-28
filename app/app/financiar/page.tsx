import { requireRole } from "@/lib/auth/session"
import { loadFinanciarState } from "@/lib/data/financiar-state"
import { FinanciarView } from "@/components/app/financiar/financiar-view"

export const dynamic = "force-dynamic"

export default async function FinanciarPage() {
  const session = await requireRole(["owner", "manager"])
  const state = await loadFinanciarState(session.salon!.id)
  return <FinanciarView role={session.role as "owner" | "manager"} state={state} />
}
