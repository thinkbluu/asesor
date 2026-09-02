export type WhatsAppChannelStatus = "disconnected" | "pending" | "connected" | "error"

export interface WhatsAppConfig {
  phoneNumber: string
  phoneNumberId: string
  wabaId: string
  status: WhatsAppChannelStatus
  lastVerifiedAt?: string
  primaryChannel: boolean
}

export type WhatsAppTemplateKey =
  | "booking_confirmation"
  | "reminder_24h"
  | "post_visit_thankyou"
  | "reengagement"

export interface WhatsAppTemplate {
  key: WhatsAppTemplateKey
  name: string
  description: string
  category: "UTILITY" | "MARKETING"
  language: "ro"
  body: string
  variables: string[]
  metaTemplateName?: string
  status: "approved" | "pending" | "draft"
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    key: "booking_confirmation",
    name: "Confirmare programare",
    description: "Trimis imediat după ce clientul face o programare",
    category: "UTILITY",
    language: "ro",
    body: "Bună, {{nume_client}}! Programarea ta la {{salon}} este confirmată pentru {{data}} la ora {{ora}} — {{serviciu}} cu {{angajat}}. Te așteptăm! Pentru modificări: {{telefon_salon}}",
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
    body: "Salut, {{nume_client}}! Îți amintim că mâine la {{ora}} ai programare la {{salon}} pentru {{serviciu}}. Răspunde DA pentru a confirma sau NU dacă nu mai poți veni.",
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
    body: "Mulțumim că ne-ai vizitat, {{nume_client}}! Sperăm că ești mulțumit(ă) de {{serviciu}}. Lasă-ne o recenzie aici: {{link_recenzie}}. Ne vedem data viitoare!",
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
    body: "Bună, {{nume_client}}! Ne e dor de tine la {{salon}}. Te așteptăm cu o ofertă specială: {{oferta}}. Rezervă acum: {{link_rezervare}}",
    variables: ["nume_client", "salon", "oferta", "link_rezervare"],
    metaTemplateName: "asesor_reengagement_ro",
    status: "pending",
  },
]

export function getTemplate(key: WhatsAppTemplateKey): WhatsAppTemplate | undefined {
  return WHATSAPP_TEMPLATES.find((template) => template.key === key)
}

export function renderTemplate(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, name) => variables[name] ?? `{{${name}}}`)
}

export type WhatsAppDirection = "outbound" | "inbound"
export type WhatsAppDeliveryStatus = "sent" | "delivered" | "read" | "failed" | "replied"

export interface WhatsAppMessage {
  id: string
  appointmentId?: string
  clientId: string
  direction: WhatsAppDirection
  templateKey?: WhatsAppTemplateKey
  body: string
  timestamp: string
  status: WhatsAppDeliveryStatus
}

export function toWhatsAppE164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "")
  if (!digits) return null
  if (digits.startsWith("+40") && digits.length === 12) return digits
  if (digits.startsWith("40") && digits.length === 11) return `+${digits}`
  if (digits.startsWith("0") && digits.length === 10) return `+40${digits.slice(1)}`
  if (digits.startsWith("+")) return digits
  return null
}

export interface SendMessageInput {
  to: string
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

export async function verifyWhatsAppConnection(
  config: Pick<WhatsAppConfig, "phoneNumberId">,
): Promise<{ ok: boolean; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  if (!config.phoneNumberId) {
    return { ok: false, error: "Phone Number ID este obligatoriu" }
  }
  return { ok: true }
}
