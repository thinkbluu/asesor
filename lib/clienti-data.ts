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

