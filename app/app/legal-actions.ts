"use server"

// One-time acceptance of the current legal document versions. Shown to owners
// in /app whenever a version constant in lib/auth/constants.ts changes.

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"
import { TERMS_VERSION, PRIVACY_VERSION, DPA_VERSION } from "@/lib/auth/constants"
import { writeAudit } from "@/lib/audit"

export async function acceptLegalVersionsAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Reautentifică-te." }
  if (session.role !== "owner") {
    return { ok: false, error: "Doar proprietarul salonului poate accepta noile versiuni." }
  }

  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from("profiles")
    .update({
      terms_accepted_at: now,
      terms_version: TERMS_VERSION,
      privacy_accepted_at: now,
      privacy_version: PRIVACY_VERSION,
      dpa_accepted_at: now,
      dpa_version: DPA_VERSION,
    })
    .eq("id", session.user.id)
  if (error) {
    console.error("[v0] acceptLegalVersionsAction:", error.message)
    return { ok: false, error: "Nu am putut salva acceptarea. Încearcă din nou." }
  }

  if (session.salon) {
    await writeAudit(session.salon.id, "legal_accepted", "profiles", session.user.id, {
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      dpa_version: DPA_VERSION,
    })
  }

  return { ok: true }
}
