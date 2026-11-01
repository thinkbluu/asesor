import type { Metadata } from "next"
import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google"
import type { CSSProperties } from "react"
import "./marketing.css"
import { UtilBar } from "@/components/marketing/util-bar"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
})
const geist = Geist({ subsets: ["latin", "latin-ext"], display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], display: "swap" })

// The mockup gates reveal-hiding behind a `js` class added before first paint,
// so content stays fully visible when JS never runs.
const jsClassScript = "document.currentScript.parentElement.classList.add('js')"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mkt"
      // The inline script below adds the `js` class before hydration.
      suppressHydrationWarning
      style={
        {
          "--serif": bodoni.style.fontFamily,
          "--sans": geist.style.fontFamily,
          "--mono": geistMono.style.fontFamily,
        } as CSSProperties
      }
    >
      <script dangerouslySetInnerHTML={{ __html: jsClassScript }} />
      <UtilBar />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  )
}
