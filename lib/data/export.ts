import "server-only"

// Salon data export (GDPR portability + backup). Two flavours:
//  - exportSalonCsvs(): ZIP payload — one CSV per table, WITHOUT sensitive
//    (health) fields.
//  - exportSensitiveCsv(): single decrypted CSV of client_sensitive, served
//    separately behind a second confirmation in the UI.
//
// CSV format matches the P8 financiar export: semicolon separator, UTF-8 BOM,
// dd.MM.yyyy dates, comma decimals for money.

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { decryptField } from "@/lib/crypto"

// DataResult/dbError are per-module privates in this codebase (not exported
// from echipa.ts) — defined locally here.
type DataResult<T> = (T extends void ? { ok: true } : { ok: true; data: T }) | { ok: false; error: string }

function dbError(scope: string, error: { message: string }): { ok: false; error: string } {
  console.error(`[v0] ${scope}:`, error.message)
  return { ok: false, error: "Eroare de bază de date. Încearcă din nou." }
}

export type ExportCsv = { name: string; csv: string }

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
const lei = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", ","))
const roDate = (iso: string | null) => {
  if (!iso) return ""
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}.${m}.${y}`
}
const roDateTime = (iso: string | null) => {
  if (!iso) return ""
  return `${roDate(iso)} ${iso.slice(11, 16)}`
}

function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header.map(esc).join(";")]
  for (const row of rows) lines.push(row.map(esc).join(";"))
  // \uFEFF = UTF-8 BOM so Excel renders diacritics correctly.
  return "\uFEFF" + lines.join("\r\n")
}

type Row = Record<string, unknown>

async function fetchAll(table: string, salonId: string, columns: string): Promise<Row[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from(table).select(columns).eq("salon_id", salonId)
  if (error) throw dbError(`export.${table}`, error)
  return (data ?? []) as Row[]
}

const pick = (row: Row, keys: string[]) => keys.map((k) => row[k])

export async function exportSalonCsvs(salonId: string): Promise<DataResult<ExportCsv[]>> {
  try {
    const [clients, appointments, services, staff, transactions, expenses, products, movements] =
      await Promise.all([
        fetchAll("clients", salonId, "*"),
        fetchAll("appointments", salonId, "*"),
        fetchAll("services", salonId, "*"),
        fetchAll("staff", salonId, "*"),
        fetchAll("transactions", salonId, "*"),
        fetchAll("expenses", salonId, "*"),
        fetchAll("products", salonId, "*"),
        fetchAll("stock_movements", salonId, "*"),
      ])

    const csvs: ExportCsv[] = [
      {
        name: "clienti.csv",
        csv: toCsv(
          ["ID", "Prenume", "Nume", "Telefon", "Telefon WhatsApp", "Email", "Data nașterii", "Sex", "Sursă", "Etichete", "Specialist preferat", "Preferință comunicare", "Note", "Consimțământ marketing", "Data consimțământ marketing", "Sold (RON)", "Puncte loialitate", "Puncte totale", "Șters la", "Creat la"],
          clients.map((c) =>
            pick(c, ["id", "first_name", "last_name", "phone", "whatsapp_phone", "email", "birth_date", "sex", "source", "tags", "preferred_staff_id", "communication_pref", "notes", "marketing_consent", "marketing_consent_at", "balance_due", "loyalty_points", "lifetime_points", "deleted_at", "created_at"]).map((v, i) =>
              i === 6 ? roDate(v as string) : i === 14 || i === 19 ? roDateTime(v as string) : i === 15 ? lei(v as number) : v,
            ),
          ),
        ),
      },
      {
        name: "programari.csv",
        csv: toCsv(
          ["ID", "Client ID", "Specialist ID", "Început", "Sfârșit", "Status", "Sursă", "Note", "Preț total (RON)", "Reducere", "Tip reducere", "Motiv anulare", "Creat la"],
          appointments.map((a) =>
            pick(a, ["id", "client_id", "staff_id", "starts_at", "ends_at", "status", "source", "notes", "total_price", "discount", "discount_type", "cancel_reason", "created_at"]).map((v, i) =>
              i === 3 || i === 4 || i === 12 ? roDateTime(v as string) : i === 8 || i === 9 ? lei(v as number) : v,
            ),
          ),
        ),
      },
      {
        name: "servicii.csv",
        csv: toCsv(
          ["ID", "Categorie ID", "Nume", "Descriere", "Durată (min)", "Buffer (min)", "Preț (RON)", "Preț de la", "Rezervabil online", "Activ", "Ordine"],
          services.map((s) =>
            pick(s, ["id", "category_id", "name", "description", "duration_min", "buffer_min", "price", "price_from", "online_bookable", "active", "sort_order"]).map((v, i) =>
              i === 6 ? lei(v as number) : v,
            ),
          ),
        ),
      },
      {
        name: "echipa.csv",
        csv: toCsv(
          ["ID", "Prenume", "Nume", "Rol", "Telefon", "Email", "Status", "Angajat la", "Tip comision", "Rată comision", "Culoare", "Note", "Șters la"],
          staff.map((s) =>
            pick(s, ["id", "first_name", "last_name", "role_title", "phone", "email", "status", "hired_at", "commission_type", "commission_rate", "color", "notes", "deleted_at"]).map((v, i) =>
              i === 7 ? roDate(v as string) : v,
            ),
          ),
        ),
      },
      {
        name: "tranzactii.csv",
        csv: toCsv(
          ["ID", "Programare ID", "Client ID", "Specialist ID", "Suma (RON)", "Bacsis (RON)", "Reducere (RON)", "Metodă", "Status", "Note", "Plătit la", "Creat la"],
          transactions.map((t) =>
            pick(t, ["id", "appointment_id", "client_id", "staff_id", "amount", "tip", "discount", "payment_method", "status", "notes", "paid_at", "created_at"]).map((v, i) =>
              i === 4 || i === 5 || i === 6 ? lei(v as number) : i === 10 || i === 11 ? roDateTime(v as string) : v,
            ),
          ),
        ),
      },
      {
        name: "cheltuieli.csv",
        csv: toCsv(
          ["ID", "Data", "Categorie", "Descriere", "Suma (RON)", "Frecvență", "Șablon ID", "Chitanță", "Note", "Creat la"],
          expenses.map((e) =>
            pick(e, ["id", "spent_on", "category", "description", "amount", "frequency", "parent_id", "receipt_path", "notes", "created_at"]).map((v, i) =>
              i === 1 || i === 9 ? roDate(v as string) : i === 4 ? lei(v as number) : v,
            ),
          ),
        ),
      },
      {
        name: "produse.csv",
        csv: toCsv(
          ["ID", "Nume", "Marcă", "Categorie", "SKU", "Unitate", "Stoc", "Stoc minim", "Preț achiziție (RON)", "Preț vânzare (RON)", "Furnizor", "Telefon furnizor", "Email furnizor", "Note", "Activ"],
          products.map((p) =>
            pick(p, ["id", "name", "brand", "category", "sku", "unit", "stock", "min_stock", "cost_price", "retail_price", "supplier_name", "supplier_phone", "supplier_email", "notes", "active"]).map((v, i) =>
              i === 8 || i === 9 ? lei(v as number) : v,
            ),
          ),
        ),
      },
      {
        name: "miscari_stoc.csv",
        csv: toCsv(
          ["ID", "Produs ID", "Tip", "Cantitate", "Notă", "Număr factură", "Programare ID", "Creat la"],
          movements.map((m) =>
            pick(m, ["id", "product_id", "type", "quantity", "note", "invoice_number", "appointment_id", "created_at"]).map((v, i) =>
              i === 7 ? roDateTime(v as string) : v,
            ),
          ),
        ),
      },
    ]

    return { ok: true, data: csvs }
  } catch (err) {
    if (err && typeof err === "object" && "ok" in err) return err as DataResult<never>
    console.error("[v0] exportSalonCsvs:", err instanceof Error ? err.message : err)
    return { ok: false, error: "Exportul a eșuat. Încearcă din nou." }
  }
}

/**
 * Decrypted sensitive (health) data as a single CSV. Owner-only; the caller
 * must audit-log the export.
 */
export async function exportSensitiveCsv(salonId: string): Promise<DataResult<ExportCsv>> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("client_sensitive")
      .select("client_id, allergies_enc, color_formulas_enc, health_consent_at, health_consent_source")
      .eq("salon_id", salonId)
    if (error) return dbError("export.client_sensitive", error)

    const ids = [...new Set((data ?? []).map((r) => r.client_id))]
    const names = new Map<string, string>()
    if (ids.length > 0) {
      const { data: clients, error: cErr } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .in("id", ids)
      if (cErr) return dbError("export.sensitive.clients", cErr)
      for (const c of clients ?? []) names.set(c.id, `${c.first_name} ${c.last_name}`.trim())
    }

    const rows = (data ?? []).map((r) => {
      let allergies = ""
      let formulas = ""
      try {
        allergies = r.allergies_enc ? decryptField(r.allergies_enc) : ""
        formulas = r.color_formulas_enc ? decryptField(r.color_formulas_enc) : ""
      } catch (err) {
        console.error("[v0] exportSensitiveCsv decrypt failed:", err instanceof Error ? err.message : err)
        return { ok: false as const, error: "Decriptarea datelor a eșuat. Verifică FIELD_ENCRYPTION_KEY." }
      }
      return {
        ok: true as const,
        row: [
          r.client_id,
          names.get(r.client_id) ?? "",
          allergies,
          formulas,
          roDateTime(r.health_consent_at),
          r.health_consent_source ?? "",
        ],
      }
    })
    const failed = rows.find((r) => !r.ok)
    if (failed) return { ok: false, error: failed.error }

    const csv = toCsv(
      ["Client ID", "Client", "Alergii", "Formule culoare", "Acord sănătate la", "Sursă acord"],
      rows.map((r) => (r.ok ? r.row : [])),
    )
    return { ok: true, data: { name: "date_sensibile.csv", csv } }
  } catch (err) {
    console.error("[v0] exportSensitiveCsv:", err instanceof Error ? err.message : err)
    return { ok: false, error: "Exportul datelor sensibile a eșuat. Încearcă din nou." }
  }
}
