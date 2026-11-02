import "server-only" // eslint-disable-line

import { requireRole } from "@/lib/auth/session"
import { exportSensitiveCsv } from "@/lib/data/export"
import { writeAudit } from "@/lib/audit"

// GET /api/export/sensitive — decrypted health data CSV (owner only). The UI
// gates this behind a second confirmation dialog; the endpoint itself is
// owner-only and audit-logged.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await requireRole(["owner"])
  if (!session.salon) {
    return new Response("Nu ai un salon activ.", { status: 400 })
  }

  const result = await exportSensitiveCsv(session.salon.id)
  if (!result.ok) {
    return new Response(result.error, { status: 500 })
  }

  await writeAudit(session.salon.id, "data_export_sensitive", "salon", session.salon.id, {
    file: result.data.name,
  })

  const slug = session.salon.slug ?? "salon"
  return new Response(result.data.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asesor-date-sensibile-${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
