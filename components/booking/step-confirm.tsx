"use client"

import { useMemo, useState } from "react"
import {
  Calendar,
  Clock,
  User,
  Scissors,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  Copy,
  Phone,
  MapPin,
  Check,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 md:text-base">
        Verifică detaliile programării înainte de a confirma.
      </p>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sumar programare
          </div>
        </div>

        <dl className="divide-y divide-zinc-100">
          <SummaryRow icon={Calendar} label="Data">
            <span className="capitalize">{state.date ? formatDateLong(state.date) : "—"}</span>
          </SummaryRow>
          <SummaryRow icon={Clock} label="Ora">
            {state.time ?? "—"} · {formatDurationMin(totals.duration)}
          </SummaryRow>
          <SummaryRow icon={User} label="Specialist">
            {staffName ?? "Oricine e disponibil (alegem noi)"}
          </SummaryRow>

          <SummaryRow icon={Scissors} label="Servicii">
            <ul className="space-y-1.5">
              {selectedServices.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span className="text-zinc-700">{s.name}</span>
                  <span className="shrink-0 font-medium text-zinc-900">
                    {formatPriceRON(s.price)}
                  </span>
                </li>
              ))}
            </ul>
          </SummaryRow>
          {state.client.notes.trim() && (
            <SummaryRow icon={FileText} label="Mențiuni">
              <span className="whitespace-pre-line text-zinc-700">{state.client.notes}</span>
            </SummaryRow>
          )}
        </dl>

        <div className="flex items-center justify-between border-t border-zinc-100 bg-emerald-50 px-5 py-4">
          <div className="text-sm font-medium text-emerald-900">Total de plată</div>
          <div className="text-2xl font-bold text-emerald-700">{formatPriceRON(totals.price)}</div>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">{salon.cancellationPolicy}</p>
        </div>
      </div>

      <Button
        size="lg"
        disabled={submitting}
        onClick={confirmBooking}
        className="h-12 w-full bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-300 sm:w-auto sm:px-10"
      >
        {submitting ? "Se trimite..." : "Confirmă programarea"}
      </Button>
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
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
            {salon.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-zinc-900 md:text-lg">
              {salon.name}
            </div>
            <div className="truncate text-xs text-zinc-500 md:text-sm">{salon.address}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:py-12">
        {/* Hero confirmation */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            {result.status === "in_asteptare"
              ? "Programare trimisă spre confirmare!"
              : "Programare confirmată!"}
          </h1>
          <p className="mt-2 text-base text-zinc-600">
            {result.status === "in_asteptare"
              ? `${salon.name} va confirma programarea în cel mai scurt timp.`
              : `Te așteptăm la ${salon.name}. Toate detaliile sunt mai jos.`}
          </p>
        </div>

        {/* Confirmation code */}
        <div className="mb-6 flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Cod confirmare
            </div>
            <div className="mt-0.5 font-mono text-lg font-semibold text-zinc-900">
              {result.code}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyConfirmation}
            className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copiat
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiază
              </>
            )}
          </Button>
        </div>

        {/* Summary */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <dl className="divide-y divide-zinc-100">
            <SummaryRow icon={Calendar} label="Data">
              <span className="capitalize">{formatDateLong(date)}</span>
            </SummaryRow>
            <SummaryRow icon={Clock} label="Ora">
              {time} · {formatDurationMin(result.durationMin)}
            </SummaryRow>
            <SummaryRow icon={User} label="Specialist">
              {result.staffFirstName || "Oricine e disponibil"}
            </SummaryRow>
            <SummaryRow icon={Scissors} label="Servicii">
              <ul className="space-y-1">
                {result.services.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-3">
                    <span className="text-zinc-700">{s.name}</span>
                    <span className="shrink-0 font-medium text-zinc-900">
                      {formatPriceRON(s.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </SummaryRow>
            <SummaryRow icon={MapPin} label="Locație">
              {salon.address}
            </SummaryRow>
            <SummaryRow icon={Phone} label="Contact salon">
              <a
                href={`tel:${salon.phone.replace(/\s/g, "")}`}
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                {salon.phone}
              </a>
            </SummaryRow>
          </dl>

          <div className="flex items-center justify-between border-t border-zinc-100 bg-emerald-50 px-5 py-4">
            <div className="text-sm font-medium text-emerald-900">Total</div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatPriceRON(result.totalPrice)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href={icsHref}
            download={`programare-${result.code}.ics`}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
          >
            <CalendarPlus className="h-4 w-4" />
            Adaugă în calendar
          </a>
          <a
            href={result.managePath}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Link2 className="h-4 w-4" />
            Gestionează programarea
          </a>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          <p>
            Vrei să modifici sau să anulezi programarea? Folosește linkul de mai sus sau sună la{" "}
            <a
              href={`tel:${salon.phone.replace(/\s/g, "")}`}
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              {salon.phone}
            </a>
            .
          </p>
        </div>
      </main>

      <footer className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500">
        Programare gestionată prin <span className="font-semibold text-zinc-700">ASESOR</span>
      </footer>
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Calendar
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
        <div className="mt-0.5 text-sm text-zinc-900">{children}</div>
      </div>
    </div>
  )
}

export const StepConfirm = { Review, Success }
