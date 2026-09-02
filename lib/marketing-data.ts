export type CampaignType = "SMS" | "Email"
export type CampaignStatus = "Draft" | "Programat" | "Trimis" | "Activ"

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  audience: string
  audienceCount: number
  sentDate: string | null
  sent: number
  openRate: number
  clickRate: number
  conversions: number
  revenue: number
}

export interface Automation {
  id: string
  name: string
  description: string
  trigger: string
  channel: CampaignType
  timing: string
  enabled: boolean
  sent: number
  openRate: number
  clickRate: number
  template: string
}

export interface Promotion {
  id: string
  code: string
  type: "procent" | "fix"
  value: number
  validFrom: string
  validTo: string
  maxUses: number
  usedCount: number
  services: string[]
  revenue: number
  active: boolean
}

export const AUDIENCE_SEGMENTS = [
  { id: "all", label: "Toți clienții", count: 312 },
  { id: "new30", label: "Clienți noi (30 zile)", count: 22 },
  { id: "vip", label: "VIP", count: 38 },
  { id: "inactive60", label: "Inactivi (60+ zile fără vizită)", count: 48 },
  { id: "birthday", label: "Zi naștere luna aceasta", count: 14 },
  { id: "custom", label: "Segment personalizat", count: null },
]

export const EMAIL_TEMPLATES = [
  { id: "birthday", label: "Zi de naștere" },
  { id: "reengagement", label: "Re-engagement" },
  { id: "promo", label: "Promoție" },
  { id: "seasonal", label: "Sezonieră" },
  { id: "newservice", label: "Serviciu nou" },
]
