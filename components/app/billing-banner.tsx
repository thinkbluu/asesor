import Link from "next/link"
import { AlertTriangle, Clock } from "lucide-react"
import type { BillingBanner as Banner } from "@/lib/billing/access"
import { cn } from "@/lib/utils"

export function BillingBanner({ banner, isOwner }: { banner: Banner | null; isOwner: boolean }) {
  if (!banner) return null
  const urgent = banner.kind !== "trial"
  const Icon = urgent ? AlertTriangle : Clock

  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 text-sm",
        urgent ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-accent/30 bg-accent/10 text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <p className="font-medium">{banner.message}</p>
      {isOwner && (
        <Link href="/app/setari?tab=abonament" className="underline underline-offset-4">
          {banner.kind === "trial" ? "Vezi abonamentul" : "Mergi la abonament"}
        </Link>
      )}
    </div>
  )
}
