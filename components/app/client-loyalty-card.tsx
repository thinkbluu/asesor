"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Award, Gift, TrendingUp, Clock, Minus, Plus as PlusIcon, Crown } from "lucide-react"
import {
  DEFAULT_LOYALTY_CONFIG,
  formatPoints,
  getLevelForLifetimePoints,
  getLifetimePoints,
  getLoyaltyHistory,
  getNextLevel,
  type LoyaltyTransaction,
} from "@/lib/loyalty"
import { cn } from "@/lib/utils"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })
}

const TYPE_BADGES: Record<LoyaltyTransaction["type"], { label: string; className: string; icon: typeof PlusIcon }> = {
  earned: { label: "Acumulate", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: PlusIcon },
  bonus: { label: "Bonus", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: Award },
  redeemed: { label: "Folosite", className: "bg-slate-500/15 text-slate-600 border-slate-500/30", icon: Minus },
  expired: { label: "Expirate", className: "bg-red-500/10 text-red-500 border-red-500/30", icon: Clock },
  adjustment: { label: "Ajustare", className: "bg-muted text-muted-foreground border-border", icon: TrendingUp },
}

export function ClientLoyaltyCard({ clientId, balance }: { clientId: string; balance: number }) {
  const history = getLoyaltyHistory(clientId)
  const lifetime = getLifetimePoints(clientId)
  const currentLevel = getLevelForLifetimePoints(lifetime)
  const nextLevel = getNextLevel(currentLevel)
  const progressPct = nextLevel
    ? Math.min(100, Math.round(((lifetime - currentLevel.minLifetimePoints) / (nextLevel.minLifetimePoints - currentLevel.minLifetimePoints)) * 100))
    : 100
  const remainingToNext = nextLevel ? Math.max(0, nextLevel.minLifetimePoints - lifetime) : 0

  const activeRewards = DEFAULT_LOYALTY_CONFIG.rewards.filter(r => r.active)

  return (
    <div className="space-y-4">
      {/* Hero balance card — black gradient with emerald accent */}
      <Card className="overflow-hidden border-0 bg-[#0A0A0A] text-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-white/60 uppercase tracking-wide">
                <Award className="h-3.5 w-3.5" />
                Puncte disponibile
              </div>
              <p className="text-5xl font-bold tabular-nums text-emerald-400">
                {balance.toLocaleString("ro-RO")}
              </p>
              <p className="text-sm text-white/70">puncte de loialitate</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <Crown className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs text-white/60">Nivel curent</p>
                <p className="font-semibold">{currentLevel.name}</p>
              </div>
            </div>
          </div>

          {/* Tier progress */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">
                {nextLevel ? `Până la ${nextLevel.name}` : "Nivel maxim atins"}
              </span>
              <span className="text-white/70 tabular-nums">
                {lifetime.toLocaleString("ro-RO")} / {nextLevel ? nextLevel.minLifetimePoints.toLocaleString("ro-RO") : lifetime.toLocaleString("ro-RO")} pct cumulate
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {nextLevel && (
              <p className="text-xs text-white/60">
                Încă {remainingToNext.toLocaleString("ro-RO")} puncte pentru nivelul următor.
              </p>
            )}
            <p className="text-xs text-emerald-400/90 pt-1">
              {currentLevel.perksRo}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reward catalog */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Recompense disponibile</h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {activeRewards.map(r => {
              const canAfford = balance >= r.points
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors",
                    canAfford ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/30 opacity-70"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                    )}
                    <p className="text-xs font-semibold text-emerald-600 mt-1.5">
                      {r.points} pct
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={canAfford ? "default" : "outline"}
                    disabled={!canAfford}
                    className={cn(
                      "shrink-0 text-xs",
                      canAfford && "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    {canAfford ? "Răscumpără" : `Lipsesc ${r.points - balance}`}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* History timeline */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Istoric puncte</h3>
            <Badge variant="outline" className="ml-auto text-xs">{history.length} tranzacții</Badge>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Niciun istoric de puncte încă.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map(txn => {
                const meta = TYPE_BADGES[txn.type]
                const Icon = meta.icon
                const positive = txn.points >= 0
                return (
                  <li
                    key={txn.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5"
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                      positive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{txn.reason}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", meta.className)}>
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(txn.date)}</span>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-semibold tabular-nums shrink-0",
                      positive ? "text-emerald-600" : "text-muted-foreground"
                    )}>
                      {positive ? "+" : ""}{formatPoints(txn.points)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
