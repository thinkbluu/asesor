"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Phone, Mail, User as UserIcon, CheckCircle2, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Client } from "@/lib/clienti-data"
import { normalizePhone } from "@/lib/booking-logic"

const CLIENTS_DATA: Client[] = []
import type { BookingState } from "./booking-flow"

export function StepDetails({
  state,
  update,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
}) {
  const phoneDigits = normalizePhone(state.client.phone)

  const existingClient = useMemo(() => {
    if (phoneDigits.length < 9) return null
    return (
      CLIENTS_DATA.find((c) => normalizePhone(c.phone) === phoneDigits) ?? null
    )
  }, [phoneDigits])

  const setClient = (patch: Partial<BookingState["client"]>) => {
    update({ client: { ...state.client, ...patch } })
  }

  const onPhoneBlur = () => {
    if (existingClient) {
      setClient({
        firstName: existingClient.prenume,
        lastName: existingClient.nume,
        email: existingClient.email,
      })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 md:text-base">
        Completează datele tale pentru a finaliza programarea.
      </p>

      <div className="space-y-5">
        {/* Phone first, for client lookup */}
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
              onBlur={onPhoneBlur}
              placeholder="0722 123 456"
              className="h-12 border-zinc-200 bg-white pl-10 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
            />
          </div>
          {existingClient && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Bine te-am regăsit,{" "}
                <strong className="font-semibold">{existingClient.prenume}</strong>! Am completat
                datele tale.
              </span>
            </div>
          )}
        </div>

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
          <Label htmlFor="booking-email" className="text-sm font-medium text-zinc-900">
            Email <span className="text-zinc-400">(opțional)</span>
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
            Primești o confirmare pe email dacă îl completezi.
          </p>
        </div>

        <div>
          <Label htmlFor="booking-notes" className="text-sm font-medium text-zinc-900">
            Cerințe speciale <span className="text-zinc-400">(opțional)</span>
          </Label>
          <Textarea
            id="booking-notes"
            value={state.client.notes}
            onChange={(e) => setClient({ notes: e.target.value })}
            placeholder="Ex: alergii, preferințe specifice, mențiuni pentru stilist..."
            rows={3}
            className="mt-1.5 border-zinc-200 bg-white text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
          />
        </div>

        {/* GDPR */}
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
              Sunt de acord cu prelucrarea datelor mele personale în scopul gestionării
              programării, conform{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              >
                Politicii de confidențialitate
              </Link>
              .
            </Label>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-zinc-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Dacă ai mai fost la noi, introducem automat datele tale când scrii numărul de telefon.
          </span>
        </div>
      </div>

      <div className="hidden text-xs text-zinc-400 md:block">
        <UserIcon className="mr-1 inline h-3 w-3" />
        Clienți existenți detectați automat din numărul de telefon.
      </div>
    </div>
  )
}
