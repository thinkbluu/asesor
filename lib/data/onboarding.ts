import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import {
  ONBOARDING_DEFAULT_CATEGORY,
  ONBOARDING_DONE_STEP,
  withBookingSettingsPatch,
} from "@/lib/mappers/onboarding"
import type {
  OnboardingSalonStepInput,
  OnboardingServicesStepInput,
  OnboardingHoursStepInput,
  OnboardingTeamStepInput,
  OnboardingRulesStepInput,
} from "@/lib/validation/onboarding"

type ServicesInput = OnboardingServicesStepInput["services"]
type DaysInput = OnboardingHoursStepInput["days"]
type StaffInput = OnboardingTeamStepInput["staff"]

// Server-only data layer for onboarding. Every query runs through the Supabase
// server client (anon key + cookies) so RLS applies as the signed-in user.

type SalonRow = Database["public"]["Tables"]["salons"]["Row"]
type ServiceRow = Database["public"]["Tables"]["services"]["Row"]
type SalonHoursRow = Database["public"]["Tables"]["salon_hours"]["Row"]
type StaffRow = Database["public"]["Tables"]["staff"]["Row"]
type StaffServiceRow = Database["public"]["Tables"]["staff_services"]["Row"]

type DataResult<T = void> = (T extends void ? { ok: true } : { ok: true; data: T }) | { ok: false; error: string }

function dbError(scope: string, error: unknown): { ok: false; error: string } {
  console.error(`[v0] ${scope} failed:`, error)
  return { ok: false, error: "S-a produs o eroare la salvare. Încearcă din nou." }
}

// ─── Load ────────────────────────────────────────────────────────────────────

export interface OnboardingState {
  salon: SalonRow | null
  services: ServiceRow[]
  hours: SalonHoursRow[]
  staff: StaffRow[]
  staffServices: Pick<StaffServiceRow, "staff_id" | "service_id">[]
}

export async function loadOnboardingState(salonId: string): Promise<OnboardingState> {
  const supabase = await createSupabaseServerClient()

  const [salonRes, servicesRes, hoursRes, staffRes] = await Promise.all([
    supabase.from("salons").select("*").eq("id", salonId).maybeSingle(),
    supabase.from("services").select("*").eq("salon_id", salonId).order("sort_order"),
    supabase.from("salon_hours").select("*").eq("salon_id", salonId).order("weekday"),
    supabase
      .from("staff")
      .select("*")
      .eq("salon_id", salonId)
      .is("deleted_at", null)
      .order("sort_order"),
  ])

  const staffRows = (staffRes.data ?? []) as StaffRow[]
  const staffIds = staffRows.map((row) => row.id)
  const staffServicesRes = staffIds.length
    ? await supabase
        .from("staff_services")
        .select("staff_id, service_id")
        .in("staff_id", staffIds)
    : { data: [] as Pick<StaffServiceRow, "staff_id" | "service_id">[] | null, error: null }

  if (salonRes.error) console.error("[v0] loadOnboardingState/salon:", salonRes.error)
  if (servicesRes.error) console.error("[v0] loadOnboardingState/services:", servicesRes.error)
  if (hoursRes.error) console.error("[v0] loadOnboardingState/hours:", hoursRes.error)
  if (staffRes.error) console.error("[v0] loadOnboardingState/staff:", staffRes.error)
  if (staffServicesRes.error) console.error("[v0] loadOnboardingState/staffServices:", staffServicesRes.error)

  return {
    salon: (salonRes.data as SalonRow | null) ?? null,
    services: (servicesRes.data ?? []) as ServiceRow[],
    hours: (hoursRes.data ?? []) as SalonHoursRow[],
    staff: staffRows,
    staffServices: (staffServicesRes.data ?? []) as Pick<StaffServiceRow, "staff_id" | "service_id">[],
  }
}

// ─── Step 1: create or update the salon ──────────────────────────────────────

export async function createSalonForOnboarding(
  input: OnboardingSalonStepInput,
): Promise<DataResult<{ salonId: string; slug: string }>> {
  const supabase = await createSupabaseServerClient()

  // Security-definer RPC: generates the unique slug, inserts the owner
  // membership and seeds default salon_hours (RLS has no salons_insert policy).
  const { data: salonId, error } = await supabase.rpc("create_salon_for_current_user", {
    p_name: input.name,
    p_city: input.city,
  })
  if (error) {
    console.error("[v0] createSalonForOnboarding/rpc:", error)
    return { ok: false, error: error.message || "Nu am putut crea salonul. Încearcă din nou." }
  }
  if (!salonId) return { ok: false, error: "Nu am putut crea salonul. Încearcă din nou." }

  const patch = withBookingSettingsPatch(undefined, { onboarding_step: 2 })
  const { data: salonRow, error: updateErr } = await supabase
    .from("salons")
    .update({
      address: input.address || null,
      phone: input.phone || null,
      booking_settings: patch,
    })
    .eq("id", salonId)
    .select("slug")
    .single()
  if (updateErr || !salonRow) return dbError("createSalonForOnboarding/update", updateErr)

  return { ok: true, data: { salonId, slug: salonRow.slug } }
}

