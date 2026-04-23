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

const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  Luni:      { start: "09:00", end: "18:00", active: true },
  Marți:     { start: "09:00", end: "18:00", active: true },
  Miercuri:  { start: "09:00", end: "18:00", active: true },
  Joi:       { start: "09:00", end: "18:00", active: true },
  Vineri:    { start: "09:00", end: "18:00", active: true },
  Sâmbătă:   { start: "10:00", end: "15:00", active: true },
  Duminică:  { start: "09:00", end: "18:00", active: false },
}

export const STAFF_DATA: StaffMember[] = [
  {
    id: "1",
    firstName: "Ana",
    lastName: "Marinescu",
    role: "Stilist Senior",
    phone: "0722 100 111",
    email: "ana.marinescu@salon.ro",
    status: "activ",
    dataAngajare: "2019-03-01",
    notes: "Specializată în vopsit și tehnici balayage. Instructoare internă.",
    services: ["Tuns și coafat", "Vopsit rădăcini", "Vopsit complet", "Balayage / Highlights", "Tratament keratină"],
    servicePriceOverrides: { "Balayage / Highlights": 550, "Tratament keratină": 480 },
    schedule: {
      Luni:      { start: "09:00", end: "18:00", active: true },
      Marți:     { start: "09:00", end: "18:00", active: true },
      Miercuri:  { start: "09:00", end: "18:00", active: true },
      Joi:       { start: "09:00", end: "18:00", active: true },
      Vineri:    { start: "09:00", end: "17:00", active: true },
      Sâmbătă:   { start: "10:00", end: "15:00", active: true },
      Duminică:  { start: "09:00", end: "18:00", active: false },
    },
    timeOffRequests: [
      { id: "t1", startDate: "2025-02-10", endDate: "2025-02-14", reason: "Concediu anual", status: "approved" },
    ],
    blockedSlots: [
      { id: "b1", date: "2025-02-05", startTime: "14:00", endTime: "16:00", reason: "Training tehnici noi" },
    ],
    commissionType: "procent",
    commissionRate: 40,
    stats: {
      appointmentsThisMonth: 89,
      revenueThisMonth: 14200,
      avgRating: 4.9,
      noShowRate: 3,
      utilizationRate: 85,
      todayAppointments: 7,
    },
    weeklyTrend: [
      { week: "W17", count: 18 }, { week: "W18", count: 22 }, { week: "W19", count: 20 },
      { week: "W20", count: 24 }, { week: "W21", count: 19 }, { week: "W22", count: 23 },
      { week: "W23", count: 21 }, { week: "W24", count: 25 },
    ],
    reviews: [
      { id: "r1", clientName: "Maria P.", rating: 5, comment: "Ana este extraordinară! Rezultat perfect.", date: "2025-01-20", service: "Balayage" },
      { id: "r2", clientName: "Teodora N.", rating: 5, comment: "Cel mai bun colorist din oraș.", date: "2025-01-12", service: "Vopsit complet" },
      { id: "r3", clientName: "Laura I.", rating: 5, comment: "Profesionalism la cel mai înalt nivel.", date: "2025-01-08", service: "Tuns și coafat" },
    ],
    commissionHistory: [
      { month: "Ian 2025", servicesCount: 89, revenue: 14200, commissionEarned: 5680 },
      { month: "Dec 2024", servicesCount: 82, revenue: 13100, commissionEarned: 5240 },
      { month: "Nov 2024", servicesCount: 78, revenue: 12400, commissionEarned: 4960 },
      { month: "Oct 2024", servicesCount: 85, revenue: 13600, commissionEarned: 5440 },
    ],
  },
  {
    id: "2",
    firstName: "Cristina",
    lastName: "Voicu",
    role: "Manichiurista",
    phone: "0733 200 222",
    email: "cristina.voicu@salon.ro",
    status: "activ",
    dataAngajare: "2020-06-15",
    notes: "Expertă în nail art și tehnici gel. Preferă programări de min. 90 min.",
    services: ["Manichiură simplă", "Manichiură gel", "Pedichiură"],
    servicePriceOverrides: {},
    schedule: {
      Luni:      { start: "10:00", end: "19:00", active: true },
      Marți:     { start: "10:00", end: "19:00", active: true },
      Miercuri:  { start: "10:00", end: "19:00", active: false },
      Joi:       { start: "10:00", end: "19:00", active: true },
      Vineri:    { start: "10:00", end: "19:00", active: true },
      Sâmbătă:   { start: "10:00", end: "16:00", active: true },
      Duminică:  { start: "09:00", end: "18:00", active: false },
    },
    timeOffRequests: [],
    blockedSlots: [],
    commissionType: "procent",
    commissionRate: 35,
    stats: {
      appointmentsThisMonth: 74,
      revenueThisMonth: 8900,
      avgRating: 4.8,
      noShowRate: 5,
      utilizationRate: 72,
      todayAppointments: 5,
    },
    weeklyTrend: [
      { week: "W17", count: 15 }, { week: "W18", count: 18 }, { week: "W19", count: 16 },
      { week: "W20", count: 20 }, { week: "W21", count: 17 }, { week: "W22", count: 19 },
      { week: "W23", count: 18 }, { week: "W24", count: 21 },
    ],
    reviews: [
      { id: "r4", clientName: "Elena D.", rating: 5, comment: "Unghii perfecte de fiecare dată!", date: "2025-01-18", service: "Manichiură gel" },
      { id: "r5", clientName: "Valentina B.", rating: 5, comment: "Cristina e genială, design unic.", date: "2025-01-19", service: "Nail art" },
    ],
    commissionHistory: [
      { month: "Ian 2025", servicesCount: 74, revenue: 8900, commissionEarned: 3115 },
      { month: "Dec 2024", servicesCount: 68, revenue: 8200, commissionEarned: 2870 },
      { month: "Nov 2024", servicesCount: 71, revenue: 8500, commissionEarned: 2975 },
      { month: "Oct 2024", servicesCount: 65, revenue: 7800, commissionEarned: 2730 },
    ],
  },
  {
    id: "3",
    firstName: "Mara",
    lastName: "Ene",
    role: "Cosmetician",
    phone: "0744 300 333",
    email: "mara.ene@salon.ro",
    status: "activ",
    dataAngajare: "2021-01-10",
    notes: "Specializată în tratamente anti-aging și lifting facial.",
    services: ["Tratament facial hidratant", "Curățare față profundă", "Masaj facial", "Epilare față"],
    servicePriceOverrides: { "Tratament facial hidratant": 220 },
    schedule: DEFAULT_SCHEDULE,
    timeOffRequests: [
      { id: "t2", startDate: "2025-03-01", endDate: "2025-03-07", reason: "Curs profesional", status: "pending" },
    ],
    blockedSlots: [],
    commissionType: "procent",
    commissionRate: 35,
    stats: {
      appointmentsThisMonth: 62,
      revenueThisMonth: 9400,
      avgRating: 4.7,
      noShowRate: 4,
      utilizationRate: 68,
      todayAppointments: 4,
    },
    weeklyTrend: [
      { week: "W17", count: 13 }, { week: "W18", count: 15 }, { week: "W19", count: 14 },
      { week: "W20", count: 17 }, { week: "W21", count: 15 }, { week: "W22", count: 16 },
      { week: "W23", count: 14 }, { week: "W24", count: 18 },
    ],
    reviews: [
      { id: "r6", clientName: "Ioana M.", rating: 5, comment: "Tratamentul a fost minunat, pielea mea arată fantastic!", date: "2025-01-15", service: "Tratament facial" },
      { id: "r7", clientName: "Mihaela C.", rating: 4, comment: "Profesionistă, recomand cu căldură.", date: "2025-01-22", service: "Masaj facial" },
    ],
    commissionHistory: [
      { month: "Ian 2025", servicesCount: 62, revenue: 9400, commissionEarned: 3290 },
      { month: "Dec 2024", servicesCount: 58, revenue: 8700, commissionEarned: 3045 },
      { month: "Nov 2024", servicesCount: 60, revenue: 9100, commissionEarned: 3185 },
      { month: "Oct 2024", servicesCount: 55, revenue: 8300, commissionEarned: 2905 },
    ],
  },
  {
    id: "4",
    firstName: "Diana",
    lastName: "Rus",
    role: "Stilist",
    phone: "0755 400 444",
    email: "diana.rus@salon.ro",
    status: "concediu",
    dataAngajare: "2022-03-20",
    notes: "Stilistă bună, în creștere. Interesată de cursuri de perfecționare.",
    services: ["Tuns și coafat", "Vopsit rădăcini", "Tratament par", "Coafat ocazie"],
    servicePriceOverrides: {},
    schedule: {
      Luni:      { start: "11:00", end: "20:00", active: true },
      Marți:     { start: "11:00", end: "20:00", active: true },
      Miercuri:  { start: "11:00", end: "20:00", active: true },
      Joi:       { start: "11:00", end: "20:00", active: false },
      Vineri:    { start: "11:00", end: "20:00", active: true },
      Sâmbătă:   { start: "10:00", end: "18:00", active: true },
      Duminică:  { start: "09:00", end: "18:00", active: false },
    },
    timeOffRequests: [
      { id: "t3", startDate: "2025-01-27", endDate: "2025-02-07", reason: "Concediu medical", status: "approved" },
    ],
    blockedSlots: [],
    commissionType: "procent",
    commissionRate: 35,
    stats: {
      appointmentsThisMonth: 54,
      revenueThisMonth: 7200,
      avgRating: 4.7,
      noShowRate: 6,
      utilizationRate: 78,
      todayAppointments: 0,
    },
    weeklyTrend: [
      { week: "W17", count: 12 }, { week: "W18", count: 14 }, { week: "W19", count: 13 },
      { week: "W20", count: 16 }, { week: "W21", count: 14 }, { week: "W22", count: 15 },
      { week: "W23", count: 13 }, { week: "W24", count: 0 },
    ],
    reviews: [
      { id: "r8", clientName: "Simona P.", rating: 5, comment: "Diana mi-a salvat părul după o vopsire proastă.", date: "2024-12-20", service: "Tuns și coafat" },
    ],
    commissionHistory: [
      { month: "Ian 2025", servicesCount: 54, revenue: 7200, commissionEarned: 2520 },
      { month: "Dec 2024", servicesCount: 61, revenue: 8100, commissionEarned: 2835 },
      { month: "Nov 2024", servicesCount: 58, revenue: 7700, commissionEarned: 2695 },
      { month: "Oct 2024", servicesCount: 52, revenue: 6900, commissionEarned: 2415 },
    ],
  },
  {
    id: "5",
    firstName: "Ioana",
    lastName: "Preda",
    role: "Gene & Sprancene",
    phone: "0766 500 555",
    email: "ioana.preda@salon.ro",
    status: "activ",
    dataAngajare: "2023-05-08",
    notes: "Expertă în extensii gene volum rusesc și laminare.",
    services: ["Extensii gene clasic", "Extensii gene volum"],
    servicePriceOverrides: {},
    schedule: {
      Luni:      { start: "10:00", end: "18:00", active: true },
      Marți:     { start: "10:00", end: "18:00", active: true },
      Miercuri:  { start: "10:00", end: "18:00", active: false },
      Joi:       { start: "10:00", end: "18:00", active: true },
      Vineri:    { start: "10:00", end: "18:00", active: true },
      Sâmbătă:   { start: "10:00", end: "16:00", active: true },
      Duminică:  { start: "09:00", end: "18:00", active: false },
    },
    timeOffRequests: [],
    blockedSlots: [
      { id: "b2", date: "2025-02-12", startTime: "09:00", endTime: "12:00", reason: "Curs avanzat gene" },
    ],
    commissionType: "procent",
    commissionRate: 38,
    stats: {
      appointmentsThisMonth: 48,
      revenueThisMonth: 7800,
      avgRating: 4.9,
      noShowRate: 2,
      utilizationRate: 70,
      todayAppointments: 3,
    },
    weeklyTrend: [
      { week: "W17", count: 10 }, { week: "W18", count: 12 }, { week: "W19", count: 11 },
      { week: "W20", count: 14 }, { week: "W21", count: 12 }, { week: "W22", count: 13 },
      { week: "W23", count: 11 }, { week: "W24", count: 14 },
    ],
    reviews: [
      { id: "r9", clientName: "Andreea S.", rating: 5, comment: "Gene perfecte, durează mult!", date: "2025-01-10", service: "Extensii gene volum" },
      { id: "r10", clientName: "Gabriela R.", rating: 5, comment: "Super profesionistă.", date: "2025-01-05", service: "Extensii gene clasic" },
    ],
    commissionHistory: [
      { month: "Ian 2025", servicesCount: 48, revenue: 7800, commissionEarned: 2964 },
      { month: "Dec 2024", servicesCount: 44, revenue: 7100, commissionEarned: 2698 },
      { month: "Nov 2024", servicesCount: 46, revenue: 7400, commissionEarned: 2812 },
      { month: "Oct 2024", servicesCount: 42, revenue: 6800, commissionEarned: 2584 },
    ],
  },
  {
    id: "6",
    firstName: "Radu",
    lastName: "Florescu",
    role: "Maseur",
    phone: "0777 600 666",
    email: "radu.florescu@salon.ro",
    status: "activ",
    dataAngajare: "2022-09-01",
    notes: "Maseur cu certificare în masaj suedez și sport. Disponibil și pentru masaj la domiciliu.",
    services: ["Masaj relaxant 60min", "Masaj relaxant 90min", "Masaj sportiv"],
    servicePriceOverrides: { "Masaj sportiv": 320 },
    schedule: {
      Luni:      { start: "12:00", end: "20:00", active: true },
      Marți:     { start: "12:00", end: "20:00", active: false },
      Miercuri:  { start: "12:00", end: "20:00", active: true },
      Joi:       { start: "12:00", end: "20:00", active: true },
      Vineri:    { start: "12:00", end: "20:00", active: true },
      Sâmbătă:   { start: "10:00", end: "18:00", active: true },
      Duminică:  { start: "10:00", end: "16:00", active: true },
    },
    timeOffRequests: [],
    blockedSlots: [],
    commissionType: "fix",
    commissionRate: 80,
    stats: {
      appointmentsThisMonth: 52,
      revenueThisMonth: 10400,
      avgRating: 4.8,
      noShowRate: 4,
      utilizationRate: 60,
      todayAppointments: 4,
    },
    weeklyTrend: [
      { week: "W17", count: 11 }, { week: "W18", count: 13 }, { week: "W19", count: 12 },
      { week: "W20", count: 15 }, { week: "W21", count: 13 }, { week: "W22", count: 14 },
      { week: "W23", count: 12 }, { week: "W24", count: 14 },
    ],
    reviews: [
      { id: "r11", clientName: "Mihaela C.", rating: 5, comment: "Cel mai bun masaj! Revin cu siguranță.", date: "2025-01-22", service: "Masaj relaxant 90min" },
      { id: "r12", clientName: "Laura I.", rating: 5, comment: "Profesionist și atent la detalii.", date: "2025-01-08", service: "Masaj sportiv" },
    ],
    commissionHistory: [
      { month: "Ian 2025", servicesCount: 52, revenue: 10400, commissionEarned: 4160 },
      { month: "Dec 2024", servicesCount: 48, revenue: 9600, commissionEarned: 3840 },
      { month: "Nov 2024", servicesCount: 50, revenue: 10000, commissionEarned: 4000 },
      { month: "Oct 2024", servicesCount: 45, revenue: 9000, commissionEarned: 3600 },
    ],
  },
]

export function getStaffById(id: string): StaffMember | undefined {
  return STAFF_DATA.find((s) => s.id === id)
}

export const STATUS_STYLES: Record<StaffStatus, string> = {
  activ:    "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  concediu: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  inactiv:  "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
}

export const STATUS_LABELS: Record<StaffStatus, string> = {
  activ:    "Activ",
  concediu: "Concediu",
  inactiv:  "Inactiv",
}

export const ALL_SERVICES = [
  "Tuns și coafat", "Vopsit rădăcini", "Vopsit complet", "Balayage / Highlights",
  "Tratament keratină", "Coafat ocazie", "Tratament par",
  "Manichiură simplă", "Manichiură gel", "Pedichiură", "Nail art",
  "Tratament facial hidratant", "Curățare față profundă", "Masaj facial", "Epilare față",
  "Extensii gene clasic", "Extensii gene volum",
  "Masaj relaxant 60min", "Masaj relaxant 90min", "Masaj sportiv",
]

export const ROLES: RoleType[] = [
  "Stilist Senior", "Stilist", "Colorist", "Manichiurista",
  "Cosmetician", "Maseur", "Gene & Sprancene", "Receptioner", "Manager",
]
