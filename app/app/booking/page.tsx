import { getSession } from "@/lib/auth/session"
import { getSalonRow } from "@/lib/data/setari"
import { mapSalonToBranding } from "@/lib/mappers/setari"
import { BookingTabSwitcher } from "@/components/app/booking/booking-tab-switcher"

// Pagina de programare online: datele de branding vin din DB (salons.branding +
// booking_settings), iar tab-urile rămân client-side după ?tab=.
export default async function BookingPage() {
  const session = await getSession()
  const salon = session?.salon ? await getSalonRow(session.salon.id) : null
  if (!salon) return null

  return <BookingTabSwitcher branding={mapSalonToBranding(salon)} />
}
