// Neutral booking helpers shared by the public booking flow (client + server).
// Must NOT import from lib/*-data.ts (mock modules) or server-only modules —
// everything here is safe to bundle for the browser.

export interface SalonInfo {
  slug: string
  name: string
  address: string
  phone: string
  city: string
  description: string
  cancellationPolicy: string
  cancellationWindowHours: number
  hoursText: string
}

export interface BookingService {
  id: string
  name: string
  category: string
  durationMin: number
  price: number
  priceFrom: boolean
}

export interface BookingStaff {
  id: string
  firstName: string
  roleTitle: string | null
  color: string | null
}

/** A free slot returned by public_availability, time in Europe/Bucharest. */
export interface BookingSlot {
  staffId: string
  time: string // "HH:mm"
}

const DAY_NAMES_RO = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]

/** weekday convention from salon_hours/public_availability: 0 = luni. */
export function getDayNameRO(weekday: number): string {
  return DAY_NAMES_RO[weekday] ?? ""
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function groupSlotsByPeriod(slots: BookingSlot[]): {
  morning: BookingSlot[]
  afternoon: BookingSlot[]
  evening: BookingSlot[]
} {
  const morning: BookingSlot[] = []
  const afternoon: BookingSlot[] = []
  const evening: BookingSlot[] = []
  slots.forEach((slot) => {
    const hour = Number(slot.time.split(":")[0])
    if (hour < 12) morning.push(slot)
    else if (hour < 17) afternoon.push(slot)
    else evening.push(slot)
  })
  return { morning, afternoon, evening }
}

export function formatDateLong(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
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

export { normalizePhoneRo as normalizePhone } from "@/lib/validation/programari"
