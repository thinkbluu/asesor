"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

const LINKS = [
  { href: "/functionalitati", label: "Funcționalități" },
  { href: "/preturi", label: "Prețuri" },
  { href: "/pentru-cine", label: "Pentru cine" },
  { href: "/despre", label: "Despre" },
  { href: "/contact", label: "Contact" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header className="nav">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="ASESOR — pagina principală">
          <Image src="/img/asesor-mark.png" alt="" width={471} height={463} priority />
          ASESOR
        </Link>
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={pathname === l.href ? "cur" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="act">
          <Link className="login" href="/login">
            Autentificare
          </Link>
          <Link className="btn pri" href="/register">
            Începe gratuit
          </Link>
          <button
            className="menu"
            type="button"
            aria-label={open ? "Închide meniul" : "Deschide meniul"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      {open && (
        <div className="sheet" role="dialog" aria-label="Meniu">
          <nav>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              Autentificare
            </Link>
            <Link className="btn pri" href="/register" onClick={() => setOpen(false)}>
              Începe gratuit
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
