"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Upload, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "asesor-booking-branding"

const PRESET_COLORS = [
  "#2D8C3C", // default ASESOR
  "#0A0A0A", // black
  "#1A1A2E", // navy
  "#D4A853", // gold
  "#C9963A", // warm gold
  "#2C3E6B", // slate
  "#7C3AED", // violet
  "#DB2777", // pink
  "#2563EB", // blue
  "#059669", // emerald
]

interface BrandingState {
  slug: string
  logoUrl: string
  primaryColor: string
  welcomeTitle: string
  welcomeSubtitle: string
  coverImageUrl: string
  aboutText: string
  showPrices: boolean
  showDurations: boolean
  requireDeposit: boolean
  depositPercent: number
  cancellationPolicy: string
  minAdvanceHours: number
  maxAdvanceDays: number
}

const DEFAULT_STATE: BrandingState = {
  slug: "salonul-ana",
  logoUrl: "",
  primaryColor: "#2D8C3C",
  welcomeTitle: "Bine ai venit la Salonul Ana",
  welcomeSubtitle: "Programează-te rapid și ușor, 24/7",
  coverImageUrl: "",
  aboutText:
    "Un salon modern, cu accent pe calitate și experiență. Folosim produse profesionale și livrăm rezultate de care te vei îndrăgosti.",
  showPrices: true,
  showDurations: true,
  requireDeposit: false,
  depositPercent: 30,
  cancellationPolicy:
    "Anularea se face cu minim 24 de ore înainte. După acest termen, se percepe o taxă de 50 Lei.",
  minAdvanceHours: 2,
  maxAdvanceDays: 30,
}

