// Pure reviews/feedback helpers. No I/O — the real numbers come from
// feedback_requests via lib/data/feedback.ts.

export interface ReviewsConfig {
  enabled: boolean
  googleBusinessUrl: string
  googlePlaceId?: string
  hoursAfterAppointment: number
  minStarsForGoogle: number
  channel: "whatsapp" | "sms" | "email"
}

export const DEFAULT_REVIEWS_CONFIG: ReviewsConfig = {
  enabled: true,
  googleBusinessUrl: "",
  googlePlaceId: "",
  hoursAfterAppointment: 24,
  minStarsForGoogle: 4,
  channel: "whatsapp",
}

export interface ReviewsStats {
  total: number
  averageRating: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  recentComments: { rating: number; text: string; date: string }[]
}

export interface FeedbackStatRow {
  rating: number
  comment: string | null
  answered_at: string | null
  created_at: string
}

export function computeReviewsStats(rows: FeedbackStatRow[]): ReviewsStats {
  const answered = rows.filter((r) => r.answered_at !== null && r.rating !== null)
  const distribution: ReviewsStats["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  for (const row of answered) {
    const rating = row.rating as 1 | 2 | 3 | 4 | 5
    distribution[rating]++
    sum += rating
  }
  const recentComments = answered
    .filter((r) => r.comment !== null && r.comment.trim() !== "")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((r) => ({ rating: r.rating, text: r.comment as string, date: r.created_at }))
  return {
    total: answered.length,
    averageRating: answered.length === 0 ? 0 : sum / answered.length,
    distribution,
    recentComments,
  }
}

export function shouldRouteToGoogle(
  rating: number,
  config: ReviewsConfig = DEFAULT_REVIEWS_CONFIG,
): boolean {
  return rating >= config.minStarsForGoogle
}
