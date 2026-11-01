"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  Copy,
  Check,
  Link2,
} from "lucide-react"
import type { SalonInfo, BookingService } from "@/lib/booking-logic"
import {
  formatPriceRON,
  formatDurationMin,
  formatDateLong,
  generateICS,
} from "@/lib/booking-logic"
import type { BookingState } from "./booking-flow"

type SubmitResult =
  | { ok: false; code: string; message: string }
  | null

function Review({
  salon,
  state,
  services,
  staffName,
  onSubmit,
}: {
  salon: SalonInfo
  state: BookingState
  services: BookingService[]
  staffName: string | null
  onSubmit: () => Promise<SubmitResult>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedServices = useMemo(
    () =>
      state.serviceIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is BookingService => !!s),
    [state.serviceIds, services],
  )

  const totals = useMemo(() => {
    let d = 0
    let p = 0
    for (const s of selectedServices) {
      d += s.durationMin
      p += s.price
    }
    return { duration: d, price: p }
  }, [selectedServices])

  const confirmBooking = async () => {
    setSubmitting(true)
    setError(null)
    const res = await onSubmit()
    if (res && !res.ok) {
      setError(res.message)
      setSubmitting(false)
      return
    }
    // On success the flow swaps to the Success screen; keep submitting state
    // until then to avoid a double submit.
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p className="bk-lede" style={{ marginTop: 0 }}>
        Verifică detaliile programării înainte de a confirma.
      </p>

      {error && (
        <div role="alert" className="bk-alert err">
          {error}
        </div>
      )}

      <div className="bk-card">
        <div className="bk-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: "var(--ink-2)" }} aria-hidden="true" />
            <span className="bk-rlabel">Sumar programare</span>
          </div>
        </div>

        <dl>
          <SummaryRow label="Data">
            <span style={{ textTransform: "capitalize" }}>
              {state.date ? formatDateLong(state.date) : "—"}
            </span>
          </SummaryRow>
          <SummaryRow label="Ora">
            {state.time ?? "—"} · {formatDurationMin(totals.duration)}
          </SummaryRow>
          <SummaryRow label="Specialist">
            {staffName ?? "Oricine e disponibil (alegem noi)"}
          </SummaryRow>

          <SummaryRow label="Servicii">
            <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedServices.map((s) => (
                <li key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "var(--ink-2)" }}>{s.name}</span>
                  <span style={{ flex: "none", fontWeight: 500 }}>{formatPriceRON(s.price)}</span>
                </li>
              ))}
            </ul>
          </SummaryRow>
          {state.client.notes.trim() && (
            <SummaryRow label="Mențiuni">
              <span style={{ whiteSpace: "pre-line" }}>{state.client.notes}</span>
            </SummaryRow>
          )}
        </dl>

        <div className="bk-total">
          <span className="bk-rlabel" style={{ fontSize: 12.5 }}>Total de plată</span>
          <b>{formatPriceRON(totals.price)}</b>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="bk-alert" style={{ display: "flex", gap: 9 }}>
        <AlertCircle style={{ width: 15, height: 15, flex: "none", marginTop: 2 }} aria-hidden="true" />
        <span>{salon.cancellationPolicy}</span>
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={confirmBooking}
        className="bk-btn"
        style={{ width: "100%" }}
      >
        {submitting ? "Se trimite..." : "Confirmă programarea"}
      </button>
    </div>
  )
}

