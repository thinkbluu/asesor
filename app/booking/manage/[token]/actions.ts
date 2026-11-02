"use server"

import crypto from "node:crypto"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"

export type CancelResult = { ok: boolean; message: string }

export async function cancelBookingByToken(token: string): Promise<CancelResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, message: "Anularea online nu este disponibilă momentan." }
  }
  const supabase = createSupabaseAdminClient()
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  const { data: aptRow } = await supabase
    .from("appointments")
    .select("id, starts_at, status, salon_id")
    .eq("manage_token_hash", tokenHash)
    .maybeSingle()

  const apt = aptRow as {
    id: string
    starts_at: string
    status: string
    salon_id: string
  } | null

  if (!apt) {
    return { ok: false, message: "Programarea nu a fost găsită." }
  }
  if (apt.status === "anulat") {
    return { ok: true, message: "Programarea a fost deja anulată." }
  }

  // Re-check the cancellation window server-side.
  const { data: salonRow } = await supabase
    .from("salons")
    .select("cancellation_window_hours")
    .eq("id", apt.salon_id)
    .maybeSingle()
  const windowHours =
    ((salonRow as { cancellation_window_hours: number | null } | null)?.cancellation_window_hours ??
      4) as number

  const deadline = new Date(new Date(apt.starts_at).getTime() - windowHours * 3600_000)
  if (Date.now() >= deadline.getTime()) {
    return {
      ok: false,
      message: `Anularea online nu mai este posibilă (mai puțin de ${windowHours} ore până la programare). Sună la salon pentru ajutor.`,
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "anulat", cancel_reason: "Anulată de client (online)" })
    .eq("id", apt.id)

  if (error) {
    console.error("[v0] cancelBookingByToken failed:", error.message)
    return { ok: false, message: "Nu am putut anula programarea. Te rugăm să reîncerci." }
  }

  return { ok: true, message: "Programarea a fost anulată." }
}
