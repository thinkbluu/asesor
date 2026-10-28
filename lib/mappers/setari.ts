import type { Database } from "@/lib/supabase/types"
import { DEFAULT_LOYALTY_CONFIG, type LoyaltyConfig } from "@/lib/loyalty"
import { DEFAULT_REVIEWS_CONFIG, type ReviewsConfig } from "@/lib/reviews"
import { DAY_KEYS, DAY_LABELS, type DayKey } from "./onboarding"

// Pure row ↔ view-model mapping for the Setări page. No I/O here.

type SalonRow = Database["public"]["Tables"]["salons"]["Row"]
type ServiceCategoryRow = Database["public"]["Tables"]["service_categories"]["Row"]
type ServiceRow = Database["public"]["Tables"]["services"]["Row"]
type SalonHoursRow = Database["public"]["Tables"]["salon_hours"]["Row"]
type StaffServiceRow = Database["public"]["Tables"]["staff_services"]["Row"]
type ServiceProductRow = Database["public"]["Tables"]["service_products"]["Row"]

// ─── Profil ──────────────────────────────────────────────────────────────────

export interface SetariProfil {
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
}

export function mapSalonToProfil(salon: SalonRow): SetariProfil {
  return {
    name: salon.name,
    description: salon.description ?? "",
    phone: salon.phone ?? "",
    email: salon.email ?? "",
    address: salon.address ?? "",
    city: salon.city ?? "",
  }
}

// ─── Program ─────────────────────────────────────────────────────────────────

export interface SetariDaySchedule {
  day: DayKey
  label: string
  isOpen: boolean
  open: string
  close: string
  break: { start: string; end: string; label: string } | null
}

export function mapHoursRowsToSetariSchedule(rows: SalonHoursRow[]): SetariDaySchedule[] {
  const byWeekday = new Map(rows.map((row) => [row.weekday, row]))
  return DAY_KEYS.map((key, weekday) => {
    const row = byWeekday.get(weekday)
    return {
      day: key,
      label: DAY_LABELS[key],
      isOpen: row?.is_open ?? false,
      open: row?.opens ? row.opens.slice(0, 5) : "09:00",
      close: row?.closes ? row.closes.slice(0, 5) : "19:00",
      // Pauza zilnică nu are coloană (doar staff_schedules.break_start/end per angajat).
      break: null,
    }
  })
}

// ─── Servicii ────────────────────────────────────────────────────────────────

export interface SetariCategory {
  id: string
  name: string
  // UI-only: service_categories nu are coloane pentru iconiță/culoare.
  icon: string
  color: string
}

export interface SetariService {
  id: string
  name: string
  categoryId: string | null
  duration: number
  price: number
  description: string
  products: { productId: string; quantity: string }[]
  staff: string[]
  color: string
  onlineBooking: boolean
  active: boolean
}

export const CATEGORY_DEFAULT_ICON = "Star"
export const CATEGORY_DEFAULT_COLOR = "#10b981"

export function mapCategoryRowsToSetariCategories(rows: ServiceCategoryRow[]): SetariCategory[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: CATEGORY_DEFAULT_ICON,
    color: CATEGORY_DEFAULT_COLOR,
  }))
}

export function mapServiceRowsToSetariServices(
  serviceRows: ServiceRow[],
  staffServiceRows: Pick<StaffServiceRow, "service_id" | "staff_id">[],
  serviceProductRows: Pick<ServiceProductRow, "service_id" | "product_id" | "quantity_per_use">[],
): SetariService[] {
  const staffByService = new Map<string, string[]>()
  for (const row of staffServiceRows) {
    const list = staffByService.get(row.service_id) ?? []
    list.push(row.staff_id)
    staffByService.set(row.service_id, list)
  }
  const productsByService = new Map<string, { productId: string; quantity: string }[]>()
  for (const row of serviceProductRows) {
    const list = productsByService.get(row.service_id) ?? []
    list.push({ productId: row.product_id, quantity: String(row.quantity_per_use) })
    productsByService.set(row.service_id, list)
  }
  return serviceRows.map((row) => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    duration: row.duration_min,
    price: row.price,
    description: row.description ?? "",
    products: productsByService.get(row.id) ?? [],
    staff: staffByService.get(row.id) ?? [],
    color: CATEGORY_DEFAULT_COLOR,
    onlineBooking: row.online_bookable,
    active: row.active,
  }))
}

// ─── Politici (booking rules) ────────────────────────────────────────────────

export interface SetariPolitici {
  minAdvance: string
  maxFuture: string
  cancelFreeWindow: string
  onlineEnabled: boolean
  requireConfirmation: boolean
  slotInterval: string
}

