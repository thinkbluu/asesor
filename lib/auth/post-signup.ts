import "server-only"

// Post-authentication setup shared by /auth/callback and the register flow:
// creates the first salon from pending signup metadata (via the
// create_salon_for_current_user RPC) and stamps the accepted legal versions
// on the profile row.

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

export async function ensureSalonAndConsents(): Promise<{ createdSalon: boolean }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { createdSalon: false }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>

  let createdSalon = false

  const { count } = await supabase
    .from("salon_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const salonName = typeof meta.salon_name === "string" ? meta.salon_name.trim() : ""
  if ((count ?? 0) === 0 && salonName) {
    const city = typeof meta.city === "string" ? meta.city.trim() : ""
    const { data: salonId, error } = await supabase.rpc("create_salon_for_current_user", {
      p_name: salonName,
      p_city: city,
    })
    if (!error && salonId) createdSalon = true
  }

  const now = new Date().toISOString()
  const update: Database["public"]["Tables"]["profiles"]["Update"] = {}
  if (typeof meta.terms_version === "string") {
    update.terms_accepted_at = now
    update.terms_version = meta.terms_version
  }
  if (typeof meta.dpa_version === "string") {
    update.dpa_accepted_at = now
    update.dpa_version = meta.dpa_version
  }
  if (typeof meta.privacy_version === "string") {
    update.privacy_accepted_at = now
    update.privacy_version = meta.privacy_version
  }
  if (Object.keys(update).length > 0) {
    await supabase.from("profiles").update(update).eq("id", user.id)
  }

  return { createdSalon }
}
