import "server-only"

import { randomUUID } from "node:crypto"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { dbError, type DataResult } from "@/lib/data/programari"
import { encryptField, decryptField } from "@/lib/crypto"
import { writeAudit } from "@/lib/audit"
import {
  mapClientListItem,
  mapClientDetail,
  type ClientListItem,
  type ClientDetail,
  type ClientHistoryItem,
  type LoyaltyEntry,
  type ConsentRecord,
  type ClientPhoto,
  type SensitiveData,
} from "@/lib/mappers/clienti"
import type {
  ClientListQuery,
  ClientUpdateInput,
  SensitiveSaveInput,
  ImportRow,
} from "@/lib/validation/clienti"
import { PAGE_SIZE } from "@/lib/validation/clienti"

// Data layer for Clienti. All queries run as the signed-in user (RLS applies).
// Sensitive fields are encrypted at rest (lib/crypto.ts) and decrypted only
// here, on the server, for owner/manager/staff — every decrypt writes an
// audit_log entry.

// ─── List ────────────────────────────────────────────────────────────────────

export interface ClientListPage {
  items: ClientListItem[]
  total: number
  page: number
  pageSize: number
}

export async function listClients(
  salonId: string,
  query: ClientListQuery,
): Promise<DataResult<ClientListPage>> {
  const supabase = await createSupabaseServerClient()

  let req = supabase
    .from("clients")
    .select("*")
    .eq("salon_id", salonId)
    .is("deleted_at", null)

  if (query.search) {
    req = req.or(
      `first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,phone.ilike.%${query.search}%`,
    )
  }
  if (query.tag !== "toate") req = req.contains("tags", [query.tag])
  if (query.source !== "toate") req = req.eq("source", query.source)

  const { data: rows, error } = await req.order("first_name", { ascending: true })
  if (error) return dbError("listClients", error)

  // Totals come from the client_stats view; the allergy flag from
  // client_safety_flags. Both fetched per salon and merged in memory — salon
  // client counts are small and this avoids fragile view embeds.
  const [statsRes, safetyRes] = await Promise.all([
    supabase.from("client_stats").select("client_id, total_visits, total_spent, last_visit_at").eq("salon_id", salonId),
    supabase.from("client_safety_flags").select("client_id, has_allergies").eq("salon_id", salonId),
  ])
  if (statsRes.error) return dbError("listClients.stats", statsRes.error)
  if (safetyRes.error) return dbError("listClients.safety", safetyRes.error)

  const statsById = new Map(statsRes.data.map((s) => [s.client_id, s]))
  const safetyById = new Map(safetyRes.data.map((s) => [s.client_id, s]))

  let items = (rows ?? []).map((c) =>
    mapClientListItem(
      c,
      statsById.get(c.id) ?? null,
      safetyById.get(c.id) ?? null,
    ),
  )

  // Last-visit filter (days since last finalized visit).
  if (query.lastVisit !== "toate") {
    const cutoff = Date.now() - Number(query.lastVisit) * 86400000
    items = items.filter((c) => c.lastVisitAt != null && Date.parse(c.lastVisitAt) >= cutoff)
  }

  switch (query.sort) {
    case "ultima_vizita":
      items.sort((a, b) => (b.lastVisitAt ?? "").localeCompare(a.lastVisitAt ?? ""))
      break
    case "vizite":
      items.sort((a, b) => b.totalVisits - a.totalVisits)
      break
    case "total_cheltuit":
      items.sort((a, b) => b.totalSpent - a.totalSpent)
      break
    default:
      items.sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "ro"),
      )
  }

  const total = items.length
  const start = (query.page - 1) * PAGE_SIZE
  return {
    ok: true,
    data: { items: items.slice(start, start + PAGE_SIZE), total, page: query.page, pageSize: PAGE_SIZE },
  }
}

// ─── Detail ──────────────────────────────────────────────────────────────────

