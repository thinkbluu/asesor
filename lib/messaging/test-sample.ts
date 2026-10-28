import type { SalonBranding } from "@/emails/layout"
import type { MessageKind, TemplateDataMap } from "@/emails/templates"
import {
  SAMPLE_ANULARE_CLIENT,
  SAMPLE_CERERE_FEEDBACK,
  SAMPLE_CONFIRMARE_PROGRAMARE,
  SAMPLE_CONTACT_NOU,
  SAMPLE_INVITATIE_ECHIPA,
  SAMPLE_PROGRAMARE_NOUA_ONLINE,
  SAMPLE_REAMINTIRE_24H,
  SAMPLE_STOC_SCAZUT,
} from "./sample-data"

// Sample data for previews and test sends, with the real salon branding
// swapped in. Pure module — no server-only, no DB.
export function sampleWithSalon<K extends MessageKind>(
  kind: K,
  salon: SalonBranding,
): TemplateDataMap[K] | null {
  switch (kind) {
    case "confirmare_programare":
      return { ...SAMPLE_CONFIRMARE_PROGRAMARE, salon } as TemplateDataMap[K]
    case "reamintire_24h":
      return { ...SAMPLE_REAMINTIRE_24H, salon } as TemplateDataMap[K]
    case "anulare":
    case "anulare_salon":
      return { ...SAMPLE_ANULARE_CLIENT, salon } as TemplateDataMap[K]
    case "programare_noua_online":
    case "programare_noua_online_staff":
      return { ...SAMPLE_PROGRAMARE_NOUA_ONLINE, salon } as TemplateDataMap[K]
    case "cerere_feedback":
      return { ...SAMPLE_CERERE_FEEDBACK, salon } as TemplateDataMap[K]
    case "invitatie_echipa":
      return { ...SAMPLE_INVITATIE_ECHIPA, salon } as TemplateDataMap[K]
    case "stoc_scazut_zilnic":
      return { ...SAMPLE_STOC_SCAZUT, salon } as TemplateDataMap[K]
    case "contact_nou":
      return SAMPLE_CONTACT_NOU as TemplateDataMap[K]
    default:
      return null
  }
}
