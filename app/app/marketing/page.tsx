"use client"

import { useState } from "react"
import {
  Megaphone, Mail, MessageSquare, Gift, Star, Users, TrendingUp,
  Send, Plus, Calendar, CheckCircle2, AlertCircle, Eye, MousePointer,
  BarChart3, ChevronRight, Pencil, Trash2, Copy, Zap, Tag, X,
  ArrowRight, Clock, Settings2, ToggleLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  CAMPAIGNS, AUTOMATIONS, PROMOTIONS, AUDIENCE_SEGMENTS, EMAIL_TEMPLATES,
  type Campaign, type Automation, type Promotion,
} from "@/lib/marketing-data"
import { ReviewsWidget } from "@/components/app/reviews-widget"

// ── helpers ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const map: Record<string, string> = {
    Activ:      "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    Trimis:     "bg-blue-500/15 text-blue-600 border-blue-500/30",
    Programat:  "bg-amber-500/15 text-amber-600 border-amber-500/30",
    Draft:      "bg-muted text-muted-foreground",
  }
  return <Badge variant="outline" className={cn("text-xs", map[status] ?? "")}>{status}</Badge>
}

function formatRON(n: number) {
  return n.toLocaleString("ro-RO") + " Lei"
}

// ── Campaign Wizard ─────────────────────────────────────────────────────────────

const STEPS = ["Tip", "Audiență", "Conținut", "Programare"]

function CampaignWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [type, setType] = useState<"SMS" | "Email" | "">("")
  const [audience, setAudience] = useState("")
  const [customFilters, setCustomFilters] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [template, setTemplate] = useState("")
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [testEmail, setTestEmail] = useState("")

  const audienceObj = AUDIENCE_SEGMENTS.find(a => a.id === audience)
  const charCount = body.length
  const smsChunks = Math.ceil(charCount / 160) || 1

  function insertVar(v: string) {
    setBody(b => b + v)
  }

  function reset() {
    setStep(0); setType(""); setAudience(""); setBody(""); setSubject("")
    setTemplate(""); setScheduleMode("now"); setTestEmail("")
  }

  function handleClose() { reset(); onClose() }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campanie nouă</DialogTitle>
          <DialogDescription>Configurează campania în 4 pași simpli.</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border",
                i < step ? "bg-accent text-accent-foreground border-accent" :
                i === step ? "border-accent text-accent" :
                "border-border text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-xs hidden sm:block", i === step ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />}
            </div>
          ))}
        </div>

        <div className="min-h-[280px]">
          {/* Step 1 — Tip */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Alege canalul de comunicare.</p>
              <div className="grid grid-cols-2 gap-4">
                {(["SMS", "Email"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                      type === t ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                    )}
                  >
                    {t === "SMS"
                      ? <MessageSquare className="h-8 w-8 text-accent" />
                      : <Mail className="h-8 w-8 text-accent" />}
                    <span className="font-semibold">{t}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {t === "SMS" ? "Mesaj direct pe telefon. Rată deschidere 90%+" : "Template bogat cu imagini. Ideal pentru newsletter."}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Audiență */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Alege segmentul țintă.</p>
              <div className="space-y-2">
                {AUDIENCE_SEGMENTS.map(seg => (
                  <button
                    key={seg.id}
                    onClick={() => { setAudience(seg.id); setCustomFilters(seg.id === "custom") }}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all",
                      audience === seg.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                    )}
                  >
                    <span>{seg.label}</span>
                    {seg.count !== null && (
                      <Badge variant="secondary">{seg.count} clienți</Badge>
                    )}
                  </button>
                ))}
              </div>
              {customFilters && (
                <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtre personalizate</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Ultima vizită</Label>
                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Oricând" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">Ultimele 30 zile</SelectItem>
                          <SelectItem value="60">Ultimele 60 zile</SelectItem>
                          <SelectItem value="90">Ultimele 90 zile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total vizite</Label>
                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Orice" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-3">1–3 vizite</SelectItem>
                          <SelectItem value="4-10">4–10 vizite</SelectItem>
                          <SelectItem value="10+">10+ vizite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total cheltuit</Label>
                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Orice" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-500">0–500 Lei</SelectItem>
                          <SelectItem value="500-2000">500–2.000 Lei</SelectItem>
                          <SelectItem value="2000+">2.000+ Lei</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tag client</Label>
                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Orice" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="fidel">Fidel</SelectItem>
                          <SelectItem value="sensibil">Sensibil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {audienceObj && audienceObj.count !== null && (
                <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="font-medium text-accent">Audiență estimată: {audienceObj.count} clienți</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Conținut */}
          {step === 2 && (
            <div className="space-y-4">
              {type === "SMS" ? (
                <>
                  <div className="flex gap-1 flex-wrap">
                    {["{{nume_client}}", "{{salon}}", "{{link_programare}}", "{{puncte_loialitate}}"].map(v => (
                      <button key={v} onClick={() => insertVar(v)}
                        className="rounded border bg-muted px-2 py-1 text-xs font-mono hover:bg-accent/10 hover:border-accent transition-colors">
                        {v}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Scrie mesajul SMS..."
                    className="min-h-[120px] font-mono text-sm"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={cn(charCount > 160 && "text-amber-500")}>{charCount} caractere</span>
                    <span>{smsChunks} SMS{smsChunks > 1 ? "-uri" : ""} ({160 * smsChunks - charCount} rămase)</span>
                  </div>
                  <Progress value={(charCount / 160) * 100} className="h-1" />
                  {body && (
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Preview</p>
                      <div className="rounded-2xl bg-background border p-3 text-sm max-w-xs">
                        {body
                          .replace(/\{\{nume_client\}\}/g, "Maria")
                          .replace(/\{\{salon\}\}/g, "Salon ASESOR")
                          .replace(/\{\{link_programare\}\}/g, "asesor.ro/booking")
                          .replace(/\{\{puncte_loialitate\}\}/g, "450")}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {EMAIL_TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setTemplate(t.id)}
                          className={cn("rounded-lg border px-3 py-2 text-sm transition-all",
                            template === t.id ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-accent/40"
                          )}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Subiect email</Label>
                    <Input placeholder="ex: O ofertă specială pentru tine!" value={subject} onChange={e => setSubject(e.target.value)} />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {["{{nume_client}}", "{{salon}}", "{{link_programare}}", "{{data}}", "{{serviciu}}", "{{puncte_loialitate}}"].map(v => (
                      <button key={v} onClick={() => insertVar(v)}
                        className="rounded border bg-muted px-2 py-1 text-xs font-mono hover:bg-accent/10 hover:border-accent transition-colors">
                        {v}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Conținut email..."
                    className="min-h-[120px] text-sm"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                </>
              )}
            </div>
          )}

          {/* Step 4 — Programare */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {(["now", "later"] as const).map(m => (
                  <button key={m} onClick={() => setScheduleMode(m)}
                    className={cn("rounded-xl border-2 p-4 text-sm transition-all text-center",
                      scheduleMode === m ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                    )}>
                    <div className="font-semibold">{m === "now" ? "Trimite acum" : "Programează"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m === "now" ? "Mesajele pleacă imediat" : "Alegi data și ora"}</div>
                  </button>
                ))}
              </div>
              {scheduleMode === "later" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Data</Label>
                    <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Ora</Label>
                    <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Test — trimite la adresa ta</Label>
                <div className="flex gap-2">
                  <Input placeholder="email@test.ro" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="flex-1" />
                  <Button variant="outline" size="sm">Trimite test</Button>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <p className="font-semibold">Sumar campanie</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Tip:</span><span className="text-foreground font-medium">{type}</span>
                  <span>Audiență:</span><span className="text-foreground font-medium">{AUDIENCE_SEGMENTS.find(a => a.id === audience)?.label ?? "—"}</span>
                  <span>Trimitere:</span><span className="text-foreground font-medium">{scheduleMode === "now" ? "Imediat" : `${scheduleDate} la ${scheduleTime}`}</span>
                  {type === "Email" && <><span>Subiect:</span><span className="text-foreground font-medium truncate">{subject || "—"}</span></>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}>
            {step === 0 ? "Anulează" : "Înapoi"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !type}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Continuă <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleClose}>
              <Send className="mr-2 h-4 w-4" />
              {scheduleMode === "now" ? "Trimite campania" : "Programează campania"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Automation Edit Modal ───────────────────────────────────────────────────────

function AutomationModal({
  automation, open, onClose,
}: { automation: Automation | null; open: boolean; onClose: () => void }) {
  const [template, setTemplate] = useState(automation?.template ?? "")

  if (!automation) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editează automatizare</DialogTitle>
          <DialogDescription>{automation.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Trigger</p>
              <p className="font-medium">{automation.trigger}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Canal</p>
              <p className="font-medium">{automation.channel} · {automation.timing}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Template mesaj</Label>
            <div className="flex gap-1 flex-wrap mb-2">
              {["{{nume_client}}", "{{salon}}", "{{data}}", "{{ora}}", "{{serviciu}}", "{{link_programare}}", "{{link_review}}", "{{puncte_loialitate}}"].map(v => (
                <button key={v} onClick={() => setTemplate(t => t + v)}
                  className="rounded border bg-muted px-2 py-0.5 text-xs font-mono hover:bg-accent/10 hover:border-accent transition-colors">
                  {v}
                </button>
              ))}
            </div>
            <Textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">{template.length} caractere</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center rounded-lg border p-3">
              <p className="text-lg font-bold">{automation.sent.toLocaleString("ro-RO")}</p>
              <p className="text-xs text-muted-foreground">Trimise</p>
            </div>
            <div className="text-center rounded-lg border p-3">
              <p className="text-lg font-bold text-accent">{automation.openRate}%</p>
              <p className="text-xs text-muted-foreground">Deschidere</p>
            </div>
            <div className="text-center rounded-lg border p-3">
              <p className="text-lg font-bold">{automation.clickRate}%</p>
              <p className="text-xs text-muted-foreground">Click</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onClose}>Salvează</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Promotions Modal ────────────────────────────────────────────────────────────

function PromotionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cod promoțional nou</DialogTitle>
          <DialogDescription>Creează un discount pentru clienți.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1">
              <Label>Cod</Label>
              <Input placeholder="ex: PROMO20" className="font-mono uppercase" />
            </div>
            <div className="space-y-1">
              <Label>Tip reducere</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="procent">Procentual (%)</SelectItem>
                  <SelectItem value="fix">Valoare fixă (Lei)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valoare</Label>
              <Input type="number" placeholder="ex: 20" />
            </div>
            <div className="space-y-1">
              <Label>Limită utilizări</Label>
              <Input type="number" placeholder="ex: 100" />
            </div>
            <div className="space-y-1">
              <Label>Valabil de la</Label>
              <Input type="date" />
            </div>
            <div className="space-y-1">
              <Label>Valabil până la</Label>
              <Input type="date" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Servicii aplicabile</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Toate serviciile" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate serviciile</SelectItem>
                <SelectItem value="par">Servicii păr</SelectItem>
                <SelectItem value="unghii">Manichiură & Pedichiură</SelectItem>
                <SelectItem value="facial">Tratamente faciale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onClose}>
            <Tag className="mr-2 h-4 w-4" />Creează codul
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [automations, setAutomations] = useState(AUTOMATIONS)
  const [editingAutomation, setEditingAutomation] = useState<typeof AUTOMATIONS[0] | null>(null)
  const [promoOpen, setPromoOpen] = useState(false)

  const sentThisMonth = CAMPAIGNS.filter(c => c.sentDate?.startsWith("2025-01")).reduce((s, c) => s + c.sent, 0)
  const avgOpenRate = CAMPAIGNS.filter(c => c.sent > 0).reduce((s, c) => s + c.openRate, 0) / CAMPAIGNS.filter(c => c.sent > 0).length
  const attributedRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0)

  function toggleAutomation(id: string) {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Marketing</h1>
          <p className="text-muted-foreground text-sm">Campanii, automatizări, promoții</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto" onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Campanie nouă
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trimise luna aceasta</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sentThisMonth.toLocaleString("ro-RO")}</p>
            <p className="text-xs text-muted-foreground">mesaje SMS + Email</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rată medie deschidere</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">din toate campaniile trimise</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Venituri atribuite</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{formatRON(attributedRevenue)}</p>
            <p className="text-xs text-muted-foreground">din campanii active</p>
          </CardContent>
        </Card>
      </div>

      {/* Google Reviews widget */}
      <ReviewsWidget />

      <Tabs defaultValue="campanii" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-auto">
            <TabsTrigger value="campanii">Campanii</TabsTrigger>
            <TabsTrigger value="automatizari">Automatizări</TabsTrigger>
            <TabsTrigger value="promotii">Promoții</TabsTrigger>
          </TabsList>
        </div>

        {/* ── CAMPANII ── */}
        <TabsContent value="campanii" className="space-y-3">
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campanie</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tip</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Audiență</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Deschidere</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Conversii</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Venituri</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c, i) => (
                  <tr key={c.id} className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/10")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          {c.type === "SMS" ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.sentDate && <p className="text-xs text-muted-foreground">{new Date(c.sentDate).toLocaleDateString("ro-RO")}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{c.type}</Badge>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{c.audienceCount} clienți</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.sent > 0 ? (
                        <div className="space-y-1">
                          <span className="font-medium">{c.openRate}%</span>
                          <Progress value={c.openRate} className="h-1 w-16" />
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell font-medium text-accent">{c.conversions > 0 ? c.conversions : "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{c.revenue > 0 ? formatRON(c.revenue) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {c.status === "Draft" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWizardOpen(true)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── AUTOMATIZĂRI ── */}
        <TabsContent value="automatizari" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {automations.filter(a => a.enabled).length} din {automations.length} automatizări active
            </p>
          </div>
          <div className="space-y-3">
            {automations.map(a => (
              <div key={a.id} className={cn(
                "rounded-xl border p-4 transition-all",
                a.enabled ? "bg-card" : "bg-muted/30 opacity-70"
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      a.enabled ? "bg-accent/10" : "bg-muted"
                    )}>
                      <Zap className={cn("h-4 w-4", a.enabled ? "text-accent" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{a.name}</p>
                        <Badge variant="outline" className="text-xs">{a.channel}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="mr-1 h-2.5 w-2.5" />{a.timing}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                      <p className="text-xs font-mono text-muted-foreground/70 mt-2 bg-muted/50 rounded px-2 py-1 truncate">
                        {a.template.slice(0, 90)}{a.template.length > 90 ? "…" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Switch checked={a.enabled} onCheckedChange={() => toggleAutomation(a.id)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingAutomation(a)}>
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {a.sent > 0 && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold">{a.sent.toLocaleString("ro-RO")}</p>
                      <p className="text-xs text-muted-foreground">Trimise</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-accent">{a.openRate}%</p>
                      <p className="text-xs text-muted-foreground">Deschidere</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{a.clickRate}%</p>
                      <p className="text-xs text-muted-foreground">Click</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── PROMOȚII ── */}
        <TabsContent value="promotii" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{PROMOTIONS.filter(p => p.active).length} coduri active</p>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0" onClick={() => setPromoOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Cod nou
            </Button>
          </div>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cod</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reducere</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Perioadă</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilizări</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Venituri</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {PROMOTIONS.map((p, i) => (
                  <tr key={p.id} className={cn("border-b last:border-0 hover:bg-muted/20", i % 2 === 0 ? "" : "bg-muted/10")}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold bg-muted px-2 py-0.5 rounded text-sm">{p.code}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {p.type === "procent" ? `${p.value}%` : `${p.value} Lei`}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(p.validFrom).toLocaleDateString("ro-RO")} — {new Date(p.validTo).toLocaleDateString("ro-RO")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span>{p.usedCount} / {p.maxUses}</span>
                        <Progress value={(p.usedCount / p.maxUses) * 100} className="h-1 w-20" />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-accent font-medium">
                      {p.revenue > 0 ? formatRON(p.revenue) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.active
                        ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 border text-xs">Activ</Badge>
                        : <Badge variant="secondary" className="text-xs">Expirat</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <AutomationModal automation={editingAutomation} open={!!editingAutomation} onClose={() => setEditingAutomation(null)} />
      <PromotionModal open={promoOpen} onClose={() => setPromoOpen(false)} />
    </div>
  )
}
