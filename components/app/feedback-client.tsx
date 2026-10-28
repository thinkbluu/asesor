"use client"

import { useState } from "react"
import { Star, ExternalLink, Check, Heart, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { submitFeedbackAction, type FeedbackSubmitResult } from "@/app/feedback/[token]/actions"
import type { FeedbackTokenState } from "@/lib/data/feedback"

type Phase = "rating" | "google" | "internal" | "submitted"

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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <Heart className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </main>
  )
}

function OpenFeedback({
  data,
  token,
}: {
  data: Extract<FeedbackTokenState, { status: "open" }>["data"]
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header — salon branding */}
        <header className="mb-8 text-center">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt={data.salonName}
              className="mx-auto mb-3 h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div
              className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: data.accentColor ?? "var(--accent)" }}
            >
              <Heart className="h-6 w-6 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{data.salonName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.clientFirstName ? `Mulțumim, ${data.clientFirstName}!` : "Mulțumim că ne-ai vizitat"}
            {dateLabel ? ` — ${dateLabel}` : ""}
          </p>
        </header>

        {phase === "rating" && (
          <section aria-label="Alege o notă">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Cum a fost experiența ta?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-label={`${r} din 5 stele`}
                  onMouseEnter={() => setHovered(r)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleRate(r)}
                  className="rounded-lg p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors",
                      (hovered ?? rating ?? 0) >= r
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {phase === "google" && (
          <section className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ne bucurăm că ai fost mulțumit(ă)! Ne poți ajuta cu o recenzie publică:
            </p>
            <Button asChild className="w-full">
              <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Lasă o recenzie pe Google
              </a>
            </Button>
            <div className="space-y-2 pt-2 text-left">
              <label htmlFor="fb-text" className="text-sm font-medium">
                Ai și ceva de transmis direct salonului? (opțional)
              </label>
              <Textarea
                id="fb-text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Scrie aici…"
                maxLength={1000}
                rows={3}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Trimite salonului
              </Button>
            </div>
          </section>
        )}

        {phase === "internal" && (
          <section className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Spune-ne ce am putea face mai bine. Mesajul ajunge direct la salon.
            </p>
            <div className="space-y-2">
              <label htmlFor="fb-text" className="text-sm font-medium">
                Mesajul tău
              </label>
              <Textarea
                id="fb-text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Ce ar fi trebuit să facem diferit?"
                maxLength={1000}
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              disabled={submitting || feedbackText.trim().length < 5}
              onClick={() => handleSubmit(false)}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Trimite feedbackul
            </Button>
          </section>
        )}

        {phase === "submitted" && (
          <section className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-medium">Mulțumim pentru feedback!</p>
            <p className="text-sm text-muted-foreground">
              Mesajul tău a ajuns la {data.salonName}.
            </p>
          </section>
        )}

        {error && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-red-500" role="alert">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}
      </div>
    </main>
  )
}