export async function updateSalonBasics(
  salonId: string,
  input: OnboardingSalonStepInput,
): Promise<DataResult<{ slug: string }>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("salons")
    .update({
      name: input.name,
      city: input.city,
      address: input.address || null,
      phone: input.phone || null,
    })
    .eq("id", salonId)
    .select("slug")
    .single()
  if (error || !data) return dbError("updateSalonBasics", error)
  return { ok: true, data: { slug: data.slug } }
}

// ─── Step 2: services (single „General" category) ────────────────────────────

export async function saveOnboardingServices(
  salonId: string,
  services: ServicesInput,
): Promise<DataResult<{ services: ServiceRow[] }>> {
  const supabase = await createSupabaseServerClient()

  let categoryId: string
  const { data: existingCat } = await supabase
    .from("service_categories")
    .select("id")
    .eq("salon_id", salonId)
    .ilike("name", ONBOARDING_DEFAULT_CATEGORY)
    .maybeSingle()
  if (existingCat) {
    categoryId = existingCat.id
  } else {
    const { data: inserted, error: catErr } = await supabase
      .from("service_categories")
      .insert({ salon_id: salonId, name: ONBOARDING_DEFAULT_CATEGORY, sort_order: 0 })
      .select("id")
      .single()
    if (catErr || !inserted) return dbError("saveOnboardingServices/category", catErr)
    categoryId = inserted.id
  }

  const { data: existingRows, error: existingErr } = await supabase
    .from("services")
    .select("id")
    .eq("salon_id", salonId)
  if (existingErr) return dbError("saveOnboardingServices/existing", existingErr)
  const existingIds = new Set(((existingRows ?? []) as { id: string }[]).map((row) => row.id))

  const keepIds = new Set<string>()
  for (const [index, svc] of services.entries()) {
    const payload = {
      salon_id: salonId,
      category_id: categoryId,
      name: svc.name,
      duration_min: svc.durationMin,
      price: svc.price,
      sort_order: index,
      active: true,
      online_bookable: true,
    }
    if (svc.id && existingIds.has(svc.id)) {
      keepIds.add(svc.id)
      const { error } = await supabase.from("services").update(payload).eq("id", svc.id).eq("salon_id", salonId)
      if (error) return dbError("saveOnboardingServices/update", error)
    } else {
      const { data: inserted, error } = await supabase
        .from("services")
        .insert(payload)
        .select("id")
        .single()
      if (error || !inserted) return dbError("saveOnboardingServices/insert", error)
      keepIds.add(inserted.id)
    }
  }

  const removeIds = [...existingIds].filter((id) => !keepIds.has(id))
  if (removeIds.length > 0) {
    const { error } = await supabase.from("services").delete().in("id", removeIds).eq("salon_id", salonId)
    if (error) return dbError("saveOnboardingServices/delete", error)
  }

  const { data: rows, error: rowsErr } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order")
  if (rowsErr) return dbError("saveOnboardingServices/refetch", rowsErr)
  return { ok: true, data: { services: (rows ?? []) as ServiceRow[] } }
}

// ─── Step 3: salon hours ─────────────────────────────────────────────────────

export async function saveOnboardingHours(
  salonId: string,
  days: DaysInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const rows = days.map((day) => ({
    salon_id: salonId,
    weekday: day.weekday,
    opens: day.isOpen ? day.opens : null,
    closes: day.isOpen ? day.closes : null,
    is_open: day.isOpen,
  }))
  const { error } = await supabase
    .from("salon_hours")
    .upsert(rows, { onConflict: "salon_id,weekday" })
  if (error) return dbError("saveOnboardingHours", error)
  return { ok: true }
}

// ─── Step 4: team (+ schedules copied from salon hours, + staff_services) ────

