// Pure billing access rules — no I/O, safe to unit-test and to import anywhere.
// getSession() feeds this with the salon row + subscription row and exposes
// the result as session.billing.

import { getPlan, type BillingInterval, type PlanId } from "@/lib/plans"

export const PAST_DUE_GRACE_DAYS = 7
export const TRIAL_BANNER_FROM_DAYS_LEFT = 4 // trial day 10 of 14

export const MSG_PAST_DUE = "Plata nu a reușit. Actualizează cardul ca să nu pierzi accesul."
export const MSG_READ_ONLY =
  "Contul este în modul doar citire. Reactivează abonamentul din Setări → Abonament ca să poți face modificări."
export const MSG_INACTIVE = "Activează perioada de probă de 14 zile ca să poți face modificări."

export type SubscriptionRow = {
  plan: string
  interval: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  past_due_since: string | null
  stripe_subscription_id?: string | null
}

export type SalonBillingInput = {
  plan: string
  pilot_until: string | null
  is_demo: boolean
  stripe_customer_id: string | null
}

export type BillingSource = "pilot" | "subscription" | "demo" | "unenforced" | "none"

export type BillingBanner =
  | { kind: "trial"; message: string; daysLeft: number }
  | { kind: "past_due"; message: string }
  | { kind: "read_only"; message: string }
  | { kind: "inactive"; message: string }

export type BillingState = {
  enforced: boolean
  source: BillingSource
  plan: PlanId
  interval: BillingInterval | null
  status: string | null
  /** true → every write action is refused with `readOnlyMessage`. */
  readOnly: boolean
  readOnlyMessage: string | null
  banner: BillingBanner | null
  trialDaysLeft: number | null
  trialEnd: string | null
  pilotUntil: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasSubscription: boolean
  hasStripeCustomer: boolean
  /** The salon already consumed its trial (has or had a subscription row). */
  trialUsed: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

function todayIso(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export function daysLeft(until: string | null, now: Date): number | null {
  if (!until) return null
  const ms = new Date(until).getTime() - now.getTime()
  if (Number.isNaN(ms)) return null
  return Math.max(0, Math.ceil(ms / DAY_MS))
}

export function computeBillingState(input: {
  salon: SalonBillingInput
  subscription: SubscriptionRow | null
  enforced: boolean
  now?: Date
}): BillingState {
  const now = input.now ?? new Date()
  const { salon, subscription: sub, enforced } = input
  const plan = getPlan(sub?.plan ?? salon.plan).id
  const interval: BillingInterval | null = sub ? (sub.interval === "year" ? "year" : "month") : null

  const base = {
    enforced,
    plan,
    interval,
    status: sub?.status ?? null,
    trialEnd: sub?.trial_end ?? null,
    pilotUntil: salon.pilot_until,
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    hasSubscription: Boolean(sub),
    hasStripeCustomer: Boolean(salon.stripe_customer_id),
    trialUsed: Boolean(sub),
    trialDaysLeft: null as number | null,
  }

  const full = (source: BillingSource, banner: BillingBanner | null = null, extra: Partial<BillingState> = {}): BillingState => ({
    ...base,
    source,
    readOnly: false,
    readOnlyMessage: null,
    banner,
    ...extra,
  })

  const locked = (source: BillingSource, message: string, banner: BillingBanner): BillingState => ({
    ...base,
    source,
    readOnly: true,
    readOnlyMessage: message,
    banner,
  })

  // 1. Pilot: full access, no card. pilot_until is a date, valid through that day.
  if (salon.pilot_until && salon.pilot_until >= todayIso(now)) {
    return full("pilot")
  }

  // 2. Demo salons and environments without Stripe are never locked.
  if (salon.is_demo) return full("demo")

  if (!sub) {
    if (!enforced) return full("unenforced")
    return locked("none", MSG_INACTIVE, { kind: "inactive", message: MSG_INACTIVE })
  }

  const status = sub.status

  if (status === "trialing" || status === "active") {
    const left = status === "trialing" ? daysLeft(sub.trial_end, now) : null
    const banner: BillingBanner | null =
      left !== null && left <= TRIAL_BANNER_FROM_DAYS_LEFT
        ? { kind: "trial", daysLeft: left, message: `Mai ai ${left} ${left === 1 ? "zi" : "zile"} de probă.` }
        : null
    return full("subscription", banner, { trialDaysLeft: left })
  }

  if (status === "past_due") {
    const since = sub.past_due_since ? new Date(sub.past_due_since).getTime() : now.getTime()
    const graceEnds = since + PAST_DUE_GRACE_DAYS * DAY_MS
    if (now.getTime() < graceEnds) {
      return full("subscription", { kind: "past_due", message: MSG_PAST_DUE })
    }
    return locked("subscription", MSG_PAST_DUE, { kind: "read_only", message: MSG_PAST_DUE })
  }

  // canceled, unpaid, incomplete, incomplete_expired, paused …
  return locked("subscription", MSG_READ_ONLY, { kind: "read_only", message: MSG_READ_ONLY })
}
