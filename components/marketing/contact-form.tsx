"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Turnstile } from "@/components/auth/turnstile"
import { submitContactAction, type ContactResult } from "@/app/(marketing)/contact/actions"
import {
  CONTACT_SUBJECTS,
  CONTACT_SUBJECT_LABELS,
  type ContactSubject,
} from "@/lib/validation/contact"
import { SITE } from "@/lib/site"

export function ContactForm({ initialSubject }: { initialSubject: ContactSubject | null }) {
  const [state, formAction, pending] = useActionState<ContactResult, FormData>(
    async (_prev, formData) => submitContactAction(formData),
    { ok: false, error: "" },
  )
  const [turnstileToken, setTurnstileToken] = useState("")

  if (state.ok) {
    return <p className="cok">Mulțumim. Îți răspundem în maxim {SITE.responseTime}.</p>
  }

  return (
    <form action={formAction} className="cform">
      {/* Honeypot — hidden from humans, bots fill it and are silently accepted */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hp"
      />

      <div className="field">
        <label className="lb" htmlFor="name">
          Nume
        </label>
        <input className="ctl" id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className="field">
        <label className="lb" htmlFor="email">
          Email
        </label>
        <input
          className="ctl"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="row2">
        <div className="field">
          <label className="lb" htmlFor="phone">
            Telefon (opțional)
          </label>
          <input className="ctl" id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="field">
          <label className="lb" htmlFor="salonName">
            Numele salonului (opțional)
          </label>
          <input
            className="ctl"
            id="salonName"
            name="salonName"
            type="text"
            autoComplete="organization"
          />
        </div>
      </div>

      <div className="field">
        <label className="lb" htmlFor="subject">
          Subiect
        </label>
        <select
          className="ctl sel"
          id="subject"
          name="subject"
          defaultValue={initialSubject ?? ""}
          required
        >
          <option value="">Selectează subiectul</option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {CONTACT_SUBJECT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="lb" htmlFor="message">
          Mesaj
        </label>
        <textarea className="ctl" id="message" name="message" rows={5} required />
      </div>

      <Turnstile onToken={(token) => setTurnstileToken(token ?? "")} />
      <input type="hidden" name="turnstileToken" value={turnstileToken} readOnly />

      <label className="gdpr">
        <input type="checkbox" name="gdpr" required />
        <span>
          Sunt de acord cu prelucrarea datelor personale conform{" "}
          <Link href="/privacy">Politicii de confidențialitate</Link> în scopul de a primi răspuns
          la solicitarea mea.
        </span>
      </label>

      {state.ok === false && state.error ? (
        <p role="alert" className="err">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn pri" disabled={pending}>
        {pending ? "Se trimite…" : "Trimite mesajul"}
      </button>
    </form>
  )
}
