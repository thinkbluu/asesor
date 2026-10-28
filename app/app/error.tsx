"use client"

// Error boundary inside the authenticated app shell — keeps the sidebar
// visible and offers a retry plus a link to the dashboard.

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] app shell error boundary:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Ceva n-a mers bine.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-pretty">
            Am întâmpinat o eroare neașteptată. Încearcă din nou; dacă persistă, contactează
            suportul
            {error.digest ? (
              <> cu codul <code className="font-mono text-foreground">{error.digest}</code></>
            ) : null}.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={reset}>Încearcă din nou</Button>
            <Button variant="outline" asChild>
              <Link href="/app">Înapoi la panou</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
