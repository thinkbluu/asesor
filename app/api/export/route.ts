import "server-only" // eslint-disable-line

import archiver from "archiver"
import { Readable } from "node:stream"

import { requireRole } from "@/lib/auth/session"
import { exportSalonCsvs } from "@/lib/data/export"
import { writeAudit } from "@/lib/audit"

// GET /api/export — ZIP of the salon's CSVs (owner only). Streams via archiver
// so large salons don't need the whole archive in memory at once.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await requireRole(["owner"])
  if (!session.salon) {
    return new Response("Nu ai un salon activ.", { status: 400 })
  }

  const result = await exportSalonCsvs(session.salon.id)
  if (!result.ok) {
    return new Response(result.error, { status: 500 })
  }

  await writeAudit(session.salon.id, "data_export", "salon", session.salon.id, {
    files: result.data.map((f) => f.name),
  })

  const archive = archiver("zip", { zlib: { level: 9 } })
  for (const file of result.data) {
    archive.append(file.csv, { name: file.name })
  }
  archive.finalize()

  const stream = Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>
  const slug = session.salon.slug ?? "salon"
  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="asesor-export-${slug}.zip"`,
      "Cache-Control": "no-store",
    },
  })
}
