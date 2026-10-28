"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageSquare } from "lucide-react"
import type { ReviewsStats } from "@/lib/reviews"
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
            i <= Math.round(rating) ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

// Real feedback from feedback_requests (passed down from the server page).
export function ReviewsWidget({ stats }: { stats: ReviewsStats }) {
  const dist = stats.distribution
  const maxBar = Math.max(dist[1], dist[2], dist[3], dist[4], dist[5], 1)

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-600" />
              Feedback clienți
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Din sondajele trimise după programări finalizate.
            </p>
          </div>
          {stats.total > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold leading-none">{stats.averageRating.toFixed(1)}</p>
              <div className="mt-1 flex justify-end"><Stars rating={stats.averageRating} /></div>
              <p className="text-[11px] text-muted-foreground mt-1">{stats.total} răspunsuri</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.total === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Încă nu ai primit feedback. Sondajele pleacă automat după fiecare programare încasată.
          </p>
        ) : (
          <>
            {/* Distribution */}
            <div className="space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map(star => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-muted-foreground">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(dist[star] / maxBar) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{dist[star]}</span>
                </div>
              ))}
            </div>

            {/* Recent internal comments */}
            {stats.recentComments.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Mesaje recente de la clienți
                </p>
                <ul className="space-y-2">
                  {stats.recentComments.map((c, i) => (
                    <li key={i} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <Stars rating={c.rating} />
                        <span className="text-[11px] text-muted-foreground">{formatDate(c.date)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{c.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
