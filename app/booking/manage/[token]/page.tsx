import { notFound } from "next/navigation"
import type { Metadata } from "next"
import crypto from "node:crypto"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { ManageCancel } from "@/components/booking/manage-cancel"

export const dynamic = "force-dynamic"

// noindex — the manage URL is a secret capability (token in the path).
export const metadata: Metadata = {
  title: "Programarea ta",
  robots: { index: false, follow: false },
}

type AppointmentRow = {
  id: string
  salon_id: string
  staff_id: string
  starts_at: string
  ends_at: string
  status: string
  total_price: number
  confirmation_code: string | null
}

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!isSupabaseAdminConfigured()) notFound()
  const supabase = createSupabaseAdminClient()
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  const { data: aptRow } = await supabase
    .from("appointments")
    .select("id, salon_id, staff_id, starts_at, ends_at, status, total_price, confirmation_code")
    .eq("manage_token_hash", tokenHash)
    .maybeSingle()

  const apt = aptRow as AppointmentRow | null
  if (!apt) notFound()

  // Join in code — no FK embeds relied upon.
  const [{ data: salonRow }, { data: staffRow }, { data: servicesRows }] = await Promise.all([
    supabase
      .from("salons")
      .select("name, phone, address, cancellation_window_hours")
      .eq("id", apt.salon_id)
      .maybeSingle(),
    supabase.from("staff").select("first_name").eq("id", apt.staff_id).maybeSingle(),
    supabase
      .from("appointment_services")
      .select("name_snapshot, price, duration_min")
      .eq("appointment_id", apt.id),
  ])

  const salon = salonRow as {
    name: string
    phone: string
    address: string | null
    cancellation_window_hours: number | null
  } | null

  if (!salon) notFound()

  const services = (servicesRows ?? []) as { name_snapshot: string; price: number; duration_min: number }[]
  const startsAt = new Date(apt.starts_at)
  const endsAt = new Date(apt.ends_at)
  const windowHours = salon.cancellation_window_hours ?? 4
  const cancellableUntil = new Date(startsAt.getTime() - windowHours * 3600_000)
  const cancellable = apt.status !== "anulat" && Date.now() < cancellableUntil.getTime()

  const fmtDate = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Bucharest",
  }).format(startsAt)
  const fmtTime = new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Bucharest",
  }).format(startsAt)
  const fmtEndTime = new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Bucharest",
  }).format(endsAt)

  const cancelled = apt.status === "anulat"

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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
          Programarea ta
        </h1>
        <p className="mt-2 text-base text-zinc-600">
          {cancelled
            ? "Această programare a fost anulată."
            : "Detaliile programării tale sunt mai jos."}
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <dl className="divide-y divide-zinc-100">
            <Row label="Data">
              <span className="capitalize">{fmtDate}</span>
            </Row>
            <Row label="Ora">
              {fmtTime}–{fmtEndTime}
            </Row>
            <Row label="Specialist">
              {(staffRow as { first_name: string } | null)?.first_name ?? "—"}
            </Row>
            <Row label="Servicii">
              <ul className="space-y-1">
                {services.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-zinc-700">{s.name_snapshot}</span>
                    <span className="shrink-0 font-medium text-zinc-900">
                      {new Intl.NumberFormat("ro-RO", {
                        style: "currency",
                        currency: "RON",
                        maximumFractionDigits: 0,
                      }).format(Number(s.price))}
                    </span>
                  </li>
                ))}
              </ul>
            </Row>
            {apt.confirmation_code && (
              <Row label="Cod confirmare">
                <span className="font-mono">{apt.confirmation_code}</span>
              </Row>
            )}
          </dl>
          <div className="flex items-center justify-between border-t border-zinc-100 bg-emerald-50 px-5 py-4">
            <div className="text-sm font-medium text-emerald-900">Total</div>
            <div className="text-2xl font-bold text-emerald-700">
              {new Intl.NumberFormat("ro-RO", {
                style: "currency",
                currency: "RON",
                maximumFractionDigits: 0,
              }).format(Number(apt.total_price))}
            </div>
          </div>
        </div>

        {!cancelled && (
          <div className="mt-6">
            {cancellable ? (
              <ManageCancel token={token} salonPhone={salon.phone} />
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p>
                  Anularea online nu mai este posibilă (mai puțin de {windowHours}{" "}
                  {windowHours === 1 ? "oră" : "ore"} până la programare). Pentru modificări sau
                  anulare, sună la salon:
                </p>
                <a
                  href={`tel:${salon.phone.replace(/\s/g, "")}`}
                  className="mt-2 inline-flex h-11 items-center rounded-lg bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Sună la {salon.phone}
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500">
        Programare gestionată prin <span className="font-semibold text-zinc-700">ASESOR</span>
      </footer>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
        <div className="mt-0.5 text-sm text-zinc-900">{children}</div>
      </div>
    </div>
  )
}
