import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { withBookingSettingsPatch } from "@/lib/mappers/onboarding"
import type {
  SetariProfilInput,
  SetariProgramInput,
  SetariReguliInput,
  SetariBrandingInput,
  LoyaltyConfigInput,
  ReviewsConfigInput,
  SetariCategoryInput,
  SetariServiceInput,
  SetariReorderInput,
} from "@/lib/validation/setari"

// Server-only data layer for the Setări page. Every query runs through the
// Supabase server client (anon key + cookies) so RLS applies as the signed-in
// user (owner/manager — enforced by the calling server actions).

type ServiceRow = Database["public"]["Tables"]["services"]["Row"]
type ServiceCategoryRow = Database["public"]["Tables"]["service_categories"]["Row"]
type StaffServiceRow = Database["public"]["Tables"]["staff_services"]["Row"]
type ServiceProductRow = Database["public"]["Tables"]["service_products"]["Row"]
type StaffRow = Database["public"]["Tables"]["staff"]["Row"]

type DataResult<T = void> = (T extends void ? { ok: true } : { ok: true; data: T }) | { ok: false; error: string }

function dbError(scope: string, error: unknown): { ok: false; error: string } {
  console.error(`[v0] ${scope} failed:`, error)
  return { ok: false, error: "S-a produs o eroare la salvare. Încearcă din nou." }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505"
}

// ─── Load ────────────────────────────────────────────────────────────────────

export interface SetariState {
  categories: ServiceCategoryRow[]
  services: ServiceRow[]
  staffServices: Pick<StaffServiceRow, "service_id" | "staff_id" | "price_override" | "duration_override">[]
  serviceProducts: Pick<ServiceProductRow, "service_id" | "product_id" | "quantity_per_use">[]
  staff: Pick<StaffRow, "id" | "first_name" | "last_name">[]
}

export async function loadSetariState(salonId: string): Promise<SetariState> {
  const supabase = await createSupabaseServerClient()

  const [categoriesRes, servicesRes, staffServicesRes, serviceProductsRes, staffRes] = await Promise.all([
    supabase.from("service_categories").select("*").eq("salon_id", salonId).order("sort_order"),
    supabase.from("services").select("*").eq("salon_id", salonId).order("sort_order"),
    supabase.from("staff_services").select("service_id, staff_id, price_override, duration_override").eq("salon_id", salonId),
    supabase.from("service_products").select("service_id, product_id, quantity_per_use").eq("salon_id", salonId),
    supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("salon_id", salonId)
      .is("deleted_at", null)
      .order("sort_order"),
  ])

  if (categoriesRes.error) console.error("[v0] loadSetariState/categories:", categoriesRes.error)
  if (servicesRes.error) console.error("[v0] loadSetariState/services:", servicesRes.error)
  if (staffServicesRes.error) console.error("[v0] loadSetariState/staffServices:", staffServicesRes.error)
  if (serviceProductsRes.error) console.error("[v0] loadSetariState/serviceProducts:", serviceProductsRes.error)
  if (staffRes.error) console.error("[v0] loadSetariState/staff:", staffRes.error)

  return {
    categories: (categoriesRes.data ?? []) as ServiceCategoryRow[],
    services: (servicesRes.data ?? []) as ServiceRow[],
    staffServices: (staffServicesRes.data ?? []) as SetariState["staffServices"],
    serviceProducts: (serviceProductsRes.data ?? []) as SetariState["serviceProducts"],
    staff: (staffRes.data ?? []) as SetariState["staff"],
  }
}

// ─── Profil ──────────────────────────────────────────────────────────────────

export async function saveSetariProfil(salonId: string, input: SetariProfilInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("salons")
    .update({
      name: input.name,
      description: input.description || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      city: input.city || null,
    })
    .eq("id", salonId)
  if (error) return dbError("saveSetariProfil", error)
  return { ok: true }
}

// ─── Program ─────────────────────────────────────────────────────────────────

export async function saveSetariProgram(salonId: string, input: SetariProgramInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const rows = input.days.map((day) => ({
    salon_id: salonId,
    weekday: day.weekday,
    opens: day.isOpen ? day.opens : null,
    closes: day.isOpen ? day.closes : null,
    is_open: day.isOpen,
  }))
  const { error } = await supabase.from("salon_hours").upsert(rows, { onConflict: "salon_id,weekday" })
  if (error) return dbError("saveSetariProgram", error)
  return { ok: true }
}

// ─── Politici (booking rules) ────────────────────────────────────────────────

