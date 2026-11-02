"use server"

import "server-only"

// Account self-service: sign out everywhere, change password, change email
// (with re-verification). Current-password re-auth precedes every change.

import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Introdu parola actuală."),
  newPassword: z
    .string()
    .min(8, "Parola nouă trebuie să aibă cel puțin 8 caractere.")
    .max(72, "Parola este prea lungă."),
})

const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, "Introdu parola actuală."),
  newEmail: z.string().trim().email("Adresa de email nu este validă."),
})

/** Signs out every session of this account on every device. */
export async function signOutEverywhereAction(): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut({ scope: "global" })
  if (error) return { ok: false, error: "Deconectarea nu a reușit. Încearcă din nou." }
  return { ok: true }
}

async function reauth(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, email: string | null, password: string): Promise<ActionResult> {
  if (!email) return { ok: false, error: "Contul nu are o adresă de email." }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: "Parola actuală nu este corectă." }
  return { ok: true }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const supabase = await createSupabaseServerClient()
  const reauthResult = await reauth(supabase, session.user.email ?? null, parsed.data.currentPassword)
  if (!reauthResult.ok) return reauthResult

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })
  if (error) return { ok: false, error: "Parola nu a putut fi schimbată. Încearcă din nou." }
  return { ok: true }
}

export async function changeEmailAction(input: unknown): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  const parsed = changeEmailSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const supabase = await createSupabaseServerClient()
  const reauthResult = await reauth(supabase, session.user.email ?? null, parsed.data.currentPassword)
  if (!reauthResult.ok) return reauthResult

  // Supabase sends a confirmation link to the NEW address; the change only
  // applies after it is clicked (re-verification).
  const { error } = await supabase.auth.updateUser({ email: parsed.data.newEmail })
  if (error) {
    if (error.message.includes("already")) {
      return { ok: false, error: "Această adresă este deja folosită." }
    }
    return { ok: false, error: "Emailul nu a putut fi schimbat. Încearcă din nou." }
  }
  return { ok: true }
}