export async function saveOnboardingTeam(
  salonId: string,
  staff: StaffInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const [{ data: existingRows, error: existingErr }, { data: hoursRows, error: hoursErr }, { data: serviceRows, error: svcErr }] =
    await Promise.all([
      supabase.from("staff").select("id").eq("salon_id", salonId).is("deleted_at", null),
      supabase.from("salon_hours").select("weekday, opens, closes, is_open").eq("salon_id", salonId).order("weekday"),
      supabase.from("services").select("id").eq("salon_id", salonId),
    ])
  if (existingErr) return dbError("saveOnboardingTeam/existing", existingErr)
  if (hoursErr) return dbError("saveOnboardingTeam/hours", hoursErr)
  if (svcErr) return dbError("saveOnboardingTeam/services", svcErr)

  const existingIds = new Set(((existingRows ?? []) as { id: string }[]).map((row) => row.id))
  const salonServiceIds = ((serviceRows ?? []) as { id: string }[]).map((row) => row.id)
  const validServiceIds = new Set(salonServiceIds)
  const hours = (hoursRows ?? []) as Pick<SalonHoursRow, "weekday" | "opens" | "closes" | "is_open">[]

  const keptIds = new Set<string>()
  for (const [index, member] of staff.entries()) {
    const [first, ...rest] = member.name.trim().split(/\s+/)
    const payload = {
      salon_id: salonId,
      first_name: first,
      last_name: rest.join(" "),
      role_title: member.roleTitle || null,
      phone: member.phone || null,
      sort_order: index,
    }

    let staffId: string
    if (member.id && existingIds.has(member.id)) {
      staffId = member.id
      keptIds.add(staffId)
      const { error } = await supabase.from("staff").update(payload).eq("id", staffId).eq("salon_id", salonId)
      if (error) return dbError("saveOnboardingTeam/update", error)
    } else {
      const { data: inserted, error } = await supabase
        .from("staff")
        .insert(payload)
        .select("id")
        .single()
      if (error || !inserted) return dbError("saveOnboardingTeam/insert", error)
      staffId = inserted.id
      keptIds.add(staffId)
    }

    // Programul angajatului = programul salonului (copied from salon hours).
    const { error: schedDeleteErr } = await supabase.from("staff_schedules").delete().eq("staff_id", staffId)
    if (schedDeleteErr) return dbError("saveOnboardingTeam/schedules-delete", schedDeleteErr)
    if (hours.length > 0) {
      const { error: schedErr } = await supabase.from("staff_schedules").insert(
        hours.map((h) => ({
          staff_id: staffId,
          salon_id: salonId,
          weekday: h.weekday,
          start_time: h.opens,
          end_time: h.closes,
          is_working: h.is_open,
        })),
      )
      if (schedErr) return dbError("saveOnboardingTeam/schedules-insert", schedErr)
    }

    // Servicii efectuate: selecția UI; selecție goală → toate serviciile salonului.
    const selected = member.serviceIds.filter((id) => validServiceIds.has(id))
    const finalServiceIds = selected.length > 0 ? selected : salonServiceIds
    const { error: ssDeleteErr } = await supabase.from("staff_services").delete().eq("staff_id", staffId)
    if (ssDeleteErr) return dbError("saveOnboardingTeam/staffServices-delete", ssDeleteErr)
    if (finalServiceIds.length > 0) {
      const { error: ssErr } = await supabase.from("staff_services").insert(
        finalServiceIds.map((serviceId) => ({ staff_id: staffId, service_id: serviceId, salon_id: salonId })),
      )
      if (ssErr) return dbError("saveOnboardingTeam/staffServices-insert", ssErr)
    }
  }

  // Angajații eliminați în UI se soft-delează (pot avea programări la activ).
  const removeIds = [...existingIds].filter((id) => !keptIds.has(id))
  if (removeIds.length > 0) {
    const { error } = await supabase
      .from("staff")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", removeIds)
      .eq("salon_id", salonId)
    if (error) return dbError("saveOnboardingTeam/soft-delete", error)
  }

  return { ok: true }
}

// ─── Step 5: booking rules (+ finish) ────────────────────────────────────────

export async function saveOnboardingRules(
  salonId: string,
  input: OnboardingRulesStepInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const { data: salonRow, error: readErr } = await supabase
    .from("salons")
    .select("booking_settings")
    .eq("id", salonId)
    .single()
  if (readErr || !salonRow) return dbError("saveOnboardingRules/read", readErr)

  const patch = withBookingSettingsPatch(salonRow.booking_settings, {
    min_notice_min: input.minNoticeMin,
    online_enabled: input.onlineEnabled,
    onboarding_step: ONBOARDING_DONE_STEP,
  })

  const { error } = await supabase
    .from("salons")
    .update({ booking_settings: patch, cancellation_window_hours: input.cancellationWindowHours })
    .eq("id", salonId)
  if (error) return dbError("saveOnboardingRules/update", error)
  return { ok: true }
}

// ─── Step persistence (used by save + skip) ──────────────────────────────────

export async function setOnboardingStep(salonId: string, step: number): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { data: salonRow, error: readErr } = await supabase
    .from("salons")
    .select("booking_settings")
    .eq("id", salonId)
    .single()
  if (readErr || !salonRow) return dbError("setOnboardingStep/read", readErr)

  const patch = withBookingSettingsPatch(salonRow.booking_settings, { onboarding_step: step })
  const { error } = await supabase.from("salons").update({ booking_settings: patch }).eq("id", salonId)
  if (error) return dbError("setOnboardingStep/update", error)
  return { ok: true }
}
