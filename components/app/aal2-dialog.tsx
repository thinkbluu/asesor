"use client"

// Shared AAL2 step-up dialog. Shown when a guarded server action returns
// needsMfa; on success the caller retries the action.

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyAal2Action } from "@/lib/auth/mfa"

export function Aal2Dialog({
  open,
  onOpenChange,
  onVerified,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async () => {
    setPending(true)
    setError(null)
    const result = await verifyAal2Action(code)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setCode("")
    onOpenChange(false)
    onVerified()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next) }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmă cu codul de securitate</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Introdu codul din 6 cifre din aplicația de autentificare pentru a continua.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="aal2-code">Cod</Label>
            <Input
              id="aal2-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Anulează
            </Button>
            <Button type="submit" disabled={pending || code.length !== 6}>
              {pending ? "Se verifică…" : "Verifică"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
