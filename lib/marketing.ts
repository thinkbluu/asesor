// Neutral marketing config: segment definitions (labels only — real counts
// come from the DB via lib/data/marketing.ts) and message templates.
// No fabricated numbers live here.

export interface SegmentDef {
  id: string
  label: string
  description: string
}

export const SEGMENTS: SegmentDef[] = [
  { id: "all", label: "Toți clienții", description: "Toată baza de clienți a salonului" },
  { id: "new30", label: "Clienți noi (30 zile)", description: "Prima vizită în ultimele 30 de zile" },
  { id: "loyal", label: "Clienți fideli", description: "Minim 5 vizite în total" },
  { id: "inactive60", label: "Inactivi (60+ zile)", description: "Fără vizită de peste 60 de zile" },
  { id: "custom", label: "Segment personalizat", description: "Alege manual criteriile" },
]

export const EMAIL_TEMPLATES = [
  { id: "birthday", label: "Zi de naștere" },
  { id: "reengagement", label: "Re-engagement" },
  { id: "promo", label: "Promoție" },
  { id: "seasonal", label: "Sezonieră" },
  { id: "newservice", label: "Serviciu nou" },
]

export interface SegmentCounts {
  all: number
  new30: number
  loyal: number
  inactive60: number
}
