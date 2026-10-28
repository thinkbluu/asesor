import "server-only"

import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"
import { serverEnv } from "@/lib/env.server"
import { SITE } from "@/lib/site"
import {
  messageSubject,
  renderMessage,
  type MessageKind,
  type TemplateDataMap,
} from "@/emails/templates"
import { readNotificationSettings, type NotificationKey } from "./settings"

// Transactional messaging. One channel for now (email via the Resend REST
// API — no SDK dependency). Every send writes a message_log row FIRST with
// status "pending": unique(appointment_id, kind) makes retries idempotent
// (a duplicate insert is caught and the send is skipped), then the row is
// updated to sent/failed/skipped_*.
//
// Never put client health data (allergies, formulas, medical notes) in any
// email — template data types and the render check enforce this.

export const EMAIL_FROM_ADDRESS = "programari@asesor.ro"

export interface MessageAttachment {
  filename: string
  /** Raw file content, base64-encoded (Resend expects base64). */
  contentBase64: string
}

export type SendMessageResult =
  | { ok: true; status: "sent"; providerId: string | null }
  | { ok: true; status: "skipped"; reason: "duplicate" | "no_provider" | "disabled" | "no_recipient" }
  | { ok: false; error: string }

/** Kinds the salon can turn off in Setări → Notificări. */
const TOGGLE_MAP: Partial<Record<MessageKind, NotificationKey>> = {
  confirmare_programare: "confirmare",
  reamintire_24h: "reamintire",
  anulare: "anulare",
  anulare_salon: "anulare",
  programare_noua_online: "programare_noua",
  programare_noua_online_staff: "programare_noua",
  cerere_feedback: "feedback",
  stoc_scazut_zilnic: "stoc_scazut",
  // invitatie_echipa and contact_nou are always sent (not salon-controlled).
}

interface SalonEmailIdentity {
  name: string
  email: string | null
  accentColor: string | null
  logoUrl: string | null
  address: string | null
  city: string | null
  phone: string
  bookingSettings: Json | null
}

async function loadSalonIdentity(salonId: string): Promise<SalonEmailIdentity | null> {
  if (!isSupabaseAdminConfigured()) return null
  const admin = createSupabaseAdminClient()
  const { data } = await admin
    .from("salons")
    .select("name, email, address, city, phone, booking_settings, branding")
    .eq("id", salonId)
    .maybeSingle()
  if (!data) return null
  // Branding (logo + accent colour) lives in the salons.branding jsonb —
  // same source the public booking page uses.
  const branding = (data.branding ?? {}) as Record<string, unknown>
  return {
    name: data.name,
    email: data.email ?? null,
    accentColor: typeof branding.primary_color === "string" ? branding.primary_color : null,
    logoUrl: typeof branding.logo_url === "string" ? branding.logo_url : null,
    address: data.address ?? null,
    city: data.city ?? null,
    phone: data.phone ?? "",
    bookingSettings: data.booking_settings ?? null,
  }
}

export async function sendMessage<K extends MessageKind>(input: {
  salonId: string | null
  appointmentId?: string | null
  kind: K
  to: string
  data: TemplateDataMap[K]
  attachments?: MessageAttachment[]
  /** Overrides the default reply-to (the salon email) — e.g. contact form sender. */
  replyTo?: string
}): Promise<SendMessageResult> {
  const to = input.to.trim()
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: true, status: "skipped", reason: "no_recipient" }
  }

  if (!isSupabaseAdminConfigured()) {
    console.error("[v0] sendMessage: Supabase admin client not configured")
    return { ok: false, error: "Messaging unavailable" }
  }
  const admin = createSupabaseAdminClient()

  const salon = input.salonId ? await loadSalonIdentity(input.salonId) : null
  if (input.salonId && !salon) {
    return { ok: false, error: "Salon not found" }
  }

  // 1. Reserve the send: insert the pending log row. A unique violation on
  // (appointment_id, kind) means this exact message was already handled.
  const { data: logRow, error: logError } = await admin
    .from("message_log")
    .insert({
      salon_id: input.salonId,
      appointment_id: input.appointmentId ?? null,
      channel: "email",
      kind: input.kind,
      to_address: to,
      status: "pending",
    })
    .select("id")
    .single()

  if (logError) {
    if (logError.code === "23505") {
      return { ok: true, status: "skipped", reason: "duplicate" }
    }
    console.error("[v0] message_log insert failed:", logError.message)
    return { ok: false, error: "Could not log message" }
  }
  const logId = logRow.id as string

  const finish = async (
    status: string,
    patch?: { provider_id?: string | null; error?: string | null },
  ) => {
    await admin
      .from("message_log")
      .update({ status, ...patch })
      .eq("id", logId)
  }

  try {
    // 2. Salon-level toggle (transactional emails still go out by default).
    const toggleKey = TOGGLE_MAP[input.kind]
    if (salon && toggleKey) {
      const settings = readNotificationSettings(salon.bookingSettings)
      if (!settings[toggleKey]) {
        await finish("skipped_disabled")
        return { ok: true, status: "skipped", reason: "disabled" }
      }
    }

    // 3. Render subject + html + plain text.
    const rendered = await renderMessage(input.kind, input.data)

    // 4. Send through the email channel (Resend REST API).
    const apiKey = serverEnv.RESEND_API_KEY
    if (!apiKey) {
      console.log(
        `[v0] email skipped (no RESEND_API_KEY): kind=${input.kind} to=${to}`,
      )
      await finish("skipped_no_provider")
      return { ok: true, status: "skipped", reason: "no_provider" }
    }

    const fromName = salon ? `${salon.name} prin ASESOR` : SITE.name
    const payload: Record<string, unknown> = {
      from: `${fromName} <${EMAIL_FROM_ADDRESS}>`,
      to: [to],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      reply_to: input.replyTo ?? salon?.email ?? undefined,
    }
    if (input.attachments?.length) {
      payload.attachments = input.attachments.map((a) => ({
        filename: a.filename,
        content: a.contentBase64,
      }))
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[v0] Resend send failed (${res.status}):`, body.slice(0, 300))
      await finish("failed", { error: `Resend ${res.status}` })
      return { ok: false, error: "Email send failed" }
    }

    const json = (await res.json().catch(() => null)) as { id?: string } | null
    await finish("sent", { provider_id: json?.id ?? null })
    return { ok: true, status: "sent", providerId: json?.id ?? null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[v0] sendMessage failed:", message)
    await finish("failed", { error: message.slice(0, 500) })
    return { ok: false, error: "Email send failed" }
  }
}

/** Subject only — used by the Notificări preview UI. */
export function previewSubject<K extends MessageKind>(
  kind: K,
  data: TemplateDataMap[K],
): string {
  return messageSubject(kind, data)
}

export { renderMessage } from "@/emails/templates"
export type { MessageKind, TemplateDataMap, RenderedMessage } from "@/emails/templates"
export { readNotificationSettings, NOTIFICATION_LABELS } from "./settings"
export type { NotificationKey, NotificationSettings } from "./settings"
