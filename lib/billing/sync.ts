import "server-only"

import type Stripe from "stripe"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getPlan, isPlanId, planFromStripePriceId, type BillingInterval, type PlanId } from "@/lib/plans"
import { getStripe } from "./stripe"

type Admin = ReturnType<typeof createSupabaseAdminClient>

const isoFromUnix = (value: number | null | undefined): string | null =>
  typeof value === "number" ? new Date(value * 1000).toISOString() : null

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null
  return typeof ref === "string" ? ref : ref.id
}

async function findSalonId(admin: Admin, sub: Stripe.Subscription): Promise<string | null> {
  const fromMeta = sub.metadata?.salon_id
  if (fromMeta) return fromMeta
  const customerId = idOf(sub.customer as string | { id: string })
  if (!customerId) return null
  const { data } = await admin.from("salons").select("id").eq("stripe_customer_id", customerId).maybeSingle()
  return data?.id ?? null
}

function resolvePlan(sub: Stripe.Subscription): { plan: PlanId; interval: BillingInterval } {
  const item = sub.items?.data?.[0]
  const mapped = planFromStripePriceId(item?.price?.id)
  if (mapped) return mapped
  const metaPlan = sub.metadata?.plan
  const recurring = item?.price?.recurring?.interval
  return {
    plan: isPlanId(metaPlan) ? metaPlan : getPlan(null).id,
    interval: recurring === "year" ? "year" : "month",
  }
}

/**
 * Mirrors a Stripe subscription into `subscriptions` + `salons.plan`.
 * `eventCreated` (Stripe event.created) orders deliveries: an older event never
 * overwrites newer state, which also makes a replay a no-op.
 */
export async function syncSubscription(
  admin: Admin,
  sub: Stripe.Subscription,
  eventCreated: number,
  opts: { deleted?: boolean } = {},
): Promise<"applied" | "stale" | "no_salon"> {
  const salonId = await findSalonId(admin, sub)
  if (!salonId) {
    console.error("[v0] stripe webhook: subscription without a matching salon:", sub.id)
    return "no_salon"
  }

  const { data: existing } = await admin
    .from("subscriptions")
    .select("last_event_created, past_due_since")
    .eq("salon_id", salonId)
    .maybeSingle()

  if (existing && existing.last_event_created > eventCreated) return "stale"

  const { plan, interval } = resolvePlan(sub)
  const status = opts.deleted ? "canceled" : sub.status
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined
  const legacyEnd = (sub as unknown as { current_period_end?: number }).current_period_end
  const periodEnd = isoFromUnix(item?.current_period_end ?? legacyEnd)

  const pastDueSince =
    status === "past_due" ? (existing?.past_due_since ?? new Date().toISOString()) : null

  const customerId = idOf(sub.customer as string | { id: string })

  const { error } = await admin.from("subscriptions").upsert(
    {
      salon_id: salonId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan,
      interval,
      status,
      current_period_end: periodEnd,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      trial_end: isoFromUnix(sub.trial_end),
      past_due_since: pastDueSince,
      last_event_created: eventCreated,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "salon_id" },
  )
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`)

  const salonPatch: { stripe_customer_id?: string; plan?: string; trial_ends_at?: string | null } = {}
  if (customerId) salonPatch.stripe_customer_id = customerId
  if (status !== "canceled") salonPatch.plan = plan
  salonPatch.trial_ends_at = isoFromUnix(sub.trial_end)
  const { error: salonError } = await admin.from("salons").update(salonPatch).eq("id", salonId)
  if (salonError) throw new Error(`salons update failed: ${salonError.message}`)

  return "applied"
}

async function syncFromSubscriptionId(admin: Admin, subscriptionId: string | null, eventCreated: number) {
  if (!subscriptionId) return "skipped" as const
  const stripe = getStripe("webhook")
  if (!stripe) return "skipped" as const
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  return syncSubscription(admin, sub, eventCreated)
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as { subscription_details?: { subscription?: string | { id: string } } } | null
  return idOf(parent?.subscription_details?.subscription ?? null)
}

export async function handleStripeEvent(admin: Admin, event: Stripe.Event): Promise<string> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== "subscription") return "ignored"
      const salonId = session.client_reference_id ?? session.metadata?.salon_id ?? null
      const customerId = idOf(session.customer as string | { id: string } | null)
      if (salonId && customerId) {
        const { error } = await admin.from("salons").update({ stripe_customer_id: customerId }).eq("id", salonId)
        if (error) throw new Error(`salons customer link failed: ${error.message}`)
      }
      const result = await syncFromSubscriptionId(admin, idOf(session.subscription as string | { id: string } | null), event.created)
      return `checkout:${result}`
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      return `subscription:${await syncSubscription(admin, event.data.object as Stripe.Subscription, event.created)}`
    }
    case "customer.subscription.deleted": {
      return `subscription:${await syncSubscription(admin, event.data.object as Stripe.Subscription, event.created, { deleted: true })}`
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const result = await syncFromSubscriptionId(admin, invoiceSubscriptionId(event.data.object as Stripe.Invoice), event.created)
      return `invoice:${result}`
    }
    default:
      return "ignored"
  }
}
