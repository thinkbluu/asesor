"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Copy, QrCode, ExternalLink, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const SLUG = "salonul-meu"
const FULL_URL = `https://asesor.ro/booking/${SLUG}`

export function OverviewTab() {
  const [copied, setCopied] = useState(false)
  const [enabled, setEnabled] = useState(true)

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats: { label: string; value: string | number; sub: string }[] = []

  return (
    <div className="space-y-6 mt-6">
      {/* Status + link */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  enabled ? "bg-emerald-500/15" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    enabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground",
                  )}
                />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {enabled ? "Pagina e activă și primește programări" : "Pagina e dezactivată"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {enabled
                    ? "Clienții pot accesa link-ul 24/7"
                    : "Nimeni nu poate programa online momentan"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="booking-enabled" className="text-sm">
                {enabled ? "Activ" : "Inactiv"}
              </Label>
              <Switch id="booking-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Link pentru clienți
            </Label>
            <div className="flex items-center gap-2">
              <Input value={FULL_URL} readOnly className="font-mono text-sm bg-muted/40" />
              <Button
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopy}
                className={cn("gap-1.5 shrink-0", copied && "bg-emerald-600 hover:bg-emerald-700")}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiat
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiază
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
                <a href={FULL_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Deschide
                </a>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" className="gap-1.5">
              <QrCode className="h-3.5 w-3.5" />
              Descarcă QR code
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              Partajează pe Instagram
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              Partajează pe Facebook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Statistici
        </h2>
        {stats.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Statisticile vor apărea după ce primești primele programări online.
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Quick tips */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6">
          <h3 className="font-semibold text-sm mb-3">Sfaturi pentru mai multe programări</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Pune link-ul în bio-ul de Instagram și Facebook</li>
            <li>• Răspunde la DM-uri cu link-ul în loc de negociere manuală</li>
            <li>• Printează QR code-ul și pune-l pe oglinzi sau la recepție</li>
            <li>• Adaugă link-ul la semnătura de email</li>
            <li>• Partajează după ce faci poze cu clienți (cu acordul lor)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
