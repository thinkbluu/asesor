// Google Reviews automation — types, config, mock data, and API hooks.
// Smart routing: 4-5 stars → Google review CTA; 1-3 stars → internal feedback.

export interface ReviewsConfig {
  enabled: boolean
  googleBusinessUrl: string // full Google Maps / Business Profile URL
  googlePlaceId?: string // optional Place ID for deep-linked review intent
  hoursAfterAppointment: number // when to send the satisfaction request
  minStarsForGoogle: number // threshold above which we redirect to Google (4 = 4-5 stars)
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
  date: string // ISO
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

// ──────────────────────────────────────────────────────────────────────────────
// Mock data (would come from Google Business Profile API in production)
// ──────────────────────────────────────────────────────────────────────────────

export const MOCK_GOOGLE_REVIEWS: GoogleReview[] = [
  {
    id: "gr_1",
    author: "Alexandra M.",
    rating: 5,
    text: "Servicii impecabile! Ana este extrem de profesionistă și atentă la detalii. Recomand cu toată încrederea.",
    date: "2026-04-18",
    responded: true,
  },
  {
    id: "gr_2",
    author: "Ioana D.",
    rating: 5,
    text: "Cel mai frumos salon din zonă. Atmosfera este relaxantă și rezultatul întotdeauna peste așteptări.",
    date: "2026-04-14",
    responded: true,
  },
  {
    id: "gr_3",
    author: "Cristian P.",
    rating: 4,
    text: "Tuns clasic excelent. Singura observație ar fi timpul de așteptare puțin mai lung decât mă așteptam.",
    date: "2026-04-10",
    responded: false,
  },
  {
    id: "gr_4",
    author: "Maria G.",
    rating: 5,
    text: "Mulțumesc echipei pentru răbdare și pentru vopseaua perfectă. Ne vedem luna viitoare!",
    date: "2026-04-05",
    responded: true,
  },
  {
    id: "gr_5",
    author: "Elena S.",
    rating: 5,
    text: "Manichiură superbă, exact cum mi-am dorit. Cristina este o artistă.",
    date: "2026-03-28",
    responded: true,
  },
  {
    id: "gr_6",
    author: "Andreea V.",
    rating: 4,
    text: "Servicii bune, personal amabil. Aș aprecia o zonă de așteptare puțin mai confortabilă.",
    date: "2026-03-22",
    responded: false,
  },
]

export const MOCK_INTERNAL_FEEDBACK: InternalFeedback[] = [
  {
    id: "if_1",
    clientId: "2",
    appointmentId: "a-past-2",
    rating: 2,
    text: "A trebuit să aștept peste 20 de minute după ora programată. În rest, serviciul a fost ok.",
    date: "2026-04-11",
    resolved: false,
  },
  {
    id: "if_2",
    clientId: "3",
    appointmentId: "a-past-3",
    rating: 3,
    text: "Tunsoarea a fost bună, dar culoarea nu a ieșit exact cum am discutat.",
    date: "2026-03-30",
    resolved: true,
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// Aggregations
// ──────────────────────────────────────────────────────────────────────────────

export interface ReviewsStats {
  total: number
  averageRating: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  unresponded: number
}

export function getReviewsStats(reviews: GoogleReview[] = MOCK_GOOGLE_REVIEWS): ReviewsStats {
  const total = reviews.length
  const dist: ReviewsStats["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  let unresponded = 0
  for (const r of reviews) {
    dist[r.rating]++
    sum += r.rating
    if (!r.responded) unresponded++
  }
  return {
    total,
    averageRating: total === 0 ? 0 : sum / total,
    distribution: dist,
    unresponded,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Smart routing helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Given a rating, decide if the client should be redirected to Google Reviews
 * or shown an internal feedback form.
 */
export function shouldRouteToGoogle(rating: number, cfg: ReviewsConfig = DEFAULT_REVIEWS_CONFIG): boolean {
  return rating >= cfg.minStarsForGoogle
}

// ──────────────────────────────────────────────────────────────────────────────
// API hooks — TODO: wire to backend + Google Business Profile API
// ──────────────────────────────────────────────────────────────────────────────

/** Record the satisfaction click (star rating) for audit / analytics. */
export async function recordSatisfactionRating(params: {
  appointmentId: string
  rating: number
}): Promise<{ ok: true }> {
  // TODO: INSERT INTO satisfaction_ratings …
  void params
  return { ok: true }
}

/** Save internal feedback for 1-3 star responses. */
export async function submitInternalFeedback(params: {
  appointmentId: string
  clientId: string
  rating: 1 | 2 | 3
  text: string
}): Promise<InternalFeedback> {
  const fb: InternalFeedback = {
    id: `if_${Date.now()}`,
    clientId: params.clientId,
    appointmentId: params.appointmentId,
    rating: params.rating,
    text: params.text,
    date: new Date().toISOString().slice(0, 10),
    resolved: false,
  }
  // TODO: INSERT INTO internal_feedback …
  return fb
}

/** Trigger the satisfaction request via the configured channel. */
export async function triggerSatisfactionRequest(params: {
  appointmentId: string
  cfg?: ReviewsConfig
}): Promise<{ scheduled: true; channel: ReviewsConfig["channel"]; sendAt: string }> {
  const cfg = params.cfg ?? DEFAULT_REVIEWS_CONFIG
  const sendAt = new Date(Date.now() + cfg.hoursAfterAppointment * 60 * 60 * 1000).toISOString()
  // TODO: enqueue background job to send via WhatsApp/SMS/Email with
  // a link to /feedback/{appointmentId}
  return { scheduled: true, channel: cfg.channel, sendAt }
}

/** Fetch latest reviews from Google Business Profile API. */
export async function fetchGoogleReviews(): Promise<GoogleReview[]> {
  // TODO: call https://mybusiness.googleapis.com/v4/accounts/{account}/locations/{loc}/reviews
  return MOCK_GOOGLE_REVIEWS
}