export async function getClient(
  salonId: string,
  clientId: string,
): Promise<DataResult<ClientDetail>> {
  const supabase = await createSupabaseServerClient()

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("salon_id", salonId)
    .is("deleted_at", null)
    .maybeSingle()
  if (error) return dbError("getClient", error)
  if (!client) return { ok: false, error: "Clienta nu a fost găsită." }

  const [statsRes, safetyRes, staffRes] = await Promise.all([
    supabase.from("client_stats").select("total_visits, total_spent, last_visit_at").eq("client_id", clientId).maybeSingle(),
    supabase.from("client_safety_flags").select("has_allergies").eq("client_id", clientId).maybeSingle(),
    client.preferred_staff_id
      ? supabase.from("staff").select("first_name, last_name").eq("id", client.preferred_staff_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (statsRes.error) return dbError("getClient.stats", statsRes.error)
  if (safetyRes.error) return dbError("getClient.safety", safetyRes.error)

  const staffName = staffRes.data
    ? `${(staffRes.data as { first_name: string; last_name: string }).first_name} ${(staffRes.data as { first_name: string; last_name: string }).last_name}`.trim()
    : null

  return {
    ok: true,
    data: mapClientDetail(client, statsRes.data, safetyRes.data, staffName),
  }
}

export async function getClientHistory(
  salonId: string,
  clientId: string,
): Promise<DataResult<ClientHistoryItem[]>> {
  const supabase = await createSupabaseServerClient()

  const { data: appts, error } = await supabase
    .from("appointments")
    .select("id, starts_at, status, total_price, discount, notes, staff_id")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false })
    .limit(100)
  if (error) return dbError("getClientHistory", error)
  if (!appts || appts.length === 0) return { ok: true, data: [] }

  const ids = appts.map((a) => a.id)
  const [servicesRes, staffRes] = await Promise.all([
    supabase
      .from("appointment_services")
      .select("appointment_id, price, services(name)")
      .in("appointment_id", ids),
    supabase.from("staff").select("id, first_name, last_name").eq("salon_id", salonId),
  ])
  if (servicesRes.error) return dbError("getClientHistory.services", servicesRes.error)

  const staffById = new Map((staffRes.data ?? []).map((s) => [s.id, s]))
  const servicesByApt = new Map<string, { name: string; price: number }[]>()
  for (const row of servicesRes.data ?? []) {
    const list = servicesByApt.get(row.appointment_id) ?? []
    const svc = row.services as unknown as { name: string } | null
    if (svc) list.push({ name: svc.name, price: Number(row.price) })
    servicesByApt.set(row.appointment_id, list)
  }

  return {
    ok: true,
    data: appts.map((a) => {
      const staff = staffById.get(a.staff_id ?? "")
      return {
        id: a.id,
        date: a.starts_at,
        status: a.status,
        services: servicesByApt.get(a.id) ?? [],
        staffName: staff ? `${staff.first_name} ${staff.last_name}`.trim() : null,
        total: Number(a.total_price) - Number(a.discount),
        notes: a.notes,
      }
    }),
  }
}

export async function getLoyaltyLedger(
  salonId: string,
  clientId: string,
): Promise<DataResult<LoyaltyEntry[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("loyalty_ledger")
    .select("id, type, points, note, created_at")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) return dbError("getLoyaltyLedger", error)
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id,
      type: r.type as LoyaltyEntry["type"],
      points: r.points,
      note: r.note,
      createdAt: r.created_at,
    })),
  }
}

export async function getConsents(
  salonId: string,
  clientId: string,
): Promise<DataResult<ConsentRecord[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("consents")
    .select("id, kind, granted, source, created_at")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
  if (error) return dbError("getConsents", error)
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind as ConsentRecord["kind"],
      granted: r.granted,
      source: r.source,
      createdAt: r.created_at,
    })),
  }
}

// ─── Sensitive (protected health data) ───────────────────────────────────────

export type SensitiveReadResult =
  | { ok: true; data: SensitiveData; restricted: false }
  | { ok: true; data: null; restricted: true }

/**
 * Decrypts client_sensitive for owner/manager/staff. Receptionist gets
 * `restricted: true` — the UI shows "Informații vizibile doar pentru
 * specialiști". Every successful decrypt writes audit_log 'read_sensitive'.
 */
