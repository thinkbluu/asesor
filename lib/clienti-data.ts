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
  whatsappNumber?: string
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
