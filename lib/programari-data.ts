export type AppointmentStatus = "confirmat" | "in_asteptare" | "in_desfasurare" | "finalizat" | "anulat" | "no_show"
export type RecurrenceType = "niciodata" | "saptamanal" | "bi_saptamanal" | "lunar"

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  staffId: string
  staffName: string
  services: AppointmentService[]
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
  source: "online" | "telefon" | "salon" | "whatsapp"
  createdAt: string
}

export interface AppointmentService {
  name: string
  duration: number
  price: number
}

export const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  confirmat: { label: "Confirmat", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500", dot: "bg-emerald-500" },
  in_asteptare: { label: "În așteptare", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500", dot: "bg-amber-500" },
  in_desfasurare: { label: "În desfășurare", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500", dot: "bg-blue-500" },
  finalizat: { label: "Finalizat", color: "text-zinc-500", bg: "bg-zinc-500/15", border: "border-zinc-400", dot: "bg-zinc-400" },
  anulat: { label: "Anulat", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/15", border: "border-red-500", dot: "bg-red-500" },
  no_show: { label: "No-show", color: "text-red-900 dark:text-red-300", bg: "bg-red-900/15", border: "border-red-900", dot: "bg-red-900" },
}

export const SALON_HOURS = { start: "09:00", end: "20:00" }

export function generateTimeSlots(start = "09:00", end = "20:00", step = 30): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  let total = sh * 60 + sm
  const endTotal = eh * 60 + em
  while (total < endTotal) {
    const h = Math.floor(total / 60).toString().padStart(2, "0")
    const m = (total % 60).toString().padStart(2, "0")
    slots.push(`${h}:${m}`)
    total += step
  }
  return slots
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0")
  const m = (minutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
}

export function addMinutes(time: string, mins: number): string {
  return minutesToTime(timeToMinutes(time) + mins)
}

export function formatDateRO(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

export function formatDateShortRO(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })
}

export function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", { weekday: "short" })
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekDates(anchor: Date): string[] {
  const day = anchor.getDay()
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toDateString(d)
  })
}

export function getMonthDates(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const weeks: (string | null)[][] = []
  let week: (string | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(toDateString(new Date(year, month, d)))
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}
