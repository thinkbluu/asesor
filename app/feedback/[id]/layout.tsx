import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Cum a fost experiența ta? — Beauty Studio",
  description: "Părerea ta ne ajută să ne îmbunătățim serviciile.",
  robots: { index: false, follow: false },
}

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0A0A0A] text-white antialiased">{children}</div>
}
