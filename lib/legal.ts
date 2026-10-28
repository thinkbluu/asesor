// Legal document versions and update dates. Single source of truth for the
// legal pages (/terms, /privacy, /dpa, /cookies, /subprocessors) and for the
// acceptance tracking shown to owners in /app.
//
// The terms/privacy/dpa versions are reused from lib/auth/constants.ts — they
// are the values stamped on profiles at signup and re-acceptance. Bumping a
// version here (via constants.ts) triggers the one-time re-acceptance modal.

import { TERMS_VERSION, PRIVACY_VERSION, DPA_VERSION } from "@/lib/auth/constants"

export { TERMS_VERSION, PRIVACY_VERSION, DPA_VERSION }

export const COOKIES_VERSION = "1.0"
export const SUBPROCESSORS_VERSION = "1.0"

export type LegalDocKey = "terms" | "privacy" | "dpa" | "cookies" | "subprocessors"

export const LEGAL_DOCS: Record<LegalDocKey, { version: string; updated: string }> = {
  terms: { version: TERMS_VERSION, updated: "28 octombrie 2026" },
  privacy: { version: PRIVACY_VERSION, updated: "28 octombrie 2026" },
  dpa: { version: DPA_VERSION, updated: "28 octombrie 2026" },
  cookies: { version: COOKIES_VERSION, updated: "28 octombrie 2026" },
  subprocessors: { version: SUBPROCESSORS_VERSION, updated: "28 octombrie 2026" },
}

/**
 * Which legal documents the profile has not accepted at the current version.
 * A missing version (null) counts as pending — profiles created before the
 * acceptance tracking get the one-time modal too.
 */
export function pendingLegalDocs(profile: {
  terms_version: string | null
  privacy_version: string | null
  dpa_version: string | null
} | null): LegalDocKey[] {
  if (!profile) return ["terms", "privacy", "dpa"]
  const out: LegalDocKey[] = []
  if (profile.terms_version !== TERMS_VERSION) out.push("terms")
  if (profile.privacy_version !== PRIVACY_VERSION) out.push("privacy")
  if (profile.dpa_version !== DPA_VERSION) out.push("dpa")
  return out
}
