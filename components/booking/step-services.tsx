"use client"

import { useState, useMemo } from "react"
import { Search, Clock, Check } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatPriceRON, formatDurationMin, type BookingService } from "@/lib/booking-logic"
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p className="bk-lede" style={{ marginTop: 0 }}>
        Selectează unul sau mai multe servicii. Totalul și durata se actualizează pe măsură ce alegi.
      </p>

      {/* Search */}
      <div className="bk-search">
        <Search aria-hidden="true" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută un serviciu..."
          aria-label="Caută un serviciu"
          className="bk-input"
        />
      </div>

      {/* Categories accordion */}
      {filteredCategories.length === 0 ? (
        <div className="bk-empty">Niciun serviciu găsit pentru „{search}”.</div>
      ) : (
        <Accordion type="multiple" defaultValue={categories.map((c) => c.name)} className="bk-acc">
          {filteredCategories.map((cat) => {
            const selectedInCat = cat.services.filter((s) => state.serviceIds.includes(s.id)).length
            return (
              <AccordionItem key={cat.name} value={cat.name} className="bk-acc-item">
                <AccordionTrigger className="bk-acc-trigger hover:no-underline">
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {cat.name}
                    {selectedInCat > 0 && (
                      <span className="bk-acc-count">
                        {selectedInCat} ales{selectedInCat > 1 ? "e" : ""}
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="bk-acc-content">
                    <ul>
                      {cat.services.map((svc) => {
                        const selected = state.serviceIds.includes(svc.id)
                        return (
                          <li key={svc.id}>
                            <button
                              type="button"
                              onClick={() => toggleService(svc.id)}
                              aria-pressed={selected}
                              className={`bk-svc${selected ? " on" : ""}`}
                            >
                              <span className="bk-cbx" aria-hidden="true">
                                {selected && <Check style={{ width: 12, height: 12 }} strokeWidth={3} />}
                              </span>
                              <span style={{ minWidth: 0, flex: 1 }}>
                                <span className="bk-svc-name" style={{ display: "block" }}>
                                  {svc.name}
                                </span>
                                <span className="bk-svc-meta">
                                  <Clock aria-hidden="true" />
                                  {formatDurationMin(svc.durationMin)}
                                </span>
                              </span>
                              <span className="bk-svc-price">
                                {formatPriceRON(svc.price)}
                                {svc.priceFrom && <small>de la</small>}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {totals.duration > 0 && (
        <div className="bk-sumline">
          <span className="lab">Total selectat · {formatDurationMin(totals.duration)}</span>
          <b>{formatPriceRON(totals.price)}</b>
        </div>
      )}
    </div>
  )
}
