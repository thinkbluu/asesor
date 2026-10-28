import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { loadOnboardingState } from "@/lib/data/onboarding"
import {
  ONBOARDING_DONE_STEP,
  DEFAULT_ONBOARDING_SERVICES,
  emptyOnboardingSalon,
  emptyOnboardingStaff,
  defaultOnboardingRules,
  mapSalonToStep1,
  mapServiceRowsToStep2,
  mapHoursRowsToStep3,
  mapStaffRowsToStep4,
  mapToStep5,
  readBookingSettings,
} from "@/lib/mappers/onboarding"
import { OnboardingWizard } from "@/components/app/onboarding/onboarding-wizard"

export const metadata: Metadata = {
  title: "Configurare salon | ASESOR",
  description: "Configurează-ți salonul în 5 pași: informații, servicii, program, echipă și reguli de programare.",
}

// Onboarding: utilizatorii fără salon pornesc de la zero; cei cu salon îl
// continuă de la booking_settings.onboarding_step; cei care au terminat
// (step >= 6) sunt trimiși în aplicație.
export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  if (!session.salon) {
    return (
      <OnboardingWizard
        initialStep={1}
        initialSalon={emptyOnboardingSalon()}
        initialServices={DEFAULT_ONBOARDING_SERVICES}
        initialSchedule={mapHoursRowsToStep3([])}
        initialStaff={[emptyOnboardingStaff()]}
        initialRules={defaultOnboardingRules()}
        initialSlug={null}
      />
    )
  }

  // Un angajat invitat nu are ce configura — îl trimitem în aplicație.
  if (session.role && session.role !== "owner" && session.role !== "manager") {
    redirect("/app?error=forbidden")
  }

  const state = await loadOnboardingState(session.salon.id)
  if (!state.salon) redirect("/login")

  const { onboardingStep } = readBookingSettings(state.salon.booking_settings)
  if (onboardingStep >= ONBOARDING_DONE_STEP) redirect("/app")

  return (
    <OnboardingWizard
      initialStep={Math.min(5, onboardingStep)}
      initialSalon={mapSalonToStep1(state.salon)}
      initialServices={mapServiceRowsToStep2(state.services)}
      initialSchedule={mapHoursRowsToStep3(state.hours)}
      initialStaff={mapStaffRowsToStep4(state.staff, state.staffServices)}
      initialRules={mapToStep5(state.salon)}
      initialSlug={state.salon.slug}
    />
  )
}
