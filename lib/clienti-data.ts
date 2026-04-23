export type Tag = "VIP" | "Nou" | "Inactiv" | "Frecvent" | "Sensibil" | "Fidel"
export type Sex = "F" | "M" | "Nespecificat"
export type Sursa = "Google" | "Instagram" | "Recomandare" | "Walk-in" | "Facebook" | "Altele"
export type ComunicarePreferinta = "SMS" | "Email" | "WhatsApp"
export type PaymentMethod = "Card" | "Cash" | "Transfer"

export interface HistoryItem {
  id: string
  date: string
  services: string[]
  staff: string
  amount: number
  paymentMethod: PaymentMethod
  notes?: string
  productsUsed?: string[]
}

export interface GalleryPhoto {
  id: string
  url: string
  date: string
  serviceTag: string
  type: "single" | "before" | "after"
  pairId?: string
}

export interface Client {
  id: string
  prenume: string
  nume: string
  phone: string
  email: string
  dataNasterii?: string
  sex: Sex
  sursa: Sursa
  tags: Tag[]
  clientDin: string
  lastVisit: string
  totalVisits: number
  totalSpent: number
  preferredStaff: string
  preferredServices: string[]
  alergii: string
  formuleColoristice: string
  comunicarePreferinta: ComunicarePreferinta
  notes: string
  gdprConsimtamant: boolean
  gdprTimestamp?: string
  soldRestant: number
  puncteLoyalty: number
  history: HistoryItem[]
  photos: GalleryPhoto[]
}

