import "server-only"

import Stripe from "stripe"

// Every Stripe call goes through getStripe(). When STRIPE_SECRET_KEY is not
// set it returns null and the caller must skip the call (and say so) — a
// missing key must never crash the build or the app.

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY
  return Boolean(key && key.trim().length > 0)
}

let client: Stripe | null = null

export function getStripe(scope = "stripe"): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.trim().length === 0) {
    console.warn(`[v0] ${scope}: STRIPE_SECRET_KEY lipsește — apelul Stripe a fost omis.`)
    return null
  }
  if (!client) client = new Stripe(key)
  return client
}

export const STRIPE_NOT_CONFIGURED_MESSAGE =
  "Plățile online nu sunt configurate încă. Încearcă din nou mai târziu."
