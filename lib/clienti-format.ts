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

// Etichetele sunt pastile neutre cu hairline (ca .tags din machetă) —
// segmentarea se citește din text, nu din culoare.
export const TAG_COLORS: Record<string, string> = {
  VIP: "border-border bg-card text-ink2",
  Nou: "border-border bg-card text-ink2",
  Inactiv: "border-border bg-card text-ink3",
  Frecvent: "border-border bg-card text-ink2",
  Sensibil: "border-border bg-card text-ink2",
  Fidel: "border-border bg-card text-ink2",
}
