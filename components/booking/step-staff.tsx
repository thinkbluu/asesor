"use client"

import { useEffect, useState } from "react"
import { Check, Sparkles, User } from "lucide-react"
import { getPublicStaffAction } from "@/app/booking/[slug]/actions"
import { accentPair, type BookingStaff } from "@/lib/booking-logic"
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
    return <div className="bk-alert err">{error}</div>
  }

  if (staff === null) {
    return <div className="bk-empty">Se încarcă echipa...</div>
  }

  if (staff.length === 0) {
    return (
      <div className="bk-alert">
        Nicio persoană din echipă nu oferă toate serviciile alese. Te rugăm să revii și să ajustezi
        selecția.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p className="bk-lede" style={{ marginTop: 0 }}>
        Alege specialistul sau lasă-ne pe noi să alegem persoana cea mai potrivită pentru tine.
      </p>

      <div className="bk-staffgrid">
        {/* Oricine e disponibil */}
        <button
          type="button"
          onClick={() => pickStaff(null, null)}
          aria-pressed={state.staffId === null}
          className={`bk-staff${state.staffId === null ? " on" : ""}`}
        >
          <span
            className="bk-avatar"
            style={{ background: "var(--acc)", color: "var(--acc-ink)" }}
            aria-hidden="true"
          >
            <Sparkles style={{ width: 20, height: 20 }} />
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="bk-staff-name" style={{ display: "block" }}>
              Oricine e disponibil
            </span>
            <span className="bk-staff-role" style={{ display: "block" }}>
              Alegem noi prima persoană disponibilă
            </span>
          </span>
          {state.staffId === null && (
            <span className="bk-pick" aria-hidden="true">
              <Check style={{ width: 13, height: 13 }} strokeWidth={3} />
            </span>
          )}
        </button>

        {staff.map((s) => {
          const isSelected = state.staffId === s.id
          const pair = accentPair(s.color)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => pickStaff(s.id, s.firstName)}
              aria-pressed={isSelected}
              className={`bk-staff${isSelected ? " on" : ""}`}
            >
              <span
                className="bk-avatar"
                style={{ background: pair.acc, color: pair.ink }}
                aria-hidden="true"
              >
                {s.firstName[0] ?? "?"}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="bk-staff-name" style={{ display: "block" }}>
                  {s.firstName}
                </span>
                {s.roleTitle && (
                  <span className="bk-staff-role" style={{ display: "block" }}>
                    {s.roleTitle}
                  </span>
                )}
              </span>
              {isSelected && (
                <span className="bk-pick" aria-hidden="true">
                  <Check style={{ width: 13, height: 13 }} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="bk-fine" style={{ display: "flex", gap: 8 }}>
        <User style={{ width: 14, height: 14, flex: "none", marginTop: 2 }} aria-hidden="true" />
        <span>
          Dacă alegi „Oricine e disponibil”, îți rezervăm ora cu prima persoană liberă și îți spunem
          numele ei în confirmare.
        </span>
      </p>
    </div>
  )
}
