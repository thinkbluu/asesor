import { z } from "zod"

// Zod schemas for the Stocuri page (P8 part 1). Romanian error messages.

const positiveNumber = (label: string) =>
  z.coerce
    .number({ error: `${label} trebuie să fie un număr.` })
    .positive(`${label} trebuie să fie mai mare decât 0.`)

const nonNegativeNumber = (label: string) =>
  z.coerce
    .number({ error: `${label} trebuie să fie un număr.` })
    .min(0, `${label} nu poate fi negativ.`)

export const productSchema = z.object({
  name: z.string().trim().min(1, "Numele produsului este obligatoriu.").max(120),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  unit: z.string().trim().min(1, "Unitatea de măsură este obligatorie.").max(20),
  minStock: nonNegativeNumber("Stocul minim"),
  costPrice: nonNegativeNumber("Prețul de achiziție").optional(),
  retailPrice: nonNegativeNumber("Prețul de vânzare").optional(),
  supplierName: z.string().trim().max(120).optional().or(z.literal("")),
  supplierPhone: z.string().trim().max(40).optional().or(z.literal("")),
  supplierEmail: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Adresa de email nu este validă.")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  active: z.boolean().default(true),
})
export type ProductInput = z.infer<typeof productSchema>

// Movement types a user can create. `consum` is written exclusively by the
// on_appointment_finalized trigger (scripts/003) and is rejected here.
export const USER_MOVEMENT_TYPES = ["receptie", "ajustare", "pierdere", "retur"] as const
export type UserMovementType = (typeof USER_MOVEMENT_TYPES)[number]

export const movementSchema = z
  .object({
    type: z.enum(USER_MOVEMENT_TYPES, { error: "Tipul mișcării nu este valid." }),
    productId: z.string().uuid("Produsul selectat nu este valid."),
    // Recepție / pierdere / retur: quantity in product units (> 0). The sign
    // is applied by the data layer (receptie positive, the rest negative).
    quantity: positiveNumber("Cantitatea").optional(),
    // Ajustare (inventory count): the counted stock; the app writes the
    // difference as a signed movement.
    countedStock: nonNegativeNumber("Cantitatea countată").optional(),
    invoiceNumber: z.string().trim().max(60).optional().or(z.literal("")),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (val.type === "ajustare") {
      if (val.countedStock == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["countedStock"], message: "Introdu cantitatea countată." })
      }
    } else if (val.quantity == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Introdu cantitatea." })
    }
  })
export type MovementInput = z.infer<typeof movementSchema>

export const productLinkSchema = z.object({
  productId: z.string().uuid("Produsul selectat nu este valid."),
  links: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantityPerUse: positiveNumber("Cantitatea pe utilizare"),
      }),
    )
    .max(100, "Prea multe legături."),
})
export type ProductLinkInput = z.infer<typeof productLinkSchema>
