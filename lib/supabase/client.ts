"use client"

// Browser Supabase client (anon key, RLS applies).
// Never throws at import time when env vars are missing — callers must check
// isSupabaseConfigured() before creating a client.

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./config"

export { isSupabaseConfigured }

let browserClient: SupabaseClient<Database> | null = null

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const url = supabaseUrl()
  const key = supabaseAnonKey()
  if (!url || !key) {
    throw new Error("Supabase nu este configurat (lipsesc variabilele publice).")
  }
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, key)
  }
  return browserClient
}
