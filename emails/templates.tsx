import { render } from "@react-email/components"
import type { ReactElement } from "react"

import Anulare, { type AnulareData } from "./anulare"
import CerereFeedback, { type CerereFeedbackData } from "./cerere-feedback"
import ConfirmareProgramare, { type ConfirmareProgramareData } from "./confirmare-programare"
import ContactNou, { type ContactNouData } from "./contact-nou"
import InvitatieEchipa, { type InvitatieEchipaData } from "./invitatie-echipa"
import ProgramareNouaOnline, { type ProgramareNouaOnlineData } from "./programare-noua-online"
import Reamintire24h, { type Reamintire24hData } from "./reamintire-24h"
import StocScazutZilnic, { type StocScazutZilnicData } from "./stoc-scazut-zilnic"

// Re-exported so callers (sample data, messaging, cron) can type their data
// against the registry without importing each template file.
export type {
  AnulareData,
  CerereFeedbackData,
  ConfirmareProgramareData,
  ContactNouData,
  InvitatieEchipaData,
  ProgramareNouaOnlineData,
  Reamintire24hData,
  StocScazutZilnicData,
}

// Kinds stored in message_log. Client-facing and salon-facing copies of the
// same event get distinct kinds because message_log enforces
// unique(appointment_id, kind) — two recipients must not collide.
export type MessageKind =
  | "confirmare_programare"
  | "reamintire_24h"
  | "anulare"
  | "anulare_salon"
  | "programare_noua_online"
  | "programare_noua_online_staff"
  | "cerere_feedback"
  | "invitatie_echipa"
  | "stoc_scazut_zilnic"
  | "contact_nou"

export interface TemplateDataMap {
  confirmare_programare: ConfirmareProgramareData
  reamintire_24h: Reamintire24hData
  anulare: AnulareData
  anulare_salon: AnulareData
  programare_noua_online: ProgramareNouaOnlineData
  programare_noua_online_staff: ProgramareNouaOnlineData
  cerere_feedback: CerereFeedbackData
  invitatie_echipa: InvitatieEchipaData
  stoc_scazut_zilnic: StocScazutZilnicData
  contact_nou: ContactNouData
}

export interface RenderedMessage {
  subject: string
  html: string
  text: string
}

interface TemplateEntry<K extends MessageKind> {
  subject: (data: TemplateDataMap[K]) => string
  element: (data: TemplateDataMap[K]) => ReactElement
}

const REGISTRY: { [K in MessageKind]: TemplateEntry<K> } = {
  confirmare_programare: {
    subject: (d) => `Confirmare programare — ${d.salon.name}, ${d.dateLabel} ora ${d.timeLabel}`,
    element: (d) => <ConfirmareProgramare data={d} />,
  },
  reamintire_24h: {
    subject: (d) => `Mâine te așteptăm la ${d.salon.name}, ora ${d.timeLabel}`,
    element: (d) => <Reamintire24h data={d} />,
  },
  anulare: {
    subject: (d) => `Programarea ta de ${d.dateLabel} a fost anulată`,
    element: (d) => <Anulare data={{ ...d, recipient: "client" }} />,
  },
  anulare_salon: {
    subject: (d) => `Programare anulată: ${d.clientFirstName ?? "client"}, ${d.dateLabel} ${d.timeLabel}`,
    element: (d) => <Anulare data={{ ...d, recipient: "salon" }} />,
  },
  programare_noua_online: {
    subject: (d) => `Programare nouă online: ${d.clientName}, ${d.dateLabel} ora ${d.timeLabel}`,
    element: (d) => <ProgramareNouaOnline data={d} />,
  },
  programare_noua_online_staff: {
    subject: (d) => `Programare nouă online cu tine: ${d.clientName}, ${d.dateLabel} ora ${d.timeLabel}`,
    element: (d) => <ProgramareNouaOnline data={d} />,
  },
  cerere_feedback: {
    subject: (d) => `Cum a fost vizita ta la ${d.salon.name}?`,
    element: (d) => <CerereFeedback data={d} />,
  },
  invitatie_echipa: {
    subject: (d) => `Ai fost invitat(ă) în ${d.salon.name} pe ASESOR`,
    element: (d) => <InvitatieEchipa data={d} />,
  },
  stoc_scazut_zilnic: {
    subject: (d) => `${d.salon.name}: ${d.items.length} produse de comandat`,
    element: (d) => <StocScazutZilnic data={d} />,
  },
  contact_nou: {
    subject: (d) => `Mesaj nou de contact: ${d.subject}`,
    element: (d) => <ContactNou data={d} />,
  },
}

export async function renderMessage<K extends MessageKind>(
  kind: K,
  data: TemplateDataMap[K],
): Promise<RenderedMessage> {
  const entry = REGISTRY[kind]
  const element = entry.element(data)
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])
  return { subject: entry.subject(data), html, text }
}

export function messageSubject<K extends MessageKind>(
  kind: K,
  data: TemplateDataMap[K],
): string {
  return REGISTRY[kind].subject(data)
}

export const MESSAGE_KINDS = Object.keys(REGISTRY) as MessageKind[]
