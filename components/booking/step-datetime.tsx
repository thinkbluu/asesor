"use client"

import { useMemo, useState } from "react"
import { CalendarX, Sun, Cloud, Moon, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import type { StaffMember } from "@/lib/echipa-data"
import {
  getQualifiedStaff,
  getServiceByName,
  getAvailableSlots,
  groupSlotsByPeriod,
  isDateBookable,
  findNextAvailableDate,
  toISODate,
  formatDateLong,
  type TimeSlot,
} from "@/lib/booking-logic"
import { ro } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { BookingState } from "./booking-flow"

const STAFF_DATA: StaffMember[] = []

export function StepDatetime({
  state,
  update,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
}) {
  const totalDuration = useMemo(() => {
    return state.serviceNames.reduce((sum, name) => {
      const s = getServiceByName(name)
      return sum + (s?.duration ?? 0)
    }, 0)
  }, [state.serviceNames])

  // Staff pool: picked staff only, or all qualified for "fără preferință"
  const staffPool = useMemo(() => {
    const qualified = getQualifiedStaff(STAFF_DATA, state.serviceNames)
    if (state.staffId) return qualified.filter((s) => s.id === state.staffId)
    return qualified
  }, [state.serviceNames, state.staffId])

  const selectedDate = state.date ? new Date(state.date + "T12:00:00") : undefined

  const [displayMonth, setDisplayMonth] = useState<Date>(() => selectedDate ?? new Date())

  const slots = useMemo<TimeSlot[]>(() => {
    if (!state.date) return []
    return getAvailableSlots(staffPool, state.date, totalDuration)
  }, [staffPool, state.date, totalDuration])

  const groups = useMemo(() => groupSlotsByPeriod(slots), [slots])

  const nextAvailable = useMemo(() => {
    if (state.date) return null
    return findNextAvailableDate(staffPool, totalDuration)
  }, [staffPool, totalDuration, state.date])

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 md:text-base">
        Alege data programării, apoi un interval orar disponibil.
      </p>

      {nextAvailable && !state.date && (
        <button
          type="button"
          onClick={() => {
            update({ date: toISODate(nextAvailable), time: null })
            setDisplayMonth(nextAvailable)
          }}
          className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition-colors hover:bg-emerald-100"
        >
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Prima dată disponibilă
            </div>
            <div className="mt-0.5 text-base font-semibold capitalize text-emerald-900">
              {formatDateLong(toISODate(nextAvailable))}
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
            disabled={(date) => !isDateBookable(date, staffPool)}
            className="w-fit"
          />
        </div>

        <div className="min-h-[200px]">
          {!state.date ? (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
              Selectează o dată pentru a vedea intervalele disponibile.
            </div>
          ) : slots.length === 0 ? (
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
                onPick={(time, staffId) => update({ time, ...(state.staffId ? {} : { staffId }) })}
              />
              <SlotGroup
                icon={Cloud}
                title="După-amiază"
                slots={groups.afternoon}
                selected={state.time}
                onPick={(time, staffId) => update({ time, ...(state.staffId ? {} : { staffId }) })}
              />
              <SlotGroup
                icon={Moon}
                title="Seara"
                slots={groups.evening}
                selected={state.time}
                onPick={(time, staffId) => update({ time, ...(state.staffId ? {} : { staffId }) })}
              />
            </div>
          )}
        </div>
      </div>
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
  slots: TimeSlot[]
  selected: string | null
  onPick: (time: string, staffId: string) => void
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
              key={slot.time}
              type="button"
              onClick={() => onPick(slot.time, slot.staffId)}
              className={cn(
                "flex h-12 items-center justify-center rounded-lg border-2 text-sm font-medium transition-all",
                isSelected
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-900 hover:border-emerald-300 hover:bg-emerald-50",
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

function NoSlotsMessage({ date }: { date: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <CalendarX className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-amber-900">
            Niciun loc disponibil pe {formatDateLong(date)}
          </div>
          <p className="mt-1 text-sm text-amber-800/90">
            Încearcă o altă dată din calendar sau intră pe lista de așteptare și te anunțăm imediat
            ce apare un loc liber.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
          >
            Adaugă-mă pe lista de așteptare
          </Button>
        </div>
      </div>
    </div>
  )
}
