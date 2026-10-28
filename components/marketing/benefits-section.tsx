import { Clock, Eye, Users, TrendingUp } from "lucide-react"

const benefits = [
  {
    icon: Clock,
    title: "Fără programări pe WhatsApp",
    description:
      "Clienții își rezervă singuri serviciile, iar confirmările se trimit automat. Mai puține apeluri, mai puține mesaje și mai puține programări uitate.",
  },
  {
    icon: Eye,
    title: "Vezi ce se întâmplă în salon",
    description:
      "Programări, încasări, consum de produse și activitatea echipei, fără prea multe filtre.",
  },
  {
    icon: Users,
    title: "Echipa are claritate",
    description:
      "Fiecare membru vede programul, serviciile și clienții alocați. Mai multă organizare, scris puțin mai oferit.",
  },
  {
    icon: TrendingUp,
    title: "Control asupra afacerii tale",
    description:
      "Rapoarte clare, stocuri actualizate și performanța fiecărui serviciu sau angajat, într-un singur dashboard.",
  },
]

export function BenefitsSection() {
  return (
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            De ce ASESOR?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pentru că a fost creat dintr-o nevoie reală, studiată și observată.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="group relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <benefit.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
