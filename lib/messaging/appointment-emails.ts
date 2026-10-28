import "server-only"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { generateICS } from "@/lib/booking-logic"
import { sendMessage, type SendMessageResult } from "./index"
import type { TemplateDataMap } from "@/emails/templates"
import type { SalonBranding } from "@/emails/layout"

// Helpers that load everything an appointment email needs and hand it to
// sendMessage. All reads go through the admin client: these run from server
// actions (fire-and-forget after the mutation) and from cron jobs, where no
// user session exists. Only non-health data is selected and passed on.

const TZ = "Europe/Bucharest"

interface AppointmentContext {
  appointment: {
    id: string
    starts_at: string
    ends_at: string
    status: string
    notes: string | null
    total_price: number | null
  }
  client: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null
  staff: { first_name: string | null; last_name: string | null; user_id: string | null } | null
  salon: {
    id: string
    name: string
    email: string | null
    branding: Record<string, unknown> | null
    address: string | null
    city: string | null
    phone: string
    booking_settings: Record<string, unknown> | null
  }
  services: { name: string; price: number; durationMin: number }[]
}

async function loadAppointmentContext(
  salonId: string,
  appointmentId: string,
): Promise<AppointmentContext | null> {
  const admin = createSupabaseAdminClient()
  // No FK embeds for appointments→appointment_services in the generated
  // types (known gotcha) — fetch the service lines separately and join here.
  const { data, error } = await admin
    .from("appointments")
    .select(
      `id, starts_at, ends_at, status, notes, total_price,
       clients (first_name, last_name, email, phone),
       staff (first_name, last_name, user_id),
       salons (id, name, email, branding, address, city, phone, booking_settings)`,
    )
    .eq("id", appointmentId)
    .eq("salon_id", salonId)
    .maybeSingle()

  if (error || !data) {
    console.error("[v0] appointment email context load failed:", error?.message ?? "not found")
    return null
  }

  const salon = data.salons as unknown as AppointmentContext["salon"] | null
  if (!salon) return null

  const { data: serviceRows, error: servicesError } = await admin
    .from("appointment_services")
    .select("name_snapshot, price, duration_min")
    .eq("appointment_id", appointmentId)
    .order("sort_order")

  if (servicesError) {
    console.error("[v0] appointment services load failed:", servicesError.message)
  }

  return {
    appointment: {
      id: data.id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      status: data.status,
      notes: data.notes,
      total_price: data.total_price,
    },
    client: (data.clients as unknown as AppointmentContext["client"]) ?? null,
    staff: (data.staff as unknown as AppointmentContext["staff"]) ?? null,
    salon,
    services: (serviceRows ?? [])
      .map((s) => ({
        name: s.name_snapshot,
        price: Number(s.price),
        durationMin: s.duration_min,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ro")),
  }
}

function branding(salon: AppointmentContext["salon"]): SalonBranding {
  const b = salon.branding ?? {}
  return {
    name: salon.name,
    accentColor: typeof b.primary_color === "string" ? b.primary_color : null,
    logoUrl: typeof b.logo_url === "string" ? b.logo_url : null,
    address: salon.address,
    city: salon.city,
    phone: salon.phone,
  }
}

function bucharestParts(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
  return { date, time }
}

function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso))
}

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

function mapsUrl(salon: AppointmentContext["salon"]): string {
  const query = [salon.address, salon.city].filter(Boolean).join(", ")
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function buildIcs(ctx: AppointmentContext): { filename: string; contentBase64: string } | null {
  const { date, time } = bucharestParts(ctx.appointment.starts_at)
  const durationMin = Math.max(
    1,
    Math.round((Date.parse(ctx.appointment.ends_at) - Date.parse(ctx.appointment.starts_at)) / 60000),
  )
  const ics = generateICS({
    title: `${ctx.salon.name}: ${ctx.services.map((s) => s.name).join(" + ")}`,
    description: `Programare la ${ctx.salon.name}. Tel: ${ctx.salon.phone}`,
    location: [ctx.salon.address, ctx.salon.city].filter(Boolean).join(", "),
    date,
    time,
    durationMin,
  })
  return { filename: "programare.ics", contentBase64: Buffer.from(ics, "utf8").toString("base64") }
}

async function staffUserEmail(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data?.user?.email) return null
  return data.user.email
}

function readCancellationHours(bookingSettings: Record<string, unknown> | null): number {
  const raw = bookingSettings?.cancellation_window_hours
  return typeof raw === "number" && raw > 0 ? raw : 24
}

/**
 * Confirmation to the client (if it has an email) + "programare nouă online"
 * to the salon email and the linked staff member's user email.
 * `manageUrl` comes from the public booking flow (raw token in hand);
 * internal appointments have no manage link.
 */
