// TEMPORARY P19 verification harness — mock-data render of the /app views + booking.
// Deleted before commit; never part of the app.
import { Suspense } from "react"
import type { CSSProperties } from "react"
import { Bodoni_Moda } from "next/font/google"
import { AppSidebar } from "@/components/app/app-sidebar"
import { ProgramariView } from "@/components/app/programari/programari-view"
import { DashboardView } from "@/components/app/dashboard-view"
import { ClientDetailView } from "@/components/app/clienti/client-detail-view"
import { ClientsView } from "@/components/app/clienti/clients-view"
import { SetariView } from "@/components/app/setari-view"
import { BookingFlow } from "@/components/booking/booking-flow"
import { SalonShell } from "@/components/booking/salon-shell"
import "../booking/booking.css"
import type { CalendarStaff, CatalogService, Appointment } from "@/lib/mappers/programari"
import type { ClientDetail, ClientHistoryItem, LoyaltyEntry, ConsentRecord, ClientPhoto, SensitiveData, ClientListItem } from "@/lib/mappers/clienti"
import type { DashboardSummary, WeeklyRevenueDay, DashboardAlerts } from "@/lib/data/dashboard"
import type { SetariProfil, SetariDaySchedule, SetariPolitici, SetariCategory, SetariService } from "@/lib/mappers/setari"
import type { BillingState } from "@/lib/billing/access"
import type { ReviewsStats } from "@/lib/reviews"
import type { SalonInfo, BookingService } from "@/lib/booking-logic"
import { DEFAULT_LOYALTY_CONFIG } from "@/lib/loyalty"
import { DEFAULT_REVIEWS_CONFIG } from "@/lib/reviews"
import { DEFAULT_NOTIFICATIONS } from "@/lib/messaging/settings"
import { DAY_KEYS, DAY_LABELS } from "@/lib/mappers/onboarding"

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
})

const STAFF: CalendarStaff[] = [
  { id: "st-andra", name: "Andra Pop", roleTitle: "Stilist", color: "#00704F", initials: "AP", active: true },
  { id: "st-ioana", name: "Ioana Radu", roleTitle: "Stilist", color: "#7A4510", initials: "IR", active: true },
  { id: "st-bianca", name: "Bianca Marin", roleTitle: "Manichiuristă", color: "#B0234E", initials: "BM", active: true },
  { id: "st-mara", name: "Mara Vlad", roleTitle: "Esteticiană", color: "#131516", initials: "MV", active: true },
]

const SERVICES: CatalogService[] = [
  { id: "sv-1", name: "Tuns dame", duration: 40, price: 70, buffer: 10 },
  { id: "sv-2", name: "Vopsit rădăcini", duration: 90, price: 240, buffer: 10 },
  { id: "sv-3", name: "Manichiură gel", duration: 60, price: 120, buffer: 10 },
  { id: "sv-4", name: "Tratament facial", duration: 60, price: 180, buffer: 10 },
]

// [ora, staff, durată, serviciu, clientă, status, sursă]
type Row = [string, string, number, string, string, Appointment["status"], Appointment["source"]]
const ROWS: Row[] = [
  ["09:00", "st-andra", 40, "Tuns dame", "Carmen D.", "finalizat", "salon"],
  ["09:00", "st-ioana", 90, "Vopsit rădăcini", "Elena V.", "finalizat", "telefon"],
  ["10:00", "st-bianca", 40, "Manichiură gel", "Ana S.", "finalizat", "online"],
  ["10:00", "st-mara", 60, "Tratament facial", "Laura G.", "finalizat", "salon"],
  ["11:00", "st-andra", 40, "Tuns dame", "Irina P.", "in_desfasurare", "salon"],
  ["11:00", "st-bianca", 60, "Manichiură gel", "Roxana T.", "in_desfasurare", "online"],
  ["12:00", "st-ioana", 90, "Vopsit rădăcini", "Diana M.", "confirmat", "online"],
  ["12:00", "st-mara", 60, "Tratament facial", "Monica R.", "confirmat", "telefon"],
  ["13:00", "st-andra", 40, "Tuns dame", "Sorina G.", "confirmat", "online"],
  ["13:00", "st-bianca", 40, "Manichiură gel", "Alina D.", "in_asteptare", "whatsapp"],
  ["14:00", "st-mara", 40, "Tratament facial", "Petra L.", "in_asteptare", "telefon"],
]

