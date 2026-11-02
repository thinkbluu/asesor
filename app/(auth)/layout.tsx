import type { CSSProperties, ReactNode } from "react"
import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google"
import "./auth.css"

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
})
const geist = Geist({ subsets: ["latin", "latin-ext"], display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], display: "swap" })

// Auth shares the mockup tokens without loading the marketing CSS: the token
// values come from tokens.css, the real font families from next/font here.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="au"
      style={
        {
          "--serif": bodoni.style.fontFamily,
          "--sans": geist.style.fontFamily,
          "--mono": geistMono.style.fontFamily,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
