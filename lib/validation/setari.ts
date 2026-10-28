import { z } from "zod"
import { hoursDaySchema, phoneField } from "./onboarding"

// ─── Field primitives ────────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{3,48}$/, "Slug-ul poate conține doar litere mici, cifre și cratime (3–48 de caractere).")

const urlOrEmpty = (label: string) =>
  z
    .string()
    .trim()
    .max(500, "URL-ul este prea lung.")
    .default("")
    .refine((v) => v === "" || /^https?:\/\//.test(v), { message: `${label} invalid (trebuie să înceapă cu http(s)://).` })

const emailOrEmpty = z
  .string()
  .trim()
  .max(120, "Adresa de email este prea lungă.")
  .default("")
  .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), { message: "Adresă de email invalidă." })

// ─── Profil ──────────────────────────────────────────────────────────────────
// Doar câmpurile cu coloane în `salons`. Website, județ, cod poștal, social
// URLs, CUI și nr. RC rămân UI-only până apar coloanele (vezi docs/data-pattern.md).

export const setariProfilSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Numele salonului trebuie să aibă cel puțin 2 caractere.")
    .max(80, "Numele salonului este prea lung."),
  description: z.string().trim().max(600, "Descrierea este prea lungă.").default(""),
  phone: phoneField,
  email: emailOrEmpty,
  address: z.string().trim().max(160, "Adresa este prea lungă.").default(""),
  city: z.string().trim().max(60, "Numele orașului este prea lung.").default(""),
})

export type SetariProfilInput = z.infer<typeof setariProfilSchema>

// ─── Program ─────────────────────────────────────────────────────────────────

export const setariProgramSchema = z.object({
  days: z.array(hoursDaySchema).length(7, "Programul trebuie să conțină 7 zile."),
})

export type SetariProgramInput = z.infer<typeof setariProgramSchema>

// ─── Politici (booking rules) ────────────────────────────────────────────────

export const setariReguliSchema = z.object({
  minNoticeMin: z.coerce
    .number({ invalid_type_error: "Anticiparea minimă este obligatorie." })
    .int()
    .min(0, "Anticiparea minimă nu poate fi negativă.")
    .max(4320, "Anticiparea minimă poate fi de maxim 3 zile."),
  maxDaysAhead: z.coerce
    .number({ invalid_type_error: "Numărul de zile este obligatoriu." })
    .int()
    .min(1, "Minim 1 zi în avans.")
    .max(365, "Maximum 365 de zile în avans."),
  cancellationWindowHours: z.coerce.number().int().min(0).max(168),
  onlineEnabled: z.boolean(),
  requireConfirmation: z.boolean().default(false),
  slotIntervalMin: z.coerce
    .number()
    .int()
    .refine((v) => [5, 10, 15, 20, 30, 60].includes(v), { message: "Interval invalid." })
    .default(15),
})

export type SetariReguliInput = z.infer<typeof setariReguliSchema>

// ─── Branding (booking page) ─────────────────────────────────────────────────

export const setariBrandingSchema = z.object({
  slug: slugSchema,
  logoUrl: urlOrEmpty("Logo-ul"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Culoare invalidă."),
  welcomeTitle: z.string().trim().min(1, "Titlul este obligatoriu.").max(60, "Titlul poate avea maxim 60 de caractere."),
  welcomeSubtitle: z.string().trim().max(100, "Subtitlul poate avea maxim 100 de caractere.").default(""),
  coverImageUrl: urlOrEmpty("Imaginea de copertă"),
  aboutText: z.string().trim().max(400, "Textul poate avea maxim 400 de caractere.").default(""),
  showPrices: z.boolean(),
  showDurations: z.boolean(),
  requireDeposit: z.boolean(),
  depositPercent: z.coerce.number().int().min(0).max(100),
  cancellationPolicy: z.string().trim().max(1000, "Politica de anulare este prea lungă.").default(""),
  minAdvanceHours: z.coerce.number().int().min(0, "Minim 0 ore.").max(72, "Maximum 72 de ore."),
  maxAdvanceDays: z.coerce.number().int().min(1, "Minim 1 zi.").max(365, "Maximum 365 de zile."),
})

export type SetariBrandingInput = z.infer<typeof setariBrandingSchema>

// ─── Loialitate (LoyaltyConfig jsonb) ────────────────────────────────────────

export const loyaltyTierSchema = z.object({
  id: z.string().trim().min(1).max(40),
  points: z.coerce.number().int().min(1, "Minim 1 punct.").max(100000),
  discountPercent: z.coerce.number().int().min(0).max(100),
  label: z.string().trim().min(1, "Eticheta este obligatorie.").max(80),
})

export const loyaltyRewardSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1, "Numele recompensei este obligatoriu.").max(120),
  points: z.coerce.number().int().min(1, "Minim 1 punct.").max(100000),
  description: z.string().trim().max(300).optional(),
  category: z.enum(["service", "product", "voucher"]),
  active: z.boolean(),
})

