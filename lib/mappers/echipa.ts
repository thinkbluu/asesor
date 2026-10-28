import type { Database } from "@/lib/supabase/types"

// DB rows -> view types for /app/echipa.

type StaffRow = Database["public"]["Tables"]["staff"]["Row"]
type ScheduleRow = Database["public"]["Tables"]["staff_schedules"]["Row"]
type TimeOffRow = Database["public"]["Tables"]["staff_time_off"]["Row"]
type BlockedRow = Database["public"]["Tables"]["blocked_slots"]["Row"]
type MonthStatsRow = Database["public"]["Views"]["staff_month_stats"]["Row"]
type WeekTrendRow = Database["public"]["Views"]["staff_week_trend"]["Row"]

export interface StaffListItem {
  id: string
  firstName: string
  lastName: string
  roleTitle: string | null
  phone: string | null
  email: string | null
  status: "activ" | "concediu" | "inactiv"
  color: string | null
  hiredAt: string | null
  commissionType: "procent" | "fix" | "salariu" | null
  commissionRate: number | null
  // Financial figures come from staff_month_stats; null when the caller is
  // not allowed to see them (staff role sees only their own row).
  month: {
    appointmentsCount: number
    revenue: number
    noShowRate: number | null
    utilization: number | null
    avgRating: number | null
    commissionAmount: number
  } | null
}

export interface ScheduleDay {
  weekday: number
  isWorking: boolean
  startTime: string | null
  endTime: string | null
  breakStart: string | null
  breakEnd: string | null
}

export interface StaffServiceItem {
  serviceId: string
  serviceName: string
  categoryName: string | null
  basePrice: number
  baseDuration: number
  priceOverride: number | null
  durationOverride: number | null
}

export interface TimeOffItem {
  id: string
  staffId: string
  startsAt: string
  endsAt: string
  reason: string | null
  status: "pending" | "approved" | "rejected"
}

export interface BlockedSlotItem {
  id: string
  staffId: string
  startsAt: string
  endsAt: string
  reason: string | null
}

export interface WeekTrendDay {
  day: string
  appointmentsCount: number
  revenue: number
}

export interface StaffDetail {
  id: string
  firstName: string
  lastName: string
  roleTitle: string | null
  phone: string | null
  email: string | null
  status: "activ" | "concediu" | "inactiv"
  color: string | null
  hiredAt: string | null
  notes: string | null
  commissionType: "procent" | "fix" | "salariu" | null
  commissionRate: number | null
  schedule: ScheduleDay[]
  services: StaffServiceItem[]
  timeOff: TimeOffItem[]
  blockedSlots: BlockedSlotItem[]
  month: {
    monthStart: string
    appointmentsCount: number
    revenue: number
    servicesCount: number
    noShowRate: number | null
    utilization: number | null
    avgRating: number | null
    scheduledMinutes: number
    bookedMinutes: number
    commissionAmount: number
  } | null
  weekTrend: WeekTrendDay[]
}

export function mapStaffListItem(
  row: StaffRow,
  stats: MonthStatsRow | undefined,
): StaffListItem {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    roleTitle: row.role_title,
    phone: row.phone,
    email: row.email,
    status: row.status,
    color: row.color,
    hiredAt: row.hired_at,
    commissionType: row.commission_type,
    commissionRate: row.commission_rate != null ? Number(row.commission_rate) : null,
    month: stats
      ? {
          appointmentsCount: stats.appointments_count,
          revenue: Number(stats.revenue),
          noShowRate: stats.no_show_rate != null ? Number(stats.no_show_rate) : null,
          utilization: stats.utilization != null ? Number(stats.utilization) : null,
          avgRating: stats.avg_rating != null ? Number(stats.avg_rating) : null,
          commissionAmount: Number(stats.commission_amount),
        }
      : null,
  }
}

export function mapSchedule(rows: ScheduleRow[]): ScheduleDay[] {
  const byDay = new Map(rows.map((r) => [r.weekday, r]))
  return Array.from({ length: 7 }, (_, weekday) => {
    const r = byDay.get(weekday)
    return {
      weekday,
      isWorking: r?.is_working ?? false,
      startTime: r?.start_time ?? null,
      endTime: r?.end_time ?? null,
      breakStart: r?.break_start ?? null,
      breakEnd: r?.break_end ?? null,
    }
  })
}

export function mapTimeOff(row: TimeOffRow): TimeOffItem {
  return {
    id: row.id,
    staffId: row.staff_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
    status: row.status as TimeOffItem["status"],
  }
}

export function mapBlockedSlot(row: BlockedRow): BlockedSlotItem {
  return {
    id: row.id,
    staffId: row.staff_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
  }
}

export function mapWeekTrend(rows: WeekTrendRow[]): WeekTrendDay[] {
  return rows
    .map((r) => ({
      day: r.day,
      appointmentsCount: r.appointments_count,
      revenue: Number(r.revenue),
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
}
