export type PaymentMethod = "numerar" | "card" | "transfer"
export type TransactionStatus = "incasat" | "rambursata" | "in_asteptare"
export type ExpenseCategory = "chirie" | "salarii" | "produse" | "marketing" | "utilitati" | "echipamente" | "altele"
export type ExpenseFrequency = "unica" | "lunar" | "saptamanal"

export interface Transaction {
  id: string
  date: string
  time: string
  clientName: string
  clientId: string
  services: string[]
  staffName: string
  staffId: string
  amount: number
  tip: number
  discount: number
  paymentMethod: PaymentMethod
  status: TransactionStatus
  notes: string
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  receipt?: string
  frequency: ExpenseFrequency
  notes: string
}

export interface DayClose {
  id: string
  date: string
  numarIncasat: number
  cardIncasat: number
  transferIncasat: number
  tips: number
  discounts: number
  expectedCash: number
  actualCash: number
  notes: string
  closedBy: string
  closedAt: string
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  numerar: "Numerar",
  card: "Card",
  transfer: "Transfer",
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  chirie: "Chirie",
  salarii: "Salarii",
  produse: "Produse",
  marketing: "Marketing",
  utilitati: "Utilități",
  echipamente: "Echipamente",
  altele: "Altele",
}

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  chirie: "#ef4444",
  salarii: "#f97316",
  produse: "#eab308",
  marketing: "#8b5cf6",
  utilitati: "#06b6d4",
  echipamente: "#ec4899",
  altele: "#6b7280",
}

export function formatRON(amount: number): string {
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " Lei"
}

export function formatRONShort(amount: number): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(amount / 1000) + "k Lei"
  }
  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(amount) + " Lei"
}
