import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import {
  mapAppointmentJoin,
  mapCalendarStaff,
  mapCatalogService,
  mapStaffServiceOverride,
  type Appointment,
  type AppointmentJoin,
} from "@/lib/mappers/programari"
import { civilToUtcIso } from "@/lib/time"
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateStatusInput,
} from "@/lib/validation/programari"

// Server-only data layer for the Programări calendar. Every query runs through
// the Supabase server client (cookies) so RLS applies as the signed-in user.
// Appointments are stored and queried in UTC; the caller passes civil dates
// (yyyy-mm-dd) which are converted here via Europe/Bucharest.

type DataResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string; code?: string; overridable?: boolean }

function dbError(scope: string, error: unknown): { ok: false; error: string } {
  console.error(`[v0] ${scope} failed:`, error)
  return { ok: false, error: "S-a produs o eroare. Încearcă din nou." }
}

// ─── Load range ──────────────────────────────────────────────────────────────

export async function loadProgramariRange(
  salonId: string,
  from: string,
  to: string,
): Promise<DataResult<Appointment[]>> {
  const supabase = await createSupabaseServerClient()
  const fromIso = civilToUtcIso(from, "00:00")
  const toIso = civilToUtcIso(to, "23:59")

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "*, appointment_services (*), clients (id, first_name, last_name, phone), staff (id, first_name, last_name)",
    )
    .eq("salon_id", salonId)
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at")

  if (error) return dbError("loadProgramariRange", error)

  const rows = (data ?? []) as unknown as AppointmentJoin[]

  // Allergy safety flags (boolean only) for the clients in this range.
  const clientIds = [...new Set(rows.map((r) => r.appointment.client_id).filter(Boolean))] as string[]
  const allergyIds = new Set<string>()
  if (clientIds.length > 0) {
    const { data: flags, error: flagsError } = await supabase
      .from("client_safety_flags")
      .select("client_id, has_allergies")
      .eq("salon_id", salonId)
      .in("client_id", clientIds)
    if (flagsError) return dbError("loadProgramariRange.flags", flagsError)
    for (const f of flags ?? []) {
      if (f.has_allergies) allergyIds.add(f.client_id)
    }
  }

  return {
    ok: true,
    data: rows.map((r) => mapAppointmentJoin(r, allergyIds.has(r.appointment.client_id))),
  }
}

// ─── Bootstrap (staff + catalog + overrides) ─────────────────────────────────

export interface ProgramariBootstrap {
  staff: ReturnType<typeof mapCalendarStaff>[]
  services: ReturnType<typeof mapCatalogService>[]
  staffServices: ReturnType<typeof mapStaffServiceOverride>[]
}

export async function loadProgramariBootstrap(
  salonId: string,
): Promise<DataResult<ProgramariBootstrap>> {
  const supabase = await createSupabaseServerClient()

  const [staffRes, servicesRes, staffServicesRes] = await Promise.all([
    supabase
      .from("staff")
      .select("*")
      .eq("salon_id", salonId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase.from("services").select("*").eq("salon_id", salonId).order("sort_order"),
    supabase
      .from("staff_services")
      .select("staff_id, service_id, price_override, duration_override")
      .eq("salon_id", salonId),
  ])

  if (staffRes.error) return dbError("loadProgramariBootstrap.staff", staffRes.error)
  if (servicesRes.error) return dbError("loadProgramariBootstrap.services", servicesRes.error)
  if (staffServicesRes.error)
    return dbError("loadProgramariBootstrap.staffServices", staffServicesRes.error)

  return {
    ok: true,
    data: {
      staff: (staffRes.data ?? []).map(mapCalendarStaff),
      services: (servicesRes.data ?? []).map(mapCatalogService),
      staffServices: (staffServicesRes.data ?? []).map(mapStaffServiceOverride),
    },
  }
}

// ─── Client search (trigram-backed LIKE) ─────────────────────────────────────

export interface ClientSearchResult {
  id: string
  firstName: string
  lastName: string
  phone: string
  whatsappPhone: string | null
  birthDate: string | null
  loyaltyPoints: number
  totalVisits: number
  // Boolean safety flag from client_safety_flags — never the allergy text.
  hasAllergies: boolean
}

export async function searchClients(
  salonId: string,
  query: string,
): Promise<DataResult<ClientSearchResult[]>> {
  const supabase = await createSupabaseServerClient()
  const q = query.trim()
  if (!q) return { ok: true, data: [] }

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, first_name, last_name, phone, whatsapp_phone, birth_date, loyalty_points, lifetime_points",
    )
    .eq("salon_id", salonId)
    .is("deleted_at", null)
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(8)

  if (error) return dbError("searchClients", error)

  const ids = (data ?? []).map((c) => c.id)
  const allergyIds = new Set<string>()
  if (ids.length > 0) {
    const { data: flags, error: flagsError } = await supabase
      .from("client_safety_flags")
      .select("client_id, has_allergies")
      .eq("salon_id", salonId)
      .in("client_id", ids)
    if (flagsError) return dbError("searchClients.flags", flagsError)
    for (const f of flags ?? []) {
      if (f.has_allergies) allergyIds.add(f.client_id)
    }
  }

  return {
    ok: true,
    data: (data ?? []).map((c) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      phone: c.phone,
      whatsappPhone: c.whatsapp_phone,
      birthDate: c.birth_date,
      loyaltyPoints: c.loyalty_points,
      totalVisits: c.lifetime_points,
      hasAllergies: allergyIds.has(c.id),
    })),
  }
}

