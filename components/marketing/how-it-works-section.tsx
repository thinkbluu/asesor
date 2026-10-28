"use client"

import { motion } from "framer-motion"
import { Settings2, CalendarCheck, TrendingUp } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Settings2,
    title: "Configurezi salonul",
    description:
      "Adaugi serviciile, prețurile, programul de lucru și echipa. Dacă ai deja date într-un Excel, caiet sau alt sistem — te ajutăm să le muți.",
    time: "~10 minute",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Clienții se programează singuri",
    description:
      "Partajezi link-ul de programări pe Instagram, WhatsApp, sau direct de pe Google Maps. Clienții aleg serviciul, ora și specialistul. Confirmarea vine automat.",
    time: "Funcționează 24/7, inclusiv când dormi",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Tu vezi rezultatele",
    description:
      "La finalul zilei, deschizi raportul: câți clienți, câte servicii, cât ai încasat. Fără foi, fără calcule.",
    time: "Seară de seară, în 2 minute",
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
            Cum începi
          </h2>
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
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                <p className="mt-4 text-xs text-muted-foreground/70">{step.time}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
