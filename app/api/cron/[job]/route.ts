import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { sendMessage } from "@/lib/messaging"
import { readNotificationSettings } from "@/lib/messaging/settings"
import { purgeDeletedSalons } from "@/lib/server/purge"
import { SITE } from "@/lib/site"
import type { TemplateDataMap } from "@/emails/templates"
import type { SalonBranding } from "@/emails/layout"

// P12 scheduled jobs. Vercel Cron sends GET with
// `Authorization: Bearer $CRON_SECRET`; anything else gets 401 (constant-time
// compare). Every job is idempotent and returns a JSON summary.
//
//   /api/cron/reminders  — every 15 min: 24h reminders (23–25h window)
//   /api/cron/feedback   — hourly: feedback requests 2–3h after finalizat
//   /api/cron/daily      — 01:00 UTC (≈03:00 Bucharest): low-stock report,
//                          expire_loyalty_points, retention_cleanup,
//                          purge_demo_bookings, purge of deleted salons

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type JobName = "reminders" | "feedback" | "daily"

interface JobSummary {
  job: JobName
  sent: number
  skipped: number
  failed: number
  details?: Record<string, unknown>
}

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get("authorization") ?? ""
  const a = createHash("sha256").update(auth).digest()
  const b = createHash("sha256").update(`Bearer ${secret}`).digest()
  return timingSafeEqual(a, b)
}

function brandingOf(salon: {
  name: string
  branding: Record<string, unknown> | null
  address: string | null
  city: string | null
  phone: string
}): SalonBranding {
  const b = salon.branding ?? {}
  return {
    name: salon.name,
    accentColor: typeof b.primary_color === "string" ? b.primary_color : null,
    logoUrl: typeof b.logo_url === "string" ? b.logo_url : null,
    address: salon.address,
    city: salon.city,
    phone: salon.phone,
  }
}