export async function sendAppointmentConfirmation(
  salonId: string,
  appointmentId: string,
  options: { manageUrl?: string | null; clientEmail?: string | null } = {},
): Promise<{ client: SendMessageResult | null; salon: SendMessageResult | null; staff: SendMessageResult | null }> {
  const ctx = await loadAppointmentContext(salonId, appointmentId)
  if (!ctx) return { client: null, salon: null, staff: null }

  const b = branding(ctx.salon)
  const clientEmail = options.clientEmail ?? ctx.client?.email ?? null
  const staffFirstName = ctx.staff?.first_name ?? "specialistul tău"
  const services = ctx.services
  const serviceNames = services.map((s) => s.name)

  let client: SendMessageResult | null = null
  if (clientEmail) {
    client = await sendMessage({
      salonId,
      appointmentId,
      kind: "confirmare_programare",
      to: clientEmail,
      data: {
        clientFirstName: ctx.client?.first_name ?? "",
        salon: b,
        services,
        dateLabel: dateLabel(ctx.appointment.starts_at),
        timeLabel: timeLabel(ctx.appointment.starts_at),
        staffFirstName,
        mapsUrl: mapsUrl(ctx.salon),
        manageUrl: options.manageUrl ?? null,
        cancellationHours: readCancellationHours(ctx.salon.booking_settings),
      } satisfies TemplateDataMap["confirmare_programare"],
      attachments: [buildIcs(ctx)].filter((a): a is NonNullable<typeof a> => a !== null),
    })
  }

  const salonData: TemplateDataMap["programare_noua_online"] = {
    clientName: [ctx.client?.first_name, ctx.client?.last_name].filter(Boolean).join(" ") || "Client",
    clientPhone: ctx.client?.phone ?? "",
    clientEmail: clientEmail,
    salon: b,
    services,
    dateLabel: dateLabel(ctx.appointment.starts_at),
    timeLabel: timeLabel(ctx.appointment.starts_at),
    staffFirstName,
    notes: ctx.appointment.notes,
  }

  let salonResult: SendMessageResult | null = null
  if (ctx.salon.email) {
    salonResult = await sendMessage({
      salonId,
      appointmentId,
      kind: "programare_noua_online",
      to: ctx.salon.email,
      data: salonData,
    })
  }

  let staffResult: SendMessageResult | null = null
  if (ctx.staff?.user_id) {
    const staffEmail = await staffUserEmail(ctx.staff.user_id)
    if (staffEmail && staffEmail !== ctx.salon.email) {
      staffResult = await sendMessage({
        salonId,
        appointmentId,
        kind: "programare_noua_online_staff",
        to: staffEmail,
        data: salonData,
      })
    }
  }

  return { client, salon: salonResult, staff: staffResult }
}

/** Cancellation to the client (if it has an email) + a copy to the salon. */
export async function sendAppointmentCancellation(
  salonId: string,
  appointmentId: string,
  reason: string | null,
): Promise<{ client: SendMessageResult | null; salon: SendMessageResult | null }> {
  const ctx = await loadAppointmentContext(salonId, appointmentId)
  if (!ctx) return { client: null, salon: null }

  const b = branding(ctx.salon)
  const serviceNames = ctx.services.map((s) => s.name)
  const staffFirstName = ctx.staff?.first_name ?? "specialistul tău"
  const dateLabelValue = dateLabel(ctx.appointment.starts_at)
  const timeLabelValue = timeLabel(ctx.appointment.starts_at)

  let client: SendMessageResult | null = null
  if (ctx.client?.email) {
    client = await sendMessage({
      salonId,
      appointmentId,
      kind: "anulare",
      to: ctx.client.email,
      data: {
        recipient: "client",
        clientFirstName: ctx.client.first_name,
        salon: b,
        serviceNames,
        dateLabel: dateLabelValue,
        timeLabel: timeLabelValue,
        staffFirstName,
        reason,
      } satisfies TemplateDataMap["anulare"],
    })
  }

  let salonResult: SendMessageResult | null = null
  if (ctx.salon.email) {
    salonResult = await sendMessage({
      salonId,
      appointmentId,
      kind: "anulare_salon",
      to: ctx.salon.email,
      data: {
        recipient: "salon",
        clientFirstName:
          [ctx.client?.first_name, ctx.client?.last_name].filter(Boolean).join(" ") || null,
        salon: b,
        serviceNames,
        dateLabel: dateLabelValue,
        timeLabel: timeLabelValue,
        staffFirstName,
        reason,
      } satisfies TemplateDataMap["anulare_salon"],
    })
  }

  return { client, salon: salonResult }
}
