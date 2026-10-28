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
    <>
      {isDev ? (
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
          <strong>Text de revizuit de un jurist înainte de lansare.</strong>
        </div>
      ) : null}
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Ultima actualizare: {meta.updated} · Versiunea {meta.version}
      </p>
      {lead ? <p className="-mt-6 mb-10 leading-relaxed text-muted-foreground">{lead}</p> : null}
    </>
  )
}
