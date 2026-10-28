import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

/**
 * Audit trail for sensitive-data access and edits. Fire-and-forget from the
 * caller's perspective: a failed audit insert is logged but never blocks the
 * user-facing operation (the operation itself has already succeeded or failed
 * on its own merits).
 */
export async function writeAudit(
  salonId: string,
  action: string,
  entity: string,
  entityId: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const session = await getSession()
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("audit_log").insert({
      salon_id: salonId,
      actor_user_id: session?.user.id ?? null,
      action,
      entity,
      entity_id: entityId,
      meta: meta ?? null,
    })
    if (error) {
      console.error("[v0] writeAudit insert failed:", error.message)
    }
  } catch (err) {
    console.error("[v0] writeAudit failed:", err instanceof Error ? err.message : err)
  }
}
