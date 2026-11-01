"use client"

import Link from "next/link"
import { Phone, Mail } from "lucide-react"
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
    <div className="bk-form" style={{ marginTop: 2 }}>
      <p className="bk-lede" style={{ marginTop: 0 }}>
        Completează datele tale pentru a finaliza programarea.
      </p>

      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <div className="bk-field">
            <label className="bk-label" htmlFor="booking-first">
              Prenume *
            </label>
            <input
              id="booking-first"
              value={state.client.firstName}
              onChange={(e) => setClient({ firstName: e.target.value })}
              placeholder="Maria"
              autoComplete="given-name"
              className="bk-input"
            />
          </div>
          <div className="bk-field">
            <label className="bk-label" htmlFor="booking-last">
              Nume *
            </label>
            <input
              id="booking-last"
              value={state.client.lastName}
              onChange={(e) => setClient({ lastName: e.target.value })}
              placeholder="Popescu"
              autoComplete="family-name"
              className="bk-input"
            />
          </div>
        </div>

        <div className="bk-field">
          <label className="bk-label" htmlFor="booking-phone">
            Telefon *
          </label>
          <div className="bk-search">
            <Phone aria-hidden="true" />
            <input
              id="booking-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={state.client.phone}
              onChange={(e) => setClient({ phone: e.target.value })}
              placeholder="0722 123 456"
              className="bk-input"
            />
          </div>
          <p className="bk-hint">Numărul este normalizat automat în format +40.</p>
        </div>

        <div className="bk-field">
          <label className="bk-label" htmlFor="booking-email">
            Email *
          </label>
          <div className="bk-search">
            <Mail aria-hidden="true" />
            <input
              id="booking-email"
              type="email"
              autoComplete="email"
              value={state.client.email}
              onChange={(e) => setClient({ email: e.target.value })}
              placeholder="email@exemplu.ro"
              className="bk-input"
            />
          </div>
          <p className="bk-hint">
            Obligatoriu — pe acest email primești confirmarea programării.
          </p>
        </div>

        <div className="bk-field">
          <label className="bk-label" htmlFor="booking-notes">
            Observații (opțional)
          </label>
          <textarea
            id="booking-notes"
            value={state.client.notes}
            onChange={(e) => setClient({ notes: e.target.value.slice(0, 500) })}
            placeholder="Ex: alergii, preferințe specifice, mențiuni pentru specialist..."
            rows={3}
            maxLength={500}
            className="bk-input"
          />
          <p className="bk-hint" style={{ textAlign: "right" }}>
            {state.client.notes.length}/500
          </p>
        </div>

        {/* Honeypot — hidden from humans, filled by bots */}
        <div aria-hidden="true" style={{ position: "absolute", left: -9999, height: 0, width: 0, overflow: "hidden" }}>
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
        <div className="bk-legal">
          <div className="bk-check">
            <Checkbox
              id="booking-gdpr"
              checked={state.client.gdpr}
              onCheckedChange={(v) => setClient({ gdpr: v === true })}
              className="bk-cbx"
            />
            <label htmlFor="booking-gdpr" style={{ cursor: "pointer" }}>
              Am citit{" "}
              <Link href="/privacy" target="_blank" className="bk-link">
                Politica de confidențialitate a salonului și a ASESOR
              </Link>
              . *
            </label>
          </div>
        </div>

        {/* Privacy note — ASESOR processes booking data on behalf of the salon */}
        <p className="bk-fine">
          Datele tale sunt folosite de {salonName} pentru programare și reamintiri. ASESOR le
          prelucrează în numele salonului.{" "}
          <Link href="/privacy" target="_blank" className="bk-link">
            Află mai multe
          </Link>
          .
        </p>

        {/* Marketing consent — optional */}
        <div className="bk-check">
          <Checkbox
            id="booking-marketing"
            checked={state.client.marketing}
            onCheckedChange={(v) => setClient({ marketing: v === true })}
            className="bk-cbx"
          />
          <label htmlFor="booking-marketing" style={{ cursor: "pointer" }}>
            Vreau să primesc ofertele salonului pe email.
          </label>
        </div>

        {/* Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset. */}
        <Turnstile onToken={(token) => setClient({ turnstileToken: token ?? "" })} />

        <p className="bk-fine">
          Datele tale sunt folosite exclusiv pentru gestionarea programării de către salon.
        </p>
      </div>
    </div>
  )
}
