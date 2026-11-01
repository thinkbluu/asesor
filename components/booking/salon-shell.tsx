import type { CSSProperties, ReactNode } from "react"
import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google"
import { accentPair } from "@/lib/booking-logic"

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
})
const geist = Geist({ subsets: ["latin", "latin-ext"], display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], display: "swap" })

// Shared salon-branded shell for /booking/[slug], /booking/manage/[token] and
// /feedback/[token] (P17). Sets the salon accent as --acc with a contrast-safe
// text colour --acc-ink (pale colours flip the text to ink, AA-safe).
export function SalonShell({
  name,
  address,
  logoUrl,
  accentColor,
  header = true,
  children,
}: {
  name: string
  address?: string | null
  logoUrl?: string | null
  accentColor?: string | null
  header?: boolean
  children: ReactNode
}) {
  const { acc, ink } = accentPair(accentColor)
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div
      className="bk"
      style={
        {
          "--serif": bodoni.style.fontFamily,
          "--sans": geist.style.fontFamily,
          "--mono": geistMono.style.fontFamily,
          "--acc": acc,
          "--acc-ink": ink,
        } as CSSProperties
      }
    >
      {header && (
        <header className="bk-head">
          <div className="bk-col">
            <div className="bk-head-in">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="bk-logo" />
              ) : (
                <span className="bk-logo bk-logo-fb" style={{ background: acc, color: ink }}>
                  {initials}
                </span>
              )}
              <div style={{ minWidth: 0 }}>
                <div className="bk-name">{name}</div>
                {address ? <div className="bk-addr">{address}</div> : null}
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="bk-col">
        {children}
        <footer className="bk-foot">
          Programare prin <b>ASESOR</b>
        </footer>
      </div>
    </div>
  )
}