// ─── Inline client creation ──────────────────────────────────────────────────

export async function createClientInline(
  salonId: string,
  input: { firstName: string; lastName: string; phone: string },
): Promise<DataResult<ClientSearchResult>> {
  const supabase = await createSupabaseServerClient()

  // Same phone in the same salon → return the existing client instead of failing.
  const existing = await supabase
    .from("clients")
    .select(
      "id, first_name, last_name, phone, whatsapp_phone, birth_date, loyalty_points, lifetime_points",
    )
    .eq("salon_id", salonId)
    .eq("phone", input.phone)
    .is("deleted_at", null)
    .maybeSingle()

  if (existing.error) return dbError("createClientInline.lookup", existing.error)
  if (existing.data) {
    const c = existing.data
    return {
      ok: true,
      data: {
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.phone,
        whatsappPhone: c.whatsapp_phone,
        birthDate: c.birth_date,
        loyaltyPoints: c.loyalty_points,
        totalVisits: c.lifetime_points,
        hasAllergies: false,
      },
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      salon_id: salonId,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
    })
    .select(
      "id, first_name, last_name, phone, whatsapp_phone, birth_date, loyalty_points, lifetime_points",
    )
    .single()

  if (error) return dbError("createClientInline", error)
  const c = data
  return {
    ok: true,
    data: {
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      phone: c.phone,
      whatsappPhone: c.whatsapp_phone,
      birthDate: c.birth_date,
      loyaltyPoints: c.loyalty_points,
      totalVisits: c.lifetime_points,
      hasAllergies: false,
    },
  }
}

// ─── RPC result parsing ──────────────────────────────────────────────────────

type AppointmentRpcResult = {
  ok: boolean
  code?: string
  staff_name?: string | null
  appointment_id?: string
  skipped?: string[] | null
}

function parseRpcResult(raw: unknown): AppointmentRpcResult {
  if (typeof raw === "object" && raw !== null) return raw as AppointmentRpcResult
  return { ok: false, code: "unknown" }
}

function rpcError(result: AppointmentRpcResult): { ok: false; error: string; code?: string; overridable?: boolean } {
  const code = result.code ?? "unknown"
  const messages: Record<string, string> = {
    overlap: `Intervalul se suprapune cu altă programare a lui ${result.staff_name || "specialistului ales"}. Alege altă oră sau alt specialist.`,
    outside_schedule: `${result.staff_name || "Specialistul ales"} nu are program în intervalul ales. Alege altă oră sau alt specialist.`,
    time_off: `${result.staff_name || "Specialistul ales"} este în concediu în intervalul ales. Alege altă oră sau alt specialist.`,
    blocked_slot: `Intervalul este blocat pentru ${result.staff_name || "specialistul ales"}. Alege altă oră sau alt specialist.`,
    invalid_staff: "Specialistul selectat nu mai este activ.",
    invalid_client: "Clientul selectat nu a fost găsit.",
    invalid_appointment: "Programarea nu a fost găsită.",
  }
  return {
    ok: false,
    error: messages[code] ?? "S-a produs o eroare la salvare. Încearcă din nou.",
    code,
    overridable:
      code === "outside_schedule" || code === "time_off" || code === "blocked_slot",
  }
}

// ─── Create / update ─────────────────────────────────────────────────────────

export interface AppointmentMutationResult {
  appointmentId: string
  skippedOccurrences: string[]
}

