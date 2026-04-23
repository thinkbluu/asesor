"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Users, TrendingUp, Clock, Plus, UserPlus,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Package,
  CalendarX, BellRing, PauseCircle, ChevronRight, DollarSign,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { cn } from "@/lib/utils"

// ── Data imports from all modules ─────────────────────────────────────────────
import { APPOINTMENTS_DATA, STATUS_CONFIG, toDateString, type AppointmentStatus } from "@/lib/programari-data"
import { STAFF_DATA } from "@/lib/echipa-data"
import { CLIENTS_DATA as CLIENTS } from "@/lib/clienti-data"
import { TRANSACTIONS, formatRON, formatRONShort } from "@/lib/financiar-data"

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = toDateString(new Date())
const yesterdayStr = toDateString(new Date(Date.now() - 86400000))

function getWeekStart(offset = 0): string {
  const d = new Date()
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7) + offset * 7)
  return toDateString(monday)
}

function getWeekEnd(offset = 0): string {
  const start = getWeekStart(offset)
  const d = new Date(start)
  d.setDate(d.getDate() + 6)
  return toDateString(d)
}

// ── KPI derivations ───────────────────────────────────────────────────────────
function useKPIs() {
  return useMemo(() => {
    const todayAppts = APPOINTMENTS_DATA.filter(a => a.date === todayStr)
    const yesterdayAppts = APPOINTMENTS_DATA.filter(a => a.date === yesterdayStr)

    const todayCount = todayAppts.length
    const yesterdayCount = yesterdayAppts.length
    const apptChange = yesterdayCount > 0
      ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
      : 0

    const todayRevTx = TRANSACTIONS.filter(t => t.date === todayStr && t.status === "incasat")
    const yesterdayRevTx = TRANSACTIONS.filter(t => t.date === yesterdayStr && t.status === "incasat")
    const todayRev = todayRevTx.reduce((s, t) => s + t.amount + t.tip, 0)
    const yesterdayRev = yesterdayRevTx.reduce((s, t) => s + t.amount + t.tip, 0)
    const revChange = yesterdayRev > 0
      ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100)
      : 0

    const thisWeekStart = getWeekStart(0)
    const lastWeekStart = getWeekStart(-1)
    const lastWeekEnd = getWeekEnd(-1)
  const newClientsThisWeek = CLIENTS.filter(c => c.clientDin >= thisWeekStart).length
  const newClientsLastWeek = CLIENTS.filter(c => c.clientDin >= lastWeekStart && c.clientDin <= lastWeekEnd).length
    const clientChange = newClientsLastWeek > 0
      ? Math.round(((newClientsThisWeek - newClientsLastWeek) / newClientsLastWeek) * 100)
      : 0

    const completedToday = todayAppts.filter(a => a.status === "finalizat")
    const avgDuration = completedToday.length > 0
      ? Math.round(completedToday.reduce((s, a) => s + a.duration, 0) / completedToday.length)
      : 0
    const completedYesterday = yesterdayAppts.filter(a => a.status === "finalizat")
    const avgDurationYesterday = completedYesterday.length > 0
      ? Math.round(completedYesterday.reduce((s, a) => s + a.duration, 0) / completedYesterday.length)
      : avgDuration
    const durationChange = avgDuration - avgDurationYesterday

    return { todayCount, apptChange, todayRev, revChange, newClientsThisWeek, clientChange, avgDuration, durationChange }
  }, [])
}

// ── Weekly bar chart data ─────────────────────────────────────────────────────
function useWeeklyChart() {
  return useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = toDateString(d)
      const label = d.toLocaleDateString("ro-RO", { weekday: "short" })
      const rev = TRANSACTIONS
        .filter(t => t.date === dateStr && t.status === "incasat")
        .reduce((s, t) => s + t.amount + t.tip, 0)
      days.push({ label, rev, isToday: dateStr === todayStr })
    }
    // Calculate week-over-week
    const thisWeek = days.reduce((s, d) => s + d.rev, 0)
    const prevWeek = [0,1,2,3,4,5,6].reduce((s, i) => {
      const dateStr = toDateString(new Date(Date.now() - (i + 7) * 86400000))
      return s + TRANSACTIONS.filter(t => t.date === dateStr && t.status === "incasat").reduce((ss, t) => ss + t.amount + t.tip, 0)
    }, 0)
    const weekChange = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : 0
    return { days, thisWeek, weekChange }
  }, [])
}

