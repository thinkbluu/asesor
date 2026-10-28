import { z } from "zod"

export const CONTACT_SUBJECTS = ["demo", "pilot", "premium", "altceva"] as const
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  demo: "Demo",
  pilot: "Program pilot",
  premium: "Pachet premium",
  altceva: "Altceva",
}

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Prenumele este obligatoriu.").max(80),
  lastName: z.string().trim().min(1, "Numele este obligatoriu.").max(80),
  email: z.string().trim().email("Adresa de email nu este validă.").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{6,20}$/, "Numărul de telefon nu este valid."),
  salonName: z.string().trim().max(120).optional().or(z.literal("")),
  subject: z.enum(CONTACT_SUBJECTS, {
    errorMap: () => ({ message: "Alege un subiect." }),
  }),
  message: z.string().trim().min(10, "Scrie un mesaj de cel puțin 10 caractere.").max(2000),
  gdpr: z.literal(true, { errorMap: () => ({ message: "Ai nevoie de acordul GDPR." }) }),
  // Honeypot + Turnstile travel outside the schema (raw strings).
})

export type ContactInput = z.infer<typeof contactSchema>
