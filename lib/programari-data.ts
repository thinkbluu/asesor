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
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  duration: number // minutes
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
  confirmat:        { label: "Confirmat",       color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500",    dot: "bg-emerald-500" },
  in_asteptare:     { label: "În așteptare",    color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-500/15",   border: "border-amber-500",      dot: "bg-amber-500" },
  in_desfasurare:   { label: "În desfășurare",  color: "text-blue-700 dark:text-blue-400",       bg: "bg-blue-500/15",    border: "border-blue-500",       dot: "bg-blue-500" },
  finalizat:        { label: "Finalizat",        color: "text-zinc-500",                          bg: "bg-zinc-500/15",    border: "border-zinc-400",       dot: "bg-zinc-400" },
  anulat:           { label: "Anulat",           color: "text-red-600 dark:text-red-400",         bg: "bg-red-500/15",     border: "border-red-500",        dot: "bg-red-500" },
  no_show:          { label: "No-show",          color: "text-red-900 dark:text-red-300",         bg: "bg-red-900/15",     border: "border-red-900",        dot: "bg-red-900" },
}

// Staff derived from echipa-data
export const CALENDAR_STAFF = [
  { id: "1", name: "Ana Marinescu",  color: "#2D8C3C", initials: "AM" },
  { id: "2", name: "Cristina Voicu", color: "#2563EB", initials: "CV" },
  { id: "3", name: "Mara Ene",       color: "#D97706", initials: "ME" },
  { id: "5", name: "Ioana Preda",    color: "#7C3AED", initials: "IP" },
  { id: "6", name: "Radu Florescu",  color: "#DB2777", initials: "RF" },
]

export const SALON_HOURS = { start: "09:00", end: "20:00" }

// Generate time slots every 30 min between salon open/close
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
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "short",
  })
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
  const startDow = (firstDay.getDay() + 6) % 7 // Monday=0
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

// Seed appointments for today and surrounding days
const today = toDateString(new Date())
const yesterday = toDateString(new Date(Date.now() - 86400000))
const tomorrow = toDateString(new Date(Date.now() + 86400000))

