// Single source of truth for plans, pricing and trial rules.
// No other file may hardcode a price number.

export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    monthly: 49,
    yearly: 39,
    maxUsers: 2,
    maxClients: 500,
    description: "Pentru tehnicieni independenți și saloane de 1–2 persoane",
    features: [
      "Până la 2 utilizatori",
      "Calendar și programare online",
      "Fișe cliente (până la 500)",
      "Confirmări și reamintiri pe email",
      "Rapoarte de bază",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 99,
    yearly: 79,
    maxUsers: 10,
    maxClients: null,
    highlighted: true,
    description: "Pentru saloane cu echipă care vor control complet",
    features: [
      "Până la 10 utilizatori",
      "Tot din Basic",
      "Stocuri cu consum automat pe servicii",
      "Încasări, cheltuieli și închiderea zilei",
      "Comisioane calculate automat",
      "Program de loialitate și recenzii",
      "Cliente nelimitate",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 199,
    yearly: 159,
    maxUsers: null,
    maxClients: null,
    description: "Pentru saloane mari și lanțuri în creștere",
    features: [
      "Utilizatori nelimitați",
      "Tot din Pro",
      "Export pentru contabilitate",
      "Configurare asistată de echipa ASESOR",
      "Suport prioritar telefonic",
    ],
    comingSoon: ["Mai multe locații", "Mesaje SMS și WhatsApp"],
  },
] as const

export type PlanId = (typeof PLANS)[number]["id"]

export const TRIAL_DAYS = 14
export const TRIAL_REQUIRES_CARD = true
export const SHOW_YEARLY = false

export function formatPlanPrice(n: number): string {
  return `${n} lei`
}

type MatrixCell = "inclus" | "—" | (string & {})

export interface FeatureMatrixRow {
  feature: string
  basic: MatrixCell
  pro: MatrixCell
  premium: MatrixCell
}

export const FEATURE_MATRIX: FeatureMatrixRow[] = [
  { feature: "Utilizatori", basic: "2", pro: "10", premium: "nelimitați" },
  { feature: "Fișe cliente", basic: "500", pro: "nelimitat", premium: "nelimitat" },
  { feature: "Calendar și programare online", basic: "inclus", pro: "inclus", premium: "inclus" },
  { feature: "Confirmări și reamintiri pe email", basic: "inclus", pro: "inclus", premium: "inclus" },
  { feature: "Stocuri cu consum automat", basic: "—", pro: "inclus", premium: "inclus" },
  { feature: "Încasări, cheltuieli și închiderea zilei", basic: "—", pro: "inclus", premium: "inclus" },
  { feature: "Comisioane", basic: "—", pro: "inclus", premium: "inclus" },
  { feature: "Loialitate și recenzii", basic: "—", pro: "inclus", premium: "inclus" },
  { feature: "Export pentru contabilitate", basic: "—", pro: "—", premium: "inclus" },
  { feature: "Configurare asistată", basic: "—", pro: "—", premium: "inclus" },
  { feature: "Suport", basic: "email", pro: "email prioritar", premium: "telefonic prioritar" },
]
