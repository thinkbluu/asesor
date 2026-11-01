import { z } from "zod"

export const CONTACT_SUBJECTS = [
  "general",
  "demo",
  "pilot",
  "premium",
  "suport",
  "facturare",
] as const
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  general: "Întrebare generală",
  demo: "Vreau o prezentare",
  pilot: "Programul pilot",
  premium: "Pachetul Premium",
  suport: "Suport",
  facturare: "Facturare",
}

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Numele este obligatoriu.").max(120),
  email: z.string().trim().email("Adresa de email nu este validă.").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^$|^[\d\s()+-]{6,20}$/, "Numărul de telefon nu este valid.")
    .optional()
    .or(z.literal("")),
  salonName: z.string().trim().max(120).optional().or(z.literal("")),
  subject: z.enum(CONTACT_SUBJECTS, {
    error: "Alege un subiect.",
  }),
  message: z.string().trim().min(10, "Scrie un mesaj de cel puțin 10 caractere.").max(2000),
  gdpr: z.literal(true, { error: "Ai nevoie de acordul GDPR." }),
  // Honeypot + Turnstile travel outside the schema (raw strings).
})

export type ContactInput = z.infer<typeof contactSchema>
