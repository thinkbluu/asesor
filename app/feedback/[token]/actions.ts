"use server"

import { createHash } from "crypto"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"

export type FeedbackSubmitResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "invalid" | "used" | "expired" | "error" }

// Single-use submit through submit_feedback_rpc (service_role only). The
// token arrives from the URL, is hashed here, and only the hash travels on.
export async function submitFeedbackAction(
  token: string,
  rating: number,
  comment: string,
  routedToGoogle: boolean,
): Promise<FeedbackSubmitResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, reason: "not-configured" }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, reason: "invalid" }
  }

  const tokenHash = createHash("sha256").update(token).digest("hex")
  const admin = createSupabaseAdminClient()

  const { error } = await admin.rpc("submit_feedback_rpc", {
    p_token_hash: tokenHash,
    p_rating: rating,
    p_comment: comment.slice(0, 1000),
    p_routed_to_google: routedToGoogle,
  })

  if (!error) return { ok: true }

  const code = typeof error.code === "string" ? error.code : ""
  // P0001 raise_exception — disambiguate by the message we raised in 016.
  if (error.message === "used") return { ok: false, reason: "used" }
  if (error.message === "expired") return { ok: false, reason: "expired" }
  if (error.message === "invalid" || code === "PGRST202") return { ok: false, reason: "invalid" }
  console.error("[v0] submit_feedback_rpc failed:", error.message)
  return { ok: false, reason: "error" }
}
