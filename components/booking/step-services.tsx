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
import { formatPriceRON, formatDurationMin, type BookingService } from "@/lib/booking-logic"
import { cn } from "@/lib/utils"
import type { BookingState } from "./booking-flow"

export function StepServices({
  state,
  update,
  services,
}: {
  state: BookingState
  update: (patch: Partial<BookingState>) => void
  services: BookingService[]
}) {
  const [search, setSearch] = useState("")

  const categories = useMemo(() => {
    const map = new Map<string, BookingService[]>()
    for (const s of services) {
      const list = map.get(s.category) ?? []
      list.push(s)
      map.set(s.category, list)
    }
    return Array.from(map.entries()).map(([name, list]) => ({ name, services: list }))
  }, [services])

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase().trim()
    return categories
      .map((cat) => ({
        ...cat,
        services: cat.services.filter((s) => s.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.services.length > 0)
  }, [categories, search])

  const toggleService = (id: string) => {
    const selected = new Set(state.serviceIds)
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    update({
      serviceIds: Array.from(selected),
      // Reset downstream selections when services change
      staffId: null,
      date: null,
      time: null,
    })
  }

  const totals = useMemo(() => {
    let d = 0
    let p = 0
    for (const id of state.serviceIds) {
      const s = services.find((x) => x.id === id)
      if (s) {
        d += s.durationMin
        p += s.price
      }
    }
    return { duration: d, price: p }
  }, [state.serviceIds, services])

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
          defaultValue={categories.map((c) => c.name)}
          className="space-y-2"
        >
          {filteredCategories.map((cat) => {
            const selectedInCat = cat.services.filter((s) => state.serviceIds.includes(s.id)).length
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
                    {cat.services.map((svc) => {
                      const selected = state.serviceIds.includes(svc.id)
                      return (
                        <li key={svc.id}>
                          <button
                            type="button"
                            onClick={() => toggleService(svc.id)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50",
                              selected && "bg-emerald-50/60",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                                selected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-zinc-300 bg-white",
                              )}
                            >
                              {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-zinc-900">{svc.name}</div>
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                                <Clock className="h-3 w-3" />
                                {formatDurationMin(svc.durationMin)}
                              </div>
                            </div>
                            <div className="shrink-0 text-sm font-semibold text-zinc-900">
                              {formatPriceRON(svc.price)}
                              {svc.priceFrom && (
                                <span className="ml-1 text-xs font-normal text-zinc-400">de la</span>
                              )}
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

      {totals.duration > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="text-sm font-medium text-emerald-900">
            Total selectat · {formatDurationMin(totals.duration)}
          </div>
          <div className="text-lg font-bold text-emerald-700">{formatPriceRON(totals.price)}</div>
        </div>
      )}
    </div>
  )
}