export async function getSensitive(
  salonId: string,
  clientId: string,
  canRead: boolean,
): Promise<DataResult<SensitiveReadResult>> {
  const supabase = await createSupabaseServerClient()

  if (!canRead) return { ok: true, data: { ok: true, data: null, restricted: true } }

  const { data, error } = await supabase
    .from("client_sensitive")
    .select("allergies_enc, color_formulas_enc, health_consent_at, health_consent_source")
    .eq("client_id", clientId)
    .eq("salon_id", salonId)
    .maybeSingle()
  if (error) return dbError("getSensitive", error)

  if (!data) {
    return {
      ok: true,
      data: {
        ok: true,
        data: { allergies: null, colorFormulas: null, healthConsentAt: null, healthConsentSource: null },
        restricted: false,
      },
    }
  }

  let allergies: string | null = null
  let colorFormulas: string | null = null
  try {
    allergies = data.allergies_enc ? decryptField(data.allergies_enc) : null
    colorFormulas = data.color_formulas_enc ? decryptField(data.color_formulas_enc) : null
  } catch (err) {
    return {
      ok: false,
      error: `Datele protejate nu au putut fi decriptate (${err instanceof Error ? err.message : "eroare"}).`,
    }
  }

  await writeAudit(salonId, "read_sensitive", "client", clientId, {
    fields: [
      ...(allergies != null ? ["allergies"] : []),
      ...(colorFormulas != null ? ["color_formulas"] : []),
    ],
  })

  return {
    ok: true,
    data: {
      ok: true,
      data: {
        allergies,
        colorFormulas,
        healthConsentAt: data.health_consent_at,
        healthConsentSource: data.health_consent_source,
      },
      restricted: false,
    },
  }
}

export async function saveSensitive(
  salonId: string,
  input: SensitiveSaveInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  // Consent is recorded first (consents row), then the encrypted payload.
  const { error: consentError } = await supabase.from("consents").insert({
    salon_id: salonId,
    client_id: input.clientId,
    kind: "health_data",
    granted: true,
    source: input.consentSource,
    text_version: "Clienta și-a dat acordul ca aceste informații să fie păstrate pentru siguranța serviciilor",
  })
  if (consentError) return dbError("saveSensitive.consent", consentError)

  // Empty text → null ciphertext, so the has_allergies flag stays accurate.
  const payload = {
    salon_id: salonId,
    client_id: input.clientId,
    allergies_enc: input.allergies ? encryptField(input.allergies) : null,
    color_formulas_enc: input.colorFormulas ? encryptField(input.colorFormulas) : null,
    health_consent_at: now,
    health_consent_source: input.consentSource,
    updated_at: now,
  }

  const { error } = await supabase
    .from("client_sensitive")
    .upsert(payload, { onConflict: "client_id" })
  if (error) return dbError("saveSensitive", error)

  await writeAudit(salonId, "update_sensitive", "client", input.clientId, {
    fields: [
      ...(input.allergies ? ["allergies"] : []),
      ...(input.colorFormulas ? ["color_formulas"] : []),
    ],
    consent_source: input.consentSource,
  })
  return { ok: true }
}

// ─── Profile CRUD ────────────────────────────────────────────────────────────

export async function updateClient(
  salonId: string,
  clientId: string,
  input: ClientUpdateInput,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("clients")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      whatsapp_phone: input.whatsappPhone,
      email: input.email,
      birth_date: input.birthDate,
      sex: input.sex,
      source: input.source,
      tags: input.tags,
      preferred_staff_id: input.preferredStaffId,
      communication_pref: input.communicationPref,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("salon_id", salonId)
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, error: "Există deja o clientă cu acest număr de telefon." }
    }
    return dbError("updateClient", error)
  }
  return { ok: true }
}

export async function createClient(
  salonId: string,
  input: ClientUpdateInput,
): Promise<DataResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("clients")
    .insert({
      salon_id: salonId,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      whatsapp_phone: input.whatsappPhone,
      email: input.email,
      birth_date: input.birthDate,
      sex: input.sex,
      source: input.source,
      tags: input.tags,
      preferred_staff_id: input.preferredStaffId,
      communication_pref: input.communicationPref,
      notes: input.notes,
    })
    .select("id")
    .single()
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, error: "Există deja o clientă cu acest număr de telefon." }
    }
    return dbError("createClient", error)
  }
  return { ok: true, data: { id: (data as { id: string }).id } }
}

