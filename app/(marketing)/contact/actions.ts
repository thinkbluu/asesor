"use server"

// Public contact form. Order of checks: zod → honeypot → Turnstile →
// rate limit (service-role RPC, 3/IP/hour) → insert contact_requests →
// optional Resend notification. Never reveals whether an email exists.

import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config"
import { serverEnv } from "@/lib/env.server"
import { sendMessage } from "@/lib/messaging"
import { contactSchema, type ContactSubject } from "@/lib/validation/contact"
import { SITE } from "@/lib/site"
import { zodToActionError } from "@/lib/validation/onboarding"

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string }

const GENERIC_ERROR = "Nu am putut trimite mesajul. Te rugăm să reîncerci."

async function getClientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get("x-forwarded-for")
  return (fwd ? fwd.split(",")[0] : h.get("x-real-ip")) ?? "unknown"
}

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

async function sendContactEmail(input: {
  name: string
  email: string
  phone: string
  salonName: string
  subject: ContactSubject
  message: string
}): Promise<void> {
  const sentAtLabel = new Intl.DateTimeFormat("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())

  const result = await sendMessage({
    salonId: null,
    kind: "contact_nou",
    to: SITE.emails.contact,
    replyTo: input.email,
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      salonName: input.salonName,
      subject: input.subject,
      message: input.message,
      sentAtLabel,
    },
  })
  if (!result.ok) {
    console.error("[v0] contact notification failed:", result.error)
  }
}

export async function submitContactAction(formData: FormData): Promise<ContactResult> {
  // 1. zod validation
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    salonName: formData.get("salonName") ?? "",
    subject: formData.get("subject"),
    message: formData.get("message"),
    gdpr: formData.get("gdpr") === "on" || formData.get("gdpr") === "true",
  })
  if (!parsed.success) {
    return { ok: false, error: zodToActionError(parsed.error).error }
  }

  // 2. honeypot — bots fill the hidden "website" field; pretend success.
  const honeypot = String(formData.get("website") ?? "")
  if (honeypot.trim() !== "") {
    return { ok: true }
  }

  if (!isSupabaseConfigured() || !supabaseUrl() || !supabaseAnonKey() || !isSupabaseAdminConfigured()) {
    return { ok: false, error: "Formularul nu este disponibil momentan." }
  }

  const ip = await getClientIp()

  // 3. Turnstile
  const turnstileToken = String(formData.get("turnstileToken") ?? "")
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { ok: false, error: "Verificarea anti-spam a eșuat. Reîncarcă pagina și încearcă din nou." }
  }

  const admin = createSupabaseAdminClient()

  // 4. rate limit: 3 per IP per hour, inside a service-role-only RPC
  const ipHash = createHash("sha256").update(ip).digest("hex")
  const { data: rl, error: rlError } = await admin.rpc("register_contact_attempt_rpc", {
    p_ip_hash: ipHash,
  })
  if (rlError) {
    console.error("[v0] register_contact_attempt_rpc failed:", rlError.message)
    return { ok: false, error: GENERIC_ERROR }
  }
  const rlResult = rl as { ok?: boolean; message?: string } | null
  if (rlResult && rlResult.ok === false) {
    return { ok: false, error: rlResult.message ?? "Ai trimis prea multe mesaje. Încearcă din nou mai târziu." }
  }

  // 5. insert (service role — the table has no RLS policies by design)
  const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim()
  const { error: insertError } = await admin.from("contact_requests").insert({
    name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    salon_name: parsed.data.salonName || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
    source_page: "contact",
  })
  if (insertError) {
    console.error("[v0] contact insert failed:", insertError.message)
    return { ok: false, error: GENERIC_ERROR }
  }

  // 6. optional email notification — never blocks the confirmation
  await sendContactEmail({
    name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    salonName: parsed.data.salonName || "",
    subject: parsed.data.subject,
    message: parsed.data.message,
  })

  return { ok: true }
}