export const loyaltyConfigSchema = z.object({
  enabled: z.boolean(),
  ronPerPoint: z.coerce.number().int().min(1, "Minim 1 Leu per punct.").max(1000),
  expirationMonths: z.coerce
    .number()
    .int()
    .refine((v) => [0, 6, 12, 24].includes(v), { message: "Valoare invalidă pentru expirare." }),
  bonus: z.object({
    birthdayEnabled: z.boolean(),
    birthdayMultiplier: z.coerce.number().int().min(2).max(4),
    birthdayWindowDays: z.coerce.number().int().min(1).max(30),
    referralEnabled: z.boolean(),
    referralPoints: z.coerce.number().int().min(0).max(10000),
    firstVisitEnabled: z.boolean(),
    firstVisitPoints: z.coerce.number().int().min(0).max(10000),
  }),
  tiers: z.array(loyaltyTierSchema).min(1, "Păstrează cel puțin un tier.").max(10),
  rewards: z.array(loyaltyRewardSchema).max(50),
})

export type LoyaltyConfigInput = z.infer<typeof loyaltyConfigSchema>

// ─── Recenzii (ReviewsConfig jsonb) ──────────────────────────────────────────

export const reviewsConfigSchema = z.object({
  enabled: z.boolean(),
  googleBusinessUrl: urlOrEmpty("Link-ul Google Business"),
  googlePlaceId: z.string().trim().max(120).default(""),
  hoursAfterAppointment: z.coerce.number().int().min(1, "Minim 1 oră.").max(168, "Maximum 168 de ore."),
  minStarsForGoogle: z.coerce
    .number()
    .int()
    .refine((v) => [3, 4, 5].includes(v), { message: "Prag invalid." }),
  channel: z.enum(["whatsapp", "sms", "email"]),
})

export type ReviewsConfigInput = z.infer<typeof reviewsConfigSchema>

// ─── Servicii: categorii + servicii ──────────────────────────────────────────
// icon + culoarea categoriei sunt UI-only (fără coloane) — se acceptă în input
// dar nu se salvează.

export const setariCategorySchema = z.object({
  id: z.string().uuid("Categorie invalidă.").optional(),
  name: z.string().trim().min(1, "Numele categoriei este obligatoriu.").max(60, "Numele categoriei este prea lung."),
  icon: z.string().trim().max(30).optional(),
  color: z.string().trim().max(20).optional(),
})

export type SetariCategoryInput = z.infer<typeof setariCategorySchema>

export const setariServiceProductSchema = z.object({
  productId: z.string().uuid("Produs invalid."),
  quantityPerUse: z.coerce
    .number({ invalid_type_error: "Cantitatea este obligatorie." })
    .min(0.001, "Cantitatea trebuie să fie pozitivă.")
    .max(10000),
})

export const setariServiceSchema = z.object({
  id: z.string().uuid("Serviciu invalid.").optional(),
  categoryId: z.string().uuid("Categorie invalidă.").nullable().default(null),
  name: z.string().trim().min(1, "Numele serviciului este obligatoriu.").max(80, "Numele serviciului este prea lung."),
  description: z.string().trim().max(600, "Descrierea este prea lungă.").default(""),
  durationMin: z.coerce
    .number({ invalid_type_error: "Durata este obligatorie." })
    .int()
    .min(5, "Durata minimă este de 5 minute.")
    .max(480, "Durata maximă este de 480 de minute."),
  bufferMin: z.coerce.number().int().min(0).max(120).default(0),
  price: z.coerce
    .number({ invalid_type_error: "Prețul este obligatoriu." })
    .min(0, "Prețul nu poate fi negativ.")
    .max(100000, "Prețul este prea mare."),
  priceFrom: z.boolean().default(false),
  onlineBookable: z.boolean().default(true),
  active: z.boolean().default(true),
  staffIds: z.array(z.string().uuid("Angajat invalid.")).max(200).default([]),
  products: z.array(setariServiceProductSchema).max(50).default([]),
})

export type SetariServiceInput = z.infer<typeof setariServiceSchema>

export const setariReorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().uuid(), sortOrder: z.coerce.number().int().min(0).max(9999) }))
    .min(1)
    .max(500),
})

export type SetariReorderInput = z.infer<typeof setariReorderSchema>
