"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Send, Loader2 } from "lucide-react"
import {
  NOTIFICATION_LABELS,
  type NotificationKey,
  type NotificationSettings,
} from "@/lib/messaging/settings"
import { saveSetariNotificariAction, sendTestEmailAction } from "@/app/app/setari/actions"

// Previewable kinds (the ones with a salon-branded template).
const PREVIEW_KINDS = [
  { value: "confirmare_programare", label: "Confirmare programare" },
  { value: "reamintire_24h", label: "Reamintire 24h" },
  { value: "anulare", label: "Anulare (client)" },
  { value: "anulare_salon", label: "Anulare (salon)" },
  { value: "programare_noua_online", label: "Programare nouă online" },
  { value: "cerere_feedback", label: "Cerere feedback" },
  { value: "invitatie_echipa", label: "Invitație echipă" },
  { value: "stoc_scazut_zilnic", label: "Stoc scăzut zilnic" },
  { value: "contact_nou", label: "Contact nou" },
]

const TEST_KINDS = PREVIEW_KINDS.filter((k) => k.value !== "contact_nou")

interface Props {
  initial: NotificationSettings
}

export function SettingsNotificari({ initial }: Props) {
  const [settings, setSettings] = useState<NotificationSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [previewKind, setPreviewKind] = useState("confirmare_programare")

  function patch(key: NotificationKey, value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const res = await saveSetariNotificariAction(settings)
    setSaving(false)
    if (res.ok) toast.success("Preferințele de notificare au fost salvate.")
    else toast.error(res.error)
  }

  async function handleTest(kind: string) {
    setTesting(kind)
    const res = await sendTestEmailAction(kind)
    setTesting(null)
    if (res.ok) toast.success("Emailul de test a fost trimis la adresa contului tău.")
    else toast.error(res.error, { duration: 8000 })
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(initial)

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emailuri automate
          </CardTitle>
          <CardDescription>
            Alege ce emailuri trimite ASESOR în numele salonului. Emailurile sunt
            tranzacționale (doar legate de programări și echipă) — niciodată promoționale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-border rounded-lg border border-border">
            {(Object.keys(NOTIFICATION_LABELS) as NotificationKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">{NOTIFICATION_LABELS[key].label}</p>
                  <p className="text-xs text-muted-foreground">{NOTIFICATION_LABELS[key].description}</p>
                </div>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={(v) => patch(key, v)}
                  aria-label={NOTIFICATION_LABELS[key].label}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Salvează preferințele
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previzualizare șablon</CardTitle>
          <CardDescription>
            Fiecare șablon, randat cu date de exemplu și brandingul salonului tău.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium shrink-0">Șablon</Label>
            <Select value={previewKind} onValueChange={setPreviewKind}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PREVIEW_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            <iframe
              key={previewKind}
              src={`/api/notificari/preview?kind=${previewKind}`}
              title={`Previzualizare ${previewKind}`}
              className="h-[480px] w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email de test</CardTitle>
          <CardDescription>
            Trimite un email de exemplu la adresa contului tău, ca să vezi exact ce
            primesc clienții. Testul ignoră comutatoarele de mai sus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TEST_KINDS.map((k) => (
              <Button
                key={k.value}
                variant="outline"
                size="sm"
                onClick={() => handleTest(k.value)}
                disabled={testing !== null}
              >
                {testing === k.value ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                )}
                {k.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
