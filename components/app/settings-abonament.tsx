"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, CreditCard, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PLANS, getPlan, type BillingInterval, type PlanId } from "@/lib/plans"
import type { BillingState } from "@/lib/billing/access"
import {
  changePlanAction,
  openBillingPortalAction,
  startTrialCheckoutAction,
} from "@/app/app/setari/billing-actions"

type Props = {
  billing: BillingState
  usage: { users: number; clients: number }
  isOwner: boolean
}

const STATUS_LABEL: Record<string, { label: string; tone: "ok" | "warn" | "bad" }> = {
  trialing: { label: "Perioadă de probă", tone: "ok" },
  active: { label: "Activ", tone: "ok" },
  past_due: { label: "Plată eșuată", tone: "warn" },
  canceled: { label: "Anulat", tone: "bad" },
  unpaid: { label: "Neplătit", tone: "bad" },
  incomplete: { label: "Incomplet", tone: "warn" },
  incomplete_expired: { label: "Expirat", tone: "bad" },
  paused: { label: "Pauzat", tone: "warn" },
}

const dateFmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" })

function formatDate(value: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d)
}

function priceFor(plan: PlanId, interval: BillingInterval): number {
  const p = getPlan(plan)
  return interval === "year" ? p.yearly : p.monthly
}

function PlanPicker({
  interval,
  onInterval,
  selected,
  onSelect,
  currentPlan,
}: {
  interval: BillingInterval
  onInterval: (v: BillingInterval) => void
  selected: PlanId
  onSelect: (v: PlanId) => void
  currentPlan?: PlanId | null
}) {
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Perioadă de facturare">
        {(["month", "year"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onInterval(v)}
            aria-pressed={interval === v}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              interval === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v === "month" ? "Lunar" : "Anual (preț redus)"}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map((p) => {
          const active = selected === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={active}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                active ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-accent/50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{p.name}</p>
                {currentPlan === p.id && <Badge variant="outline">Curent</Badge>}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {priceFor(p.id, interval)} <span className="text-sm font-normal text-muted-foreground">lei / lună</span>
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SettingsAbonament({ billing, usage, isOwner }: Props) {
  const searchParams = useSearchParams()
  const returned = searchParams.get("status")
  const [pending, startTransition] = useTransition()
  const [changing, setChanging] = useState(false)
  const [interval, setInterval] = useState<BillingInterval>(billing.interval ?? "month")
  const [selected, setSelected] = useState<PlanId>(billing.plan === "basic" && !billing.hasSubscription ? "pro" : billing.plan)

  const plan = getPlan(billing.plan)
  const status = billing.status ? (STATUS_LABEL[billing.status] ?? { label: billing.status, tone: "warn" as const }) : null
  const nextCharge = billing.status === "trialing" ? formatDate(billing.trialEnd) : formatDate(billing.currentPeriodEnd)
  const pilotUntil = formatDate(billing.pilotUntil)

  const redirectTo = (url: string) => {
    window.location.assign(url)
  }

  const startTrial = () =>
    startTransition(async () => {
      const result = await startTrialCheckoutAction({ plan: selected, interval })
      if (!result.ok) return void toast.error(result.error)
      redirectTo(result.data.url)
    })

  const openPortal = () =>
    startTransition(async () => {
      const result = await openBillingPortalAction()
      if (!result.ok) return void toast.error(result.error)
      redirectTo(result.data.url)
    })

  const applyChange = () =>
    startTransition(async () => {
      const result = await changePlanAction({ plan: selected, interval })
      if (!result.ok) return void toast.error(result.error)
      toast.success("Planul a fost schimbat. Diferența se calculează proporțional pe următoarea factură.")
      setChanging(false)
    })

  const canStartTrial = !billing.hasSubscription || billing.status === "canceled"

  return (
    <div className="max-w-3xl space-y-6">
      {returned === "ok" && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/5 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p>Mulțumim! Abonamentul se activează în câteva secunde. Dacă statusul nu apare, reîncarcă pagina.</p>
        </div>
      )}
      {returned === "cancel" && (
        <div role="status" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Plata a fost întreruptă. Nu s-a făcut nicio modificare.
        </div>
      )}

      {billing.source === "pilot" && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-6">
            <p className="text-lg font-bold">Perioadă pilot</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ai acces complet fără card până la {pilotUntil ?? "data stabilită"}. După această dată vei putea activa un abonament.
            </p>
          </CardContent>
        </Card>
      )}

      {billing.hasSubscription && status && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold">Plan {plan.name}</p>
              <Badge
                className={cn(
                  status.tone === "ok" && "bg-accent text-accent-foreground",
                  status.tone === "warn" && "bg-secondary text-secondary-foreground",
                  status.tone === "bad" && "bg-destructive text-white",
                )}
              >
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {priceFor(billing.plan, billing.interval ?? "month")} lei / lună
              {billing.interval === "year" ? " · facturat anual" : ""}
            </p>
            {nextCharge && billing.status !== "canceled" && (
              <p className="mt-1 text-sm text-muted-foreground">
                {billing.cancelAtPeriodEnd
                  ? `Abonamentul se încheie la ${nextCharge}.`
                  : `Următoarea plată: ${nextCharge}.`}
              </p>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">Utilizatori</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {usage.users}
                  <span className="text-sm font-normal text-muted-foreground"> / {plan.maxUsers ?? "nelimitat"}</span>
                </p>
              </div>
              <div className="rounded-lg bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {usage.clients}
                  <span className="text-sm font-normal text-muted-foreground"> / {plan.maxClients ?? "nelimitat"}</span>
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => setChanging((v) => !v)} disabled={pending}>
                  Schimbă planul
                </Button>
                <Button variant="outline" size="sm" onClick={openPortal} disabled={pending || !billing.hasStripeCustomer}>
                  {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CreditCard className="mr-1 h-3.5 w-3.5" />}
                  Facturi și card
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isOwner && billing.hasSubscription && changing && (
        <Card>
          <CardHeader>
            <CardTitle>Schimbă planul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanPicker interval={interval} onInterval={setInterval} selected={selected} onSelect={setSelected} currentPlan={billing.plan} />
            <div className="flex gap-3">
              <Button onClick={applyChange} disabled={pending || (selected === billing.plan && interval === billing.interval)}>
                {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Confirmă schimbarea
              </Button>
              <Button variant="ghost" onClick={() => setChanging(false)} disabled={pending}>
                Renunță
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isOwner && canStartTrial && billing.source !== "pilot" && (
        <Card>
          <CardHeader>
            <CardTitle>{billing.trialUsed ? "Reactivează abonamentul" : "Activează perioada de probă de 14 zile"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!billing.trialUsed && (
              <p className="text-sm text-muted-foreground">
                Cardul este necesar, dar nu se face nicio plată în primele 14 zile. Poți anula oricând din „Facturi și card”.
              </p>
            )}
            <PlanPicker interval={interval} onInterval={setInterval} selected={selected} onSelect={setSelected} />
            <Button onClick={startTrial} disabled={pending}>
              {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {billing.trialUsed ? "Continuă spre plată" : "Activează perioada de probă de 14 zile"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isOwner && (
        <p className="text-sm text-muted-foreground">Abonamentul poate fi modificat doar de proprietarul salonului.</p>
      )}
    </div>
  )
}
