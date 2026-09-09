"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { UserCheck, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const cards = [
  {
    icon: UserCheck,
    title: "Echipa de suport",
    description:
      "Îți punem la dispoziție o echipă, gata să te ajute să integrezi totul.",
  },
]

export function PilotSection() {
  return (
    <section className="py-24 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link href="/early-access">
            <Badge
              variant="outline"
              className="text-accent border-accent/30 cursor-pointer hover:bg-accent/10 transition-colors"
            >
              Poți fi printre primii
            </Badge>
          </Link>

          <h2 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Nu-ți promitem 200 de clienți fericiți. Îți promitem altceva.
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <Icon className="h-5 w-5 text-accent mb-3" />
                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/contact?subject=pilot">
              Vorbește cu noi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">Răspundem în maxim 24 de ore.</p>
        </div>
      </div>
    </section>
  )
}
