// Loyalty program — types, configuration, helpers, and mock history.
// All mutations happen in-memory; wire to a real backend in production.

export type LoyaltyTxnType = "earned" | "redeemed" | "expired" | "bonus" | "adjustment"

export interface LoyaltyTransaction {
  id: string
  clientId: string
  type: LoyaltyTxnType
  points: number // positive for earned/bonus, negative for redeemed/expired
  reason: string // Romanian human-readable label
  date: string // ISO date
  appointmentId?: string
  rewardId?: string
}

/** Bonus multipliers / one-time rewards applied on special events. */
export interface LoyaltyBonusRules {
  birthdayEnabled: boolean
  birthdayMultiplier: number // e.g. 2 = double points during birthday week
  birthdayWindowDays: number // +/- days around birthday when bonus applies

  referralEnabled: boolean
  referralPoints: number // awarded to referrer on successful first visit of referee

  firstVisitEnabled: boolean
  firstVisitPoints: number // flat one-time welcome bonus
}

/** A percentage discount tier redeemable at checkout. */
export interface RedemptionTier {
  id: string
  points: number // cost
  discountPercent: number // e.g. 10, 20
  label: string // Romanian
}

/** A concrete reward that can be redeemed (free service, gift, product). */
export interface LoyaltyReward {
  id: string
  name: string
  points: number
  description?: string
  category: "service" | "product" | "voucher"
  active: boolean
}