export function mapSalonToPolitici(salon: SalonRow): SetariPolitici {
  const raw = (salon.booking_settings ?? {}) as Record<string, unknown>
  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback
  return {
    minAdvance: String(num(raw.min_notice_min, 120)),
    maxFuture: String(num(raw.max_days_ahead, 60)),
    cancelFreeWindow: String(salon.cancellation_window_hours),
    onlineEnabled: raw.online_enabled !== false,
    requireConfirmation: raw.require_confirmation === true,
    slotInterval: String(num(raw.slot_interval_min, 15)),
  }
}

// ─── Branding (booking page) ─────────────────────────────────────────────────

export interface SetariBranding {
  slug: string
  logoUrl: string
  primaryColor: string
  welcomeTitle: string
  welcomeSubtitle: string
  coverImageUrl: string
  aboutText: string
  showPrices: boolean
  showDurations: boolean
  requireDeposit: boolean
  depositPercent: number
  cancellationPolicy: string
  minAdvanceHours: number
  maxAdvanceDays: number
}

export function mapSalonToBranding(salon: SalonRow): SetariBranding {
  const raw = (salon.branding ?? {}) as Record<string, unknown>
  const str = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback)
  const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback)
  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback
  const bs = (salon.booking_settings ?? {}) as Record<string, unknown>
  return {
    slug: salon.slug,
    logoUrl: str(raw.logo_url, ""),
    primaryColor: str(raw.primary_color, "#2D8C3C"),
    welcomeTitle: str(raw.welcome_title, `Bine ai venit la ${salon.name}`),
    welcomeSubtitle: str(raw.welcome_subtitle, "Programează-te rapid și ușor, 24/7"),
    coverImageUrl: str(raw.cover_image_url, ""),
    aboutText: str(raw.about_text, ""),
    showPrices: bool(raw.show_prices, true),
    showDurations: bool(raw.show_durations, true),
    requireDeposit: bool(raw.require_deposit, false),
    depositPercent: num(raw.deposit_percent, 30),
    cancellationPolicy: salon.cancellation_policy ?? "",
    minAdvanceHours: Math.round(num(bs.min_notice_min, 120) / 60),
    maxAdvanceDays: num(bs.max_days_ahead, 60),
  }
}

// ─── Loialitate / Recenzii (jsonb merged over defaults) ──────────────────────

export function mapLoyaltyJson(json: SalonRow["loyalty_config"]): LoyaltyConfig {
  const raw = (json ?? {}) as Record<string, unknown>
  const bonusRaw = (raw.bonus ?? {}) as Record<string, unknown>
  return {
    ...DEFAULT_LOYALTY_CONFIG,
    ...(typeof raw === "object" && raw !== null
      ? {
          enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_LOYALTY_CONFIG.enabled,
          ronPerPoint: typeof raw.ron_per_point === "number" ? raw.ron_per_point : DEFAULT_LOYALTY_CONFIG.ronPerPoint,
          expirationMonths:
            typeof raw.expiration_months === "number" ? raw.expiration_months : DEFAULT_LOYALTY_CONFIG.expirationMonths,
          bonus: { ...DEFAULT_LOYALTY_CONFIG.bonus, ...bonusRaw } as LoyaltyConfig["bonus"],
          tiers: Array.isArray(raw.tiers) && raw.tiers.length > 0 ? (raw.tiers as LoyaltyConfig["tiers"]) : DEFAULT_LOYALTY_CONFIG.tiers,
          rewards: Array.isArray(raw.rewards) ? (raw.rewards as LoyaltyConfig["rewards"]) : DEFAULT_LOYALTY_CONFIG.rewards,
        }
      : DEFAULT_LOYALTY_CONFIG),
  }
}

export function mapReviewsJson(salon: SalonRow): ReviewsConfig {
  const raw = (salon.reviews_config ?? {}) as Record<string, unknown>
  return {
    ...DEFAULT_REVIEWS_CONFIG,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_REVIEWS_CONFIG.enabled,
    googleBusinessUrl: salon.google_review_url || DEFAULT_REVIEWS_CONFIG.googleBusinessUrl,
    googlePlaceId: typeof raw.google_place_id === "string" ? raw.google_place_id : DEFAULT_REVIEWS_CONFIG.googlePlaceId,
    hoursAfterAppointment:
      typeof raw.hours_after_appointment === "number"
        ? raw.hours_after_appointment
        : DEFAULT_REVIEWS_CONFIG.hoursAfterAppointment,
    minStarsForGoogle:
      typeof raw.min_stars_for_google === "number" ? raw.min_stars_for_google : DEFAULT_REVIEWS_CONFIG.minStarsForGoogle,
    channel: raw.channel === "sms" || raw.channel === "email" ? raw.channel : "whatsapp",
  }
}
