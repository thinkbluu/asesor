"use client"

import { useState } from "react"
import { Star, ExternalLink, Check, Heart, Loader2, AlertCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { SalonShell } from "@/components/booking/salon-shell"
import { cn } from "@/lib/utils"
import { submitFeedbackAction, type FeedbackSubmitResult } from "@/app/feedback/[token]/actions"
import type { FeedbackTokenState } from "@/lib/data/feedback"

type Phase = "rating" | "google" | "internal" | "submitted"

// Indexed access inline in props kept tripping the parser — alias it (see
// project gotcha on `T["K"]` indexed access).
type OpenFeedbackData = Extract<FeedbackTokenState, { status: "open" }>["data"]

export function FeedbackClient({
  state,
  token,
}: {
  state: FeedbackTokenState
  token: string
}) {
  if (state.status === "answered") return <ClosedState text="Am primit deja feedbackul tău. Îți mulțumim!" />
  if (state.status === "expired") {
    return <ClosedState text="Acest link a expirat. Sună la salon dacă mai vrei să ne scrii." />
  }
  return <OpenFeedback data={state.data} token={token} />
}

function ClosedState({ text }: { text: string }) {
  return (
    <SalonShell name="ASESOR" header={false}>
      <main className="bk-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div>
          <Heart style={{ width: 22, height: 22, color: "var(--acc)", margin: "0 auto 10px" }} aria-hidden="true" />
          <p className="bk-lede">{text}</p>
        </div>
      </main>
    </SalonShell>
  )
}

function OpenFeedback({
  data,
  token,
}: {
  data: OpenFeedbackData
  token: string
}) {
  const [phase, setPhase] = useState<Phase>("rating")
  const [hovered, setHovered] = useState<number | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const googleUrl = data.googleReviewUrl?.trim() || ""

  async function handleRate(r: number) {
    setRating(r)
    // High ratings go to Google only when the salon actually has a review
    // link configured; otherwise everyone gets the internal form.
    if (r >= data.minStarsForGoogle && googleUrl) {
      setPhase("google")
    } else {
      setPhase("internal")
    }
  }

  async function handleSubmit(routedToGoogle: boolean) {
    if (!rating || submitting) return
    setSubmitting(true)
    setError(null)
    const res: FeedbackSubmitResult = await submitFeedbackAction(
      token,
      rating,
      feedbackText.trim(),
      routedToGoogle,
    )
    setSubmitting(false)
    if (res.ok) {
      setPhase("submitted")
    } else if (res.reason === "used" || res.reason === "expired") {
      setError("Acest link nu mai este valabil.")
    } else {
      setError("Trimiterea a eșuat. Încearcă din nou.")
    }
  }

  const dateLabel = data.startsAt
    ? new Date(data.startsAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })
    : null

  return (
    <SalonShell
      name={data.salonName}
      logoUrl={data.logoUrl}
      accentColor={data.accentColor}
    >
      <main className="bk-main" style={{ paddingBottom: 40 }}>
        {/* Header — salon branding is in the shell; here: the personal note */}
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 className="bk-title">Cum a fost experiența ta?</h1>
          <p className="bk-lede">
            {data.clientFirstName ? `Mulțumim, ${data.clientFirstName}!` : "Mulțumim că ne-ai vizitat"}
            {dateLabel ? ` — ${dateLabel}` : ""}
          </p>
        </header>

        {phase === "rating" && (
          <section aria-label="Alege o notă">
            <p className="bk-lede" style={{ textAlign: "center", marginBottom: 14 }}>
              Alege o notă de la 1 la 5.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-label={`${r} din 5 stele`}
                  aria-pressed={(hovered ?? rating ?? 0) >= r}
                  onMouseEnter={() => setHovered(r)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleRate(r)}
                  className="bk-star"
                >
                  <Star
                    className={cn(
                      (hovered ?? rating ?? 0) >= r
                        ? "fill-[color:var(--acc)] text-[color:var(--acc)]"
                        : "text-[color:var(--satin)]",
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {phase === "google" && (
          <section style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
            <p className="bk-lede">
              Ne bucurăm că ai fost mulțumit(ă)! Ne poți ajuta cu o recenzie publică:
            </p>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="bk-btn" style={{ textDecoration: "none" }}>
              <ExternalLink style={{ width: 15, height: 15 }} aria-hidden="true" />
              Lasă o recenzie pe Google
            </a>
            <div className="bk-field" style={{ textAlign: "left", marginTop: 6 }}>
              <label htmlFor="fb-text" className="bk-label">
                Ai și ceva de transmis direct salonului? (opțional)
              </label>
              <Textarea
                id="fb-text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Scrie aici…"
                maxLength={1000}
                rows={3}
                className="bk-input"
              />
              <button
                type="button"
                className="bk-btn2"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Trimite salonului
              </button>
            </div>
          </section>
        )}

        {phase === "internal" && (
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="bk-lede" style={{ textAlign: "center" }}>
              Spune-ne ce am putea face mai bine. Mesajul ajunge direct la salon.
            </p>
            <div className="bk-field">
              <label htmlFor="fb-text" className="bk-label">
                Mesajul tău
              </label>
              <Textarea
                id="fb-text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Ce ar fi trebuit să facem diferit?"
                maxLength={1000}
                rows={4}
                className="bk-input"
              />
            </div>
            <button
              type="button"
              className="bk-btn"
              disabled={submitting || feedbackText.trim().length < 5}
              onClick={() => handleSubmit(false)}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Trimite feedbackul
            </button>
          </section>
        )}

        {phase === "submitted" && (
          <section style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 48, height: 48, borderRadius: "50%", margin: "0 auto",
                background: "var(--acc)", color: "var(--acc-ink)",
              }}
            >
              <Check style={{ width: 22, height: 22 }} aria-hidden="true" />
            </span>
            <p style={{ fontWeight: 500 }}>Mulțumim pentru feedback!</p>
            <p className="bk-lede">Mesajul tău a ajuns la {data.salonName}.</p>
          </section>
        )}

        {error && (
          <p role="alert" className="bk-ferr" style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <AlertCircle style={{ width: 14, height: 14 }} aria-hidden="true" /> {error}
          </p>
        )}
      </main>
    </SalonShell>
  )
}
