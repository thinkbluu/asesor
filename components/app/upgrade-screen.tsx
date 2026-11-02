import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FEATURE_LABEL, FEATURE_MIN_PLAN, getPlan, type FeatureKey } from "@/lib/plans"

export function UpgradeScreen({ feature, isOwner }: { feature: FeatureKey; isOwner: boolean }) {
  const plan = getPlan(FEATURE_MIN_PLAN[feature])
  const label = FEATURE_LABEL[feature]

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="mt-4 text-balance text-2xl font-bold">{label} este inclus în planul {plan.name}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          Planul {plan.name} costă {plan.monthly} lei pe lună și include {label.toLowerCase()}, împreună cu restul modulelor
          avansate. Planul curent al salonului nu are acces la acest modul.
        </p>
        {isOwner ? (
          <Button asChild className="mt-6">
            <Link href="/app/setari?tab=abonament">Vezi planurile</Link>
          </Button>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Cere proprietarului salonului să treacă la planul {plan.name}.</p>
        )}
      </div>
    </div>
  )
}