function Success({
  salon,
  state,
  onReset,
}: {
  salon: SalonInfo
  state: BookingState
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const result = state.result!
  const date = result.startsAt.slice(0, 10)
  const time = result.startsAt.slice(11, 16)

  const icsHref = useMemo(() => {
    const ics = generateICS({
      title: `${salon.name} — programare`,
      description: `Cod confirmare: ${result.code}. Servicii: ${result.services.map((s) => s.name).join(", ")}.`,
      location: `${salon.name}, ${salon.address}`,
      date,
      time,
      durationMin: result.durationMin,
    })
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  }, [salon, result, date, time])

  const copyConfirmation = async () => {
    try {
      await navigator.clipboard.writeText(result.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — non-critical
    }
  }

  return (
    <main className="bk-main" style={{ paddingBottom: 40 }}>
        {/* Hero confirmation */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <span
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 56, height: 56, borderRadius: "50%", marginBottom: 14,
              background: "var(--acc)", color: "var(--acc-ink)",
            }}
          >
            <CheckCircle2 style={{ width: 26, height: 26 }} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <h1 className="bk-title">
            {result.status === "in_asteptare"
              ? "Programare trimisă spre confirmare!"
              : "Programare confirmată!"}
          </h1>
          <p className="bk-lede">
            {result.status === "in_asteptare"
              ? `${salon.name} va confirma programarea în cel mai scurt timp.`
              : `Te așteptăm la ${salon.name}. Toate detaliile sunt mai jos.`}
          </p>
        </div>

        {/* Confirmation code */}
        <div className="bk-card" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div>
            <div className="bk-rlabel">Cod confirmare</div>
            <div className="bk-rval" style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 500 }}>
              {result.code}
            </div>
          </div>
          <button type="button" onClick={copyConfirmation} className="bk-btn2" style={{ alignSelf: "flex-start" }}>
            {copied ? (
              <>
                <Check style={{ width: 14, height: 14 }} aria-hidden="true" />
                Copiat
              </>
            ) : (
              <>
                <Copy style={{ width: 14, height: 14 }} aria-hidden="true" />
                Copiază
              </>
            )}
          </button>
        </div>

        {/* Summary */}
        <div className="bk-card">
          <dl>
            <SummaryRow label="Data">
              <span style={{ textTransform: "capitalize" }}>{formatDateLong(date)}</span>
            </SummaryRow>
            <SummaryRow label="Ora">
              {time} · {formatDurationMin(result.durationMin)}
            </SummaryRow>
            <SummaryRow label="Specialist">
              {result.staffFirstName || "Oricine e disponibil"}
            </SummaryRow>
            <SummaryRow label="Servicii">
              <ul style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {result.services.map((s) => (
                  <li key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "var(--ink-2)" }}>{s.name}</span>
                    <span style={{ flex: "none", fontWeight: 500 }}>{formatPriceRON(s.price)}</span>
                  </li>
                ))}
              </ul>
            </SummaryRow>
            <SummaryRow label="Locație">
              {salon.address}
            </SummaryRow>
            <SummaryRow label="Contact salon">
              <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="bk-link">
                {salon.phone}
              </a>
            </SummaryRow>
          </dl>

          <div className="bk-total">
            <span className="bk-rlabel" style={{ fontSize: 12.5 }}>Total</span>
            <b>{formatPriceRON(result.totalPrice)}</b>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
          <a
            href={icsHref}
            download={`programare-${result.code}.ics`}
            className="bk-btn2"
            style={{ textDecoration: "none" }}
          >
            <CalendarPlus style={{ width: 15, height: 15 }} aria-hidden="true" />
            Adaugă în calendar
          </a>
          <a href={result.managePath} className="bk-btn" style={{ textDecoration: "none" }}>
            <Link2 style={{ width: 15, height: 15 }} aria-hidden="true" />
            Gestionează programarea
          </a>
        </div>

        <div className="bk-alert" style={{ marginTop: 18 }}>
          Vrei să modifici sau să anulezi programarea? Folosește linkul de mai sus sau sună la{" "}
          <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="bk-link">
            {salon.phone}
          </a>
          .
        </div>

        <button type="button" onClick={onReset} className="bk-back" style={{ marginTop: 18 }}>
          Programează-te din nou
        </button>
    </main>
  )
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bk-row">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="bk-rlabel">{label}</div>
        <div className="bk-rval">{children}</div>
      </div>
    </div>
  )
}

export const StepConfirm = { Review, Success }