export const APPOINTMENTS_DATA: Appointment[] = [
  {
    id: "a1", clientId: "1", clientName: "Maria Popescu", clientPhone: "0722 123 456",
    staffId: "1", staffName: "Ana Marinescu",
    services: [{ name: "Vopsit rădăcini", duration: 60, price: 160 }, { name: "Tuns și coafat", duration: 45, price: 120 }],
    date: today, startTime: "09:00", endTime: "10:45", duration: 105,
    totalPrice: 280, discount: 0, discountType: "fix",
    status: "finalizat", notes: "Clientă VIP, atenție la PPD", recurrence: "niciodata",
    source: "online", createdAt: today,
  },
  {
    id: "a2", clientId: "5", clientName: "Laura Ion", clientPhone: "0766 567 890",
    staffId: "1", staffName: "Ana Marinescu",
    services: [{ name: "Balayage / Highlights", duration: 150, price: 550 }],
    date: today, startTime: "11:00", endTime: "13:30", duration: 150,
    totalPrice: 550, discount: 0, discountType: "fix",
    status: "in_desfasurare", notes: "", recurrence: "niciodata",
    source: "telefon", createdAt: yesterday,
  },
  {
    id: "a3", clientId: "10", clientName: "Teodora Niculescu", clientPhone: "0744 123 456",
    staffId: "1", staffName: "Ana Marinescu",
    services: [{ name: "Vopsit complet", duration: 90, price: 200 }],
    date: today, startTime: "14:30", endTime: "16:00", duration: 90,
    totalPrice: 200, discount: 10, discountType: "procent",
    status: "confirmat", notes: "", recurrence: "niciodata",
    source: "salon", createdAt: yesterday,
  },
  {
    id: "a4", clientId: "5", clientName: "Laura Ion", clientPhone: "0766 567 890",
    staffId: "1", staffName: "Ana Marinescu",
    services: [{ name: "Tuns și coafat", duration: 45, price: 120 }],
    date: today, startTime: "17:00", endTime: "17:45", duration: 45,
    totalPrice: 120, discount: 0, discountType: "fix",
    status: "confirmat", notes: "", recurrence: "saptamanal",
    source: "online", createdAt: today,
  },
  {
    id: "a5", clientId: "2", clientName: "Elena Dumitrescu", clientPhone: "0733 234 567",
    staffId: "2", staffName: "Cristina Voicu",
    services: [{ name: "Manichiură gel", duration: 75, price: 120 }, { name: "Pedichiură", duration: 60, price: 80 }],
    date: today, startTime: "09:30", endTime: "11:45", duration: 135,
    totalPrice: 200, discount: 0, discountType: "fix",
    status: "finalizat", notes: "", recurrence: "niciodata",
    source: "whatsapp", createdAt: yesterday,
  },
  {
    id: "a6", clientId: "12", clientName: "Valentina Badea", clientPhone: "0711 345 678",
    staffId: "2", staffName: "Cristina Voicu",
    services: [{ name: "Manichiură gel", duration: 75, price: 120 }],
    date: today, startTime: "12:00", endTime: "13:15", duration: 75,
    totalPrice: 120, discount: 0, discountType: "fix",
    status: "confirmat", notes: "Preferă culori pastelate", recurrence: "niciodata",
    source: "online", createdAt: yesterday,
  },
  {
    id: "a7", clientId: "7", clientName: "Raluca Ionescu", clientPhone: "0711 890 123",
    staffId: "2", staffName: "Cristina Voicu",
    services: [{ name: "Manichiură simplă", duration: 45, price: 70 }],
    date: today, startTime: "14:00", endTime: "14:45", duration: 45,
    totalPrice: 70, discount: 0, discountType: "fix",
    status: "in_asteptare", notes: "", recurrence: "niciodata",
    source: "telefon", createdAt: today,
  },
  {
    id: "a8", clientId: "3", clientName: "Ioana Marin", clientPhone: "0744 345 678",
    staffId: "3", staffName: "Mara Ene",
    services: [{ name: "Tratament facial hidratant", duration: 60, price: 200 }],
    date: today, startTime: "10:00", endTime: "11:00", duration: 60,
    totalPrice: 200, discount: 0, discountType: "fix",
    status: "confirmat", notes: "Piele sensibilă, produse hipoalergenice", recurrence: "niciodata",
    source: "online", createdAt: yesterday,
  },
  {
    id: "a9", clientId: "8", clientName: "Mihaela Cristea", clientPhone: "0722 901 234",
    staffId: "3", staffName: "Mara Ene",
    services: [{ name: "Masaj facial", duration: 45, price: 150 }, { name: "Epilare față", duration: 20, price: 60 }],
    date: today, startTime: "12:00", endTime: "13:05", duration: 65,
    totalPrice: 210, discount: 0, discountType: "fix",
    status: "confirmat", notes: "Clientă VIP", recurrence: "niciodata",
    source: "salon", createdAt: yesterday,
  },
  {
    id: "a10", clientId: "4", clientName: "Andreea Stan", clientPhone: "0755 456 789",
    staffId: "5", staffName: "Ioana Preda",
    services: [{ name: "Extensii gene volum", duration: 150, price: 350 }],
    date: today, startTime: "09:00", endTime: "11:30", duration: 150,
    totalPrice: 350, discount: 0, discountType: "fix",
    status: "confirmat", notes: "", recurrence: "niciodata",
    source: "instagram", createdAt: yesterday,
  },
  {
    id: "a11", clientId: "9", clientName: "Gabriela Rusu", clientPhone: "0733 012 345",
    staffId: "5", staffName: "Ioana Preda",
    services: [{ name: "Extensii gene clasic", duration: 120, price: 250 }],
    date: today, startTime: "13:00", endTime: "15:00", duration: 120,
    totalPrice: 250, discount: 0, discountType: "fix",
    status: "in_asteptare", notes: "Prima vizită pentru gene", recurrence: "niciodata",
    source: "online", createdAt: today,
  },
  {
    id: "a12", clientId: "8", clientName: "Mihaela Cristea", clientPhone: "0722 901 234",
    staffId: "6", staffName: "Radu Florescu",
    services: [{ name: "Masaj relaxant 90min", duration: 90, price: 280 }],
    date: today, startTime: "14:00", endTime: "15:30", duration: 90,
    totalPrice: 280, discount: 0, discountType: "fix",
    status: "confirmat", notes: "", recurrence: "niciodata",
    source: "salon", createdAt: yesterday,
  },
  // Yesterday
  {
    id: "a13", clientId: "1", clientName: "Maria Popescu", clientPhone: "0722 123 456",
    staffId: "1", staffName: "Ana Marinescu",
    services: [{ name: "Tuns și coafat", duration: 45, price: 120 }],
    date: yesterday, startTime: "10:00", endTime: "10:45", duration: 45,
    totalPrice: 120, discount: 0, discountType: "fix",
    status: "finalizat", notes: "", recurrence: "niciodata",
    source: "online", createdAt: yesterday,
  },
  {
    id: "a14", clientId: "6", clientName: "Simona Popa", clientPhone: "0788 789 012",
    staffId: "2", staffName: "Cristina Voicu",
    services: [{ name: "Manichiură gel", duration: 75, price: 120 }],
    date: yesterday, startTime: "11:00", endTime: "12:15", duration: 75,
    totalPrice: 120, discount: 0, discountType: "fix",
    status: "no_show", notes: "", recurrence: "niciodata",
    source: "telefon", createdAt: yesterday,
  },
  // Tomorrow
  {
    id: "a15", clientId: "10", clientName: "Teodora Niculescu", clientPhone: "0744 123 456",
    staffId: "1", staffName: "Ana Marinescu",
    services: [{ name: "Tuns și coafat", duration: 45, price: 120 }],
    date: tomorrow, startTime: "09:30", endTime: "10:15", duration: 45,
    totalPrice: 120, discount: 0, discountType: "fix",
    status: "confirmat", notes: "", recurrence: "niciodata",
    source: "online", createdAt: today,
  },
  {
    id: "a16", clientId: "12", clientName: "Valentina Badea", clientPhone: "0711 345 678",
    staffId: "2", staffName: "Cristina Voicu",
    services: [{ name: "Manichiură gel", duration: 75, price: 120 }, { name: "Pedichiură", duration: 60, price: 80 }],
    date: tomorrow, startTime: "11:00", endTime: "13:15", duration: 135,
    totalPrice: 200, discount: 0, discountType: "fix",
    status: "in_asteptare", notes: "", recurrence: "niciodata",
    source: "whatsapp", createdAt: today,
  },
  {
    id: "a17", clientId: "5", clientName: "Laura Ion", clientPhone: "0766 567 890",
    staffId: "3", staffName: "Mara Ene",
    services: [{ name: "Tratament facial hidratant", duration: 60, price: 200 }],
    date: tomorrow, startTime: "14:00", endTime: "15:00", duration: 60,
    totalPrice: 200, discount: 0, discountType: "fix",
    status: "confirmat", notes: "", recurrence: "niciodata",
    source: "salon", createdAt: today,
  },
]

