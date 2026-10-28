"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { importRowSchema, type ImportRow } from "@/lib/validation/clienti"
import { importClientsAction } from "@/app/app/clienti/actions"

// CSV import with a preview step: parse + validate in the browser, show the
// result table, then send only the valid rows to the server action (which
// re-validates and skips duplicates by phone).

const EXPECTED_COLUMNS = ["prenume", "nume", "telefon", "email", "data_nasterii", "note"] as const

/** Minimal CSV parser: handles quoted fields, commas and newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field); field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some((f) => f.trim() !== "")) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.some((f) => f.trim() !== "")) rows.push(row)
  return rows
}

interface PreviewRow {
  raw: Record<string, string>
  parsed: ImportRow | null
  error: string | null
}

export function ImportClientsDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported: () => void
}) {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  function reset() {
    setPreview(null)
    setFileName(null)
    setError(null)
    setResult(null)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    setResult(null)
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setError("Fișierul este gol.")
        return
      }
      const header = rows[0].map((h) => h.trim().toLowerCase())
      const missing = EXPECTED_COLUMNS.filter((c) => !header.includes(c))
      if (missing.length > 0) {
        setError(`Coloane lipsă: ${missing.join(", ")}. Coloane așteptate: ${EXPECTED_COLUMNS.join(", ")}.`)
        return
      }
      const parsed: PreviewRow[] = rows.slice(1).map((cells) => {
        const raw: Record<string, string> = {}
        header.forEach((h, i) => { raw[h] = (cells[i] ?? "").trim() })
        const res = importRowSchema.safeParse({
          prenume: raw.prenume,
          nume: raw.nume,
          telefon: raw.telefon,
          email: raw.email || null,
          dataNasterii: raw.data_nasterii || null,
          note: raw.note ?? "",
        })
        return {
          raw,
          parsed: res.success ? res.data : null,
          error: res.success ? null : res.error.issues[0]?.message ?? "Rând invalid.",
        }
      })
      setPreview(parsed)
    }
    reader.readAsText(file, "utf-8")
  }

  async function handleImport() {
    if (!preview) return
    const valid = preview.filter((r) => r.parsed).map((r) => r.parsed)
    if (valid.length === 0) return
    setPending(true)
    setError(null)
    const res = await importClientsAction({ rows: valid })
    setPending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setResult(res.data)
    onImported()
  }

  const validCount = preview?.filter((r) => r.parsed).length ?? 0
  const invalidCount = (preview?.length ?? 0) - validCount

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) { onClose(); reset() }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importă clienți din CSV</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Import finalizat: <strong>{result.imported}</strong> importați,{" "}
              <strong>{result.skipped}</strong> omiși (duplicate după telefon).
            </p>
            <div className="flex justify-end">
              <Button onClick={() => { onClose(); reset() }}>Gata</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="csv-file">Fișier CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">
                Coloane: {EXPECTED_COLUMNS.join(", ")}. Telefoanele sunt normalizate la +40…
              </p>
            </div>

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            {preview && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>{fileName}</strong> — {validCount} rânduri valide, {invalidCount} cu erori.
                </p>
                <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Prenume</th>
                        <th className="p-2 text-left">Nume</th>
                        <th className="p-2 text-left">Telefon</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Stare</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.map((r, i) => (
                        <tr key={i} className={r.error ? "text-destructive" : ""}>
                          <td className="p-2">{r.raw.prenume}</td>
                          <td className="p-2">{r.raw.nume}</td>
                          <td className="p-2">{r.parsed?.telefon ?? r.raw.telefon}</td>
                          <td className="p-2">{r.raw.email}</td>
                          <td className="p-2">{r.error ?? "OK"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={reset} disabled={pending}>Înapoi</Button>
                  <Button onClick={handleImport} disabled={pending || validCount === 0}>
                    {pending ? "Se importă…" : `Importă ${validCount} clienți`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
