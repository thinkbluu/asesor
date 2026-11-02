"use client"

import { useEffect, useMemo, useState } from "react"
import { Sun, Cloud, Moon, ArrowRight, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { ro } from "date-fns/locale"
import { getAvailabilityAction, type AvailabilitySlot } from "@/app/booking/[slug]/actions"
import type { BookingService, BookingSlot } from "@/lib/booking-logic"
import { toISODate, groupSlotsByPeriod, formatDateLong, formatDurationMin } from "@/lib/booking-logic"
import type { BookingState } from "./booking-flow"

// Display model after merging free slots with taken-only times (script 020).
type SlotPill = { time: string; taken: boolean; staffId: string | null }

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
  const [takenSlots, setTakenSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [nextAvailable, setNextAvailable] = useState<string | null>(null)

  // Fresh availability whenever the date, staff, services or nonce change.
  useEffect(() => {
    if (!state.date) {
      setSlots(null)
      setTakenSlots([])
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void (async () => {
      const res = await getAvailabilityAction(salonSlug, state.serviceIds, state.staffId, state.date!)
      if (cancelled) return
      setLoading(false)
      if (res.ok) {
        setSlots(res.slots)
        setTakenSlots(res.takenSlots)
      } else {
        setLoadError(res.error)
      }
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

  // Merge free + taken-only times, deduped by time (several staff can share a
  // free slot — one pill per time). Taken-only times render struck-through.
  const groups = useMemo(() => {
    const byTime = new Map<string, SlotPill>()
    for (const s of slots ?? []) {
      const existing = byTime.get(s.time)
      if (!existing || existing.taken) {
        byTime.set(s.time, { time: s.time, taken: false, staffId: s.staffId })
      }
    }
    for (const t of takenSlots) {
      if (!byTime.has(t)) byTime.set(t, { time: t, taken: true, staffId: null })
    }
    const pills = Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time))
    const asSlots = pills.map((p): BookingSlot => ({ staffId: p.staffId ?? "", time: p.time }))
    const grouped = groupSlotsByPeriod(asSlots)
    const takenByTime = new Map(pills.map((p) => [p.time, p.taken]))
    const mark = (list: BookingSlot[]): SlotPill[] =>
      list.map((s) => ({ time: s.time, taken: takenByTime.get(s.time) ?? false, staffId: null }))
    return {
      morning: mark(grouped.morning),
      afternoon: mark(grouped.afternoon),
      evening: mark(grouped.evening),
    }
  }, [slots, takenSlots])

  const pickSlot = (pill: SlotPill) => {
    if (pill.taken) return
    // The free slot's staff wins when "oricine" is selected.
    const free = (slots ?? []).find((s) => s.time === pill.time)
    update({ time: pill.time, ...(state.staffId ? {} : { staffId: free?.staffId ?? null }) })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p className="bk-lede" style={{ marginTop: 0 }}>
        Alege data programării, apoi un interval orar disponibil.
      </p>

      {slotError && <div role="alert" className="bk-alert err">{slotError}</div>}

      {nextAvailable && !state.date && (
        <button
          type="button"
          onClick={() => {
            update({ date: nextAvailable, time: null })
            setDisplayMonth(new Date(nextAvailable + "T12:00:00"))
          }}
          className="bk-next"
        >
          <span>
            <span className="k" style={{ display: "block" }}>
              Prima dată disponibilă
            </span>
            <span className="v" style={{ display: "block" }}>
              {formatDateLong(nextAvailable)}
            </span>
          </span>
          <ArrowRight style={{ width: 18, height: 18, flex: "none" }} aria-hidden="true" />
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="bk-card bk-cal">
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

        <div style={{ minHeight: 180 }}>
          {!state.date ? (
            <div className="bk-empty">Selectează o dată pentru a vedea intervalele disponibile.</div>
          ) : loading ? (
            <div className="bk-empty">Se încarcă intervalele...</div>
          ) : loadError ? (
            <div className="bk-alert err">{loadError}</div>
          ) : (slots ?? []).length === 0 && takenSlots.length === 0 ? (
            <NoSlotsMessage date={state.date} />
          ) : (
            <div className="bk-slots">
              <div className="bk-rlabel" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13.5, color: "var(--ink)" }}>
                {formatDateLong(state.date)}
              </div>
              <SlotGroup icon={Sun} title="Dimineața" pills={groups.morning} selected={state.time} onPick={pickSlot} />
              <SlotGroup icon={Cloud} title="După-amiază" pills={groups.afternoon} selected={state.time} onPick={pickSlot} />
              <SlotGroup icon={Moon} title="Seara" pills={groups.evening} selected={state.time} onPick={pickSlot} />
            </div>
          )}
        </div>
      </div>

      {totalDuration > 0 && (
        <p className="bk-fine" style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Clock style={{ width: 13, height: 13 }} aria-hidden="true" />
          Durata totală a serviciilor alese: {formatDurationMin(totalDuration)}.
        </p>
      )}
    </div>
  )
}

function NoSlotsMessage({ date }: { date: string }) {
  return (
    <div className="bk-empty" style={{ flexDirection: "column", gap: 4 }}>
      <p style={{ fontWeight: 500, color: "var(--ink)" }}>Nicio oră disponibilă</p>
      <p>
        Nu există intervale libere pe {formatDateLong(date)}. Încearcă o altă zi.
      </p>
    </div>
  )
}

function SlotGroup({
  icon: Icon,
  title,
  pills,
  selected,
  onPick,
}: {
  icon: typeof Sun
  title: string
  pills: SlotPill[]
  selected: string | null
  onPick: (pill: SlotPill) => void
}) {
  if (pills.length === 0) return null
  return (
    <div>
      <div className="bk-sg-label">
        <Icon aria-hidden="true" />
        {title}
      </div>
      <div className="bk-slotgrid">
        {pills.map((pill) => {
          const isSelected = selected === pill.time && !pill.taken
          if (pill.taken) {
            return (
              <span key={pill.time} className="bk-slot taken" aria-disabled="true">
                {pill.time}
              </span>
            )
          }
          return (
            <button
              key={pill.time}
              type="button"
              onClick={() => onPick(pill)}
              aria-pressed={isSelected}
              className={`bk-slot${isSelected ? " on" : ""}`}
            >
              {pill.time}
            </button>
          )
        })}
      </div>
    </div>
  )
}
