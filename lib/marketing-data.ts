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

export const CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    name: "Re-engagement Ianuarie",
    type: "SMS",
    status: "Trimis",
    audience: "Clienți inactivi 60+ zile",
    audienceCount: 48,
    sentDate: "2025-01-10",
    sent: 48,
    openRate: 78,
    clickRate: 24,
    conversions: 11,
    revenue: 2200,
  },
  {
    id: "c2",
    name: "Newsletter Nou An",
    type: "Email",
    status: "Trimis",
    audience: "Toți clienții",
    audienceCount: 312,
    sentDate: "2025-01-02",
    sent: 312,
    openRate: 42,
    clickRate: 18,
    conversions: 34,
    revenue: 4800,
  },
  {
    id: "c3",
    name: "Promo Ziua Îndrăgostiților",
    type: "Email",
    status: "Programat",
    audience: "Clienți VIP + Frecvenți",
    audienceCount: 89,
    sentDate: "2025-02-10",
    sent: 0,
    openRate: 0,
    clickRate: 0,
    conversions: 0,
    revenue: 0,
  },
  {
    id: "c4",
    name: "Ofertă Manichiură Martie",
    type: "SMS",
    status: "Draft",
    audience: "Clienți noi (30 zile)",
    audienceCount: 22,
    sentDate: null,
    sent: 0,
    openRate: 0,
    clickRate: 0,
    conversions: 0,
    revenue: 0,
  },
  {
    id: "c5",
    name: "Servicii Noi — Epilare Laser",
    type: "Email",
    status: "Trimis",
    audience: "Toți clienții",
    audienceCount: 298,
    sentDate: "2024-12-15",
    sent: 298,
    openRate: 38,
    clickRate: 15,
    conversions: 27,
    revenue: 3600,
  },
  {
    id: "c6",
    name: "Black Friday Beauty",
    type: "SMS",
    status: "Trimis",
    audience: "Toți clienții",
    audienceCount: 305,
    sentDate: "2024-11-29",
    sent: 305,
    openRate: 84,
    clickRate: 41,
    conversions: 62,
    revenue: 9300,
  },
]

export const AUTOMATIONS: Automation[] = [
  {
    id: "a1",
    name: "Confirmare programare",
    description: "Trimis instant la crearea programării",
    trigger: "Programare creată",
    channel: "SMS",
    timing: "Instant",
    enabled: true,
    sent: 1247,
    openRate: 91,
    clickRate: 34,
    template: "Salut {{nume_client}}! Programarea ta la {{salon}} a fost confirmată pentru {{data}} la ora {{ora}}. Te așteptăm! Link anulare: {{link_anulare}}",
  },
  {
    id: "a2",
    name: "Reminder 24h",
    description: "Reminder automat cu 24h înainte de programare",
    trigger: "24h înainte de programare",
    channel: "SMS",
    timing: "24h înainte",
    enabled: true,
    sent: 1189,
    openRate: 88,
    clickRate: 12,
    template: "Reminder {{nume_client}}: mâine la ora {{ora}} te așteptăm la {{salon}} pentru {{serviciu}}. Confirmi? Răspunde DA sau sună la {{telefon_salon}}.",
  },
  {
    id: "a3",
    name: "Post-vizită — mulțumire",
    description: "Mulțumire + cerere review la 2h după finalizare",
    trigger: "2h după finalizarea vizitei",
    channel: "SMS",
    timing: "2h după vizită",
    enabled: true,
    sent: 982,
    openRate: 76,
    clickRate: 28,
    template: "Mulțumim {{nume_client}}! Sperăm că ești mulțumită de {{serviciu}}. Ai 2 minute pentru un review? {{link_review}} — echipa {{salon}}",
  },
  {
    id: "a4",
    name: "Re-engagement",
    description: "\"Ne-e dor de tine!\" la 60 de zile inactivitate",
    trigger: "60 zile fără vizită",
    channel: "SMS",
    timing: "60 zile inactivitate",
    enabled: true,
    sent: 234,
    openRate: 62,
    clickRate: 19,
    template: "Ne-e dor de tine, {{nume_client}}! A trecut ceva timp de la ultima vizită. Te invităm cu 15% reducere la următoarea programare. Programează-te: {{link_programare}}",
  },
  {
    id: "a5",
    name: "Zi de naștere",
    description: "Ofertă specială în dimineața zilei de naștere",
    trigger: "Ziua de naștere",
    channel: "SMS",
    timing: "Dimineața zilei de naștere",
    enabled: true,
    sent: 156,
    openRate: 94,
    clickRate: 48,
    template: "La mulți ani, {{nume_client}}! 🎂 Te așteptăm cu un cadou special — 20% reducere la orice serviciu astăzi. Programează-te: {{link_programare}}",
  },
  {
    id: "a6",
    name: "Cerere review Google",
    description: "Smart routing: fericite → Google, nemulțumite → feedback intern",
    trigger: "24h după vizită",
    channel: "SMS",
    timing: "24h după vizită",
    enabled: false,
    sent: 445,
    openRate: 71,
    clickRate: 33,
    template: "Salut {{nume_client}}! Cum a fost vizita la {{salon}}? Dacă ești mulțumită, ne-ar ajuta enorm un review pe Google: {{link_google}}. Dacă nu, scrie-ne: {{link_feedback}}",
  },
]

export const PROMOTIONS: Promotion[] = [
  {
    id: "p1",
    code: "LUNA15",
    type: "procent",
    value: 15,
    validFrom: "2025-01-01",
    validTo: "2025-01-31",
    maxUses: 100,
    usedCount: 67,
    services: ["Toate serviciile"],
    revenue: 8400,
    active: true,
  },
  {
    id: "p2",
    code: "ZIUA20",
    type: "procent",
    value: 20,
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    maxUses: 500,
    usedCount: 156,
    services: ["Toate serviciile"],
    revenue: 0,
    active: true,
  },
  {
    id: "p3",
    code: "MANICURE50",
    type: "fix",
    value: 50,
    validFrom: "2025-01-15",
    validTo: "2025-02-15",
    maxUses: 50,
    usedCount: 12,
    services: ["Manichiură gel", "Manichiură simplă"],
    revenue: 1800,
    active: true,
  },
  {
    id: "p4",
    code: "BF2024",
    type: "procent",
    value: 30,
    validFrom: "2024-11-29",
    validTo: "2024-11-30",
    maxUses: 200,
    usedCount: 184,
    services: ["Toate serviciile"],
    revenue: 27600,
    active: false,
  },
]

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
