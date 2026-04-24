// WhatsApp Business integration — types, templates, and API hooks.
// All actual Meta Cloud API calls are marked TODO and return mocked data.

export type WhatsAppChannelStatus = "disconnected" | "pending" | "connected" | "error"

export interface WhatsAppConfig {
  phoneNumber: string // salon's WhatsApp Business number (E.164, e.g. +40722123456)
  phoneNumberId: string // Meta-assigned Phone Number ID
  apiKey: string // permanent access token (store encrypted server-side in production)
  wabaId: string // WhatsApp Business Account ID
  status: WhatsAppChannelStatus
  lastVerifiedAt?: string // ISO timestamp
  primaryChannel: boolean // if true, use WhatsApp as main channel with SMS fallback
}

export type WhatsAppTemplateKey =
  | "booking_confirmation"
  | "reminder_24h"
  | "post_visit_thankyou"
  | "reengagement"

export interface WhatsAppTemplate {
  key: WhatsAppTemplateKey
  name: string // display name (Romanian)
  description: string
  category: "UTILITY" | "MARKETING" // Meta category — affects pricing & approval
  language: "ro"
  body: string // with {{var}} placeholders
  variables: string[] // ordered list of placeholder names
  metaTemplateName?: string // name registered in Meta Business Manager
  status: "approved" | "pending" | "draft" // Meta approval status
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    key: "booking_confirmation",
    name: "Confirmare programare",
    description: "Trimis imediat după ce clientul face o programare",
    category: "UTILITY",
    language: "ro",
    body:
      "Bună, {{nume_client}}! Programarea ta la {{salon}} este confirmată pentru {{data}} la ora {{ora}} — {{serviciu}} cu {{angajat}}. Te așteptăm! Pentru modificări: {{telefon_salon}}",
    variables: ["nume_client", "salon", "data", "ora", "serviciu", "angajat", "telefon_salon"],
    metaTemplateName: "asesor_booking_confirmation_ro",
    status: "approved",
  },
  {
    key: "reminder_24h",
    name: "Reminder 24h",
    description: "Trimis automat cu 24 de ore înainte de programare",
    category: "UTILITY",
    language: "ro",
    body:
      "Salut, {{nume_client}}! Îți amintim că mâine la {{ora}} ai programare la {{salon}} pentru {{serviciu}}. Răspunde DA pentru a confirma sau NU dacă nu mai poți veni.",
    variables: ["nume_client", "ora", "salon", "serviciu"],
    metaTemplateName: "asesor_reminder_24h_ro",
    status: "approved",
  },
  {
    key: "post_visit_thankyou",
    name: "Mulțumire post-vizită",
    description: "Trimis la 2 ore după finalizarea programării",
    category: "UTILITY",
    language: "ro",
    body:
      "Mulțumim că ne-ai vizitat, {{nume_client}}! Sperăm că ești mulțumit(ă) de {{serviciu}}. Lasă-ne o recenzie aici: {{link_recenzie}}. Ne vedem data viitoare!",
    variables: ["nume_client", "serviciu", "link_recenzie"],
    metaTemplateName: "asesor_post_visit_ro",
    status: "approved",
  },
  {
    key: "reengagement",
    name: "Re-engagement clienți inactivi",
    description: "Trimis clienților care nu au mai venit de 60+ zile",
    category: "MARKETING",
    language: "ro",
    body:
      "Bună, {{nume_client}}! Ne e dor de tine la {{salon}}. Te așteptăm cu o ofertă specială: {{oferta}}. Rezervă acum: {{link_rezervare}}",
    variables: ["nume_client", "salon", "oferta", "link_rezervare"],
    metaTemplateName: "asesor_reengagement_ro",
    status: "pending",
  },
]

export function getTemplate(key: WhatsAppTemplateKey): WhatsAppTemplate | undefined {
  return WHATSAPP_TEMPLATES.find((t) => t.key === key)
}

// Replace {{var}} placeholders with values from the variables map.
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? `{{${name}}}`)
}

// ─── Message log (mock data) ────────────────────────────────────────────────

export type WhatsAppDirection = "outbound" | "inbound"
export type WhatsAppDeliveryStatus = "sent" | "delivered" | "read" | "failed" | "replied"

