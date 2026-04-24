"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Star, ExternalLink, Check, Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  DEFAULT_REVIEWS_CONFIG,
  shouldRouteToGoogle,
  submitInternalFeedback,
  recordSatisfactionRating,
} from "@/lib/reviews"

type Phase = "rating" | "google" | "internal" | "submitted"

const SALON_NAME = "Beauty Studio"

export default function FeedbackPage() {
  const params = useParams<{ id: string }>()
  const appointmentId = params?.id ?? "unknown"

  const cfg = DEFAULT_REVIEWS_CONFIG
  const [phase, setPhase] = useState<Phase>("rating")
  const [hovered, setHovered] = useState<number | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleRate(r: number) {
    setRating(r)
    await recordSatisfactionRating({ appointmentId, rating: r })
    setPhase(shouldRouteToGoogle(r, cfg) ? "google" : "internal")
  }

  async function handleSubmitInternal() {
    if (!rating || feedbackText.trim().length < 5) return
    setSubmitting(true)
    await submitInternalFeedback({
      appointmentId,
      clientId: "unknown", // resolved server-side in production
      rating: rating as 1 | 2 | 3,
      text: feedbackText.trim(),
    })
    setSubmitting(false)
    setPhase("submitted")
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 mb-3">
            <Heart className="h-6 w-6 text-[#0A0A0A]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{SALON_NAME}</h1>
          <p className="mt-1 text-sm text-white/60">
            Mulțumim că ne-ai vizitat
          </p>
        </header>

        {/* Rating phase */}
        {phase === "rating" && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-center">
              Cum a fost experiența ta?
            </h2>
            <p className="mt-1 text-sm text-white/60 text-center">
              Părerea ta ne ajută să ne îmbunătățim.
            </p>

            <div
              className="mt-6 flex items-center justify-center gap-2"
              onMouseLeave={() => setHovered(null)}
            >
              {[1, 2, 3, 4, 5].map(i => {
                const active = (hovered ?? rating ?? 0) >= i
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${i} ${i === 1 ? "stea" : "stele"}`}
                    onMouseEnter={() => setHovered(i)}
                    onClick={() => handleRate(i)}
                    className="p-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] rounded-lg"
                  >
                    <Star
                      className={cn(
                        "h-10 w-10 transition-colors",
                        active
                          ? "fill-emerald-400 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                          : "text-white/20"
                      )}
                    />
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-white/40">
              <span>Foarte slab</span>
              <span>Excelent</span>
            </div>
          </section>
        )}

        {/* Google redirect (4-5 stars) */}
        {phase === "google" && (
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="mb-3 flex items-center justify-center gap-1">
              {Array.from({ length: rating ?? 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-emerald-400 text-emerald-400" />
              ))}
            </div>
            <h2 className="text-xl font-semibold">Super! Ne bucurăm că ți-a plăcut!</h2>
            <p className="mt-2 text-sm text-white/70">
              Ne-ar ajuta enorm dacă ai împărtăși experiența ta și pe Google —
              durează mai puțin de un minut.
            </p>
            <Button
              asChild
              className="mt-6 w-full bg-emerald-500 text-[#0A0A0A] hover:bg-emerald-400 font-semibold h-11"
            >
              <a href={cfg.googleBusinessUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Lasă o recenzie pe Google
              </a>
            </Button>
            <button
              type="button"
              onClick={() => setPhase("submitted")}
              className="mt-3 text-xs text-white/50 hover:text-white/80 underline underline-offset-2"
            >
              Poate mai târziu
            </button>
          </section>
        )}

        {/* Internal feedback (1-3 stars) */}
        {phase === "internal" && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-5 w-5",
                    i < (rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-white/15"
                  )}
                />
              ))}
            </div>
            <h2 className="text-lg font-semibold text-center">
              Ne pare rău că nu a fost perfect.
            </h2>
            <p className="mt-1 text-sm text-white/60 text-center">
              Spune-ne ce putem îmbunătăți — feedback-ul tău rămâne privat
              și ajunge direct la managerul salonului.
            </p>

            <Textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Ce nu a fost în regulă? Ce putem face mai bine data viitoare?"
              className="mt-5 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500"
              maxLength={1000}
            />
            <div className="mt-1 flex justify-between text-xs text-white/40">
              <span>{feedbackText.length < 5 ? "Minimum 5 caractere" : "Mulțumim că ne ajuți să ne îmbunătățim"}</span>
              <span>{feedbackText.length}/1000</span>
            </div>

            <Button
              onClick={handleSubmitInternal}
              disabled={feedbackText.trim().length < 5 || submitting}
              className="mt-5 w-full bg-emerald-500 text-[#0A0A0A] hover:bg-emerald-400 disabled:opacity-50 font-semibold h-11"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se trimite…
                </>
              ) : (
                "Trimite feedback"
              )}
            </Button>

            <p className="mt-3 text-center text-[11px] text-white/40">
              Acest mesaj este privat și nu apare public nicăieri.
            </p>
          </section>
        )}

        {/* Thank you */}
        {phase === "submitted" && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold">Mulțumim!</h2>
            <p className="mt-2 text-sm text-white/70">
              Feedback-ul tău a fost înregistrat. Te așteptăm cu drag la următoarea vizită.
            </p>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-6 text-center text-[11px] text-white/30">
          Powered by ASESOR · <span className="font-mono">#{appointmentId}</span>
        </footer>
      </div>
    </main>
  )
}