export interface LoyaltyConfig {
  enabled: boolean
  /** RON spent to earn 1 point. e.g. 10 → 1 point per 10 Lei spent. */
  ronPerPoint: number
  /** Points expire after this many months (0 = never). */
  expirationMonths: number
  bonus: LoyaltyBonusRules
  tiers: RedemptionTier[]
  rewards: LoyaltyReward[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: true,
  ronPerPoint: 10,
  expirationMonths: 12,
  bonus: {
    birthdayEnabled: true,
    birthdayMultiplier: 2,
    birthdayWindowDays: 7,
    referralEnabled: true,
    referralPoints: 100,
    firstVisitEnabled: true,
    firstVisitPoints: 50,
  },
  tiers: [
    { id: "t1", points: 100, discountPercent: 10, label: "10% reducere" },
    { id: "t2", points: 250, discountPercent: 20, label: "20% reducere" },
    { id: "t3", points: 500, discountPercent: 100, label: "Serviciu gratuit (până la 150 Lei)" },
  ],
  rewards: [
    { id: "r1", name: "Mască de păr profesională", points: 150, category: "product", active: true, description: "Tratament cadou la următoarea vizită" },
    { id: "r2", name: "Manichiură clasică gratuită", points: 200, category: "service", active: true },
    { id: "r3", name: "Voucher 50 Lei", points: 300, category: "voucher", active: true, description: "Aplicabil la orice serviciu" },
    { id: "r4", name: "Tuns și coafat gratuit", points: 400, category: "service", active: true },
  ],
}

// ──────────────────────────────────────────────────────────────────────────────
// Tier levels (VIP ladder based on lifetime points earned — separate from balance)
// ──────────────────────────────────────────────────────────────────────────────

export interface LoyaltyLevel {
  id: string
  name: string
  minLifetimePoints: number
  perksRo: string
}

export const LOYALTY_LEVELS: LoyaltyLevel[] = [
  { id: "bronze", name: "Bronz", minLifetimePoints: 0, perksRo: "Acumulează puncte la fiecare vizită" },
  { id: "silver", name: "Argint", minLifetimePoints: 300, perksRo: "+10% puncte bonus la fiecare programare" },
  { id: "gold", name: "Aur", minLifetimePoints: 800, perksRo: "Acces prioritar la programări + reducere 15% la produse" },
  { id: "platinum", name: "Platină", minLifetimePoints: 2000, perksRo: "Serviciu VIP + cadou aniversar anual" },
]

export function getLevelForLifetimePoints(lifetime: number): LoyaltyLevel {
  return LOYALTY_LEVELS.reduce((acc, lvl) =>
    lifetime >= lvl.minLifetimePoints ? lvl : acc,
    LOYALTY_LEVELS[0]
  )
}

export function getNextLevel(current: LoyaltyLevel): LoyaltyLevel | null {
  const idx = LOYALTY_LEVELS.findIndex(l => l.id === current.id)
  return idx >= 0 && idx < LOYALTY_LEVELS.length - 1 ? LOYALTY_LEVELS[idx + 1] : null
}

// ──────────────────────────────────────────────────────────────────────────────
// Calculators
// ──────────────────────────────────────────────────────────────────────────────

/** How many points a spend of `amountRon` earns (base only, no bonuses). */
export function calculatePointsForAmount(amountRon: number, cfg: LoyaltyConfig = DEFAULT_LOYALTY_CONFIG): number {
  if (!cfg.enabled || cfg.ronPerPoint <= 0) return 0
  return Math.floor(amountRon / cfg.ronPerPoint)
}

/** Apply birthday multiplier if the visit date is within the birthday window. */
export function calculatePointsWithBonuses(params: {
  amountRon: number
  visitDate: string // ISO
  clientBirthday?: string // ISO "YYYY-MM-DD"
  isFirstVisit?: boolean
  cfg?: LoyaltyConfig
}): { basePoints: number; bonusPoints: number; total: number; reasons: string[] } {
  const cfg = params.cfg ?? DEFAULT_LOYALTY_CONFIG
  const reasons: string[] = []
  const basePoints = calculatePointsForAmount(params.amountRon, cfg)
  if (!cfg.enabled) return { basePoints: 0, bonusPoints: 0, total: 0, reasons: [] }

  let bonusPoints = 0

  if (cfg.bonus.birthdayEnabled && params.clientBirthday) {
    const visit = new Date(params.visitDate)
    const bday = new Date(params.clientBirthday)
    const thisYearBday = new Date(visit.getFullYear(), bday.getMonth(), bday.getDate())
    const diffDays = Math.abs((visit.getTime() - thisYearBday.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= cfg.bonus.birthdayWindowDays) {
      const extra = basePoints * (cfg.bonus.birthdayMultiplier - 1)
      bonusPoints += extra
      if (extra > 0) reasons.push(`Bonus aniversar x${cfg.bonus.birthdayMultiplier}`)
    }
  }

  if (cfg.bonus.firstVisitEnabled && params.isFirstVisit) {
    bonusPoints += cfg.bonus.firstVisitPoints
    reasons.push(`Bonus primă vizită +${cfg.bonus.firstVisitPoints}`)
  }

  return { basePoints, bonusPoints, total: basePoints + bonusPoints, reasons }
}

// ──────────────────────────────────────────────────────────────────────────────
// Mock history per client
// ──────────────────────────────────────────────────────────────────────────────

export const MOCK_LOYALTY_HISTORY: Record<string, LoyaltyTransaction[]> = {
  "1": [
    { id: "lt_1a", clientId: "1", type: "earned", points: 28, reason: "Programare — Vopsit rădăcini + Tuns", date: "2025-01-20", appointmentId: "a1" },
    { id: "lt_1b", clientId: "1", type: "bonus", points: 50, reason: "Aniversare — dublare puncte", date: "2024-04-12" },
    { id: "lt_1c", clientId: "1", type: "redeemed", points: -100, reason: "Reducere 10% — Vopsit complet", date: "2024-11-05", rewardId: "t1" },
    { id: "lt_1d", clientId: "1", type: "earned", points: 45, reason: "Programare — Vopsit complet + Keratină", date: "2024-11-05", appointmentId: "a-past-1" },
    { id: "lt_1e", clientId: "1", type: "earned", points: 12, reason: "Programare — Tuns și coafat", date: "2024-09-18" },
    { id: "lt_1f", clientId: "1", type: "bonus", points: 50, reason: "Bonus primă vizită", date: "2021-03-15" },
  ],
  "2": [
    { id: "lt_2a", clientId: "2", type: "earned", points: 20, reason: "Programare — Manichiură + Pedichiură", date: "2025-01-18" },
    { id: "lt_2b", clientId: "2", type: "earned", points: 12, reason: "Programare — Manichiură gel", date: "2024-12-20" },
    { id: "lt_2c", clientId: "2", type: "redeemed", points: -100, reason: "Reducere 10%", date: "2024-10-14", rewardId: "t1" },
    { id: "lt_2d", clientId: "2", type: "bonus", points: 50, reason: "Bonus primă vizită", date: "2022-06-10" },
  ],
}

/** Get merged, date-sorted transactions for a client. Falls back to empty array. */
export function getLoyaltyHistory(clientId: string): LoyaltyTransaction[] {
  const raw = MOCK_LOYALTY_HISTORY[clientId] ?? []
  return [...raw].sort((a, b) => b.date.localeCompare(a.date))
}

/** Derive lifetime (earned + bonus) from transactions. */
export function getLifetimePoints(clientId: string): number {
  return getLoyaltyHistory(clientId)
    .filter(t => t.type === "earned" || t.type === "bonus")
    .reduce((s, t) => s + t.points, 0)
}

// ──────────────────────────────────────────────────────────────────────────────
// API hooks — TODO: wire to backend
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Award points for a completed appointment.
 * TODO: persist to DB + trigger any side effects (push notifications, etc.).
 */
export async function awardPointsForAppointment(params: {
  clientId: string
  appointmentId: string
  amountRon: number
  visitDate: string
  clientBirthday?: string
  isFirstVisit?: boolean
  cfg?: LoyaltyConfig
}): Promise<{ awarded: number; txn: LoyaltyTransaction }> {
  const calc = calculatePointsWithBonuses(params)
  const txn: LoyaltyTransaction = {
    id: `lt_${Date.now()}`,
    clientId: params.clientId,
    type: "earned",
    points: calc.total,
    reason: calc.reasons.length > 0
      ? `Programare + ${calc.reasons.join(", ")}`
      : "Programare finalizată",
    date: params.visitDate,
    appointmentId: params.appointmentId,
  }
  // TODO: INSERT INTO loyalty_transactions …
  return { awarded: calc.total, txn }
}

/**
 * Redeem a tier discount or a catalog reward.
 * TODO: persist + decrement client balance atomically.
 */
export async function redeemPoints(params: {
  clientId: string
  points: number
  reason: string
  rewardId?: string
}): Promise<LoyaltyTransaction> {
  const txn: LoyaltyTransaction = {
    id: `lt_${Date.now()}`,
    clientId: params.clientId,
    type: "redeemed",
    points: -Math.abs(params.points),
    reason: params.reason,
    date: new Date().toISOString().slice(0, 10),
    rewardId: params.rewardId,
  }
  // TODO: INSERT INTO loyalty_transactions …
  return txn
}

// ──────────────────────────────────────────────────────────────────────────────
// Formatting
// ──────────────────────────────────────────────────────────────────────────────

export function formatPoints(n: number): string {
  const abs = Math.abs(n).toLocaleString("ro-RO")
  return `${n < 0 ? "−" : ""}${abs} pct`
}
