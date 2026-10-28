"use server"

// Close-account flow: the owner requests salon deletion (soft, reversible for
// 30 days). The booking page goes dark immediately — the public RPCs in
// scripts/015 filter deleted_at. Hard deletion happens in purge_deleted_salons()
// (scripts/003), driven by the P12 cron through /api/cron/purge-deleted.

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/session"
import { aal2Required, MFA_REQUIRED, type MfaRequired } from "@/lib/auth/mfa"
import { writeAudit } from "@/lib/audit"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function requestSalonDeletionAction(): Promise<ActionResult | MfaRequired> {
  const session = await requireRole(["owner"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const supabase = await createSupabaseServerClient()
  if (await aal2Required(supabase)) return MFA_REQUIRED

  if (session.salon.deleted_at) {
    return { ok: false, error: "Ștergerea este deja programată." }
  }

  const { error } = await supabase
    .from("salons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", session.salon.id)
  if (error) {
    console.error("[v0] requestSalonDeletionAction:", error.message)
    return { ok: false, error: "Nu am putut programa ștergerea. Încearcă din nou." }
  }

  await writeAudit(session.salon.id, "salon_delete_requested", "salons", session.salon.id, {})
  return { ok: true }
}

export async function cancelSalonDeletionAction(): Promise<ActionResult> {
  const session = await requireRole(["owner"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  if (!session.salon.deleted_at) return { ok: true }

  const deletedAt = new Date(session.salon.deleted_at)
  const deadline = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (Date.now() > deadline.getTime()) {
    return { ok: false, error: "Perioada de anulare a expirat." }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("salons")
    .update({ deleted_at: null })
    .eq("id", session.salon.id)
  if (error) {
    console.error("[v0] cancelSalonDeletionAction:", error.message)
    return { ok: false, error: "Nu am putut anula ștergerea. Încearcă din nou." }
  }

  await writeAudit(session.salon.id, "salon_delete_cancelled", "salons", session.salon.id, {})
  return { ok: true }
}
