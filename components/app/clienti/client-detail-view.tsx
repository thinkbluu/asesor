"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Download,
  Lock,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { TAG_COLORS, formatDate, getInitials } from "@/lib/clienti-format"
import type {
  ClientDetail,
  ClientHistoryItem,
  LoyaltyEntry,
  ConsentRecord,
  ClientPhoto,
  SensitiveData,
} from "@/lib/mappers/clienti"
import { CLIENT_SOURCES, CLIENT_TAGS, type ClientTag } from "@/lib/validation/clienti"
import {
  updateClientAction,
  saveSensitiveAction,
  exportClientAction,
  deleteClientAction,
} from "@/app/app/clienti/actions"
import { ClientLoyaltyCard } from "@/components/app/client-loyalty-card"
import { ClientPhotoGallery } from "@/components/app/clienti/client-photo-gallery"

const STATUS_LABELS: Record<string, string> = {
  in_asteptare: "În așteptare",
  confirmat: "Confirmat",
  finalizat: "Finalizat",
  anulat: "Anulat",
  no_show: "No-show",
}

export function ClientDetailView({
  role,
  client,
  history,
  loyalty,
  consents,
  sensitive,
  sensitiveError,
  photos,
}: {
  role: string
  client: ClientDetail
  history: ClientHistoryItem[]
  loyalty: LoyaltyEntry[]
  consents: ConsentRecord[]
  sensitive:
    | { data: SensitiveData; restricted: false }
    | { data: null; restricted: true }
    | null
  sensitiveError: string | null
  photos: ClientPhoto[] | null
}) {
  const canEditProfile = role === "owner" || role === "manager" || role === "receptionist"
  const canSensitive = role === "owner" || role === "manager" || role === "staff"
  const canGdpr = role === "owner" || role === "manager"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/clienti"><ArrowLeft className="h-4 w-4 mr-1" /> Înapoi</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {getInitials(client.firstName, client.lastName)}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground truncate">
              {client.firstName} {client.lastName}
            </h1>
            {client.hasAllergies && (
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15 text-red-600"
                title="Clienta are alergii înregistrate"
                aria-label="Are alergii înregistrate"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            )}
            {client.tags.map((t) => (
              <Badge key={t} variant="outline" className={`text-[10px] px-1.5 ${TAG_COLORS[t] ?? ""}`}>{t}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{client.phone}</p>
        </div>
        <div className="ml-auto flex gap-6 text-right">
          <div>
            <p className="text-lg font-semibold text-foreground">{client.totalVisits}</p>
            <p className="text-xs text-muted-foreground">vizite</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {client.totalSpent.toLocaleString("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">total cheltuit</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {client.lastVisitAt ? formatDate(client.lastVisitAt) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">ultima vizită</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="istoric">Istoric ({history.length})</TabsTrigger>
          <TabsTrigger value="loialitate">Loialitate</TabsTrigger>
          {canSensitive && <TabsTrigger value="foto">Foto</TabsTrigger>}
          <TabsTrigger value="protejate">Date protejate</TabsTrigger>
          {canGdpr && <TabsTrigger value="gdpr">GDPR</TabsTrigger>}
        </TabsList>

        <TabsContent value="profil">
          <ProfileTab client={client} canEdit={canEditProfile} />
        </TabsContent>

        <TabsContent value="istoric">
          <HistoryTab history={history} />
        </TabsContent>

        <TabsContent value="loialitate">
          <ClientLoyaltyCard balance={client.loyaltyPoints} entries={loyalty} />
        </TabsContent>

        {canSensitive && (
          <TabsContent value="foto">
            <ClientPhotoGallery clientId={client.id} initialPhotos={photos ?? []} canDelete={canGdpr} />
          </TabsContent>
        )}

        <TabsContent value="protejate">
          <SensitiveTab
            clientId={client.id}
            role={role}
            sensitive={sensitive}
            sensitiveError={sensitiveError}
            consents={consents}
          />
        </TabsContent>

        {canGdpr && (
          <TabsContent value="gdpr">
            <GdprTab client={client} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ─── Profil ──────────────────────────────────────────────────────────────────

function ProfileTab({ client, canEdit }: { client: ClientDetail; canEdit: boolean }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateClientAction(client.id, {
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        phone: fd.get("phone"),
        whatsappPhone: fd.get("whatsappPhone") ?? "",
        email: fd.get("email") || null,
        birthDate: fd.get("birthDate") || null,
        sex: fd.get("sex") || "Nespecificat",
        source: fd.get("source") || null,
        tags: fd.getAll("tags").filter(Boolean),
        preferredStaffId: null,
        communicationPref: fd.get("communicationPref") || null,
        notes: fd.get("notes") ?? "",
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError(null)
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Date clientă</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editează
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon" value={client.phone} />
          <Field label="WhatsApp" value={client.whatsappPhone ?? "—"} />
          <Field label="Email" value={client.email ?? "—"} />
          <Field label="Data nașterii" value={client.birthDate ? formatDate(client.birthDate) : "—"} />
          <Field label="Sursă" value={client.source ?? "—"} />
          <Field label="Comunicare preferată" value={client.communicationPref ?? "—"} />
          <Field label="Specialist preferat" value={client.preferredStaffName ?? "—"} />
          <Field label="Clientă din" value={formatDate(client.createdAt)} />
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Note</p>
            <p className="text-sm whitespace-pre-wrap">{client.notes || "—"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Editează clienta</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="pf-first">Prenume</Label>
            <Input id="pf-first" name="firstName" defaultValue={client.firstName} required maxLength={100} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pf-last">Nume</Label>
            <Input id="pf-last" name="lastName" defaultValue={client.lastName} required maxLength={100} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pf-phone">Telefon</Label>
            <Input id="pf-phone" name="phone" defaultValue={client.phone} required inputMode="tel" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pf-wa">WhatsApp (opțional)</Label>
            <Input id="pf-wa" name="whatsappPhone" defaultValue={client.whatsappPhone ?? ""} inputMode="tel" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pf-email">Email</Label>
            <Input id="pf-email" name="email" type="email" defaultValue={client.email ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pf-birth">Data nașterii</Label>
            <Input id="pf-birth" name="birthDate" type="date" defaultValue={client.birthDate ?? ""} />
          </div>
          <div className="space-y-1">
            <Label>Sex</Label>
            <Select name="sex" defaultValue={client.sex}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="F">F</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="Nespecificat">Nespecificat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Sursă</Label>
            <Select name="source" defaultValue={client.source ?? ""}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nespecificat</SelectItem>
                {CLIENT_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Etichete</Label>
            <div className="flex flex-wrap gap-2">
              {CLIENT_TAGS.map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-sm">
                  <Checkbox name="tags" value={t} defaultChecked={client.tags.includes(t as ClientTag)} />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Comunicare preferată</Label>
            <Select name="communicationPref" defaultValue={client.communicationPref ?? ""}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nespecificat</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="pf-notes">Note</Label>
            <Textarea id="pf-notes" name="notes" defaultValue={client.notes} rows={3} maxLength={5000} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={pending}>
              Anulează
            </Button>
            <Button type="submit" disabled={pending}>{pending ? "Se salvează…" : "Salvează"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

// ─── Istoric ─────────────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: ClientHistoryItem[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nicio programare în istoric.
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {history.map((h) => (
            <li key={h.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium text-foreground">{formatDate(h.date)}</p>
                  <Badge variant="outline" className="text-[10px]">{STATUS_LABELS[h.status] ?? h.status}</Badge>
                </div>
                <p className="text-sm font-semibold text-foreground shrink-0">
                  {h.total.toLocaleString("ro-RO", { style: "currency", currency: "RON" })}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {h.services.map((s) => s.name).join(", ") || "—"}
                {h.staffName ? ` · ${h.staffName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ─── Date protejate ──────────────────────────────────────────────────────────

function SensitiveTab({
  clientId,
  role,
  sensitive,
  sensitiveError,
  consents,
}: {
  clientId: string
  role: string
  sensitive:
    | { data: SensitiveData; restricted: false }
    | { data: null; restricted: true }
    | null
  sensitiveError: string | null
  consents: ConsentRecord[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const restricted = sensitive?.restricted ?? false
  const data = sensitive && !sensitive.restricted ? sensitive.data : null
  const healthConsent = consents.find((c) => c.kind === "health_data" && c.granted)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const consentChecked = fd.get("healthConsent") === "on"
    startTransition(async () => {
      const result = await saveSensitiveAction({
        clientId,
        allergies: fd.get("allergies") ?? "",
        colorFormulas: fd.get("colorFormulas") ?? "",
        healthConsent: consentChecked ? true : undefined,
        consentSource: fd.get("consentSource") || undefined,
      })
      if (!result.ok) {
        setError(result.error)
        setSaved(false)
        return
      }
      setError(null)
      setSaved(true)
      router.refresh()
    })
  }

  if (sensitiveError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive" role="alert">
          {sensitiveError}
        </CardContent>
      </Card>
    )
  }

  if (restricted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Lock className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="font-medium text-foreground">Informații vizibile doar pentru specialiști</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Alergiile și formulele coloristice conțin date protejate despre sănătate.
            Doar owner, manager și specialiștii au acces la ele.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Date protejate (criptate)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Alergiile și formulele coloristice sunt criptate în baza de date (AES-256-GCM).
          Fiecare acces este înregistrat în jurnalul de audit.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="s-allergies">Alergii</Label>
            <Textarea
              id="s-allergies"
              name="allergies"
              defaultValue={data?.allergies ?? ""}
              rows={3}
              maxLength={5000}
              placeholder="ex: alergie la parfeni, reacție la amoniac…"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-formulas">Formule coloristice</Label>
            <Textarea
              id="s-formulas"
              name="colorFormulas"
              defaultValue={data?.colorFormulas ?? ""}
              rows={3}
              maxLength={5000}
              placeholder="ex: 6.34 + 6% oxidant…"
            />
          </div>

          {/* Health-data consent — required to save allergies */}
          <div className="rounded-md border border-border p-3 space-y-2 bg-muted/30">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox name="healthConsent" defaultChecked={!!data?.healthConsentAt} className="mt-0.5" />
              <span>
                Clienta și-a dat acordul ca aceste informații să fie păstrate pentru siguranța serviciilor
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Select name="consentSource" defaultValue={(data?.healthConsentSource as string) ?? "in_salon"}>
                <SelectTrigger className="w-[180px]" aria-label="Sursa acordului"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_salon">În salon</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
              {data?.healthConsentAt && (
                <p className="text-xs text-muted-foreground">
                  Acord înregistrat: {formatDate(data.healthConsentAt)}
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          {saved && !pending && <p className="text-sm text-emerald-600">Salvat.</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Se salvează…" : "Salvează datele protejate"}
          </Button>
          {!healthConsent && (
            <p className="text-xs text-muted-foreground">
              Salvarea necesită acordul pentru date de sănătate (bifează caseta de mai sus).
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// ─── GDPR ────────────────────────────────────────────────────────────────────

function GdprTab({ client }: { client: ClientDetail }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const router = useRouter()

  function handleExport() {
    startTransition(async () => {
      const result = await exportClientAction(client.id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `client-${client.lastName}-${client.firstName}.json`.toLowerCase().replace(/\s+/g, "-")
      a.click()
      URL.revokeObjectURL(url)
      setError(null)
    })
  }

  const fullName = `${client.firstName} ${client.lastName}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instrumente GDPR</CardTitle>
        <p className="text-xs text-muted-foreground">
          Exportul și ștergerea sunt disponibile doar pentru owner și manager. Toate acțiunile
          sunt înregistrate în jurnalul de audit.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Exportă datele clientei</p>
            <p className="text-xs text-muted-foreground">
              JSON cu profil, programări, tranzacții, loialitate, consimțăminte și datele protejate decriptate.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={pending}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Exportă
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-500/30 bg-red-500/5 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Șterge clienta</p>
            <p className="text-xs text-muted-foreground">
              Ștergere soft: nume/telefon/email anonimizate imediat, fotografiile și datele protejate
              șterse, tranzacțiile rămân pentru contabilitate (fără clientă).
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Șterge
          </Button>
        </div>

        <Dialog open={showDelete} onOpenChange={setShowDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Șterge clienta</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Scrie <strong>{fullName}</strong> pentru a confirma. Acțiunea anonimizează datele
              imediat și nu poate fi anulată.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const result = await deleteClientAction({
                    clientId: client.id,
                    confirmName: fd.get("confirmName"),
                  })
                  if (!result.ok) {
                    setError(result.error)
                    return
                  }
                  router.push("/app/clienti")
                })
              }}
              className="space-y-3"
            >
              <Input name="confirmName" placeholder={fullName} autoComplete="off" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDelete(false)} disabled={pending}>
                  Anulează
                </Button>
                <Button type="submit" variant="destructive" disabled={pending}>
                  {pending ? "Se șterge…" : "Confirmă ștergerea"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
