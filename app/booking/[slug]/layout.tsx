import type { Metadata } from "next"
import type { ReactNode } from "react"
import { DEMO_SALON } from "@/lib/booking-logic"

export const metadata: Metadata = {
  title: `${DEMO_SALON.name} — Programare Online`,
  description: `Programează-te online la ${DEMO_SALON.name}. ${DEMO_SALON.description}`,
  openGraph: {
    title: `${DEMO_SALON.name} — Programare Online`,
    description: DEMO_SALON.description,
    type: "website",
    locale: "ro_RO",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BookingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white text-zinc-900 antialiased">{children}</div>
}
