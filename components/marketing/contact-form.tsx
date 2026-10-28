"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Turnstile } from "@/components/auth/turnstile"
import { submitContactAction, type ContactResult } from "@/app/contact/actions"
import { CONTACT_SUBJECTS, CONTACT_SUBJECT_LABELS, type ContactSubject } from "@/lib/validation/contact"
import { SITE } from "@/lib/site"

const SUBJECT_SELECT_VALUES: Record<ContactSubject, string> = {
  demo: "Solicit un demo",
  pilot: "Program pilot",
  premium: "Pachet premium",
  altceva: "Altceva",
}

export function ContactForm({ initialSubject }: { initialSubject: ContactSubject | null }) {
  const [state, formAction, pending] = useActionState<ContactResult, FormData>(
    async (_prev, formData) => submitContactAction(formData),
    { ok: false, error: "" },
  )
  const [turnstileToken, setTurnstileToken] = useState("")

  if (state.ok) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-6 text-center">
        <p className="text-lg font-semibold text-foreground">Mulțumim.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Îți răspundem în maxim {SITE.responseTime}.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Honeypot — hidden from humans, bots fill it and are silently accepted */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prenume</Label>
          <Input id="firstName" name="firstName" placeholder="Maria" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nume</Label>
          <Input id="lastName" name="lastName" placeholder="Popescu" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="email@exemplu.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" placeholder="07XX XXX XXX" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="salonName">Numele salonului</Label>
        <Input id="salonName" name="salonName" placeholder="Ex: Beauty Studio" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subiect</Label>
        <Select name="subject" defaultValue={initialSubject ?? undefined}>
          <SelectTrigger id="subject">
            <SelectValue placeholder="Selectează subiectul" />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>
                {SUBJECT_SELECT_VALUES[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Mesaj</Label>
        <textarea
          id="message"
          name="message"
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Spune-ne cum te putem ajuta..."
          required
        />
      </div>

      <Turnstile onToken={(token) => setTurnstileToken(token ?? "")} />
      <input type="hidden" name="turnstileToken" value={turnstileToken} readOnly />

      <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
        <Checkbox id="gdpr" name="gdpr" className="mt-0.5" />
        <Label
          htmlFor="gdpr"
          className="text-sm font-normal leading-relaxed text-muted-foreground"
        >
          Sunt de acord cu prelucrarea datelor personale conform{" "}
          <Link
            href="/privacy"
            className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
          >
            Politicii de confidențialitate
          </Link>{" "}
          în scopul de a primi răspuns la solicitarea mea.
        </Label>
      </div>

      {state.ok === false && state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {pending ? "Se trimite..." : "Trimite mesajul"}
      </Button>
    </form>
  )
}
