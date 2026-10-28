"use client"

// Setări → „Date și confidențialitate". Owner-only surfaces: salon data
// export (ZIP of CSVs) and the decrypted sensitive-data CSV behind a second
// confirmation. Close-account lives here too (added in P11.4).

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Download, ShieldAlert, Trash2 } from "lucide-react"
import { Aal2Dialog } from "@/components/app/aal2-dialog"
import {
  requestSalonDeletionAction,
  cancelSalonDeletionAction,
} from "@/app/app/account-actions"

const DAY_MS = 24 * 60 * 60 * 1000

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
}

export function SettingsPrivacy({ deletedAt }: { deletedAt: string | null }) {
  const router = useRouter()
  const [sensitiveOpen, setSensitiveOpen] = useState(false)
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [aal2Open, setAal2Open] = useState(false)
  const [cancelPending, setCancelPending] = useState(false)

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

  const requestDeletion = async () => {
    setDeletePending(true)
    const result = await requestSalonDeletionAction()
    setDeletePending(false)
    if (!result.ok) {
      if ("needsMfa" in result) {
        setDeleteOpen(false)
        setAal2Open(true)
        return
      }
      toast.error(result.error)
      return
    }
    setDeleteOpen(false)
    setDeleteConfirmed(false)
    toast.success("Ștergerea a fost programată. Poți anula în următoarele 30 de zile.")
    router.refresh()
  }

  const cancelDeletion = async () => {
    setCancelPending(true)
    const result = await cancelSalonDeletionAction()
    setCancelPending(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Ștergerea a fost anulată.")
    router.refresh()
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

      {deletedAt ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Ștergerea contului este programată
            </CardTitle>
            <CardDescription>
              Pagina publică de programare este dezactivată. Datele salonului vor fi șterse definitiv pe{" "}
              <strong className="text-foreground">{formatDate(new Date(new Date(deletedAt).getTime() + 30 * DAY_MS).toISOString())}</strong>.
              Până atunci poți anula ștergerea sau îți poți exporta datele.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void cancelDeletion()} disabled={cancelPending}>
              {cancelPending ? "Se anulează…" : "Anulează ștergerea"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Închide contul (șterge salonul)
            </CardTitle>
            <CardDescription>
              Pagina publică de programare se dezactivează imediat. Datele rămân în platformă încă 30 de zile
              (perioadă în care poți anula), după care sunt șterse definitiv, inclusiv fișierele stocate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteConfirmed(false)
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Solicită ștergerea salonului
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmă ștergerea salonului</DialogTitle>
            <DialogDescription>
              Pagina de programare se dezactivează imediat. În 30 de zile de la astăzi, toate datele salonului
              (clienți, programări, financiar, fișiere) sunt șterse definitiv. Exportă-ți datele înainte dacă ai nevoie de ele.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              id="delete-confirm"
              checked={deleteConfirmed}
              onCheckedChange={(v) => setDeleteConfirmed(v === true)}
            />
            <Label htmlFor="delete-confirm" className="text-sm font-normal leading-snug">
              Înțeleg că ștergerea este programată și că datele vor fi șterse definitiv după 30 de zile.
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={() => void requestDeletion()} disabled={!deleteConfirmed || deletePending}>
              {deletePending ? "Se procesează…" : "Solicită ștergerea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Aal2Dialog
        open={aal2Open}
        onOpenChange={setAal2Open}
        onVerified={() => void requestDeletion()}
      />

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
