"use client"

// Shown on /app?error=forbidden — requireRole() redirects blocked roles here.

import { useSearchParams } from "next/navigation"
import { ShieldAlert } from "lucide-react"

export function ForbiddenBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get("error") !== "forbidden") return null

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Nu ai acces la secțiunea respectivă. Contactează proprietarul salonului dacă
        crezi că ar trebui să ai permisiuni suplimentare.
      </span>
    </div>
  )
}
