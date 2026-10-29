"use server"

// Server actions for /app/echipa. Role gates mirror the RLS:
// - staff CRUD / schedules / services: owner, manager, receptionist
//   (soft delete: owner, manager only)
// - time off: staff may request for themselves and withdraw their own pending
//   requests; owner/manager approve or reject
// - blocked slots: owner/manager/receptionist any; staff only their own
// - invites: owner/manager (RLS on salon_invites)
// - stats/commissions come from the guarded views (scripts/012); a staff user
//   can only ever receive their own numbers.

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth/session"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"
import { inviteMember } from "@/lib/auth/team-actions"
import {
  createStaff as dbCreateStaff,
  createBlockedSlot as dbCreateBlockedSlot,
  decideTimeOff as dbDecideTimeOff,
  deleteBlockedSlot as dbDeleteBlockedSlot,
  deleteTimeOff as dbDeleteTimeOff,
  getSalonHours as dbGetSalonHours,
  listSalonServices as dbListSalonServices,
  listTimeOff as dbListTimeOff,
  requestTimeOff as dbRequestTimeOff,
  saveSchedule as dbSaveSchedule,
  setStaffService as dbSetStaffService,
  updateStaff as dbUpdateStaff,
} from "@/lib/data/echipa"
import type { ScheduleDay, TimeOffItem } from "@/lib/mappers/echipa"
import {
  blockedSlotSchema,
  createStaffSchema,
  decideTimeOffSchema,
  deleteBlockedSlotSchema,
  inviteStaffSchema,
  requestTimeOffSchema,
  saveScheduleSchema,
  setStaffServiceSchema,
  updateStaffSchema,
} from "@/lib/validation/echipa"
import { billingGuard } from "@/lib/billing/guard"

const TEAM_ROLES = ["owner", "manager", "receptionist"] as const
const MANAGEMENT = [...MANAGEMENT_ROLES] as const

function refresh(staffId?: string) {
  revalidatePath("/app/echipa")
  if (staffId) revalidatePath(`/app/echipa/${staffId}`)
  revalidatePath("/app")
}

// ------------------------------------------------------------
// Staff CRUD
// ------------------------------------------------------------

export async function createStaffAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = createStaffSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await dbCreateStaff(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true, data: result.data }
}

export async function updateStaffAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = updateStaffSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  // Soft delete is a management decision (mirrors staff_delete RLS).
  if (parsed.data.deleted && !(session.role && (MANAGEMENT as readonly string[]).includes(session.role))) {
    return { ok: false, error: "Doar ownerul și managerul pot șterge un specialist." }
  }

  const result = await dbUpdateStaff(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh(parsed.data.id)
  return { ok: true }
}

// ------------------------------------------------------------
// Schedule
// ------------------------------------------------------------

export async function saveScheduleAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = saveScheduleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  for (const day of parsed.data.days) {
    if (day.isWorking && (!day.startTime || !day.endTime)) {
      return { ok: false, error: "Completează ora de început și de sfârșit pentru zilele lucrătoare." }
    }
    if (day.isWorking && day.startTime && day.endTime && day.startTime >= day.endTime) {
      return { ok: false, error: "Ora de sfârșit trebuie să fie după ora de început." }
    }
  }

  const result = await dbSaveSchedule(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh(parsed.data.staffId)
  return { ok: true }
}

export async function getSalonHoursAction(): Promise<
  ActionResult<{ days: ScheduleDay[] }>
> {
  const session = await requireRole([...TEAM_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const result = await dbGetSalonHours(session.salon.id)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { days: result.data } }
}

// ------------------------------------------------------------
// Time off
// ------------------------------------------------------------

export async function requestTimeOffAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES, "staff"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = requestTimeOffSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  // Staff may only request for themselves (mirrors staff_time_off_insert RLS).
  if (session.role === "staff") {
    if (!session.staffId || parsed.data.staffId !== session.staffId) {
      return { ok: false, error: "Poți trimite cereri de concediu doar pentru tine." }
    }
  }

  if (parsed.data.endsAt <= parsed.data.startsAt) {
    return { ok: false, error: "Sfârșitul trebuie să fie după început." }
  }

  const result = await dbRequestTimeOff(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh(parsed.data.staffId)
  return { ok: true }
}

export async function decideTimeOffAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...MANAGEMENT])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = decideTimeOffSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await dbDecideTimeOff(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true }
}

