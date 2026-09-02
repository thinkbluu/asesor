"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  StickyNote,
  TrendingUp,
  Star,
  Clock,
  Wallet,
  Scissors,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Gift,
  Edit,
  Check,
  MessageCircle,
} from "lucide-react"
import {
  getInitials,
  formatDate,
  getDaysSince,
  TAG_COLORS,
  type ComunicarePreferinta,
  type Client,
} from "@/lib/clienti-data"
import { cn } from "@/lib/utils"
import { ClientLoyaltyCard } from "@/components/app/client-loyalty-card"

type TabId = "istoric" | "preferinte" | "galerie" | "financiar" | "loialitate"

const TABS: { id: TabId; label: string }[] = [
  { id: "istoric", label: "Istoric" },
  { id: "preferinte", label: "Preferințe" },
  { id: "galerie", label: "Galerie" },
  { id: "financiar", label: "Financiar" },
  { id: "loialitate", label: "Loialitate" },
]

const CLIENTS_DATA: Client[] = []
const ALL_STAFF = ["Ana Ionescu", "Cristina Popa", "Mara Stancu", "Diana Florea"]

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const client = CLIENTS_DATA.find((item) => item.id === id)

  const [tab, setTab] = useState<TabId>("istoric")
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [editingPrefs, setEditingPrefs] = useState(false)
  const [alergii, setAlergii] = useState(client?.alergii ?? "")
  const [formule, setFormule] = useState(client?.formuleColoristice ?? "")
  const [prefNotes, setPrefNotes] = useState(client?.notes ?? "")
  const [prefStaff, setPrefStaff] = useState(client?.preferredStaff ?? "")
  const [prefComunicare, setPrefComunicare] = useState<ComunicarePreferinta>(client?.comunicarePreferinta ?? "SMS")
  const [whatsappNumber, setWhatsappNumber] = useState<string>(client?.whatsappNumber ?? "")

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-muted-foreground">
        <p>Client negăsit</p>
        <Button variant="outline" className="bg-transparent" asChild>
          <Link href="/app/clienti">Înapoi la clienți</Link>
        </Button>
      </div>
    )
  }

  const days = getDaysSince(client.lastVisit)
  const avgSpend = client.totalVisits > 0 ? Math.round(client.totalSpent / client.totalVisits) : 0

  const toggleHistory = (hid: string) => {
    setExpandedHistory(prev => {
      const n = new Set(prev)
      n.has(hid) ? n.delete(hid) : n.add(hid)
      return n
    })
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8 max-w-5xl mx-auto space-y-6">

      {/* Back */}
      <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Înapoi
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center">
                <span className="text-xl font-bold text-accent">
                  {getInitials(client.prenume, client.nume)}
                </span>
              </div>
              {client.alergii && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-balance break-words">{client.prenume} {client.nume}</h1>
                {client.tags.map(tag => (
                  <span key={tag} className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", TAG_COLORS[tag])}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" />{client.phone}
                </a>
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" />{client.email}
                </a>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Client din {formatDate(client.clientDin)}
                </span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Programare nouă
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Trimite mesaj
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent gap-1.5" onClick={() => setAddNoteOpen(true)}>
                <StickyNote className="h-3.5 w-3.5" /> Adaugă notă
              </Button>
            </div>
          </div>

          {/* Alergii warning */}
          {client.alergii && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/8 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-600">Alergii / Sensibilități</p>
                <p className="text-sm text-red-500/90 mt-0.5">{client.alergii}</p>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
            {[
              { label: "Total vizite", value: client.totalVisits, icon: Calendar },
              { label: "Total cheltuit", value: `${client.totalSpent.toLocaleString("ro-RO")} Lei`, icon: Wallet },
              { label: "Valoare medie", value: `${avgSpend} Lei`, icon: TrendingUp },
              { label: "Zile de la vizită", value: days, icon: Clock, highlight: days > 90 },
              { label: "Serviciu preferat", value: client.preferredServices[0] ?? "—", icon: Scissors },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-muted/40 px-3 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <s.icon className={cn("h-3.5 w-3.5", s.highlight ? "text-red-500" : "text-accent")} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className={cn("font-semibold text-sm leading-tight break-words", s.highlight && "text-red-500")}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors shrink-0 whitespace-nowrap",
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: ISTORIC ── */}
      {tab === "istoric" && (
        <div className="space-y-3">
          {client.history.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Fără vizite înregistrate</div>
          ) : (
            client.history.map(h => {
              const isOpen = expandedHistory.has(h.id)
              return (
                <Card key={h.id} className="overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => toggleHistory(h.id)}
                  >
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Scissors className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 items-center">
                          <span className="font-medium text-sm">{h.services.join(", ")}</span>
                          <span className="text-xs text-muted-foreground">{h.staff}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(h.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{h.amount} Lei</p>
                        <p className="text-xs text-muted-foreground">{h.paymentMethod}</p>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-90")} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-0 border-t border-border/60 bg-muted/20 space-y-3 text-sm">
                      {h.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Notă</p>
                          <p>{h.notes}</p>
                        </div>
                      )}
                      {h.productsUsed && h.productsUsed.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Produse folosite</p>
                          <div className="flex flex-wrap gap-1.5">
                            {h.productsUsed.map(p => (
                              <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded-full">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ── TAB: PREFERINTE ── */}
      {tab === "preferinte" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Preferințe client</CardTitle>
            <Button
              size="sm"
              variant={editingPrefs ? "default" : "outline"}
              className={cn("gap-1.5", !editingPrefs && "bg-transparent")}
              onClick={() => setEditingPrefs(p => !p)}
            >
              {editingPrefs ? <><Check className="h-3.5 w-3.5" /> Salvează</> : <><Edit className="h-3.5 w-3.5" /> Editează</>}
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Stilist preferat</Label>
              {editingPrefs ? (
                <Select value={prefStaff} onValueChange={setPrefStaff}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_STAFF.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">{prefStaff || "—"}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Servicii favorite (detectate automat)</Label>
              <div className="flex flex-wrap gap-2">
                {client.preferredServices.map(s => (
                  <span key={s} className="text-xs bg-muted border border-border px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                Alergii / Sensibilități
              </Label>
              {editingPrefs ? (
                <Textarea
                  value={alergii}
                  onChange={e => setAlergii(e.target.value)}
                  className="min-h-[80px] border-red-500/40 focus-visible:ring-red-500/30"
                  placeholder="Notează orice alergie sau sensibilitate..."
                />
              ) : (
                alergii
                  ? <p className="text-sm text-red-500 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2 font-medium">{alergii}</p>
                  : <p className="text-sm text-muted-foreground italic">Nicio alergie înregistrată</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Formule coloristice</Label>
              {editingPrefs ? (
                <Textarea
                  value={formule}
                  onChange={e => setFormule(e.target.value)}
                  className="min-h-[90px] font-mono text-xs"
                  placeholder="Rețeta de culoare, proporții, timpi de expunere..."
                />
              ) : (
                formule
                  ? <p className="text-sm font-mono bg-muted/50 border border-border rounded-lg px-3 py-2 whitespace-pre-wrap">{formule}</p>
                  : <p className="text-sm text-muted-foreground italic">Nicio formulă înregistrată</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Preferință comunicare</Label>
              {editingPrefs ? (
                <Select value={prefComunicare} onValueChange={v => setPrefComunicare(v as ComunicarePreferinta)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["SMS","Email","WhatsApp"] as ComunicarePreferinta[]).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="inline-flex items-center text-sm font-medium px-3 py-1 rounded-full bg-muted border border-border">{prefComunicare}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                Număr WhatsApp
                <span className="text-xs font-normal text-muted-foreground">(opțional)</span>
              </Label>
              {editingPrefs ? (
                <>
                  <Input
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder={client.phone}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Completează doar dacă diferă de numărul principal. Altfel se folosește {client.phone}.
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  {whatsappNumber
                    ? <span className="font-medium">{whatsappNumber}</span>
                    : <span className="text-muted-foreground italic">Folosește numărul principal ({client.phone})</span>}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Note generale</Label>
              {editingPrefs ? (
                <Textarea
                  value={prefNotes}
                  onChange={e => setPrefNotes(e.target.value)}
                  className="min-h-[70px]"
                  placeholder="Observații, preferințe personale..."
                />
              ) : (
                prefNotes
                  ? <p className="text-sm text-muted-foreground">{prefNotes}</p>
                  : <p className="text-sm text-muted-foreground italic">Fără note</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB: GALERIE ── */}
      {tab === "galerie" && (
        <div className="space-y-4">
          {/* Upload drop zone */}
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 opacity-50" />
            <p className="text-sm font-medium">Trage fotografii aici sau click pentru a încărca</p>
            <p className="text-xs">JPG, PNG — max 10MB per imagine</p>
          </div>

          {client.photos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
              <ImageIcon className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nicio fotografie adăugată</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {client.photos.map(photo => (
                <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-border aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.serviceTag}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                    <p className="text-white text-xs font-medium">{photo.serviceTag}</p>
                    <p className="text-white/70 text-xs">{formatDate(photo.date)}</p>
                  </div>
                  {photo.type !== "single" && (
                    <div className="absolute top-2 left-2">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        photo.type === "before" ? "bg-muted/90 text-foreground" : "bg-accent text-accent-foreground"
                      )}>
                        {photo.type === "before" ? "ÎNAINTE" : "DUPĂ"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: FINANCIAR ── */}
      {tab === "financiar" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Total cheltuit</span>
                </div>
                <p className="text-2xl font-bold">{client.totalSpent.toLocaleString("ro-RO")} Lei</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className={cn("h-4 w-4", client.soldRestant > 0 ? "text-red-500" : "text-accent")} />
                  <span className="text-sm text-muted-foreground">Sold restant</span>
                </div>
                <p className={cn("text-2xl font-bold", client.soldRestant > 0 && "text-red-500")}>
                  {client.soldRestant.toLocaleString("ro-RO")} Lei
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Puncte loialitate</span>
                </div>
                <p className="text-2xl font-bold">{client.puncteLoyalty}</p>
                <button
                  type="button"
                  onClick={() => setTab("loialitate")}
                  className="text-xs text-emerald-600 hover:underline mt-0.5"
                >
                  Vezi istoricul →
                </button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Istoric plăți</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {client.history.map(h => (
                  <div key={h.id} className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{h.services.join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(h.date)} · {h.staff}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{h.amount} Lei</p>
                      <p className="text-xs text-muted-foreground">{h.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "loialitate" && (
        <ClientLoyaltyCard clientId={client.id} balance={client.puncteLoyalty} />
      )}

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Adaugă notă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Scrie o notă despre această clientă..."
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="bg-transparent" onClick={() => setAddNoteOpen(false)}>Anulează</Button>
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => { setAddNoteOpen(false); setNoteText("") }}
              >
                Salvează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
