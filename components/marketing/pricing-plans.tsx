"use client"

import Link from "next/link"
import { useState } from "react"

export interface PlanCard {
  id: string
  name: string
  monthly: number
  yearly: number
  description: string
  features: string[]
  highlighted: boolean
  cta: { label: string; href: string; cls: string }
}

/**
 * Plan cards for /preturi. The lunar/anual toggle renders only when the
 * yearly prices are actually shown (SHOW_YEARLY in lib/plans.ts).
 */
export function PricingPlans({ plans, showYearly }: { plans: PlanCard[]; showYearly: boolean }) {
  const [billing, setBilling] = useState<"month" | "year">("month")
  const yearly = showYearly && billing === "year"

  return (
    <div className="rv">
      {showYearly && (
        <div className="toggle" role="group" aria-label="Perioada de facturare">
          <button
            type="button"
            className={billing === "month" ? "on" : undefined}
            aria-pressed={billing === "month"}
            onClick={() => setBilling("month")}
          >
            Lunar
          </button>
          <button
            type="button"
            className={billing === "year" ? "on" : undefined}
            aria-pressed={billing === "year"}
            onClick={() => setBilling("year")}
          >
            Anual
          </button>
        </div>
      )}
      <div className="plans" style={showYearly ? { marginTop: 40 } : undefined}>
        {plans.map((plan) => (
          <div className={`plan${plan.highlighted ? " pro" : ""}`} key={plan.id}>
            <div className="nm">
              {plan.name}
              {plan.highlighted && <span>Recomandat</span>}
            </div>
            <p className="for">{plan.description}</p>
            <div className="pr">
              <b>{yearly ? plan.yearly : plan.monthly}</b>
              <small>RON / lună</small>
            </div>
            <p className="bill">{yearly ? "pe lună, facturat anual" : "Facturat lunar"}</p>
            <ul>
              {plan.features.map((f) => (
                <li key={f} className={f.startsWith("Tot din") ? "p" : undefined}>
                  {f}
                </li>
              ))}
            </ul>
            <Link className={plan.cta.cls} href={plan.cta.href}>
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
