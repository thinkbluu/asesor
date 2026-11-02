import { z } from "zod"
import { normalizePhoneRo } from "./programari"

// ─── Public booking validation (RO messages) ─────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export const bookingDetailsSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  serviceIds: z
    .array(z.string().uuid("Serviciu invalid."))
    .min(1, "Alege cel puțin un serviciu.")
    .max(10, "Prea multe servicii într-o singură programare."),
  staffId: z.string().uuid("Specialist invalid.").nullable(),
  date: z.string().regex(DATE_RE, "Dată invalidă."),
  time: z.string().regex(TIME_RE, "Oră invalidă."),
  firstName: z.string().trim().min(2, "Introdu prenumele (minim 2 caractere).").max(60, "Prenumele este prea lung."),
  lastName: z.string().trim().min(2, "Introdu numele (minim 2 caractere).").max(60, "Numele este prea lung."),
  phone: z
    .string()
    .transform(normalizePhoneRo)
    .pipe(z.string().regex(/^\+40\d{9}$/, "Introdu un număr de telefon românesc valid (ex: 0722 123 456).")),
  email: z.string().trim().min(1, "Adresa de email este obligatorie pentru confirmare.").email("Introdu o adresă de email validă.").max(120, "Adresa de email este prea lungă."),
  notes: z.string().trim().max(500, "Observațiile nu pot depăși 500 de caractere.").optional().default(""),
  gdpr: z.boolean().refine((v) => v === true, {
    message: "Bifează că ai citit politica de confidențialitate.",
  }),
  marketing: z.boolean().optional().default(false),
  // Honeypot: real users never fill this; bots do.
  website: z.string().max(0).optional().default(""),
  turnstileToken: z.string().optional().default(""),
})

export type BookingDetailsInput = z.input<typeof bookingDetailsSchema>
export type BookingDetails = z.output<typeof bookingDetailsSchema>
