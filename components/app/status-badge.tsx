import { cn } from "@/lib/utils"
import { STATUS_CONFIG, type AppointmentStatus } from "@/lib/mappers/programari"

// Un singur badge de status în toată aplicația — aceleași cuvinte și același
// stil ca în reconstrucția machetei. Mereu text (mono, majuscule) + punct;
// niciodată doar culoare.
export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-l-2 px-1.5 py-[3px] font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.06em]",
        cfg.cls,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}
