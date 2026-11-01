import Link from "next/link"
import { createHash } from "node:crypto"
import { redirect } from "next/navigation"
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { isSupabaseAdminConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin"
import { AuthShell } from "@/components/auth/auth-shell"
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
      <AuthShell title="Invitație în salon">
        <div className="au-alert" style={{ marginTop: 18 }}>
          Autentificarea va fi disponibilă în curând.
        </div>
      </AuthShell>
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
      <AuthShell title="Invitație în salon">
        <div role="alert" className="au-alert err" style={{ marginTop: 18 }}>
          Această invitație nu există sau linkul nu este valid.
        </div>
      </AuthShell>
    )
  }

  if (invite.accepted_at || new Date(invite.expires_at).getTime() < Date.now()) {
    return (
      <AuthShell title="Invitație în salon">
        <div role="alert" className="au-alert err" style={{ marginTop: 18 }}>
          Linkul a expirat. Cere unul nou.
        </div>
      </AuthShell>
    )
  }

  const session = await getSession()

  if (session?.user) {
    const userEmail = (session.user.email ?? "").toLowerCase()
    if (userEmail !== invite.email.toLowerCase()) {
      return (
        <AuthShell title="Invitație în salon">
          <div role="alert" className="au-alert err" style={{ marginTop: 18 }}>
            Această invitație este pentru adresa <strong>{invite.email}</strong>. Autentifică-te cu
            acea adresă ca să o accepți.
          </div>
        </AuthShell>
      )
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.rpc("accept_invite", { p_token: token })
    if (error) {
      return (
        <AuthShell title="Invitație în salon">
          <div role="alert" className="au-alert err" style={{ marginTop: 18 }}>
            {mapAuthError(error)}
          </div>
        </AuthShell>
      )
    }
    await writeAudit(invite.salon_id, "invite_accepted", "salon_invites", invite.id, {
      email: invite.email,
      role: invite.role,
    })
    redirect("/app")
  }

  return (
    <AuthShell title="Invitație în salon">
      <div className="au-center" style={{ marginTop: 16 }}>
        <p className="au-hint">Ai fost invitat(ă) în salonul</p>
        <p
          style={{
            font: "400 26px/1.15 var(--serif)",
            letterSpacing: "-.01em",
            fontVariationSettings: '"opsz" 96',
            marginTop: 6,
          }}
        >
          {invite.salons?.name ?? "Salon"}
        </p>
        <p className="au-sub" style={{ marginTop: 10 }}>
          Rol: {ROLE_LABELS[invite.role] ?? invite.role} · Email invitat: <strong>{invite.email}</strong>
        </p>
      </div>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        <Link
          href={`/register?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`}
          className="au-btn"
          style={{ textDecoration: "none" }}
        >
          Creează un cont și acceptă invitația
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
          className="au-btn2"
          style={{ textDecoration: "none" }}
        >
          Am deja cont — autentifică-mă
        </Link>
      </div>
      <p className="au-hint au-center" style={{ marginTop: 16 }}>
        Trebuie să te autentifici cu adresa {invite.email} pentru a accepta invitația.
      </p>
    </AuthShell>
  )
}
