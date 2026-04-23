"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Cookie, X } from "lucide-react"

const STORAGE_KEY = "asesor-cookie-choice"

type CookieChoice = {
  necessary: true
  analytics: boolean
  marketing: boolean
  timestamp: number
}

function saveChoice(choice: Omit<CookieChoice, "necessary" | "timestamp">) {
  const payload: CookieChoice = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    timestamp: Date.now(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    // Dispatch event so Analytics consent gate can react without full reload
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
  } catch {
    // localStorage may be unavailable (private mode, SSR)
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      if (!existing) setVisible(true)
    } catch {
      // If localStorage is inaccessible, do not show banner (graceful degradation)
    }
  }, [])

  if (!visible) return null

  const handleAcceptAll = () => {
    saveChoice({ analytics: true, marketing: true })
    setVisible(false)
  }

  const handleNecessaryOnly = () => {
    saveChoice({ analytics: false, marketing: false })
    setVisible(false)
  }

  const handleSaveSettings = () => {
    saveChoice({ analytics, marketing })
    setSettingsOpen(false)
    setVisible(false)
  }

  return (
    <>
      <div
        role="dialog"
        aria-label="Consimțământ cookies"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-5 lg:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Cookie className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Folosim cookies pentru autentificare (strict necesare) și pentru a înțelege cum e folosit ASESOR
              (analytics). Poți alege ce accepți. Vezi{" "}
              <Link href="/cookies" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">
                Politica Cookies
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="sm:order-1"
            >
              Setări
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNecessaryOnly}
              className="sm:order-2"
            >
              Doar necesare
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="bg-accent text-accent-foreground hover:bg-accent/90 sm:order-3"
            >
              Acceptă tot
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Setări cookies</DialogTitle>
            <DialogDescription>
              Alege ce categorii de cookies accepți. Poți schimba alegerea oricând din{" "}
              <Link href="/cookies" className="underline underline-offset-4">
                Politica Cookies
              </Link>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Necessary - always on */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">Strict necesare</Label>
                <p className="text-xs text-muted-foreground">
                  Autentificare, securitate, preferințe de bază. Nu pot fi dezactivate.
                </p>
              </div>
              <Switch checked disabled aria-label="Strict necesare (obligatoriu)" />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="space-y-1">
                <Label htmlFor="cookie-analytics" className="text-sm font-medium text-foreground">
                  Analytics
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ne ajută să înțelegem cum este folosit ASESOR (Vercel Analytics). Nu colectează date personale.
                </p>
              </div>
              <Switch
                id="cookie-analytics"
                checked={analytics}
                onCheckedChange={setAnalytics}
                aria-label="Activează analytics"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="space-y-1">
                <Label htmlFor="cookie-marketing" className="text-sm font-medium text-foreground">
                  Marketing
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cookies pentru campanii și retargeting. În acest moment nu folosim cookies de marketing.
                </p>
              </div>
              <Switch
                id="cookie-marketing"
                checked={marketing}
                onCheckedChange={setMarketing}
                aria-label="Activează marketing"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Anulează
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Salvează preferințele
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
