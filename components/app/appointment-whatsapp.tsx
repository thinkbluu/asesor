"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MessageCircle, Send, ChevronDown, Check, CheckCheck, Loader2, AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  WHATSAPP_TEMPLATES,
  renderTemplate,
  toWhatsAppE164,
  type WhatsAppTemplate,
  type WhatsAppMessage,
} from "@/lib/whatsapp"

interface Props {
  appointmentId: string
  clientId: string
  clientName: string
  clientPhone: string
  clientWhatsApp?: string
  salonName: string
  salonPhone: string
  date: string // ISO date
  startTime: string
  staffName: string
  serviceNames: string[]
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "acum"
  if (mins < 60) return `acum ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `acum ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `acum ${days} ${days === 1 ? "zi" : "zile"}`
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })
}

function DeliveryIcon({ status }: { status: WhatsAppMessage["status"] }) {
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-red-500" />
  if (status === "sent") return <Check className="h-3 w-3 text-muted-foreground" />
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />
  if (status === "read" || status === "replied") return <CheckCheck className="h-3 w-3 text-[#34B7F1]" />
  return null
}

export function AppointmentWhatsApp({
  appointmentId,
  clientId: _clientId,
  clientName,
  clientPhone,
  clientWhatsApp,
  salonName,
  salonPhone,
  date,
  startTime,
  staffName,
  serviceNames,
}: Props) {
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const effectiveNumber = clientWhatsApp || clientPhone
  const e164 = useMemo(() => toWhatsAppE164(effectiveNumber), [effectiveNumber])

  const messages = useMemo<WhatsAppMessage[]>(() => [], [appointmentId])

  const approvedTemplates = WHATSAPP_TEMPLATES.filter((t) => t.status === "approved")

  function variablesFor(template: WhatsAppTemplate): Record<string, string> {
    const firstName = clientName.split(" ")[0] ?? clientName
    const dateLabel = new Date(date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })
    return {
      nume_client: firstName,
      salon: salonName,
      data: dateLabel,
      ora: startTime,
      serviciu: serviceNames.join(", "),
      angajat: staffName.split(" ")[0] ?? staffName,
      telefon_salon: salonPhone,
      link_recenzie: "https://g.page/r/salon",
      oferta: "10% reducere",
      link_rezervare: "https://asesor.app/booking/salon",
    }
  }

  function openConfirm(template: WhatsAppTemplate) {
    setPendingTemplate(template)
    setFeedback(null)
    setConfirmOpen(true)
  }

  async function handleSend() {
    if (!pendingTemplate) return
    setSending(true)
    setFeedback(null)
    // TODO: wire up to sendWhatsAppTemplate() server action
    await new Promise((r) => setTimeout(r, 600))
    if (!e164) {
      setFeedback({ ok: false, text: "Număr invalid — nu se poate trimite" })
    } else {
      setFeedback({ ok: true, text: "Mesaj trimis" })
      setTimeout(() => setConfirmOpen(false), 900)
    }
    setSending(false)
  }

  return (
    <div className="space-y-3">
      {/* Send button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1fb355]"
            disabled={!e164}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Trimite pe WhatsApp
            <ChevronDown className="ml-auto h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs">Alege șablon</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {approvedTemplates.map((t) => (
            <DropdownMenuItem key={t.key} onSelect={() => openConfirm(t)} className="flex-col items-start">
              <span className="text-sm font-medium">{t.name}</span>
              <span className="text-xs text-muted-foreground">{t.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {!e164 && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertCircle className="h-3.5 w-3.5" />
          Număr WhatsApp invalid — verifică profilul clientului
        </p>
      )}

      {/* Message history preview */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ultimele mesaje WhatsApp
          </p>
          {messages.length > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {messages.length}
            </Badge>
          )}
        </div>
        {messages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            Nu s-a trimis încă niciun mesaj pentru această programare.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs leading-relaxed",
                  m.direction === "outbound"
                    ? "ml-4 rounded-tr-sm bg-[#DCF8C6]/60 dark:bg-[#056162]/40"
                    : "mr-4 rounded-tl-sm bg-muted"
                )}
              >
                <p className="text-foreground">{m.body}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                  <span>{formatRelative(m.timestamp)}</span>
                  {m.direction === "outbound" && <DeliveryIcon status={m.status} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trimite mesaj WhatsApp</DialogTitle>
            <DialogDescription>
              Către <span className="font-medium text-foreground">{clientName}</span>
              {" · "}
              <span className="font-mono">{e164 ?? effectiveNumber}</span>
            </DialogDescription>
          </DialogHeader>
          {pendingTemplate && (
            <div className="space-y-3">
              <Badge variant="outline" className="text-xs">{pendingTemplate.name}</Badge>
              <div className="rounded-2xl bg-muted/40 p-3">
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-[#DCF8C6] p-3 text-sm leading-relaxed text-foreground shadow-sm dark:bg-[#056162]/60">
                  {renderTemplate(pendingTemplate.body, variablesFor(pendingTemplate))}
                </div>
              </div>
              {feedback && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-xs",
                    feedback.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-red-500/30 bg-red-500/10 text-red-600"
                  )}
                >
                  {feedback.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {feedback.text}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Anulează
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !e164 || feedback?.ok}
              className="bg-[#25D366] text-white hover:bg-[#1fb355]"
            >
              {sending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se trimite…</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Trimite</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