function roLabels(iso: string): { dateLabel: string; timeLabel: string } {
  const d = new Date(iso)
  return {
    dateLabel: new Intl.DateTimeFormat("ro-RO", {
      timeZone: "Europe/Bucharest",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d),
    timeLabel: new Intl.DateTimeFormat("ro-RO", {
      timeZone: "Europe/Bucharest",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d),
  }
}

// ─── reminders ───────────────────────────────────────────────────────────────

async function runReminders(): Promise<JobSummary> {
  const admin = createSupabaseAdminClient()
  const from = new Date(Date.now() + 23 * 3600_000).toISOString()
  const to = new Date(Date.now() + 25 * 3600_000).toISOString()

  const { data: rows, error } = await admin
    .from("appointments")
    .select(
      `id, starts_at, ends_at, salon_id,
       clients (first_name, email),
       staff (first_name, last_name),
       salons (id, name, email, branding, address, city, phone, booking_settings)`,
    )
    .gte("starts_at", from)
    .lte("starts_at", to)
    .eq("status", "confirmat")
    .is("reminder_sent_at", null)

  if (error) {
    console.error("[v0] reminders query failed:", error.message)
    return { job: "reminders", sent: 0, skipped: 0, failed: 0, details: { error: error.message } }
  }
  if (!rows || rows.length === 0) {
    return { job: "reminders", sent: 0, skipped: 0, failed: 0 }
  }

  // Service lines come from a separate query (no FK embed in the generated
  // types for appointments → appointment_services).
  const ids = rows.map((r) => r.id)
  const { data: serviceRows } = await admin
    .from("appointment_services")
    .select("appointment_id, name_snapshot")
    .in("appointment_id", ids)
  const servicesByAppointment = new Map<string, string[]>()
  for (const s of serviceRows ?? []) {
    const list = servicesByAppointment.get(s.appointment_id) ?? []
    list.push(s.name_snapshot)
    servicesByAppointment.set(s.appointment_id, list)
  }

  const summary: JobSummary = { job: "reminders", sent: 0, skipped: 0, failed: 0 }

  for (const row of rows) {
    const salon = row.salons as unknown as {
      id: string
      name: string
      email: string | null
      branding: Record<string, unknown> | null
      address: string | null
      city: string | null
      phone: string
      booking_settings: Record<string, unknown> | null
    } | null
    const client = row.clients as unknown as { first_name: string | null; email: string | null } | null
    const staff = row.staff as unknown as { first_name: string | null; last_name: string | null } | null

    const markDone = async () => {
      await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", row.id)
    }

    if (!salon || !client?.email) {
      // Nothing to send — mark as handled so the window query stays clean.
      await markDone()
      summary.skipped++
      continue
    }

    const { dateLabel, timeLabel } = roLabels(row.starts_at)
    const result = await sendMessage({
      salonId: salon.id,
      appointmentId: row.id,
      kind: "reamintire_24h",
      to: client.email,
      data: {
        clientFirstName: client.first_name ?? "",
        salon: brandingOf(salon),
        serviceNames: servicesByAppointment.get(row.id) ?? [],
        dateLabel,
        timeLabel,
        staffFirstName: staff?.first_name ?? "specialistul tău",
        // The manage link needs the raw booking token, which is never stored
        // server-side — reminders link to the salon phone instead.
        manageUrl: null,
      } satisfies TemplateDataMap["reamintire_24h"],
    })

    if (result.ok) {
      await markDone()
      if (result.status === "sent") summary.sent++
      else summary.skipped++
    } else {
      // Leave reminder_sent_at null so the next run retries within the window.
      summary.failed++
    }
  }

  return summary
}

// ─── feedback ────────────────────────────────────────────────────────────────

async function runFeedback(): Promise<JobSummary> {
  const admin = createSupabaseAdminClient()
  const from = new Date(Date.now() - 3 * 3600_000).toISOString()
  const to = new Date(Date.now() - 2 * 3600_000).toISOString()

  const { data: rows, error } = await admin
    .from("appointments")
    .select(
      `id, salon_id,
       clients (id, first_name, email),
       salons (id, name, email, branding, address, city, phone, booking_settings)`,
    )
    .eq("status", "finalizat")
    .gte("updated_at", from)
    .lte("updated_at", to)

  if (error) {
    console.error("[v0] feedback query failed:", error.message)
    return { job: "feedback", sent: 0, skipped: 0, failed: 0, details: { error: error.message } }
  }
  if (!rows || rows.length === 0) {
    return { job: "feedback", sent: 0, skipped: 0, failed: 0 }
  }

  const summary: JobSummary = { job: "feedback", sent: 0, skipped: 0, failed: 0 }

  // Rows created by an earlier failed attempt have no recoverable plaintext
  // token (only the sha256 hash is stored) — drop them and regenerate.
  const ids = rows.map((r) => r.id)
  await admin.from("feedback_requests").delete().in("appointment_id", ids).is("emailed_at", null)

  const { data: existing } = await admin
    .from("feedback_requests")
    .select("appointment_id")
    .in("appointment_id", ids)
  const alreadyEmailed = new Set((existing ?? []).map((r) => r.appointment_id))

  for (const row of rows) {
    const salon = row.salons as unknown as {
      id: string
      name: string
      email: string | null
      branding: Record<string, unknown> | null
      address: string | null
      city: string | null
      phone: string
      booking_settings: Record<string, unknown> | null
    } | null
    const client = row.clients as unknown as { first_name: string | null; email: string | null } | null

    if (!salon || !client?.email || alreadyEmailed.has(row.id)) {
      summary.skipped++
      continue
    }

    // At most one feedback request per client per 30 days (message_log check).
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()
    const { data: recent } = await admin
      .from("message_log")
      .select("id")
      .eq("kind", "cerere_feedback")
      .eq("to_address", client.email)
      .gte("created_at", monthAgo)
      .limit(1)
    if (recent && recent.length > 0) {
      summary.skipped++
      continue
    }

    // Token generated app-side; only the sha256 hash is stored. The plaintext
    // token lives exactly once — in the email link.
    const token = randomBytes(32).toString("base64url")
    const tokenHash = createHash("sha256").update(token).digest("hex")
    const expiresAt = new Date(Date.now() + 14 * 24 * 3600_000).toISOString()
    const { error: insertError } = await admin.from("feedback_requests").insert({
      salon_id: salon.id,
      appointment_id: row.id,
      client_id: (row.clients as unknown as { id?: string } | null)?.id ?? null,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    if (insertError) {
      console.error("[v0] feedback_requests insert failed:", insertError.message)
      summary.failed++
      continue
    }

    const result = await sendMessage({
      salonId: salon.id,
      appointmentId: row.id,
      kind: "cerere_feedback",
      to: client.email,
      data: {
        clientFirstName: client.first_name ?? "",
        salon: brandingOf(salon),
        feedbackUrl: `${SITE.url}/feedback/${token}`,
      } satisfies TemplateDataMap["cerere_feedback"],
    })

    if (result.ok) {
      await admin
        .from("feedback_requests")
        .update({ emailed_at: new Date().toISOString() })
        .eq("token_hash", tokenHash)
      if (result.status === "sent") summary.sent++
      else summary.skipped++
    } else {
      // Row stays with emailed_at null; the next hourly run regenerates it.
      summary.failed++
    }
  }

  return summary
}

// ─── daily ───────────────────────────────────────────────────────────────────

async function runDaily(): Promise<JobSummary> {
  const admin = createSupabaseAdminClient()
  const summary: JobSummary = {
    job: "daily",
    sent: 0,
    skipped: 0,
    failed: 0,
    details: { rpc: {} as Record<string, string> },
  }
  const rpcResults = summary.details!.rpc as Record<string, string>

  // 1. Low-stock report per salon (once a day — deduped via message_log).
  const { data: salons, error: salonsError } = await admin
    .from("salons")
    .select("id, name, email, branding, address, city, phone, booking_settings")
    .is("deleted_at", null)

  if (salonsError) {
    console.error("[v0] daily salons query failed:", salonsError.message)
    summary.failed++
  } else {
    for (const salon of salons ?? []) {
      const { data: products, error: productsError } = await admin
        .from("products")
        .select("name, stock, min_stock, supplier_name")
        .eq("salon_id", salon.id)
        .eq("active", true)

      if (productsError) {
        console.error("[v0] daily products query failed:", productsError.message)
        summary.failed++
        continue
      }
      // Low or out: stock at or below the salon's own minimum.
      const low = (products ?? []).filter((p) => Number(p.stock) <= Number(p.min_stock))
      if (low.length === 0 || !salon.email) {
        summary.skipped++
        continue
      }

      // Once a day: a report for this salon in the last 20h means done.
      const cutoff = new Date(Date.now() - 20 * 3600_000).toISOString()
      const { data: recent } = await admin
        .from("message_log")
        .select("id")
        .eq("kind", "stoc_scazut_zilnic")
        .eq("salon_id", salon.id)
        .gte("created_at", cutoff)
        .limit(1)
      if (recent && recent.length > 0) {
        summary.skipped++
        continue
      }

      const result = await sendMessage({
        salonId: salon.id,
        kind: "stoc_scazut_zilnic",
        to: salon.email,
        data: {
          salon: brandingOf(salon),
          items: low.map((p) => ({
            name: p.name,
            stock: Number(p.stock),
            minStock: Number(p.min_stock),
            supplier: p.supplier_name,
          })),
        } satisfies TemplateDataMap["stoc_scazut_zilnic"],
      })
      if (result.ok && result.status === "sent") summary.sent++
      else if (result.ok) summary.skipped++
      else summary.failed++
    }
  }

  // 2. DB maintenance RPCs (revoked from public — service role only).
  for (const fn of ["expire_loyalty_points", "retention_cleanup", "purge_demo_bookings"]) {
    const { error } = await admin.rpc(fn)
    rpcResults[fn] = error ? `error: ${error.message}` : "ok"
    if (error) {
      console.error(`[v0] daily rpc ${fn} failed:`, error.message)
      summary.failed++
    }
  }

  // 3. Purge salons soft-deleted more than 30 days ago (P11 routine, folded in).
  const purge = await purgeDeletedSalons()
  rpcResults.purge_deleted_salons = purge.ok ? `ok (${purge.purged})` : `error: ${purge.error}`
  if (!purge.ok) summary.failed++

  return summary
}

// ─── route ───────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ job: string }> },
) {
  const { job } = await params
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 })
  }
  if (!isSupabaseAdminConfigured()) {
    return Response.json({ ok: false, error: "Supabase not configured" }, { status: 503 })
  }

  let summary: JobSummary
  switch (job as JobName) {
    case "reminders":
      summary = await runReminders()
      break
    case "feedback":
      summary = await runFeedback()
      break
    case "daily":
      summary = await runDaily()
      break
    default:
      return Response.json({ ok: false, error: "Unknown job" }, { status: 404 })
  }

  return Response.json({ ok: true, ...summary })
}
