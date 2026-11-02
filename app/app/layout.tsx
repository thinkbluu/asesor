import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Bodoni_Moda } from "next/font/google"
import { getSession } from "@/lib/auth/session"
import { pendingLegalDocs } from "@/lib/legal"
import { AppSidebar } from "@/components/app/app-sidebar"
import { BillingBanner } from "@/components/app/billing-banner"
import { LegalAcceptanceModal } from "@/components/app/legal-acceptance-modal"
import { Toaster } from "@/components/ui/sonner"

// Server shell for the authenticated app. Resolves the session once and feeds
// the sidebar; users without a salon membership are sent to onboarding.
// Bodoni Moda is exposed as --serif for the dashboard greeting and
// empty-state headlines only — all other UI stays Geist / Geist Mono.
const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
})

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect("/login")
  if (!session.salon) redirect("/app/onboarding")

  const userFullName =
    (typeof session.user.user_metadata?.full_name === "string" &&
      session.user.user_metadata.full_name) ||
    session.profile?.full_name ||
    session.user.email ||
    "Utilizator"

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ "--serif": bodoni.style.fontFamily } as CSSProperties}
    >
      <div className="flex min-h-screen">
        <AppSidebar
          salonName={session.salon.name}
          userFullName={userFullName}
          role={session.role}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <BillingBanner banner={session.billing?.banner ?? null} isOwner={session.role === "owner"} />
          <main className="min-h-screen flex-1">{children}</main>
        </div>
      </div>
      {session.role === "owner" ? (
        <LegalAcceptanceModal pending={pendingLegalDocs(session.profile)} />
      ) : null}
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
