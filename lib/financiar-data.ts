import { APPOINTMENTS_DATA } from "@/lib/programari-data"
import { STAFF_DATA } from "@/lib/echipa-data"

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

// Generate transactions from appointments data + extras
const paymentMethods: PaymentMethod[] = ["numerar", "card", "card", "transfer", "numerar", "card"]

export const TRANSACTIONS: Transaction[] = [
  ...APPOINTMENTS_DATA.filter(a => a.status === "finalizat" || a.status === "in_desfasurare").map((a, i) => ({
    id: `tx-${a.id}`,
    date: a.date,
    time: a.startTime,
    clientName: a.clientName,
    clientId: a.clientId,
    services: a.services.map(s => s.name),
    staffName: a.staffName,
    staffId: a.staffId,
    amount: a.discount > 0
      ? a.discountType === "procent"
        ? Math.round(a.totalPrice * (1 - a.discount / 100))
        : a.totalPrice - a.discount
      : a.totalPrice,
    tip: i % 4 === 0 ? 20 : i % 4 === 1 ? 30 : 0,
    discount: a.discount > 0
      ? a.discountType === "procent"
        ? Math.round(a.totalPrice * (a.discount / 100))
        : a.discount
      : 0,
    paymentMethod: paymentMethods[i % paymentMethods.length],
    status: "incasat" as TransactionStatus,
    notes: a.notes,
  })),
  // Extra historical transactions for richer charts
  { id: "tx-h1",  date: prevMonth(1),  time: "10:00", clientName: "Maria Popescu",    clientId: "1",  services: ["Vopsit complet"],          staffName: "Ana Marinescu",  staffId: "1", amount: 200,  tip: 20, discount: 0,  paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h2",  date: prevMonth(3),  time: "11:30", clientName: "Elena Dumitrescu", clientId: "2",  services: ["Manichiură gel"],           staffName: "Cristina Voicu", staffId: "2", amount: 120,  tip: 0,  discount: 0,  paymentMethod: "numerar",  status: "incasat",    notes: "" },
  { id: "tx-h3",  date: prevMonth(5),  time: "14:00", clientName: "Ioana Marin",      clientId: "3",  services: ["Tratament facial hidratant"],staffName: "Mara Ene",       staffId: "3", amount: 200,  tip: 30, discount: 0,  paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h4",  date: prevMonth(7),  time: "09:30", clientName: "Andreea Stan",     clientId: "4",  services: ["Extensii gene volum"],      staffName: "Ioana Preda",    staffId: "5", amount: 350,  tip: 0,  discount: 0,  paymentMethod: "transfer", status: "incasat",    notes: "" },
  { id: "tx-h5",  date: prevMonth(8),  time: "15:00", clientName: "Laura Ion",        clientId: "5",  services: ["Balayage / Highlights"],    staffName: "Ana Marinescu",  staffId: "1", amount: 550,  tip: 50, discount: 0,  paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h6",  date: prevMonth(10), time: "12:00", clientName: "Simona Popa",      clientId: "6",  services: ["Manichiură gel", "Pedichiură"], staffName: "Cristina Voicu", staffId: "2", amount: 200, tip: 0, discount: 0, paymentMethod: "numerar", status: "incasat",    notes: "" },
  { id: "tx-h7",  date: prevMonth(12), time: "10:30", clientName: "Raluca Ionescu",   clientId: "7",  services: ["Tuns și coafat"],           staffName: "Ana Marinescu",  staffId: "1", amount: 120,  tip: 10, discount: 0,  paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h8",  date: prevMonth(14), time: "11:00", clientName: "Mihaela Cristea",  clientId: "8",  services: ["Masaj relaxant 90min"],     staffName: "Radu Florescu",  staffId: "6", amount: 280,  tip: 30, discount: 0,  paymentMethod: "numerar",  status: "incasat",    notes: "" },
  { id: "tx-h9",  date: prevMonth(15), time: "13:00", clientName: "Gabriela Rusu",    clientId: "9",  services: ["Extensii gene clasic"],     staffName: "Ioana Preda",    staffId: "5", amount: 250,  tip: 0,  discount: 0,  paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h10", date: prevMonth(17), time: "14:30", clientName: "Teodora Niculescu",clientId: "10", services: ["Vopsit rădăcini"],          staffName: "Ana Marinescu",  staffId: "1", amount: 144,  tip: 0,  discount: 16, paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h11", date: prevMonth(18), time: "16:00", clientName: "Maria Popescu",    clientId: "1",  services: ["Coafat ocazie"],            staffName: "Ana Marinescu",  staffId: "1", amount: 180,  tip: 20, discount: 0,  paymentMethod: "numerar",  status: "incasat",    notes: "" },
  { id: "tx-h12", date: prevMonth(20), time: "10:00", clientName: "Elena Dumitrescu", clientId: "2",  services: ["Manichiură simplă"],        staffName: "Cristina Voicu", staffId: "2", amount: 70,   tip: 0,  discount: 0,  paymentMethod: "numerar",  status: "incasat",    notes: "" },
  { id: "tx-h13", date: prevMonth(22), time: "11:30", clientName: "Andreea Stan",     clientId: "4",  services: ["Masaj facial", "Epilare față"], staffName: "Mara Ene",   staffId: "3", amount: 210,  tip: 20, discount: 0,  paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h14", date: prevMonth(23), time: "14:00", clientName: "Laura Ion",        clientId: "5",  services: ["Tratament keratină"],       staffName: "Ana Marinescu",  staffId: "1", amount: 480,  tip: 0,  discount: 0,  paymentMethod: "transfer", status: "incasat",    notes: "" },
  { id: "tx-h15", date: prevMonth(25), time: "09:00", clientName: "Simona Popa",      clientId: "6",  services: ["Manichiură gel"],           staffName: "Cristina Voicu", staffId: "2", amount: 120,  tip: 10, discount: 0,  paymentMethod: "card",     status: "incasat",    notes: "" },
  { id: "tx-h16", date: prevMonth(27), time: "15:30", clientName: "Mihaela Cristea",  clientId: "8",  services: ["Masaj sportiv"],            staffName: "Radu Florescu",  staffId: "6", amount: 320,  tip: 30, discount: 0,  paymentMethod: "numerar",  status: "incasat",    notes: "" },
  { id: "tx-r1",  date: prevMonth(2),  time: "10:00", clientName: "Maria Popescu",    clientId: "1",  services: ["Vopsit rădăcini"],          staffName: "Ana Marinescu",  staffId: "1", amount: 80,   tip: 0,  discount: 0,  paymentMethod: "card",     status: "rambursata", notes: "Clientă nemulțumită de rezultat" },
]

export const EXPENSES: Expense[] = [
  { id: "e1",  date: thisMonth(5),  category: "chirie",      description: "Chirie spațiu comercial - Ianuarie",      amount: 4500, frequency: "lunar",     notes: "" },
  { id: "e2",  date: thisMonth(6),  category: "salarii",     description: "Salarii angajați - Ianuarie",              amount: 18000, frequency: "lunar",    notes: "6 angajați" },
  { id: "e3",  date: thisMonth(8),  category: "produse",     description: "Comandă L'Oréal Professional",             amount: 3200, frequency: "unica",     notes: "Factură #2025-0089" },
  { id: "e4",  date: thisMonth(10), category: "utilitati",   description: "Factură electricitate + gaz",              amount: 1100, frequency: "lunar",     notes: "" },
  { id: "e5",  date: thisMonth(12), category: "marketing",   description: "Campanie Facebook + Instagram Ads",        amount: 800,  frequency: "lunar",     notes: "" },
  { id: "e6",  date: thisMonth(15), category: "produse",     description: "Produse retail Wella + Schwarzkopf",       amount: 1800, frequency: "unica",     notes: "" },
  { id: "e7",  date: thisMonth(18), category: "echipamente", description: "Reparație uscător profesional Dyson",      amount: 350,  frequency: "unica",     notes: "" },
  { id: "e8",  date: thisMonth(20), category: "altele",      description: "Consumabile (prosoape, folii, vată)",      amount: 280,  frequency: "lunar",     notes: "" },
  { id: "e9",  date: prevMonth(5),  category: "chirie",      description: "Chirie spațiu comercial - Decembrie",      amount: 4500, frequency: "lunar",     notes: "" },
  { id: "e10", date: prevMonth(6),  category: "salarii",     description: "Salarii angajați - Decembrie",             amount: 18500, frequency: "lunar",    notes: "Bonus sărbători inclus" },
  { id: "e11", date: prevMonth(10), category: "produse",     description: "Comandă Kerastase + Redken",               amount: 2900, frequency: "unica",     notes: "" },
  { id: "e12", date: prevMonth(15), category: "marketing",   description: "Campanie Social Media Decembrie",          amount: 1200, frequency: "lunar",     notes: "Campanie Crăciun" },
  { id: "e13", date: prevMonth(20), category: "echipamente", description: "Sterilizator UV nou",                      amount: 650,  frequency: "unica",     notes: "" },
  { id: "e14", date: prevMonth(22), category: "utilitati",   description: "Factură apă + internet",                   amount: 420,  frequency: "lunar",     notes: "" },
]

export const DAY_CLOSES: DayClose[] = [
  {
    id: "dc1", date: prevDay(1),
    numarIncasat: 850, cardIncasat: 1420, transferIncasat: 280, tips: 80, discounts: 60,
    expectedCash: 850, actualCash: 860, notes: "Zi bună", closedBy: "Ana Marinescu", closedAt: "19:45",
  },
  {
    id: "dc2", date: prevDay(2),
    numarIncasat: 620, cardIncasat: 1850, transferIncasat: 0, tips: 50, discounts: 30,
    expectedCash: 620, actualCash: 595, notes: "Diferență -25 Lei, verificat casă", closedBy: "Ana Marinescu", closedAt: "19:30",
  },
  {
    id: "dc3", date: prevDay(3),
    numarIncasat: 1100, cardIncasat: 980, transferIncasat: 350, tips: 90, discounts: 0,
    expectedCash: 1100, actualCash: 1100, notes: "", closedBy: "Ana Marinescu", closedAt: "20:00",
  },
]

// Helpers
function thisMonth(day: number): string {
  const d = new Date()
  d.setDate(day)
  return d.toISOString().slice(0, 10)
}

function prevMonth(day: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  d.setDate(day)
  return d.toISOString().slice(0, 10)
}

function prevDay(n: number): string {
  const d = new Date(Date.now() - n * 86400000)
  return d.toISOString().slice(0, 10)
}

// Chart data generators
export function getRevenueByDay(daysBack = 30): { date: string; venituri: number; prevVenituri: number }[] {
  const result = []
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const pd = new Date(Date.now() - (i + daysBack) * 86400000).toISOString().slice(0, 10)
    const dayTx = TRANSACTIONS.filter(t => t.date === d && t.status === "incasat")
    const prevDayTx = TRANSACTIONS.filter(t => t.date === pd && t.status === "incasat")
    result.push({
      date: new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
      venituri: dayTx.reduce((s, t) => s + t.amount + t.tip, 0) || Math.floor(Math.random() * 2000 + 500),
      prevVenituri: prevDayTx.reduce((s, t) => s + t.amount + t.tip, 0) || Math.floor(Math.random() * 1800 + 400),
    })
  }
  return result
}

export function getRevenueByCategory(): { name: string; value: number; color: string }[] {
  const categories = [
    { name: "Coafor",      color: "#10b981", keywords: ["Tuns", "Vopsit", "Balayage", "Keratină", "Coafat", "par"] },
    { name: "Manichiură",  color: "#2563eb", keywords: ["Manichiur", "Pedichiur", "Nail"] },
    { name: "Cosmetică",   color: "#8b5cf6", keywords: ["Facial", "Epilare", "față"] },
    { name: "Gene",        color: "#f59e0b", keywords: ["Gene", "Sprâncene"] },
    { name: "Masaj",       color: "#ec4899", keywords: ["Masaj", "Relaxant", "Sportiv"] },
  ]
  return categories.map(cat => ({
    name: cat.name,
    color: cat.color,
    value: TRANSACTIONS
      .filter(t => t.status === "incasat" && t.services.some(s => cat.keywords.some(k => s.includes(k))))
      .reduce((sum, t) => sum + t.amount, 0) || Math.floor(Math.random() * 8000 + 3000),
  }))
}

export function getRevenueByStaff(): { name: string; venituri: number; comision: number }[] {
  return STAFF_DATA.filter(s => s.status === "activ").map(s => ({
    name: s.firstName,
    venituri: TRANSACTIONS.filter(t => t.staffId === s.id && t.status === "incasat").reduce((sum, t) => sum + t.amount, 0) || s.stats.revenueThisMonth,
    comision: Math.round((TRANSACTIONS.filter(t => t.staffId === s.id && t.status === "incasat").reduce((sum, t) => sum + t.amount, 0) || s.stats.revenueThisMonth) * (s.commissionRate / 100)),
  })).sort((a, b) => b.venituri - a.venituri)
}

export function getPaymentMethodSplit(): { name: string; value: number; color: string }[] {
  const tx = TRANSACTIONS.filter(t => t.status === "incasat")
  const total = tx.reduce((s, t) => s + t.amount, 0) || 1
  const methods = {
    numerar: { name: "Numerar", color: "#10b981" },
    card:    { name: "Card",    color: "#2563eb" },
    transfer:{ name: "Transfer",color: "#8b5cf6" },
  }
  return (Object.entries(methods) as [PaymentMethod, { name: string; color: string }][]).map(([key, meta]) => ({
    name: meta.name,
    color: meta.color,
    value: tx.filter(t => t.paymentMethod === key).reduce((s, t) => s + t.amount, 0) || Math.floor(total * (key === "card" ? 0.55 : key === "numerar" ? 0.33 : 0.12)),
  }))
}

export function getMonthlyComparison(): { month: string; venituri: number; cheltuieli: number; profit: number }[] {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleDateString("ro-RO", { month: "short", year: "2-digit" })
    const venituri = Math.floor(Math.random() * 15000 + 35000)
    const cheltuieli = Math.floor(Math.random() * 5000 + 25000)
    months.push({ month: label, venituri, cheltuieli, profit: venituri - cheltuieli })
  }
  return months
}

export function getServiceRanking(): { name: string; revenue: number; count: number; avgPrice: number }[] {
  return [
    { name: "Balayage / Highlights",    revenue: 12650, count: 23, avgPrice: 550 },
    { name: "Tratament keratină",       revenue: 9600,  count: 20, avgPrice: 480 },
    { name: "Extensii gene volum",      revenue: 8750,  count: 25, avgPrice: 350 },
    { name: "Masaj sportiv",            revenue: 6400,  count: 20, avgPrice: 320 },
    { name: "Coafat ocazie",            revenue: 5400,  count: 30, avgPrice: 180 },
    { name: "Vopsit complet",           revenue: 5000,  count: 25, avgPrice: 200 },
    { name: "Masaj relaxant 90min",     revenue: 4480,  count: 16, avgPrice: 280 },
    { name: "Vopsit rădăcini",          revenue: 4160,  count: 26, avgPrice: 160 },
    { name: "Tratament facial hidratant",revenue: 4000, count: 20, avgPrice: 200 },
    { name: "Extensii gene clasic",     revenue: 3750,  count: 15, avgPrice: 250 },
  ]
}

export function getTopClients(): { name: string; totalSpent: number; visits: number; avgSpend: number; lastVisit: string }[] {
  return [
    { name: "Laura Ion",          totalSpent: 4820, visits: 12, avgSpend: 402, lastVisit: "2025-01-20" },
    { name: "Maria Popescu",      totalSpent: 3650, visits: 18, avgSpend: 203, lastVisit: "2025-01-22" },
    { name: "Mihaela Cristea",    totalSpent: 3100, visits: 9,  avgSpend: 344, lastVisit: "2025-01-18" },
    { name: "Teodora Niculescu",  totalSpent: 2940, visits: 14, avgSpend: 210, lastVisit: "2025-01-15" },
    { name: "Andreea Stan",       totalSpent: 2800, visits: 8,  avgSpend: 350, lastVisit: "2025-01-20" },
    { name: "Valentina Badea",    totalSpent: 2400, visits: 16, avgSpend: 150, lastVisit: "2025-01-19" },
    { name: "Gabriela Rusu",      totalSpent: 2250, visits: 9,  avgSpend: 250, lastVisit: "2025-01-18" },
    { name: "Elena Dumitrescu",   totalSpent: 2100, visits: 14, avgSpend: 150, lastVisit: "2025-01-16" },
  ]
}

export function getTodaySummary() {
  const today = new Date().toISOString().slice(0, 10)
  const todayTx = TRANSACTIONS.filter(t => t.date === today && t.status === "incasat")
  return {
    numarIncasat: todayTx.filter(t => t.paymentMethod === "numerar").reduce((s, t) => s + t.amount, 0),
    cardIncasat:  todayTx.filter(t => t.paymentMethod === "card").reduce((s, t) => s + t.amount, 0),
    transferIncasat: todayTx.filter(t => t.paymentMethod === "transfer").reduce((s, t) => s + t.amount, 0),
    tips: todayTx.reduce((s, t) => s + t.tip, 0),
    discounts: todayTx.reduce((s, t) => s + t.discount, 0),
    totalRevenue: todayTx.reduce((s, t) => s + t.amount + t.tip, 0),
    transactionCount: todayTx.length,
  }
}
