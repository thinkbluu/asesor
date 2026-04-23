"use client"

import { motion } from "framer-motion"
import { Calendar, MessageSquare, BarChart3 } from "lucide-react"

const badges = [
  { icon: Calendar, label: "Programări online" },
  { icon: MessageSquare, label: "Integrare SMS" },
  { icon: BarChart3, label: "Rapoarte automate" },
]

export function SocialProofSection() {
  return (
    <section className="border-t border-border bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 md:flex-row md:justify-between"
        >
          <p className="text-sm font-medium text-muted-foreground tracking-wide">
            Peste <span className="text-foreground font-semibold">200+</span> saloane folosesc ASESOR
          </p>

          <div className="flex items-center gap-6">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <badge.icon className="h-4 w-4 text-accent" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
