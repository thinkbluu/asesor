"use client"

import { useState, useMemo } from "react"
import { Check, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepServices } from "./step-services"
import { StepStaff } from "./step-staff"
import { StepDatetime } from "./step-datetime"
import { StepDetails } from "./step-details"
import { StepConfirm } from "./step-confirm"
import { cn } from "@/lib/utils"
import type { SalonInfo } from "@/lib/booking-logic"
import { formatPriceRON, formatDurationMin, getServiceByName } from "@/lib/booking-logic"

export type BookingClient = {
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
  gdpr: boolean
}

export type BookingState = {
  step: 1 | 2 | 3 | 4 | 5
  serviceNames: string[]
  staffId: string | null // null = fără preferință
  date: string | null
  time: string | null
  client: BookingClient
  confirmationNumber: string | null
}

const INITIAL_STATE: BookingState = {
  step: 1,
  serviceNames: [],
  staffId: null,
  date: null,
  time: null,
  client: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
    gdpr: false,
  },
  confirmationNumber: null,
}

const STEP_TITLES = [
  "Alege serviciul",
  "Alege specialistul",
  "Alege data și ora",
  "Datele tale",
  "Confirmare",
]

export function BookingFlow({ salon }: { salon: SalonInfo }) {
  const [state, setState] = useState<BookingState>(INITIAL_STATE)
  const update = (patch: Partial<BookingState>) => setState((s) => ({ ...s, ...patch }))

  // Derived: total duration and price of selected services
  const { totalDuration, totalPrice } = useMemo(() => {
    let d = 0
    let p = 0
    for (const name of state.serviceNames) {
      const s = getServiceByName(name)
      if (s) {
        d += s.duration
        p += s.price
      }
    }
    return { totalDuration: d, totalPrice: p }
  }, [state.serviceNames])

  const canContinue = (() => {
    switch (state.step) {
      case 1:
        return state.serviceNames.length > 0
      case 2:
        return true // staffId can be null (fără preferință)
      case 3:
        return !!state.date && !!state.time
      case 4:
        return (
          state.client.firstName.trim().length > 1 &&
          state.client.lastName.trim().length > 1 &&
          state.client.phone.replace(/\D/g, "").length >= 9 &&
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

  // Success screen (confirmationNumber set means booking complete)
  if (state.confirmationNumber) {
    return <StepConfirm.Success salon={salon} state={state} onReset={() => setState(INITIAL_STATE)} />
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
            {STEP_TITLES[state.step - 1]}
          </h1>
        </div>

        {state.step === 1 && <StepServices state={state} update={update} />}
        {state.step === 2 && <StepStaff state={state} update={update} />}
        {state.step === 3 && <StepDatetime state={state} update={update} />}
        {state.step === 4 && <StepDetails state={state} update={update} />}
        {state.step === 5 && <StepConfirm.Review salon={salon} state={state} update={update} />}

        {/* Desktop continue button inline */}
        {state.step < 5 && (
          <div className="mt-8 hidden md:block">
            <Button
              size="lg"
              disabled={!canContinue}
              onClick={onContinue}
              className="h-12 bg-emerald-600 px-8 text-base font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              Continuă
            </Button>
          </div>
        )}
      </main>

      {/* Mobile sticky bottom bar */}
      {state.step < 5 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            {state.serviceNames.length > 0 ? (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-zinc-500">
                  {state.serviceNames.length}{" "}
                  {state.serviceNames.length === 1 ? "serviciu" : "servicii"} ·{" "}
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
                  isActive && "bg-emerald-600 text-white ring-4 ring-emerald-100",
                  !isDone && !isActive && "bg-zinc-100 text-zinc-400",
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : step}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors",
                    step < currentStep ? "bg-emerald-600" : "bg-zinc-200",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
