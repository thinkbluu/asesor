import "server-only"

// Data layer for /app/echipa. All queries run as the signed-in user (RLS
// applies). Financial aggregates come from the postgres-owned views
// staff_month_stats / staff_week_trend (scripts/012) whose WHERE guard is the
// RLS layer: owner/manager/receptionist see the whole salon, staff only their
// own row — the views simply return no rows for colleagues.

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import type {
  BlockedSlotItem,
  ScheduleDay,
  StaffDetail,
  StaffListItem,
  StaffServiceItem,
  TimeOffItem,
} from "@/lib/mappers/echipa"
import {
  mapBlockedSlot,
  mapSchedule,
  mapStaffListItem,
  mapTimeOff,
  mapWeekTrend,
} from "@/lib/mappers/echipa"
import type {
  BlockedSlotInput,
  CreateStaffInput,
  SaveScheduleInput,
  SetStaffServiceInput,
  UpdateStaffInput,
} from "@/lib/validation/echipa"

type DataResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

function dbError(scope: string, error: unknown): { ok: false; error: string } {
  console.error(`[v0] ${scope} failed:`, error)
  return { ok: false, error: "S-a produs o eroare. Încearcă din nou." }
}

type StaffRow = Database["public"]["Tables"]["staff"]["Row"]

// ------------------------------------------------------------
// List
// ------------------------------------------------------------

