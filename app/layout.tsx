import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AnalyticsWithConsent } from "@/components/analytics-with-consent"
import { CookieBanner } from "@/components/cookie-banner"
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'

// latin-ext for the Romanian diacritics (ș/ț cu virgulă subscrisă)
const _geist = Geist({ subsets: ["latin", "latin-ext"] });
const _geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://asesor.ro'),
  title: 'ASESOR | Platforma all-in-one pentru saloane de beauty',
  description: 'Simplificăm activitatea zilnică a saloanelor. Creștem controlul și profitabilitatea. Programări, clienți, echipă, stocuri și rapoarte într-un singur loc.',
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
