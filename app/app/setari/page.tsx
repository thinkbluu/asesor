"use client"

import { useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Clock,
  CreditCard,
  Bell,
  Shield,
  FileText,
  Upload,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Download,
  Scissors,
  Award,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SettingsServicii } from "@/components/app/settings-servicii"
import { SettingsWhatsApp } from "@/components/app/settings-whatsapp"
import { SettingsLoialitate } from "@/components/app/settings-loialitate"
import { SettingsReviews } from "@/components/app/settings-reviews"

// --- Types ---
interface DaySchedule {
  day: string
  isOpen: boolean
  open: string
  close: string
  break?: { start: string; end: string; label: string } | null
}

interface Holiday {
  id: number
  date: string
  reason: string
}

interface RolePermissions {
  role: string
  description: string
  permissions: Record<string, boolean>
}

// --- Initial state ---
const MODULES = ["Dashboard", "Programări", "Clienți", "Echipă", "Stocuri", "Financiar", "Marketing", "Setări"]

const initialSchedule: DaySchedule[] = [
  { day: "Luni", isOpen: true, open: "09:00", close: "20:00", break: null },
  { day: "Marți", isOpen: true, open: "09:00", close: "20:00", break: null },
  { day: "Miercuri", isOpen: true, open: "09:00", close: "20:00", break: null },
  { day: "Joi", isOpen: true, open: "09:00", close: "20:00", break: null },
  { day: "Vineri", isOpen: true, open: "09:00", close: "20:00", break: null },
  { day: "Sâmbătă", isOpen: true, open: "10:00", close: "18:00", break: null },
  { day: "Duminică", isOpen: false, open: "", close: "", break: null },
]

const initialRoles: RolePermissions[] = [
  {
    role: "Administrator",
    description: "Acces complet la toate modulele",
    permissions: Object.fromEntries(MODULES.map((m) => [m, true])),
  },
  {
    role: "Manager",
    description: "Acces la toate modulele, fără Setări",
    permissions: Object.fromEntries(MODULES.map((m) => [m, m !== "Setări"])),
  },
  {
    role: "Receptioner",
    description: "Programări și clienți",
    permissions: Object.fromEntries(MODULES.map((m) => [m, ["Dashboard", "Programări", "Clienți"].includes(m)])),
  },
  {
    role: "Angajat",
    description: "Doar propriile programări",
    permissions: Object.fromEntries(MODULES.map((m) => [m, ["Dashboard", "Programări"].includes(m)])),
  },
]

