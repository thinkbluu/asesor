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
  googleBusinessUrl: "https://g.page/r/CXxxxxxxxxxxxx/review",
  googlePlaceId: "",
  hoursAfterAppointment: 24,
  minStarsForGoogle: 4,
  channel: "whatsapp",
}

export interface GoogleReview {
  id: string
  author: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  date: string
  responded: boolean
}

export interface InternalFeedback {
  id: string
  clientId: string
  appointmentId: string
  rating: 1 | 2 | 3
  text: string
  date: string
  resolved: boolean
}

export interface ReviewsStats {
  total: number
  averageRating: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  unresponded: number
}

export function getReviewsStats(reviews: GoogleReview[] = []): ReviewsStats {
  const total = reviews.length
  const distribution: ReviewsStats["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  let unresponded = 0
  for (const review of reviews) {
    distribution[review.rating]++
    sum += review.rating
    if (!review.responded) unresponded++
  }
  return {
    total,
    averageRating: total === 0 ? 0 : sum / total,
    distribution,
    unresponded,
  }
}

export function shouldRouteToGoogle(
  rating: number,
  config: ReviewsConfig = DEFAULT_REVIEWS_CONFIG,
): boolean {
  return rating >= config.minStarsForGoogle
}

export async function recordSatisfactionRating(params: {
  appointmentId: string
  rating: number
}): Promise<{ ok: true }> {
  void params
  return { ok: true }
}

export async function submitInternalFeedback(params: {
  appointmentId: string
  clientId: string
  rating: 1 | 2 | 3
  text: string
}): Promise<InternalFeedback> {
  return {
    id: `if_${Date.now()}`,
    clientId: params.clientId,
    appointmentId: params.appointmentId,
    rating: params.rating,
    text: params.text,
    date: new Date().toISOString().slice(0, 10),
    resolved: false,
  }
}
