import { LEGAL_DOCS, type LegalDocKey } from "@/lib/legal"

/**
 * Shared header for the legal pages: title, "Ultima actualizare" + version,
 * and — in development only — the visible "review before launch" notice.
 */
export function LegalDocHeader({
  doc,
  title,
  lead,
}: {
  doc: LegalDocKey
  title: string
  lead?: string
}) {
  const meta = LEGAL_DOCS[doc]
  const isDev = process.env.NODE_ENV === "development"

  return (
    <header className="lhead-in">
      {isDev ? (
        <p className="ldev">Text de revizuit de un jurist înainte de lansare.</p>
      ) : null}
      <h1 className="ltitle">{title}</h1>
      <p className="lmeta">
        Ultima actualizare: {meta.updated} · Versiunea {meta.version}
      </p>
      {lead ? <p className="llede">{lead}</p> : null}
    </header>
  )
}
