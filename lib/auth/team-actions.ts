"use server"

// Team management ("Echipă și acces" tab): invite by email, change role,
// remove member. All actions re-verify the caller's role server-side and rely
// on RLS as the backstop.

import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { writeAudit } from "@/lib/audit"
import { sendMessage } from "@/lib/messaging"
import { aal2Required, MFA_REQUIRED, type MfaRequired } from "@/lib/auth/mfa"
import { getSession, MANAGEMENT_ROLES } from "./session"
import type { AppRole } from "./session"
import { billingGuard } from "@/lib/billing/guard"

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string }
  | MfaRequired

const ROLES: AppRole[] = ["owner", "manager", "staff", "receptionist"]

const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Proprietar",
  manager: "Manager",
  receptionist: "Receptionist",
  staff: "Specialist",
}

function isRole(value: unknown): value is AppRole {
  return typeof value === "string" && ROLES.includes(value as AppRole)
}

async function requireManagerSession() {
  const session = await getSession()
  if (!session) return { error: "Sesiune expirată. Autentifică-te din nou." as const, session: null }
  if (!session.salon || !session.role || !MANAGEMENT_ROLES.includes(session.role)) {
    return { error: "Nu ai permisiunea să gestionezi echipa." as const, session: null }
  }
  return { error: null, session }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

async function buildInviteUrl(token: string): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}/invite/${token}`
}

export async function inviteMember(
  email: string,
  role: string,
  staffId?: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const guard = await requireManagerSession()
  if (!guard.session) return { ok: false, error: guard.error }

  const normalizedEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "Adresa de email nu este validă." }
  }
  if (!isRole(role)) {
    return { ok: false, error: "Rolul selectat nu este valid." }
  }

  const supabase = await createSupabaseServerClient()
  const salonId = guard.session.salon!.id

  // "Invită în aplicație" from /app/echipa: the invite is tied to the staff
  // record so accept_invite links the new member to that specialist.
  let verifiedStaffId: string | null = null
  if (staffId) {
    const { data: staffRow } = await supabase
      .from("staff")
      .select("id")
      .eq("id", staffId)
      .eq("salon_id", salonId)
      .is("deleted_at", null)
      .maybeSingle()
    if (!staffRow) return { ok: false, error: "Specialistul nu a fost găsit." }
    verifiedStaffId = staffRow.id
  }

  // One pending invite per email per salon; accept_invite() itself rejects
  // users who are already members when they redeem the link.
  const { data: pendingInvite } = await supabase
    .from("salon_invites")
    .select("id")
    .eq("salon_id", salonId)
    .eq("email", normalizedEmail)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()
  if (pendingInvite) {
    return { ok: false, error: "Există deja o invitație în așteptare pentru acest email." }
  }

  // Only the sha256 hash is stored; the raw token exists solely in the
  // invite link shown to the manager.
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from("salon_invites").insert({
    salon_id: salonId,
    email: normalizedEmail,
    role,
    staff_id: verifiedStaffId,
    token_hash: sha256(token),
    expires_at: expiresAt,
    invited_by: guard.session.user.id,
  })
  if (error) return { ok: false, error: "Invitația nu a putut fi creată. Încearcă din nou." }

  await writeAudit(salonId, "invite_created", "salon_invites", null, {
    email: normalizedEmail,
    role,
    staff_id: verifiedStaffId,
  })

  const inviteUrl = await buildInviteUrl(token)

  // P12: email the invite (the copyable link stays as fallback in the UI).
  // Fire-and-forget — an email failure must not fail the invite itself.
  const salon = guard.session.salon
  if (salon) {
    const branding = (salon.branding ?? {}) as Record<string, unknown>
    try {
      await sendMessage({
        salonId: salon.id,
        kind: "invitatie_echipa",
        to: normalizedEmail,
        data: {
          salon: {
            name: salon.name,
            accentColor:
              typeof branding.primary_color === "string" ? branding.primary_color : null,
            logoUrl: typeof branding.logo_url === "string" ? branding.logo_url : null,
            address: salon.address,
            city: salon.city,
            phone: salon.phone ?? "",
          },
          inviteUrl,
          roleLabel: ROLE_LABELS[role],
          inviterName: guard.session.profile?.full_name ?? null,
          expiresInDays: 7,
        },
      })
    } catch (err) {
      console.error("[v0] invite email failed:", err)
    }
  }

  revalidatePath("/app/setari")
  revalidatePath("/app/echipa")
  return { ok: true, url: inviteUrl }
}

export async function changeMemberRole(memberId: string, role: string): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const guard = await requireManagerSession()
  if (!guard.session) return { ok: false, error: guard.error }
  if (!isRole(role)) return { ok: false, error: "Rolul selectat nu este valid." }

  const supabase = await createSupabaseServerClient()
  if (await aal2Required(supabase)) return MFA_REQUIRED
  const salonId = guard.session.salon!.id

  const { data: member } = await supabase
    .from("salon_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("salon_id", salonId)
    .maybeSingle()
  if (!member) return { ok: false, error: "Membrul nu a fost găsit." }
  if (member.role === role) return { ok: true }

  if (member.role === "owner" && role !== "owner") {
    const { count } = await supabase
      .from("salon_members")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("role", "owner")
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "Nu poți schimba rolul ultimului proprietar." }
    }
  }

  const { error } = await supabase
    .from("salon_members")
    .update({ role })
    .eq("id", memberId)
    .eq("salon_id", salonId)
  if (error) return { ok: false, error: "Rolul nu a putut fi schimbat. Încearcă din nou." }

  await writeAudit(salonId, "change_member_role", "salon_members", memberId, {
    from: member.role,
    to: role,
  })

  revalidatePath("/app/setari")
  return { ok: true }
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const guard = await requireManagerSession()
  if (!guard.session) return { ok: false, error: guard.error }

  const supabase = await createSupabaseServerClient()
  if (await aal2Required(supabase)) return MFA_REQUIRED
  const salonId = guard.session.salon!.id

  const { data: member } = await supabase
    .from("salon_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("salon_id", salonId)
    .maybeSingle()
  if (!member) return { ok: false, error: "Membrul nu a fost găsit." }

  if (member.role === "owner") {
    const { count } = await supabase
      .from("salon_members")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("role", "owner")
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "Nu poți elimina ultimul proprietar al salonului." }
    }
  }

  const { error } = await supabase
    .from("salon_members")
    .delete()
    .eq("id", memberId)
    .eq("salon_id", salonId)
  if (error) return { ok: false, error: "Membrul nu a putut fi eliminat. Încearcă din nou." }

  await writeAudit(salonId, "remove_member", "salon_members", memberId, {
    role: member.role,
  })

  revalidatePath("/app/setari")
  return { ok: true }
}
