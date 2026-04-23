import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Target, Heart, Shield, ArrowRight } from "lucide-react"

const values = [
  {
    icon: Heart,
    title: "Claritate",
    description: "Spunem lucrurilor pe nume. În produs, în comunicare, în relația cu clienții.",
  },
  {
    icon: Target,
    title: "Simplitate",
    description:
      "Dacă ceva poate fi mai simplu, îl facem mai simplu. Complexitatea nu impresionează — rezultatele, da.",
  },
  {
    icon: Shield,
    title: "Încredere",
    description:
      "Construim ceva pe care ne bazăm și noi. Fiecare funcționalitate e testată ca și cum am folosi-o pentru propriul salon.",
  },
]

export default function DesprePage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Cine suntem.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                ASESOR e construit de oameni care înțeleg ce înseamnă să conduci un salon.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground text-balance">
                Povestea noastră
              </h2>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  Am văzut saloane excelente blocate în haos operațional. Profesioniști talentați care
                  pierdeau ore cu programări, mesaje și foi de calcul. Am știut că poate fi mai simplu.
                </p>
                <p>
                  ASESOR s-a născut din nevoia reală de ordine într-o industrie care merită instrumente
                  mai bune. Nu am vrut să facem încă un software complicat. Am vrut să facem ceva care
                  chiar funcționează — simplu, clar, de încredere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                Misiunea noastră
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                Să dăm fiecărui salon posibilitatea de a opera organizat, de a crește sustenabil și de
                a se concentra pe ceea ce face cel mai bine: să aibă grijă de clienți.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Valorile noastre
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {values.map((value, index) => (
                <div key={index} className="relative rounded-xl border border-border bg-card p-8">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <value.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{value.title}</h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                Vrei să ne cunoaștem mai bine?
              </h2>
              <div className="mt-8">
                <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/contact">
                    Programează o discuție
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  )
}
