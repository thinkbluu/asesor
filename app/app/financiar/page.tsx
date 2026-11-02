import { requireRole } from "@/lib/auth/session"
import { loadFinanciarState } from "@/lib/data/financiar-state"
import { planAllows } from "@/lib/plans"
import { UpgradeScreen } from "@/components/app/upgrade-screen"
import { FinanciarView } from "@/components/app/financiar/financiar-view"

export const dynamic = "force-dynamic"

export default async function FinanciarPage() {
  const session = await requireRole(["owner", "manager"])
  if (!planAllows(session.billing?.plan, "financiar")) {
    return <UpgradeScreen feature="financiar" isOwner={session.role === "owner"} />
  }
  const state = await loadFinanciarState(session.salon!.id)
  return <FinanciarView role={session.role as "owner" | "manager"} state={state} />
}
