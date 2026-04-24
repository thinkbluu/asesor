"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ExternalLink, MessageSquare } from "lucide-react"
import { MOCK_GOOGLE_REVIEWS, getReviewsStats } from "@/lib/reviews"
import { cn } from "@/lib/utils"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            size === "sm" ? "h-3 w-3" : "h-4 w-4",
            i <= rating ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

export function ReviewsWidget() {
  const reviews = MOCK_GOOGLE_REVIEWS
  const stats = getReviewsStats(reviews)
  const recent = [...reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

  const dist = stats.distribution
  const maxBar = Math.max(dist[1], dist[2], dist[3], dist[4], dist[5], 1)

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-600 fill-emerald-500" />
              Recenzii Google
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Sincronizat din Google Business Profile
            </p>
          </div>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" asChild>
            <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              Deschide
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Total recenzii</p>
            <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-xs text-muted-foreground mb-1">Rating mediu</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                {stats.averageRating.toFixed(1)}
              </p>
              <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">De răspuns</p>
            <p className="text-2xl font-bold tabular-nums">
              {stats.unresponded}
              {stats.unresponded > 0 && (
                <Badge className="ml-2 text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30 align-middle">
                  nou
                </Badge>
              )}
            </p>
          </div>
        </div>

        {/* Rating distribution */}
        <div className="space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map(r => (
            <div key={r} className="flex items-center gap-2 text-xs">
              <span className="w-4 font-medium tabular-nums">{r}</span>
              <Star className="h-3 w-3 fill-emerald-500 text-emerald-500 shrink-0" />
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    r >= 4 ? "bg-emerald-500" : r === 3 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${(dist[r] / maxBar) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right tabular-nums text-muted-foreground">{dist[r]}</span>
            </div>
          ))}
        </div>

        {/* Recent reviews */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recente
            </p>
            <button type="button" className="text-xs text-emerald-600 hover:underline">
              Vezi toate ({stats.total})
            </button>
          </div>
          <ul className="space-y-2">
            {recent.map(rev => (
              <li
                key={rev.id}
                className="rounded-lg border border-border bg-background p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium truncate">{rev.author}</p>
                    <Stars rating={rev.rating} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">{formatDate(rev.date)}</span>
                    {!rev.responded && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
                        nerăspuns
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{rev.text}</p>
                {!rev.responded && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Răspunde
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