export const CLIENTS_DATA: Client[] = [
  {
    id: "1",
    prenume: "Maria",
    nume: "Popescu",
    phone: "0722 123 456",
    email: "maria.popescu@email.com",
    dataNasterii: "1985-04-12",
    sex: "F",
    sursa: "Recomandare",
    tags: ["VIP", "Fidel", "Frecvent"],
    clientDin: "2021-03-15",
    lastVisit: "2025-01-20",
    totalVisits: 24,
    totalSpent: 4500,
    preferredStaff: "Ana Ionescu",
    preferredServices: ["Vopsit rădăcini", "Tuns și coafat"],
    alergii: "Alergie la PPD (para-phenylenediamine) — NU se folosesc vopsele cu PPD. Testare patch obligatorie.",
    formuleColoristice: "Baza 6.0 + 20vol, reflexe 9.1 + 9.3 mix 50/50 + 30vol. Ultima aplicare Ian 2025. Expunere 35min.",
    comunicarePreferinta: "WhatsApp",
    notes: "Preferă programări dimineața, înainte de 11:00. Nu îi place muzica prea tare.",
    gdprConsimtamant: true,
    gdprTimestamp: "2021-03-15T10:30:00",
    soldRestant: 0,
    puncteLoyalty: 450,
    history: [
      { id: "h1", date: "2025-01-20", services: ["Vopsit rădăcini", "Tuns și coafat"], staff: "Ana Ionescu", amount: 280, paymentMethod: "Card", notes: "Clienta mulțumită de rezultat", productsUsed: ["Wella Koleston 6.0", "Olaplex No.3"] },
      { id: "h2", date: "2024-11-05", services: ["Vopsit complet", "Tratament keratină"], staff: "Ana Ionescu", amount: 450, paymentMethod: "Card", productsUsed: ["Wella Koleston 6.0", "Keratin Complex"] },
      { id: "h3", date: "2024-09-18", services: ["Tuns și coafat"], staff: "Ana Ionescu", amount: 120, paymentMethod: "Cash" },
    ],
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop", date: "2025-01-20", serviceTag: "Vopsit rădăcini", type: "after" },
      { id: "p2", url: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=400&fit=crop", date: "2024-11-05", serviceTag: "Vopsit complet", type: "after" },
    ],
  },
  {
    id: "2",
    prenume: "Elena",
    nume: "Dumitrescu",
    phone: "0733 234 567",
    email: "elena.d@email.com",
    dataNasterii: "1992-08-22",
    sex: "F",
    sursa: "Instagram",
    tags: ["Frecvent"],
    clientDin: "2022-06-10",
    lastVisit: "2025-01-18",
    totalVisits: 12,
    totalSpent: 1800,
    preferredStaff: "Cristina Popa",
    preferredServices: ["Manichiură gel", "Pedichiură"],
    alergii: "",
    formuleColoristice: "",
    comunicarePreferinta: "SMS",
    notes: "Preferă culori nude și pastelate la unghii.",
    gdprConsimtamant: true,
    gdprTimestamp: "2022-06-10T14:00:00",
    soldRestant: 0,
    puncteLoyalty: 180,
    history: [
      { id: "h4", date: "2025-01-18", services: ["Manichiură gel", "Pedichiură"], staff: "Cristina Popa", amount: 200, paymentMethod: "Card" },
      { id: "h5", date: "2024-12-20", services: ["Manichiură gel"], staff: "Cristina Popa", amount: 120, paymentMethod: "Cash" },
    ],
    photos: [],
  },
  {
    id: "3",
    prenume: "Ioana",
    nume: "Marin",
    phone: "0744 345 678",
    email: "ioana.m@email.com",
    dataNasterii: "1990-01-30",
    sex: "F",
    sursa: "Google",
    tags: ["Sensibil"],
    clientDin: "2023-02-20",
    lastVisit: "2025-01-15",
    totalVisits: 8,
    totalSpent: 1200,
    preferredStaff: "Mara Stancu",
    preferredServices: ["Tratament facial", "Curățare față"],
    alergii: "Piele sensibilă — reacție la produse cu parfum sintetic și alcool. Se folosesc doar produse hipoalergenice.",
    formuleColoristice: "",
    comunicarePreferinta: "Email",
    notes: "Vine mereu cu soțul care o așteaptă în recepție.",
    gdprConsimtamant: true,
    gdprTimestamp: "2023-02-20T11:00:00",
    soldRestant: 0,
    puncteLoyalty: 120,
    history: [
      { id: "h6", date: "2025-01-15", services: ["Tratament facial hidratant"], staff: "Mara Stancu", amount: 200, paymentMethod: "Card" },
      { id: "h7", date: "2024-10-22", services: ["Curățare față profundă"], staff: "Mara Stancu", amount: 150, paymentMethod: "Cash" },
    ],
    photos: [],
  },
  {
    id: "4",
    prenume: "Andreea",
    nume: "Stan",
    phone: "0755 456 789",
    email: "andreea.stan@email.com",
    dataNasterii: "1998-05-14",
    sex: "F",
    sursa: "Instagram",
    tags: ["Nou"],
    clientDin: "2024-11-05",
    lastVisit: "2025-01-10",
    totalVisits: 3,
    totalSpent: 450,
    preferredStaff: "Diana Florea",
    preferredServices: ["Extensii gene", "Lifting gene"],
    alergii: "",
    formuleColoristice: "",
    comunicarePreferinta: "WhatsApp",
    notes: "Clientă nouă, a venit din recomandare Instagram.",
    gdprConsimtamant: true,
    gdprTimestamp: "2024-11-05T15:30:00",
    soldRestant: 0,
    puncteLoyalty: 45,
    history: [
      { id: "h8", date: "2025-01-10", services: ["Extensii gene volum"], staff: "Diana Florea", amount: 200, paymentMethod: "Card" },
      { id: "h9", date: "2024-12-01", services: ["Lifting gene"], staff: "Diana Florea", amount: 150, paymentMethod: "Card" },
    ],
    photos: [
      { id: "p3", url: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=400&fit=crop", date: "2025-01-10", serviceTag: "Extensii gene", type: "after" },
    ],
  },
  {
    id: "5",
    prenume: "Laura",
    nume: "Ion",
    phone: "0766 567 890",
    email: "laura.ion@email.com",
    dataNasterii: "1983-11-25",
    sex: "F",
    sursa: "Recomandare",
    tags: ["VIP", "Fidel", "Frecvent"],
    clientDin: "2020-09-01",
    lastVisit: "2025-01-08",
    totalVisits: 18,
    totalSpent: 2700,
    preferredStaff: "Ana Ionescu",
    preferredServices: ["Tuns și coafat", "Highlights"],
    alergii: "",
    formuleColoristice: "Highlights: Wella Blondor + 40vol, tonizare 10.1 + 20vol. Timp folie 45min.",
    comunicarePreferinta: "SMS",
    notes: "Preferă weekenduri, sâmbăta dimineața.",
    gdprConsimtamant: true,
    gdprTimestamp: "2020-09-01T09:00:00",
    soldRestant: 0,
    puncteLoyalty: 270,
    history: [
      { id: "h10", date: "2025-01-08", services: ["Tuns și coafat", "Treatments"], staff: "Ana Ionescu", amount: 220, paymentMethod: "Card" },
      { id: "h11", date: "2024-10-15", services: ["Highlights", "Tonizare"], staff: "Ana Ionescu", amount: 380, paymentMethod: "Card" },
    ],
    photos: [],
  },
  {
    id: "6",
    prenume: "Simona",
    nume: "Popa",
    phone: "0788 789 012",
    email: "simona.p@email.com",
    dataNasterii: "1988-07-03",
    sex: "F",
    sursa: "Walk-in",
    tags: [],
    clientDin: "2023-07-15",
    lastVisit: "2024-12-20",
    totalVisits: 5,
    totalSpent: 750,
    preferredStaff: "Ana Ionescu",
    preferredServices: ["Tuns și coafat", "Tratament"],
    alergii: "",
    formuleColoristice: "",
    comunicarePreferinta: "Email",
    notes: "",
    gdprConsimtamant: true,
    gdprTimestamp: "2023-07-15T16:00:00",
    soldRestant: 50,
    puncteLoyalty: 75,
    history: [
      { id: "h12", date: "2024-12-20", services: ["Tuns și coafat"], staff: "Ana Ionescu", amount: 130, paymentMethod: "Cash" },
    ],
    photos: [],
  },
  {
    id: "7",
    prenume: "Raluca",
    nume: "Ionescu",
    phone: "0711 890 123",
    email: "raluca.i@email.com",
    dataNasterii: "1995-03-08",
    sex: "F",
    sursa: "Facebook",
    tags: ["Inactiv"],
    clientDin: "2022-01-20",
    lastVisit: "2024-06-15",
    totalVisits: 7,
    totalSpent: 980,
    preferredStaff: "Cristina Popa",
    preferredServices: ["Manichiură gel"],
    alergii: "Alergie la acrilice. Se folosesc doar produse gel.",
    formuleColoristice: "",
    comunicarePreferinta: "WhatsApp",
    notes: "Nu a mai venit din vară. De trimis reminder.",
    gdprConsimtamant: true,
    gdprTimestamp: "2022-01-20T13:00:00",
    soldRestant: 0,
    puncteLoyalty: 98,
    history: [
      { id: "h13", date: "2024-06-15", services: ["Manichiură gel"], staff: "Cristina Popa", amount: 120, paymentMethod: "Card" },
    ],
    photos: [],
  },
  {
    id: "8",
    prenume: "Mihaela",
    nume: "Cristea",
    phone: "0722 901 234",
    email: "mihaela.c@email.com",
    dataNasterii: "1979-12-18",
    sex: "F",
    sursa: "Recomandare",
    tags: ["VIP", "Frecvent"],
    clientDin: "2019-05-10",
    lastVisit: "2025-01-22",
    totalVisits: 31,
    totalSpent: 6200,
    preferredStaff: "Mara Stancu",
    preferredServices: ["Tratament facial", "Masaj", "Epilare"],
    alergii: "Reacție ușoară la ceară caldă. Se folosește doar ceară rece.",
    formuleColoristice: "",
    comunicarePreferinta: "SMS",
    notes: "Clientă foarte fidelă. Vine lunar fără greș.",
    gdprConsimtamant: true,
    gdprTimestamp: "2019-05-10T10:00:00",
    soldRestant: 0,
    puncteLoyalty: 620,
    history: [
      { id: "h14", date: "2025-01-22", services: ["Tratament facial", "Masaj relaxant"], staff: "Mara Stancu", amount: 350, paymentMethod: "Card" },
      { id: "h15", date: "2024-12-18", services: ["Epilare picioare", "Epilare axile"], staff: "Mara Stancu", amount: 180, paymentMethod: "Card" },
    ],
    photos: [],
  },
  {
    id: "9",
    prenume: "Gabriela",
    nume: "Rusu",
    phone: "0733 012 345",
    email: "gabriela.r@email.com",
    dataNasterii: "2001-06-30",
    sex: "F",
    sursa: "Instagram",
    tags: ["Nou"],
    clientDin: "2025-01-05",
    lastVisit: "2025-01-05",
    totalVisits: 1,
    totalSpent: 150,
    preferredStaff: "Diana Florea",
    preferredServices: ["Manichiură simplă"],
    alergii: "",
    formuleColoristice: "",
    comunicarePreferinta: "WhatsApp",
    notes: "Prima vizită, clientă tânără.",
    gdprConsimtamant: true,
    gdprTimestamp: "2025-01-05T14:00:00",
    soldRestant: 0,
    puncteLoyalty: 15,
    history: [
      { id: "h16", date: "2025-01-05", services: ["Manichiură simplă OPI"], staff: "Diana Florea", amount: 150, paymentMethod: "Cash" },
    ],
    photos: [],
  },
  {
    id: "10",
    prenume: "Teodora",
    nume: "Niculescu",
    phone: "0744 123 456",
    email: "teo.niculescu@email.com",
    dataNasterii: "1987-09-15",
    sex: "F",
    sursa: "Google",
    tags: ["Frecvent"],
    clientDin: "2021-11-08",
    lastVisit: "2025-01-12",
    totalVisits: 16,
    totalSpent: 3100,
    preferredStaff: "Ana Ionescu",
    preferredServices: ["Vopsit complet", "Tuns și coafat"],
    alergii: "",
    formuleColoristice: "Vopsit: Schwarzkopf IGORA 5.0 + 5.65 mix 1:1 + 20vol. Durată 40min. Revizuit Dec 2024.",
    comunicarePreferinta: "Email",
    notes: "Preferă să fie contactată pe email, nu telefonic.",
    gdprConsimtamant: true,
    gdprTimestamp: "2021-11-08T11:30:00",
    soldRestant: 0,
    puncteLoyalty: 310,
    history: [
      { id: "h17", date: "2025-01-12", services: ["Vopsit complet", "Tuns și coafat"], staff: "Ana Ionescu", amount: 320, paymentMethod: "Card" },
      { id: "h18", date: "2024-11-20", services: ["Vopsit rădăcini"], staff: "Ana Ionescu", amount: 200, paymentMethod: "Card" },
    ],
    photos: [],
  },
  {
    id: "11",
    prenume: "Florentina",
    nume: "Gheorghe",
    phone: "0766 234 567",
    email: "florentina.g@email.com",
    dataNasterii: "1975-02-14",
    sex: "F",
    sursa: "Recomandare",
    tags: ["Inactiv"],
    clientDin: "2020-04-22",
    lastVisit: "2024-04-10",
    totalVisits: 9,
    totalSpent: 1350,
    preferredStaff: "Mara Stancu",
    preferredServices: ["Tratament facial"],
    alergii: "",
    formuleColoristice: "",
    comunicarePreferinta: "SMS",
    notes: "Inactivă de aproape un an. Campanie de reactivare.",
    gdprConsimtamant: true,
    gdprTimestamp: "2020-04-22T09:00:00",
    soldRestant: 0,
    puncteLoyalty: 135,
    history: [
      { id: "h19", date: "2024-04-10", services: ["Tratament facial anti-aging"], staff: "Mara Stancu", amount: 250, paymentMethod: "Card" },
    ],
    photos: [],
  },
  {
    id: "12",
    prenume: "Valentina",
    nume: "Badea",
    phone: "0711 345 678",
    email: "valentina.b@email.com",
    dataNasterii: "1993-10-05",
    sex: "F",
    sursa: "Walk-in",
    tags: ["Frecvent", "VIP"],
    clientDin: "2022-08-30",
    lastVisit: "2025-01-19",
    totalVisits: 22,
    totalSpent: 3800,
    preferredStaff: "Cristina Popa",
    preferredServices: ["Manichiură gel", "Pedichiură", "Extensii gene"],
    alergii: "",
    formuleColoristice: "",
    comunicarePreferinta: "WhatsApp",
    notes: "Vine de obicei cu prietena Andreea Stan.",
    gdprConsimtamant: true,
    gdprTimestamp: "2022-08-30T12:00:00",
    soldRestant: 0,
    puncteLoyalty: 380,
    history: [
      { id: "h20", date: "2025-01-19", services: ["Manichiură gel", "Pedichiură"], staff: "Cristina Popa", amount: 230, paymentMethod: "Card" },
      { id: "h21", date: "2024-12-28", services: ["Extensii gene", "Manichiură gel"], staff: "Cristina Popa", amount: 320, paymentMethod: "Card" },
    ],
    photos: [
      { id: "p4", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", date: "2025-01-19", serviceTag: "Manichiură gel", type: "after" },
    ],
  },
]

export function getClientById(id: string): Client | undefined {
  return CLIENTS_DATA.find((c) => c.id === id)
}

export function getDaysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function getInitials(prenume: string, nume: string): string {
  return `${prenume[0] ?? ""}${nume[0] ?? ""}`.toUpperCase()
}

export const TAG_COLORS: Record<string, string> = {
  VIP: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Nou: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Inactiv: "bg-red-500/15 text-red-500 border-red-500/30",
  Frecvent: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Sensibil: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  Fidel: "bg-pink-500/15 text-pink-600 border-pink-500/30",
}
