export type LoyaltyTxnType = "earned" | "redeemed" | "expired" | "bonus" | "adjustment"

export interface LoyaltyTransaction {
  id: string
  clientId: string
  type: LoyaltyTxnType
  points: number
  reason: string
  date: string
  appointmentId?: string
  rewardId?: string
}

export interface LoyaltyBonusRules {
  birthdayEnabled: boolean
  birthdayMultiplier: number
  birthdayWindowDays: number
  referralEnabled: boolean
  referralPoints: number
  firstVisitEnabled: boolean
  firstVisitPoints: number
}

export interface RedemptionTier {
  id: string
  points: number
  discountPercent: number
  label: string
}

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
  ronPerPoint: number
  expirationMonths: number
  bonus: LoyaltyBonusRules
  tiers: RedemptionTier[]
  rewards: LoyaltyReward[]
}

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
  return LOYALTY_LEVELS.reduce(
    (acc, level) => lifetime >= level.minLifetimePoints ? level : acc,
    LOYALTY_LEVELS[0],
  )
}

export function getNextLevel(current: LoyaltyLevel): LoyaltyLevel | null {
  const index = LOYALTY_LEVELS.findIndex((level) => level.id === current.id)
  return index >= 0 && index < LOYALTY_LEVELS.length - 1 ? LOYALTY_LEVELS[index + 1] : null
}

export function calculatePointsForAmount(
  amountRon: number,
  config: LoyaltyConfig = DEFAULT_LOYALTY_CONFIG,
): number {
  if (!config.enabled || config.ronPerPoint <= 0) return 0
  return Math.floor(amountRon / config.ronPerPoint)
}

export function calculatePointsWithBonuses(params: {
  amountRon: number
  visitDate: string
  clientBirthday?: string
  isFirstVisit?: boolean
  cfg?: LoyaltyConfig
}): { basePoints: number; bonusPoints: number; total: number; reasons: string[] } {
  const config = params.cfg ?? DEFAULT_LOYALTY_CONFIG
  const reasons: string[] = []
  const basePoints = calculatePointsForAmount(params.amountRon, config)
  if (!config.enabled) return { basePoints: 0, bonusPoints: 0, total: 0, reasons: [] }

  let bonusPoints = 0
  if (config.bonus.birthdayEnabled && params.clientBirthday) {
    const visit = new Date(params.visitDate)
    const birthday = new Date(params.clientBirthday)
    const thisYearBirthday = new Date(visit.getFullYear(), birthday.getMonth(), birthday.getDate())
    const diffDays = Math.abs((visit.getTime() - thisYearBirthday.getTime()) / 86400000)
    if (diffDays <= config.bonus.birthdayWindowDays) {
      const extra = basePoints * (config.bonus.birthdayMultiplier - 1)
      bonusPoints += extra
      if (extra > 0) reasons.push(`Bonus aniversar x${config.bonus.birthdayMultiplier}`)
    }
  }

  if (config.bonus.firstVisitEnabled && params.isFirstVisit) {
    bonusPoints += config.bonus.firstVisitPoints
    reasons.push(`Bonus primă vizită +${config.bonus.firstVisitPoints}`)
  }

  return { basePoints, bonusPoints, total: basePoints + bonusPoints, reasons }
}

export function formatPoints(value: number): string {
  const absolute = Math.abs(value).toLocaleString("ro-RO")
  return `${value < 0 ? "−" : ""}${absolute} pct`
}
