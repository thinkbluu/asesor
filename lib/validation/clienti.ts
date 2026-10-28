import { z } from "zod"
import { normalizePhoneRo } from "@/lib/validation/programari"

// ─── List query ──────────────────────────────────────────────────────────────

export const CLIENT_TAGS = ["VIP", "Nou", "Inactiv", "Frecvent", "Sensibil", "Fidel"] as const
export const CLIENT_SOURCES = ["Google", "Instagram", "Recomandare", "Walk-in", "Facebook", "Altele"] as const
export type ClientTag = (typeof CLIENT_TAGS)[number]
export type ClientSource = (typeof CLIENT_SOURCES)[number]

export const clientListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  tag: z.enum([...CLIENT_TAGS, "toate"]).default("toate"),
  source: z.enum([...CLIENT_SOURCES, "toate"]).default("toate"),
  // "zile" filter on last visit: 7 / 30 / 90 days, or all.
  lastVisit: z.enum(["7", "30", "90", "toate"]).default("toate"),
  sort: z.enum(["nume", "ultima_vizita", "vizite", "total_cheltuit"]).default("nume"),
  page: z.coerce.number().int().min(1).default(1),
})
export type ClientListQuery = z.infer<typeof clientListQuerySchema>

export const PAGE_SIZE = 50

// ─── Profile edit ────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const clientUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Prenumele este obligatoriu.").max(100),
  lastName: z.string().trim().min(1, "Numele este obligatoriu.").max(100),
  phone: z.string().trim().transform(normalizePhoneRo)
    .refine((p) => /^\+[1-9][0-9]{6,14}$/.test(p), "Telefon invalid (ex: 0722 123 456)."),
  whatsappPhone: z.string().trim().transform(normalizePhoneRo)
    .refine((p) => p === "" || /^\+[1-9][0-9]{6,14}$/.test(p), "Număr WhatsApp invalid.")
    .transform((p) => (p === "" ? null : p)),
  email: z.string().trim().toLowerCase().email("Email invalid.").max(200).nullable().or(z.literal("").transform(() => null)),
  birthDate: z.string().regex(DATE_RE, "Dată invalidă.").nullable().or(z.literal("").transform(() => null)),
  sex: z.enum(["F", "M", "Nespecificat"]).default("Nespecificat"),
  source: z.enum(CLIENT_SOURCES).nullable(),
  tags: z.array(z.enum(CLIENT_TAGS)).max(6).default([]),
  preferredStaffId: z.string().uuid().nullable().or(z.literal("").transform(() => null)),
  communicationPref: z.enum(["SMS", "Email", "WhatsApp"]).nullable(),
  notes: z.string().trim().max(5000).default(""),
})
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>

// ─── Sensitive (protected health data) ───────────────────────────────────────

export const sensitiveSaveSchema = z.object({
  clientId: z.string().uuid("Client invalid."),
  allergies: z.string().trim().max(5000, "Textul este prea lung.").default(""),
  colorFormulas: z.string().trim().max(5000, "Textul este prea lung.").default(""),
  // Saving allergies REQUIRES a recorded health-data consent.
  healthConsent: z.literal(true, {
    errorMap: () => ({ message: "Bifează acordul pentru datele de sănătate." }),
  }),
  consentSource: z.enum(["in_salon", "online"], {
    errorMap: () => ({ message: "Alege sursa acordului." }),
  }),
})
export type SensitiveSaveInput = z.infer<typeof sensitiveSaveSchema>

// ─── Photos ──────────────────────────────────────────────────────────────────

export const PHOTO_MAX_BYTES = 8 * 1024 * 1024
export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const

export const photoMetaSchema = z.object({
  clientId: z.string().uuid("Client invalid."),
  caption: z.string().trim().max(200).default(""),
  takenAt: z.string().datetime().nullable().optional(),
})

// ─── GDPR ────────────────────────────────────────────────────────────────────

export const clientDeleteSchema = z.object({
  clientId: z.string().uuid("Client invalid."),
  // Confirmation: the user must type the client's full name.
  confirmName: z.string().trim().min(1, "Introdu numele clientei pentru confirmare."),
})
export type ClientDeleteInput = z.infer<typeof clientDeleteSchema>

// ─── CSV import ──────────────────────────────────────────────────────────────

export const importRowSchema = z.object({
  prenume: z.string().trim().min(1, "Prenume lipsă.").max(100),
  nume: z.string().trim().min(1, "Nume lipsă.").max(100),
  telefon: z.string().trim().transform(normalizePhoneRo)
    .refine((p) => /^\+[1-9][0-9]{6,14}$/.test(p), "Telefon invalid."),
  email: z.string().trim().toLowerCase().email("Email invalid.").nullable().or(z.literal("").transform(() => null)),
  dataNasterii: z.string().regex(DATE_RE, "Dată invalidă.").nullable().or(z.literal("").transform(() => null)),
  note: z.string().trim().max(2000).default(""),
})
export type ImportRow = z.infer<typeof importRowSchema>

export const importPayloadSchema = z.object({
  rows: z.array(importRowSchema).min(1, "Nicio linie validă.").max(500, "Maximum 500 de clienți per import."),
})
export type ImportPayload = z.infer<typeof importPayloadSchema>
