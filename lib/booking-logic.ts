import type { StaffMember } from "./echipa-data"
import {
  CATALOG_SERVICES,
  APPOINTMENTS_DATA,
  timeToMinutes,
  minutesToTime,
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

export const DEMO_SALON: SalonInfo = {
  slug: "salonul-ana",
  name: "Salonul Ana",
  address: "Str. Victoriei 25, București, Sector 1",
  phone: "0722 100 111",
  hours: "Luni–Vineri 09:00–20:00 · Sâmbătă 10:00–15:00",
  description: "Salon de înfrumusețare complet: păr, unghii, tratamente faciale, masaj și extensii gene.",
  cancellationPolicy:
    "Programarea poate fi modificată sau anulată gratuit cu minim 4 ore înainte de ora stabilită. Anularile tardive sau neprezentările pot fi taxate conform politicii salonului.",
}

export const SERVICE_CATEGORIES = [
  {
    name: "Păr",
    icon: "Scissors" as const,
    services: [
      "Tuns și coafat",
      "Vopsit rădăcini",
      "Vopsit complet",
      "Balayage / Highlights",
      "Tratament keratină",
      "Coafat ocazie",
      "Tratament par",
    ],
  },
  {
    name: "Unghii",
    icon: "Sparkles" as const,
    services: ["Manichiură simplă", "Manichiură gel", "Pedichiură", "Nail art"],
  },
  {
    name: "Față",
    icon: "Smile" as const,
    services: [
      "Tratament facial hidratant",
      "Curățare față profundă",
      "Masaj facial",
      "Epilare față",
    ],
  },
  {
    name: "Gene & Sprâncene",
    icon: "Eye" as const,
    services: ["Extensii gene clasic", "Extensii gene volum"],
  },
  {
    name: "Masaj",
    icon: "Hand" as const,
    services: ["Masaj relaxant 60min", "Masaj relaxant 90min", "Masaj sportiv"],
  },
]

export function getServiceByName(name: string): AppointmentService | undefined {
  const s = CATALOG_SERVICES.find((c) => c.name === name)
  if (!s) return
  return { name: s.name, duration: s.duration, price: s.price }
}

// Day names in Romanian matching StaffMember.schedule keys
const DAY_NAMES_RO = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]

export function getDayNameRO(date: Date): string {
  return DAY_NAMES_RO[date.getDay()]
}

export function toISODate(date: Date): string {
  // Use local date to avoid TZ shift from toISOString
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Staff who perform ALL the selected services, are active, and not the "inactiv" status
export function getQualifiedStaff(
  staff: StaffMember[],
  selectedServiceNames: string[],
): StaffMember[] {
  const active = staff.filter((s) => s.status !== "inactiv")
  if (selectedServiceNames.length === 0) return active
  return active.filter((s) =>
    selectedServiceNames.every((name) => s.services.includes(name)),
  )
}

// Can the date be picked at all (any qualified staff working that day, not on leave)?
export function isDateBookable(date: Date, qualifiedStaff: StaffMember[]): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compare = new Date(date)
  compare.setHours(0, 0, 0, 0)
  if (compare < today) return false

  const day = getDayNameRO(date)
  const dateStr = toISODate(date)
  return qualifiedStaff.some((s) => {
    const sched = s.schedule[day]
    if (!sched?.active) return false
    const onLeave = s.timeOffRequests.some(
      (t) =>
        t.status === "approved" && dateStr >= t.startDate && dateStr <= t.endDate,
    )
    return !onLeave
  })
}

export interface TimeSlot {
  time: string      // "HH:MM"
  staffId: string   // first staff member available at this time
}

export function getAvailableSlots(
  staffList: StaffMember[],
  dateStr: string,
  totalDuration: number,
): TimeSlot[] {
  if (totalDuration <= 0) return []
  const date = new Date(dateStr + "T12:00:00")
  const day = getDayNameRO(date)
  const slotMap = new Map<string, string>()

  for (const s of staffList) {
    const sched = s.schedule[day]
    if (!sched?.active) continue

    const onLeave = s.timeOffRequests.some(
      (t) =>
        t.status === "approved" && dateStr >= t.startDate && dateStr <= t.endDate,
    )
    if (onLeave) continue

    const existing = APPOINTMENTS_DATA.filter(
      (a) =>
        a.staffId === s.id &&
        a.date === dateStr &&
        a.status !== "anulat" &&
        a.status !== "no_show",
    )
    const blocked = s.blockedSlots.filter((b) => b.date === dateStr)

    const startMin = timeToMinutes(sched.start)
    const endMin = timeToMinutes(sched.end)
    const lastStart = endMin - totalDuration

    // Past-time filter if the date is today
    const now = new Date()
    const isToday = toISODate(now) === dateStr
    const nowMin = now.getHours() * 60 + now.getMinutes() + 15 // buffer

    for (let m = startMin; m <= lastStart; m += 15) {
      if (isToday && m < nowMin) continue

      const conflict = existing.some((a) => {
        const aStart = timeToMinutes(a.startTime)
        const aEnd = timeToMinutes(a.endTime)
        return m < aEnd && m + totalDuration > aStart
      })
      if (conflict) continue

      const blockedConflict = blocked.some((b) => {
        const bStart = timeToMinutes(b.startTime)
        const bEnd = timeToMinutes(b.endTime)
        return m < bEnd && m + totalDuration > bStart
      })
      if (blockedConflict) continue

      const slotStart = minutesToTime(m)
      if (!slotMap.has(slotStart)) slotMap.set(slotStart, s.id)
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
    const h = Number(slot.time.split(":")[0])
    if (h < 12) morning.push(slot)
    else if (h < 17) afternoon.push(slot)
    else evening.push(slot)
  })
  return { morning, afternoon, evening }
}

// Find next available date within the next 60 days
export function findNextAvailableDate(
  qualifiedStaff: StaffMember[],
  totalDuration: number,
): Date | null {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let i = 0; i < 60; i++) {
    const probe = new Date(start)
    probe.setDate(start.getDate() + i)
    if (!isDateBookable(probe, qualifiedStaff)) continue
    const slots = getAvailableSlots(qualifiedStaff, toISODate(probe), totalDuration)
    if (slots.length > 0) return probe
  }
  return null
}

export function generateConfirmationNumber(): string {
  const date = new Date()
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ASE-${datePart}-${rand}`
}

export function generateICS(opts: {
  title: string
  description: string
  location: string
  date: string
  time: string
  durationMin: number
}): string {
  const [y, m, d] = opts.date.split("-").map(Number)
  const [hh, mm] = opts.time.split(":").map(Number)
  // Treat event as local time; .ics with TZID would be better but this is widely accepted
  const pad = (n: number) => String(n).padStart(2, "0")
  const startLocal = `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`
  const endTotal = hh * 60 + mm + opts.durationMin
  const endH = Math.floor(endTotal / 60)
  const endM = endTotal % 60
  const endLocal = `${y}${pad(m)}${pad(d)}T${pad(endH)}${pad(endM)}00`
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

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
    `SUMMARY:${escapeICS(opts.title)}`,
    `DESCRIPTION:${escapeICS(opts.description)}`,
    `LOCATION:${escapeICS(opts.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
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

export function formatDurationMin(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
