"use client"

// Global error boundary (marketing + auth surfaces). Romanian copy with a
// way back; the digest is shown so a user can report a reproducible code.

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] app error boundary:", error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
        Ceva n-a mers bine.
      </h1>
      <p className="max-w-md text-muted-foreground text-pretty">
        Am întâmpinat o eroare neașteptată. Încearcă din nou; dacă persistă, contactează suportul
        {error.digest ? (
          <> cu codul <code className="font-mono text-foreground">{error.digest}</code></>
        ) : null}.
      </p>
      <div className="mt-2 flex gap-3">
        <Button onClick={reset}>Încearcă din nou</Button>
        <Button variant="outline" asChild>
          <Link href="/">Pagina principală</Link>
        </Button>
      </div>
    </main>
  )
}
