import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { SegmentCounts } from "@/lib/marketing"

// Real segment counts for the marketing page. Definitions:
//   all        — every client of the salon
//   new30      — created in the last 30 days
//   loyal      — total_visits >= 5 (from the client_stats view, scripts/010)
//   inactive60 — no visit in the last 60 days (or never visited and created
//                more than 60 days ago)
export async function getSegmentCounts(salonId: string): Promise<SegmentCounts | null> {
  const supabase = createSupabaseServerClient()

  const [clientsRes, statsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, created_at")
      .eq("salon_id", salonId),
    supabase
      .from("client_stats")
      .select("client_id, total_visits, last_visit_at")
      .eq("salon_id", salonId),
  ])

  if (clientsRes.error || statsRes.error) {
    console.error(
      "[v0] segment counts failed:",
      clientsRes.error?.message ?? statsRes.error?.message,
    )
    return null
  }

  const clients = (clientsRes.data ?? []) as { id: string; created_at: string }[]
  const stats = new Map(
    ((statsRes.data ?? []) as {
      client_id: string
      total_visits: number | null
      last_visit_at: string | null
    }[]).map((s) => [s.client_id, s]),
  )

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  let new30 = 0
  let loyal = 0
  let inactive60 = 0
  for (const c of clients) {
    const s = stats.get(c.id)
    if (s && (s.total_visits ?? 0) >= 5) loyal++
    const lastVisit = s?.last_visit_at ? new Date(s.last_visit_at).getTime() : null
    const created = new Date(c.created_at).getTime()
    if (now - created <= 30 * day) new30++
    if (lastVisit === null ? now - created > 60 * day : now - lastVisit > 60 * day) inactive60++
  }

  return { all: clients.length, new30, loyal, inactive60 }
}
