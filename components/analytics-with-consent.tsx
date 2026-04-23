"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"

const STORAGE_KEY = "asesor-cookie-choice"

type CookieChoice = {
  necessary: true
  analytics: boolean
  marketing: boolean
  timestamp: number
}

function readAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as CookieChoice
    return parsed.analytics === true
  } catch {
    return false
  }
}

export function AnalyticsWithConsent() {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    setConsented(readAnalyticsConsent())

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        setConsented(readAnalyticsConsent())
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  if (!consented) return null
  return <Analytics />
}
