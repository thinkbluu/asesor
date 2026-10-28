import Link from "next/link"
import { createHash } from "node:crypto"
import { redirect } from "next/navigation"
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { isSupabaseAdminConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { mapAuthError } from "@/lib/auth/errors"
import { writeAudit } from "@/lib/audit"

type InviteRow = {
  id: string
  salon_id: string
  email: string
  role: string
  expires_at: string
  accepted_at: string | null
  salons: { name: string } | null
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietar",
  manager: "Manager",
  staff: "Angajat",
  receptionist: "Receptioner",
}

export const metadata = {
  title: "Invitație în salon · ASESOR",
  robots: { index: false },
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return (
      <InviteShell>
        <div className="rounded-lg bg-black/5 px-4 py-3 text-sm text-black/60">
          Autentificarea va fi disponibilă în curând.
        </div>
      </InviteShell>
    )
  }

  // The raw token exists only in the link; the DB stores its sha256 hash.
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const admin = createSupabaseAdminClient()
  const { data: invite } = await admin
    .from("salon_invites")
    .select("id, salon_id, email, role, expires_at, accepted_at, salons(name)")
    .eq("token_hash", tokenHash)
    .maybeSingle<InviteRow>()

  if (!invite) {
    return (
      <InviteShell>
        <Notice tone="error">Această invitație nu există sau linkul nu este valid.</Notice>
      </InviteShell>
    )
  }

  if (invite.accepted_at || new Date(invite.expires_at).getTime() < Date.now()) {
    return (
      <InviteShell>
        <Notice tone="error">Linkul a expirat. Cere unul nou.</Notice>
      </InviteShell>
    )
  }

  const session = await getSession()

  if (session?.user) {
    const userEmail = (session.user.email ?? "").toLowerCase()
    if (userEmail !== invite.email.toLowerCase()) {
      return (
        <InviteShell>
          <Notice tone="error">
            Această invitație este pentru adresa{" "}
            <strong className="text-[#0A0A0A]">{invite.email}</strong>. Autentifică-te cu
            acea adresă ca să o accepți.
          </Notice>
        </InviteShell>
      )
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.rpc("accept_invite", { p_token: token })
    if (error) {
      return (
        <InviteShell>
          <Notice tone="error">{mapAuthError(error)}</Notice>
        </InviteShell>
      )
    }
    await writeAudit(invite.salon_id, "invite_accepted", "salon_invites", invite.id, {
      email: invite.email,
      role: invite.role,
    })
    redirect("/app")
  }

  return (
    <InviteShell>
      <div className="text-center">
        <p className="text-sm text-black/50">Ai fost invitat(ă) în salonul</p>
        <h2 className="mt-1 text-2xl font-bold text-[#0A0A0A] tracking-tight">
          {invite.salons?.name ?? "Salon"}
        </h2>
        <p className="mt-2 text-sm text-black/60">
          Rol: {ROLE_LABELS[invite.role] ?? invite.role} · Email invitat:{" "}
          <strong className="text-[#0A0A0A]">{invite.email}</strong>
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href={`/register?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0A0A0A] px-6 text-sm font-medium text-white hover:bg-[#0A0A0A]/90"
        >
          Creează un cont și acceptă invitația
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-black/15 bg-white px-6 text-sm font-medium text-[#0A0A0A] hover:bg-black/5"
        >
          Am deja cont — autentifică-mă
        </Link>
      </div>
      <p className="mt-4 text-center text-xs text-black/40">
        Trebuie să te autentifici cu adresa {invite.email} pentru a accepta invitația.
      </p>
    </InviteShell>
  )
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5F2] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img
            src="/asesor-logo.png"
            alt="ASESOR"
            className="h-9 w-9 rounded-full bg-[#0A0A0A] object-contain p-1 ring-1 ring-black/10 shrink-0"
          />
          <span className="text-xl font-semibold text-[#0A0A0A] tracking-tight">ASESOR</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function Notice({ tone, children }: { tone: "error"; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100"
          : ""
      }
    >
      {children}
    </div>
  )
}
