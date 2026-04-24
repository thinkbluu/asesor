"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, ExternalLink, Clock, Shield, MessageSquare } from "lucide-react"
import { DEFAULT_REVIEWS_CONFIG, type ReviewsConfig } from "@/lib/reviews"
import { cn } from "@/lib/utils"

export function SettingsReviews({ onDirty }: { onDirty: () => void }) {
  const [cfg, setCfg] = useState<ReviewsConfig>(DEFAULT_REVIEWS_CONFIG)

  function patch<K extends keyof ReviewsConfig>(key: K, value: ReviewsConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: value }))
    onDirty()
  }

  const isUrlValid = /^https?:\/\/.+/.test(cfg.googleBusinessUrl)

  return (
    <div className="max-w-3xl space-y-6">
      {/* Master toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-emerald-600" />
            Automatizare recenzii Google
            {cfg.enabled && <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Activ</Badge>}
          </CardTitle>
          <CardDescription>
            Trimite automat clienților un sondaj de satisfacție după programare și direcționează
            recenziile pozitive către Google, iar pe cele negative către un formular intern.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="font-medium text-sm">Activează automatizarea</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Când e dezactivat, nu se trimit sondaje și nu se afișează widget-ul.
              </p>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={v => patch("enabled", v)} />
          </div>

          {/* Google Business Profile URL */}
          <div className="space-y-2">
            <Label htmlFor="gbp-url" className="text-sm font-medium flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Link Google Business Profile
            </Label>
            <Input
              id="gbp-url"
              value={cfg.googleBusinessUrl}
              onChange={e => patch("googleBusinessUrl", e.target.value)}
              placeholder="https://g.page/r/.../review"
              className="font-mono text-sm"
              disabled={!cfg.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Link-ul direct către pagina de recenzii. Îl găsești în Google Business Profile &rsaquo; Distribuie &rsaquo; Obține mai multe recenzii.
              {cfg.googleBusinessUrl && !isUrlValid && (
                <span className="text-red-500 ml-1">URL invalid</span>
              )}
            </p>
          </div>

          {/* Place ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="place-id" className="text-sm font-medium">
              Google Place ID <span className="text-xs font-normal text-muted-foreground">(opțional)</span>
            </Label>
            <Input
              id="place-id"
              value={cfg.googlePlaceId ?? ""}
              onChange={e => patch("googlePlaceId", e.target.value)}
              placeholder="ChIJXXXXXXXXXXXXXXX"
              className="font-mono text-sm"
              disabled={!cfg.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Necesar pentru sincronizarea recenziilor în timp real prin Google Business Profile API.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Moment trimitere
          </CardTitle>
          <CardDescription>
            Cât timp după programare se trimite sondajul de satisfacție.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-medium">Trimite la</Label>
            <Input
              type="number"
              min={1}
              max={168}
              value={cfg.hoursAfterAppointment}
              onChange={e => patch("hoursAfterAppointment", Math.max(1, Math.min(168, Number(e.target.value) || 24)))}
              className="w-24 h-9"
              disabled={!cfg.enabled}
            />
            <span className="text-sm text-muted-foreground">ore după finalizarea programării</span>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {[2, 24, 48, 72].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => patch("hoursAfterAppointment", h)}
                disabled={!cfg.enabled}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50",
                  cfg.hoursAfterAppointment === h
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border bg-background hover:border-emerald-500/40"
                )}
              >
                {h}h
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Canal de trimitere</Label>
            <Select
              value={cfg.channel}
              onValueChange={v => patch("channel", v as ReviewsConfig["channel"])}
              disabled={!cfg.enabled}
            >
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Routing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Direcționare inteligentă
          </CardTitle>
          <CardDescription>
            Recenziile pozitive ajung pe Google, iar cele negative rămân interne — protejând reputația salonului.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prag minim pentru Google</Label>
            <Select
              value={String(cfg.minStarsForGoogle)}
              onValueChange={v => patch("minStarsForGoogle", Number(v))}
              disabled={!cfg.enabled}
            >
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Doar 5 stele</SelectItem>
                <SelectItem value="4">4-5 stele (recomandat)</SelectItem>
                <SelectItem value="3">3-5 stele</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Routing diagram */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Flux automat
            </p>
            <div className="flex items-center gap-2 text-xs">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Client primește sondaj · 1-5 stele</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i >= cfg.minStarsForGoogle - 1
                          ? "fill-emerald-500 text-emerald-500"
                          : "text-muted-foreground/40"
                      )}
                    />
                  ))}
                  <span className="ml-1 text-[10px] font-semibold text-emerald-600">
                    {cfg.minStarsForGoogle}+
                  </span>
                </div>
                <p className="text-xs font-medium">Google Review</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Redirect direct la pagina publică.
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: cfg.minStarsForGoogle - 1 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="ml-1 text-[10px] font-semibold text-amber-600">
                    sub {cfg.minStarsForGoogle}
                  </span>
                </div>
                <p className="text-xs font-medium">Feedback intern</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Formular privat — nu ajunge public.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Exemplu link public:</strong>{" "}
              <code className="font-mono text-[11px]">/feedback/[id_programare]</code>
              — se generează automat pentru fiecare programare finalizată.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
