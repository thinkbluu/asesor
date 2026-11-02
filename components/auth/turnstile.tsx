"use client"

// Cloudflare Turnstile widget. Renders nothing when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set; otherwise loads the script once
// and reports the token (or null on expiry/error) through onToken.

import { useEffect, useRef } from "react"

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string
      callback?: (token: string) => void
      "expired-callback"?: () => void
      "error-callback"?: () => void
      theme?: "light" | "dark" | "auto"
    },
  ) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false

    const render = () => {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return
      if (!window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
        theme: "light",
      })
    }

    if (window.turnstile) {
      render()
    } else {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
      if (existing) {
        existing.addEventListener("load", render)
      } else {
        const script = document.createElement("script")
        script.src = SCRIPT_SRC
        script.async = true
        script.addEventListener("load", render)
        document.head.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current !== null) {
        window.turnstile?.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={containerRef} aria-label="Verificare de securitate" />
}
