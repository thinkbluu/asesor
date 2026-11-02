import Image from "next/image"
import Link from "next/link"
import { SITE } from "@/lib/site"
import { CookieSettingsLink } from "./cookie-settings-link"

const PRODUCT = [
  { href: "/functionalitati", label: "Funcționalități" },
  { href: "/preturi", label: "Prețuri" },
  { href: "/pentru-cine", label: "Pentru cine" },
  { href: "/booking/salonul-ana", label: "Vezi o pagină de programare" },
]

const COMPANY = [
  { href: "/despre", label: "Despre noi" },
  { href: "/contact", label: "Contact" },
]

const LEGAL = [
  { href: "/terms", label: "Termeni și condiții" },
  { href: "/privacy", label: "Confidențialitate" },
  { href: "/dpa", label: "DPA" },
  { href: "/cookies", label: "Cookie-uri" },
  { href: "/subprocessors", label: "Subprocesatori" },
]

export function SiteFooter() {
  const socials = Object.entries(SITE.socials) as [string, string][]
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="grid">
          <div>
            <Link className="brand" href="/" style={{ width: 40 }}>
              <Image src="/img/asesor-mark.png" alt="" width={471} height={463} style={{ width: 40 }} />
              ASESOR
            </Link>
            <p style={{ maxWidth: "24em" }}>
              Platforma all-in-one pentru saloane de beauty. Construit în România, pentru saloane din România.
            </p>
          </div>
          <div>
            <h4>Produs</h4>
            <ul>
              {PRODUCT.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Companie</h4>
            <ul>
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${SITE.emails.support}`}>{SITE.emails.support}</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
              <li>
                <CookieSettingsLink />
              </li>
            </ul>
          </div>
        </div>
        <div className="bot">
          <span>
            © {new Date().getFullYear()} {SITE.legalEntity} · CUI {SITE.cui} · {SITE.address}
          </span>
          {socials.length > 0 && (
            <span>
              {socials.map(([name, href], i) => (
                <span key={name}>
                  {i > 0 && " · "}
                  <a href={href}>{name}</a>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </footer>
  )
}