export async function saveSetariReguli(salonId: string, input: SetariReguliInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { data: salonRow, error: readErr } = await supabase
    .from("salons")
    .select("booking_settings")
    .eq("id", salonId)
    .single()
  if (readErr || !salonRow) return dbError("saveSetariReguli/read", readErr)

  const patch = withBookingSettingsPatch(salonRow.booking_settings, {
    min_notice_min: input.minNoticeMin,
    max_days_ahead: input.maxDaysAhead,
    online_enabled: input.onlineEnabled,
    require_confirmation: input.requireConfirmation,
    slot_interval_min: input.slotIntervalMin,
  })
  const { error } = await supabase
    .from("salons")
    .update({ booking_settings: patch, cancellation_window_hours: input.cancellationWindowHours })
    .eq("id", salonId)
  if (error) return dbError("saveSetariReguli/update", error)
  return { ok: true }
}

// ─── Branding (booking page) ─────────────────────────────────────────────────

export async function saveSetariBranding(salonId: string, input: SetariBrandingInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const { data: salonRow, error: readErr } = await supabase
    .from("salons")
    .select("branding, booking_settings")
    .eq("id", salonId)
    .single()
  if (readErr || !salonRow) return dbError("saveSetariBranding/read", readErr)

  const branding = {
    ...((salonRow.branding ?? {}) as Record<string, unknown>),
    logo_url: input.logoUrl,
    primary_color: input.primaryColor,
    welcome_title: input.welcomeTitle,
    welcome_subtitle: input.welcomeSubtitle,
    cover_image_url: input.coverImageUrl,
    about_text: input.aboutText,
    show_prices: input.showPrices,
    show_durations: input.showDurations,
    require_deposit: input.requireDeposit,
    deposit_percent: input.depositPercent,
  }
  const bookingSettings = withBookingSettingsPatch(salonRow.booking_settings, {
    min_notice_min: input.minAdvanceHours * 60,
    max_days_ahead: input.maxAdvanceDays,
  })

  const { error } = await supabase
    .from("salons")
    .update({
      slug: input.slug,
      cancellation_policy: input.cancellationPolicy || null,
      branding,
      booking_settings: bookingSettings,
    })
    .eq("id", salonId)
  if (error) {
    if (isUniqueViolation(error)) {
      console.error("[v0] saveSetariBranding/slug conflict:", error)
      return { ok: false, error: "Acest slug este deja folosit de alt salon. Încearcă altul." }
    }
    return dbError("saveSetariBranding/update", error)
  }
  return { ok: true }
}

// ─── Loialitate / Recenzii ───────────────────────────────────────────────────

export async function saveSetariLoyalty(salonId: string, input: LoyaltyConfigInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from("salons").update({ loyalty_config: input }).eq("id", salonId)
  if (error) return dbError("saveSetariLoyalty", error)
  return { ok: true }
}

export async function saveSetariReviews(salonId: string, input: ReviewsConfigInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("salons")
    .update({
      reviews_config: {
        enabled: input.enabled,
        google_business_url: input.googleBusinessUrl,
        google_place_id: input.googlePlaceId,
        hours_after_appointment: input.hoursAfterAppointment,
        min_stars_for_google: input.minStarsForGoogle,
        channel: input.channel,
      },
      google_review_url: input.googleBusinessUrl || null,
    })
    .eq("id", salonId)
  if (error) return dbError("saveSetariReviews", error)
  return { ok: true }
}

// ─── Servicii: categorii ─────────────────────────────────────────────────────

export async function upsertSetariCategory(salonId: string, input: SetariCategoryInput): Promise<DataResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient()
  if (input.id) {
    const { error } = await supabase
      .from("service_categories")
      .update({ name: input.name })
      .eq("id", input.id)
      .eq("salon_id", salonId)
    if (error) return dbError("upsertSetariCategory/update", error)
    return { ok: true, data: { id: input.id } }
  }
  const { data: lastRow } = await supabase
    .from("service_categories")
    .select("sort_order")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: false })
    .limit(1)
  const nextSort = ((lastRow?.[0]?.sort_order as number | undefined) ?? -1) + 1
  const { data: inserted, error } = await supabase
    .from("service_categories")
    .insert({ salon_id: salonId, name: input.name, sort_order: nextSort })
    .select("id")
    .single()
  if (error || !inserted) return dbError("upsertSetariCategory/insert", error)
  return { ok: true, data: { id: inserted.id } }
}