function mkAppointments(day: string): Appointment[] {
  return ROWS.map(([start, staffId, duration, service, client, status, source], i) => {
    const [h, m] = start.split(":").map(Number)
    const endM = h * 60 + m + duration
    const svc = SERVICES.find((s) => s.name === service)!
    return {
      id: `apt-${i}`,
      clientId: `cl-${i}`,
      clientName: client,
      clientPhone: "0722 123 456",
      clientHasAllergies: i === 4 || i === 9,
      staffId,
      staffName: STAFF.find((s) => s.id === staffId)!.name,
      services: [{ serviceId: svc.id, name: svc.name, duration: svc.duration, price: svc.price }],
      date: day,
      startTime: start,
      endTime: `${String(Math.floor(endM / 60)).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`,
      duration,
      totalPrice: svc.price,
      discount: 0,
      discountType: "procent",
      status,
      notes: "",
      recurrence: "niciodata",
      recurrenceParentId: null,
      source,
      cancelReason: null,
      createdAt: new Date().toISOString(),
    }
  })
}

const SUMMARY: DashboardSummary = {
  day: "2026-11-02",
  appointments_by_status: { confirmat: 6, in_asteptare: 2, in_desfasurare: 2, finalizat: 4, anulat: 0, no_show: 0 },
  revenue_today: 2340,
  next_upcoming: [
    { id: "u1", starts_at: "2026-11-02T10:00:00Z", status: "confirmat", client_name: "Diana M.", staff_name: "Ioana Radu" },
    { id: "u2", starts_at: "2026-11-02T11:00:00Z", status: "in_asteptare", client_name: "Alina D.", staff_name: "Bianca Marin" },
    { id: "u3", starts_at: "2026-11-02T12:00:00Z", status: "confirmat", client_name: "Sorina G.", staff_name: "Andra Pop" },
  ],
  low_stock_count: 3,
  new_clients_this_month: 6,
}

const WEEKLY: WeeklyRevenueDay[] = [
  { date: "2026-10-27", label: "marți", revenue: 1820, isToday: false },
  { date: "2026-10-28", label: "miercuri", revenue: 2410, isToday: false },
  { date: "2026-10-29", label: "joi", revenue: 1980, isToday: false },
  { date: "2026-10-30", label: "vineri", revenue: 3120, isToday: false },
  { date: "2026-10-31", label: "sâmbătă", revenue: 2860, isToday: false },
  { date: "2026-11-01", label: "luni", revenue: 1240, isToday: false },
  { date: "2026-11-02", label: "marți", revenue: 2340, isToday: true },
]

const ALERTS: DashboardAlerts = {
  pendingConfirmations: 2,
  noShowsYesterday: 1,
  upcomingTimeOff: [{ staffName: "Mara Vlad", startDate: "2026-11-10", endDate: "2026-11-14", reason: "Concediu" }],
}

const CLIENT: ClientDetail = {
  id: "cl-4",
  firstName: "Irina",
  lastName: "Pop",
  phone: "0722 123 456",
  email: "irina.pop@example.ro",
  tags: ["Fidel", "Sensibil", "VIP"],
  source: "Instagram",
  sex: "F",
  totalVisits: 23,
  totalSpent: 4180,
  lastVisitAt: "2026-10-06T10:00:00Z",
  hasAllergies: true,
  loyaltyPoints: 418,
  balanceDue: 0,
  createdAt: "2024-03-12T10:00:00Z",
  whatsappPhone: "0722 123 456",
  birthDate: "1990-05-04",
  preferredStaffId: "st-andra",
  preferredStaffName: "Andra Pop",
  communicationPref: "WhatsApp",
  notes: "Preferă programări dimineața.",
}

const HISTORY: ClientHistoryItem[] = [
  { id: "h1", date: "2026-10-06T10:00:00Z", status: "finalizat", services: [{ name: "Tuns dame", price: 70 }], staffName: "Andra Pop", total: 70, notes: null },
  { id: "h2", date: "2026-09-12T11:00:00Z", status: "finalizat", services: [{ name: "Vopsit rădăcini", price: 240 }], staffName: "Ioana Radu", total: 240, notes: null },
  { id: "h3", date: "2026-08-20T10:00:00Z", status: "anulat", services: [{ name: "Manichiură gel", price: 120 }], staffName: "Bianca Marin", total: 0, notes: null },
]