export async function createAppointment(
  salonId: string,
  clientId: string,
  input: CreateAppointmentInput,
): Promise<DataResult<AppointmentMutationResult>> {
  const supabase = await createSupabaseServerClient()
  const startsAt = civilToUtcIso(input.date, input.startTime)
  const totalMinutes = input.services.reduce((sum, s) => sum + s.durationMin, 0)
  const endsAt = new Date(Date.parse(startsAt) + totalMinutes * 60000).toISOString()

  const { data, error } = await supabase.rpc("create_appointment_rpc", {
    p_salon_id: salonId,
    p_client_id: clientId,
    p_staff_id: input.staffId,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_status: input.status,
    p_notes: input.notes || null,
    p_total_price: input.services.reduce((sum, s) => sum + s.price, 0),
    p_discount: input.discount,
    p_discount_type: input.discountType,
    p_services: input.services.map((s, i) => ({
      service_id: s.serviceId ?? null,
      name_snapshot: s.name,
      price: s.price,
      duration_min: s.durationMin,
      sort_order: i,
    })),
    p_recurrence: input.recurrence,
    p_override: input.override,
  })

  if (error) return dbError("createAppointment.rpc", error)
  const result = parseRpcResult(data)
  if (!result.ok) return rpcError(result)
  return {
    ok: true,
    data: {
      appointmentId: result.appointment_id ?? "",
      skippedOccurrences: result.skipped ?? [],
    },
  }
}

export async function updateAppointment(
  salonId: string,
  clientId: string,
  input: UpdateAppointmentInput,
): Promise<DataResult<AppointmentMutationResult>> {
  const supabase = await createSupabaseServerClient()
  const startsAt = civilToUtcIso(input.date, input.startTime)
  const totalMinutes = input.services.reduce((sum, s) => sum + s.durationMin, 0)
  const endsAt = new Date(Date.parse(startsAt) + totalMinutes * 60000).toISOString()

  const { data, error } = await supabase.rpc("update_appointment_rpc", {
    p_appointment_id: input.id,
    p_salon_id: salonId,
    p_client_id: clientId,
    p_staff_id: input.staffId,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_status: input.status,
    p_notes: input.notes || null,
    p_total_price: input.services.reduce((sum, s) => sum + s.price, 0),
    p_discount: input.discount,
    p_discount_type: input.discountType,
    p_services: input.services.map((s, i) => ({
      service_id: s.serviceId ?? null,
      name_snapshot: s.name,
      price: s.price,
      duration_min: s.durationMin,
      sort_order: i,
    })),
    p_override: input.override,
    p_scope: input.scope,
  })

  if (error) {
    // RLS rejection (e.g. staff editing someone else's appointment) surfaces as
    // a Postgres permission error through the SECURITY INVOKER RPC.
    const code = (error as { code?: string }).code
    if (code === "42501") {
      return { ok: false, error: "Nu ai permisiunea să modifici această programare.", code: "forbidden" }
    }
    return dbError("updateAppointment.rpc", error)
  }
  const result = parseRpcResult(data)
  if (!result.ok) return rpcError(result)
  return {
    ok: true,
    data: {
      appointmentId: result.appointment_id ?? input.id,
      skippedOccurrences: result.skipped ?? [],
    },
  }
}

/**
 * Returns the staff_id of an appointment, or null when it does not belong to
 * the salon. Used by the action layer to enforce the staff-role restriction
 * (staff may only touch their own appointments) before writing.
 */
export async function getAppointmentStaffId(
  salonId: string,
  appointmentId: string,
): Promise<DataResult<string | null>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("appointments")
    .select("staff_id")
    .eq("id", appointmentId)
    .eq("salon_id", salonId)
    .maybeSingle()
  if (error) return dbError("getAppointmentStaffId", error)
  return { ok: true, data: (data?.staff_id as string | null) ?? null }
}

export async function updateAppointmentStatus(
  salonId: string,
  input: UpdateStatusInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const patch: Database["public"]["Tables"]["appointments"]["Update"] = {
    status: input.status,
    cancel_reason: input.status === "anulat" ? (input.cancelReason || null) : null,
    updated_at: new Date().toISOString(),
  }
  if (input.notes !== undefined) patch.notes = input.notes

  const { data, error } = await supabase
    .from("appointments")
    .update(patch)
    .eq("id", input.id)
    .eq("salon_id", salonId)
    .select("id")

  if (error) {
    const code = (error as { code?: string }).code
    if (code === "42501") {
      return { ok: false, error: "Nu ai permisiunea să modifici această programare." }
    }
    return dbError("updateAppointmentStatus", error)
  }
  if (!data || data.length === 0) {
    // Zero rows: either not found or RLS filtered the row out (staff role).
    return { ok: false, error: "Nu ai permisiunea să modifici această programare." }
  }
  return { ok: true }
}

// ─── helpers ─���───────────────────────────────────────────────────────────────
