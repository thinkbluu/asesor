import { notFound } from "next/navigation"
import { BookingFlow } from "@/components/booking/booking-flow"
import { DEMO_SALON } from "@/lib/booking-logic"

// In a real app this would look up the salon by slug from the DB.
// For the demo, any slug resolves to the same salon info — we just reflect the slug in the URL.
async function getSalonBySlug(slug: string) {
  if (!slug) return null
  return { ...DEMO_SALON, slug }
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const salon = await getSalonBySlug(slug)
  if (!salon) notFound()

  return <BookingFlow salon={salon} />
}
