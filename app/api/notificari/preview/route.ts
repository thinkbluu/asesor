import { getSession } from "@/lib/auth/session"
import { renderMessage, type MessageKind } from "@/emails/templates"
import { sampleWithSalon } from "@/lib/messaging/test-sample"

// Template preview for Setări → Notificări: renders a template with sample
// data and the signed-in salon's real branding. Owner/manager only.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.salon || !session.role || !["owner", "manager"].includes(session.role)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const kind = new URL(request.url).searchParams.get("kind") as MessageKind | null
  if (!kind) return new Response("Missing kind", { status: 400 })

  const salon = session.salon
  const branding = (salon.branding ?? {}) as Record<string, unknown>
  const data = sampleWithSalon(kind, {
    name: salon.name,
    accentColor: typeof branding.primary_color === "string" ? branding.primary_color : null,
    logoUrl: typeof branding.logo_url === "string" ? branding.logo_url : null,
    address: salon.address,
    city: salon.city,
    phone: salon.phone ?? "",
  })
  if (!data) return new Response("Unknown kind", { status: 404 })

  const { html } = await renderMessage(kind, data)
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  })
}
