import "server-only" // eslint-disable-line

import { purgeDeletedSalons } from "@/lib/server/purge"

// Called by the P12 cron (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
// Hard-deletes salons soft-deleted more than 30 days ago, after removing their
// storage objects (SQL cannot delete storage files).
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 })
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[v0] purge-deleted cron: CRON_SECRET is not set")
    return new Response("Unauthorized", { status: 401 })
  }

  const result = await purgeDeletedSalons()
  if (!result.ok) {
    return new Response(result.error ?? "Purge failed", { status: 500 })
  }
  return Response.json({ ok: true, purged: result.purged })
}
