import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { LegalDocHeader } from "@/components/legal/legal-doc-header"
import { SITE } from "@/lib/site"

export const metadata = {
  title: "Împuterniciți (subprocessors) — ASESOR",
  description: "Lista împuterniciților pe care ASESOR îi folosește pentru furnizarea serviciului.",
}

type Subprocessor = {
  name: string
  purpose: string
  location: string
  transfer: string
  dpa: string
}

// Keep this list in sync with the services the code actually calls:
// Supabase (lib/supabase/*), Vercel (hosting + Analytics), Resend
// (app/contact/actions.ts), Cloudflare Turnstile (booking + contact forms),
// Google OAuth (app/login/page.tsx), Stripe (abonamente — env config în
// lib/env.server.ts).
const subprocessors: Subprocessor[] = [
  {
    name: "Supabase (Supabase Inc.)",
    purpose: "Bază de date, autentificare și stocare fișiere",
    location: "UE — Frankfurt",
    transfer: "Nu se transferă în afara UE",
    dpa: "https://supabase.com/dpa",
  },
  {
    name: "Vercel (Vercel Inc.)",
    purpose: "Găzduirea aplicației și analytics",
    location: "SUA / rețea globală CDN",
    transfer: "Clauze Contractuale Standard (SCC)",
    dpa: "https://vercel.com/legal/dpa",
  },
  {
    name: "Resend (Resend Inc.)",
    purpose: "Email tranzacțional (formular de contact)",
    location: "SUA",
    transfer: "Clauze Contractuale Standard (SCC)",
    dpa: "https://resend.com/legal/dpa",
  },
  {
    name: "Stripe (Stripe Inc.)",
    purpose: "Plata abonamentului",
    location: "UE / SUA",
    transfer: "Clauze Contractuale Standard (SCC)",
    dpa: "https://stripe.com/legal/dpa",
  },
  {
    name: "Cloudflare (Cloudflare Inc.)",
    purpose: "Turnstile — protecție anti-bot la formulare",
    location: "Rețea globală",
    transfer: "Clauze Contractuale Standard (SCC)",
    dpa: "https://www.cloudflare.com/legal/dpa/",
  },
  {
    name: "Google (Google Ireland Ltd.)",
    purpose: "Autentificare opțională cu contul Google",
    location: "UE / SUA",
    transfer: "Clauze Contractuale Standard (SCC)",
    dpa: "https://business.safety.google/processorterms/",
  },
]

export default function SubprocessorsPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-4xl px-6 py-16 text-foreground">
        <LegalDocHeader
          doc="subprocessors"
          title="Împuterniciți (subprocessors)"
          lead="ASESOR folosește următorii împuterniciți pentru furnizarea serviciului. Orice adăugare la această listă este notificată salonelor înainte de intrarea în vigoare, conform Acordului de prelucrare a datelor (/dpa)."
        />

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Furnizor</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Scop</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Locație</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Mecanism de transfer</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">DPA</th>
              </tr>
            </thead>
            <tbody>
              {subprocessors.map((s, i) => (
                <tr key={s.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.location}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.transfer}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={s.dpa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 underline dark:text-emerald-400"
                    >
                      Vezi DPA
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 mt-10 text-xl font-semibold">Notificarea modificărilor</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Modificările acestei liste sunt anunțate salonelor cu cel puțin 14 zile înainte, prin email sau în platformă. Dacă salonul se
          opune în mod justificat noii împuterniciri, poate rezilia contractul sau poate discuta cu noi soluții alternative. Pentru
          întrebări:{" "}
          <a href={`mailto:${SITE.emails.legal}`} className="text-emerald-600 underline dark:text-emerald-400">{SITE.emails.legal}</a>
        </p>
      </main>
    </MarketingLayout>
  )
}
