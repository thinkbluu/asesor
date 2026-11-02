import { notFound } from "next/navigation"
import type { Metadata } from "next"
import crypto from "node:crypto"
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"
import { SalonShell } from "@/components/booking/salon-shell"
import { ManageCancel } from "@/components/booking/manage-cancel"
import "../../booking.css"

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
      .select("name, phone, address, cancellation_window_hours, branding")
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
    branding: { primary_color?: string; logo_url?: string } | null
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
  const ron = new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  })

  return (
    <SalonShell
      name={salon.name}
      address={salon.address}
      logoUrl={salon.branding?.logo_url ?? null}
      accentColor={salon.branding?.primary_color ?? null}
    >
      <main className="bk-main" style={{ paddingBottom: 40 }}>
        <h1 className="bk-title">Programarea ta</h1>
        <p className="bk-lede">
          {cancelled
            ? "Această programare a fost anulată."
            : "Detaliile programării tale sunt mai jos."}
        </p>

        <div className="bk-card" style={{ marginTop: 20 }}>
          <dl>
            <Row label="Data">
              <span style={{ textTransform: "capitalize" }}>{fmtDate}</span>
            </Row>
            <Row label="Ora">
              {fmtTime}–{fmtEndTime}
            </Row>
            <Row label="Specialist">
              {(staffRow as { first_name: string } | null)?.first_name ?? "—"}
            </Row>
            <Row label="Servicii">
              <ul style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {services.map((s, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "var(--ink-2)" }}>{s.name_snapshot}</span>
                    <span style={{ flex: "none", fontWeight: 500 }}>{ron.format(Number(s.price))}</span>
                  </li>
                ))}
              </ul>
            </Row>
            {apt.confirmation_code && (
              <Row label="Cod confirmare">
                <span style={{ fontFamily: "var(--mono)" }}>{apt.confirmation_code}</span>
              </Row>
            )}
          </dl>
          <div className="bk-total">
            <span className="bk-rlabel" style={{ fontSize: 12.5 }}>Total</span>
            <b>{ron.format(Number(apt.total_price))}</b>
          </div>
        </div>

        {!cancelled && (
          <div style={{ marginTop: 20 }}>
            {cancellable ? (
              <ManageCancel token={token} salonPhone={salon.phone} />
            ) : (
              <div className="bk-alert">
                <p>
                  Anularea online nu mai este posibilă (mai puțin de {windowHours}{" "}
                  {windowHours === 1 ? "oră" : "ore"} până la programare). Pentru modificări sau
                  anulare, sună la salon:
                </p>
                <a
                  href={`tel:${salon.phone.replace(/\s/g, "")}`}
                  className="bk-btn"
                  style={{ marginTop: 12, minHeight: 46, textDecoration: "none", display: "inline-flex" }}
                >
                  Sună la {salon.phone}
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </SalonShell>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bk-row">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="bk-rlabel">{label}</div>
        <div className="bk-rval">{children}</div>
      </div>
    </div>
  )
}
