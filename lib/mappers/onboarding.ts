import type { Database } from "@/lib/supabase/types"

// Pure row ↔ view-model mapping for the onboarding wizard. No I/O here — the
// server page maps DB rows into these shapes and the client wizard renders them.

type SalonRow = Database["public"]["Tables"]["salons"]["Row"]
type ServiceRow = Database["public"]["Tables"]["services"]["Row"]
type SalonHoursRow = Database["public"]["Tables"]["salon_hours"]["Row"]
type StaffRow = Database["public"]["Tables"]["staff"]["Row"]
type StaffServiceRow = Database["public"]["Tables"]["staff_services"]["Row"]

// ─── Weekday keys (schema: weekday 0 = luni … 6 = duminică) ──────────────────

export const DAY_KEYS = ["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"] as const
export type DayKey = (typeof DAY_KEYS)[number]

export const DAY_LABELS: Record<DayKey, string> = {
  luni: "Luni",
  marti: "Marți",
  miercuri: "Miercuri",
  joi: "Joi",
  vineri: "Vineri",
  sambata: "Sâmbătă",
  duminica: "Duminică",
}

// ─── View models (match the wizard UI) ───────────────────────────────────────

export interface OnboardingSalon {
  name: string
  address: string
  city: string
  phone: string
}

export interface OnboardingService {
  id: string
  name: string
  duration: string
  price: string
}

export interface OnboardingDaySchedule {
  open: boolean
  start: string
  end: string
}

export interface OnboardingStaff {
  id: string
  name: string
  role: string
  phone: string
  services: string[]
}

export interface OnboardingRules {
  buffer: string
  minAdvance: string
  cancelWindow: string
  onlineBooking: boolean
}

// ─── booking_settings jsonb reader ───────────────────────────────────────────

export interface BookingSettingsShape {
  slotIntervalMin: number
  minNoticeMin: number
  maxDaysAhead: number
  requireConfirmation: boolean
  onlineEnabled: boolean
  onboardingStep: number
}

export const ONBOARDING_DONE_STEP = 6
export const ONBOARDING_DEFAULT_CATEGORY = "General"

export function readBookingSettings(json: SalonRow["booking_settings"]): BookingSettingsShape {
  const raw = (json ?? {}) as Record<string, unknown>
  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback
  return {
    slotIntervalMin: num(raw.slot_interval_min, 15),
    minNoticeMin: num(raw.min_notice_min, 120),
    maxDaysAhead: num(raw.max_days_ahead, 60),
    requireConfirmation: raw.require_confirmation === true,
    onlineEnabled: raw.online_enabled !== false,
    onboardingStep: Math.min(ONBOARDING_DONE_STEP, Math.max(1, num(raw.onboarding_step, 1))),
  }
}

/** Merges `onboarding_step` (and any extra fields) into the stored jsonb. */
export function withBookingSettingsPatch(
  current: SalonRow["booking_settings"] | undefined,
  patch: Record<string, unknown>,
): SalonRow["booking_settings"] {
  const raw = (current ?? {}) as Record<string, unknown>
  return { ...raw, ...patch } as SalonRow["booking_settings"]
}

// ─── Row → view model ────────────────────────────────────────────────────────

export function mapSalonToStep1(salon: SalonRow): OnboardingSalon {
  return {
    name: salon.name,
    address: salon.address ?? "",
    city: salon.city ?? "",
    phone: salon.phone ?? "",
  }
}

export function mapServiceRowsToStep2(rows: ServiceRow[]): OnboardingService[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    duration: String(row.duration_min),
    price: String(row.price),
  }))
}

const DEFAULT_SCHEDULE: Record<DayKey, OnboardingDaySchedule> = {
  luni: { open: true, start: "09:00", end: "19:00" },
  marti: { open: true, start: "09:00", end: "19:00" },
  miercuri: { open: true, start: "09:00", end: "19:00" },
  joi: { open: true, start: "09:00", end: "19:00" },
  vineri: { open: true, start: "09:00", end: "19:00" },
  sambata: { open: true, start: "09:00", end: "15:00" },
  duminica: { open: false, start: "10:00", end: "14:00" },
}

export function mapHoursRowsToStep3(rows: SalonHoursRow[]): Record<DayKey, OnboardingDaySchedule> {
  const schedule: Record<DayKey, OnboardingDaySchedule> = { ...DEFAULT_SCHEDULE }
  for (const row of rows) {
    const key = DAY_KEYS[row.weekday]
    if (!key) continue
    schedule[key] = {
      open: row.is_open,
      start: row.opens ? row.opens.slice(0, 5) : DEFAULT_SCHEDULE[key].start,
      end: row.closes ? row.closes.slice(0, 5) : DEFAULT_SCHEDULE[key].end,
    }
  }
  return schedule
}

export function mapStaffRowsToStep4(
  staffRows: StaffRow[],
  staffServiceRows: Pick<StaffServiceRow, "staff_id" | "service_id">[],
): OnboardingStaff[] {
  const byStaff = new Map<string, string[]>()
  for (const row of staffServiceRows) {
    const list = byStaff.get(row.staff_id) ?? []
    list.push(row.service_id)
    byStaff.set(row.staff_id, list)
  }
  return staffRows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    role: row.role_title ?? "",
    phone: row.phone ?? "",
    services: byStaff.get(row.id) ?? [],
  }))
}

const MIN_ADVANCE_LABELS: Record<number, string> = { 60: "1h", 120: "2h", 240: "4h", 1440: "24h" }
const CANCEL_WINDOW_LABELS: Record<number, string> = { 2: "2h", 4: "4h", 12: "12h", 24: "24h" }

export function mapToStep5(salon: SalonRow): OnboardingRules {
  const bs = readBookingSettings(salon.booking_settings)
  return {
    // Buffer-ul nu are coloană globală — valoarea din UI e pur informativă.
    buffer: "5",
    minAdvance: MIN_ADVANCE_LABELS[bs.minNoticeMin] ?? "1h",
    cancelWindow: CANCEL_WINDOW_LABELS[salon.cancellation_window_hours] ?? "24h",
    onlineBooking: bs.onlineEnabled,
  }
}

// ─── Empty state for a brand-new user (no salon yet) ─────────────────────────

export const DEFAULT_ONBOARDING_SERVICES: OnboardingService[] = [
  { id: "1", name: "Tuns dame", duration: "60", price: "80" },
  { id: "2", name: "Vopsit rădăcini", duration: "90", price: "150" },
  { id: "3", name: "Manichiură gel", duration: "60", price: "100" },
  { id: "4", name: "Tratament facial", duration: "45", price: "120" },
  { id: "5", name: "Coafat", duration: "30", price: "60" },
]

export function emptyOnboardingSalon(): OnboardingSalon {
  return { name: "", address: "", city: "", phone: "" }
}

export function emptyOnboardingStaff(): OnboardingStaff {
  return { id: `local-${Math.random().toString(36).slice(2, 9)}`, name: "", role: "", phone: "", services: [] }
}

export function defaultOnboardingRules(): OnboardingRules {
  return { buffer: "5", minAdvance: "1h", cancelWindow: "2h", onlineBooking: true }
}
