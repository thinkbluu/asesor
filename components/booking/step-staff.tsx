"use client"

import { useMemo } from "react"
import { Check, Sparkles, Star, User } from "lucide-react"
import { getFullName, getInitials, type StaffMember } from "@/lib/echipa-data"
import { getQualifiedStaff } from "@/lib/booking-logic"
import { cn } from "@/lib/utils"
import type { BookingState } from "./booking-flow"

const STAFF_DATA: StaffMember[] = []

export function StepStaff({
  state,
  update,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
}) {
  const qualified = useMemo(
    () => getQualifiedStaff(STAFF_DATA, state.serviceNames),
    [state.serviceNames],
  )

  const pickStaff = (id: string | null) => {
    update({ staffId: id, date: null, time: null })
  }

  if (qualified.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Nicio persoană din echipă nu oferă toate serviciile alese. Te rugăm să revii și să ajustezi selecția.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 md:text-base">
        Alege specialistul sau lasă-ne pe noi să alegem persoana cea mai potrivită pentru tine.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Fără preferință */}
        <button
          type="button"
          onClick={() => pickStaff(null)}
          className={cn(
            "group relative flex items-center gap-4 rounded-xl border-2 bg-white p-4 text-left transition-all",
            state.staffId === null
              ? "border-emerald-600 shadow-sm ring-4 ring-emerald-100"
              : "border-zinc-200 hover:border-zinc-300",
          )}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-zinc-900">Fără preferință</div>
            <div className="mt-0.5 text-xs text-zinc-500">
              Alegem noi prima persoană disponibilă
            </div>
          </div>
          {state.staffId === null && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
          )}
        </button>

        {qualified.map((s) => {
          const isSelected = state.staffId === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => pickStaff(s.id)}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl border-2 bg-white p-4 text-left transition-all",
                isSelected
                  ? "border-emerald-600 shadow-sm ring-4 ring-emerald-100"
                  : "border-zinc-200 hover:border-zinc-300",
              )}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-700">
                {getInitials(s) || <User className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-zinc-900">
                  {getFullName(s)}
                </div>
                <div className="mt-0.5 truncate text-xs text-zinc-500">{s.role}</div>
                {s.stats.avgRating >= 4.5 && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="font-medium">{s.stats.avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