export function getAppointmentsForDate(date: string): Appointment[] {
  return APPOINTMENTS_DATA.filter(a => a.date === date)
}

export function getAppointmentsForDateRange(start: string, end: string): Appointment[] {
  return APPOINTMENTS_DATA.filter(a => a.date >= start && a.date <= end)
}

export function getDayRevenue(date: string): number {
  return getAppointmentsForDate(date)
    .filter(a => a.status === "finalizat")
    .reduce((sum, a) => sum + a.totalPrice, 0)
}

export const CATALOG_SERVICES = [
  { name: "Tuns și coafat",         duration: 45,  price: 120 },
  { name: "Vopsit rădăcini",        duration: 60,  price: 160 },
  { name: "Vopsit complet",         duration: 90,  price: 200 },
  { name: "Balayage / Highlights",  duration: 150, price: 550 },
  { name: "Tratament keratină",     duration: 120, price: 480 },
  { name: "Coafat ocazie",          duration: 60,  price: 180 },
  { name: "Tratament par",          duration: 30,  price: 100 },
  { name: "Manichiură simplă",      duration: 45,  price: 70  },
  { name: "Manichiură gel",         duration: 75,  price: 120 },
  { name: "Pedichiură",             duration: 60,  price: 80  },
  { name: "Nail art",               duration: 30,  price: 50  },
  { name: "Tratament facial hidratant", duration: 60, price: 200 },
  { name: "Curățare față profundă", duration: 75,  price: 180 },
  { name: "Masaj facial",           duration: 45,  price: 150 },
  { name: "Epilare față",           duration: 20,  price: 60  },
  { name: "Extensii gene clasic",   duration: 120, price: 250 },
  { name: "Extensii gene volum",    duration: 150, price: 350 },
  { name: "Masaj relaxant 60min",   duration: 60,  price: 200 },
  { name: "Masaj relaxant 90min",   duration: 90,  price: 280 },
  { name: "Masaj sportiv",          duration: 60,  price: 320 },
]