// ── Alerts derivation ─────────────────────────────────────────────────────────
function useAlerts() {
  return useMemo(() => {
    // Low stock — inline from stocuri page data (same INITIAL_PRODUCTS shape)
    // We derive it from a simple import-compatible structure
    const lowStockProducts = [
      { name: "Majirel 50ml #9.1",  stock: 8,  minStock: 10 },
      { name: "Olaplex No.1 100ml", stock: 4,  minStock: 6  },
      { name: "Olaplex No.2 250ml", stock: 3,  minStock: 6  },
      { name: "Vinylux #Beau 15ml", stock: 7,  minStock: 10 },
      { name: "Fibre Crimper 150ml",stock: 0,  minStock: 5  },
    ]

    const noShows = APPOINTMENTS_DATA.filter(a => a.date === yesterdayStr && a.status === "no_show")
    const pendingConfirmations = APPOINTMENTS_DATA.filter(a => a.date >= todayStr && a.status === "in_asteptare")
    const staffTimeOff = STAFF_DATA.flatMap(s =>
      s.schedule
        .filter(d => d.timeOff && d.timeOff.length > 0)
        .flatMap(d => d.timeOff!.map(t => ({ staffName: s.firstName, ...t })))
    ).slice(0, 3)

    return { lowStockProducts, noShows, pendingConfirmations, staffTimeOff }
  }, [])
}

// ── Staff utilization ─────────────────────────────────────────────────────────
function useStaffUtilization() {
  return useMemo(() => {
    const salonStartMin = 9 * 60
    const salonEndMin = 20 * 60
    const totalAvailableMin = salonEndMin - salonStartMin // 660 min

    return STAFF_DATA.filter(s => s.status === "activ").map(s => {
      const todayAppts = APPOINTMENTS_DATA.filter(a => a.date === todayStr && a.staffId === s.id)
      const bookedMin = todayAppts.reduce((sum, a) => sum + a.duration, 0)
      const pct = Math.round((bookedMin / totalAvailableMin) * 100)
      return {
        id: s.id,
        name: s.firstName,
        role: s.role,
        bookedMin,
        totalMin: totalAvailableMin,
        pct,
        color: pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500",
        appointments: todayAppts.length,
      }
    })
  }, [])
}

