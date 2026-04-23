import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from "@clerk/nextjs"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ASESOR | Platforma all-in-one pentru saloane de beauty',
  description: 'Simplificăm activitatea zilnică a saloanelor. Creștem controlul și profitabilitatea. Programări, clienți, echipă, stocuri și rapoarte într-un singur loc.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
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
          <ClerkProvider
            signInUrl="/login"
            signUpUrl="/register"
            signInFallbackRedirectUrl="/app"
            signUpFallbackRedirectUrl="/app/onboarding"
          >
            {children}
          </ClerkProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
