"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getStaffById, getInitials, getFullName, getStaffById as unused,
  STATUS_STYLES, STATUS_LABELS, ALL_SERVICES, ROLES,
  type StaffMember, type RoleType, type CommissionType,
} from "@/lib/echipa-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import {
  ArrowLeft, Phone, Mail, Calendar, Star, TrendingUp, Users,
  Clock, AlertCircle, Check, X, Plus, Edit, Percent, DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]

type Tab = "program" | "servicii" | "performanta" | "comisioane"

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const member = getStaffById(id)

  const [activeTab, setActiveTab] = useState<Tab>("program")
  const [schedule, setSchedule] = useState(member?.schedule ?? {})
  const [selectedServices, setSelectedServices] = useState<string[]>(member?.services ?? [])
  const [priceOverrides, setPriceOverrides] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(member?.servicePriceOverrides ?? {}).map(([k, v]) => [k, String(v)])
    )
  )
  const [commissionType, setCommissionType] = useState<CommissionType>(member?.commissionType ?? "procent")
  const [commissionRate, setCommissionRate] = useState(String(member?.commissionRate ?? 35))
  const [addTimeOffOpen, setAddTimeOffOpen] = useState(false)
  const [addBlockedOpen, setAddBlockedOpen] = useState(false)

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Angajatul nu a fost găsit.</p>
          <Button asChild variant="outline"><Link href="/app/echipa">Înapoi la echipă</Link></Button>
        </div>
      </div>
    )
  }

  const toggleService = (svc: string) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    )
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "program", label: "Program" },
    { id: "servicii", label: "Servicii" },
    { id: "performanta", label: "Performanță" },
    { id: "comisioane", label: "Comisioane" },
  ]

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8 max-w-5xl">
      {/* Back + Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Echipa
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
              {getInitials(member)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance break-words">{getFullName(member)}</h1>
              <p className="text-muted-foreground">{member.role}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[member.status])}>
                  {STATUS_LABELS[member.status]}
                </span>
                <span className="text-xs text-muted-foreground">Angajat din {new Date(member.dataAngajare).toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${member.phone}`}><Phone className="mr-1.5 h-3.5 w-3.5" />{member.phone}</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${member.email}`}><Mail className="mr-1.5 h-3.5 w-3.5" />{member.email}</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 border-b overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 whitespace-nowrap",
              activeTab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROGRAM ── */}
      {activeTab === "program" && (
        <div className="space-y-6">
          {/* Weekly schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program săptămânal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map((day) => {
                const d = schedule[day] ?? { active: false, start: "09:00", end: "18:00" }
                return (
                  <div key={day} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 gap-y-2">
                    <div className="w-20 sm:w-24 text-sm font-medium">{day}</div>
                    <Switch
                      checked={d.active}
                      onCheckedChange={(v) => setSchedule((s) => ({ ...s, [day]: { ...d, active: v } }))}
                    />
                    {d.active ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Input
                          type="time"
                          value={d.start}
                          onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...d, start: e.target.value } }))}
                          className="h-8 w-24 sm:w-28 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">—</span>
                        <Input
                          type="time"
                          value={d.end}
                          onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...d, end: e.target.value } }))}
                          className="h-8 w-24 sm:w-28 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Liber</span>
                    )}
                  </div>
                )
              })}
              <div className="pt-2 flex justify-end">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Salvează program
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Time-off requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Cereri concediu / absențe</CardTitle>
              <Dialog open={addTimeOffOpen} onOpenChange={setAddTimeOffOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" /> Adaugă</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Cerere concediu</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>De la</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Până la</Label>
                        <Input type="date" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Motiv</Label>
                      <Input placeholder="Ex: Concediu anual" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddTimeOffOpen(false)}>Anulează</Button>
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setAddTimeOffOpen(false)}>Adaugă cerere</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {member.timeOffRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nicio cerere înregistrată.</p>
              ) : (
                <div className="space-y-2">
                  {member.timeOffRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{req.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.startDate).toLocaleDateString("ro-RO")} — {new Date(req.endDate).toLocaleDateString("ro-RO")}
                        </p>
                      </div>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        req.status === "approved" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                        req.status === "pending"  && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                        req.status === "rejected" && "bg-red-500/10 text-red-500 border-red-500/30",
                      )}>
                        {req.status === "approved" ? "Aprobat" : req.status === "pending" ? "În așteptare" : "Respins"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked slots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Intervale blocate</CardTitle>
              <Dialog open={addBlockedOpen} onOpenChange={setAddBlockedOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" /> Adaugă</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Interval blocat</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Data</Label>
                      <Input type="date" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Ora start</Label>
                        <Input type="time" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Ora final</Label>
                        <Input type="time" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Motiv</Label>
                      <Input placeholder="Ex: Training, vizită medicală..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddBlockedOpen(false)}>Anulează</Button>
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setAddBlockedOpen(false)}>Blochează interval</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {member.blockedSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Niciun interval blocat.</p>
              ) : (
                <div className="space-y-2">
                  {member.blockedSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{slot.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(slot.date).toLocaleDateString("ro-RO")} · {slot.startTime} — {slot.endTime}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SERVICII ── */}
      {activeTab === "servicii" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Servicii efectuate</CardTitle>
              <p className="text-sm text-muted-foreground">Bifează serviciile pe care le poate efectua acest angajat. Poți seta un preț personalizat față de tariful salonului.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ALL_SERVICES.map((svc) => {
                  const enabled = selectedServices.includes(svc)
                  const override = priceOverrides[svc] ?? ""
                  return (
                    <div key={svc} className={cn(
                      "flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 gap-y-2 rounded-lg border p-3 transition-colors",
                      enabled ? "border-accent/30 bg-accent/5" : "opacity-60"
                    )}>
                      <Checkbox
                        checked={enabled}
                        onCheckedChange={() => toggleService(svc)}
                      />
                      <span className="flex-1 text-sm font-medium">{svc}</span>
                      {enabled && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Preț personalizat:</span>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="Tarif salon"
                              value={override}
                              onChange={(e) => setPriceOverrides((p) => ({ ...p, [svc]: e.target.value }))}
                              className="h-7 w-28 pr-8 text-xs"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Lei</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Salvează servicii
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PERFORMANTA ── */}
      {activeTab === "performanta" && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Calendar, label: "Programări luna aceasta", value: member.stats.appointmentsThisMonth, accent: false },
              { icon: TrendingUp, label: "Venituri generate", value: `${member.stats.revenueThisMonth.toLocaleString()} Lei`, accent: true },
              { icon: Star, label: "Rating mediu", value: member.stats.avgRating.toFixed(1), accent: false },
              { icon: AlertCircle, label: "Rată no-show", value: `${member.stats.noShowRate}%`, accent: false },
              { icon: Clock, label: "Rată de utilizare", value: `${member.stats.utilizationRate}%`, accent: true },
              { icon: Users, label: "Programări azi", value: member.stats.todayAppointments, accent: false },
            ].map(({ icon: Icon, label, value, accent }) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accent ? "bg-accent/10" : "bg-muted")}>
                    <Icon className={cn("h-4 w-4", accent ? "text-accent" : "text-muted-foreground")} />
                  </div>
                  <p className="mt-3 text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trend programări — ultimele 8 săptămâni</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={member.weeklyTrend} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 13 }}
                    cursor={{ fill: "hsl(var(--muted))" }}
                  />
                  <Bar dataKey="count" name="Programări" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recenzii recente clienți</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nicio recenzie înregistrată.</p>
              ) : (
                member.reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{review.clientName}</span>
                        <span className="text-xs text-muted-foreground">· {review.service}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── COMISIOANE ── */}
      {activeTab === "comisioane" && (
        <div className="space-y-6">
          {/* Commission type selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tip comision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Metodă de calcul</Label>
                  <Select value={commissionType} onValueChange={(v) => setCommissionType(v as CommissionType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procent">Procent din venituri</SelectItem>
                      <SelectItem value="fix">Fix per programare (RON)</SelectItem>
                      <SelectItem value="salariu">Doar salariu fix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {commissionType !== "salariu" && (
                  <div className="space-y-1.5">
                    <Label>{commissionType === "procent" ? "Procent (%)" : "Sumă fixă (RON / programare)"}</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {commissionType === "procent" ? <Percent className="h-4 w-4" /> : <span className="text-sm">Lei</span>}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Salvează
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Istoric comisioane lunare</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lună</TableHead>
                    <TableHead className="text-right">Servicii</TableHead>
                    <TableHead className="text-right">Venituri generate</TableHead>
                    <TableHead className="text-right">Comision câștigat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.commissionHistory.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{row.servicesCount}</TableCell>
                      <TableCell className="text-right">{row.revenue.toLocaleString()} Lei</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-accent">{row.commissionEarned.toLocaleString()} Lei</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm font-medium">Total comisioane (perioadă afișată)</span>
                <span className="text-base font-bold text-accent">
                  {member.commissionHistory.reduce((a, r) => a + r.commissionEarned, 0).toLocaleString()} Lei
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notes */}
      {member.notes && (
        <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Notițe interne</p>
          <p className="text-sm text-muted-foreground">{member.notes}</p>
        </div>
      )}
    </div>
  )
}
