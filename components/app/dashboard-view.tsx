"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar, Users, Clock, Plus, UserPlus,
  AlertTriangle, ArrowUpRight, Package,
  BellRing, ChevronRight, DollarSign,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ForbiddenBanner } from "@/components/app/forbidden-banner"
import { StatusBadge } from "@/components/app/status-badge"
import { KpiStrip } from "@/components/app/kpi-strip"
import type { AppointmentStatus } from "@/lib/mappers/programari"
import { formatTimeHM, utcIsoToCivil, todayBucharest } from "@/lib/time"
import type {
  DashboardSummary,
  WeeklyRevenueDay,
  DashboardAlerts,
} from "@/lib/data/dashboard"

// Client shell for the /app dashboard. Every number comes from the database
// (dashboard_summary RPC + plain RLS-scoped queries) — no derived trends, no
// percentage badges. Look: machetă «Ziua salonului» — KPI strip cu hairline-uri,
// titlu Bodoni, panouri hârtie.

interface DashboardViewProps {
  summary: DashboardSummary | null
  weekly: WeeklyRevenueDay[]
  alerts: DashboardAlerts | null
}

function formatRONShort(amount: number): string {
  if (amount >= 10000) return `${Math.round(amount / 1000)}k Lei`
  return `${Math.round(amount)} Lei`
}

export function DashboardView({ summary, weekly, alerts }: DashboardViewProps) {
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null)

  // Data afișată e ziua civilă din Bucharest, nu fusul orar al serverului.
  const today = new Date(`${todayBucharest()}T12:00:00`).toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long",
  })

  const byStatus = summary?.appointments_by_status ?? {}
  const todayTotal = Object.values(byStatus).reduce((s, n) => s + n, 0)
  const upcoming = summary?.next_upcoming ?? []

  const kpis = [
    { label: "Programări astăzi", value: todayTotal.toString() },
    { label: "Venituri astăzi", value: formatRONShort(summary?.revenue_today ?? 0) },
    { label: "Clienți noi luna aceasta", value: (summary?.new_clients_this_month ?? 0).toString() },
    { label: "Produse cu stoc scăzut", value: (summary?.low_stock_count ?? 0).toString() },
  ]

  const selected = upcoming.find(u => u.id === selectedAppt)

  return (
    <div className="p-4 pb-24 lg:p-8 lg:pb-8 max-w-[1600px]">
      <ForbiddenBanner />
      {/* Header — titlu Bodoni + dată mono, ca .bar din machetă */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] leading-tight tracking-[-0.01em] text-foreground text-balance [font-family:var(--serif)]">
            Bună, ziua.
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground tabular-nums">
            {today}
          </p>
        </div>
        <div className="flex w-full sm:w-auto gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/clienti"><UserPlus className="mr-1.5 h-3.5 w-3.5" />Client nou</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/app/programari"><Plus className="mr-1.5 h-3.5 w-3.5" />Programare nouă</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/financiar"><DollarSign className="mr-1.5 h-3.5 w-3.5" />Închidere zi</Link>
          </Button>
        </div>
      </div>

      {/* KPI strip — .kpis din machetă */}
      <KpiStrip items={kpis} className="mb-6" />

      {/* Main 60/40 grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* LEFT: Upcoming appointments */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Următoarele programări</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/app/programari">
                  Vezi toate <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {selected && (
                <div className="mb-4 rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{selected.client_name}</p>
                      <p className="text-xs text-muted-foreground">{selected.staff_name}</p>
                    </div>
                    <button onClick={() => setSelectedAppt(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none" aria-label="Închide">&times;</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono tabular-nums">
                      {utcIsoToCivil(selected.starts_at).date} · {formatTimeHM(selected.starts_at)}
                    </span>
                    <StatusBadge
                      status={selected.status as AppointmentStatus}
                      className="ml-auto"
                    />
                  </div>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href={`/app/programari?tab=day&date=${utcIsoToCivil(selected.starts_at).date}`}>
                      Deschide în calendar <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              )}
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
                  <p className="text-lg text-foreground [font-family:var(--serif)]">Nicio programare viitoare</p>
                  <p className="text-sm text-muted-foreground mt-1">Calendarul așteaptă prima clientă.</p>
                  <Button className="mt-4" size="sm" asChild>
                    <Link href="/app/programari"><Plus className="mr-1 h-4 w-4" />Adaugă programare</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {upcoming.map(u => {
                    const civil = utcIsoToCivil(u.starts_at)
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedAppt(prev => prev === u.id ? null : u.id)}
                        className="w-full text-left rounded-lg border border-border border-l-2 border-l-primary/60 p-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 text-center w-16">
                            <p className="text-sm font-semibold tabular-nums text-foreground font-mono">{formatTimeHM(u.starts_at)}</p>
                            <p className="text-[11px] text-muted-foreground font-mono tabular-nums">{civil.date.slice(5)}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{u.client_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.staff_name}</p>
                          </div>
                          <StatusBadge status={u.status as AppointmentStatus} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Alerts + Weekly revenue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
                Alerte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(summary?.low_stock_count ?? 0) > 0 && (
                <Link href="/app/stocuri" className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 hover:bg-amber-500/15 transition-colors">
                  <Package className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {summary?.low_stock_count} produse cu stoc scăzut
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                </Link>
              )}
              {(alerts?.pendingConfirmations ?? 0) > 0 && (
                <Link href="/app/programari?tab=list" className="flex items-start gap-3 rounded-lg bg-primary/10 border border-primary/20 p-3 hover:bg-primary/15 transition-colors">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">
                      {alerts?.pendingConfirmations} programări de confirmat
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                </Link>
              )}
              {(alerts?.noShowsYesterday ?? 0) > 0 && (
                <Link href="/app/programari?tab=list" className="flex items-start gap-3 rounded-lg bg-[var(--err)]/10 border border-[var(--err)]/20 p-3 hover:bg-[var(--err)]/15 transition-colors">
                  <AlertTriangle className="h-4 w-4 text-[var(--err)] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--err)]">
                      {alerts?.noShowsYesterday} neprezentări ieri
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                </Link>
              )}
              {(alerts?.upcomingTimeOff.length ?? 0) > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-1.5">
                  <p className="mono-label text-[#8a8a8a]">Concedii în aprovăzare</p>
                  {alerts?.upcomingTimeOff.map((t, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{t.staffName}</span>
                      {" · "}{t.startDate} – {t.endDate}
                      {t.reason ? ` · ${t.reason}` : ""}
                    </p>
                  ))}
                </div>
              )}
              {(summary?.low_stock_count ?? 0) === 0 &&
                (alerts?.pendingConfirmations ?? 0) === 0 &&
                (alerts?.noShowsYesterday ?? 0) === 0 &&
                (alerts?.upcomingTimeOff.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground py-2">Nicio alertă.</p>
              )}
            </CardContent>
          </Card>

          {/* Weekly revenue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Venituri săptămână</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} barSize={16}>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1, 2)}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value) => [`${value} Lei`, "Încasat"]}
                      labelFormatter={(label) => String(label)}
                      contentStyle={{ borderRadius: 6, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                      {weekly.map(d => (
                        <Cell
                          key={d.date}
                          fill={d.isToday ? "var(--primary)" : "var(--muted-foreground)"}
                          fillOpacity={d.isToday ? 1 : 0.35}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