// ─── Photos ──────────────────────────────────────────────────────────────────

const SIGNED_URL_TTL = 600 // 10 minutes

export async function listPhotos(
  salonId: string,
  clientId: string,
): Promise<DataResult<ClientPhoto[]>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("client_photos")
    .select("id, storage_path, caption, taken_at, created_at")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
  if (error) return dbError("listPhotos", error)

  const photos: ClientPhoto[] = (data ?? []).map((r) => ({
    id: r.id,
    storagePath: r.storage_path,
    caption: r.caption,
    takenAt: r.taken_at,
    createdAt: r.created_at,
    url: null,
  }))

  // Signed URLs are short-lived; generate them here, never store them.
  await Promise.all(
    photos.map(async (p) => {
      const { data: signed } = await supabase.storage
        .from("client-photos")
        .createSignedUrl(p.storagePath, SIGNED_URL_TTL)
      p.url = signed?.signedUrl ?? null
    }),
  )
  return { ok: true, data: photos }
}

export async function uploadPhoto(
  salonId: string,
  clientId: string,
  file: File,
  caption: string,
  takenAt: string | null,
): Promise<DataResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient()

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"]
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Format nesuportat. Acceptăm JPEG, PNG, WebP sau HEIC." }
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Fișierul depășește 8 MB." }
  }

  const path = `${salonId}/${clientId}/${randomUUID()}.webp`
  const body = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from("client-photos")
    .upload(path, body, { contentType: file.type, upsert: false })
  if (uploadError) return dbError("uploadPhoto.storage", uploadError)

  const { data, error } = await supabase
    .from("client_photos")
    .insert({
      salon_id: salonId,
      client_id: clientId,
      storage_path: path,
      caption: caption || null,
      taken_at: takenAt,
    })
    .select("id")
    .single()
  if (error) {
    // Row insert failed — clean up the orphaned object.
    await supabase.storage.from("client-photos").remove([path])
    return dbError("uploadPhoto", error)
  }
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function deletePhoto(
  salonId: string,
  photoId: string,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()
  const { data: row, error: fetchError } = await supabase
    .from("client_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("salon_id", salonId)
    .maybeSingle()
  if (fetchError) return dbError("deletePhoto.fetch", fetchError)
  if (!row) return { ok: false, error: "Fotografia nu a fost găsită." }

  const { error: removeError } = await supabase.storage
    .from("client-photos")
    .remove([row.storage_path])
  if (removeError) return dbError("deletePhoto.storage", removeError)

  const { error } = await supabase.from("client_photos").delete().eq("id", photoId)
  if (error) return dbError("deletePhoto", error)
  return { ok: true }
}

// ─── GDPR: export + soft delete ──────────────────────────────────────────────

export async function exportClientData(
  salonId: string,
  clientId: string,
): Promise<DataResult<Record<string, unknown>>> {
  const supabase = await createSupabaseServerClient()

  const [clientRes, historyRes, loyaltyRes, consentsRes, transactionsRes, sensitiveRes] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).eq("salon_id", salonId).maybeSingle(),
      getClientHistory(salonId, clientId),
      getLoyaltyLedger(salonId, clientId),
      getConsents(salonId, clientId),
      supabase.from("transactions").select("*").eq("salon_id", salonId).eq("client_id", clientId),
      supabase
        .from("client_sensitive")
        .select("allergies_enc, color_formulas_enc, health_consent_at, health_consent_source")
        .eq("client_id", clientId)
        .maybeSingle(),
    ])

  if (clientRes.error) return dbError("exportClientData", clientRes.error)
  if (!clientRes.data) return { ok: false, error: "Clienta nu a fost găsită." }
  if (!historyRes.ok) return { ok: false, error: historyRes.error }
  if (!loyaltyRes.ok) return { ok: false, error: loyaltyRes.error }
  if (!consentsRes.ok) return { ok: false, error: consentsRes.error }
  if (transactionsRes.error) return dbError("exportClientData.transactions", transactionsRes.error)

  // Export includes the DECRYPTED sensitive fields (GDPR right to data
  // portability) — owner/manager only, enforced by the action layer.
  let sensitive: Record<string, unknown> = null
  const s = sensitiveRes.data
  if (s) {
    try {
      sensitive = {
        alergii: s.allergies_enc ? decryptField(s.allergies_enc) : null,
        formule_coloristice: s.color_formulas_enc ? decryptField(s.color_formulas_enc) : null,
        health_consent_at: s.health_consent_at,
        health_consent_source: s.health_consent_source,
      }
    } catch (err) {
      return {
        ok: false,
        error: `Decriptarea a eșuat (${err instanceof Error ? err.message : "eroare"}).`,
      }
    }
  }

  await writeAudit(salonId, "export_client", "client", clientId)

  return {
    ok: true,
    data: {
      exported_at: new Date().toISOString(),
      profil: clientRes.data,
      programari: historyRes.ok ? historyRes.data : [],
      tranzactii: transactionsRes.data ?? [],
      loialitate: loyaltyRes.ok ? loyaltyRes.data : [],
      consimtaminte: consentsRes.ok ? consentsRes.data : [],
      date_protejate: sensitive,
    },
  }
}