const LOYALTY: LoyaltyEntry[] = [
  { id: "l1", type: "earned", points: 24, note: "Vizită 6 octombrie", createdAt: "2026-10-06T12:00:00Z" },
  { id: "l2", type: "redeemed", points: -100, note: "Răscumpărat: spălare gratuită", createdAt: "2026-09-12T12:00:00Z" },
]

const CONSENTS: ConsentRecord[] = [
  { id: "c1", kind: "health_data", granted: true, source: "in_salon", createdAt: "2026-03-01T10:00:00Z" },
]

const SENSITIVE: ClientDetailViewSensitive = {
  data: {
    allergies: "Nu vrea vopsea cu amoniac.",
    colorFormulas: "7.3 + 7.0 (1:1)\noxidant 6% · 35 min\nultima: 6 octombrie",
    healthConsentAt: "2026-03-01T10:00:00Z",
    healthConsentSource: "in_salon",
  },
  restricted: false,
}
type ClientDetailViewSensitive = { data: SensitiveData; restricted: false } | { data: null; restricted: true } | null

const CLIENT_LIST: ClientListItem[] = [
  { id: "cl-4", firstName: "Irina", lastName: "Pop", phone: "0722 123 456", email: null, tags: ["Fidel", "VIP"], source: "Instagram", sex: "F", totalVisits: 23, totalSpent: 4180, lastVisitAt: "2026-10-06T10:00:00Z", hasAllergies: true, loyaltyPoints: 418, balanceDue: 0, createdAt: "2024-03-12T10:00:00Z" },
  { id: "cl-1", firstName: "Carmen", lastName: "Dima", phone: "0723 456 789", email: null, tags: ["Nou"], source: "Online", sex: "F", totalVisits: 2, totalSpent: 140, lastVisitAt: "2026-11-02T09:00:00Z", hasAllergies: false, loyaltyPoints: 14, balanceDue: 0, createdAt: "2026-10-28T10:00:00Z" },
  { id: "cl-2", firstName: "Elena", lastName: "Vasile", phone: "0724 567 890", email: null, tags: [], source: "Telefon", sex: "F", totalVisits: 9, totalSpent: 2160, lastVisitAt: "2026-11-02T09:00:00Z", hasAllergies: false, loyaltyPoints: 216, balanceDue: 0, createdAt: "2025-06-02T10:00:00Z" },
]

const SETARI_PROFILE: SetariProfil = {
  name: "Salonul Anei",
  description: "Salon de frumusețe în centrul Clujului.",
  phone: "0722 123 456",
  email: "contact@salonulanei.ro",
  address: "Str. Memorandumului 12",
  city: "Cluj-Napoca",
}

const SETARI_SCHEDULE: SetariDaySchedule[] = DAY_KEYS.map((day) => ({
  day,
  label: DAY_LABELS[day],
  isOpen: day !== "duminica",
  open: "09:00",
  close: "19:00",
  break: null,
}))

const SETARI_CATEGORIES: SetariCategory[] = [
  { id: "cat-1", name: "Coafură", icon: "Star", color: "#00704F" },
  { id: "cat-2", name: "Manichiură", icon: "Star", color: "#00704F" },
]

const SETARI_SERVICES: SetariService[] = [
  { id: "sv-1", name: "Tuns dame", categoryId: "cat-1", duration: 40, price: 70, description: "", products: [], staff: ["st-andra"], color: "#00704F", onlineBooking: true, active: true },
  { id: "sv-2", name: "Vopsit rădăcini", categoryId: "cat-1", duration: 90, price: 240, description: "", products: [], staff: ["st-ioana"], color: "#00704F", onlineBooking: true, active: true },
  { id: "sv-3", name: "Manichiură gel", categoryId: "cat-2", duration: 60, price: 120, description: "", products: [], staff: ["st-bianca"], color: "#00704F", onlineBooking: false, active: true },
]

const SETARI_POLITICI: SetariPolitici = {
  minAdvance: "120",
  maxFuture: "60",
  cancelFreeWindow: "4",
  onlineEnabled: true,
  requireConfirmation: false,
  slotInterval: "15",
}

