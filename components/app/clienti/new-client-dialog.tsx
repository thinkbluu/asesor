"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClientAction } from "@/app/app/clienti/actions"

export function NewClientDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await createClientAction({
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      phone: fd.get("phone"),
      whatsappPhone: "",
      email: fd.get("email") || null,
      birthDate: fd.get("birthDate") || null,
      sex: "Nespecificat",
      source: null,
      tags: [],
      preferredStaffId: null,
      communicationPref: null,
      notes: fd.get("notes") ?? "",
    })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clientă nouă</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nc-first">Prenume</Label>
              <Input id="nc-first" name="firstName" required maxLength={100} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-last">Nume</Label>
              <Input id="nc-last" name="lastName" required maxLength={100} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-phone">Telefon</Label>
            <Input id="nc-phone" name="phone" required placeholder="0722 123 456" inputMode="tel" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-email">Email (opțional)</Label>
            <Input id="nc-email" name="email" type="email" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-birth">Data nașterii (opțional)</Label>
            <Input id="nc-birth" name="birthDate" type="date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-notes">Note (opțional)</Label>
            <Input id="nc-notes" name="notes" maxLength={5000} />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Anulează</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Se salvează…" : "Salvează"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