export function BrandingTab() {
  const [state, setState] = useState<BrandingState>(DEFAULT_STATE)
  const [saved, setSaved] = useState(false)
  const [unsaved, setUnsaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setState({ ...DEFAULT_STATE, ...JSON.parse(stored) })
      } catch {
        /* ignore */
      }
    }
  }, [])

  const update = <K extends keyof BrandingState>(key: K, value: BrandingState[K]) => {
    setState((s) => ({ ...s, [key]: value }))
    setUnsaved(true)
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    // TODO: înlocuiește cu Supabase upsert când backend-ul e conectat
    setUnsaved(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] mt-6">
      {/* Formular — coloană stângă */}
      <div className="space-y-6">
        {/* Slug + URL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">URL personalizat</CardTitle>
            <CardDescription>Link-ul pe care îl distribui clienților</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono">asesor.ro/booking/</span>
              <Input
                value={state.slug}
                onChange={(e) =>
                  update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                className="font-mono text-sm flex-1"
                placeholder="salonul-tau"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Doar litere mici, cifre și cratime. Fără spații sau caractere speciale.
            </p>
          </CardContent>
        </Card>

        {/* Brand & culoare */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identitate vizuală</CardTitle>
            <CardDescription>Logo și culoarea principală a paginii</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Logo salon</Label>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed bg-muted border-border",
                  )}
                >
                  {state.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={state.logoUrl || "/placeholder.svg"}
                      alt="Logo"
                      className="h-full w-full object-contain rounded-xl"
                    />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Încarcă logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG sau SVG. Max 2MB.</p>
                </div>
              </div>
              <Input
                placeholder="...sau lipește URL-ul unui logo găzduit"
                value={state.logoUrl}
                onChange={(e) => update("logoUrl", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Culoare principală</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("primaryColor", c)}
                    className={cn(
                      "h-9 w-9 rounded-lg border-2 transition-all",
                      state.primaryColor === c
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Alege culoarea ${c}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={state.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                  aria-label="Alege o culoare custom"
                />
                <Input
                  value={state.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="font-mono text-sm w-28"
                />
                <span className="text-xs text-muted-foreground">sau alege custom</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text welcome */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mesaj de întâmpinare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titlu principal</Label>
              <Input
                value={state.welcomeTitle}
                onChange={(e) => update("welcomeTitle", e.target.value)}
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">{state.welcomeTitle.length}/60</p>
            </div>
            <div className="space-y-1.5">
              <Label>Subtitlu</Label>
              <Input
                value={state.welcomeSubtitle}
                onChange={(e) => update("welcomeSubtitle", e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{state.welcomeSubtitle.length}/100</p>
            </div>
            <div className="space-y-1.5">
              <Label>Despre salon</Label>
              <Textarea
                value={state.aboutText}
                onChange={(e) => update("aboutText", e.target.value)}
                maxLength={400}
                rows={4}
                placeholder="Prezintă salonul tău în câteva propoziții"
              />
              <p className="text-xs text-muted-foreground">{state.aboutText.length}/400</p>
            </div>
            <div className="space-y-1.5">
              <Label>Imagine copertă (opțional)</Label>
              <Input
                placeholder="URL imagine landscape, minim 1200×600px"
                value={state.coverImageUrl}
                onChange={(e) => update("coverImageUrl", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Afișare servicii */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Afișare servicii</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Afișează prețuri</p>
                <p className="text-xs text-muted-foreground">
                  Clienții văd prețul exact al fiecărui serviciu
                </p>
              </div>
              <Switch
                checked={state.showPrices}
                onCheckedChange={(v) => update("showPrices", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Afișează durata</p>
                <p className="text-xs text-muted-foreground">
                  Clienții văd cât durează fiecare serviciu
                </p>
              </div>
              <Switch
                checked={state.showDurations}
                onCheckedChange={(v) => update("showDurations", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reguli programare */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reguli programare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Timp minim înainte (ore)</Label>
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={state.minAdvanceHours}
                  onChange={(e) => update("minAdvanceHours", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Maxim zile în avans</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={state.maxAdvanceDays}
                  onChange={(e) => update("maxAdvanceDays", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm font-medium">Solicită avans la rezervare</p>
                <p className="text-xs text-muted-foreground">
                  Clientul plătește un procent pentru confirmare
                </p>
              </div>
              <Switch
                checked={state.requireDeposit}
                onCheckedChange={(v) => update("requireDeposit", v)}
              />
            </div>
            {state.requireDeposit && (
              <div className="space-y-1.5">
                <Label>Procent avans</Label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={state.depositPercent}
                  onChange={(e) => update("depositPercent", Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: 30% pentru un serviciu de 200 Lei = 60 Lei avans
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Politică de anulare (vizibilă clienților)</Label>
              <Textarea
                value={state.cancellationPolicy}
                onChange={(e) => update("cancellationPolicy", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview live — coloană dreaptă */}
      <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Previzualizare
          </Label>
          {unsaved && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              Modificări nesalvate
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3 w-3" />
              Salvat
            </span>
          )}
        </div>

        <Card className="overflow-hidden">
          <div
            className="h-32 flex items-end p-4"
            style={{
              background: state.coverImageUrl
                ? `url(${state.coverImageUrl}) center/cover`
                : `linear-gradient(135deg, ${state.primaryColor} 0%, ${state.primaryColor}88 100%)`,
            }}
          >
            {state.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.logoUrl || "/placeholder.svg"}
                alt=""
                className="h-12 w-12 rounded-full border-2 border-white bg-white object-contain"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-full border-2 border-white bg-white/90 flex items-center justify-center font-bold text-sm"
                style={{ color: state.primaryColor }}
              >
                {state.welcomeTitle
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
          </div>
          <CardContent className="p-5 space-y-3">
            <div>
              <h3 className="font-bold text-lg leading-tight">{state.welcomeTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">{state.welcomeSubtitle}</p>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{state.aboutText}</p>
            <Button
              className="w-full font-semibold"
              style={{ backgroundColor: state.primaryColor, color: "white" }}
            >
              Programează-te
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              asesor.ro/booking/{state.slug}
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={!unsaved}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
        >
          {saved ? "Salvat" : "Salvează modificările"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Modificările se aplică instant pe pagina publică
        </p>
      </div>
    </div>
  )
}
