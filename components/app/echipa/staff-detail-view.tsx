"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, CalendarOff, Check, Copy, Mail, Save, Trash2, X } from "lucide-react"
import type { ScheduleDay, StaffDetail, StaffServiceItem } from "@/lib/mappers/echipa"
import {
  createBlockedSlotAction,
  decideTimeOffAction,
  deleteBlockedSlotAction,
  deleteTimeOffAction,
  getSalonHoursAction,
  inviteStaffAction,
  requestTimeOffAction,
  saveScheduleAction,
  setStaffServiceAction,
  updateStaffAction,
} from "@/app/app/echipa/actions"
import { COMMISSION_TYPES, STAFF_STATUSES } from "@/lib/validation/echipa"

const STATUS_LABELS: Record<string, string> = {
  activ: "Activ",
  concediu: "Concediu",
  inactiv: "Inactiv",
}
const TIME_OFF_LABELS: Record<string, string> = {
  pending: "În așteptare",
  approved: "Aprobat",
  rejected: "Respins",
}
const DAY_NAMES = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]

const lei = (v: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(v)
const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`)

export function StaffDetailView({
  staff,
  salonServices,
  linkedUser,
  canManage,
  canDelete,
  canInvite,
  canSeeFinancials,
  isSelf,
}: {
  staff: StaffDetail
  salonServices: { id: string; name: string; categoryName: string | null }[]
  linkedUser: { email: string; role: string } | null
  canManage: boolean
  canDelete: boolean
  canInvite: boolean
  canSeeFinancials: boolean
  isSelf: boolean
}) {
  const fullName = `${staff.firstName} ${staff.lastName}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/app/echipa" aria-label="Înapoi la echipă">
            <ArrowLeft className="size-5 text-muted-foreground hover:text-foreground" />
          </Link>
          <span
            className="flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: staff.color ?? "#71717a" }}
            aria-hidden="true"
          >
            {`${staff.firstName[0] ?? ""}${staff.lastName[0] ?? ""}`.toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {staff.roleTitle ?? "—"} ·{" "}
              <Badge variant="outline" className="align-middle">
                {STATUS_LABELS[staff.status]}
              </Badge>
            </p>
          </div>
        </div>
        {canInvite && !linkedUser && (
          <InviteDialog staffId={staff.id} />
        )}
        {linkedUser && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" /> Cont activ: {linkedUser.email}
          </p>
        )}
      </div>

      <Tabs defaultValue={isSelf ? "statistici" : "program"}>
        <TabsList className="flex-wrap">
          {!isSelf && <TabsTrigger value="program">Program</TabsTrigger>}
          {!isSelf && <TabsTrigger value="servicii">Servicii</TabsTrigger>}
          <TabsTrigger value="concedii">Concedii & blocări</TabsTrigger>
          <TabsTrigger value="statistici">Statistici</TabsTrigger>
          {canManage && <TabsTrigger value="profil">Profil</TabsTrigger>}
        </TabsList>

        {!isSelf && (
          <TabsContent value="program">
            <ScheduleEditor staffId={staff.id} initial={staff.schedule} canManage={canManage} />
          </TabsContent>
        )}
        {!isSelf && (
          <TabsContent value="servicii">
            <ServicesEditor staffId={staff.id} staffServices={staff.services} salonServices={salonServices} />
          </TabsContent>
        )}
        <TabsContent value="concedii">
          <TimeOffAndBlocks staff={staff} canManage={canManage} isSelf={isSelf} />
        </TabsContent>
        <TabsContent value="statistici">
          <StatsPanel staff={staff} canSeeFinancials={canSeeFinancials} />
        </TabsContent>
        {canManage && (
          <TabsContent value="profil">
            <ProfileForm staff={staff} canDelete={canDelete} canSetCommission={canDelete} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ------------------------------------------------------------
// Program
// ------------------------------------------------------------

function ScheduleEditor({
  staffId,
  initial,
  canManage,
}: {
  staffId: string
  initial: ScheduleDay[]
  canManage: boolean
}) {
  const [days, setDays] = useState<ScheduleDay[]>(initial)
  const [pending, startTransition] = useTransition()

  function patch(weekday: number, changes: Partial<ScheduleDay>) {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...changes } : d)))
  }

  function copySalon() {
    startTransition(async () => {
      const res = await getSalonHoursAction()
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setDays(res.data.days)
      toast.success("Programul salonului a fost încărcat. Salvează pentru a-l aplica.")
    })
  }

  function save() {
    startTransition(async () => {
      const res = await saveScheduleAction({ staffId, days })
      if (res.ok) toast.success("Program salvat.")
      else toast.error(res.error)
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Program săptămânal</CardTitle>
        {canManage && (
          <Button variant="outline" size="sm" onClick={copySalon} disabled={pending}>
            <Copy className="size-4" /> Copiază programul salonului
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {days.map((d) => (
          <div key={d.weekday} className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2">
            <Checkbox
              id={`day-${d.weekday}`}
              checked={d.isWorking}
              onCheckedChange={(v) => patch(d.weekday, { isWorking: v === true })}
              disabled={!canManage}
            />
            <Label htmlFor={`day-${d.weekday}`} className="w-24">
              {DAY_NAMES[d.weekday]}
            </Label>
            {d.isWorking ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Input
                  type="time"
                  value={d.startTime ?? ""}
                  onChange={(e) => patch(d.weekday, { startTime: e.target.value })}
                  className="w-28"
                  aria-label={`${DAY_NAMES[d.weekday]} ora început`}
                  disabled={!canManage}
                />
                <span aria-hidden="true">–</span>
                <Input
                  type="time"
                  value={d.endTime ?? ""}
                  onChange={(e) => patch(d.weekday, { endTime: e.target.value })}
                  className="w-28"
                  aria-label={`${DAY_NAMES[d.weekday]} ora sfârșit`}
                  disabled={!canManage}
                />
                <span className="text-xs text-muted-foreground">pauză</span>
                <Input
                  type="time"
                  value={d.breakStart ?? ""}
                  onChange={(e) => patch(d.weekday, { breakStart: e.target.value })}
                  className="w-28"
                  aria-label={`${DAY_NAMES[d.weekday]} pauză început`}
                  disabled={!canManage}
                />
                <span aria-hidden="true">–</span>
                <Input
                  type="time"
                  value={d.breakEnd ?? ""}
                  onChange={(e) => patch(d.weekday, { breakEnd: e.target.value })}
                  className="w-28"
                  aria-label={`${DAY_NAMES[d.weekday]} pauză sfârșit`}
                  disabled={!canManage}
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Zi liberă</span>
            )}
          </div>
        ))}
        {canManage && (
          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={pending}>
              <Save className="size-4" /> {pending ? "Se salvează…" : "Salvează programul"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ------------------------------------------------------------
// Servicii
// ------------------------------------------------------------

function ServicesEditor({
  staffId,
  staffServices,
  salonServices,
}: {
  staffId: string
  staffServices: StaffServiceItem[]
  salonServices: { id: string; name: string; categoryName: string | null }[]
}) {
  const [pending, startTransition] = useTransition()
  const byId = new Map(staffServices.map((s) => [s.serviceId, s]))

  function toggle(serviceId: string, active: boolean) {
    const existing = byId.get(serviceId)
    startTransition(async () => {
      const res = await setStaffServiceAction({
        staffId,
        serviceId,
        active,
        priceOverride: existing?.priceOverride ?? null,
        durationOverride: existing?.durationOverride ?? null,
      })
      if (res.ok) toast.success(active ? "Serviciu adăugat." : "Serviciu eliminat.")
      else toast.error(res.error)
    })
  }

  function saveOverride(serviceId: string, field: "priceOverride" | "durationOverride", raw: string) {
    const existing = byId.get(serviceId)
    if (!existing) return
    const value = raw === "" ? null : Number(raw)
    startTransition(async () => {
      const res = await setStaffServiceAction({
        staffId,
        serviceId,
        active: true,
        priceOverride: field === "priceOverride" ? value : existing.priceOverride,
        durationOverride: field === "durationOverride" ? value : existing.durationOverride,
      })
      if (res.ok) toast.success("Preferințe salvate.")
      else toast.error(res.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Servicii prestate și prețuri proprii</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {salonServices.length === 0 && (
          <p className="text-sm text-muted-foreground">Nu există servicii active în salon.</p>
        )}
        {salonServices.map((s) => {
          const linked = byId.get(s.id)
          return (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <Checkbox
                id={`svc-${s.id}`}
                checked={!!linked}
                onCheckedChange={(v) => toggle(s.id, v === true)}
                disabled={pending}
              />
              <Label htmlFor={`svc-${s.id}`} className="min-w-40 flex-1">
                {s.name}
                {s.categoryName ? <span className="block text-xs text-muted-foreground">{s.categoryName}</span> : null}
              </Label>
              {linked && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={linked.priceOverride ?? ""}
                    placeholder={`${linked.basePrice}`}
                    className="w-28"
                    aria-label={`Preț propriu ${s.name}`}
                    onBlur={(e) => saveOverride(s.id, "priceOverride", e.target.value)}
                    disabled={pending}
                  />
                  <Input
                    type="number"
                    min="1"
                    defaultValue={linked.durationOverride ?? ""}
                    placeholder={`${linked.baseDuration}`}
                    className="w-24"
                    aria-label={`Durată proprie ${s.name} (minute)`}
                    onBlur={(e) => saveOverride(s.id, "durationOverride", e.target.value)}
                    disabled={pending}
                  />
                </div>
              )}
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground">
          Lasă câmpurile goale pentru a folosi prețul și durata standard ale serviciului.
        </p>
      </CardContent>
    </Card>
  )
}

// ------------------------------------------------------------
// Concedii & blocări
// ------------------------------------------------------------

function TimeOffAndBlocks({
  staff,
  canManage,
  isSelf,
}: {
  staff: StaffDetail
  canManage: boolean
  isSelf: boolean
}) {
  const [pending, startTransition] = useTransition()

  function decide(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const res = await decideTimeOffAction({ id, status })
      if (res.ok) toast.success(status === "approved" ? "Cerere aprobată." : "Cerere respinsă.")
      else toast.error(res.error)
    })
  }

  function withdraw(id: string) {
    startTransition(async () => {
      // Withdraw = delete own pending request (RLS allows staff own pending).
      const res = await deleteTimeOffAction({ id })
      if (res.ok) toast.success("Cerere retrasă.")
      else toast.error(res.error)
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Concedii și libere</CardTitle>
          {(canManage || isSelf) && <RequestTimeOffDialog staffId={staff.id} />}
        </CardHeader>
        <CardContent className="space-y-2">
          {staff.timeOff.length === 0 && (
            <p className="text-sm text-muted-foreground">Nicio cerere înregistrată.</p>
          )}
          {staff.timeOff.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>
                {new Date(t.startsAt).toLocaleDateString("ro-RO")} –{" "}
                {new Date(t.endsAt).toLocaleDateString("ro-RO")}
                {t.reason ? <span className="text-muted-foreground"> · {t.reason}</span> : null}
                <Badge variant="outline" className="ml-2 align-middle">
                  {TIME_OFF_LABELS[t.status]}
                </Badge>
              </span>
              {canManage && t.status === "pending" && (
                <span className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => decide(t.id, "rejected")}>
                    <X className="size-4" />
                  </Button>
                  <Button size="sm" disabled={pending} onClick={() => decide(t.id, "approved")}>
                    <Check className="size-4" />
                  </Button>
                </span>
              )}
              {isSelf && t.status === "pending" && (
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => withdraw(t.id)}>
                  <Trash2 className="size-4" /> Retrage
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Concediile aprobate blochează automat programările online.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Intervale blocate</CardTitle>
          {(canManage || isSelf) && <AddBlockedSlotDialog staffId={staff.id} />}
        </CardHeader>
        <CardContent className="space-y-2">
          {staff.blockedSlots.length === 0 && (
            <p className="text-sm text-muted-foreground">Niciun interval blocat.</p>
          )}
          {staff.blockedSlots.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>
                <CalendarOff className="mr-2 inline size-4 text-muted-foreground" aria-hidden="true" />
                {new Date(b.startsAt).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })} –{" "}
                {new Date(b.endsAt).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}
                {b.reason ? <span className="text-muted-foreground"> · {b.reason}</span> : null}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteBlockedSlotAction({ id: b.id })
                    if (res.ok) toast.success("Blocare ștearsă.")
                    else toast.error(res.error)
                  })
                }
                aria-label="Șterge blocarea"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function RequestTimeOffDialog({ staffId }: { staffId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await requestTimeOffAction({
        staffId,
        startsAt: new Date(String(formData.get("startsAt"))).toISOString(),
        endsAt: new Date(String(formData.get("endsAt"))).toISOString(),
        reason: formData.get("reason") || null,
      })
      if (res.ok) {
        toast.success("Cerere trimisă.")
        setOpen(false)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Cerere nouă
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerere concediu</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="to-start">De la</Label>
              <Input id="to-start" name="startsAt" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to-end">Până la</Label>
              <Input id="to-end" name="endsAt" type="datetime-local" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to-reason">Motiv</Label>
            <Textarea id="to-reason" name="reason" rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Se trimite…" : "Trimite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddBlockedSlotDialog({ staffId }: { staffId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createBlockedSlotAction({
        staffId,
        startsAt: new Date(String(formData.get("startsAt"))).toISOString(),
        endsAt: new Date(String(formData.get("endsAt"))).toISOString(),
        reason: formData.get("reason") || null,
      })
      if (res.ok) {
        toast.success("Interval blocat.")
        setOpen(false)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Blochează interval
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blochează interval</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-start">De la</Label>
              <Input id="bs-start" name="startsAt" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-end">Până la</Label>
              <Input id="bs-end" name="endsAt" type="datetime-local" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-reason">Motiv</Label>
            <Input id="bs-reason" name="reason" placeholder="Training, personal…" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Se salvează…" : "Blochează"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------
// Statistici
// ------------------------------------------------------------

function StatsPanel({ staff, canSeeFinancials }: { staff: StaffDetail; canSeeFinancials: boolean }) {
  const m = staff.month
  const maxCount = Math.max(1, ...staff.weekTrend.map((d) => d.appointmentsCount))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Programări luna aceasta" value={String(m?.appointmentsCount ?? 0)} />
        {canSeeFinancials && <StatCard label="Venit servicii" value={lei(m?.revenue ?? 0)} />}
        <StatCard label="Rata neprezentărilor" value={pct(m?.noShowRate ?? null)} />
        <StatCard label="Grad de ocupare" value={pct(m?.utilization ?? null)} />
        <StatCard
          label="Rating mediu"
          value={m?.avgRating != null ? `${m.avgRating.toFixed(1)} / 5` : "—"}
        />
        {canSeeFinancials && (
          <StatCard
            label={`Comision (${staff.commissionType ?? "fără"})`}
            value={lei(m?.commissionAmount ?? 0)}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trend săptămânal — ultimele 7 zile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-2" role="img" aria-label="Programări pe ultimele 7 zile">
            {staff.weekTrend.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-muted-foreground">{d.appointmentsCount}</span>
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(d.appointmentsCount / maxCount) * 100}%`, minHeight: d.appointmentsCount > 0 ? 4 : 1 }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(d.day).toLocaleDateString("ro-RO", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
          {canSeeFinancials && (
            <p className="mt-3 text-xs text-muted-foreground">
              Venit pe zi:{" "}
              {staff.weekTrend.map((d) => `${new Date(d.day).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}: ${lei(d.revenue)}`).join(" · ")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

// ------------------------------------------------------------
// Profil
// ------------------------------------------------------------

function ProfileForm({
  staff,
  canDelete,
  canSetCommission,
}: {
  staff: StaffDetail
  canDelete: boolean
  canSetCommission: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    const commissionType = String(formData.get("commissionType") ?? "")
    const commissionRateRaw = String(formData.get("commissionRate") ?? "")
    startTransition(async () => {
      const res = await updateStaffAction({
        id: staff.id,
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        roleTitle: formData.get("roleTitle") || null,
        phone: formData.get("phone") || null,
        email: formData.get("email") || null,
        status: formData.get("status"),
        hiredAt: formData.get("hiredAt") || null,
        notes: formData.get("notes") || null,
        color: formData.get("color") || null,
        commissionType: canSetCommission && commissionType !== "none" ? commissionType : null,
        commissionRate:
          canSetCommission && commissionType !== "none" && commissionRateRaw
            ? Number(commissionRateRaw)
            : null,
      })
      if (res.ok) toast.success("Profil salvat.")
      else setError(res.error)
    })
  }

  function softDelete() {
    startTransition(async () => {
      const res = await updateStaffAction({ id: staff.id, deleted: true })
      if (res.ok) toast.success("Specialist șters din echipă.")
      else toast.error(res.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil specialist</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-first">Prenume</Label>
              <Input id="p-first" name="firstName" defaultValue={staff.firstName} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-last">Nume</Label>
              <Input id="p-last" name="lastName" defaultValue={staff.lastName} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-role">Titlu rol</Label>
              <Input id="p-role" name="roleTitle" defaultValue={staff.roleTitle ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-status">Status</Label>
              <Select name="status" defaultValue={staff.status}>
                <SelectTrigger id="p-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Telefon</Label>
              <Input id="p-phone" name="phone" type="tel" defaultValue={staff.phone ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" name="email" type="email" defaultValue={staff.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-hired">Data angajării</Label>
              <Input id="p-hired" name="hiredAt" type="date" defaultValue={staff.hiredAt ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-color">Culoare calendar</Label>
              <Input id="p-color" name="color" type="color" className="h-9 p-1" defaultValue={staff.color ?? "#71717a"} />
            </div>
            {canSetCommission && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="p-commission">Comision</Label>
                  <Select name="commissionType" defaultValue={staff.commissionType ?? "none"}>
                    <SelectTrigger id="p-commission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Fără comision</SelectItem>
                      {COMMISSION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t === "procent" ? "Procent din servicii" : t === "fix" ? "Fix per serviciu" : "Salariu"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-rate">Valoare comision</Label>
                  <Input
                    id="p-rate"
                    name="commissionRate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={staff.commissionRate ?? ""}
                  />
                </div>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-notes">Note</Label>
            <Textarea id="p-notes" name="notes" rows={3} defaultValue={staff.notes ?? ""} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-between gap-2">
            {canDelete ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={pending}>
                    <Trash2 className="size-4" /> Șterge specialistul
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ștergi specialistul?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Specialistul va fi marcat ca șters (soft delete) — istoricul programărilor rămâne intact.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                    <AlertDialogAction onClick={softDelete}>Șterge</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={pending}>
              <Save className="size-4" /> {pending ? "Se salvează…" : "Salvează"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ------------------------------------------------------------
// Invitație
// ------------------------------------------------------------

function InviteDialog({ staffId }: { staffId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await inviteStaffAction({ staffId, email: formData.get("email") })
      if (res.ok) {
        setInviteUrl(res.data.url)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="size-4" /> Invită în aplicație
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invită specialistul în aplicație</DialogTitle>
        </DialogHeader>
        {inviteUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Trimite acest link specialistului. Contul creat va fi legat de fișa lui.
            </p>
            <Input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} />
            <Button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl)
                toast.success("Link copiat.")
              }}
            >
              <Copy className="size-4" /> Copiază linkul
            </Button>
          </div>
        ) : (
          <form action={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email specialist</Label>
              <Input id="inv-email" name="email" type="email" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Anulează
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Se creează…" : "Creează invitație"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
