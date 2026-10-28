"use server"

import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import crypto from "node:crypto"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config"
import { serverEnv } from "@/lib/env.server"
import { sendAppointmentConfirmation } from "@/lib/messaging/appointment-emails"
import { absoluteUrl } from "@/lib/messaging/urls"
import { bookingDetailsSchema, type BookingDetailsInput } from "@/lib/validation/booking"

// ─── Types ───────────────────────────────────────────────────────────────────

export type AvailabilitySlot = { staffId: string; time: string }

export type AvailabilityResult =
  | { ok: true; slots: AvailabilitySlot[] }
  | { ok: false; error: string }

export type BookingSummary = {
  code: string
  status: string
  startsAt: string
  endsAt: string
  totalPrice: number
  durationMin: number
  services: { name: string; price: number; durationMin: number }[]
  staffFirstName: string
  managePath: string
}

export type CreateBookingResult =
  | { ok: true; data: BookingSummary }
  | { ok: false; code: "invalid" | "slot_taken" | "rate_limited" | "spam" | "turnstile" | "unavailable"; message: string }

const GENERIC_ERROR = "Nu am putut procesa cererea. Te rugăm să reîncerci."
const RATE_LIMIT_MESSAGE =
  "Ai făcut prea multe programări într-un timp scurt. Sună la salon pentru ajutor."
const SLOT_TAKEN_MESSAGE = "Ora aleasă tocmai a fost rezervată. Alege altă oră."

// ─── Availability (public_availability RPC, anon key) ────────────────────────

export async function getAvailabilityAction(
  slug: string,
  serviceIds: string[],
  staffId: string | null,
  day: string,
): Promise<AvailabilityResult> {
  if (!isSupabaseConfigured() || !supabaseUrl() || !supabaseAnonKey()) {
    return { ok: false, error: "Programările online nu sunt disponibile momentan." }
  }
  const supabase = createClient(supabaseUrl()!, supabaseAnonKey()!)
  const { data, error } = await supabase.rpc("public_availability", {
    p_slug: slug,
    p_service_ids: serviceIds,
    p_staff_id: staffId,
    p_day: day,
  })
  if (error) {
    console.error("[v0] public_availability failed:", error.message)
    return { ok: false, error: "Nu am putut încărca intervalele orare. Reîncearcă." }
  }
  const slots = Array.isArray(data) ? data : []
  const fmt = new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return {
    ok: true,
    slots: (slots as unknown[])
      .map((s) => {
        const rec = s as { staff_id?: string; starts_at?: string }
        if (!rec.staff_id || !rec.starts_at) return null
        return { staffId: rec.staff_id, time: fmt.format(new Date(rec.starts_at)) }
      })
      .filter((s): s is AvailabilitySlot => s !== null),
  }
}

// ─── Staff for the selected services (public_staff RPC, anon key) ────────────

export type StaffResult =
  | { ok: true; staff: { id: string; firstName: string; roleTitle: string | null; color: string | null }[] }
  | { ok: false; error: string }

export async function getPublicStaffAction(
  slug: string,
  serviceIds: string[],
): Promise<StaffResult> {
  if (!isSupabaseConfigured() || !supabaseUrl() || !supabaseAnonKey()) {
    return { ok: false, error: "Programările online nu sunt disponibile momentan." }
  }
  const supabase = createClient(supabaseUrl()!, supabaseAnonKey()!)
  const { data, error } = await supabase.rpc("public_staff", {
    p_slug: slug,
    p_service_ids: serviceIds,
  })
  if (error) {
    console.error("[v0] public_staff failed:", error.message)
    return { ok: false, error: "Nu am putut încărca echipa. Reîncearcă." }
  }
  const rows = Array.isArray(data) ? data : []
  return {
    ok: true,
    staff: (rows as unknown[]).map((s) => {
      const rec = s as { id: string; first_name: string; role_title: string | null; color: string | null }
      return { id: rec.id, firstName: rec.first_name, roleTitle: rec.role_title, color: rec.color }
    }),
  }
}

// ─── Turnstile ───────────────────────────────────────────────────────────────

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = serverEnv.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Skipped only when the secret is absent — warn loudly in production.
    if (process.env.NODE_ENV === "production") {
      console.error("[v0] TURNSTILE_SECRET_KEY missing in production — Turnstile verification skipped")
    }
    return true
  }
  if (!token) return false
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const json = (await res.json()) as { success?: boolean }
    return json.success === true
  } catch (error) {
    console.error("[v0] Turnstile verification failed:", error)
    return false
  }
}

