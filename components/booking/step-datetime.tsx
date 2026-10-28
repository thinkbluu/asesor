"use client"

import { useEffect, useMemo, useState } from "react"
import { Sun, Cloud, Moon, ArrowRight, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { ro } from "date-fns/locale"
import { getAvailabilityAction, type AvailabilitySlot } from "@/app/booking/[slug]/actions"
import type { BookingService, BookingSlot } from "@/lib/booking-logic"
import { toISODate, groupSlotsByPeriod, formatDateLong, formatDurationMin } from "@/lib/booking-logic"
import { cn } from "@/lib/utils"
import type { BookingState } from "./booking-flow"

export function StepDatetime({
  state,
  update,
  salonSlug,
  services,
  slotNonce,
  slotError,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
  salonSlug: string
  services: BookingService[]
  slotNonce: number
  slotError: string | null
}) {
  const totalDuration = useMemo(() => {
    return state.serviceIds.reduce((sum, id) => {
      const s = services.find((x) => x.id === id)
      return sum + (s?.durationMin ?? 0)
    }, 0)
  }, [state.serviceIds, services])

  const selectedDate = state.date ? new Date(state.date + "T12:00:00") : undefined

  const [displayMonth, setDisplayMonth] = useState<Date>(() => selectedDate ?? new Date())
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [nextAvailable, setNextAvailable] = useState<string | null>(null)

  // Fresh availability whenever the date, staff, services or nonce change.
  useEffect(() => {
    if (!state.date) {
      setSlots(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void (async () => {
      const res = await getAvailabilityAction(salonSlug, state.serviceIds, state.staffId, state.date!)
      if (cancelled) return
      setLoading(false)
      if (res.ok) setSlots(res.slots)
      else setLoadError(res.error)
    })()
    return () => {
      cancelled = true
    }
  }, [salonSlug, state.serviceIds, state.staffId, state.date, slotNonce])

  // "Prima dată disponibilă" probe: check the next days until one has slots.
  useEffect(() => {
    if (state.date) return
    let cancelled = false
    void (async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      for (let index = 0; index < 14; index++) {
        const probe = new Date(start)
        probe.setDate(start.getDate() + index)
        const day = toISODate(probe)
        const res = await getAvailabilityAction(salonSlug, state.serviceIds, state.staffId, day)
        if (cancelled) return
        if (res.ok && res.slots.length > 0) {
          setNextAvailable(day)
          return
        }
      }
      setNextAvailable(null)
    })()
    return () => {
      cancelled = true
    }
  }, [salonSlug, state.serviceIds, state.staffId, state.date, slotNonce])

  const groups = useMemo(() => groupSlotsByPeriod(slots ?? []), [slots])

  const pickSlot = (slot: BookingSlot) => {
    update({ time: slot.time, ...(state.staffId ? {} : { staffId: slot.staffId }) })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 md:text-base">
        Alege data programării, apoi un interval orar disponibil.
      </p>

      {slotError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {slotError}
        </div>
      )}

      {nextAvailable && !state.date && (
        <button
          type="button"
          onClick={() => {
            update({ date: nextAvailable, time: null })
            setDisplayMonth(new Date(nextAvailable + "T12:00:00"))
          }}
          className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition-colors hover:bg-emerald-100"
        >
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Prima dată disponibilă
            </div>
            <div className="mt-0.5 text-base font-semibold capitalize text-emerald-900">
              {formatDateLong(nextAvailable)}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-emerald-700" />
        </button>
      )}

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 md:p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              if (!d) return
              update({ date: toISODate(d), time: null })
            }}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            locale={ro}
            weekStartsOn={1}
            disabled={(date) => {
              const compare = new Date(date)
              compare.setHours(0, 0, 0, 0)
              return compare < today
            }}
            className="w-fit"
          />
        </div>

        <div className="min-h-[200px]">
          {!state.date ? (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
              Selectează o dată pentru a vedea intervalele disponibile.
            </div>
          ) : loading ? (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
              Se încarcă intervalele...
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              {loadError}
            </div>
          ) : (slots ?? []).length === 0 ? (
            <NoSlotsMessage date={state.date} />
          ) : (
            <div className="space-y-5">
              <div className="text-sm font-medium capitalize text-zinc-700">
                {formatDateLong(state.date)}
              </div>
              <SlotGroup
                icon={Sun}
                title="Dimineața"
                slots={groups.morning}
                selected={state.time}
                onPick={pickSlot}
              />
              <SlotGroup
                icon={Cloud}
                title="După-amiază"
                slots={groups.afternoon}
                selected={state.time}
                onPick={pickSlot}
              />
              <SlotGroup
                icon={Moon}
                title="Seara"
                slots={groups.evening}
                selected={state.time}
                onPick={pickSlot}
              />
            </div>
          )}
        </div>
      </div>

      {totalDuration > 0 && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5" />
          Durata totală a serviciilor alese: {formatDurationMin(totalDuration)}.
        </div>
      )}
    </div>
  )
}

function NoSlotsMessage({ date }: { date: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
      <p className="text-sm font-medium text-zinc-700">Nicio oră disponibilă</p>
      <p className="mt-1 text-sm text-zinc-500">
        Nu există intervale libere pe {formatDateLong(date)}. Încearcă o altă zi.
      </p>
    </div>
  )
}

function SlotGroup({
  icon: Icon,
  title,
  slots,
  selected,
  onPick,
}: {
  icon: typeof Sun
  title: string
  slots: BookingSlot[]
  selected: string | null
  onPick: (slot: BookingSlot) => void
}) {
  if (slots.length === 0) return null
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {slots.map((slot) => {
          const isSelected = selected === slot.time
          return (
            <button
              key={`${slot.staffId}-${slot.time}`}
              type="button"
              onClick={() => onPick(slot)}
              className={cn(
                "h-11 rounded-lg border text-sm font-medium transition-colors",
                isSelected
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-900 hover:border-emerald-400 hover:bg-emerald-50",
              )}
            >
              {slot.time}
            </button>
          )
        })}
      </div>
    </div>
  )
}
