import "server-only"

// Server-side session helpers. Every app server component and server action
// should use getSession() / requireRole() from here on.

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { SALON_COOKIE } from "./constants"

export type AppRole = Database["public"]["Enums"]["member_role"]

type MemberRow = Database["public"]["Tables"]["salon_members"]["Row"]
type SalonRow = Database["public"]["Tables"]["salons"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

export type Session = {
  user: User
  profile: ProfileRow | null
  salon: SalonRow | null
  role: AppRole | null
  staffId: string | null
  memberships: Pick<MemberRow, "salon_id" | "role" | "staff_id">[]
}

/**
 * Returns the signed-in user with their active salon membership, or null when
 * not signed in (or when Supabase is not configured). If the user belongs to
 * several salons, the one stored in the `asesor_salon` cookie wins, otherwise
 * the first membership.
 */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("salon_members")
      .select("salon_id, role, staff_id")
      .eq("user_id", user.id),
  ])

  const rows = (memberships ?? []) as Pick<MemberRow, "salon_id" | "role" | "staff_id">[]

  if (rows.length === 0) {
    return { user, profile: (profile as ProfileRow | null) ?? null, salon: null, role: null, staffId: null, memberships: [] }
  }

  const cookieStore = await cookies()
  const preferred = cookieStore.get(SALON_COOKIE)?.value
  const chosen =
    (preferred && rows.find((m) => m.salon_id === preferred)) || rows[0]

  let salon: SalonRow | null = null
  if (chosen) {
    const { data } = await supabase
      .from("salons")
      .select("*")
      .eq("id", chosen.salon_id)
      .maybeSingle()
    salon = (data as SalonRow | null) ?? null
  }

  return {
    user,
    profile: (profile as ProfileRow | null) ?? null,
    salon,
    role: chosen?.role ?? null,
    staffId: chosen?.staff_id ?? null,
    memberships: rows,
  }
}

/**
 * Guard for app server components and server actions. Redirects:
 *  - not signed in → /login
 *  - signed in without a salon membership → /app/onboarding
 *  - signed in with a role outside `roles` → /app?error=forbidden
 */
export async function requireRole(roles: AppRole[]): Promise<Session> {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!session.salon || !session.role) redirect("/app/onboarding")
  if (!roles.includes(session.role)) redirect("/app?error=forbidden")
  return session
}

/** Roles that manage the business: owner and manager. */
export const MANAGEMENT_ROLES: AppRole[] = ["owner", "manager"]
