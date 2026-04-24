"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Monitor, ExternalLink, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function PreviewTab() {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")
  const [refreshKey, setRefreshKey] = useState(0)

  const url = "/booking/salonul-ana"

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-lg border p-1 bg-background">
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors",
              device === "mobile"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Smartphone className="h-4 w-4" />
            Mobile
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors",
              device === "desktop"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Monitor className="h-4 w-4" />
            Desktop
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reîncarcă
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Deschide în tab nou
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 flex justify-center bg-muted/30">
          <div
            className={cn(
              "bg-background border-8 border-foreground rounded-[2rem] overflow-hidden shadow-2xl transition-all",
              device === "mobile"
                ? "w-[375px] h-[750px]"
                : "w-full max-w-[1280px] h-[720px] rounded-lg border-4",
            )}
          >
            <iframe
              key={refreshKey}
              src={url}
              className="w-full h-full"
              title="Preview pagina publică"
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Previzualizarea folosește datele publicate. Dacă ai modificări nesalvate în tab-ul
        Personalizare, salvează-le înainte.
      </p>
    </div>
  )
}
