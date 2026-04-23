"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  TrendingUp,
  Star,
  Heart,
  Phone,
  Mail,
  Calendar,
  ArrowUpRight,
  Download,
  Tag,
  Filter,
  ChevronDown,
  AlertTriangle,
} from "lucide-react"
import {
  CLIENTS_DATA,
  TAG_COLORS,
  getInitials,
  formatDate,
  getDaysSince,
  type Tag as ClientTag,
  type Sursa,
  type Sex,
  type ComunicarePreferinta,
} from "@/lib/clienti-data"
import { cn } from "@/lib/utils"

const ALL_TAGS: ClientTag[] = ["VIP", "Nou", "Inactiv", "Frecvent", "Sensibil", "Fidel"]
const ALL_STAFF = ["Ana Ionescu", "Cristina Popa", "Mara Stancu", "Diana Florea"]

function exportCSV(clients: typeof CLIENTS_DATA) {
  const headers = ["Prenume", "Nume", "Telefon", "Email", "Ultima vizita", "Total vizite", "Total cheltuit", "Taguri"]
  const rows = clients.map(c => [
    c.prenume, c.nume, c.phone, c.email,
    formatDate(c.lastVisit), c.totalVisits, c.totalSpent,
    c.tags.join("; ")
  ])
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "clienti-asesor.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function ClientiPage() {
  const [search, setSearch] = useState("")
  const [filterTag, setFilterTag] = useState<ClientTag | "all">("all")
  const [filterStaff, setFilterStaff] = useState<string>("all")
  const [filterLastVisit, setFilterLastVisit] = useState<string>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [bulkTagOpen, setBulkTagOpen] = useState(false)

  // Add client form state
  const [form, setForm] = useState({
    prenume: "", nume: "", phone: "", email: "",
    dataNasterii: "", sex: "F" as Sex, sursa: "Walk-in" as Sursa,
    tags: [] as ClientTag[], alergii: "", comunicare: "SMS" as ComunicarePreferinta,
    notes: "", gdpr: false,
  })

  const filtered = useMemo(() => {
    return CLIENTS_DATA.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        `${c.prenume} ${c.nume}`.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      const matchTag = filterTag === "all" || c.tags.includes(filterTag)
      const matchStaff = filterStaff === "all" || c.preferredStaff === filterStaff
      const days = getDaysSince(c.lastVisit)
      const matchVisit =
        filterLastVisit === "all" ? true :
        filterLastVisit === "30" ? days <= 30 :
        filterLastVisit === "90" ? days <= 90 :
        filterLastVisit === "180" ? days <= 180 :
        days > 180
      return matchSearch && matchTag && matchStaff && matchVisit
    })
  }, [search, filterTag, filterStaff, filterLastVisit])

  const stats = [
    { label: "Total clienți", value: CLIENTS_DATA.length, icon: Users, sub: `${CLIENTS_DATA.filter(c => getDaysSince(c.clientDin) <= 30).length} noi luna aceasta` },
    { label: "Clienți VIP", value: CLIENTS_DATA.filter(c => c.tags.includes("VIP")).length, icon: Star, sub: "cu tag VIP" },
    { label: "Clienți inactivi", value: CLIENTS_DATA.filter(c => getDaysSince(c.lastVisit) > 90).length, icon: TrendingUp, sub: "fără vizită 90+ zile" },
    { label: "Rată retenție", value: "78%", icon: Heart, sub: "+3% față de luna trecută" },
  ]

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clienți</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestionează relațiile cu clienții tăi</p>
        </div>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 self-start sm:self-auto"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Client nou
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-accent" />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după nume, telefon, email..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterTag} onValueChange={v => setFilterTag(v as ClientTag | "all")}>
          <SelectTrigger className="w-[140px]">
            <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate tagurile</SelectItem>
            {ALL_TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stilist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toți stilișii</SelectItem>
            {ALL_STAFF.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLastVisit} onValueChange={setFilterLastVisit}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Ultima vizită" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Orice dată</SelectItem>
            <SelectItem value="30">Ultimele 30 zile</SelectItem>
            <SelectItem value="90">Ultimele 90 zile</SelectItem>
            <SelectItem value="180">Ultimele 180 zile</SelectItem>
            <SelectItem value="old">Peste 180 zile</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent"
          onClick={() => exportCSV(filtered)}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
          <span className="font-medium">{selected.size} selectat{selected.size > 1 ? "i" : ""}</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-7 gap-1.5 bg-transparent" onClick={() => setBulkTagOpen(true)}>
            <Tag className="h-3.5 w-3.5" /> Adaugă tag
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 bg-transparent" onClick={() => exportCSV(CLIENTS_DATA.filter(c => selected.has(c.id)))}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-muted-foreground" onClick={() => setSelected(new Set())}>
            Anulează
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <div className="flex items-center">
            <Checkbox
              checked={selected.size === filtered.length && filtered.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label="Selectează toți"
            />
          </div>
          <span>Client</span>
          <span className="hidden md:block">Ultima vizită</span>
          <span className="hidden lg:block">Vizite</span>
          <span className="hidden lg:block text-right">Total RON</span>
          <span className="hidden md:block">Taguri</span>
          <span />
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-sm">Niciun client găsit</p>
          </div>
        ) : (
          filtered.map(client => {
            const days = getDaysSince(client.lastVisit)
            const isOverdue = days > 90
            return (
              <div
                key={client.id}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3.5 border-b border-border/60 transition-colors hover:bg-muted/30",
                  selected.has(client.id) && "bg-accent/5"
                )}
              >
                <div onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(client.id)}
                    onCheckedChange={() => toggleSelect(client.id)}
                    aria-label={`Selectează ${client.prenume}`}
                  />
                </div>

                {/* Name + contact */}
                <Link href={`/app/clienti/${client.id}`} className="flex items-center gap-3 min-w-0 group">
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center">
                      <span className="text-xs font-semibold text-accent">
                        {getInitials(client.prenume, client.nume)}
                      </span>
                    </div>
                    {client.alergii && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center" title="Are alergii!">
                        <AlertTriangle className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                      {client.prenume} {client.nume}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{client.phone}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />{client.email}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Ultima vizita */}
                <div className="hidden md:block text-right">
                  <p className={cn("text-sm", isOverdue && "text-red-500 font-medium")}>{formatDate(client.lastVisit)}</p>
                  <p className="text-xs text-muted-foreground">{days} zile</p>
                </div>

                {/* Vizite */}
                <div className="hidden lg:block text-center">
                  <span className="text-sm font-medium">{client.totalVisits}</span>
                </div>

                {/* Total spent */}
                <div className="hidden lg:block text-right">
                  <span className="text-sm font-medium">{client.totalSpent.toLocaleString("ro-RO")} Lei</span>
                </div>

                {/* Tags */}
                <div className="hidden md:flex flex-wrap gap-1 max-w-[140px]">
                  {client.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", TAG_COLORS[tag])}
                    >
                      {tag}
                    </span>
                  ))}
                  {client.tags.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{client.tags.length - 2}</span>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                      <Link href={`/app/clienti/${client.id}`}>
                        <ArrowUpRight className="h-4 w-4 mr-2" /> Vezi profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="h-4 w-4 mr-2" /> Programare nouă
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Phone className="h-4 w-4 mr-2" /> Sună
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Șterge</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground text-right">{filtered.length} din {CLIENTS_DATA.length} clienți</p>

      {/* Add Client Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client nou</DialogTitle>
          </DialogHeader>
          <form className="space-y-5 py-2" onSubmit={e => { e.preventDefault(); setIsAddOpen(false) }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prenume">Prenume <span className="text-destructive">*</span></Label>
                <Input id="prenume" value={form.prenume} onChange={e => setForm(f => ({ ...f, prenume: e.target.value }))} placeholder="Maria" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nume">Nume <span className="text-destructive">*</span></Label>
                <Input id="nume" value={form.nume} onChange={e => setForm(f => ({ ...f, nume: e.target.value }))} placeholder="Popescu" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefon <span className="text-destructive">*</span></Label>
                <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="07XX XXX XXX" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplu.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dob">Data nașterii</Label>
                <Input id="dob" type="date" value={form.dataNasterii} onChange={e => setForm(f => ({ ...f, dataNasterii: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sex</Label>
                <Select value={form.sex} onValueChange={v => setForm(f => ({ ...f, sex: v as Sex }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Feminin</SelectItem>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="Nespecificat">Nespecificat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sursa</Label>
                <Select value={form.sursa} onValueChange={v => setForm(f => ({ ...f, sursa: v as Sursa }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Google","Instagram","Recomandare","Walk-in","Facebook","Altele"] as Sursa[]).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Comunicare preferată</Label>
                <Select value={form.comunicare} onValueChange={v => setForm(f => ({ ...f, comunicare: v as ComunicarePreferinta }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["SMS","Email","WhatsApp"] as ComunicarePreferinta[]).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alergii" className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                Alergii / Sensibilități
              </Label>
              <Textarea
                id="alergii"
                value={form.alergii}
                onChange={e => setForm(f => ({ ...f, alergii: e.target.value }))}
                placeholder="Ex: alergie la PPD, piele sensibilă la produse cu alcool..."
                className="min-h-[70px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observații, preferințe..."
                className="min-h-[60px]"
              />
            </div>
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="gdpr"
                checked={form.gdpr}
                onCheckedChange={v => setForm(f => ({ ...f, gdpr: !!v }))}
              />
              <Label htmlFor="gdpr" className="text-sm leading-relaxed cursor-pointer">
                Clientul și-a dat consimțământul GDPR pentru stocarea datelor personale.
              </Label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => setIsAddOpen(false)}>
                Anulează
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Salvează client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
