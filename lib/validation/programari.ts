import { z } from "zod"

// ─── Programări validation (RO messages) ─────────────────────────────────────

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const APPOINTMENT_STATUSES = [
  "in_asteptare",
  "confirmat",
  "in_desfasurare",
  "finalizat",
  "anulat",
  "no_show",
] as const

export type AppointmentStatusValue = (typeof APPOINTMENT_STATUSES)[number]

export const RECURRENCES = ["niciodata", "saptamanal", "bi_saptamanal", "lunar"] as const
export type RecurrenceValue = (typeof RECURRENCES)[number]

/** Normalizes a Romanian phone to E.164 (+40…). */
export function normalizePhoneRo(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10 && digits.startsWith("0")) return `+40${digits.slice(1)}`
  if (digits.length === 12 && digits.startsWith("40")) return `+${digits}`
  if (digits.length === 9) return `+40${digits}`
  return raw.trim().startsWith("+") ? `+${digits}` : `+${digits}`
}

export const phoneE164 = z
  .string()
  .trim()
  .min(6, "Numărul de telefon este obligatoriu.")
  .transform(normalizePhoneRo)
  .refine((v) => /^\+[1-9][0-9]{6,14}$/.test(v), {
    message: "Număr de telefon invalid. Folosește un număr românesc (ex. 0722 123 456).",
  })

export const newClientSchema = z.object({
  firstName: z.string().trim().min(1, "Prenumele este obligatoriu.").max(80),
  lastName: z.string().trim().min(1, "Numele este obligatoriu.").max(80),
  phone: phoneE164,
})
export type NewClientInput = z.infer<typeof newClientSchema>

export const appointmentServiceSchema = z.object({
  serviceId: z.string().uuid("Serviciu invalid.").nullable().optional(),
  name: z.string().trim().min(1, "Numele serviciului este obligatoriu.").max(160),
  durationMin: z.number().int().min(1, "Durată invalidă.").max(24 * 60),
  price: z.number().min(0, "Preț invalid.").max(1000000),
})
export type AppointmentServiceInput = z.infer<typeof appointmentServiceSchema>

const appointmentBase = z.object({
  clientId: z.string().uuid("Client invalid.").nullable().optional(),
  newClient: newClientSchema.nullable().optional(),
  staffId: z.string().uuid("Specialist invalid."),
  date: z.string().regex(DATE_RE, "Dată invalidă."),
  startTime: z.string().regex(TIME_RE, "Oră invalidă (HH:MM)."),
  services: z.array(appointmentServiceSchema).min(1, "Alege cel puțin un serviciu."),
  status: z.enum(APPOINTMENT_STATUSES).default("confirmat"),
  notes: z.string().trim().max(2000).default(""),
  discount: z.number().min(0).max(1000000).default(0),
  discountType: z.enum(["procent", "fix"]).default("procent"),
  recurrence: z.enum(RECURRENCES).default("niciodata"),
  override: z.boolean().default(false),
  // P12: receptionist tick — email confirmation to the client (only sent
  // when the client actually has an email address; silently skipped otherwise).
  sendConfirmation: z.boolean().default(false),
})

const clientOrNewRefine = <T extends { clientId?: string | null; newClient?: unknown }>(d: T) =>
  d.clientId != null || d.newClient != null

const discountRefine = <T extends { discountType: "procent" | "fix"; discount: number }>(d: T) =>
  d.discountType !== "procent" || d.discount <= 100

export const createAppointmentSchema = appointmentBase
  .refine(clientOrNewRefine, {
    message: "Alege un client sau adaugă unul nou.",
    path: ["clientId"],
  })
  .refine(discountRefine, {
    message: "Reducerea procentuală nu poate depăși 100%.",
    path: ["discount"],
  })
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export const updateAppointmentSchema = appointmentBase
  .extend({
    id: z.string().uuid("Programare invalidă."),
    scope: z.enum(["single", "rest_of_series"]).default("single"),
  })
  .refine(clientOrNewRefine, {
    message: "Alege un client sau adaugă unul nou.",
    path: ["clientId"],
  })
  .refine(discountRefine, {
    message: "Reducerea procentuală nu poate depăși 100%.",
    path: ["discount"],
  })
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>

export const updateStatusSchema = z.object({
  id: z.string().uuid("Programare invalidă."),
  status: z.enum(APPOINTMENT_STATUSES),
  cancelReason: z
    .string()
    .trim()
    .max(500, "Motivul este prea lung.")
    .optional()
    .nullable(),
  // Staff may also edit notes on their own appointments (RLS is row-level
  // only; the column restriction is enforced here and in the data layer).
  notes: z.string().trim().max(2000).optional(),
})
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

export const rangeSchema = z.object({
  from: z.string().regex(DATE_RE, "Dată invalidă."),
  to: z.string().regex(DATE_RE, "Dată invalidă."),
})

export const clientSearchSchema = z.object({
  query: z.string().trim().min(1, "Introdu un termen de căutare.").max(80),
})

/** Maps an RPC error code to the user-facing Romanian message. */
export function appointmentErrorCodeToMessage(
  code: string,
  staffName?: string | null,
): string {
  switch (code) {
    case "overlap":
      return `Intervalul se suprapune cu altă programare a lui ${staffName || "specialistului ales"}. Alege altă oră sau alt specialist.`
    case "outside_schedule":
      return `${staffName || "Specialistul ales"} nu are program în intervalul ales. Alege altă oră sau alt specialist.`
    case "time_off":
      return `${staffName || "Specialistul ales"} este în concediu în intervalul ales. Alege altă oră sau alt specialist.`
    case "blocked_slot":
      return `Intervalul este blocat pentru ${staffName || "specialistul ales"}. Alege altă oră sau alt specialist.`
    case "invalid_staff":
      return "Specialistul selectat nu mai este activ."
    case "invalid_client":
      return "Clientul selectat nu a fost găsit."
    case "invalid_appointment":
      return "Programarea nu a fost găsită."
    case "forbidden":
      return "Nu ai permisiunea să modifici această programare."
    default:
      return "S-a produs o eroare la salvare. Încearcă din nou."
  }
}

/** Codes the owner/manager may override with an explicit confirmation. */
export function isOverridableCode(code: string): boolean {
  return code === "outside_schedule" || code === "time_off" || code === "blocked_slot"
}
