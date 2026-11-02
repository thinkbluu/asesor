import type { Database } from "@/lib/supabase/types"
import type { ClientTag, ClientSource } from "@/lib/validation/clienti"

// View types for the Clienti pages. DB rows never leave the data layer.

export interface ClientListItem {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  tags: ClientTag[]
  source: ClientSource | null
  sex: "F" | "M" | "Nespecificat"
  totalVisits: number
  totalSpent: number
  lastVisitAt: string | null
  hasAllergies: boolean
  loyaltyPoints: number
  balanceDue: number
  createdAt: string
}

export interface ClientDetail extends ClientListItem {
  whatsappPhone: string | null
  birthDate: string | null
  preferredStaffId: string | null
  preferredStaffName: string | null
  communicationPref: "SMS" | "Email" | "WhatsApp" | null
  notes: string
}

export interface ClientHistoryItem {
  id: string
  date: string // ISO UTC
  status: string
  services: { name: string; price: number }[]
  staffName: string | null
  total: number
  notes: string | null
}

export interface LoyaltyEntry {
  id: string
  type: "earned" | "redeemed" | "expired" | "bonus" | "adjustment"
  points: number
  note: string | null
  createdAt: string
}

export interface ConsentRecord {
  id: string
  kind: "marketing_email" | "marketing_sms" | "health_data" | "photos"
  granted: boolean
  source: string | null
  createdAt: string
}

export interface ClientPhoto {
  id: string
  storagePath: string
  caption: string | null
  takenAt: string | null
  createdAt: string
  // Signed URL (10 min) — filled by the data layer, never persisted.
  url: string | null
}

export interface SensitiveData {
  allergies: string | null
  colorFormulas: string | null
  healthConsentAt: string | null
  healthConsentSource: string | null
}

// ─── Row → view mappers ──────────────────────────────────────────────────────

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]
type StatsRow = Database["public"]["Views"]["client_stats"]["Row"]
type SafetyRow = Database["public"]["Views"]["client_safety_flags"]["Row"]

export function mapClientListItem(
  c: ClientRow,
  stats: Pick<StatsRow, "total_visits" | "total_spent" | "last_visit_at"> | null,
  safety: Pick<SafetyRow, "has_allergies"> | null,
): ClientListItem {
  return {
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    phone: c.phone,
    email: c.email,
    tags: (c.tags ?? []) as ClientTag[],
    source: (c.source as ClientSource | null) ?? null,
    sex: (c.sex as ClientListItem["sex"]) ?? "Nespecificat",
    totalVisits: stats?.total_visits ?? 0,
    totalSpent: stats ? Number(stats.total_spent) : 0,
    lastVisitAt: stats?.last_visit_at ?? null,
    hasAllergies: safety?.has_allergies ?? false,
    loyaltyPoints: c.loyalty_points,
    balanceDue: Number(c.balance_due),
    createdAt: c.created_at,
  }
}

export function mapClientDetail(
  c: ClientRow,
  stats: Pick<StatsRow, "total_visits" | "total_spent" | "last_visit_at"> | null,
  safety: Pick<SafetyRow, "has_allergies"> | null,
  preferredStaffName: string | null,
): ClientDetail {
  return {
    ...mapClientListItem(c, stats, safety),
    whatsappPhone: c.whatsapp_phone,
    birthDate: c.birth_date,
    preferredStaffId: c.preferred_staff_id,
    preferredStaffName,
    communicationPref: (c.communication_pref as ClientDetail["communicationPref"]) ?? null,
    notes: c.notes ?? "",
  }
}
