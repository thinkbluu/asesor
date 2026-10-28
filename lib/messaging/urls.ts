import "server-only"

import { headers } from "next/headers"

// Absolute URL for links inside emails, derived from the incoming request
// (same pattern as the invite link builder in lib/auth/team-actions.ts).
export async function absoluteUrl(path: string): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}${path}`
}
