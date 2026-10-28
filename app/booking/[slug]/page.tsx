import { notFound } from "next/navigation"
import type { SalonInfo } from "@/lib/booking-logic"

async function getSalonBySlug(_slug: string): Promise<SalonInfo | null> {
  return null
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const salon = await getSalonBySlug(slug)
  if (!salon) notFound()

  return null
}
