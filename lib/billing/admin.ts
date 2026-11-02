import "server-only"

// Platform admins are listed by e-mail in ASESOR_ADMIN_EMAILS (comma separated).
// Missing/empty variable means nobody is an admin.
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const raw = process.env.ASESOR_ADMIN_EMAILS
  if (!raw) return false
  const wanted = email.trim().toLowerCase()
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(wanted)
}
