"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, MessageSquare, UserCheck, XCircle, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const cards = [
  {
    icon: Sparkles,
    title: "Preț blocat pentru primii clienți",
    description:
      "Primele 50 de saloane care se alătură primesc prețul de azi, pentru totdeauna. Chiar dacă mâine schimbăm grila.",
  },
  {
    icon: MessageSquare,
    title: "Acces direct la echipa de produs",
    description:
      "Feedback-ul tău ajunge la noi în aceeași zi și intră direct în roadmap. Nu prin 3 niveluri de support.",
  },
  {
    icon: UserCheck,
    title: "Onboarding personalizat",
    description:
      "Un om te ajută să setezi totul, să imporți datele din ce ai acum și să-ți antrenezi echipa.",
  },
  {
    icon: XCircle,
    title: "Fără contract, fără blocaj",
    description:
      "Pleci când vrei, fără explicații. Exporți datele oricând, în format standard.",
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
          <Badge variant="outline" className="text-accent border-accent/30">
            Ești printre primii
          </Badge>

          <h2 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Nu-ți promitem 200 de clienți fericiți. Îți promitem altceva.
          </h2>

          <p className="mt-6 text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Majoritatea platformelor SaaS pentru saloane au venit în România după ani de dezvoltare
            în altă parte. ASESOR e construit aici, pentru saloane de aici — cu TVA-ul nostru, cu
            Start-Up Nation, cu e-Factura ANAF, cu sezonalitatea noastră.
          </p>
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
