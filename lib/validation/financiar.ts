import { z } from "zod"

// ─── Checkout (Încasează) ────────────────────────────────────────────────────

export const checkoutSchema = z
  .object({
    appointmentId: z.string().uuid("Programare invalidă."),
    discount: z.coerce.number().min(0, "Reducerea nu poate fi negativă.").default(0),
    tip: z.coerce.number().min(0, "Bacșișul nu poate fi negativ.").default(0),
    method1: z.enum(["numerar", "card", "transfer"], { message: "Alege metoda de plată." }),
    amount1: z.coerce.number().min(0, "Suma nu poate fi negativă."),
    split: z.boolean().default(false),
    method2: z.enum(["numerar", "card", "transfer"]).optional(),
    amount2: z.coerce.number().min(0, "Suma nu poate fi negativă.").optional(),
    redeemPoints: z.coerce
      .number()
      .int("Punctele trebuie să fie un număr întreg.")
      .min(0, "Punctele nu pot fi negative.")
      .default(0),
  })
  .refine((d) => !d.split || (d.method2 !== undefined && d.amount2 !== undefined && d.amount2 > 0), {
    message: "Alege a doua metodă de plată și suma.",
    path: ["method2"],
  })

export type CheckoutInput = z.infer<typeof checkoutSchema>

// ─── Refund ──────────────────────────────────────────────────────────────────

export const refundSchema = z.object({
  id: z.string().uuid("Tranzacție invalidă."),
  reason: z.string().trim().min(3, "Introdu motivul rambursării.").max(500, "Motivul este prea lung."),
})

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data nu este validă."),
  category: z.enum(
    ["chirie", "salarii", "produse", "marketing", "utilitati", "echipamente", "altele"],
    { message: "Alege categoria." },
  ),
  description: z.string().trim().max(300, "Descrierea este prea lungă.").default(""),
  amount: z.coerce.number().min(0, "Suma nu poate fi negativă."),
  frequency: z.enum(["unica", "lunar", "saptamanal"], { message: "Alege frecvența." }).default("unica"),
  notes: z.string().trim().max(500, "Notele sunt prea lungi.").default(""),
})

// ─── Day close (Închiderea zilei) ────────────────────────────────────────────

export const dayCloseSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data nu este validă."),
  cashCounted: z.coerce.number().min(0, "Suma numărată nu poate fi negativă."),
  notes: z.string().trim().max(500, "Notele sunt prea lungi.").default(""),
})

export const dayReopenSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data nu este validă."),
})
