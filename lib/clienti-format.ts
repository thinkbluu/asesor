// Display helpers shared by the clienti UI. Pure functions only — the real
// Supabase-backed pages under /app/clienti do not depend on any mock module.

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function getInitials(prenume: string, nume: string): string {
  return `${prenume[0] ?? ""}${nume[0] ?? ""}`.toUpperCase()
}

export const TAG_COLORS: Record<string, string> = {
  VIP: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Nou: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Inactiv: "bg-red-500/15 text-red-500 border-red-500/30",
  Frecvent: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Sensibil: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  Fidel: "bg-pink-500/15 text-pink-600 border-pink-500/30",
}
