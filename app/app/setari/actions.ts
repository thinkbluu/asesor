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
  notificationSettingsSchema,
} from "@/lib/validation/setari"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"
import {
  saveSetariProfil,
  saveSetariProgram,
  saveSetariReguli,
  saveSetariBranding,
  saveSetariLoyalty,
  saveSetariReviews,
  saveSetariNotifications,
  upsertSetariCategory,
  deleteSetariCategory,
  upsertSetariService,
  deleteSetariService,
  reorderSetariServices,
  reorderSetariCategories,
} from "@/lib/data/setari"
import { sendMessage } from "@/lib/messaging"
import { sampleWithSalon } from "@/lib/messaging/test-sample"
import type { MessageKind } from "@/emails/templates"
import { billingGuard } from "@/lib/billing/guard"

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true, feature: "loialitate" })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true, feature: "loialitate" })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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

// ��── Reordonare ──────────────────────────────────────────────────────────────

export async function reorderSetariServicesAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

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
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const parsed = setariReorderSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await reorderSetariCategories(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  return { ok: true }
}

// ─── Notificări (P12) ────────────────────────────────────────────────────────

export async function saveSetariNotificariAction(input: unknown): Promise<ActionResult> {
  const blocked = await billingGuard({ write: true })
  if (blocked) return blocked

  const parsed = notificationSettingsSchema.safeParse(input)
  if (!parsed.success) return fail(zodToActionError(parsed.error).error)
  const salonId = await currentSalonId()
  if (!salonId) return fail("Nu am găsit salonul. Reîncarcă pagina.")
  const res = await saveSetariNotifications(salonId, parsed.data)
  if (!res.ok) return fail(res.error)
  revalidatePath("/app/setari")
  return { ok: true }
}

// Test send to the owner's own address, with sample data and the real salon
// branding. Deliberately bypasses the notification toggles (it is a test) and
// is still logged in message_log like any other send.
export async function sendTestEmailAction(kind: string): Promise<ActionResult> {
  const session = await requireRole(["owner"])
  const salon = session.salon
  if (!salon) return fail("Nu am găsit salonul. Reîncarcă pagina.")

  const to = session.user.email ?? ""
  if (!to) return fail("Contul tău nu are o adresă de email setată.")

  const branding = (salon.branding ?? {}) as Record<string, unknown>
  const data = sampleWithSalon(kind as MessageKind, {
    name: salon.name,
    accentColor: typeof branding.primary_color === "string" ? branding.primary_color : null,
    logoUrl: typeof branding.logo_url === "string" ? branding.logo_url : null,
    address: salon.address,
    city: salon.city,
    phone: salon.phone ?? "",
  })
  if (!data) return fail("Tip de email necunoscut.")

  const result = await sendMessage({
    salonId: salon.id,
    kind: kind as MessageKind,
    to,
    data,
  })
  if (!result.ok) return fail("Trimiterea a eșuat. Încearcă din nou.")
  if (result.status === "skipped") {
    if (result.reason === "no_provider") {
      return fail("RESEND_API_KEY nu este setat — emailul a fost doar înregistrat în jurnal (message_log).")
    }
    return fail("Trimiterea a fost omisă (dezactivată sau deja trimisă).")
  }
  return { ok: true }
}
