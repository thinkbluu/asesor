import "server-only"

// Server-side Supabase client bound to the request's cookies (@supabase/ssr).
// Used by server components and server actions — RLS applies as the signed-in
// user. Never throws at import time when env vars are missing.

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./config"

export { isSupabaseConfigured }

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const url = supabaseUrl()
  const key = supabaseAnonKey()
  if (!url || !key) {
    throw new Error("Supabase nu este configurat (lipsesc variabilele publice).")
  }
  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component render — safe to ignore when
          // middleware/proxy already refreshed the session cookies.
        }
      },
    },
  })
}
