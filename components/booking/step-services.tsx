"use client"

import { useState, useMemo } from "react"
import { Search, Clock, Check } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import {
  getServiceByName,
  formatPriceRON,
  formatDurationMin,
} from "@/lib/booking-logic"
import { cn } from "@/lib/utils"
import type { BookingState } from "./booking-flow"

type ServiceCategory = {
  name: string
  services: string[]
}

const SERVICE_CATEGORIES: ServiceCategory[] = []

export function StepServices({
  state,
  update,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
}) {
  const [search, setSearch] = useState("")

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return SERVICE_CATEGORIES
    const q = search.toLowerCase().trim()
    return SERVICE_CATEGORIES.map((cat) => ({
      ...cat,
      services: cat.services.filter((name) => name.toLowerCase().includes(q)),
    })).filter((cat) => cat.services.length > 0)
  }, [search])

  const toggleService = (name: string) => {
    const selected = new Set(state.serviceNames)
    if (selected.has(name)) selected.delete(name)
    else selected.add(name)
    update({
      serviceNames: Array.from(selected),
      // Reset downstream selections when services change
      staffId: null,
      date: null,
      time: null,
    })
  }

  const totals = useMemo(() => {
    let d = 0
    let p = 0
    for (const name of state.serviceNames) {
      const s = getServiceByName(name)
      if (s) {
        d += s.duration
        p += s.price
      }
    }
    return { duration: d, price: p }
  }, [state.serviceNames])

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 md:text-base">
        Selectează unul sau mai multe servicii. Totalul și durata se actualizează pe măsură ce alegi.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută un serviciu..."
          className="h-12 border-zinc-200 bg-white pl-10 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
        />
      </div>

      {/* Categories accordion */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
          Niciun serviciu găsit pentru „{search}".
        </div>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={SERVICE_CATEGORIES.map((c) => c.name)}
          className="space-y-2"
        >
          {filteredCategories.map((cat) => {
            const selectedInCat = cat.services.filter((s) => state.serviceNames.includes(s)).length
            return (
              <AccordionItem
                key={cat.name}
                value={cat.name}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
              >
                <AccordionTrigger className="px-4 py-3.5 text-left text-base font-semibold text-zinc-900 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span>{cat.name}</span>
                    {selectedInCat > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {selectedInCat} ales{selectedInCat > 1 ? "e" : ""}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                    {cat.services.map((name) => {
                      const svc = getServiceByName(name)
                      if (!svc) return null
                      const isSelected = state.serviceNames.includes(name)
                      return (
                        <li key={name}>
                          <button
                            type="button"
                            onClick={() => toggleService(name)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                              "hover:bg-zinc-50",
                              isSelected && "bg-emerald-50/50",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-zinc-300 bg-white",
                              )}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-base font-medium text-zinc-900">
                                {name}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatDurationMin(svc.duration)}</span>
                              </div>
                            </div>
                            <div className="shrink-0 text-base font-semibold text-zinc-900">
                              {formatPriceRON(svc.price)}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Running total (desktop - mobile sees the sticky bar) */}
      {state.serviceNames.length > 0 && (
        <div className="hidden items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 md:flex">
          <div>
            <div className="text-sm font-medium text-emerald-700">
              {state.serviceNames.length}{" "}
              {state.serviceNames.length === 1 ? "serviciu selectat" : "servicii selectate"}
            </div>
            <div className="mt-0.5 text-xs text-emerald-700/80">
              Durată totală: {formatDurationMin(totals.duration)}
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatPriceRON(totals.price)}
          </div>
        </div>
      )}
    </div>
  )
}
