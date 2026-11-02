import "server-only"

import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { computeBillingState, type BillingState, type SalonBillingInput, type SubscriptionRow } from "./access"
import { isStripeConfigured } from "./stripe"

const SUB_COLUMNS =
  "plan, interval, status, current_period_end, cancel_at_period_end, trial_end, past_due_since, stripe_subscription_id"

/**
 * Subscriptions are owner-select-only under RLS, but every role needs the
 * resulting access state (a receptionist must also be told the account is
 * read-only). The row is therefore read with the service role, strictly by
 * salon id taken from the verified session — never from user input.
 */
async function loadSubscription(salonId: string): Promise<SubscriptionRow | null> {
  try {
    if (isSupabaseAdminConfigured()) {
      const { data, error } = await createSupabaseAdminClient()
        .from("subscriptions")
        .select(SUB_COLUMNS)
        .eq("salon_id", salonId)
        .maybeSingle()
      if (error) {
        console.error("[v0] billing: subscriptions read failed:", error.message)
        return null
      }
      return (data as SubscriptionRow | null) ?? null
    }
    // Fallback without the service key: owners can still read their own row.
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.from("subscriptions").select(SUB_COLUMNS).eq("salon_id", salonId).maybeSingle()
    return (data as SubscriptionRow | null) ?? null
  } catch (err) {
    console.error("[v0] billing: subscription load threw:", err)
    return null
  }
}

export async function loadBillingState(salon: SalonBillingInput & { id: string }): Promise<BillingState> {
  const subscription = await loadSubscription(salon.id)
  return computeBillingState({ salon, subscription, enforced: isStripeConfigured() })
}

/** Billing state for a salon slug without a session (public booking page + RPC guard). */
export async function loadBillingStateBySlug(slug: string): Promise<BillingState | null> {
  if (!isSupabaseAdminConfigured()) return null
  try {
    const { data } = await createSupabaseAdminClient().from("salons").select("id").eq("slug", slug).maybeSingle()
    return data ? await loadBillingStateBySalonId(data.id) : null
  } catch (err) {
    console.error("[v0] billing: state by slug failed:", err)
    return null
  }
}

/** Billing state for a salon id without a session (public booking page). */
export async function loadBillingStateBySalonId(salonId: string): Promise<BillingState | null> {
  if (!isSupabaseAdminConfigured()) return null
  try {
    const admin = createSupabaseAdminClient()
    const { data: salon } = await admin
      .from("salons")
      .select("id, plan, pilot_until, is_demo, stripe_customer_id")
      .eq("id", salonId)
      .maybeSingle()
    if (!salon) return null
    return loadBillingState(salon)
  } catch (err) {
    console.error("[v0] billing: state by salon id failed:", err)
    return null
  }
}
