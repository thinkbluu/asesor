import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Cum a fost experiența ta?",
  description: "Părerea ta ne ajută să ne îmbunătățim serviciile.",
  robots: { index: false, follow: false },
}

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground antialiased">{children}</div>
}
