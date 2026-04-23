import { Clock, Eye, Users, TrendingUp } from "lucide-react"

const benefits = [
  {
    icon: Clock,
    title: "Fără programări pe WhatsApp",
    description:
      "Clienții tăi își fac singuri programarea online. Tu primești confirmare automată. Gata cu mesajele și apelurile.",
  },
  {
    icon: Eye,
    title: "Nu mai ghicești. Vezi totul.",
    description:
      "Câți clienți ai, cât ai încasat, ce produse s-au consumat. Pe zi, săptămână, lună.",
  },
  {
    icon: Users,
    title: "Echipa știe ce are de făcut",
    description:
      "Program individual, servicii alocate, performanță măsurabilă. Fără întrebări inutile.",
  },
  {
    icon: TrendingUp,
    title: "Controlul real al salonului",
    description:
      "Rapoarte clare, stocuri monitorizate, venituri pe fiecare serviciu și angajat.",
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
            Simplu. Rapid. Eficient. Exact ce îți trebuie pentru a conduce salonul mai bine.
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
