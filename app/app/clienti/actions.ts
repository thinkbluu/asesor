"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth/session"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { aal2Required, MFA_REQUIRED, type MfaRequired } from "@/lib/auth/mfa"
import { zodToActionError, type ActionResult } from "@/lib/validation/onboarding"
import * as db from "@/lib/data/clienti"
import {
  clientListQuerySchema,
  clientUpdateSchema,
  sensitiveSaveSchema,
  clientDeleteSchema,
  importPayloadSchema,
  photoMetaSchema,
} from "@/lib/validation/clienti"

// Server actions for Clienti. Reads: every salon role. Profile CRUD:
// owner/manager/receptionist. Protected health data (read + write) and photos:
// owner/manager/staff only — receptionist gets the restricted notice. GDPR
// export/delete: owner/manager only. RLS is the second line of defense.

const ALL_ROLES = ["owner", "manager", "receptionist", "staff"] as const
const PROFILE_ROLES = ["owner", "manager", "receptionist"] as const
const SENSITIVE_ROLES = ["owner", "manager", "staff"] as const
const GDPR_ROLES = ["owner", "manager"] as const

export type ClientListResult =
  | { ok: true; data: db.ClientListPage }
  | { ok: false; error: string }

export async function listClientsAction(input: unknown): Promise<ClientListResult> {
  const session = await requireRole([...ALL_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = clientListQuerySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: zodToActionError(parsed.error).error }

  const result = await db.listClients(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: result.data }
}

export async function getClientAction(clientId: string) {
  const session = await requireRole([...ALL_ROLES])
  if (!session.salon) return { ok: false as const, error: "Nu ai un salon activ." }
  const result = await db.getClient(session.salon.id, clientId)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const, data: result.data }
}

export async function getClientHistoryAction(clientId: string) {
  const session = await requireRole([...ALL_ROLES])
  if (!session.salon) return { ok: false as const, error: "Nu ai un salon activ." }
  const result = await db.getClientHistory(session.salon.id, clientId)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const, data: result.data }
}

export async function getLoyaltyLedgerAction(clientId: string) {
  const session = await requireRole([...ALL_ROLES])
  if (!session.salon) return { ok: false as const, error: "Nu ai un salon activ." }
  const result = await db.getLoyaltyLedger(session.salon.id, clientId)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const, data: result.data }
}

export async function getConsentsAction(clientId: string) {
  const session = await requireRole([...ALL_ROLES])
  if (!session.salon) return { ok: false as const, error: "Nu ai un salon activ." }
  const result = await db.getConsents(session.salon.id, clientId)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const, data: result.data }
}

// ─── Sensitive ───────────────────────────────────────────────────────────────

export async function getSensitiveAction(clientId: string) {
  const session = await requireRole([...ALL_ROLES])
  if (!session.salon) return { ok: false as const, error: "Nu ai un salon activ." }

  const canRead = session.role != null && (SENSITIVE_ROLES as readonly string[]).includes(session.role)
  const result = await db.getSensitive(session.salon.id, clientId, canRead)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const, data: result.data }
}

export async function saveSensitiveAction(input: unknown): Promise<ActionResult> {
  const session = await requireRole([...SENSITIVE_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = sensitiveSaveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.saveSensitive(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath(`/app/clienti/${parsed.data.clientId}`)
  return { ok: true }
}

// ─── Profile CRUD ────────────────────────────────────────────────────────────

export async function updateClientAction(clientId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...PROFILE_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = clientUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.updateClient(session.salon.id, clientId, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/app/clienti")
  revalidatePath(`/app/clienti/${clientId}`)
  return { ok: true, data: { id: clientId } }
}

export async function createClientAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...PROFILE_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = clientUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.createClient(session.salon.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/app/clienti")
  return { ok: true, data: result.data }
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function listPhotosAction(clientId: string) {
  const session = await requireRole([...SENSITIVE_ROLES])
  if (!session.salon) return { ok: false as const, error: "Nu ai un salon activ." }
  const result = await db.listPhotos(session.salon.id, clientId)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const, data: result.data }
}

/**
 * Upload receives the already-resized WebP file (client-side canvas resize to
 * max 1600px). The server re-validates MIME and size — the client-side step
 * is a convenience, never the security boundary.
 */
export async function uploadPhotoAction(clientId: string, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...SENSITIVE_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false, error: "Niciun fișier trimis." }

  const parsed = photoMetaSchema.safeParse({
    clientId,
    caption: formData.get("caption") ?? "",
    takenAt: formData.get("takenAt") || null,
  })
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.uploadPhoto(
    session.salon.id,
    parsed.data.clientId,
    file,
    parsed.data.caption,
    parsed.data.takenAt ?? null,
  )
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath(`/app/clienti/${clientId}`)
  return { ok: true, data: result.data }
}

export async function deletePhotoAction(clientId: string, photoId: string): Promise<ActionResult> {
  const session = await requireRole([...GDPR_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const result = await db.deletePhoto(session.salon.id, photoId)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath(`/app/clienti/${clientId}`)
  return { ok: true }
}

// ─── GDPR ────────────────────────────────────────────────────────────────────

export async function exportClientAction(clientId: string) {
  const session = await requireRole([...GDPR_ROLES])
  if (!session.salon) return { ok: false as const, error: "Nu ai un salon activ." }

  const result = await db.exportClientData(session.salon.id, clientId)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const, data: result.data }
}

export async function deleteClientAction(input: unknown): Promise<ActionResult | MfaRequired> {
  const session = await requireRole([...GDPR_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const supabase = await createSupabaseServerClient()
  if (await aal2Required(supabase)) return MFA_REQUIRED

  const parsed = clientDeleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.softDeleteClient(session.salon.id, parsed.data.clientId, parsed.data.confirmName)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/app/clienti")
  return { ok: true }
}

// ─── CSV import ──────────────────────────────────────────────────────────────

export async function importClientsAction(input: unknown): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const session = await requireRole([...PROFILE_ROLES])
  if (!session.salon) return { ok: false, error: "Nu ai un salon activ." }

  const parsed = importPayloadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, ...zodToActionError(parsed.error) }

  const result = await db.importClients(session.salon.id, parsed.data.rows)
  if (!result.ok) return { ok: false, error: result.error }
  revalidatePath("/app/clienti")
  return { ok: true, data: result.data }
}
