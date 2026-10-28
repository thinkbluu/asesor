import type { Database } from "@/lib/supabase/types"
import { utcIsoToCivil } from "@/lib/time"

// Pure row ↔ view-model mapping for the Programări calendar. No I/O here.
// Appointments are stored in UTC; date/time fields on the view model are
// civil values in Europe/Bucharest.

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"]
export type AppointmentSource = Database["public"]["Enums"]["appointment_source"]
export type RecurrenceType = "niciodata" | "saptamanal" | "bi_saptamanal" | "lunar"

export interface AppointmentServiceView {
  serviceId: string | null
  name: string
  duration: number
  price: number
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  // Safety signal from client_safety_flags (boolean only — never the
  // decrypted allergy text, which stays behind the sensitive-data RLS).
  clientHasAllergies: boolean
  staffId: string
  staffName: string
  services: AppointmentServiceView[]
  date: string
  startTime: string
  endTime: string
  duration: number
  totalPrice: number
  discount: number
  discountType: "procent" | "fix"
  status: AppointmentStatus
  notes: string
  recurrence: RecurrenceType
  recurrenceParentId: string | null
  source: AppointmentSource
  cancelReason: string | null
  createdAt: string
}

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  confirmat: { label: "Confirmat", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500", dot: "bg-emerald-500" },
  in_asteptare: { label: "În așteptare", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500", dot: "bg-amber-500" },
  in_desfasurare: { label: "În desfășurare", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500", dot: "bg-blue-500" },
  finalizat: { label: "Finalizat", color: "text-zinc-500", bg: "bg-zinc-500/15", border: "border-zinc-400", dot: "bg-zinc-400" },
  anulat: { label: "Anulat", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/15", border: "border-red-500", dot: "bg-red-500" },
  no_show: { label: "No-show", color: "text-red-900 dark:text-red-300", bg: "bg-red-900/15", border: "border-red-900", dot: "bg-red-900" },
}

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  niciodata: "Niciodată",
  saptamanal: "Săptămânal",
  bi_saptamanal: "Bi-săptămânal",
  lunar: "Lunar",
}

export function recurrenceFromRule(rule: string | null): RecurrenceType {
  if (rule === "saptamanal" || rule === "bi_saptamanal" || rule === "lunar") return rule
  return "niciodata"
}

// ─── DB row shapes (subset used by the mapper) ───────────────────────────────

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"]
type AppointmentServiceRow = Database["public"]["Tables"]["appointment_services"]["Row"]
type ClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "first_name" | "last_name" | "phone"
>
type StaffRow = Pick<Database["public"]["Tables"]["staff"]["Row"], "id" | "first_name" | "last_name">

export interface AppointmentJoin {
  appointment: AppointmentRow
  services: AppointmentServiceRow[]
  client: ClientRow | null
  staff: StaffRow | null
}

export function mapAppointmentJoin(join: AppointmentJoin, clientHasAllergies = false): Appointment {
  const { appointment: a, services, client, staff } = join
  const start = utcIsoToCivil(a.starts_at)
  const end = utcIsoToCivil(a.ends_at)
  const duration = Math.max(
    0,
    Math.round((new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000),
  )
  return {
    id: a.id,
    clientId: a.client_id,
    clientName: client ? `${client.first_name} ${client.last_name}` : "Client șters",
    clientPhone: client?.phone ?? "",
    clientHasAllergies,
    staffId: a.staff_id,
    staffName: staff ? `${staff.first_name} ${staff.last_name}` : "—",
    services: services
      .slice()
      .sort((x, y) => x.sort_order - y.sort_order)
      .map((s) => ({
        serviceId: s.service_id,
        name: s.name_snapshot,
        duration: s.duration_min,
        price: s.price,
      })),
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    duration,
    totalPrice: a.total_price,
    discount: a.discount,
    discountType: a.discount_type === "fix" ? "fix" : "procent",
    status: a.status,
    notes: a.notes ?? "",
    recurrence: recurrenceFromRule(a.recurrence_rule),
    recurrenceParentId: a.recurrence_parent_id,
    source: a.source,
    cancelReason: a.cancel_reason,
    createdAt: a.created_at,
  }
}

// ─── Bootstrap (staff + catalog with per-staff overrides) ────────────────────

export interface CalendarStaff {
  id: string
  name: string
  color: string
  initials: string
  active: boolean
}

export interface CatalogService {
  id: string
  name: string
  duration: number
  price: number
  buffer: number
}

export interface StaffServiceOverride {
  staffId: string
  serviceId: string
  price: number | null
  duration: number | null
}

type StaffDbRow = Database["public"]["Tables"]["staff"]["Row"]
type ServiceDbRow = Database["public"]["Tables"]["services"]["Row"]
type StaffServiceDbRow = Pick<
  Database["public"]["Tables"]["staff_services"]["Row"],
  "staff_id" | "service_id" | "price_override" | "duration_override"
>

export function mapCalendarStaff(row: StaffDbRow): CalendarStaff {
  const name = `${row.first_name} ${row.last_name}`.trim()
  const initials = `${row.first_name[0] ?? ""}${row.last_name[0] ?? ""}`.toUpperCase()
  return {
    id: row.id,
    name,
    color: row.color || "#10b981",
    initials: initials || "?",
    active: row.status === "activ" && row.deleted_at === null,
  }
}

export function mapCatalogService(row: ServiceDbRow): CatalogService {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration_min,
    price: row.price,
    buffer: row.buffer_min,
  }
}

export function mapStaffServiceOverride(row: StaffServiceDbRow): StaffServiceOverride {
  return {
    staffId: row.staff_id,
    serviceId: row.service_id,
    price: row.price_override,
    duration: row.duration_override,
  }
}

/** Duration/price for a service on a given staff, honoring overrides. */
export function resolveServiceForStaff(
  service: CatalogService,
  staffId: string,
  overrides: StaffServiceOverride[],
): { duration: number; price: number; buffer: number } {
  const o = overrides.find((ov) => ov.staffId === staffId && ov.serviceId === service.id)
  return {
    duration: o?.duration ?? service.duration,
    price: o?.price ?? service.price,
    buffer: service.buffer,
  }
}
