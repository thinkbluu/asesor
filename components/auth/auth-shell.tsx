import Link from "next/link"
import type { ReactNode } from "react"

// Shared split shell for /login, /register, /forgot-password, /reset-password
// and /invite/[token] (P17). Left powder panel is desktop-only; on mobile the
// wordmark collapses into a small row above the paper form panel.
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <aside className="au-side">
        <Link href="/" className="au-mark" aria-label="ASESOR — pagina principală">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/asesor-logo.png" alt="" className="au-mark-img" />
          <span>ASESOR</span>
        </Link>
        <div className="au-side-mid">
          <p className="au-tag">
            Salonul tău merge mai bine <em>când totul e clar.</em>
          </p>
        </div>
        <p className="au-side-foot">Programări · Echipă · Venituri</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/obj-hero.webp" alt="" className="au-hero" />
      </aside>

      <main className="au-main">
        <div className="au-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/asesor-logo.png" alt="" className="au-mark-img" />
          <span>ASESOR</span>
        </div>
        <section className="au-panel">
          <h1 className="au-title">{title}</h1>
          {subtitle ? <p className="au-sub">{subtitle}</p> : null}
          {children}
        </section>
      </main>
    </>
  )
}
