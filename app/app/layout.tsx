import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { AppSidebar } from "@/components/app/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

// Server shell for the authenticated app. Resolves the session once and feeds
// the sidebar; users without a salon membership are sent to onboarding.
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
    <div className="min-h-screen bg-muted/30">
      <AppSidebar
        salonName={session.salon.name}
        userFullName={userFullName}
        role={session.role}
      />
      <div className="lg:pl-64 transition-all duration-300">
        <main className="min-h-screen">{children}</main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
