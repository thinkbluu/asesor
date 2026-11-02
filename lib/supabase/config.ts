// Shared, environment-safe Supabase configuration checks. Used by both the
// browser and server clients so a missing OR malformed env var (e.g. a key
// pasted into the URL variable) is treated as "not configured" instead of
// throwing at import time or inside the proxy.

export function supabaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return raw
  } catch {
    return null
  }
}

export function supabaseAnonKey(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!raw || raw.trim().length === 0) return null
  // Fail closed: a service-role secret must never act as the public anon key.
  // A misconfigured env would otherwise ship service-role power to browsers.
  if (raw.startsWith("sb_secret_")) return null
  if (raw.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        atob(raw.split(".")[1].replace(/-/g, "+").replace(/_/g, "-"))
      ) as { role?: string }
      if (payload.role === "service_role") return null
    } catch {
      // Malformed JWT — surface it as unconfigured rather than half-working.
      return null
    }
  }
  return raw
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey())
}

// NOTE: this module is part of the client bundle graph (via lib/supabase/client),
// so it must never reference SUPABASE_SERVICE_ROLE_KEY. The service-role check
// lives in lib/supabase/admin.ts (server-only).
