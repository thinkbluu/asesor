import "server-only"

// Service-role Supabase client. Bypasses RLS — use only from trusted server
// code (route handlers, server actions) and never import this from a client
// component. Never throws at import time when env vars are missing.

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"
import { supabaseUrl } from "./config"

export function isSupabaseAdminConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(supabaseUrl() && serviceKey && serviceKey.trim().length > 0)
}

let adminClient: SupabaseClient<Database> | null = null

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const url = supabaseUrl()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Supabase service role nu este configurat.")
  }
  if (!adminClient) {
    adminClient = createClient<Database>(url, serviceKey, {
      auth: {
        // The service role key is static; persisting a session makes no sense.
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return adminClient
}
