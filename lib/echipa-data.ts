export type StaffStatus = "activ" | "concediu" | "inactiv"
export type CommissionType = "procent" | "fix" | "salariu"
export type RoleType = "Stilist Senior" | "Stilist" | "Colorist" | "Manichiurista" | "Cosmetician" | "Maseur" | "Gene & Sprancene" | "Receptioner" | "Manager"

export interface DaySchedule {
  start: string
  end: string
  active: boolean
}

export interface TimeOffRequest {
  id: string
  startDate: string
  endDate: string
  reason: string
  status: "pending" | "approved" | "rejected"
}

export interface BlockedSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  reason: string
}

export interface WeeklyAppointments {
  week: string
  count: number
}

export interface Review {
  id: string
  clientName: string
  rating: number
  comment: string
  date: string
  service: string
}

export interface CommissionMonth {
  month: string
  servicesCount: number
  revenue: number
  commissionEarned: number
}

export interface StaffMember {
  id: string
  firstName: string
  lastName: string
  role: RoleType
  phone: string
  email: string
  status: StaffStatus
  dataAngajare: string
  notes: string
  services: string[]
  servicePriceOverrides: Record<string, number>
  schedule: Record<string, DaySchedule>
  timeOffRequests: TimeOffRequest[]
  blockedSlots: BlockedSlot[]
  commissionType: CommissionType
  commissionRate: number
  stats: {
    appointmentsThisMonth: number
    revenueThisMonth: number
    avgRating: number
    noShowRate: number
    utilizationRate: number
    todayAppointments: number
  }
  weeklyTrend: WeeklyAppointments[]
  reviews: Review[]
  commissionHistory: CommissionMonth[]
}

export function getInitials(member: StaffMember): string {
  return `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase()
}

export function getFullName(member: StaffMember): string {
  return `${member.firstName} ${member.lastName}`
}

export const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  Luni: { start: "09:00", end: "18:00", active: true },
  Marți: { start: "09:00", end: "18:00", active: true },
  Miercuri: { start: "09:00", end: "18:00", active: true },
  Joi: { start: "09:00", end: "18:00", active: true },
  Vineri: { start: "09:00", end: "18:00", active: true },
  Sâmbătă: { start: "10:00", end: "15:00", active: true },
  Duminică: { start: "09:00", end: "18:00", active: false },
}

export const STATUS_STYLES: Record<StaffStatus, string> = {
  activ: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  concediu: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  inactiv: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
}

export const STATUS_LABELS: Record<StaffStatus, string> = {
  activ: "Activ",
  concediu: "Concediu",
  inactiv: "Inactiv",
}

export const ROLES: RoleType[] = [
  "Stilist Senior", "Stilist", "Colorist", "Manichiurista",
  "Cosmetician", "Maseur", "Gene & Sprancene", "Receptioner", "Manager",
]
