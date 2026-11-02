import type { Metadata } from "next"
import { requireRole } from "@/lib/auth/session"
import { getSegmentCounts } from "@/lib/data/marketing"
import { getReviewsStatsForSalon } from "@/lib/data/feedback"
import MarketingView from "@/components/app/marketing/marketing-view"
import { computeReviewsStats } from "@/lib/reviews"

export const metadata: Metadata = {
  title: "Marketing | ASESOR",
  description: "Segmente de clienți și feedback — campaniile vin în curând.",
}

// Server shell: real segment counts (clients + client_stats) and real
// feedback stats; the campaign UI stays but sending is disabled.
export default async function MarketingPage() {
  const session = await requireRole(["owner", "manager", "receptionist", "staff"])
  const salon = session.salon
  if (!salon) return null

  const [segments, reviewsStats] = await Promise.all([
    getSegmentCounts(salon.id),
    getReviewsStatsForSalon(salon.id),
  ])

  return (
    <MarketingView
      segments={segments ?? { all: 0, new30: 0, loyal: 0, inactive60: 0 }}
      reviewsStats={reviewsStats ?? computeReviewsStats([])}
    />
  )
}
