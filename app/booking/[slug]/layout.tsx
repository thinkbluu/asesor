import type { Metadata } from "next"
import type { ReactNode } from "react"
import "../booking.css"

export const metadata: Metadata = {
  title: "Programare Online — ASESOR",
  description: "Pagina publică de programări online.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function BookingLayout({ children }: { children: ReactNode }) {
  return children
}
