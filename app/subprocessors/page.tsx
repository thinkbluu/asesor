import { MarketingLayout } from "@/components/marketing/marketing-layout"

export const metadata = {
  title: "Sub-procesatori — ASESOR",
  description: "Lista completă a sub-procesatorilor utilizați de ASESOR pentru prelucrarea datelor.",
}

const subprocessors = [
  {
    name: "Clerk Inc.",
    scope: "Autentificare utilizatori, gestionarea sesiunilor și a conturilor",
    location: "SUA (cu Clauze Contractuale Standard — SCC)",
    dpa: "https://clerk.com/legal/dpa",
  },
  {
    name: "Supabase Inc.",
    scope: "Bază de date relațională, stocare fișiere, autorizare Row Level Security",
    location: "EU — Frankfurt, Germania (AWS eu-central-1)",
    dpa: "https://supabase.com/privacy",
  },
  {
    name: "Vercel Inc.",
    scope: "Hosting aplicație, CDN, Edge Network, loguri de acces",
    location: "Global (preferință EU), SUA cu SCC",
    dpa: "https://vercel.com/legal/dpa",
  },
  {
    name: "Resend Inc.",
    scope: "Trimitere emailuri tranzacționale (confirmări, notificări)",
    location: "SUA (cu SCC)",
    dpa: "https://resend.com/legal/dpa",
  },
  {
    name: "Stripe Inc.",
    scope: "Procesare plăți, facturare, gestionare abonamente",
    location: "UE — Dublin, Irlanda",
    dpa: "https://stripe.com/legal/dpa",
  },
]

export default function SubprocessorsPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-4xl px-6 py-16 text-foreground">
        <div className="mb-8 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Draft.</strong> Acest document este un draft. Consultă un avocat înainte de lansarea publică.
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">Listă sub-procesatori</h1>
        <p className="mb-4 text-muted-foreground leading-relaxed">
          ASESOR utilizează serviciile terților de mai jos pentru furnizarea platformei. Toți sub-procesatorii sunt selectați conform cerințelor GDPR și au DPA-uri în vigoare. Această listă este actualizată la fiecare modificare, iar abonații sunt notificați cu 30 de zile înainte de orice schimbare.
        </p>
        <p className="mb-10 text-sm text-muted-foreground">Ultima actualizare: aprilie 2025</p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Furnizor</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Scop</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Locație date</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">DPA</th>
              </tr>
            </thead>
            <tbody>
              {subprocessors.map((sp, i) => (
                <tr key={sp.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{sp.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sp.scope}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{sp.location}</td>
                  <td className="px-4 py-3">
                    <a
                      href={sp.dpa}
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

        <p className="mt-8 text-sm text-muted-foreground">
          Pentru întrebări sau obiecții legate de sub-procesatori, contactează-ne la{" "}
          <a href="mailto:dpo@asesor.ro" className="text-emerald-600 underline dark:text-emerald-400">
            dpo@asesor.ro
          </a>
          .
        </p>
      </main>
    </MarketingLayout>
  )
}
