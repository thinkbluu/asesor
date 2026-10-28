// Single source of truth for site identity and legal/contact details.
// Placeholder values in brackets must be filled before production launch.

export const SITE = {
  name: "ASESOR",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://asesor.ro",
  tagline: "Ordine. Claritate. Control.",
  legalEntity: "[DENUMIRE OPERATOR S.R.L.]",
  cui: "[CUI]",
  regCom: "[J35/...]",
  address: "[ADRESĂ], Timișoara",
  supportHours: "luni–vineri 09–18, sâmbătă 10–14",
  responseTime: "24 de ore",
  dailyBackups: true,
  socials: {},
  emails: {
    contact: "contact@asesor.ro",
    support: "support@asesor.ro",
    dpo: "dpo@asesor.ro",
    legal: "legal@asesor.ro",
    billing: "facturare@asesor.ro",
  },
} as const