export async function listStaff(salonId: string): Promise<DataResult<StaffListItem[]>> {
  const supabase = await createSupabaseServerClient()

  const [{ data: rows, error }, { data: stats, error: statsError }] = await Promise.all([
    supabase
      .from("staff")
      .select("*")
      .eq("salon_id", salonId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase.from("staff_month_stats").select("*").eq("salon_id", salonId),
  ])

  if (error) return dbError("listStaff", error)
  // Stats may legitimately be empty for a staff user (the view hides
  // colleagues) — that is not an error.
  if (statsError) return dbError("listStaff.stats", statsError)

  const statsByStaff = new Map(
    ((stats ?? []) as Database["public"]["Views"]["staff_month_stats"]["Row"][]).map((s) => [s.staff_id, s]),
  )
  return {
    ok: true,
    data: ((rows ?? []) as StaffRow[]).map((r) => mapStaffListItem(r, statsByStaff.get(r.id))),
  }
}

// ------------------------------------------------------------
// Detail
// ------------------------------------------------------------

export async function getStaffDetail(
  salonId: string,
  staffId: string,
): Promise<DataResult<StaffDetail>> {
  const supabase = await createSupabaseServerClient()

  const [staffRes, scheduleRes, linksRes, servicesRes, categoriesRes, timeOffRes, blockedRes, statsRes, trendRes] =
    await Promise.all([
      supabase.from("staff").select("*").eq("id", staffId).eq("salon_id", salonId).is("deleted_at", null).maybeSingle(),
      supabase.from("staff_schedules").select("*").eq("staff_id", staffId).eq("salon_id", salonId),
      // No FK relationship is registered between staff_services and services
      // in the generated types, so fetch both sides and join in code.
      supabase
        .from("staff_services")
        .select("service_id, price_override, duration_override")
        .eq("staff_id", staffId)
        .eq("salon_id", salonId),
      supabase
        .from("services")
        .select("id, name, price, duration_min, category_id")
        .eq("salon_id", salonId)
        .eq("active", true),
      supabase.from("service_categories").select("id, name").eq("salon_id", salonId),
      supabase
        .from("staff_time_off")
        .select("*")
        .eq("staff_id", staffId)
        .eq("salon_id", salonId)
        .order("starts_at", { ascending: false }),
      supabase
        .from("blocked_slots")
        .select("*")
        .eq("staff_id", staffId)
        .eq("salon_id", salonId)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: true }),
      supabase.from("staff_month_stats").select("*").eq("staff_id", staffId).maybeSingle(),
      supabase.from("staff_week_trend").select("*").eq("staff_id", staffId),
    ])

  if (staffRes.error) return dbError("getStaffDetail", staffRes.error)
  const staff = staffRes.data as StaffRow | null
  if (!staff) return { ok: false, error: "Specialistul nu a fost găsit." }

  for (const [label, res] of [
    ["schedule", scheduleRes],
    ["links", linksRes],
    ["services", servicesRes],
    ["categories", categoriesRes],
    ["timeOff", timeOffRes],
    ["blocked", blockedRes],
    ["stats", statsRes],
    ["trend", trendRes],
  ] as const) {
    if (res.error) return dbError(`getStaffDetail.${label}`, res.error)
  }

  const categoryNames = new Map(
    ((categoriesRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  )
  const serviceById = new Map(
    ((servicesRes.data ?? []) as {
      id: string
      name: string
      price: number
      duration_min: number
      category_id: string | null
    }[]).map((s) => [s.id, s]),
  )
  const services: StaffServiceItem[] = ((linksRes.data ?? []) as {
    service_id: string
    price_override: number | null
    duration_override: number | null
  }[])
    .map((row) => {
      const svc = serviceById.get(row.service_id)
      if (!svc) return null
      return {
        serviceId: row.service_id,
        serviceName: svc.name,
        categoryName: svc.category_id ? (categoryNames.get(svc.category_id) ?? null) : null,
        basePrice: Number(svc.price),
        baseDuration: svc.duration_min,
        priceOverride: row.price_override != null ? Number(row.price_override) : null,
        durationOverride: row.duration_override,
      } satisfies StaffServiceItem
    })
    .filter((s): s is StaffServiceItem => s !== null)

  const statsRow = (statsRes.data ?? null) as Database["public"]["Views"]["staff_month_stats"]["Row"] | null

  return {
    ok: true,
    data: {
      id: staff.id,
      firstName: staff.first_name,
      lastName: staff.last_name,
      roleTitle: staff.role_title,
      phone: staff.phone,
      email: staff.email,
      status: staff.status,
      color: staff.color,
      hiredAt: staff.hired_at,
      notes: staff.notes,
      commissionType: staff.commission_type,
      commissionRate: staff.commission_rate != null ? Number(staff.commission_rate) : null,
      schedule: mapSchedule((scheduleRes.data ?? []) as Database["public"]["Tables"]["staff_schedules"]["Row"][]),
      services,
      timeOff: ((timeOffRes.data ?? []) as Database["public"]["Tables"]["staff_time_off"]["Row"][]).map(mapTimeOff),
      blockedSlots: ((blockedRes.data ?? []) as Database["public"]["Tables"]["blocked_slots"]["Row"][]).map(mapBlockedSlot),
      month: statsRow
        ? {
            monthStart: statsRow.month_start,
            appointmentsCount: statsRow.appointments_count,
            revenue: Number(statsRow.revenue),
            servicesCount: statsRow.services_count,
            noShowRate: statsRow.no_show_rate != null ? Number(statsRow.no_show_rate) : null,
            utilization: statsRow.utilization != null ? Number(statsRow.utilization) : null,
            avgRating: statsRow.avg_rating != null ? Number(statsRow.avg_rating) : null,
            scheduledMinutes: Number(statsRow.scheduled_minutes),
            bookedMinutes: Number(statsRow.booked_minutes),
            commissionAmount: Number(statsRow.commission_amount),
          }
        : null,
      weekTrend: mapWeekTrend((trendRes.data ?? []) as Database["public"]["Views"]["staff_week_trend"]["Row"][]),
    },
  }
}

// ------------------------------------------------------------
// Staff CRUD (soft delete only)
// ------------------------------------------------------------

export async function createStaff(
  salonId: string,
  input: CreateStaffInput,
): Promise<DataResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient()

  const { data: last, error: lastError } = await supabase
    .from("staff")
    .select("sort_order")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastError) return dbError("createStaff", lastError)

  const { data, error } = await supabase
    .from("staff")
    .insert({
      salon_id: salonId,
      first_name: input.firstName,
      last_name: input.lastName,
      role_title: input.roleTitle,
      phone: input.phone,
      email: input.email,
      status: input.status,
      hired_at: input.hiredAt,
      notes: input.notes,
      color: input.color,
      commission_type: input.commissionType,
      commission_rate: input.commissionRate,
      sort_order: ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single()
  if (error) return dbError("createStaff", error)
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function updateStaff(
  salonId: string,
  input: UpdateStaffInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const patch: Database["public"]["Tables"]["staff"]["Update"] = { updated_at: new Date().toISOString() }
  if (input.firstName !== undefined) patch.first_name = input.firstName
  if (input.lastName !== undefined) patch.last_name = input.lastName
  if (input.roleTitle !== undefined) patch.role_title = input.roleTitle
  if (input.phone !== undefined) patch.phone = input.phone
  if (input.email !== undefined) patch.email = input.email
  if (input.status !== undefined) patch.status = input.status
  if (input.hiredAt !== undefined) patch.hired_at = input.hiredAt
  if (input.notes !== undefined) patch.notes = input.notes
  if (input.color !== undefined) patch.color = input.color
  if (input.commissionType !== undefined) patch.commission_type = input.commissionType
  if (input.commissionRate !== undefined) patch.commission_rate = input.commissionRate
  if (input.deleted) patch.deleted_at = new Date().toISOString()

  const { error } = await supabase
    .from("staff")
    .update(patch)
    .eq("id", input.id)
    .eq("salon_id", salonId)
  if (error) return dbError("updateStaff", error)
  return { ok: true }
}

// ------------------------------------------------------------
// Weekly schedule
// ------------------------------------------------------------

export async function saveSchedule(
  salonId: string,
  input: SaveScheduleInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const rows = input.days.map((d) => ({
    staff_id: input.staffId,
    salon_id: salonId,
    weekday: d.weekday,
    is_working: d.isWorking,
    start_time: d.isWorking ? (d.startTime ?? null) : null,
    end_time: d.isWorking ? (d.endTime ?? null) : null,
    break_start: d.isWorking ? (d.breakStart ?? null) : null,
    break_end: d.isWorking ? (d.breakEnd ?? null) : null,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("staff_schedules")
    .upsert(rows, { onConflict: "staff_id,weekday" })
  if (error) return dbError("saveSchedule", error)
  return { ok: true }
}

/** "Copiază programul salonului" — returns the salon hours for the editor. */
export async function getSalonHours(
  salonId: string,
): Promise<DataResult<ScheduleDay[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("salon_hours")
    .select("weekday, is_open, opens, closes")
    .eq("salon_id", salonId)
    .order("weekday", { ascending: true })
  if (error) return dbError("getSalonHours", error)

  const byDay = new Map(
    ((data ?? []) as { weekday: number; is_open: boolean; opens: string | null; closes: string | null }[]).map(
      (r) => [r.weekday, r],
    ),
  )
  return {
    ok: true,
    data: Array.from({ length: 7 }, (_, weekday) => {
      const r = byDay.get(weekday)
      return {
        weekday,
        isWorking: r?.is_open ?? false,
        startTime: r?.opens ?? null,
        endTime: r?.closes ?? null,
        breakStart: null,
        breakEnd: null,
      }
    }),
  }
}

// ------------------------------------------------------------
// Time off
// ------------------------------------------------------------

export async function requestTimeOff(
  salonId: string,
  input: { staffId: string; startsAt: string; endsAt: string; reason: string | null },
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("staff_time_off").insert({
    salon_id: salonId,
    staff_id: input.staffId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    reason: input.reason,
  })
  if (error) return dbError("requestTimeOff", error)
  return { ok: true }
}

export async function decideTimeOff(
  salonId: string,
  input: { id: string; status: "approved" | "rejected" },
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("staff_time_off")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("salon_id", salonId)
  if (error) return dbError("decideTimeOff", error)
  return { ok: true }
}

export async function deleteTimeOff(
  salonId: string,
  id: string,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("staff_time_off").delete().eq("id", id).eq("salon_id", salonId)
  if (error) return dbError("deleteTimeOff", error)
  return { ok: true }
}

export async function listTimeOff(
  salonId: string,
): Promise<DataResult<TimeOffItem[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("staff_time_off")
    .select("*")
    .eq("salon_id", salonId)
    .order("starts_at", { ascending: false })
    .limit(100)
  if (error) return dbError("listTimeOff", error)
  return { ok: true, data: ((data ?? []) as Database["public"]["Tables"]["staff_time_off"]["Row"][]).map(mapTimeOff) }
}

// ------------------------------------------------------------
// Blocked slots
// ------------------------------------------------------------

export async function createBlockedSlot(
  salonId: string,
  input: BlockedSlotInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("blocked_slots").insert({
    salon_id: salonId,
    staff_id: input.staffId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    reason: input.reason,
  })
  if (error) return dbError("createBlockedSlot", error)
  return { ok: true }
}

export async function deleteBlockedSlot(
  salonId: string,
  id: string,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("blocked_slots").delete().eq("id", id).eq("salon_id", salonId)
  if (error) return dbError("deleteBlockedSlot", error)
  return { ok: true }
}

// ------------------------------------------------------------
// Linked app user ("Invită în aplicație")
// ------------------------------------------------------------

/** Returns the salon_members row linked to this staff record, if any. */
export async function getStaffLinkedUser(
  salonId: string,
  staffId: string,
): Promise<DataResult<{ email: string; role: string } | null>> {
  const supabase = await createSupabaseServerClient()
  // No FK from salon_members to profiles — fetch the membership, then the
  // profile email by user_id.
  const { data, error } = await supabase
    .from("salon_members")
    .select("role, user_id")
    .eq("salon_id", salonId)
    .eq("staff_id", staffId)
    .maybeSingle()
  if (error) return dbError("getStaffLinkedUser", error)
  const row = data as { role: string; user_id: string } | null
  if (!row) return { ok: true, data: null }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", row.user_id)
    .maybeSingle()
  if (profileError) return dbError("getStaffLinkedUser.profile", profileError)
  const email = (profile as { email: string } | null)?.email
  if (!email) return { ok: true, data: null }
  return { ok: true, data: { email, role: row.role } }
}

// ------------------------------------------------------------
// Services & overrides
// ------------------------------------------------------------

export async function listSalonServices(
  salonId: string,
): Promise<DataResult<{ id: string; name: string; categoryName: string | null }[]>> {
  const supabase = await createSupabaseServerClient()
  const [{ data, error }, { data: categories, error: catError }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, category_id")
      .eq("salon_id", salonId)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("service_categories").select("id, name").eq("salon_id", salonId),
  ])
  if (error) return dbError("listSalonServices", error)
  if (catError) return dbError("listSalonServices.categories", catError)

  const categoryNames = new Map(((categories ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]))
  return {
    ok: true,
    data: ((data ?? []) as { id: string; name: string; category_id: string | null }[]).map((s) => ({
      id: s.id,
      name: s.name,
      categoryName: s.category_id ? (categoryNames.get(s.category_id) ?? null) : null,
    })),
  }
}

export async function setStaffService(
  salonId: string,
  input: SetStaffServiceInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  if (!input.active) {
    const { error } = await supabase
      .from("staff_services")
      .delete()
      .eq("staff_id", input.staffId)
      .eq("service_id", input.serviceId)
      .eq("salon_id", salonId)
    if (error) return dbError("setStaffService", error)
    return { ok: true }
  }

  const { error } = await supabase.from("staff_services").upsert(
    {
      staff_id: input.staffId,
      service_id: input.serviceId,
      salon_id: salonId,
      price_override: input.priceOverride ?? null,
      duration_override: input.durationOverride ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "staff_id,service_id" },
  )
  if (error) return dbError("setStaffService", error)
  return { ok: true }
}
