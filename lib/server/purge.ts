import "server-only"

// Storage cleanup for hard-deleted salons. SQL cannot delete storage objects
// reliably (they live in the storage schema's bucket filesystem), so the P12
// cron calls purgeDeletedSalons() here: it removes each expired salon's
// objects from the private/public buckets via the service-role client, then
// lets purge_deleted_salons() (scripts/003) hard-delete the rows (children
// cascade).

import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin"

const BUCKETS = ["client-photos", "receipts", "salon-public"] as const

/** Recursively lists and removes every object under `{salonId}/` in a bucket. */
async function purgeBucketPrefix(bucket: string, salonId: string): Promise<number> {
  const admin = createSupabaseAdminClient()
  let removed = 0

  const walk = async (prefix: string): Promise<void> => {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    })
    if (error) {
      console.error(`[v0] purge list ${bucket}/${prefix}:`, error.message)
      return
    }
    const files: string[] = []
    const folders: string[] = []
    for (const entry of data ?? []) {
      const path = `${prefix}/${entry.name}`
      if (entry.id === null) folders.push(path)
      else files.push(path)
    }
    if (files.length > 0) {
      const { error: rmError } = await admin.storage.from(bucket).remove(files)
      if (rmError) {
        console.error(`[v0] purge remove ${bucket}/${prefix}:`, rmError.message)
      } else {
        removed += files.length
      }
    }
    for (const folder of folders) await walk(folder)
  }

  await walk(salonId)
  return removed
}

export async function purgeSalonStorage(salonId: string): Promise<void> {
  for (const bucket of BUCKETS) {
    const removed = await purgeBucketPrefix(bucket, salonId)
    if (removed > 0) {
      console.log(`[v0] purged ${removed} objects from ${bucket}/${salonId}/`)
    }
  }
}

/**
 * Full purge pass: storage objects first, then the SQL hard delete. Returns
 * the number of salons purged. Called by /api/cron/purge-deleted (P12 cron).
 */
export async function purgeDeletedSalons(): Promise<{ ok: boolean; purged: number; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, purged: 0, error: "Service role nu este configurat." }
  }
  const admin = createSupabaseAdminClient()

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: expired, error } = await admin
    .from("salons")
    .select("id")
    .lt("deleted_at", cutoff)
  if (error) {
    console.error("[v0] purgeDeletedSalons select:", error.message)
    return { ok: false, purged: 0, error: error.message }
  }

  for (const salon of expired ?? []) {
    await purgeSalonStorage(salon.id)
  }

  const { error: rpcError } = await admin.rpc("purge_deleted_salons")
  if (rpcError) {
    console.error("[v0] purge_deleted_salons rpc:", rpcError.message)
    return { ok: false, purged: 0, error: rpcError.message }
  }

  return { ok: true, purged: expired?.length ?? 0 }
}
