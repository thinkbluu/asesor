import { z } from "zod"

// Validation for /app/echipa. Romanian error messages, same conventions as
// the other modules (lib/validation/*).

export const STAFF_STATUSES = ["activ", "concediu", "inactiv"] as const
export type StaffStatus = (typeof STAFF_STATUSES)[number]

export const COMMISSION_TYPES = ["procent", "fix", "salariu"] as const
export type CommissionType = (typeof COMMISSION_TYPES)[number]

export const TIME_OFF_STATUSES = ["pending", "approved", "rejected"] as const
export type TimeOffStatus = (typeof TIME_OFF_STATUSES)[number]

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} este prea lung.`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

export const createStaffSchema = z.object({
  firstName: z.string().trim().min(1, "Prenumele este obligatoriu.").max(80),
  lastName: z.string().trim().min(1, "Numele este obligatoriu.").max(80),
  roleTitle: optionalText(80, "Titlul"),
  phone: optionalText(30, "Telefonul"),
  email: z
    .string()
    .trim()
    .email("Adresa de email nu este validă.")
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null)),
  status: z.enum(STAFF_STATUSES).default("activ"),
  hiredAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data angajării nu este validă.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  notes: optionalText(2000, "Notele"),
  color: optionalText(20, "Culoarea"),
  commissionType: z.enum(COMMISSION_TYPES).nullable().default(null),
  commissionRate: z.number().min(0, "Procentul nu poate fi negativ.").max(100000).nullable().default(null),
})
export type CreateStaffInput = z.infer<typeof createStaffSchema>

export const updateStaffSchema = createStaffSchema.partial().extend({
  id: z.string().uuid("Specialist invalid."),
  // Soft delete only — hard deletes never happen from the UI.
  deleted: z.boolean().optional(),
})
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>

export const scheduleDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  isWorking: z.boolean(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ora de început nu este validă.")
    .nullable()
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ora de sfârșit nu este validă.")
    .nullable()
    .optional(),
  breakStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pauza nu este validă.")
    .nullable()
    .optional(),
  breakEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pauza nu este validă.")
    .nullable()
    .optional(),
})
export type ScheduleDayInput = z.infer<typeof scheduleDaySchema>

export const saveScheduleSchema = z.object({
  staffId: z.string().uuid("Specialist invalid."),
  days: z.array(scheduleDaySchema).length(7, "Programul trebuie să acopere toate cele 7 zile."),
})
export type SaveScheduleInput = z.infer<typeof saveScheduleSchema>

export const requestTimeOffSchema = z.object({
  staffId: z.string().uuid("Specialist invalid."),
  startsAt: z.string().min(1, "Data începutului este obligatorie."),
  endsAt: z.string().min(1, "Data sfârșitului este obligatorie."),
  reason: optionalText(500, "Motivul"),
})
export type RequestTimeOffInput = z.infer<typeof requestTimeOffSchema>

export const decideTimeOffSchema = z.object({
  id: z.string().uuid("Cerere invalidă."),
  status: z.enum(["approved", "rejected"]),
})
export type DecideTimeOffInput = z.infer<typeof decideTimeOffSchema>

export const blockedSlotSchema = z.object({
  staffId: z.string().uuid("Specialist invalid."),
  startsAt: z.string().min(1, "Începutul blocării este obligatoriu."),
  endsAt: z.string().min(1, "Sfârșitul blocării este obligatoriu."),
  reason: optionalText(300, "Motivul"),
})
export type BlockedSlotInput = z.infer<typeof blockedSlotSchema>

export const deleteBlockedSlotSchema = z.object({
  id: z.string().uuid("Blocare invalidă."),
})

export const setStaffServiceSchema = z.object({
  staffId: z.string().uuid("Specialist invalid."),
  serviceId: z.string().uuid("Serviciu invalid."),
  // null = remove the staff-service link entirely.
  active: z.boolean(),
  priceOverride: z.number().min(0).nullable().optional(),
  durationOverride: z.number().int().min(1).nullable().optional(),
})
export type SetStaffServiceInput = z.infer<typeof setStaffServiceSchema>

export const inviteStaffSchema = z.object({
  staffId: z.string().uuid("Specialist invalid."),
  email: z.string().trim().email("Adresa de email nu este validă."),
})
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