const REVIEWS_STATS: ReviewsStats = {
  total: 0,
  averageRating: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  recentComments: [],
}

const BILLING: BillingState = {
  enforced: true,
  source: "subscription",
  plan: "pro",
  interval: "month",
  status: "active",
  readOnly: false,
  readOnlyMessage: null,
  banner: null,
  trialDaysLeft: null,
  trialEnd: null,
  pilotUntil: null,
  currentPeriodEnd: "2026-12-02T00:00:00Z",
  cancelAtPeriodEnd: false,
  hasSubscription: true,
  hasStripeCustomer: true,
  trialUsed: true,
}

const BOOKING_SALON: SalonInfo = {
  slug: "salonul-ana",
  name: "Salonul Anei",
  address: "Str. Memorandumului 12, Cluj-Napoca",
  phone: "0722 123 456",
  city: "Cluj-Napoca",
  description: "Salon de frumusețe în centrul Clujului.",
  cancellationPolicy: "Programările pot fi anulate gratuit cu minim 4 ore înainte de ora stabilită.",
  cancellationWindowHours: 4,
  hoursText: "Luni: 09:00–19:00 · Marți: 09:00–19:00 · Duminică: închis",
  accentColor: "#00704F",
  logoUrl: null,
}

const BOOKING_SERVICES: BookingService[] = [
  { id: "sv-1", name: "Tuns dame", category: "Coafură", durationMin: 40, price: 70, priceFrom: false },
  { id: "sv-2", name: "Vopsit rădăcini", category: "Coafură", durationMin: 90, price: 240, priceFrom: false },
  { id: "sv-3", name: "Manichiură gel", category: "Manichiură", durationMin: 60, price: 120, priceFrom: false },
]

export default async function DevAppPreview({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view = "programari" } = await searchParams
  const day = "2026-11-02"

  if (view === "booking") {
    return <BookingFlow salon={BOOKING_SALON} services={BOOKING_SERVICES} />
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ "--serif": bodoni.style.fontFamily } as CSSProperties}
    >
      <div className="flex min-h-screen">
        <AppSidebar salonName="Salonul Anei" userFullName="Ana Dumitrescu" role="owner" />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-screen flex-1">
            <Suspense fallback={null}>
              {view === "programari" && (
                <ProgramariView
                  salonId="salon-mock"
                  role="owner"
                  staffId={null}
                  staff={STAFF}
                  services={SERVICES}
                  staffServices={[]}
                  initialAppointments={mkAppointments(day)}
                  initialDate={day}
                />
              )}
              {view === "dashboard" && (
                <DashboardView summary={SUMMARY} weekly={WEEKLY} alerts={ALERTS} />
              )}
              {view === "client" && (
                <div className="p-4 pb-24 lg:p-8">
                  <ClientDetailView
                    role="owner"
                    client={CLIENT}
                    history={HISTORY}
                    loyalty={LOYALTY}
                    consents={CONSENTS}
                    sensitive={SENSITIVE}
                    sensitiveError={null}
                    photos={[] as ClientPhoto[]}
                  />
                </div>
              )}
              {view === "clienti" && (
                <div className="p-4 pb-24 lg:p-8">
                  <ClientsView
                    role="owner"
                    initialList={{ items: CLIENT_LIST, total: 3, page: 1, pageSize: 20 }}
                    initialError={null}
                  />
                </div>
              )}
              {view === "setari" && (
                <div className="p-4 pb-24 lg:p-8">
                  <SetariView
                    profil={SETARI_PROFILE}
                    schedule={SETARI_SCHEDULE}
                    politici={SETARI_POLITICI}
                    loyalty={DEFAULT_LOYALTY_CONFIG}
                    reviews={DEFAULT_REVIEWS_CONFIG}
                    reviewsStats={REVIEWS_STATS}
                    categories={SETARI_CATEGORIES}
                    services={SETARI_SERVICES}
                    staff={[
                      { id: "st-andra", name: "Andra Pop" },
                      { id: "st-ioana", name: "Ioana Radu" },
                    ]}
                    products={[{ id: "p-1", name: "Oxidant 6%" }]}
                    deletedAt={null}
                    notifications={DEFAULT_NOTIFICATIONS}
                    billing={BILLING}
                    usage={{ users: 3, clients: 42 }}
                    isOwner={true}
                  />
                </div>
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
