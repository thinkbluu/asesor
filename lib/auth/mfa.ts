"use server"

import "server-only"

// TOTP MFA via Supabase Auth, plus the AAL2 gate for owner-only actions.
//
// Flow: enrollTotpStartAction returns the QR (data URL) + secret, the owner
// scans it and confirms with a 6-digit code (enrollTotpVerifyAction), which
// upgrades the current session to AAL2. From then on, every sensitive action
// (role change, member removal, day reopen, client delete) checks
// getAuthenticatorAssuranceLevel(): if the account has a verified factor but
// the current session is only AAL1, the action returns needsMfa and the UI
// prompts for a code (verifyAal2Action upgrades the session in place).

import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

/** Sentinel returned by guarded actions when the code prompt is required. */
export type MfaRequired = { ok: false; needsMfa: true }
export const MFA_REQUIRED: MfaRequired = { ok: false, needsMfa: true }

export type MfaStatusResult =
  | { ok: true; enrolled: boolean; factorId: string | null }
  | { ok: false; error: string }

export type EnrollStartResult =
  | { ok: true; factorId: string; qr: string | null; secret: string | null }
  | { ok: false; error: string }

export type MfaVerifyResult = { ok: true } | { ok: false; error: string }

/**
 * True when the account has a verified MFA factor but the current session is
 * below AAL2 — the action must stop and ask for a code.
 */
export async function aal2Required(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error) {
      console.error("[v0] getAuthenticatorAssuranceLevel failed:", error.message)
      return false
    }
    // The account can reach AAL2 (a verified factor exists) but this session
    // has not been stepped up yet.
    return data?.nextLevel === "aal2" && data?.currentLevel !== "aal2"
  } catch (err) {
    console.error("[v0] aal2Required failed:", err instanceof Error ? err.message : err)
    return false
  }
}

async function verifiedTotpFactorId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) return null
  return data.totp.find((f) => f.status === "verified")?.id ?? null
}

export async function getMfaStatusAction(): Promise<MfaStatusResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) return { ok: false, error: "Nu am putut citi starea MFA." }
  const verified = data.totp.find((f) => f.status === "verified")
  return { ok: true, enrolled: Boolean(verified), factorId: verified?.id ?? null }
}

export async function enrollTotpStartAction(): Promise<EnrollStartResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  const supabase = await createSupabaseServerClient()

  // One verified factor is enough; re-enrollment means unenroll first.
  const existing = await verifiedTotpFactorId(supabase)
  if (existing) return { ok: false, error: "MFA este deja activ. Dezactivează-l mai întâi." }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "ASESOR",
  })
  if (error || !data) return { ok: false, error: "Nu am putut începe enrollarea MFA." }
  return {
    ok: true,
    factorId: data.id,
    qr: data.totp.qr_code ?? null,
    secret: data.totp.secret ?? null,
  }
}

export async function enrollTotpVerifyAction(
  factorId: string,
  code: string,
): Promise<MfaVerifyResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Introdu codul din 6 cifre." }

  const supabase = await createSupabaseServerClient()
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  })
  if (challengeError || !challenge) return { ok: false, error: "Provocarea MFA a eșuat. Reîncearcă." }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  })
  if (verifyError) {
    return { ok: false, error: "Cod incorect. Încearcă din nou." }
  }
  return { ok: true }
}

export async function unenrollTotpAction(factorId: string): Promise<MfaVerifyResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) return { ok: false, error: "Nu am putut dezactiva MFA. Încearcă din nou." }
  return { ok: true }
}

/** AAL2 step-up for the current session: challenge + verify on the TOTP factor. */
export async function verifyAal2Action(code: string): Promise<MfaVerifyResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: "Sesiune expirată. Autentifică-te din nou." }
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Introdu codul din 6 cifre." }

  const supabase = await createSupabaseServerClient()
  const factorId = await verifiedTotpFactorId(supabase)
  if (!factorId) return { ok: false, error: "MFA nu este activ pe acest cont." }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  })
  if (challengeError || !challenge) return { ok: false, error: "Provocarea MFA a eșuat. Reîncearcă." }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  })
  if (verifyError) return { ok: false, error: "Cod incorect. Încearcă din nou." }
  return { ok: true }
}
