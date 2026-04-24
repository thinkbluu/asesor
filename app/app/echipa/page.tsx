"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Plus, Search, LayoutGrid, List, MoreHorizontal,
  Users, Calendar, TrendingUp, Star, Phone, Mail, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  STAFF_DATA, ALL_SERVICES, ROLES, STATUS_STYLES, STATUS_LABELS,
  getInitials, getFullName,
  type StaffMember, type StaffStatus, type RoleType, type CommissionType,
} from "@/lib/echipa-data"

const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS.map((d) => [d, { start: "09:00", end: "18:00", active: d !== "Duminică" }])
)

interface FormState {
  firstName: string; lastName: string; phone: string; email: string
  role: RoleType; dataAngajare: string; notes: string
  services: string[]; commissionType: CommissionType; commissionRate: string
}

const EMPTY_FORM: FormState = {
  firstName: "", lastName: "", phone: "", email: "",
  role: "Stilist", dataAngajare: "", notes: "",
  services: [], commissionType: "procent", commissionRate: "35",
}

export default function EchipaPage() {
  const [view, setView] = useState<"grid" | "table">("grid")
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const filtered = useMemo(() => {
    return STAFF_DATA.filter((m) => {
      const name = getFullName(m).toLowerCase()
      if (search && !name.includes(search.toLowerCase())) return false
      if (filterRole !== "all" && m.role !== filterRole) return false
      if (filterStatus !== "all" && m.status !== filterStatus) return false
      return true
    })
  }, [search, filterRole, filterStatus])

  const totalAppointments = STAFF_DATA.reduce((a, m) => a + m.stats.appointmentsThisMonth, 0)
  const totalRevenue = STAFF_DATA.reduce((a, m) => a + m.stats.revenueThisMonth, 0)
  const avgRating = (STAFF_DATA.reduce((a, m) => a + m.stats.avgRating, 0) / STAFF_DATA.length).toFixed(1)

  const toggleService = (svc: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(svc) ? f.services.filter((s) => s !== svc) : [...f.services, svc],
    }))
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance">Echipa</h1>
          <p className="text-muted-foreground">Gestionează membrii echipei și performanța</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Angajat nou
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Angajat nou</DialogTitle>
            </DialogHeader>
            <form className="space-y-6 py-2" onSubmit={(e) => { e.preventDefault(); setIsAddOpen(false); setForm(EMPTY_FORM) }}>
              {/* Personal info */}
              <div>
                <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Date personale</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Prenume</Label>
                    <Input placeholder="Ex: Ana" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nume</Label>
                    <Input placeholder="Ex: Marinescu" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefon</Label>
                    <Input placeholder="07XX XXX XXX" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@salon.ro" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as RoleType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data angajare</Label>
                    <Input type="date" value={form.dataAngajare} onChange={(e) => setForm((f) => ({ ...f, dataAngajare: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Servicii efectuate</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALL_SERVICES.map((svc) => (
                    <label key={svc} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox checked={form.services.includes(svc)} onCheckedChange={() => toggleService(svc)} />
                      {svc}
                    </label>
                  ))}
                </div>
              </div>

              {/* Commission */}
              <div>
                <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Comision</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tip comision</Label>
                    <Select value={form.commissionType} onValueChange={(v) => setForm((f) => ({ ...f, commissionType: v as CommissionType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="procent">Procent din venituri</SelectItem>
                        <SelectItem value="fix">Fix per programare (RON)</SelectItem>
                        <SelectItem value="salariu">Doar salariu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.commissionType !== "salariu" && (
                    <div className="space-y-1.5">
                      <Label>{form.commissionType === "procent" ? "Procent (%)" : "Sumă fixă (RON)"}</Label>
                      <Input type="number" value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notițe interne</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Informații suplimentare..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setForm(EMPTY_FORM) }}>Anulează</Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Salvează angajat</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total angajați", value: STAFF_DATA.length },
          { icon: Calendar, label: "Programări luna aceasta", value: totalAppointments },
          { icon: TrendingUp, label: "Venituri luna aceasta", value: `${totalRevenue.toLocaleString()} Lei` },
          { icon: Star, label: "Rating mediu echipă", value: avgRating },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <p className="mt-4 text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative w-full min-w-0 sm:min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Caută după nume..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Toate rolurile" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate rolurile</SelectItem>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Toate statusurile" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              <SelectItem value="activ">Activ</SelectItem>
              <SelectItem value="concediu">Concediu</SelectItem>
              <SelectItem value="inactiv">Inactiv</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <button
            onClick={() => setView("grid")}
            className={cn("rounded p-1.5 transition-colors", view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={cn("rounded p-1.5 transition-colors", view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <Card key={member.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {getInitials(member)}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{getFullName(member)}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link href={`/app/echipa/${member.id}`}>Vezi profil</Link></DropdownMenuItem>
                      <DropdownMenuItem>Editează</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Dezactivează</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[member.status])}>
                    {STATUS_LABELS[member.status]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {member.stats.todayAppointments} programări azi
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3">
                  <div className="text-center">
                    <p className="text-base font-bold">{member.stats.appointmentsThisMonth}</p>
                    <p className="text-xs text-muted-foreground">Programări</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-base font-bold text-accent">{member.stats.utilizationRate}%</p>
                    <p className="text-xs text-muted-foreground">Utilizare</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold">{member.stats.avgRating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-1">
                  {member.services.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">{s}</span>
                  ))}
                  {member.services.length > 3 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{member.services.length - 3}</span>
                  )}
                </div>

                <Link
                  href={`/app/echipa/${member.id}`}
                  className="flex items-center justify-between text-sm text-accent hover:underline font-medium"
                >
                  Vezi profil complet
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Angajat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Azi</TableHead>
                <TableHead>Programări / lună</TableHead>
                <TableHead>Venituri / lună</TableHead>
                <TableHead>Utilizare</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                        {getInitials(member)}
                      </div>
                      <div>
                        <p className="font-medium">{getFullName(member)}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[member.status])}>
                      {STATUS_LABELS[member.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{member.stats.todayAppointments}</TableCell>
                  <TableCell className="text-sm">{member.stats.appointmentsThisMonth}</TableCell>
                  <TableCell className="text-sm font-medium">{member.stats.revenueThisMonth.toLocaleString()} Lei</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${member.stats.utilizationRate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{member.stats.utilizationRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {member.stats.avgRating}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/app/echipa/${member.id}`}>
                      <Button variant="ghost" size="sm" className="h-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>Niciun angajat găsit.</p>
        </div>
      )}
    </div>
  )
}
