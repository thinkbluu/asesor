"use client"

// One-time modal shown to owners when the accepted legal versions differ from
// the current constants. Not dismissible — the app stays usable, but the modal
// reappears until the new versions are accepted.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { acceptLegalVersionsAction } from "@/app/app/legal-actions"
import type { LegalDocKey } from "@/lib/legal"

const DOC_LABELS: Record<LegalDocKey, { label: string; href: string }> = {
  terms: { label: "Termeni și condiții", href: "/terms" },
  privacy: { label: "Politica de confidențialitate", href: "/privacy" },
  dpa: { label: "Acordul de prelucrare a datelor (DPA)", href: "/dpa" },
  cookies: { label: "Politica cookies", href: "/cookies" },
  subprocessors: { label: "Împuterniciți", href: "/subprocessors" },
}

export function LegalAcceptanceModal({ pending }: { pending: LegalDocKey[] }) {
  const router = useRouter()
  const [read, setRead] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  if (pending.length === 0) return null

  const accept = async () => {
    setPendingSubmit(true)
    setError(null)
    const result = await acceptLegalVersionsAction()
    setPendingSubmit(false)
    if (!result.ok) {
      setError(result.error ?? "Eroare necunoscută.")
      return
    }
    router.refresh()
  }

  return (
    <Dialog
      open
      onOpenChange={() => {
        // Intentionally ignored: the modal cannot be dismissed without accepting.
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Documente legale actualizate</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Am actualizat următoarele documente. Te rugăm să le citești și să le accepți pentru a continua:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {pending.map((doc) => (
            <li key={doc}>
              <a
                href={DOC_LABELS[doc].href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
              >
                {DOC_LABELS[doc].label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Checkbox
            id="legal-read"
            checked={read}
            onCheckedChange={(v) => setRead(v === true)}
          />
          <Label htmlFor="legal-read" className="text-sm font-normal leading-snug">
            Am citit și accept documentele de mai sus, inclusiv prelucrarea datelor clienților conform DPA.
          </Label>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button onClick={() => void accept()} disabled={!read || pendingSubmit} className="w-full">
          {pendingSubmit ? "Se salvează…" : "Accept"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
