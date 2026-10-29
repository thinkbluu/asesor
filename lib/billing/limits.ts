import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getPlan } from "@/lib/plans"
import type { BillingState } from "./access"

export type LimitBlock = { ok: false; error: string }

/**
 * Seats = members + invites still waiting to be accepted, so an owner cannot
 * get around maxUsers by sending many invites before anyone joins.
 */
export async function checkUserLimit(salonId: string, billing: BillingState | null, adding = 1): Promise<LimitBlock | null> {
  if (!billing) return null
  const plan = getPlan(billing.plan)
  if (plan.maxUsers === null) return null

  const supabase = await createSupabaseServerClient()
  const [{ count: members }, { count: invites }] = await Promise.all([
    supabase.from("salon_members").select("user_id", { count: "exact", head: true }).eq("salon_id", salonId),
    supabase
      .from("salon_invites")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
  ])
  const seats = (members ?? 0) + (invites ?? 0)
  if (seats + adding > plan.maxUsers) {
    return {
      ok: false,
      error: `Planul ${plan.name} permite cel mult ${plan.maxUsers} utilizatori. Treci la un plan superior din Setări → Abonament ca să inviți mai mulți colegi.`,
    }
  }
  return null
}

export async function checkClientLimit(salonId: string, billing: BillingState | null, adding = 1): Promise<LimitBlock | null> {
  if (!billing) return null
  const plan = getPlan(billing.plan)
  if (plan.maxClients === null) return null

  const supabase = await createSupabaseServerClient()
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .is("deleted_at", null)
  if ((count ?? 0) + adding > plan.maxClients) {
    return {
      ok: false,
      error: `Planul ${plan.name} permite cel mult ${plan.maxClients} cliente. Treci la Pro (nelimitat) din Setări → Abonament.`,
    }
  }
  return null
}
