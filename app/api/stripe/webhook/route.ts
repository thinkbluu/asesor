import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { handleStripeEvent } from "@/lib/billing/sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
])

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Semnătura Stripe lipsește." }, { status: 400 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || secret.trim().length === 0) {
    console.warn("[v0] stripe webhook: STRIPE_WEBHOOK_SECRET lipsește — evenimentul a fost omis.")
    return NextResponse.json({ error: "Webhook neconfigurat." }, { status: 503 })
  }

  // Signature verification needs the exact raw bytes of the body.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    // constructEvent never calls the Stripe API, so no secret key is needed here.
    event = Stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch {
    return NextResponse.json({ error: "Semnătură invalidă." }, { status: 400 })
  }

  if (!HANDLED.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true })
  }

  if (!isSupabaseAdminConfigured()) {
    console.error("[v0] stripe webhook: service role indisponibil — evenimentul nu a fost procesat.")
    return NextResponse.json({ error: "Stocare indisponibilă." }, { status: 503 })
  }

  const admin = createSupabaseAdminClient()

  // Idempotency: the primary key rejects a second insert of the same event id.
  const { error: insertError } = await admin.from("stripe_events").insert({ id: event.id, type: event.type })
  if (insertError) {
    if (insertError.code !== "23505") {
      console.error("[v0] stripe webhook: ledger insert failed:", insertError.message)
      return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
    }
    const { data: prior } = await admin.from("stripe_events").select("processed_at").eq("id", event.id).maybeSingle()
    if (prior?.processed_at) {
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Earlier delivery failed midway — fall through and process it again.
  }

  try {
    const outcome = await handleStripeEvent(admin, event)
    await admin
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString(), error: null })
      .eq("id", event.id)
    return NextResponse.json({ received: true, outcome })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    console.error("[v0] stripe webhook: handler failed:", event.type, message)
    await admin.from("stripe_events").update({ error: message.slice(0, 500) }).eq("id", event.id)
    // 500 makes Stripe retry; the ledger row without processed_at lets the retry run.
    return NextResponse.json({ error: "Procesare eșuată." }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Metodă nepermisă." }, { status: 405, headers: { Allow: "POST" } })
}