export async function deleteSetariCategory(salonId: string, categoryId: string): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  // Serviciile rămân (category_id devine null prin FK on delete set null).
  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", categoryId)
    .eq("salon_id", salonId)
  if (error) return dbError("deleteSetariCategory", error)
  return { ok: true }
}

// ─── Servicii: servicii ──────────────────────────────────────────────────────

export async function upsertSetariService(salonId: string, input: SetariServiceInput): Promise<DataResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient()

  const payload = {
    salon_id: salonId,
    category_id: input.categoryId,
    name: input.name,
    description: input.description || null,
    duration_min: input.durationMin,
    buffer_min: input.bufferMin,
    price: input.price,
    price_from: input.priceFrom,
    online_bookable: input.onlineBookable,
    active: input.active,
  }

  let serviceId: string
  if (input.id) {
    serviceId = input.id
    const { error } = await supabase.from("services").update(payload).eq("id", serviceId).eq("salon_id", salonId)
    if (error) return dbError("upsertSetariService/update", error)
  } else {
    const { data: lastRow } = await supabase
      .from("services")
      .select("sort_order")
      .eq("salon_id", salonId)
      .order("sort_order", { ascending: false })
      .limit(1)
    const nextSort = ((lastRow?.[0]?.sort_order as number | undefined) ?? -1) + 1
    const { data: inserted, error } = await supabase
      .from("services")
      .insert({ ...payload, sort_order: nextSort })
      .select("id")
      .single()
    if (error || !inserted) return dbError("upsertSetariService/insert", error)
    serviceId = inserted.id
  }

  // Personal alocat: înlocuim complet legăturile (fără override-uri aici —
  // prețul/durata per angajat se editează din tab-ul Echipă).
  const { error: ssDeleteErr } = await supabase.from("staff_services").delete().eq("service_id", serviceId)
  if (ssDeleteErr) return dbError("upsertSetariService/staffServices-delete", ssDeleteErr)
  if (input.staffIds.length > 0) {
    const { error: ssErr } = await supabase
      .from("staff_services")
      .insert(input.staffIds.map((staffId) => ({ staff_id: staffId, service_id: serviceId, salon_id: salonId })))
    if (ssErr) return dbError("upsertSetariService/staffServices-insert", ssErr)
  }

  // Consum produse: înlocuim complet legăturile.
  const { error: spDeleteErr } = await supabase.from("service_products").delete().eq("service_id", serviceId)
  if (spDeleteErr) return dbError("upsertSetariService/serviceProducts-delete", spDeleteErr)
  if (input.products.length > 0) {
    const { error: spErr } = await supabase.from("service_products").insert(
      input.products.map((p) => ({
        service_id: serviceId,
        product_id: p.productId,
        salon_id: salonId,
        quantity_per_use: p.quantityPerUse,
      })),
    )
    if (spErr) return dbError("upsertSetariService/serviceProducts-insert", spErr)
  }

  return { ok: true, data: { id: serviceId } }
}

export async function deleteSetariService(salonId: string, serviceId: string): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  // appointment_services.service_id e on delete set null — istoricul rămâne.
  const { error } = await supabase.from("services").delete().eq("id", serviceId).eq("salon_id", salonId)
  if (error) return dbError("deleteSetariService", error)
  return { ok: true }
}

// ─── Reordonare ──────────────────────────────────────────────────────────────

export async function reorderSetariServices(salonId: string, input: SetariReorderInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  for (const item of input.items) {
    const { error } = await supabase
      .from("services")
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id)
      .eq("salon_id", salonId)
    if (error) return dbError("reorderSetariServices", error)
  }
  return { ok: true }
}

export async function reorderSetariCategories(salonId: string, input: SetariReorderInput): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  for (const item of input.items) {
    const { error } = await supabase
      .from("service_categories")
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id)
      .eq("salon_id", salonId)
    if (error) return dbError("reorderSetariCategories", error)
  }
  return { ok: true }
}

// ─── Produse (pentru consumul pe servicii) ───────────────────────────────────

export async function loadSetariProducts(salonId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("salon_id", salonId)
    .order("name")
  if (error) {
    console.error("[v0] loadSetariProducts failed:", error)
    return []
  }
  return (data ?? []) as { id: string; name: string }[]
}

// ─── Salon row (for branding / booking page) ─────────────────────────────────

export async function getSalonRow(salonId: string): Promise<Database["public"]["Tables"]["salons"]["Row"] | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("id", salonId)
    .maybeSingle()
  if (error) {
    console.error("[v0] getSalonRow failed:", error)
    return null
  }
  return (data as Database["public"]["Tables"]["salons"]["Row"] | null) ?? null
}
