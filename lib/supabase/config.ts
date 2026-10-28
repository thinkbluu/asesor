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
  return raw && raw.trim().length > 0 ? raw : null
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey())
}

// NOTE: this module is part of the client bundle graph (via lib/supabase/client),
// so it must never reference SUPABASE_SERVICE_ROLE_KEY. The service-role check
// lives in lib/supabase/admin.ts (server-only).