// --- Tab config ---
const TABS = [
  { id: "profil", label: "Profil Salon", icon: Building2 },
  { id: "program", label: "Program de Lucru", icon: Clock },
  { id: "servicii", label: "Servicii", icon: Scissors },
  { id: "politici", label: "Politici", icon: FileText },
  { id: "notificari", label: "Notificări", icon: Bell },
  { id: "loialitate", label: "Loialitate", icon: Award },
  { id: "recenzii", label: "Recenzii Google", icon: Star },
  { id: "abonament", label: "Abonament", icon: CreditCard },
  { id: "permisiuni", label: "Permisiuni", icon: Shield },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get("tab") ?? "profil"
  const setActiveTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const [unsaved, setUnsaved] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profil state
  const [profil, setProfil] = useState({
    name: "Beauty Studio",
    description: "Salon de beauty premium în centrul Bucureștiului",
    phone: "0722 123 456",
    email: "contact@beautystudio.ro",
    website: "https://beautystudio.ro",
    address: "Str. Victoriei 123",
    city: "București",
    judet: "Ilfov",
    codPostal: "010012",
    facebook: "",
    instagram: "",
    google: "",
    cui: "RO12345678",
    jNumber: "J40/1234/2020",
  })

  // Program state
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule)
  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: 1, date: "2025-01-01", reason: "Anul Nou" },
    { id: 2, date: "2025-12-25", reason: "Crăciun" },
  ])
  const [newHoliday, setNewHoliday] = useState({ date: "", reason: "" })

  // Politici state
  const [politici, setPolitici] = useState({
    cancelFreeWindow: "24",
    cancelFee: "50",
    noShowFee: "100",
    noShowAutoFlag: "2",
    minAdvance: "2",
    maxFuture: "30",
    depositEnabled: false,
    depositType: "ron",
    depositAmount: "50",
  })

  // Notificari state
  const [notif, setNotif] = useState({
    smsConfirmare: true,
    emailConfirmare: true,
    smsReminder: true,
    smsReminderHours: "24",
    emailReminder: true,
    noShowAlert: true,
    dailySummary: false,
  })

  // Roles state
  const [roles, setRoles] = useState<RolePermissions[]>(initialRoles)

  const markDirty = () => { setUnsaved(true); setSaved(false) }

  const handleSave = () => {
    setUnsaved(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const copyScheduleToAll = (dayIndex: number) => {
    const source = schedule[dayIndex]
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === 0 ? d : { ...d, open: source.open, close: source.close, isOpen: source.isOpen }
      )
    )
    markDirty()
  }

  const smsPreview = `Buna ziua, {{nume_client}}! Va asteptam la {{salon}} pe {{data}} la ora {{ora}} pentru {{serviciu}}. Va multumim!`

  return (
    <div className="flex min-h-screen flex-col">
      {/* Page header */}
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">Setări</h1>
          <p className="text-xs text-muted-foreground">Configurează salonul tău</p>
        </div>
        <div className="flex items-center gap-3">
          {unsaved && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Modificări nesalvate
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-accent">
              <Check className="h-3.5 w-3.5" />
              Salvat
            </div>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!unsaved}
            className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
          >
            Salvează modificările
          </Button>
        </div>
      </div>

      <div className="flex flex-1 pt-4">
        {/* Vertical tab sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-border px-3 lg:block">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
                {activeTab === tab.id && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="flex overflow-x-auto border-b border-border px-4 pb-0 lg:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto px-4 py-6 lg:px-8">

          {/* ── PROFIL SALON ── */}
          {activeTab === "profil" && (
            <div className="max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informații generale</CardTitle>
                  <CardDescription>Datele de bază ale salonului tău</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Logo upload */}
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-2xl font-bold text-muted-foreground">
                      BS
                    </div>
                    <div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" /> Încarcă logo
                      </Button>
                      <p className="mt-1 text-xs text-muted-foreground">PNG, JPG max 2MB</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Numele salonului</Label>
                      <Input value={profil.name} onChange={(e) => { setProfil({ ...profil, name: e.target.value }); markDirty() }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefon</Label>
                      <Input value={profil.phone} onChange={(e) => { setProfil({ ...profil, phone: e.target.value }); markDirty() }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Descriere</Label>
                    <Textarea
                      value={profil.description}
                      rows={3}
                      onChange={(e) => { setProfil({ ...profil, description: e.target.value }); markDirty() }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={profil.email} onChange={(e) => { setProfil({ ...profil, email: e.target.value }); markDirty() }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Website</Label>
                      <Input value={profil.website} onChange={(e) => { setProfil({ ...profil, website: e.target.value }); markDirty() }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adresă</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Stradă și număr</Label>
                    <Input value={profil.address} onChange={(e) => { setProfil({ ...profil, address: e.target.value }); markDirty() }} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Oraș</Label>
                      <Input value={profil.city} onChange={(e) => { setProfil({ ...profil, city: e.target.value }); markDirty() }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Județ</Label>
                      <Input value={profil.judet} onChange={(e) => { setProfil({ ...profil, judet: e.target.value }); markDirty() }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cod poștal</Label>
                      <Input value={profil.codPostal} onChange={(e) => { setProfil({ ...profil, codPostal: e.target.value }); markDirty() }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Facebook URL</Label>
                    <Input placeholder="https://facebook.com/salonultau" value={profil.facebook} onChange={(e) => { setProfil({ ...profil, facebook: e.target.value }); markDirty() }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instagram URL</Label>
                    <Input placeholder="https://instagram.com/salonultau" value={profil.instagram} onChange={(e) => { setProfil({ ...profil, instagram: e.target.value }); markDirty() }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Google Business URL</Label>
                    <Input placeholder="https://g.page/salonultau" value={profil.google} onChange={(e) => { setProfil({ ...profil, google: e.target.value }); markDirty() }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Date fiscale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>CUI</Label>
                      <Input value={profil.cui} onChange={(e) => { setProfil({ ...profil, cui: e.target.value }); markDirty() }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nr. Registrul Comerțului</Label>
                      <Input value={profil.jNumber} onChange={(e) => { setProfil({ ...profil, jNumber: e.target.value }); markDirty() }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Monedă</Label>
                      <Input value="RON" disabled className="bg-muted text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── SERVICII ── */}
          {activeTab === "servicii" && <SettingsServicii />}

          {/* ── PROGRAM DE LUCRU ── */}
          {activeTab === "program" && (
            <div className="max-w-3xl space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Program săptămânal</CardTitle>
                    <CardDescription>Orele de funcționare pentru fiecare zi</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {schedule.map((day, i) => (
                    <div key={day.day} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-24 shrink-0">
                          <span className="text-sm font-medium">{day.day}</span>
                        </div>
                        <Switch
                          checked={day.isOpen}
                          onCheckedChange={(v) => {
                            setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, isOpen: v } : d))
                            markDirty()
                          }}
                        />
                        {day.isOpen ? (
                          <>
                            <Input
                              type="time"
                              value={day.open}
                              className="h-8 w-28 text-sm"
                              onChange={(e) => {
                                setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, open: e.target.value } : d))
                                markDirty()
                              }}
                            />
                            <span className="text-muted-foreground">—</span>
                            <Input
                              type="time"
                              value={day.close}
                              className="h-8 w-28 text-sm"
                              onChange={(e) => {
                                setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, close: e.target.value } : d))
                                markDirty()
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-xs text-muted-foreground"
                              onClick={() => copyScheduleToAll(i)}
                            >
                              <Copy className="h-3 w-3" /> Copiază la toate
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Închis</span>
                        )}
                      </div>

                      {/* Break row */}
                      {day.isOpen && (
                        <div className="ml-24 pl-3">
                          {day.break ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">Pauză:</span>
                              <Input type="time" value={day.break.start} className="h-7 w-24 text-xs"
                                onChange={(e) => {
                                  setSchedule((prev) => prev.map((d, idx) => idx === i && d.break ? { ...d, break: { ...d.break, start: e.target.value } } : d))
                                  markDirty()
                                }}
                              />
                              <span className="text-xs text-muted-foreground">—</span>
                              <Input type="time" value={day.break.end} className="h-7 w-24 text-xs"
                                onChange={(e) => {
                                  setSchedule((prev) => prev.map((d, idx) => idx === i && d.break ? { ...d, break: { ...d.break, end: e.target.value } } : d))
                                  markDirty()
                                }}
                              />
                              <Input value={day.break.label} placeholder="Etichetă" className="h-7 w-36 text-xs"
                                onChange={(e) => {
                                  setSchedule((prev) => prev.map((d, idx) => idx === i && d.break ? { ...d, break: { ...d.break, label: e.target.value } } : d))
                                  markDirty()
                                }}
                              />
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                                onClick={() => { setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, break: null } : d)); markDirty() }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground"
                              onClick={() => {
                                setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, break: { start: "13:00", end: "14:00", label: "Pauza de prânz" } } : d))
                                markDirty()
                              }}>
                              <Plus className="h-3 w-3" /> Adaugă pauză
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Zile libere / Închideri</CardTitle>
                    <CardDescription>Adaugă sărbători sau perioade de închidere</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {holidays.map((h) => (
                      <div key={h.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5">
                        <span className="text-sm font-medium tabular-nums">{h.date}</span>
                        <span className="flex-1 text-sm text-muted-foreground">{h.reason}</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => { setHolidays((prev) => prev.filter((x) => x.id !== h.id)); markDirty() }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="date"
                      className="h-9 w-40 text-sm"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    />
                    <Input
                      placeholder="Motiv (ex: Crăciun)"
                      className="h-9 flex-1 min-w-40 text-sm"
                      value={newHoliday.reason}
                      onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })}
                    />
                    <Button size="sm" variant="outline" className="h-9 gap-1"
                      onClick={() => {
                        if (!newHoliday.date || !newHoliday.reason) return
                        setHolidays((prev) => [...prev, { id: Date.now(), ...newHoliday }])
                        setNewHoliday({ date: "", reason: "" })
                        markDirty()
                      }}>
                      <Plus className="h-4 w-4" /> Adaugă
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── POLITICI ── */}
          {activeTab === "politici" && (
            <div className="max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Anulări</CardTitle>
                  <CardDescription>Regulile de anulare a programărilor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Termen gratuit de anulare</Label>
                      <Select value={politici.cancelFreeWindow} onValueChange={(v) => { setPolitici({ ...politici, cancelFreeWindow: v }); markDirty() }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["1", "2", "4", "6", "12", "24", "48"].map((h) => (
                            <SelectItem key={h} value={h}>{h} ore înainte</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Taxă anulare tardivă (RON)</Label>
                      <Input type="number" min={0} value={politici.cancelFee}
                        onChange={(e) => { setPolitici({ ...politici, cancelFee: e.target.value }); markDirty() }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>No-show</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Taxă no-show (RON)</Label>
                      <Input type="number" min={0} value={politici.noShowFee}
                        onChange={(e) => { setPolitici({ ...politici, noShowFee: e.target.value }); markDirty() }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Auto-flagging după X no-show-uri</Label>
                      <Select value={politici.noShowAutoFlag} onValueChange={(v) => { setPolitici({ ...politici, noShowAutoFlag: v }); markDirty() }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["1", "2", "3", "5"].map((n) => <SelectItem key={n} value={n}>{n} no-show-uri</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reguli programare</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Timp minim înainte de programare</Label>
                      <Select value={politici.minAdvance} onValueChange={(v) => { setPolitici({ ...politici, minAdvance: v }); markDirty() }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["1", "2", "4", "6", "12", "24"].map((h) => <SelectItem key={h} value={h}>{h} ore</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fereastră maximă de rezervare</Label>
                      <Select value={politici.maxFuture} onValueChange={(v) => { setPolitici({ ...politici, maxFuture: v }); markDirty() }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["7", "14", "30", "60", "90"].map((d) => <SelectItem key={d} value={d}>{d} zile</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avans / Deposit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Solicită avans la rezervare</p>
                      <p className="text-xs text-muted-foreground">Clientul plătește un avans online pentru a confirma</p>
                    </div>
                    <Switch checked={politici.depositEnabled} onCheckedChange={(v) => { setPolitici({ ...politici, depositEnabled: v }); markDirty() }} />
                  </div>
                  {politici.depositEnabled && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label>Valoare avans</Label>
                        <Input type="number" min={0} value={politici.depositAmount}
                          onChange={(e) => { setPolitici({ ...politici, depositAmount: e.target.value }); markDirty() }} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tip</Label>
                        <Select value={politici.depositType} onValueChange={(v) => { setPolitici({ ...politici, depositType: v }); markDirty() }}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ron">RON</SelectItem>
                            <SelectItem value="pct">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── NOTIFICARI ── */}
          {activeTab === "notificari" && (
            <div className="max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Canale de notificare</CardTitle>
                  <CardDescription>Configurează ce mesaje automate trimite ASESOR</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {[
                    { key: "smsConfirmare", label: "SMS confirmare programare", desc: "Trimis imediat după ce clientul se programează" },
                    { key: "emailConfirmare", label: "Email confirmare programare", desc: "Email detaliat cu informații despre programare" },
                    { key: "emailReminder", label: "Email reminder", desc: "Trimis cu o zi înainte de programare" },
                    { key: "noShowAlert", label: "Notificare no-show către proprietar", desc: "Alertă când un client nu s-a prezentat" },
                    { key: "dailySummary", label: "Email rezumat zilnic", desc: "Rezumatul zilei trimis seara la proprietar" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={notif[key as keyof typeof notif] as boolean}
                        onCheckedChange={(v) => { setNotif({ ...notif, [key]: v }); markDirty() }}
                      />
                    </div>
                  ))}

                  {/* SMS Reminder with hours selector */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">SMS reminder</p>
                      <p className="text-xs text-muted-foreground">Trimis automat înainte de programare</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {notif.smsReminder && (
                        <Select value={notif.smsReminderHours} onValueChange={(v) => { setNotif({ ...notif, smsReminderHours: v }); markDirty() }}>
                          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["2", "4", "12", "24"].map((h) => <SelectItem key={h} value={h}>{h}h înainte</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      <Switch checked={notif.smsReminder} onCheckedChange={(v) => { setNotif({ ...notif, smsReminder: v }); markDirty() }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SMS Template preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Template SMS
                  </CardTitle>
                  <CardDescription>Previzualizarea mesajului SMS trimis clienților</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
                    {smsPreview}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["{{nume_client}}", "{{serviciu}}", "{{data}}", "{{ora}}", "{{salon}}"].map((v) => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">{v}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Variabilele de mai sus sunt înlocuite automat cu datele programării.
                  </p>
                </CardContent>
              </Card>

              {/* WhatsApp Business */}
              <SettingsWhatsApp onDirty={markDirty} />
            </div>
          )}

          {/* ── LOIALITATE ── */}
          {activeTab === "loialitate" && (
            <SettingsLoialitate onDirty={markDirty} />
          )}

          {/* ── RECENZII GOOGLE ── */}
          {activeTab === "recenzii" && (
            <SettingsReviews onDirty={markDirty} />
          )}

          {/* ── ABONAMENT ── */}
          {activeTab === "abonament" && (
            <div className="max-w-3xl space-y-6">
              {/* Current plan */}
              <Card className="border-accent/40 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">Plan Pro</p>
                        <Badge className="bg-accent text-accent-foreground">Activ</Badge>
                      </div>
                      <p className="text-muted-foreground">349 RON / lună</p>
                      <p className="mt-1 text-xs text-muted-foreground">Următoarea facturare: 1 Martie 2025 · Visa **** 4242</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">Programări luna aceasta</p>
                      <p className="mt-1 text-2xl font-bold">87 <span className="text-sm font-normal text-muted-foreground">/ 500</span></p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-[17%] rounded-full bg-accent" />
                      </div>
                    </div>
                    <div className="rounded-lg bg-background/60 p-4">
                      <p className="text-xs text-muted-foreground">Membri echipă</p>
                      <p className="mt-1 text-2xl font-bold">4 <span className="text-sm font-normal text-muted-foreground">/ 15</span></p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-[27%] rounded-full bg-accent" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="sm">Schimbă planul</Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Anulează abonamentul</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Plan comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparație planuri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-3 text-left font-medium text-muted-foreground">Funcționalitate</th>
                          <th className="pb-3 text-center font-medium">Starter</th>
                          <th className="pb-3 text-center font-medium text-accent">Pro</th>
                          <th className="pb-3 text-center font-medium">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[
                          ["Programări/lună", "100", "500", "Nelimitat"],
                          ["Membri echipă", "3", "15", "Nelimitat"],
                          ["Notificări SMS", "—", "✓", "✓"],
                          ["Rapoarte financiare", "Bază", "Avansat", "Complet"],
                          ["Module marketing", "—", "✓", "✓"],
                          ["Suport prioritar", "—", "—", "✓"],
                          ["Preț / lună", "149 RON", "349 RON", "Custom"],
                        ].map(([feat, s, p, e]) => (
                          <tr key={feat} className="text-center">
                            <td className="py-2.5 text-left text-muted-foreground">{feat}</td>
                            <td className="py-2.5">{s}</td>
                            <td className="py-2.5 font-medium text-accent">{p}</td>
                            <td className="py-2.5">{e}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Billing history */}
              <Card>
                <CardHeader>
                  <CardTitle>Istoric facturi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { date: "1 Feb 2025", amount: "349 RON", status: "Plătită" },
                      { date: "1 Ian 2025", amount: "349 RON", status: "Plătită" },
                      { date: "1 Dec 2024", amount: "349 RON", status: "Plătită" },
                      { date: "1 Nov 2024", amount: "149 RON", status: "Plătită" },
                    ].map((inv, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{inv.date}</p>
                          <p className="text-xs text-muted-foreground">{inv.amount}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs text-accent border-accent/30">
                            {inv.status}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
                            <Download className="h-3 w-3" /> PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── PERMISIUNI ── */}
          {activeTab === "permisiuni" && (
            <div className="max-w-4xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Roluri și acces</CardTitle>
                  <CardDescription>
                    Controlează ce module poate accesa fiecare rol din salon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-3 text-left font-medium text-muted-foreground w-36">Modul</th>
                          {roles.map((r) => (
                            <th key={r.role} className="pb-3 text-center font-medium min-w-28">
                              <div>{r.role}</div>
                              <div className="text-xs font-normal text-muted-foreground">{r.description}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {MODULES.map((mod) => (
                          <tr key={mod}>
                            <td className="py-3 font-medium">{mod}</td>
                            {roles.map((role, ri) => (
                              <td key={role.role} className="py-3 text-center">
                                <div className="flex justify-center">
                                  <Switch
                                    checked={role.permissions[mod]}
                                    disabled={role.role === "Administrator"}
                                    onCheckedChange={(v) => {
                                      setRoles((prev) =>
                                        prev.map((r, idx) =>
                                          idx === ri
                                            ? { ...r, permissions: { ...r.permissions, [mod]: v } }
                                            : r
                                        )
                                      )
                                      markDirty()
                                    }}
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Rolul Administrator are acces complet și nu poate fi restricționat.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
