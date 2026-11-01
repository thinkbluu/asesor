"use client"

import { useState, useMemo } from "react"
import { ChevronLeft } from "lucide-react"
import { StepServices } from "./step-services"
import { StepStaff } from "./step-staff"
import { StepDatetime } from "./step-datetime"
import { StepDetails } from "./step-details"
import { StepConfirm } from "./step-confirm"
import { SalonShell } from "./salon-shell"
import { createPublicBooking } from "@/app/booking/[slug]/actions"
import type { SalonInfo, BookingService } from "@/lib/booking-logic"
import { formatPriceRON, formatDurationMin } from "@/lib/booking-logic"

export type BookingClient = {
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
  gdpr: boolean
  marketing: boolean
  turnstileToken?: string
  website?: string
}

export type BookingResult = {
  code: string
  status: string
  managePath: string
  startsAt: string
  endsAt: string
  totalPrice: number
  durationMin: number
  services: { name: string; price: number; durationMin: number }[]
  staffFirstName: string
}

export type BookingState = {
  step: 1 | 2 | 3 | 4 | 5
  serviceIds: string[]
  staffId: string | null // null = oricine e disponibil
  staffName: string | null
  date: string | null
  time: string | null
  client: BookingClient
  result: BookingResult | null
}

const INITIAL_STATE: BookingState = {
  step: 1,
  serviceIds: [],
  staffId: null,
  staffName: null,
  date: null,
  time: null,
  client: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
    gdpr: false,
    marketing: false,
  },
  result: null,
}

const STEP_TITLES = [
  "Alege serviciul",
  "Alege specialistul",
  "Alege data și ora",
  "Datele tale",
  "Confirmare",
]

// 4-segment progress (mockup): confirmarea împarte segmentul «Detalii».
const SEGMENTS = ["Servicii", "Specialist", "Data și ora", "Detalii"]

export function BookingFlow({
  salon,
  services,
}: {
  salon: SalonInfo
  services: BookingService[]
}) {
  const [state, setState] = useState<BookingState>(INITIAL_STATE)
  // Bumped when the chosen slot turns out to be taken — forces StepDatetime
  // to refetch fresh availability.
  const [slotNonce, setSlotNonce] = useState(0)
  const [slotError, setSlotError] = useState<string | null>(null)
  const update = (patch: Partial<BookingState>) => setState((s) => ({ ...s, ...patch }))

  // Derived: total duration and price of selected services
  const { totalDuration, totalPrice } = useMemo(() => {
    let d = 0
    let p = 0
    for (const id of state.serviceIds) {
      const s = services.find((x) => x.id === id)
      if (s) {
        d += s.durationMin
        p += s.price
      }
    }
    return { totalDuration: d, totalPrice: p }
  }, [state.serviceIds, services])

  const canContinue = (() => {
    switch (state.step) {
      case 1:
        return state.serviceIds.length > 0
      case 2:
        return true // staffId can be null (oricine e disponibil)
      case 3:
        return !!state.date && !!state.time
      case 4:
        return (
          state.client.firstName.trim().length > 1 &&
          state.client.lastName.trim().length > 1 &&
          state.client.phone.replace(/\D/g, "").length >= 9 &&
          state.client.email.trim().length > 3 &&
          state.client.gdpr
        )
      default:
        return false
    }
  })()

  const onContinue = () => {
    if (state.step < 5) update({ step: (state.step + 1) as BookingState["step"] })
  }

  const onBack = () => {
    if (state.step > 1) update({ step: (state.step - 1) as BookingState["step"] })
  }

  // Success screen (result set means booking complete)
  if (state.result) {
    return (
      <SalonShell
        name={salon.name}
        address={salon.address}
        logoUrl={salon.logoUrl}
        accentColor={salon.accentColor}
      >
        <StepConfirm.Success
          salon={salon}
          state={state}
          onReset={() => {
            setState(INITIAL_STATE)
            setSlotError(null)
          }}
        />
      </SalonShell>
    )
  }

  return (
    <SalonShell
      name={salon.name}
      address={salon.address}
      logoUrl={salon.logoUrl}
      accentColor={salon.accentColor}
    >
      <BookingProgress currentStep={state.step} />

      <main className="bk-main">
        <div className="bk-toprow">
          {state.step > 1 && (
            <button type="button" onClick={onBack} className="bk-back">
              <ChevronLeft style={{ width: 15, height: 15 }} />
              Înapoi
            </button>
          )}
          <h1 className="bk-title">{STEP_TITLES[state.step - 1]}</h1>
        </div>

        {state.step === 1 && (
          <StepServices state={state} update={update} services={services} />
        )}
        {state.step === 2 && (
          <StepStaff state={state} update={update} salonSlug={salon.slug} />
        )}
        {state.step === 3 && (
          <StepDatetime
            state={state}
            update={update}
            salonSlug={salon.slug}
            services={services}
            slotNonce={slotNonce}
            slotError={slotError}
          />
        )}
        {state.step === 4 && (
          <StepDetails state={state} update={update} salonSlug={salon.slug} salonName={salon.name} />
        )}
        {state.step === 5 && (
          <StepConfirm.Review
            salon={salon}
            state={state}
            services={services}
            staffName={state.staffName}
            onSubmit={async () => {
              const res = await createPublicBooking({
                slug: salon.slug,
                serviceIds: state.serviceIds,
                staffId: state.staffId,
                date: state.date ?? "",
                time: state.time ?? "",
                firstName: state.client.firstName,
                lastName: state.client.lastName,
                phone: state.client.phone,
                email: state.client.email,
                notes: state.client.notes,
                gdpr: state.client.gdpr,
                marketing: state.client.marketing,
                website: "",
                turnstileToken: state.client.turnstileToken ?? "",
              })
              if (res.ok) {
                update({ result: res.data })
              } else if (res.code === "slot_taken") {
                // Slot taken between selection and submit → back to the time
                // step with fresh availability.
                setSlotError(res.message)
                update({ step: 3, time: null })
                setSlotNonce((n) => n + 1)
              } else {
                setSlotError(null)
                return res
              }
              return null
            }}
          />
        )}
      </main>

      {/* Sticky bar — fixed on mobile (one-thumb reach), sticky in-flow on desktop */}
      {state.step < 5 && (
        <div className="bk-bar">
          <div className="bk-bar-in">
            {state.serviceIds.length > 0 ? (
              <div className="bk-bar-sum">
                <div className="bk-bar-meta">
                  {state.serviceIds.length} {state.serviceIds.length === 1 ? "serviciu" : "servicii"}{" "}
                  · {formatDurationMin(totalDuration)}
                </div>
                <div className="bk-bar-price">{formatPriceRON(totalPrice)}</div>
              </div>
            ) : (
              <div className="bk-bar-sum">
                <div className="bk-bar-meta">Selectează servicii</div>
              </div>
            )}
            <button
              type="button"
              disabled={!canContinue}
              onClick={onContinue}
              className="bk-btn"
            >
              Continuă
            </button>
          </div>
        </div>
      )}
    </SalonShell>
  )
}

function BookingProgress({ currentStep }: { currentStep: number }) {
  // Step 5 (confirmare) completes the last segment.
  const activeIdx = Math.min(currentStep - 1, SEGMENTS.length - 1)
  return (
    <nav className="bk-progress" aria-label="Pașii programării">
      {SEGMENTS.map((label, i) => (
        <div key={label} className={`bk-seg${i <= activeIdx ? " on" : ""}`}>
          <i aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </nav>
  )
}
