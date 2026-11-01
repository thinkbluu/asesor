import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { FEATURE_MATRIX, PLANS, SHOW_YEARLY, TRIAL_REQUIRES_CARD, getPlan } from "@/lib/plans"
import { SITE } from "@/lib/site"
import { PricingPlans, type PlanCard } from "@/components/marketing/pricing-plans"
import { CTA_BY_PLAN } from "@/components/marketing/pricing-teaser"
import { HOME_FAQ } from "@/components/marketing/faq"
import { MarketingMotion } from "@/components/marketing/marketing-motion"

const basic = getPlan("basic")
const pro = getPlan("pro")
const premium = getPlan("premium")

const planCards: PlanCard[] = PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  monthly: plan.monthly,
  yearly: plan.yearly,
  description: plan.description,
  features: [...plan.features],
  highlighted: "highlighted" in plan && plan.highlighted === true,
  cta: CTA_BY_PLAN[plan.id],
}))

const FAQS = [
  ...HOME_FAQ,
  {
    q: "Ce se întâmplă cu datele dacă renunț?",
    a: "Le poți exporta complet. După 30 de zile de la închiderea contului sunt șterse definitiv.",
  },
]

function cell(value: string) {
  if (value === "inclus") return <span className="y">inclus</span>
  if (value === "—") return <span className="no">—</span>
  return value
}

export const metadata: Metadata = {
  title: `Prețuri — ASESOR · de la ${basic.monthly} RON pe lună, 14 zile gratuit`,
  description: `Pachetele Basic, Pro și Premium: programări, clienți, echipă, stocuri și închiderea zilei. ${
    TRIAL_REQUIRES_CARD
      ? "Toate pachetele încep cu 14 zile gratuit. Nu plătești nimic dacă anulezi înainte."
      : "14 zile gratuit, fără card."
  }`,
}

export default function PreturiPage() {
  return (
    <main>
      <section className="phero">
        <div className="bg">
          <Image
            src="/img/obj-preturi.webp"
            alt="Trei sticluțe de ojă în mărimi crescătoare — nud, argintiu, negru — pe fond porțelan"
            fill
            priority
            sizes="(min-width: 761px) 54vw, 100vw"
          />
        </div>
        <div className="wrap in">
          <p className="eyebrow">Prețuri · facturare lunară, în RON</p>
          <h1 className="display">
            <span className="l">
              <span>Prețuri simple.</span>
            </span>
            <span className="l">
              <span>
                <em>Fără surprize.</em>
              </span>
            </span>
          </h1>
          <p className="lede">
            Alege pachetul potrivit pentru dimensiunea și nevoile salonului tău. Poți schimba oricând.{" "}
            {TRIAL_REQUIRES_CARD
              ? "Toate pachetele încep cu 14 zile gratuit. Nu plătești nimic dacă anulezi înainte."
              : "Toate încep cu 14 zile gratuit, fără card bancar."}
          </p>
        </div>
      </section>

      <section className="sec f-porc prices" style={{ paddingTop: "clamp(56px,6vw,90px)" }}>
        <div className="wrap">
          <PricingPlans plans={planCards} showYearly={SHOW_YEARLY} />
          <div className="foot-n">
            <span>Trei sticluțe, trei mărimi: alegi după câți oameni lucrează în salon, nu după câte funcții „ar trebui” să ai.</span>
          </div>
        </div>
      </section>

      <section className="sec f-sat prices">
        <div className="wrap">
          <div className="top">
            <h2 className="h2 rv">
              Ce primești
              <br />
              <em>în fiecare pachet.</em>
            </h2>
            <p className="lede rv">Tot ce e inclus în fiecare pachet, rând cu rând.</p>
          </div>
          <table className="cmp rv">
            <thead>
              <tr>
                <th scope="col" aria-label="Modul" />
                <th scope="col">Basic · {basic.monthly}</th>
                <th scope="col">Pro · {pro.monthly}</th>
                <th scope="col">Premium · {premium.monthly}</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td>{cell(row.basic)}</td>
                  <td>{cell(row.pro)}</td>
                  <td>{cell(row.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="soon rv">
            <h3>În curând</h3>
            <ul>
              <li>Mesaje SMS și WhatsApp</li>
              <li>Campanii pentru clienți</li>
              <li>Mai multe locații</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="sec f-porc faq">
        <div className="wrap grid">
          <h2 className="h2 rv">
            Întrebări
            <br />
            <em>frecvente.</em>
          </h2>
          <div className="rv">
            {FAQS.map((item, i) => (
              <details key={item.q} open={i === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="sec ink cta" id="discutie">
        <div className="wrap talk">
          <div>
            <p className="eyebrow rv" style={{ marginBottom: 26 }}>
              Nu ești sigur ce pachet ți se potrivește?
            </p>
            <h2 className="big rv">
              Hai să <em>vorbim.</em>
            </h2>
            <div className="ctas rv">
              <Link className="btn pri" href="/register">
                Începe gratuit <span className="ar">→</span>
              </Link>
              <Link className="btn ghost" href="/contact?subiect=demo">
                Programează un apel
              </Link>
            </div>
          </div>
          <div className="side rv">
            <p>Îți recomandăm varianta potrivită pentru salonul tău, fără presiune.</p>
            <p style={{ marginTop: 18 }}>
              <a className="tl" href={`mailto:${SITE.emails.contact}`}>
                {SITE.emails.contact}
              </a>
            </p>
            <p style={{ marginTop: 8, fontSize: 13.5 }}>Suport: {SITE.supportHours}</p>
          </div>
        </div>
      </section>

      <MarketingMotion />
    </main>
  )
}
