"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setPilotUntilAction } from "@/app/app/admin/pilot/actions"

export function PilotForm() {
  const [slug, setSlug] = useState("")
  const [pilotUntil, setPilotUntil] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const res = await setPilotUntilAction({ slug, pilotUntil })
      if (res.ok) toast.success(res.message)
      else toast.error(res.error)
    })
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pilot-slug">Slug salon</Label>
        <Input
          id="pilot-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="salon-exemplu"
          autoComplete="off"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pilot-until">Pilot până la (inclusiv)</Label>
        <Input id="pilot-until" type="date" value={pilotUntil} onChange={(e) => setPilotUntil(e.target.value)} />
        <p className="text-sm text-muted-foreground">Lasă gol ca să elimini perioada pilot.</p>
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Se salvează…" : "Salvează"}
      </Button>
    </form>
  )
}
