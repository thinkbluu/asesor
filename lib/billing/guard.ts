import "server-only"

import { getSession } from "@/lib/auth/session"
import { FEATURE_LABEL, FEATURE_MIN_PLAN, getPlan, planAllows, type FeatureKey } from "@/lib/plans"

export type BillingBlock = { ok: false; error: string }

export function upgradeMessage(feature: FeatureKey): string {
  const min = getPlan(FEATURE_MIN_PLAN[feature])
  return `Modulul ${FEATURE_LABEL[feature]} este disponibil din planul ${min.name} (${min.monthly} lei/lună). Schimbă planul din Setări → Abonament.`
}

/**
 * Server-side gate for mutating actions. Returns a refusal to hand straight
 * back to the client, or null when the action may proceed.
 *
 *   const blocked = await billingGuard({ write: true })
 *   if (blocked) return blocked
 *
 * - `write` refuses when the account is read-only (past-due grace over,
 *   canceled, or no trial started yet).
 * - `feature` refuses when the salon's plan does not include the module.
 *
 * Callers without a session or salon are left to the role guard that follows.
 */
export async function billingGuard(opts: { write?: boolean; feature?: FeatureKey } = {}): Promise<BillingBlock | null> {
  const session = await getSession()
  const billing = session?.billing
  if (!session || !billing) return null

  if (opts.feature && !planAllows(billing.plan, opts.feature)) {
    return { ok: false, error: upgradeMessage(opts.feature) }
  }
  if ((opts.write ?? true) && billing.readOnly) {
    return { ok: false, error: billing.readOnlyMessage ?? "Contul este în modul doar citire." }
  }
  return null
}