export interface WhatsAppMessage {
  id: string
  appointmentId?: string
  clientId: string
  direction: WhatsAppDirection
  templateKey?: WhatsAppTemplateKey
  body: string
  timestamp: string // ISO
  status: WhatsAppDeliveryStatus
}

// Mock message history keyed by appointment id. Swap for a real query in production.
export const WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  {
    id: "wam_1",
    appointmentId: "a1",
    clientId: "1",
    direction: "outbound",
    templateKey: "booking_confirmation",
    body: "Bună, Maria! Programarea ta la Beauty Studio este confirmată pentru 28 apr la ora 10:00 — Vopsit rădăcini cu Ana. Te așteptăm!",
    timestamp: "2026-04-20T14:32:00.000Z",
    status: "read",
  },
  {
    id: "wam_2",
    appointmentId: "a1",
    clientId: "1",
    direction: "inbound",
    body: "Mulțumesc! Ne vedem atunci.",
    timestamp: "2026-04-20T14:35:00.000Z",
    status: "replied",
  },
  {
    id: "wam_3",
    appointmentId: "a1",
    clientId: "1",
    direction: "outbound",
    templateKey: "reminder_24h",
    body: "Salut, Maria! Îți amintim că mâine la 10:00 ai programare la Beauty Studio pentru Vopsit rădăcini.",
    timestamp: "2026-04-23T10:00:00.000Z",
    status: "delivered",
  },
]

export function getMessagesForAppointment(appointmentId: string, limit = 3): WhatsAppMessage[] {
  return WHATSAPP_MESSAGES
    .filter((m) => m.appointmentId === appointmentId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}

export function getMessagesForClient(clientId: string, limit = 10): WhatsAppMessage[] {
  return WHATSAPP_MESSAGES
    .filter((m) => m.clientId === clientId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}

// ─── Normalize + validate Romanian phone to WhatsApp E.164 ──────────────────

/**
 * Convert a Romanian-formatted phone to E.164 (+40XXXXXXXXX).
 * Accepts: "0722 123 456", "0722123456", "+40722123456", "40722123456".
 * Returns null if the number cannot be parsed.
 */
export function toWhatsAppE164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "")
  if (!digits) return null
  if (digits.startsWith("+40") && digits.length === 12) return digits
  if (digits.startsWith("40") && digits.length === 11) return `+${digits}`
  if (digits.startsWith("0") && digits.length === 10) return `+40${digits.slice(1)}`
  if (digits.startsWith("+")) return digits // assume already E.164
  return null
}

// ─── API stubs ──────────────────────────────────────────────────────────────

export interface SendMessageInput {
  to: string // client phone (will be normalized to E.164)
  templateKey: WhatsAppTemplateKey
  variables: Record<string, string>
  appointmentId?: string
  clientId: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a templated WhatsApp message via Meta Cloud API.
 *
 * TODO: Replace this stub with a real call to
 *   POST https://graph.facebook.com/v21.0/{phone_number_id}/messages
 * using the config.apiKey as bearer token. Payload uses the template name
 * registered in Meta Business Manager and positional parameters matching
 * template.variables order.
 *
 * In production this must run server-side (Server Action or API route) so
 * the API key is never exposed to the client.
 */
export async function sendWhatsAppTemplate(
  input: SendMessageInput,
  _config: WhatsAppConfig,
): Promise<SendMessageResult> {
  const e164 = toWhatsAppE164(input.to)
  if (!e164) {
    return { success: false, error: "Număr de telefon invalid" }
  }
  // TODO: Real API call
  await new Promise((r) => setTimeout(r, 400))
  return { success: true, messageId: `wam_${Date.now()}` }
}

/**
 * Verify that the configured phone number + API key are valid.
 *
 * TODO: Replace with a real health-check against
 *   GET https://graph.facebook.com/v21.0/{phone_number_id}
 * Returns the display_phone_number and verified_name fields on success.
 */
export async function verifyWhatsAppConnection(
  config: Pick<WhatsAppConfig, "apiKey" | "phoneNumberId">,
): Promise<{ ok: boolean; error?: string }> {
  // TODO: Real verification
  await new Promise((r) => setTimeout(r, 800))
  if (!config.apiKey || !config.phoneNumberId) {
    return { ok: false, error: "Cheia API și Phone Number ID sunt obligatorii" }
  }
  return { ok: true }
}
