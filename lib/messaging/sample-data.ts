// Sample data for template previews and the offline render check. Pure data —
// no server imports — so scripts/render-templates.tsx can use it too.
// Deliberately contains NO client health data (allergies, formulas, notes of
// medical nature): emails must never carry it.

import type {
  AnulareData,
  CerereFeedbackData,
  ConfirmareProgramareData,
  ContactNouData,
  InvitatieEchipaData,
  ProgramareNouaOnlineData,
  Reamintire24hData,
  StocScazutZilnicData,
} from "@/emails/templates"

const salon = {
  name: "Salon Demo",
  accentColor: "#7C3AED",
  logoUrl: null,
  address: "Str. Exemplu nr. 10",
  city: "Timișoara",
  phone: "0722 000 000",
}

export const SAMPLE_CONFIRMARE_PROGRAMARE: ConfirmareProgramareData = {
  clientFirstName: "Maria",
  salon,
  services: [
    { name: "Tuns femei", durationMin: 45, price: 80 },
    { name: "Vopsit rădăcină", durationMin: 60, price: 150 },
  ],
  dateLabel: "marți, 3 noiembrie 2026",
  timeLabel: "14:30",
  staffFirstName: "Ana",
  mapsUrl: "https://maps.google.com/?q=Str.+Exemplu+nr.+10,+Timi%C8%99oara",
  manageUrl: "https://asesor.ro/booking/manage/exemplu-token",
  cancellationHours: 24,
}

export const SAMPLE_REAMINTIRE_24H: Reamintire24hData = {
  clientFirstName: "Maria",
  salon,
  serviceNames: ["Tuns femei", "Vopsit rădăcină"],
  dateLabel: "marți, 3 noiembrie 2026",
  timeLabel: "14:30",
  staffFirstName: "Ana",
  manageUrl: "https://asesor.ro/booking/manage/exemplu-token",
}

export const SAMPLE_ANULARE_CLIENT: AnulareData = {
  recipient: "client",
  clientFirstName: "Maria",
  salon,
  serviceNames: ["Tuns femei"],
  dateLabel: "marți, 3 noiembrie 2026",
  timeLabel: "14:30",
  staffFirstName: "Ana",
  reason: "Reprogramare la cererea clientului",
}

export const SAMPLE_ANULARE_SALON: AnulareData = {
  recipient: "salon",
  clientFirstName: "Maria Popescu",
  salon,
  serviceNames: ["Tuns femei"],
  dateLabel: "marți, 3 noiembrie 2026",
  timeLabel: "14:30",
  staffFirstName: "Ana",
  reason: null,
}

export const SAMPLE_PROGRAMARE_NOUA_ONLINE: ProgramareNouaOnlineData = {
  clientName: "Maria Popescu",
  clientPhone: "0722 123 456",
  clientEmail: "maria@example.com",
  salon,
  services: [{ name: "Tuns femei", durationMin: 45, price: 80 }],
  dateLabel: "marți, 3 noiembrie 2026",
  timeLabel: "14:30",
  staffFirstName: "Ana",
  notes: null,
}

export const SAMPLE_CERERE_FEEDBACK: CerereFeedbackData = {
  clientFirstName: "Maria",
  salon,
  feedbackUrl: "https://asesor.ro/feedback/exemplu-token",
}

export const SAMPLE_INVITATIE_ECHIPA: InvitatieEchipaData = {
  salon,
  inviteUrl: "https://asesor.ro/invitatie/exemplu-token",
  roleLabel: "Specialist",
  inviterName: "Ioana (proprietar)",
  expiresInDays: 7,
}

export const SAMPLE_STOC_SCAZUT: StocScazutZilnicData = {
  salon,
  items: [
    { name: "Vopsea 6.0", stock: 0, minStock: 2, supplier: "ProHair" },
    { name: "Șampon profesional 1L", stock: 1, minStock: 3, supplier: "ProHair" },
  ],
}

export const SAMPLE_CONTACT_NOU: ContactNouData = {
  name: "Ion Ionescu",
  email: "ion@example.com",
  phone: "0723 456 789",
  salonName: "Salon Frumusețe",
  subject: "Întrebare despre abonament",
  message:
    "Bună ziua! Când pot afla mai multe despre abonamentul anual? Aș vrea să vin într-o ședință de probă în iunie. Mulțumesc!",
  sentAtLabel: "28 octombrie 2026, 10:15",
}
