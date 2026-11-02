"use server"

import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getStripe, STRIPE_NOT_CONFIGURED_MESSAGE } from "@/lib/billing/stripe"
import { getPlan, getStripePriceId } from "@/lib/plans"
import { SITE } from "@/lib/site"

// Billing actions are owner-only and intentionally NOT behind billingGuard:
// a read-only (canceled / past-due) account must still be able to pay.

type Result<T = void> = (T extends void ? { ok: true } : { ok: true; data: T }) | { ok: false; error: string }

const checkoutSchema = z.object({
  plan: z.enum(["basic", "pro", "premium"]),
  interval: z.enum(["month", "year"]),
})

const TRIAL_DAYS = 14

export async function startTrialCheckoutAction(input: unknown): Promise<Result<{ url: string }>> {
  const session = await requireRole(["owner"])
  const salon = session.salon
  if (!salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Alege un plan și o perioadă de facturare." }
  const { plan, interval } = parsed.data

  if (session.billing?.source === "pilot") {
    return { ok: false, error: "Salonul are o perioadă pilot activă — nu este nevoie de card." }
  }
  if (session.billing?.hasSubscription && session.billing.status !== "canceled") {
    return { ok: false, error: "Există deja un abonament. Folosește „Facturi și card” sau „Schimbă planul”." }
  }

  const stripe = getStripe("checkout")
  if (!stripe) return { ok: false, error: STRIPE_NOT_CONFIGURED_MESSAGE }

  const priceId = getStripePriceId(plan, interval)
  if (!priceId) {
    console.warn(`[v0] checkout: prețul Stripe pentru ${plan}/${interval} nu este configurat — apelul a fost omis.`)
    return { ok: false, error: `Prețul pentru planul ${getPlan(plan).name} nu este configurat încă.` }
  }

  // A canceled salon resubscribes without a second free trial.
  const trialUsed = Boolean(session.billing?.trialUsed)

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: salon.id,
      ...(salon.stripe_customer_id
        ? { customer: salon.stripe_customer_id, customer_update: { name: "auto", address: "auto" } }
        : { customer_email: session.user.email ?? undefined }),
      locale: "ro",
      payment_method_collection: "always",
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: false },
      subscription_data: {
        ...(trialUsed ? {} : { trial_period_days: TRIAL_DAYS }),
        metadata: { salon_id: salon.id, plan },
      },
      metadata: { salon_id: salon.id, plan },
      success_url: `${SITE.url}/app/setari?tab=abonament&status=ok`,
      cancel_url: `${SITE.url}/app/setari?tab=abonament&status=cancel`,
    })
    if (!checkout.url) return { ok: false, error: "Nu am putut deschide pagina de plată." }
    return { ok: true, data: { url: checkout.url } }
  } catch (err) {
    console.error("[v0] checkout session failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "Nu am putut porni plata. Încearcă din nou." }
  }
}

export async function openBillingPortalAction(): Promise<Result<{ url: string }>> {
  const session = await requireRole(["owner"])
  const salon = session.salon
  if (!salon) return { ok: false, error: "Nu ai un salon activ." }
  if (!salon.stripe_customer_id) {
    return { ok: false, error: "Nu există încă un abonament cu card pentru acest salon." }
  }

  const stripe = getStripe("portal")
  if (!stripe) return { ok: false, error: STRIPE_NOT_CONFIGURED_MESSAGE }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: salon.stripe_customer_id,
      return_url: `${SITE.url}/app/setari?tab=abonament`,
      locale: "ro",
    })
    return { ok: true, data: { url: portal.url } }
  } catch (err) {
    console.error("[v0] billing portal failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "Nu am putut deschide portalul de facturare. Încearcă din nou." }
  }
}

/** Switches an existing subscription to another plan/interval (prorated by Stripe). */
export async function changePlanAction(input: unknown): Promise<Result> {
  const session = await requireRole(["owner"])
  const salon = session.salon
  if (!salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Alege un plan și o perioadă de facturare." }
  const { plan, interval } = parsed.data
  const target = getPlan(plan)

  if (!session.billing?.hasSubscription || !isSupabaseAdminConfigured()) {
    return { ok: false, error: "Nu există un abonament de modificat." }
  }

  // Downgrades are refused while the salon is over the target plan's limits.
  const supabase = await createSupabaseServerClient()
  if (target.maxUsers !== null) {
    const { count } = await supabase
      .from("salon_members")
      .select("user_id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
    if ((count ?? 0) > target.maxUsers) {
      return { ok: false, error: `Planul ${target.name} permite cel mult ${target.maxUsers} utilizatori. Elimină membri înainte de schimbare.` }
    }
  }
  if (target.maxClients !== null) {
    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .is("deleted_at", null)
    if ((count ?? 0) > target.maxClients) {
      return { ok: false, error: `Planul ${target.name} permite cel mult ${target.maxClients} cliente.` }
    }
  }

  const stripe = getStripe("change-plan")
  if (!stripe) return { ok: false, error: STRIPE_NOT_CONFIGURED_MESSAGE }
  const priceId = getStripePriceId(plan, interval)
  if (!priceId) {
    console.warn(`[v0] change-plan: prețul Stripe pentru ${plan}/${interval} nu este configurat — apelul a fost omis.`)
    return { ok: false, error: `Prețul pentru planul ${target.name} nu este configurat încă.` }
  }

  const { data: row } = await createSupabaseAdminClient()
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("salon_id", salon.id)
    .maybeSingle()
  if (!row?.stripe_subscription_id) return { ok: false, error: "Nu există un abonament de modificat." }

  try {
    const current = await stripe.subscriptions.retrieve(row.stripe_subscription_id)
    const itemId = current.items.data[0]?.id
    if (!itemId) return { ok: false, error: "Abonamentul nu are un articol de modificat." }
    await stripe.subscriptions.update(row.stripe_subscription_id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: { salon_id: salon.id, plan },
    })
    // The customer.subscription.updated webhook mirrors the change into the DB.
    return { ok: true }
  } catch (err) {
    console.error("[v0] change plan failed:", err instanceof Error ? err.message : err)
    return { ok: false, error: "Nu am putut schimba planul. Încearcă din nou." }
  }
}
