"use client"

import { motion } from "framer-motion"
import { Settings2, CalendarCheck, TrendingUp } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Settings2,
    title: "Configurezi salonul",
    description:
      "Adaugi serviciile, prețurile, programul și echipa. Import din Excel dacă ai deja date.",
    time: "~10 minute",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Primești programări",
    description:
      "Clienții se programează singuri online, sau le adaugi manual. Confirmare și reminder automat.",
    time: "Automat, 24/7",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Vezi ce contează",
    description:
      "Venituri pe zi, clienți fideli, servicii rentabile. Decizii pe baza de date, nu de presupuneri.",
    time: "În fiecare seară, 5 minute",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            De la programare la plată, în 3 pași
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Fără learning curve. Fără setup complicat. Fără consultant.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-xl border border-border bg-card p-6"
              >
                <span className="absolute top-4 right-4 text-5xl font-bold text-accent/10 leading-none select-none">
                  {step.number}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-4">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                <p className="mt-4 text-xs text-muted-foreground/70">{step.time}</p>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-12 text-sm text-muted-foreground text-center">
          Poți migra de pe agendă, Excel, Booksy sau orice alt sistem. Te ajutăm noi.
        </p>
      </div>
    </section>
  )
}
