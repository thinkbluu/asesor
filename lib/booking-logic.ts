import type { StaffMember } from "./echipa-data"
import {
  timeToMinutes,
  minutesToTime,
  type Appointment,
  type AppointmentService,
} from "./programari-data"

export interface SalonInfo {
  slug: string
  name: string
  address: string
  phone: string
  hours: string
  description: string
  cancellationPolicy: string
}

export function getServiceByName(
  name: string,
  services: AppointmentService[] = [],
): AppointmentService | undefined {
  return services.find((service) => service.name === name)
}

const DAY_NAMES_RO = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]

export function getDayNameRO(date: Date): string {
  return DAY_NAMES_RO[date.getDay()]
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getQualifiedStaff(
  staff: StaffMember[],
  selectedServiceNames: string[],
): StaffMember[] {
  const active = staff.filter((member) => member.status !== "inactiv")
  if (selectedServiceNames.length === 0) return active
  return active.filter((member) =>
    selectedServiceNames.every((name) => member.services.includes(name)),
  )
}

export function isDateBookable(date: Date, qualifiedStaff: StaffMember[]): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compare = new Date(date)
  compare.setHours(0, 0, 0, 0)
  if (compare < today) return false

  const day = getDayNameRO(date)
  const dateStr = toISODate(date)
  return qualifiedStaff.some((member) => {
    const schedule = member.schedule[day]
    if (!schedule?.active) return false
    return !member.timeOffRequests.some(
      (request) =>
        request.status === "approved" &&
        dateStr >= request.startDate &&
        dateStr <= request.endDate,
    )
  })
}

export interface TimeSlot {
  time: string
  staffId: string
}

export function getAvailableSlots(
  staffList: StaffMember[],
  dateStr: string,
  totalDuration: number,
  appointments: Appointment[] = [],
): TimeSlot[] {
  if (totalDuration <= 0) return []
  const date = new Date(`${dateStr}T12:00:00`)
  const day = getDayNameRO(date)
  const slotMap = new Map<string, string>()

  for (const member of staffList) {
    const schedule = member.schedule[day]
    if (!schedule?.active) continue

    const onLeave = member.timeOffRequests.some(
      (request) =>
        request.status === "approved" &&
        dateStr >= request.startDate &&
        dateStr <= request.endDate,
    )
    if (onLeave) continue

    const existing = appointments.filter(
      (appointment) =>
        appointment.staffId === member.id &&
        appointment.date === dateStr &&
        appointment.status !== "anulat" &&
        appointment.status !== "no_show",
    )
    const blocked = member.blockedSlots.filter((slot) => slot.date === dateStr)
    const startMin = timeToMinutes(schedule.start)
    const endMin = timeToMinutes(schedule.end)
    const lastStart = endMin - totalDuration
    const now = new Date()
    const isToday = toISODate(now) === dateStr
    const nowMin = now.getHours() * 60 + now.getMinutes() + 15

    for (let minute = startMin; minute <= lastStart; minute += 15) {
      if (isToday && minute < nowMin) continue
      const conflict = existing.some((appointment) => {
        const start = timeToMinutes(appointment.startTime)
        const end = timeToMinutes(appointment.endTime)
        return minute < end && minute + totalDuration > start
      })
      if (conflict) continue

      const blockedConflict = blocked.some((slot) => {
        const start = timeToMinutes(slot.startTime)
        const end = timeToMinutes(slot.endTime)
        return minute < end && minute + totalDuration > start
      })
      if (blockedConflict) continue

      const slotStart = minutesToTime(minute)
      if (!slotMap.has(slotStart)) slotMap.set(slotStart, member.id)
    }
  }

  return Array.from(slotMap.entries())
    .map(([time, staffId]) => ({ time, staffId }))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
}

export function groupSlotsByPeriod(slots: TimeSlot[]): {
  morning: TimeSlot[]
  afternoon: TimeSlot[]
  evening: TimeSlot[]
} {
  const morning: TimeSlot[] = []
  const afternoon: TimeSlot[] = []
  const evening: TimeSlot[] = []
  slots.forEach((slot) => {
    const hour = Number(slot.time.split(":")[0])
    if (hour < 12) morning.push(slot)
    else if (hour < 17) afternoon.push(slot)
    else evening.push(slot)
  })
  return { morning, afternoon, evening }
}

export function findNextAvailableDate(
  qualifiedStaff: StaffMember[],
  totalDuration: number,
): Date | null {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let index = 0; index < 60; index++) {
    const probe = new Date(start)
    probe.setDate(start.getDate() + index)
    if (!isDateBookable(probe, qualifiedStaff)) continue
    if (getAvailableSlots(qualifiedStaff, toISODate(probe), totalDuration).length > 0) return probe
  }
  return null
}

export function generateConfirmationNumber(): string {
  const date = new Date()
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ASE-${datePart}-${random}`
}

export function generateICS(options: {
  title: string
  description: string
  location: string
  date: string
  time: string
  durationMin: number
}): string {
  const [year, month, day] = options.date.split("-").map(Number)
  const [hour, minute] = options.time.split(":").map(Number)
  const pad = (value: number) => String(value).padStart(2, "0")
  const startLocal = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`
  const endTotal = hour * 60 + minute + options.durationMin
  const endLocal = `${year}${pad(month)}${pad(day)}T${pad(Math.floor(endTotal / 60))}${pad(endTotal % 60)}00`
  const stamp = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ASESOR//Booking//RO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@asesor.ro`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${startLocal}`,
    `DTEND:${endLocal}`,
    `SUMMARY:${escapeICS(options.title)}`,
    `DESCRIPTION:${escapeICS(options.description)}`,
    `LOCATION:${escapeICS(options.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

function escapeICS(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

export function formatPriceRON(amount: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDurationMin(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}min`
}

export function formatDateLong(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
