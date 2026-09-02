import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AnalyticsWithConsent } from "@/components/analytics-with-consent"
import { CookieBanner } from "@/components/cookie-banner"
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ASESOR | Platforma all-in-one pentru saloane de beauty',
  description: 'Simplificăm activitatea zilnică a saloanelor. Creștem controlul și profitabilitatea. Programări, clienți, echipă, stocuri și rapoarte într-un singur loc.',
  generator: 'v0.app',
  icons: {
    icon: '/asesor-logo.png',
    apple: '/asesor-logo.png',
    shortcut: '/asesor-logo.png',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="asesor-theme"
        >
          {children}
          <CookieBanner />
          <AnalyticsWithConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
