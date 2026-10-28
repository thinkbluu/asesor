"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth/session"
import {
  setariProfilSchema,
  setariProgramSchema,
  setariReguliSchema,
  setariBrandingSchema,
  loyaltyConfigSchema,
  reviewsConfigSchema,
  setariCategorySchema,
  setariServiceSchema,
  setariReorderSchema,
} from "@/lib/validation/setari"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"
import {
  saveSetariProfil,
  saveSetariProgram,
  saveSetariReguli,
  saveSetariBranding,
  saveSetariLoyalty,
  saveSetariReviews,
  upsertSetariCategory,
  deleteSetariCategory,
  upsertSetariService,
  deleteSetariService,
  reorderSetariServices,
  reorderSetariCategories,
} from "@/lib/data/setari"

// Setări: doar owner/manager pot modifica. `salon_id` vine din sesiune.

const idSchema = z.object({ id: z.string().uuid("Identificator invalid.") })

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

async function currentSalonId(): Promise<string | null> {
  const session = await requireRole(["owner", "manager"])
  return session.salon?.id ?? null
}

// ─── Profil ──────────────────────────────────────────────────────────────────

export async function saveSetariProfilAction(input: unknown): Promise<ActionResult> {
  const parsed = setariProfilSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await saveSetariProfil(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  revalidatePath("/app")
  return { ok: true }
}

// ─── Program ─────────────────────────────────────────────────────────────────

export async function saveSetariProgramAction(input: unknown): Promise<ActionResult> {
  const parsed = setariProgramSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await saveSetariProgram(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  revalidatePath("/app/programari")
  revalidatePath("/app/booking")
  return { ok: true }
}

// ─── Politici (booking rules) ────────────────────────────────────────────────

export async function saveSetariReguliAction(input: unknown): Promise<ActionResult> {
  const parsed = setariReguliSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await saveSetariReguli(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  revalidatePath("/app/booking")
  return { ok: true }
}

// ─── Branding (pagina publică de programare) ─────────────────────────────────

export async function saveSetariBrandingAction(input: unknown): Promise<ActionResult> {
  const parsed = setariBrandingSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await saveSetariBranding(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/booking")
  revalidatePath("/app/setari")
  return { ok: true }
}

// ─── Loialitate / Recenzii ───────────────────────────────────────────────────

export async function saveSetariLoyaltyAction(input: unknown): Promise<ActionResult> {
  const parsed = loyaltyConfigSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await saveSetariLoyalty(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  revalidatePath("/app/clienti")
  return { ok: true }
}

export async function saveSetariReviewsAction(input: unknown): Promise<ActionResult> {
  const parsed = reviewsConfigSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await saveSetariReviews(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  return { ok: true }
}

// ─── Servicii: categorii ─────────────────────────────────────────────────────

export async function upsertSetariCategoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = setariCategorySchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await upsertSetariCategory(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  return { ok: true, data: res.data }
}

export async function deleteSetariCategoryAction(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await deleteSetariCategory(salonId, parsed.data.id)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  return { ok: true }
}

// ─── Servicii: servicii ──────────────────────────────────────────────────────

export async function upsertSetariServiceAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = setariServiceSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await upsertSetariService(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  revalidatePath("/app/programari")
  return { ok: true, data: res.data }
}

export async function deleteSetariServiceAction(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await deleteSetariService(salonId, parsed.data.id)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  revalidatePath("/app/programari")
  return { ok: true }
}

// ─── Reordonare ──────────────────────────────────────────────────────────────

export async function reorderSetariServicesAction(input: unknown): Promise<ActionResult> {
  const parsed = setariReorderSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await reorderSetariServices(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  return { ok: true }
}

export async function reorderSetariCategoriesAction(input: unknown): Promise<ActionResult> {
  const parsed = setariReorderSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await reorderSetariCategories(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  return { ok: true }
}
