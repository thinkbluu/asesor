// Shared auth constants: legal document versions, cookie names, plan ids.

export const TERMS_VERSION = "1.0"
export const PRIVACY_VERSION = "1.0"
export const DPA_VERSION = "1.0"

export const LEGAL_LINKS = {
  terms: "/terms",
  privacy: "/privacy",
  dpa: "/dpa",
} as const

// Cookie that remembers which salon a multi-salon user is working in.
export const SALON_COOKIE = "asesor_salon"

export const PLANS = ["basic", "pro", "premium"] as const
export type Plan = (typeof PLANS)[number]

export function normalizePlan(value: string | null | undefined): Plan {
  return PLANS.includes(value as Plan) ? (value as Plan) : "basic"
}
