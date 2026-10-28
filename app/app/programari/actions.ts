"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth/session"
import {
  createAppointment as dbCreateAppointment,
  createClientInline,
  getAppointmentStaffId,
  loadProgramariRange,
  searchClients,
  updateAppointment as dbUpdateAppointment,
  updateAppointmentStatus as dbUpdateStatus,
} from "@/lib/data/programari"
import {
  clientSearchSchema,
  createAppointmentSchema,
  newClientSchema,
  rangeSchema,
  updateAppointmentSchema,
  updateStatusSchema,
} from "@/lib/validation/programari"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"
import type { Appointment } from "@/lib/mappers/programari"

// Server actions for the Programări calendar. Reads are available to every
// salon role; mutations are restricted to owner/manager/receptionist (staff
// members can only change the status of their own appointments, enforced by
// RLS inside the data layer).

const MUTATION_ROLES = ["owner", "manager", "receptionist"] as const
const READ_ROLES = ["owner", "manager", "receptionist", "staff"] as const

export type AppointmentMutationResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; code?: string; overridable?: boolean }

export type LoadRangeResult =
  | { ok: true; appointments: Appointment[] }
  | { ok: false; error: string }

export async function loadRangeAction(from: string, to: string): Promise<LoadRangeResult> {
  const session = await requireRole([...READ_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = rangeSchema.safeParse({ from, to })
  if (!parsed.success) {
    return { ok: false, error: zodToActionError(parsed.error).error }
  }

  const result = await loadProgramariRange(session.salon.id, parsed.data.from, parsed.data.to)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, appointments: result.data }
}

export async function searchClientsAction(query: string): Promise<ActionResult<unknown>> {
  const session = await requireRole([...READ_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = clientSearchSchema.safeParse({ query })
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await searchClients(session.salon.id, parsed.data.query)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: result.data }
}

export async function createClientInlineAction(
  input: unknown,
): Promise<ActionResult<{ id: string; firstName: string; lastName: string; phone: string }>> {
  const session = await requireRole([...MUTATION_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = newClientSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await createClientInline(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/app/clienti")
  return { ok: true, data: result.data }
}

export async function createAppointmentAction(input: unknown): Promise<AppointmentMutationResult> {
  const session = await requireRole([...MUTATION_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = createAppointmentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  let clientId = parsed.data.clientId ?? null
  if (!clientId && parsed.data.newClient) {
    const created = await createClientInline(session.salon.id, parsed.data.newClient)
    if (!created.ok) return { ok: false, error: created.error }
    clientId = created.data.id
  }
  if (!clientId) return { ok: false, error: "Alege un client sau adaugă unul nou." }

  const result = await dbCreateAppointment(session.salon.id, clientId, parsed.data)
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: result.code,
      overridable: result.overridable,
    }
  }
  revalidatePath("/app/programari")
  revalidatePath("/app")
  return { ok: true, data: result.data }
}

export async function updateAppointmentAction(input: unknown): Promise<AppointmentMutationResult> {
  const session = await requireRole([...MUTATION_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = updateAppointmentSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  let clientId = parsed.data.clientId ?? null
  if (!clientId && parsed.data.newClient) {
    const created = await createClientInline(session.salon.id, parsed.data.newClient)
    if (!created.ok) return { ok: false, error: created.error }
    clientId = created.data.id
  }
  if (!clientId) return { ok: false, error: "Alege un client sau adaugă unul nou." }

  const result = await dbUpdateAppointment(session.salon.id, clientId, parsed.data)
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: result.code,
      overridable: result.overridable,
    }
  }
  revalidatePath("/app/programari")
  revalidatePath("/app")
  return { ok: true, data: result.data }
}

export async function updateAppointmentStatusAction(input: unknown): Promise<ActionResult> {
  const session = await requireRole([...READ_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = updateStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  if (parsed.data.status === "anulat" && !parsed.data.cancelReason) {
    return { ok: false, error: "Introdu motivul anularii." }
  }

  // Staff may change status/notes only on their own appointments (mirrors the
  // appointments_update_staff_own RLS policy from scripts/004).
  if (session.role === "staff") {
    if (!session.staffId) return { ok: false, error: "Nu ai un profil de specialist asociat." }
    const owner = await getAppointmentStaffId(session.salon.id, parsed.data.id)
    if (!owner.ok) return { ok: false, error: owner.error }
    if (owner.data !== session.staffId) {
      return { ok: false, error: "Poți modifica doar programările tale." }
    }
  }

  const result = await dbUpdateStatus(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/app/programari")
  revalidatePath("/app")
  return { ok: true }
}
