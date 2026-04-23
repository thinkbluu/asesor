"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggleSimple() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-9 w-20" />

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 transition-colors hover:bg-muted/80"
      aria-label="Schimbă tema"
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Sun className="h-4 w-4 text-muted-foreground" />
      )}
      <div className={`relative h-5 w-9 rounded-full transition-colors ${isDark ? "bg-accent" : "bg-input"}`}>
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
            isDark ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  )
}

export function ThemeToggleMobile() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Mod întunecat</span>
      </div>
      <div className={`relative h-5 w-9 rounded-full transition-colors ${isDark ? "bg-accent" : "bg-input"}`}>
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
            isDark ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  )
}
