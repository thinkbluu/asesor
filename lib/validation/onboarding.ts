import { z } from "zod"

// ─── Shared action plumbing (re-exported by other validation modules) ────────

export type FieldErrors = Record<string, string>

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: FieldErrors }

export function zodToActionError(error: z.ZodError): { error: string; fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_"
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message
  }
  return { error: error.issues[0]?.message ?? "Date invalide.", fieldErrors }
}

// ─── Field primitives ────────────────────────────────────────────────────────

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const PHONE_RE = /^[0-9()+\-\s./]{6,24}$/

export const phoneField = z
  .string()
  .trim()
  .max(24, "Numărul de telefon este prea lung.")
  .default("")
  .refine((v) => v === "" || PHONE_RE.test(v), { message: "Număr de telefon invalid." })

export const hoursDaySchema = z
  .object({
    weekday: z.number().int().min(0, "Zi invalidă.").max(6, "Zi invalidă."),
    isOpen: z.boolean(),
    opens: z.string().regex(TIME_RE, "Oră invalidă (HH:MM).").default("09:00"),
    closes: z.string().regex(TIME_RE, "Oră invalidă (HH:MM).").default("19:00"),
  })
  .refine((d) => !d.isOpen || d.opens < d.closes, {
    message: "Ora de închidere trebuie să fie după ora de deschidere.",
  })

// ─── Step 1: salon info ──────────────────────────────────────────────────────

export const onboardingSalonStepSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Numele salonului trebuie să aibă cel puțin 2 caractere.")
    .max(80, "Numele salonului este prea lung."),
  city: z
    .string()
    .trim()
    .min(2, "Orașul este obligatoriu.")
    .max(60, "Numele orașului este prea lung."),
  address: z.string().trim().max(160, "Adresa este prea lungă.").default(""),
  phone: phoneField,
})

export type OnboardingSalonStepInput = z.infer<typeof onboardingSalonStepSchema>

// ─── Step 2: services ────────────────────────────────────────────────────────

export const onboardingServiceItemSchema = z.object({
  id: z.string().uuid("Serviciu invalid.").optional(),
  name: z.string().trim().min(1, "Numele serviciului este obligatoriu.").max(80, "Numele serviciului este prea lung."),
  durationMin: z.coerce
    .number({ invalid_type_error: "Durata este obligatorie." })
    .int("Durata trebuie să fie un număr întreg.")
    .min(5, "Durata minimă este de 5 minute.")
    .max(480, "Durata maximă este de 480 de minute."),
  price: z.coerce
    .number({ invalid_type_error: "Prețul este obligatoriu." })
    .min(0, "Prețul nu poate fi negativ.")
    .max(100000, "Prețul este prea mare."),
})

export const onboardingServicesStepSchema = z.object({
  services: z
    .array(onboardingServiceItemSchema)
    .min(1, "Adaugă cel puțin un serviciu.")
    .max(100, "Maximum 100 de servicii."),
})

export type OnboardingServicesStepInput = z.infer<typeof onboardingServicesStepSchema>

// ─── Step 3: schedule ────────────────────────────────────────────────────────

export const onboardingHoursStepSchema = z.object({
  days: z.array(hoursDaySchema).length(7, "Programul trebuie să conțină 7 zile."),
})

export type OnboardingHoursStepInput = z.infer<typeof onboardingHoursStepSchema>

// ─── Step 4: team ────────────────────────────────────────────────────────────

export const onboardingStaffItemSchema = z.object({
  id: z.string().uuid("Angajat invalid.").optional(),
  name: z.string().trim().min(2, "Numele angajatului este obligatoriu.").max(80, "Numele angajatului este prea lung."),
  roleTitle: z.string().trim().max(60, "Rolul este prea lung.").default(""),
  phone: phoneField,
  serviceIds: z.array(z.string().uuid("Serviciu invalid.")).max(200).default([]),
})

export const onboardingTeamStepSchema = z.object({
  staff: z
    .array(onboardingStaffItemSchema)
    .min(1, "Adaugă cel puțin un angajat.")
    .max(50, "Maximum 50 de angajați."),
})

export type OnboardingTeamStepInput = z.infer<typeof onboardingTeamStepSchema>

// ─── Step 5: booking rules ───────────────────────────────────────────────────
// Notă: „Pauză între programări" (buffer) nu se persistă — schema nu are o
// coloană globală; buffer-ul per serviciu e `services.buffer_min` (Setări → Servicii).

export const onboardingRulesStepSchema = z.object({
  minNoticeMin: z
    .number()
    .int()
    .refine((v) => [60, 120, 240, 1440].includes(v), { message: "Valoare invalidă pentru anticiparea minimă." }),
  cancellationWindowHours: z
    .number()
    .int()
    .min(0)
    .max(168)
    .refine((v) => [2, 4, 12, 24].includes(v), { message: "Valoare invalidă pentru fereastra de anulare." }),
  onlineEnabled: z.boolean(),
})

export type OnboardingRulesStepInput = z.infer<typeof onboardingRulesStepSchema>

// ─── Skip (persist the step without writing data) ────────────────────────────

export const onboardingSkipStepSchema = z.object({
  step: z.number().int().min(1).max(4),
})
