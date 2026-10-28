import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { LegalDocHeader } from "@/components/legal/legal-doc-header"
import { SITE } from "@/lib/site"

export const metadata = {
  title: "Politica cookies — ASESOR",
  description: "Ce cookie-uri utilizăm și cum le poți gestiona.",
}

const cookies = [
  {
    name: "sb-* (cookie-uri de autentificare Supabase)",
    provider: "Supabase",
    category: "Strict necesare",
    purpose: "Sesiunea de autentificare a utilizatorului (token de acces și de reîmprospătare). Necesar pentru funcționarea aplicației.",
    duration: "Sesiune / până la 7 zile (sesiune persistentă)",
  },
  {
    name: "asesor_salon",
    provider: "ASESOR",
    category: "Strict necesare",
    purpose: "Reține salonul activ pentru utilizatorii care aparțin mai multor saloane.",
    duration: "Persistent (până la ștergere)",
  },
  {
    name: "_vercel_no_cache",
    provider: "Vercel",
    category: "Strict necesare",
    purpose: "Controlul cache-ului la nivel de CDN Vercel. Nu conține date personale.",
    duration: "Sesiune",
  },
  {
    name: "va_*",
    provider: "Vercel Analytics",
    category: "Analytics",
    purpose: "Măsurarea traficului și performanței paginilor. Date anonimizate, fără identificare individuală.",
    duration: "1 an",
  },
  {
    name: "asesor-theme",
    provider: "ASESOR",
    category: "Preferințe",
    purpose: "Stochează preferința de temă (light/dark) a utilizatorului.",
    duration: "1 an",
  },
]

const categoryColors: Record<string, string> = {
  "Strict necesare": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Analytics": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Preferințe": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  "Marketing": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
}

export default function CookiesPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-4xl px-6 py-16 text-foreground">
        <LegalDocHeader
          doc="cookies"
          title="Politica cookies"
          lead="Folosim un număr minim de cookie-uri, strict necesare funcționării platformei. Cookie-urile de analytics se încarcă doar după consimțământul exprimat în bannerul de cookie-uri. Nu utilizăm cookie-uri de tracking terț sau publicitate comportamentală. Prelucrarea datelor prin cookie-uri este reglementată de Legea nr. 506/2004 privind prelucrarea datelor cu caracter personal și protecția vieții private în sectorul comunicațiilor electronice."
        />

        <h2 className="mb-3 mt-6 text-xl font-semibold">Ce sunt cookie-urile?</h2>
        <p className="mb-6 leading-relaxed text-muted-foreground">
          Cookie-urile sunt fișiere text mici stocate în browserul tău atunci când vizitezi un site web. Acestea permit site-ului să-ți recunoască browserul la vizitele ulterioare și să rețină anumite preferințe.
        </p>

        <h2 className="mb-4 text-xl font-semibold">Cookie-uri utilizate</h2>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Cookie</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Furnizor</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Categorie</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Scop</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Durată</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((c, i) => (
                <tr key={c.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.provider}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[c.category] ?? ""}`}>
                      {c.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 mt-10 text-xl font-semibold">Cum poți gestiona cookie-urile?</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Cookie-urile strict necesare nu pot fi dezactivate fără a afecta funcționarea platformei. Pentru celelalte categorii, poți:
        </p>
        <ul className="mb-6 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Modifica setările browserului tău pentru a bloca sau șterge cookie-uri.</li>
          <li>Utiliza modul privat / incognito al browserului.</li>
          <li>Instala extensii de browser pentru blocarea trackerilor (ex. uBlock Origin).</li>
          <li>Redeschide bannerul de consimțământ oricând, folosind linkul „Setări cookie-uri" din subsolul site-ului.</li>
        </ul>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Rețineți că dezactivarea cookie-urilor strict necesare (ex. cele de sesiune Supabase) va face imposibilă autentificarea în aplicație.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">Contact</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Întrebări despre utilizarea cookie-urilor:{" "}
          <a href={`mailto:${SITE.emails.dpo}`} className="text-emerald-600 underline dark:text-emerald-400">
            {SITE.emails.dpo}
          </a>
        </p>
      </main>
    </MarketingLayout>
  )
}
