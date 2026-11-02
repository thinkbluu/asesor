import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isPlatformAdminEmail } from "@/lib/billing/admin"
import { PilotForm } from "@/components/app/admin/pilot-form"

export const metadata: Metadata = {
  title: "Administrare pilot | ASESOR",
  robots: { index: false, follow: false },
}

export default async function AdminPilotPage() {
  const session = await getSession()
  if (!session || !isPlatformAdminEmail(session.user.email)) notFound()

  return (
    <main className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-balance">Perioadă pilot</h1>
        <p className="text-muted-foreground text-pretty">
          Setează data până la care un salon are acces complet fără abonament Stripe.
        </p>
      </header>
      <PilotForm />
    </main>
  )
}
