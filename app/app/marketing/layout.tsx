import { requireRole } from "@/lib/auth/session"

// Server-side guard: Marketing is owner/manager only (staff and receptionists
// are blocked here, not just by hiding the sidebar link).
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["owner", "manager"])
  return <>{children}</>
}
