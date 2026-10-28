"use client"

import { useEffect, useState } from "react"
import { Check, Sparkles, User } from "lucide-react"
import { getPublicStaffAction } from "@/app/booking/[slug]/actions"
import type { BookingStaff } from "@/lib/booking-logic"
import { cn } from "@/lib/utils"
import type { BookingState } from "./booking-flow"

export function StepStaff({
  state,
  update,
  salonSlug,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
  salonSlug: string
}) {
  const [staff, setStaff] = useState<BookingStaff[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await getPublicStaffAction(salonSlug, state.serviceIds)
      if (cancelled) return
      if (res.ok) setStaff(res.staff)
      else setError(res.error)
    })()
    return () => {
      cancelled = true
    }
  }, [salonSlug, state.serviceIds])

  const pickStaff = (id: string | null, name: string | null) => {
    update({ staffId: id, staffName: name, date: null, time: null })
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {error}
      </div>
    )
  }

  if (staff === null) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
        Se încarcă echipa...
      </div>
    )
  }

  if (staff.length === 0) {
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
        {/* Oricine e disponibil */}
        <button
          type="button"
          onClick={() => pickStaff(null, null)}
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
            <div className="text-base font-semibold text-zinc-900">Oricine e disponibil</div>
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

        {staff.map((s) => {
          const isSelected = state.staffId === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => pickStaff(s.id, s.firstName)}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl border-2 bg-white p-4 text-left transition-all",
                isSelected
                  ? "border-emerald-600 shadow-sm ring-4 ring-emerald-100"
                  : "border-zinc-200 hover:border-zinc-300",
              )}
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{ backgroundColor: s.color ?? "#059669" }}
              >
                {s.firstName[0] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-zinc-900">{s.firstName}</div>
                {s.roleTitle && (
                  <div className="mt-0.5 truncate text-xs text-zinc-500">{s.roleTitle}</div>
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

      <div className="flex items-start gap-2 text-xs text-zinc-500">
        <User className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Dacă alegi „Oricine e disponibil", îți rezervăm ora cu prima persoană liberă și îți
          spunem numele ei în confirmare.
        </span>
      </div>
    </div>
  )
}
