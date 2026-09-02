import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Programare Online — ASESOR",
  description: "Pagina publică de programări online.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function BookingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white text-zinc-900 antialiased">{children}</div>
}