// ── Today's timeline ──────────────────────────────────────────────────────────
function TodayTimeline({ onSelect }: { onSelect: (id: string) => void }) {
  const appts = useMemo(() =>
    APPOINTMENTS_DATA.filter(a => a.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    []
  )

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()

  const isInProgress = (a: typeof appts[0]) => {
    const [sh, sm] = a.startTime.split(":").map(Number)
    const [eh, em] = a.endTime.split(":").map(Number)
    const start = sh * 60 + sm
    const end = eh * 60 + em
    return nowMin >= start && nowMin < end
  }

  if (appts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Nicio programare astăzi</p>
        <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90" size="sm" asChild>
          <Link href="/app/programari"><Plus className="mr-1 h-4 w-4" />Adaugă programare</Link>
        </Button>
      </div>
    )
  }

  const borderColors: Record<AppointmentStatus, string> = {
    confirmat:      "border-l-emerald-500",
    in_asteptare:   "border-l-amber-500",
    in_desfasurare: "border-l-blue-500",
    finalizat:      "border-l-zinc-400",
    anulat:         "border-l-red-500",
    no_show:        "border-l-red-900",
  }

  return (
    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
      {appts.map(a => {
        const inProgress = isInProgress(a) || a.status === "in_desfasurare"
        const cfg = STATUS_CONFIG[a.status]
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={cn(
              "w-full text-left rounded-lg border border-border border-l-4 p-3 transition-colors hover:bg-muted/60",
              borderColors[a.status],
              inProgress && "bg-blue-500/5 ring-1 ring-blue-500/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-center w-14">
                <p className="text-sm font-bold tabular-nums text-foreground">{a.startTime}</p>
                <p className="text-[11px] text-muted-foreground">{a.duration}min</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/app/clienti/${a.clientId}`}
                    onClick={e => e.stopPropagation()}
                    className="font-medium text-sm text-foreground hover:text-accent hover:underline truncate"
                  >
                    {a.clientName}
                  </Link>
                  {inProgress && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-500 uppercase tracking-wide">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      În desfășurare
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {a.services.map(s => s.name).join(", ")}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{a.staffName.split(" ")[0]}</span>
                <span className={cn("text-xs rounded-full px-2 py-0.5 font-medium", cfg.bg, cfg.color)}>
                  {cfg.label}
                </span>
                <span className="text-sm font-semibold text-foreground">{a.totalPrice} Lei</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Appointment detail panel ──────────────────────────────────────────────────
function AppointmentPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const appt = APPOINTMENTS_DATA.find(a => a.id === id)
  if (!appt) return null
  const cfg = STATUS_CONFIG[appt.status]
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/app/clienti/${appt.clientId}`} className="font-semibold text-foreground hover:text-accent hover:underline">
            {appt.clientName}
          </Link>
          <p className="text-xs text-muted-foreground">{appt.clientPhone}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{appt.startTime} – {appt.endTime} ({appt.duration} min)</span>
        <span className={cn("ml-auto text-xs rounded-full px-2 py-0.5 font-medium", cfg.bg, cfg.color)}>{cfg.label}</span>
      </div>
      <div className="space-y-1">
        {appt.services.map((s, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{s.name}</span>
            <span className="font-medium">{s.price} Lei</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold border-t border-border pt-1 mt-1">
          <span>Total</span><span>{appt.totalPrice} Lei</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Staff: <span className="text-foreground font-medium">{appt.staffName}</span>
        {" · "}Sursă: <span className="capitalize">{appt.source}</span>
      </div>
      <Button size="sm" variant="outline" className="w-full" asChild>
        <Link href="/app/programari">Deschide calendar <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
      </Button>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const kpi = useKPIs()
  const { days, thisWeek, weekChange } = useWeeklyChart()
  const alerts = useAlerts()
  const staffUtil = useStaffUtilization()
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null)

  const today = new Date().toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long",
  })

  const thisWeekAppts = useMemo(() => {
    const start = getWeekStart(0)
    return APPOINTMENTS_DATA.filter(a => a.date >= start && a.date <= toDateString(new Date()))
  }, [])
  const lastWeekAppts = useMemo(() => {
    const start = getWeekStart(-1)
    const end = getWeekEnd(-1)
    return APPOINTMENTS_DATA.filter(a => a.date >= start && a.date <= end)
  }, [])
  const apptWeekChange = lastWeekAppts.length > 0
    ? Math.round(((thisWeekAppts.length - lastWeekAppts.length) / lastWeekAppts.length) * 100)
    : 0

  const kpiCards = [
    {
      label: "Programări astăzi",
      value: kpi.todayCount,
      change: kpi.apptChange,
      icon: Calendar,
      href: "/app/programari",
      format: (v: number) => v.toString(),
    },
    {
      label: "Venituri astăzi",
      value: kpi.todayRev,
      change: kpi.revChange,
      icon: DollarSign,
      href: "/app/financiar",
      format: (v: number) => formatRONShort(v),
    },
    {
      label: "Clienți noi săptămâna",
      value: kpi.newClientsThisWeek,
      change: kpi.clientChange,
      icon: Users,
      href: "/app/clienti",
      format: (v: number) => v.toString(),
    },
    {
      label: "Timp mediu/client",
      value: kpi.avgDuration,
      change: kpi.durationChange,
      icon: Clock,
      href: "/app/programari",
      format: (v: number) => v > 0 ? `${v} min` : "–",
    },
  ]

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground capitalize text-sm">{today}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/clienti"><UserPlus className="mr-1.5 h-3.5 w-3.5" />Client nou</Link>
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link href="/app/programari"><Plus className="mr-1.5 h-3.5 w-3.5" />Programare nouă</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/financiar"><DollarSign className="mr-1.5 h-3.5 w-3.5" />Închidere zi</Link>
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(card => (
          <Link key={card.label} href={card.href}>
            <Card className="hover:border-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <card.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-semibold",
                    card.change > 0 ? "text-emerald-600 dark:text-emerald-400" :
                    card.change < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {card.change > 0 ? "+" : ""}{card.change}
                    {card.label !== "Timp mediu/client" && card.label !== "Programări astăzi" && card.label !== "Clienți noi săptămâna" ? "%" : ""}
                    {card.change > 0
                      ? <ArrowUpRight className="ml-0.5 h-3 w-3" />
                      : card.change < 0
                      ? <ArrowDownRight className="ml-0.5 h-3 w-3" />
                      : null}
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{card.format(card.value)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main 60/40 grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* LEFT: Today's timeline (60% = 3/5 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Programări astăzi</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/app/programari">
                  Vezi toate <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {selectedAppt && (
                <div className="mb-4">
                  <AppointmentPanel id={selectedAppt} onClose={() => setSelectedAppt(null)} />
                </div>
              )}
              <TodayTimeline onSelect={id => setSelectedAppt(prev => prev === id ? null : id)} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Alerts + Weekly perf + Staff util (40% = 2/5 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BellRing className="h-4 w-4 text-accent" />
                Alerte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Low stock */}
              {alerts.lowStockProducts.length > 0 && (
                <Link href="/app/stocuri" className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 hover:bg-amber-500/15 transition-colors">
                  <Package className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {alerts.lowStockProducts.length} produse cu stoc scăzut
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {alerts.lowStockProducts.slice(0, 2).map(p => p.name).join(", ")}
                      {alerts.lowStockProducts.length > 2 && ` +${alerts.lowStockProducts.length - 2} mai mult`}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              )}

              {/* No-shows */}
              {alerts.noShows.length > 0 && (
                <Link href="/app/programari" className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 hover:bg-red-500/15 transition-colors">
                  <CalendarX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      {alerts.noShows.length} no-show ieri
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {alerts.noShows.map(a => a.clientName).join(", ")}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              )}

              {/* Pending confirmations */}
              {alerts.pendingConfirmations.length > 0 && (
                <Link href="/app/programari" className="flex items-start gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 hover:bg-blue-500/15 transition-colors">
                  <BellRing className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {alerts.pendingConfirmations.length} programări în așteptare
                    </p>
                    <p className="text-[11px] text-muted-foreground">Necesită confirmare</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              )}

              {/* Time off */}
              {alerts.staffTimeOff.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg bg-muted/60 border border-border p-3">
                  <PauseCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">Concedii programate</p>
                    <p className="text-[11px] text-muted-foreground">
                      {alerts.staffTimeOff.map(t => `${t.staffName}: ${t.reason}`).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {alerts.lowStockProducts.length === 0 && alerts.noShows.length === 0 && alerts.pendingConfirmations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Nicio alertă activă</p>
              )}
            </CardContent>
          </Card>

          {/* Weekly performance chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Venituri săptămână</CardTitle>
                <Badge className={cn(
                  "text-xs",
                  weekChange >= 0
                    ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20"
                    : "bg-red-500/15 text-red-600 border-red-500/20"
                )}>
                  {weekChange >= 0 ? "+" : ""}{weekChange}% vs săpt. trecută
                </Badge>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatRON(thisWeek)}</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={days} barSize={16}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: number) => [formatRONShort(v), "Venituri"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="rev" radius={[4, 4, 0, 0]}>
                    {days.map((d, i) => (
                      <Cell key={i} fill={d.isToday ? "var(--color-accent)" : "var(--color-muted-foreground)"} opacity={d.isToday ? 1 : 0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/60 p-2">
                  <p className="text-muted-foreground">Programări</p>
                  <p className="font-semibold">{thisWeekAppts.length} <span className={cn("text-[10px]", apptWeekChange >= 0 ? "text-emerald-500" : "text-red-500")}>{apptWeekChange >= 0 ? "+" : ""}{apptWeekChange}%</span></p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2">
                  <p className="text-muted-foreground">Clienți noi</p>
                  <p className="font-semibold">{kpi.newClientsThisWeek} <span className={cn("text-[10px]", kpi.clientChange >= 0 ? "text-emerald-500" : "text-red-500")}>{kpi.clientChange >= 0 ? "+" : ""}{kpi.clientChange}%</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff utilization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Utilizare echipă astăzi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staffUtil.map(s => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <span className="text-[11px] text-muted-foreground">{s.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{s.appointments} appt.</span>
                      <span className={cn(
                        "text-xs font-semibold tabular-nums",
                        s.pct >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                        s.pct >= 40 ? "text-amber-600 dark:text-amber-400" :
                        "text-red-600 dark:text-red-400"
                      )}>{s.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", s.color)}
                      style={{ width: `${Math.min(s.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {staffUtil.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Niciun angajat activ</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