export async function softDeleteClient(
  salonId: string,
  clientId: string,
  confirmName: string,
): Promise<DataResult> {
  const supabase = await createSupabaseServerClient()

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .eq("id", clientId)
    .eq("salon_id", salonId)
    .maybeSingle()
  if (fetchError) return dbError("softDeleteClient.fetch", fetchError)
  if (!client) return { ok: false, error: "Clienta nu a fost găsită." }

  const expected = `${client.first_name} ${client.last_name}`.trim().toLowerCase()
  if (confirmName.trim().toLowerCase() !== expected) {
    return { ok: false, error: "Numele introdus nu corespunde." }
  }

  // Photos: remove objects then rows.
  const { data: photos } = await supabase
    .from("client_photos")
    .select("storage_path")
    .eq("client_id", clientId)
  if (photos && photos.length > 0) {
    await supabase.storage.from("client-photos").remove(photos.map((p) => p.storage_path))
    await supabase.from("client_photos").delete().eq("client_id", clientId)
  }

  // Sensitive data is deleted outright.
  await supabase.from("client_sensitive").delete().eq("client_id", clientId)

  // Transactions are kept for accounting, detached from the client.
  await supabase.from("transactions").update({ client_id: null }).eq("client_id", clientId)

  // Anonymize immediately; the row stays for referential integrity.
  const suffix = randomUUID().replace(/\D/g, "").slice(0, 9) || "000000000"
  const { error } = await supabase
    .from("clients")
    .update({
      first_name: "Ștearsă",
      last_name: "Client",
      phone: `+407${suffix.padStart(8, "0")}`.slice(0, 12),
      whatsapp_phone: null,
      email: null,
      birth_date: null,
      notes: "",
      tags: [],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
  if (error) return dbError("softDeleteClient", error)

  await writeAudit(salonId, "delete_client", "client", clientId, { anonymized: true })
  return { ok: true }
}

// ─── CSV import ──────────────────────────────────────────────────────────────

export interface ImportSummary {
  imported: number
  skipped: number
}

export async function importClients(
  salonId: string,
  rows: ImportRow[],
): Promise<DataResult<ImportSummary>> {
  const supabase = await createSupabaseServerClient()

  // Skip duplicates by phone (unique per salon).
  const phones = [...new Set(rows.map((r) => r.telefon))]
  const { data: existing, error: existingError } = await supabase
    .from("clients")
    .select("phone")
    .eq("salon_id", salonId)
    .in("phone", phones)
  if (existingError) return dbError("importClients.existing", existingError)
  const existingPhones = new Set((existing ?? []).map((r) => r.phone))

  const toInsert = rows
    .filter((r) => !existingPhones.has(r.telefon))
    .map((r) => ({
      salon_id: salonId,
      first_name: r.prenume,
      last_name: r.nume,
      phone: r.telefon,
      email: r.email,
      birth_date: r.dataNasterii,
      notes: r.note,
    }))

  if (toInsert.length > 0) {
    const { error } = await supabase.from("clients").insert(toInsert)
    if (error) return dbError("importClients", error)
  }

  return {
    ok: true,
    data: { imported: toInsert.length, skipped: rows.length - toInsert.length },
  }
}