export async function deleteTimeOffAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES, "staff"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = z.object({ id: z.string().uuid("Cerere invalidă.") }).safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  // Staff may withdraw only their own pending requests (mirrors RLS).
  if (session.role === "staff") {
    const client = await createSupabaseServerClient()
    const { data: row } = await client
      .from("staff_time_off")
      .select("staff_id, status")
      .eq("id", parsed.data.id)
      .eq("salon_id", session.salon.id)
      .maybeSingle()
    if (!row || row.staff_id !== session.staffId || row.status !== "pending") {
      return { ok: false, error: "Poți retrage doar cererile tale în așteptare." }
    }
  }

  const result = await dbDeleteTimeOff(session.salon.id, parsed.data.id)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true }
}

export async function listTimeOffAction(): Promise<
  ActionResult<{ items: TimeOffItem[] }>
> {
  const session = await requireRole([...TEAM_ROLES, "staff"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const result = await dbListTimeOff(session.salon.id)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

// ------------------------------------------------------------
// Blocked slots
// ------------------------------------------------------------

export async function createBlockedSlotAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES, "staff"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = blockedSlotSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  // Staff may block only their own calendar (mirrors blocked_slots_insert RLS).
  if (session.role === "staff") {
    if (!session.staffId || parsed.data.staffId !== session.staffId) {
      return { ok: false, error: "Poți bloca doar intervale din calendarul tău." }
    }
  }

  if (parsed.data.endsAt <= parsed.data.startsAt) {
    return { ok: false, error: "Sfârșitul trebuie să fie după început." }
  }

  const result = await dbCreateBlockedSlot(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh(parsed.data.staffId)
  return { ok: true }
}

export async function deleteBlockedSlotAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES, "staff"])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = deleteBlockedSlotSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  // Staff may delete only their own blocks — verify ownership first.
  if (session.role === "staff") {
    const client = await createSupabaseServerClient()
    const { data: slot } = await client
      .from("blocked_slots")
      .select("staff_id")
      .eq("id", parsed.data.id)
      .eq("salon_id", session.salon.id)
      .maybeSingle()
    if (!slot || slot.staff_id !== session.staffId) {
      return { ok: false, error: "Poți șterge doar blocările tale." }
    }
  }

  const result = await dbDeleteBlockedSlot(session.salon.id, parsed.data.id)
  if (!result.ok) return { ok: false, error: result.error }
  refresh()
  return { ok: true }
}

// ------------------------------------------------------------
// Services & overrides
// ------------------------------------------------------------

export async function listSalonServicesAction(): Promise<
  ActionResult<{ items: { id: string; name: string; categoryName: string | null }[] }>
> {
  const session = await requireRole([...TEAM_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const result = await dbListSalonServices(session.salon.id)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: { items: result.data } }
}

export async function setStaffServiceAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...TEAM_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = setStaffServiceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await dbSetStaffService(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  refresh(parsed.data.staffId)
  return { ok: true }
}

// ------------------------------------------------------------
// Invite ("Invită în aplicație") — reuses the P3 invite logic
// ------------------------------------------------------------

export async function inviteStaffAction(input: unknown): Promise<ActionResult<{ url: string }>> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const session = await requireRole([...MANAGEMENT])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = inviteStaffSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await inviteMember(parsed.data.email, "staff", parsed.data.staffId)
  if (!result.ok) return { ok: false, error: result.error }
  refresh(parsed.data.staffId)
  return { ok: true, data: { url: result.url } }
}
