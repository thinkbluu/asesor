"use client"

import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "overview", label: "Vizualizare" },
  { id: "branding", label: "Personalizare" },
  { id: "preview", label: "Previzualizare" },
]

export function BookingTabs() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentTab = searchParams.get("tab") ?? "overview"

  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={`${pathname}?tab=${t.id}`}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            currentTab === t.id
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
