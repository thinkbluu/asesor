import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { computeReviewsStats, type FeedbackStatRow, type ReviewsStats } from "@/lib/reviews"

// Feedback requests: token lookup for the public page (admin client — the
// table is RLS-guarded for members, the token holder is not authenticated)
// and stats for the app surfaces (RLS as the signed-in user).

export type FeedbackTokenState =
  | { status: "open"; data: FeedbackTokenData }
  | { status: "answered" }
  | { status: "expired" }

export interface FeedbackTokenData {
  salonName: string
  salonPhone: string
  accentColor: string | null
  logoUrl: string | null
  googleReviewUrl: string | null
  minStarsForGoogle: number
  clientFirstName: string | null
  startsAt: string | null
}

export async function getFeedbackByToken(
  tokenHash: string,
): Promise<FeedbackTokenState | null> {
  const admin = createSupabaseAdminClient()

  const { data, error } = await admin
    .from("feedback_requests")
    .select(
      `rating,
       answered_at,
       expires_at,
       salons (name, phone, accent_color, logo_url, google_review_url, reviews_config),
       clients (first_name),
       appointments (starts_at)`,
    )
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (error) {
    console.error("[v0] feedback token lookup failed:", error.message)
    return null
  }
  if (!data) return null

  const salon = data.salons as unknown as {
    name: string
    phone: string
    accent_color: string | null
    logo_url: string | null
    google_review_url: string | null
    reviews_config: Record<string, unknown> | null
  } | null
  if (!salon) return null

  if (data.answered_at !== null) return { status: "answered" }
  if (new Date(data.expires_at).getTime() < Date.now()) return { status: "expired" }

  const rawCfg = (salon.reviews_config ?? {}) as Record<string, unknown>
  const client = data.clients as unknown as { first_name: string } | null
  const appointment = data.appointments as unknown as { starts_at: string } | null

  return {
    status: "open",
    data: {
      salonName: salon.name,
      salonPhone: salon.phone,
      accentColor: salon.accent_color,
      logoUrl: salon.logo_url,
      googleReviewUrl: salon.google_review_url,
      minStarsForGoogle:
        typeof rawCfg.min_stars_for_google === "number"
          ? rawCfg.min_stars_for_google
          : 4,
      clientFirstName: client?.first_name ?? null,
      startsAt: appointment?.starts_at ?? null,
    },
  }
}

export async function getReviewsStatsForSalon(salonId: string): Promise<ReviewsStats> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("feedback_requests")
    .select("rating, comment, answered_at, created_at")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("[v0] feedback stats query failed:", error.message)
    return computeReviewsStats([])
  }
  return computeReviewsStats((data ?? []) as unknown as FeedbackStatRow[])
}
