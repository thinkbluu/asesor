import Link from "next/link"
import { PLANS, TRIAL_REQUIRES_CARD } from "@/lib/plans"

// Shared with /preturi (full plan cards use the same per-plan CTA).
export const CTA_BY_PLAN = {
  basic: { label: "Începe gratuit", href: "/register?plan=basic", cls: "btn ghost" },
  pro: { label: "Alege Pro", href: "/register?plan=pro", cls: "btn pri" },
  premium: { label: "Contactează-ne", href: "/contact?subiect=premium", cls: "btn ghost" },
} as const

export function PricingTeaser() {
  return (
    <section className="sec f-sat prices">
      <div className="wrap">
        <div className="top">
          <h2 className="h2 rv">
            Prețuri simple.
            <br />
            <em>Fără surprize.</em>
          </h2>
          <p className="lede rv">Alege pachetul potrivit pentru dimensiunea salonului tău. Poți schimba oricând.</p>
        </div>
        <div className="plans rv">
          {PLANS.map((plan) => {
            const cta = CTA_BY_PLAN[plan.id]
            return (
              <div className={`plan${"highlighted" in plan && plan.highlighted ? " pro" : ""}`} key={plan.id}>
                <div className="nm">
                  {plan.name}
                  {"highlighted" in plan && plan.highlighted && <span>Recomandat</span>}
                </div>
                <p className="for">{plan.description}</p>
                <div className="pr">
                  <b>{plan.monthly}</b>
                  <small>RON / lună</small>
                </div>
                <p className="bill">Facturat lunar</p>
                <ul>
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className={f.startsWith("Tot din") ? "p" : undefined}>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link className={cta.cls} href={cta.href}>
                  {cta.label}
                </Link>
              </div>
            )
          })}
        </div>
        <div className="foot-n">
          <span>
            {TRIAL_REQUIRES_CARD
              ? "Toate pachetele încep cu 14 zile gratuit. Nu plătești nimic dacă anulezi înainte."
              : "Toate pachetele încep cu 14 zile gratuit, fără card bancar."}
          </span>
          <Link className="tl" href="/preturi">
            Compară pachetele în detaliu
          </Link>
        </div>
      </div>
    </section>
  )
}
