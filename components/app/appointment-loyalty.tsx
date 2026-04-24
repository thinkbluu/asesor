"use client"

import { useState, useMemo } from "react"
import { Award, Gift, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DEFAULT_LOYALTY_CONFIG,
  calculatePointsWithBonuses,
} from "@/lib/loyalty"
import { cn } from "@/lib/utils"

interface Props {
  clientId: string
  clientBalance: number
  clientBirthday?: string
  isFirstVisit?: boolean
  totalPrice: number
  visitDate: string
  isCompleted: boolean
}

export function AppointmentLoyalty({
  clientBalance,
  clientBirthday,
  isFirstVisit,
  totalPrice,
  visitDate,
  isCompleted,
}: Props) {
  const cfg = DEFAULT_LOYALTY_CONFIG

  const calc = useMemo(
    () =>
      calculatePointsWithBonuses({
        amountRon: totalPrice,
        visitDate,
        clientBirthday,
        isFirstVisit,
        cfg,
      }),
    [totalPrice, visitDate, clientBirthday, isFirstVisit, cfg]
  )

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const selectedTier = cfg.tiers.find(t => t.id === selectedTierId) ?? null

  const discountAmount = selectedTier ? Math.round((totalPrice * selectedTier.discountPercent) / 100) : 0
  const finalPrice = totalPrice - discountAmount

  if (!cfg.enabled) return null

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/15">
          <Award className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-500">
          Loialitate
        </span>
        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-600">
          {clientBalance} pct disponibile
        </Badge>
      </div>

      {/* Award preview */}
      {!isCompleted && (
        <div className="rounded-lg bg-background/60 border border-emerald-500/20 p-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">La finalizare se vor acorda:</span>
            <span className="font-semibold text-emerald-600 tabular-nums">
              +{calc.total} pct
            </span>
          </div>
          {calc.reasons.length > 0 && (
            <p className="text-[10px] text-emerald-700/80 mt-1">
              Include: {calc.reasons.join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* Redemption */}
      {!isCompleted && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">Folosește puncte la plată</span>
          </div>
          <div className="space-y-1.5">
            {cfg.tiers.map(tier => {
              const canAfford = clientBalance >= tier.points
              const isSelected = selectedTierId === tier.id
              return (
                <button
                  key={tier.id}
                  type="button"
                  disabled={!canAfford}
                  onClick={() => setSelectedTierId(isSelected ? null : tier.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-lg border p-2 text-left transition-colors",
                    isSelected && "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30",
                    !isSelected && canAfford && "border-border bg-background hover:border-emerald-500/40 hover:bg-emerald-500/5",
                    !canAfford && "border-border bg-muted/40 opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{tier.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {tier.points} pct · -{tier.discountPercent}%
                    </p>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                </button>
              )
            })}
          </div>

          {selectedTier && (
            <div className="rounded-lg bg-background border border-emerald-500/30 p-2.5 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Total servicii</span>
                <span className="tabular-nums">{totalPrice} Lei</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Reducere ({selectedTier.discountPercent}%)</span>
                <span className="tabular-nums">-{discountAmount} Lei</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border font-semibold">
                <span>De plată</span>
                <span className="tabular-nums">{finalPrice} Lei</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Balanță după răscumpărare: {clientBalance - selectedTier.points} pct
              </p>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="rounded-lg bg-background/60 border border-emerald-500/20 p-2.5 flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs">
            Programare finalizată — puncte acordate automat.
          </span>
        </div>
      )}
    </div>
  )
}
