import { notFound } from "next/navigation"
import { cache } from "react"
import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { loadBillingStateBySlug } from "@/lib/billing/state"
import { BookingFlow } from "@/components/booking/booking-flow"
import type { SalonInfo, BookingService } from "@/lib/booking-logic"
import { getDayNameRO } from "@/lib/booking-logic"
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config"

export const dynamic = "force-dynamic"

type ProfileJson = {
  name: string
  slug: string
  city: string | null
  address: string | null
  phone: string | null
  description: string | null
  cancellation_policy: string | null
  cancellation_window_hours: number | null
  salon_hours: { weekday: number; opens: string | null; closes: string | null; is_open: boolean }[]
}

const loadPublicSalon = cache(
  async (slug: string): Promise<{ salon: SalonInfo; services: BookingService[] } | null> => {
    if (!isSupabaseConfigured() || !supabaseUrl() || !supabaseAnonKey()) return null
    const supabase = createClient(supabaseUrl()!, supabaseAnonKey()!)
    const [{ data: profile }, { data: services }] = await Promise.all([
      supabase.rpc("public_salon_profile", { p_slug: slug }),
      supabase.rpc("public_services", { p_slug: slug }),
    ])
    if (!profile) return null
    const p = profile as ProfileJson

    const hoursText = (p.salon_hours ?? [])
      .map((h) => {
        const day = getDayNameRO(h.weekday)
        if (!h.is_open || !h.opens || !h.closes) return `${day}: închis`
        return `${day}: ${h.opens.slice(0, 5)}–${h.closes.slice(0, 5)}`
      })
      .join(" · ")

    return {
      salon: {
        slug: p.slug,
        name: p.name,
        address: p.address ?? "",
        phone: p.phone ?? "",
        city: p.city ?? "",
        description: p.description ?? "",
        cancellationPolicy:
          p.cancellation_policy ??
          "Programările pot fi anulate gratuit cu minim 4 ore înainte de ora stabilită.",
        cancellationWindowHours: p.cancellation_window_hours ?? 4,
        hoursText,
      },
      services: ((services ?? []) as unknown[]).map((s) => {
        const rec = s as {
          id: string
          name: string
          category: string
          duration_min: number
          price: string | number
          price_from: boolean
        }
        return {
          id: rec.id,
          name: rec.name,
          category: rec.category,
          durationMin: rec.duration_min,
          price: Number(rec.price),
          priceFrom: rec.price_from,
        }
      }),
    }
  },
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await loadPublicSalon(slug)
  if (!data) return { title: "Programare online" }
  return {
    title: `Programare online · ${data.salon.name}`,
    description: `Programează-te online la ${data.salon.name}${data.salon.city ? `, ${data.salon.city}` : ""}. Alege serviciul, specialistul și ora.`,
  }
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await loadPublicSalon(slug)
  if (!data) notFound()

  const billing = await loadBillingStateBySlug(slug)
  if (billing?.readOnly) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-balance text-2xl font-bold">{data.salon.name}</h1>
        <p role="status" className="text-pretty text-muted-foreground">
          Programarea online este temporar indisponibilă.
          {data.salon.phone ? ` Sună la salon: ${data.salon.phone}` : ""}
        </p>
      </main>
    )
  }

  return <BookingFlow salon={data.salon} services={data.services} />
}
