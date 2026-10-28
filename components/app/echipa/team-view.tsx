"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Search, Check, X, ChevronRight } from "lucide-react"
import type { StaffListItem, TimeOffItem } from "@/lib/mappers/echipa"
import { createStaffAction, decideTimeOffAction } from "@/app/app/echipa/actions"
import { COMMISSION_TYPES, STAFF_STATUSES } from "@/lib/validation/echipa"

const STATUS_STYLES: Record<string, string> = {
  activ: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  concediu: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  inactiv: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
}
const STATUS_LABELS: Record<string, string> = {
  activ: "Activ",
  concediu: "Concediu",
  inactiv: "Inactiv",
}
const lei = (v: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(v)

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

export function TeamView({
  items,
  canSeeFinancials,
  canManage,
  canDelete,
  pendingTimeOff,
  staffNames,
}: {
  items: StaffListItem[]
  canSeeFinancials: boolean
  canManage: boolean
  canDelete: boolean
  pendingTimeOff: TimeOffItem[]
  staffNames: Record<string, string>
}) {
  const [query, setQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.roleTitle ?? ""}`.toLowerCase().includes(q),
    )
  }, [items, query])

  function decide(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const res = await decideTimeOffAction({ id, status })
      if (res.ok) toast.success(status === "approved" ? "Cerere aprobată." : "Cerere respinsă.")
      else toast.error(res.error)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Echipa</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} specialiști activi
          </p>
        </div>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Adaugă specialist
              </Button>
            </DialogTrigger>
            <AddStaffDialog onDone={() => setAddOpen(false)} canSetCommission={canDelete} />
          </Dialog>
        )}
      </div>

      {canDelete && pendingTimeOff.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 text-sm font-medium">Cereri de concediu în așteptare</h2>
            <ul className="space-y-2">
              {pendingTimeOff.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{staffNames[t.staffId] ?? "Specialist"}</span>{" "}
                    · {new Date(t.startsAt).toLocaleDateString("ro-RO")} –{" "}
                    {new Date(t.endsAt).toLocaleDateString("ro-RO")}
                    {t.reason ? <span className="text-muted-foreground"> · {t.reason}</span> : null}
                  </span>
                  <span className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => decide(t.id, "rejected")}>
                      <X className="size-4" /> Respinde
                    </Button>
                    <Button size="sm" disabled={pending} onClick={() => decide(t.id, "approved")}>
                      <Check className="size-4" /> Aprobă
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută specialist…"
          className="pl-9"
          aria-label="Caută specialist"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                {canSeeFinancials && (
                  <>
                    <TableHead className="text-right">Programări</TableHead>
                    <TableHead className="text-right">Venit lună</TableHead>
                    <TableHead className="text-right">Comision</TableHead>
                  </>
                )}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canSeeFinancials ? 7 : 4} className="py-10 text-center text-muted-foreground">
                    Niciun specialist găsit.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/app/echipa/${s.id}`} className="flex items-center gap-3 hover:underline">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: s.color ?? "#71717a" }}
                        aria-hidden="true"
                      >
                        {initials(s.firstName, s.lastName)}
                      </span>
                      <span>
                        <span className="font-medium">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="block text-xs text-muted-foreground">{s.roleTitle ?? "—"}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_STYLES[s.status]}>
                      {STATUS_LABELS[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {s.phone ?? s.email ?? "—"}
                  </TableCell>
                  {canSeeFinancials && (
                    <>
                      <TableCell className="text-right tabular-nums">{s.month?.appointmentsCount ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{lei(s.month?.revenue ?? 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{lei(s.month?.commissionAmount ?? 0)}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <Link href={`/app/echipa/${s.id}`} aria-label={`Deschide ${s.firstName} ${s.lastName}`}>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AddStaffDialog({
  onDone,
  canSetCommission,
}: {
  onDone: () => void
  canSetCommission: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    const commissionType = String(formData.get("commissionType") ?? "")
    const commissionRateRaw = String(formData.get("commissionRate") ?? "")
    startTransition(async () => {
      const res = await createStaffAction({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        roleTitle: formData.get("roleTitle") || null,
        phone: formData.get("phone") || null,
        email: formData.get("email") || null,
        status: formData.get("status") || "activ",
        hiredAt: formData.get("hiredAt") || null,
        notes: formData.get("notes") || null,
        color: formData.get("color") || null,
        commissionType: canSetCommission && commissionType !== "none" ? commissionType : null,
        commissionRate:
          canSetCommission && commissionType !== "none" && commissionRateRaw
            ? Number(commissionRateRaw)
            : null,
      })
      if (res.ok) {
        toast.success("Specialist adăugat.")
        onDone()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Adaugă specialist</DialogTitle>
      </DialogHeader>
      <form action={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prenume</Label>
            <Input id="firstName" name="firstName" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nume</Label>
            <Input id="lastName" name="lastName" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="roleTitle">Titlu rol</Label>
            <Input id="roleTitle" name="roleTitle" placeholder="Stilist, Colorist…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="activ">
              <SelectTrigger id="status">
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
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="hiredAt">Data angajării</Label>
            <Input id="hiredAt" name="hiredAt" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Culoare calendar</Label>
            <Input id="color" name="color" type="color" className="h-9 p-1" defaultValue="#71717a" />
          </div>
        </div>
        {canSetCommission && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="commissionType">Comision</Label>
              <Select name="commissionType" defaultValue="none">
                <SelectTrigger id="commissionType">
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
              <Label htmlFor="commissionRate">Valoare</Label>
              <Input id="commissionRate" name="commissionRate" type="number" min="0" step="0.01" />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Anulează
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Se salvează…" : "Salvează"}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
