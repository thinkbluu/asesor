"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  MessageCircle, Check, AlertCircle, Loader2, Eye, Pencil, ShieldCheck, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  WHATSAPP_TEMPLATES,
  type WhatsAppChannelStatus,
  type WhatsAppTemplate,
  type WhatsAppTemplateKey,
  renderTemplate,
  verifyWhatsAppConnection,
} from "@/lib/whatsapp"

const STATUS_CONFIG: Record<WhatsAppChannelStatus, { label: string; cls: string }> = {
  disconnected: { label: "Neconectat", cls: "bg-muted text-muted-foreground border-border" },
  pending: { label: "În verificare", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  connected: { label: "Conectat", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  error: { label: "Eroare", cls: "bg-red-500/15 text-red-500 border-red-500/30" },
}

const SAMPLE_VARS: Record<string, string> = {
  nume_client: "Maria",
  salon: "Beauty Studio",
  data: "28 aprilie",
  ora: "10:00",
  serviciu: "Vopsit rădăcini",
  angajat: "Ana",
  telefon_salon: "0722 123 456",
  link_recenzie: "https://g.page/r/beauty-studio",
  oferta: "20% reducere la următoarea vizită",
  link_rezervare: "https://asesor.app/booking/beauty-studio",
}

interface Props {
  onDirty?: () => void
}

export function SettingsWhatsApp({ onDirty }: Props) {
  // Connection state
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneNumberId, setPhoneNumberId] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [wabaId, setWabaId] = useState("")
  const [status, setStatus] = useState<WhatsAppChannelStatus>("disconnected")
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [primaryChannel, setPrimaryChannel] = useState(true)

  // Templates state (editable copies of the defaults)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(WHATSAPP_TEMPLATES)
  const [editOpen, setEditOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<WhatsAppTemplateKey>("booking_confirmation")
  const [draftBody, setDraftBody] = useState("")

  const activeTemplate = templates.find((t) => t.key === activeKey)!

  function markDirty() {
    onDirty?.()
  }

  async function handleVerify() {
    setVerifying(true)
    setVerifyError(null)
    setStatus("pending")
    const result = await verifyWhatsAppConnection({ apiKey, phoneNumberId })
    if (result.ok) {
      setStatus("connected")
    } else {
      setStatus("error")
      setVerifyError(result.error ?? "Verificare eșuată")
    }
    setVerifying(false)
    markDirty()
  }

  function handleDisconnect() {
    setStatus("disconnected")
    setApiKey("")
    setPhoneNumberId("")
    setWabaId("")
    setVerifyError(null)
    markDirty()
  }

  function openEdit(key: WhatsAppTemplateKey) {
    const t = templates.find((x) => x.key === key)!
    setActiveKey(key)
    setDraftBody(t.body)
    setEditOpen(true)
  }

  function openPreview(key: WhatsAppTemplateKey) {
    setActiveKey(key)
    setPreviewOpen(true)
  }

  function saveTemplate() {
    setTemplates((prev) =>
      prev.map((t) => (t.key === activeKey ? { ...t, body: draftBody, status: "draft" } : t))
    )
    setEditOpen(false)
    markDirty()
  }

  const statusCfg = STATUS_CONFIG[status]

  return (
    <div className="space-y-6">
      {/* Connection card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  WhatsApp Business
                  <Badge variant="outline" className={cn("text-xs font-medium", statusCfg.cls)}>
                    {status === "pending" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {status === "connected" && <Check className="mr-1 h-3 w-3" />}
                    {status === "error" && <AlertCircle className="mr-1 h-3 w-3" />}
                    {statusCfg.label}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Conectează contul WhatsApp Business pentru confirmări și remindere instantanee
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Număr WhatsApp Business</Label>
              <Input
                placeholder="+40 722 123 456"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); markDirty() }}
              />
              <p className="text-xs text-muted-foreground">
                Numărul verificat în Meta Business Manager
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number ID</Label>
              <Input
                placeholder="1234567890"
                value={phoneNumberId}
                onChange={(e) => { setPhoneNumberId(e.target.value); markDirty() }}
              />
              <p className="text-xs text-muted-foreground">Din Meta → WhatsApp → API Setup</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>WhatsApp Business Account ID</Label>
              <Input
                placeholder="987654321"
                value={wabaId}
                onChange={(e) => { setWabaId(e.target.value); markDirty() }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cheie API (Access Token)</Label>
              <Input
                type="password"
                placeholder="EAAG..."
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); markDirty() }}
              />
              <p className="text-xs text-muted-foreground">
                Token permanent. Se stochează criptat pe server.
              </p>
            </div>
          </div>

          {verifyError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {status !== "connected" ? (
              <Button
                onClick={handleVerify}
                disabled={verifying || !apiKey || !phoneNumberId}
                className="bg-[#25D366] text-white hover:bg-[#1fb355]"
              >
                {verifying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificare…</>
                ) : (
                  <><ShieldCheck className="mr-2 h-4 w-4" /> Verifică și conectează</>
                )}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleDisconnect}>
                Deconectează
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5" asChild>
              <a
                href="https://business.facebook.com/wa/manage"
                target="_blank"
                rel="noopener noreferrer"
              >
                Meta Business Manager <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channel priority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canal principal</CardTitle>
          <CardDescription>
            Alege cum sunt trimise notificările automate către clienți
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">
                Folosește WhatsApp ca principal canal
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {primaryChannel
                  ? "Mesajele încearcă mai întâi prin WhatsApp. Dacă clientul nu are WhatsApp sau mesajul eșuează, se trimite SMS."
                  : "Toate mesajele sunt trimise prin SMS. WhatsApp se folosește doar manual."}
              </p>
            </div>
            <Switch
              checked={primaryChannel}
              disabled={status !== "connected"}
              onCheckedChange={(v) => { setPrimaryChannel(v); markDirty() }}
            />
          </div>
          {status !== "connected" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Conectează WhatsApp-ul mai întâi pentru a activa această opțiune.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Șabloane de mesaje</CardTitle>
          <CardDescription>
            Mesajele trebuie pre-aprobate de Meta conform regulilor WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {templates.map((t) => (
            <div key={t.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      t.category === "UTILITY"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                    )}
                  >
                    {t.category === "UTILITY" ? "Utilitar" : "Marketing"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      t.status === "approved" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                      t.status === "pending" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                      t.status === "draft" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {t.status === "approved" && "Aprobat"}
                    {t.status === "pending" && "În așteptare"}
                    {t.status === "draft" && "Draft"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.variables.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-[10px]">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => openPreview(t.key)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Previzualizare
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(t.key)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editează
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editează șablon — {activeTemplate.name}</DialogTitle>
            <DialogDescription>
              Modificările necesită re-aprobare de la Meta înainte de a fi folosite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Corp mesaj</Label>
              <Textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Variabile disponibile</Label>
              <div className="flex flex-wrap gap-1.5">
                {activeTemplate.variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraftBody((b) => `${b}{{${v}}}`)}
                    className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] hover:bg-muted"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Previzualizare</Label>
              <div className="rounded-lg border border-border bg-[#DCF8C6]/40 p-3 text-sm leading-relaxed dark:bg-[#056162]/30">
                {renderTemplate(draftBody, SAMPLE_VARS)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Anulează</Button>
            <Button onClick={saveTemplate} className="bg-[#25D366] text-white hover:bg-[#1fb355]">
              Salvează ca draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeTemplate.name}</DialogTitle>
            <DialogDescription>Așa va arăta mesajul în WhatsApp-ul clientului</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-[#DCF8C6] p-3 text-sm leading-relaxed text-foreground shadow-sm dark:bg-[#056162]/60 dark:text-foreground">
              {renderTemplate(activeTemplate.body, SAMPLE_VARS)}
              <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                <span>10:32</span>
                <Check className="h-3 w-3" />
                <Check className="-ml-2 h-3 w-3 text-[#34B7F1]" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
