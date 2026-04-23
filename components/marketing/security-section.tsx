import Link from "next/link"
import { Globe, Lock, Shield, Database, FileCheck, Eye } from "lucide-react"

const items = [
  {
    icon: Globe,
    title: "Date găzduite în UE",
    description:
      "Frankfurt, Germania. Datele tale nu părăsesc niciodată Uniunea Europeană. Conform GDPR și Legii 190/2018.",
  },
  {
    icon: Lock,
    title: "Criptate la tranzit și la repaus",
    description:
      "TLS 1.3 la comunicare, criptare AES-256 la stocare. Datele sensibile (alergii, formule) au criptare suplimentară.",
  },
  {
    icon: Shield,
    title: "Izolare completă per salon",
    description:
      "Row-level security. Fiecare salon vede doar datele lui, chiar și la nivel de bază de date. Imposibil de confundat.",
  },
  {
    icon: Database,
    title: "Backup zilnic automat",
    description:
      "Copiile sunt făcute automat și păstrate 7 zile cu point-in-time recovery. Pierzi minim, chiar și în cel mai rău caz.",
  },
  {
    icon: FileCheck,
    title: "DPA disponibil",
    description:
      "Contract de prelucrare a datelor (DPA) disponibil la cerere, necesar pentru conformitatea salonului tău ca operator.",
  },
  {
    icon: Eye,
    title: "Fără tracking obscur",
    description:
      "Nu vindem date. Nu rulăm cookies marketing fără consimțământ. Nu urmărim comportamentul dincolo de ce e strict necesar.",
  },
]

export function SecuritySection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Datele tale (și ale clienților tăi) sunt în siguranță
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Beauty înseamnă încredere. O fișă de client cu alergii, formule, contacte — nu e ceva
            ce poți pierde. Construim ASESOR după cele mai stricte standarde europene.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex gap-4">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/privacy"
            className="text-sm text-accent hover:underline"
          >
            Citește politica de confidențialitate completă →
          </Link>
        </div>
      </div>
    </section>
  )
}
