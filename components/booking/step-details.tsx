"use client"

import Link from "next/link"
import { Phone, Mail, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Turnstile } from "@/components/auth/turnstile"
import type { BookingState } from "./booking-flow"

export function StepDetails({
  state,
  update,
  salonSlug,
  salonName,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
  salonSlug: string
  salonName: string
}) {
  const setClient = (patch: Partial<BookingState["client"]>) => {
    update({ client: { ...state.client, ...patch } })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 md:text-base">
        Completează datele tale pentru a finaliza programarea.
      </p>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="booking-first" className="text-sm font-medium text-zinc-900">
              Prenume <span className="text-emerald-600">*</span>
            </Label>
            <Input
              id="booking-first"
              value={state.client.firstName}
              onChange={(e) => setClient({ firstName: e.target.value })}
              placeholder="Maria"
              autoComplete="given-name"
              className="mt-1.5 h-12 border-zinc-200 bg-white text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
            />
          </div>
          <div>
            <Label htmlFor="booking-last" className="text-sm font-medium text-zinc-900">
              Nume <span className="text-emerald-600">*</span>
            </Label>
            <Input
              id="booking-last"
              value={state.client.lastName}
              onChange={(e) => setClient({ lastName: e.target.value })}
              placeholder="Popescu"
              autoComplete="family-name"
              className="mt-1.5 h-12 border-zinc-200 bg-white text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="booking-phone" className="text-sm font-medium text-zinc-900">
            Telefon <span className="text-emerald-600">*</span>
          </Label>
          <div className="relative mt-1.5">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="booking-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={state.client.phone}
              onChange={(e) => setClient({ phone: e.target.value })}
              placeholder="0722 123 456"
              className="h-12 border-zinc-200 bg-white pl-10 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            Numărul este normalizat automat în format +40.
          </p>
        </div>

        <div>
          <Label htmlFor="booking-email" className="text-sm font-medium text-zinc-900">
            Email <span className="text-emerald-600">*</span>
          </Label>
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="booking-email"
              type="email"
              autoComplete="email"
              value={state.client.email}
              onChange={(e) => setClient({ email: e.target.value })}
              placeholder="email@exemplu.ro"
              className="h-12 border-zinc-200 bg-white pl-10 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            Obligatoriu — pe acest email primești confirmarea programării.
          </p>
        </div>

        <div>
          <Label htmlFor="booking-notes" className="text-sm font-medium text-zinc-900">
            Observații <span className="text-zinc-400">(opțional)</span>
          </Label>
          <Textarea
            id="booking-notes"
            value={state.client.notes}
            onChange={(e) => setClient({ notes: e.target.value.slice(0, 500) })}
            placeholder="Ex: alergii, preferințe specifice, mențiuni pentru specialist..."
            rows={3}
            maxLength={500}
            className="mt-1.5 border-zinc-200 bg-white text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">
            {state.client.notes.length}/500
          </p>
        </div>

        {/* Honeypot — hidden from humans, filled by bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="booking-website">Website</label>
          <input
            id="booking-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={state.client.website ?? ""}
            onChange={(e) => setClient({ website: e.target.value })}
          />
        </div>

        {/* GDPR — required */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="booking-gdpr"
              checked={state.client.gdpr}
              onCheckedChange={(v) => setClient({ gdpr: v === true })}
              className="mt-0.5 border-zinc-400 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
            />
            <Label
              htmlFor="booking-gdpr"
              className="cursor-pointer text-sm leading-relaxed text-zinc-700"
            >
              Am citit{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              >
                Politica de confidențialitate a salonului și a ASESOR
              </Link>
              . <span className="text-emerald-600">*</span>
            </Label>
          </div>
        </div>

        {/* Privacy note — ASESOR processes booking data on behalf of the salon */}
        <p className="text-xs leading-relaxed text-zinc-500">
          Datele tale sunt folosite de {salonName} pentru programare și reamintiri. ASESOR le prelucrează în numele
          salonului.{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            Află mai multe
          </Link>
          .
        </p>

        {/* Marketing consent — optional */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="booking-marketing"
            checked={state.client.marketing}
            onCheckedChange={(v) => setClient({ marketing: v === true })}
            className="mt-0.5 border-zinc-400 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
          />
          <Label
            htmlFor="booking-marketing"
            className="cursor-pointer text-sm leading-relaxed text-zinc-700"
          >
            Vreau să primesc ofertele salonului pe email.
          </Label>
        </div>

        {/* Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset. */}
        <Turnstile onToken={(token) => setClient({ turnstileToken: token ?? "" })} />

        <div className="flex items-start gap-2 text-xs text-zinc-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Datele tale sunt folosite exclusiv pentru gestionarea programării de către salon.
          </span>
        </div>
      </div>
    </div>
  )
}
