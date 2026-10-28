"use client"

import { useState, useMemo } from "react"
import { Check, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepServices } from "./step-services"
import { StepStaff } from "./step-staff"
import { StepDatetime } from "./step-datetime"
import { StepDetails } from "./step-details"
import { StepConfirm } from "./step-confirm"
import { createPublicBooking } from "@/app/booking/[slug]/actions"
import { cn } from "@/lib/utils"
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
      <StepConfirm.Success
        salon={salon}
        state={state}
        onReset={() => {
          setState(INITIAL_STATE)
          setSlotError(null)
        }}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SalonHeader salon={salon} />
      <BookingProgress currentStep={state.step} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-40 pt-6 md:pb-8 md:pt-10">
        <div className="mb-6 flex items-center gap-3">
          {state.step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 h-10 px-3 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <ChevronLeft className="h-4 w-4" />
              Înapoi
            </Button>
          )}
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
            {STEP_TITLES[state.step - 1]}
          </h1>
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
          <StepDetails state={state} update={update} salonSlug={salon.slug} />
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

      {/* Mobile sticky bottom bar */}
      {state.step < 5 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            {state.serviceIds.length > 0 ? (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-zinc-500">
                  {state.serviceIds.length}{" "}
                  {state.serviceIds.length === 1 ? "serviciu" : "servicii"} ·{" "}
                  {formatDurationMin(totalDuration)}
                </div>
                <div className="truncate text-base font-semibold text-zinc-900">
                  {formatPriceRON(totalPrice)}
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1 text-sm text-zinc-500">Selectează servicii</div>
            )}
            <Button
              size="lg"
              disabled={!canContinue}
              onClick={onContinue}
              className="h-12 shrink-0 bg-emerald-600 px-6 text-base font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              Continuă
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SalonHeader({ salon }: { salon: SalonInfo }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
          {salon.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-zinc-900 md:text-lg">
            {salon.name}
          </div>
          <div className="truncate text-xs text-zinc-500 md:text-sm">{salon.address}</div>
        </div>
      </div>
    </header>
  )
}

function BookingProgress({ currentStep }: { currentStep: number }) {
  const steps = [1, 2, 3, 4, 5]
  return (
    <div className="border-b border-zinc-100 bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
        {steps.map((step, i) => {
          const isDone = step < currentStep
          const isActive = step === currentStep
          return (
            <div key={step} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isDone && "bg-emerald-600 text-white",
                  isActive && "bg-emerald-600 text-white",
                  !isDone && !isActive && "bg-zinc-100 text-zinc-400",
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-px flex-1", isDone ? "bg-emerald-600" : "bg-zinc-200")} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