// ─── createPublicBooking ─────────────────────────────────────────────────────
// Order of checks: zod → honeypot → Turnstile → rate limits + slot re-check +
// insert (all inside the SECURITY DEFINER RPC, service_role only). The RPC
// never reveals whether a phone is already a client: both find and create
// return the same appointment summary, and error messages do not differ.

export async function createPublicBooking(
  input: BookingDetailsInput,
): Promise<CreateBookingResult> {
  // 1. zod validation
  const parsed = bookingDetailsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, code: "invalid", message: parsed.error.issues[0]?.message ?? GENERIC_ERROR }
  }
  const d = parsed.data

  // 2. honeypot — bots fill the hidden field; answer with a generic error
  if (d.website) {
    return { ok: false, code: "spam", message: GENERIC_ERROR }
  }

  // 3. Turnstile server-side verification
  const hdrs = await headers()
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
  const human = await verifyTurnstile(d.turnstileToken, ip)
  if (!human) {
    return { ok: false, code: "turnstile", message: "Verificarea anti-bot a eșuat. Te rugăm să reîncerci." }
  }

  // 4–8. rate limits, slot re-check, client find-or-create, insert — one RPC
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "unavailable", message: "Programările online nu sunt disponibile momentan." }
  }
  const manageToken = crypto.randomBytes(32).toString("base64url")
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex")

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc("create_public_booking_rpc", {
    p_slug: d.slug,
    p_service_ids: d.serviceIds,
    p_staff_id: d.staffId as string,
    p_day: d.date,
    p_time: d.time,
    p_first_name: d.firstName,
    p_last_name: d.lastName,
    p_phone: d.phone,
    p_email: d.email,
    p_notes: d.notes,
    p_marketing_consent: d.marketing,
    p_ip_hash: ipHash,
    p_manage_token: manageToken,
  })

  if (error) {
    console.error("[v0] create_public_booking_rpc failed:", error.message)
    return { ok: false, code: "unavailable", message: GENERIC_ERROR }
  }

  const res = data as {
    ok: boolean
    code?: string
    message?: string
    appointment_id?: string
    status?: string
    starts_at?: string
    ends_at?: string
    total_price?: number
    duration_min?: number
    services?: { name: string; price: number; duration_min: number }[]
    staff_first_name?: string
  }

  if (!res?.ok) {
    if (res?.code === "rate_limited") {
      return { ok: false, code: "rate_limited", message: res.message ?? RATE_LIMIT_MESSAGE }
    }
    if (res?.code === "slot_taken") {
      return { ok: false, code: "slot_taken", message: res.message ?? SLOT_TAKEN_MESSAGE }
    }
    return { ok: false, code: "invalid", message: GENERIC_ERROR }
  }

  const bookingData = {
    code: res.code ?? "",
    status: res.status ?? "confirmat",
    startsAt: res.starts_at ?? "",
    endsAt: res.ends_at ?? "",
    totalPrice: Number(res.total_price ?? 0),
    durationMin: Number(res.duration_min ?? 0),
    services: (res.services ?? []).map((s) => ({
      name: s.name,
      price: Number(s.price),
      durationMin: Number(s.duration_min),
    })),
    staffFirstName: res.staff_first_name ?? "",
    managePath: `/booking/manage/${manageToken}`,
  }

  // Transactional emails (confirmation to the client, new-booking notice to
  // the salon + specialist). Fire-and-forget: never fail the booking itself;
  // sendMessage is idempotent via message_log unique(appointment_id, kind).
  if (res.appointment_id) {
    try {
      const admin = createSupabaseAdminClient()
      const { data: salonRow } = await admin
        .from("salons")
        .select("id")
        .eq("slug", d.slug)
        .maybeSingle()
      if (salonRow) {
        const manageUrl = await absoluteUrl(`/booking/manage/${manageToken}`)
        await sendAppointmentConfirmation(salonRow.id, res.appointment_id, {
          manageUrl,
          clientEmail: d.email,
        })
      }
    } catch (err) {
      console.error("[v0] booking confirmation emails failed:", err)
    }
  }

  return { ok: true, data: bookingData }
}
