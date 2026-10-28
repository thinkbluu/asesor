"use client"

// Setări → „Date și confidențialitate". Owner-only surfaces: salon data
// export (ZIP of CSVs) and the decrypted sensitive-data CSV behind a second
// confirmation. Close-account lives here too (added in P11.4).

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, ShieldAlert } from "lucide-react"

export function SettingsPrivacy() {
  const [sensitiveOpen, setSensitiveOpen] = useState(false)
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false)

  const downloadZip = () => {
    toast.info("Se pregătește arhiva…")
    window.location.href = "/api/export"
  }

  const downloadSensitive = () => {
    setSensitiveOpen(false)
    setSensitiveConfirmed(false)
    toast.info("Se pregătește fișierul…")
    window.location.href = "/api/export/sensitive"
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export date salon</CardTitle>
          <CardDescription>
            Descarcă o arhivă ZIP cu toate datele salonului în format CSV (separat cu „;", compatibil Excel):
            clienți, programări, servicii, echipă, tranzacții, cheltuieli, produse și mișcări de stoc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadZip} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Download className="mr-2 h-4 w-4" />
            Descarcă datele (ZIP)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Date sensibile (date de sănătate)
          </CardTitle>
          <CardDescription>
            Alergiile și formulele de culoare sunt date privind sănătatea (art. 9 GDPR). Le descarci decriptate,
            într-un fișier separat, după o confirmare suplimentară. Orice export este înregistrat în jurnalul de audit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              setSensitiveConfirmed(false)
              setSensitiveOpen(true)
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Descarcă datele sensibile (CSV)
          </Button>
        </CardContent>
      </Card>

      <Dialog open={sensitiveOpen} onOpenChange={setSensitiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmă exportul datelor sensibile</DialogTitle>
            <DialogDescription>
              Fișierul va conține date de sănătate în clar (alergii, formule de culoare). Păstrează-l în siguranță
              și șterge-l după utilizare. Exportul este înregistrat în jurnalul de audit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              id="sensitive-confirm"
              checked={sensitiveConfirmed}
              onCheckedChange={(v) => setSensitiveConfirmed(v === true)}
            />
            <Label htmlFor="sensitive-confirm" className="text-sm font-normal leading-snug">
              Înțeleg că fișierul conține date de sănătate în clar și îmi asum responsabilitatea păstrării lui în siguranță.
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSensitiveOpen(false)}>
              Anulează
            </Button>
            <Button onClick={downloadSensitive} disabled={!sensitiveConfirmed}>
              Descarcă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
