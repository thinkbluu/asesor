import { requireRole } from "@/lib/auth/session"

// Server-side guard: Setări is owner/manager only (staff and receptionists
// are blocked here, not just by hiding the sidebar link).
export default async function SetariLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["owner", "manager"])
  return <>{children}</>
}
