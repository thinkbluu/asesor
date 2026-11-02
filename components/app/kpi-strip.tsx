import { cn } from "@/lib/utils"

// Benza de KPI din machetă (.kpis): celule despărțite de hairline-uri,
// etichetă mică + număr mare. 2×2 pe mobil, 4 coloane pe desktop.
const CELL_BORDERS = [
  "",
  "border-l border-border",
  "border-t border-border lg:border-l lg:border-t-0",
  "border-l border-t border-border lg:border-t-0",
]

export function KpiStrip({
  items,
  className,
}: {
  items: { label: string; value: string }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-4",
        className,
      )}
    >
      {items.map((k, i) => (
        <div
          key={k.label}
          className={cn("min-w-0 px-3 py-2.5 lg:py-2", CELL_BORDERS[i] ?? "border-l border-border")}
        >
          <small className="block truncate text-[11px] leading-4 text-muted-foreground">
            {k.label}
          </small>
          <b className="block text-[17px] font-semibold leading-6 tracking-[-0.01em] text-foreground tabular-nums">
            {k.value}
          </b>
        </div>
      ))}
    </div>
  )
}
