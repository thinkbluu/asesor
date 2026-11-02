import { LegalDocHeader } from "@/components/legal/legal-doc-header"
import { LegalToc } from "@/components/marketing/legal-toc"
import type { LegalDocKey } from "@/lib/legal"

/**
 * Shared article layout for the legal pages: Bodoni title, mono meta line,
 * 68ch article body and a sticky table of contents built from the H2s.
 */
export function LegalDoc({
  doc,
  title,
  lead,
  children,
}: {
  doc: LegalDocKey
  title: string
  lead?: string
  children: React.ReactNode
}) {
  return (
    <main className="legal-page">
      <div className="wrap">
        <LegalDocHeader doc={doc} title={title} lead={lead} />
      </div>
      <div className="wrap lbody">
        <article className="legal">{children}</article>
        <div className="ltoc-wrap">
          <LegalToc />
        </div>
      </div>
    </main>
  )
}
