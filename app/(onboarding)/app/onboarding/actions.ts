"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { requireRole, getSession } from "@/lib/auth/session"
import { SALON_COOKIE } from "@/lib/auth/constants"
import {
  onboardingSalonStepSchema,
  onboardingServicesStepSchema,
  onboardingHoursStepSchema,
  onboardingTeamStepSchema,
  onboardingRulesStepSchema,
  onboardingSkipStepSchema,
  zodToActionError,
  type ActionResult,
} from "@/lib/validation/onboarding"
import { mapServiceRowsToStep2, type OnboardingService } from "@/lib/mappers/onboarding"
import {
  createSalonForOnboarding,
  updateSalonBasics,
  saveOnboardingServices,
  saveOnboardingHours,
  saveOnboardingTeam,
  saveOnboardingRules,
  setOnboardingStep,
} from "@/lib/data/onboarding"

// Un pas din onboarding. `salon_id` vine mereu din sesiune, niciodată din payload.

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function revalidateOnboarding() {
  revalidatePath("/app/onboarding")
  revalidatePath("/app")
}

// ─── Step 1: salonul (create via RPC sau update) ─────────────────────────────

export async function saveOnboardingSalonStep(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const parsed = onboardingSalonStepSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)

  const session = await getSession()
  if (!session) return fail("Sesiunea a expirat. Autentifică-te din nou.")

  if (session.salon) {
    const res = await updateSalonBasics(session.salon.id, parsed.data)
    if (!res.ok) return fail(res.error)
    revalidateOnboarding()
    return { ok: true, data: { slug: res.data.slug } }
  }

  const res = await createSalonForOnboarding(parsed.data)
  if (!res.ok) return fail(res.error)

  // Sesiunea următoare trebuie să rezolve noul salon ca salon activ.
  const cookieStore = await cookies()
  cookieStore.set(SALON_COOKIE, res.data.salonId, { path: "/", httpOnly: true, sameSite: "lax" })

  revalidateOnboarding()
  return { ok: true, data: { slug: res.data.slug } }
}

// ─── Step 2: servicii ────────────────────────────────────────────────────────

export async function saveOnboardingServicesStep(
  input: unknown,
): Promise<ActionResult<{ slug: string; services: OnboardingService[] }>> {
  const parsed = onboardingServicesStepSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)

  const session = await requireRole(["owner", "manager"])
  const salon = session.salon
  if (!salon) return fail("Nu am găsit salonul. Reîncarcă pagina.")

  const res = await saveOnboardingServices(salon.id, parsed.data.services)
  if (!res.ok) return fail(res.error)

  const stepRes = await setOnboardingStep(salon.id, 3)
  if (!stepRes.ok) return fail(stepRes.error)

  revalidateOnboarding()
  revalidatePath("/app/setari")
  return { ok: true, data: { slug: salon.slug, services: mapServiceRowsToStep2(res.data.services) } }
}

// ─── Step 3: program ─────────────────────────────────────────────────────────

export async function saveOnboardingHoursStep(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const parsed = onboardingHoursStepSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)

  const session = await requireRole(["owner", "manager"])
  const salon = session.salon
  if (!salon) return fail("Nu am găsit salonul. Reîncarcă pagina.")

  const res = await saveOnboardingHours(salon.id, parsed.data.days)
  if (!res.ok) return fail(res.error)

  const stepRes = await setOnboardingStep(salon.id, 4)
  if (!stepRes.ok) return fail(stepRes.error)

  revalidateOnboarding()
  revalidatePath("/app/setari")
  return { ok: true, data: { slug: salon.slug } }
}

// ─── Step 4: echipa ──────────────────────────────────────────────────────────

export async function saveOnboardingTeamStep(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const parsed = onboardingTeamStepSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)

  const session = await requireRole(["owner", "manager"])
  const salon = session.salon
  if (!salon) return fail("Nu am găsit salonul. Reîncarcă pagina.")

  const res = await saveOnboardingTeam(salon.id, parsed.data.staff)
  if (!res.ok) return fail(res.error)

  const stepRes = await setOnboardingStep(salon.id, 5)
  if (!stepRes.ok) return fail(stepRes.error)

  revalidateOnboarding()
  revalidatePath("/app/setari")
  return { ok: true, data: { slug: salon.slug } }
}

// ─── Step 5: reguli (+ finalizare) ───────────────────────────────────────────

export async function saveOnboardingRulesStep(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const parsed = onboardingRulesStepSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)

  const session = await requireRole(["owner", "manager"])
  const salon = session.salon
  if (!salon) return fail("Nu am găsit salonul. Reîncarcă pagina.")

  const res = await saveOnboardingRules(salon.id, parsed.data)
  if (!res.ok) return fail(res.error)

  revalidateOnboarding()
  revalidatePath("/app/setari")
  revalidatePath("/app/booking")
  return { ok: true, data: { slug: salon.slug } }
}

// ─── „Sari peste": avansează pasul fără să salveze date ──────────────────────

export async function skipOnboardingStep(input: unknown): Promise<ActionResult> {
  const parsed = onboardingSkipStepSchema.safeParse(input)
  if (!parsed.success) return fail("Pas invalid.")

  // Pasul 1 nu are încă un salon — skip-ul rămâne client-side.
  if (parsed.data.step <= 1) return { ok: true }

  const session = await requireRole(["owner", "manager"])
  const salon = session.salon
  if (!salon) return fail("Nu am găsit salonul. Reîncarcă pagina.")

  const res = await setOnboardingStep(salon.id, parsed.data.step + 1)
  if (!res.ok) return fail(res.error)

  revalidateOnboarding()
  return { ok: true }
}
