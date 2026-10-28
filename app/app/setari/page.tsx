import type { Metadata } from "next"
import { requireRole } from "@/lib/auth/session"
import { loadSetariState, loadSetariProducts, getSalonRow } from "@/lib/data/setari"
import { getReviewsStatsForSalon } from "@/lib/data/feedback"
import {
  mapSalonToProfil,
  mapHoursRowsToSetariSchedule,
  mapSalonToPolitici,
  mapLoyaltyJson,
  mapReviewsJson,
  mapCategoryRowsToSetariCategories,
  mapServiceRowsToSetariServices,
} from "@/lib/mappers/setari"
import { SetariView } from "@/components/app/setari-view"

export const metadata: Metadata = {
  title: "Setări | ASESOR",
  description: "Configurează salonul: profil, program, servicii, politici, loialitate și recenzii.",
}

// Setările se încarcă pe server (RLS ca utilizator autentificat) și se dau
// ca props view-ului client. Doar owner/manager au acces.
export default async function SetariPage() {
  const session = await requireRole(["owner", "manager"])
  const salon = session.salon
  if (!salon) return null

  const [state, salonRow, products, reviewsStats] = await Promise.all([
    loadSetariState(salon.id),
    getSalonRow(salon.id),
    loadSetariProducts(salon.id),
    getReviewsStatsForSalon(salon.id),
  ])

  return (
    <SetariView
      profil={mapSalonToProfil(salonRow ?? salon)}
      schedule={mapHoursRowsToSetariSchedule(state.hours)}
      politici={mapSalonToPolitici(salonRow ?? salon)}
      loyalty={mapLoyaltyJson((salonRow ?? salon).loyalty_config)}
      reviews={mapReviewsJson(salonRow ?? salon)}
      reviewsStats={reviewsStats}
      categories={mapCategoryRowsToSetariCategories(state.categories)}
      services={mapServiceRowsToSetariServices(state.services, state.staffServices, state.serviceProducts)}
      staff={state.staff.map((s) => ({ id: s.id, name: `${s.first_name} ${s.last_name}`.trim() }))}
      products={products}
      deletedAt={salon.deleted_at}
    />
  )
}
