// Offline render check for the P12 email templates (acceptance gate).
// No DB, no network: renders every template to HTML and plain text with
// sample data, then asserts Romanian diacritics survive and that no
// allergy/formula (client health) fields leaked into any template.
//
// Run: node_modules/.bin/tsx scripts/render-templates.tsx

import { renderMessage, MESSAGE_KINDS, type MessageKind } from "../emails/templates"
import {
  SAMPLE_ANULARE_CLIENT,
  SAMPLE_ANULARE_SALON,
  SAMPLE_CERERE_FEEDBACK,
  SAMPLE_CONFIRMARE_PROGRAMARE,
  SAMPLE_CONTACT_NOU,
  SAMPLE_INVITATIE_ECHIPA,
  SAMPLE_PROGRAMARE_NOUA_ONLINE,
  SAMPLE_REAMINTIRE_24H,
  SAMPLE_STOC_SCAZUT,
} from "../lib/messaging/sample-data"

const SAMPLES: Record<MessageKind, unknown> = {
  confirmare_programare: SAMPLE_CONFIRMARE_PROGRAMARE,
  reamintire_24h: SAMPLE_REAMINTIRE_24H,
  anulare: SAMPLE_ANULARE_CLIENT,
  anulare_salon: SAMPLE_ANULARE_SALON,
  programare_noua_online: SAMPLE_PROGRAMARE_NOUA_ONLINE,
  programare_noua_online_staff: SAMPLE_PROGRAMARE_NOUA_ONLINE,
  cerere_feedback: SAMPLE_CERERE_FEEDBACK,
  invitatie_echipa: SAMPLE_INVITATIE_ECHIPA,
  stoc_scazut_zilnic: SAMPLE_STOC_SCAZUT,
  contact_nou: SAMPLE_CONTACT_NOU,
}

// Health data that must never appear in an email.
const FORBIDDEN = [/alergi/i, /formule/i, /culoare/i, /sănătate/i, /tratament medical/i]
// Romanian diacritics (comma-below) that must survive rendering.
const DIACRITICS = ["ă", "â", "î", "ș", "ț"]

async function main() {
  let failures = 0

  console.log("P12 template render check")
  console.log("=".repeat(72))

  for (const kind of MESSAGE_KINDS) {
    const data = SAMPLES[kind]
    const { subject, html, text } = await renderMessage(kind, data as never)
    const problems: string[] = []

    if (!subject.trim()) problems.push("empty subject")
    if (html.trim().length < 200) problems.push("html too short")
    if (text.trim().length < 40) problems.push("plain text too short")

    const missing = DIACRITICS.filter((d) => !html.includes(d) && !text.includes(d))
    if (missing.length > 2) {
      problems.push(`diacritics missing: ${missing.join(" ")}`)
    }

    for (const rx of FORBIDDEN) {
      if (rx.test(html) || rx.test(text)) problems.push(`forbidden field matched: ${rx}`)
    }

    if (problems.length > 0) failures++
    console.log(
      `${problems.length === 0 ? "OK  " : "FAIL"} ${kind.padEnd(28)} ` +
        `subject="${subject.slice(0, 48)}" html=${html.length}B text=${text.length}B` +
        (problems.length ? `\n     ${problems.join("; ")}` : ""),
    )
  }

  console.log("=".repeat(72))
  console.log(
    failures === 0
      ? `All ${MESSAGE_KINDS.length} templates rendered (HTML + plain text), diacritics intact, no health fields.`
      : `${failures} template(s) failed.`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main()
