import type { Metadata } from "next"
import Link from "next/link"
import { MarketingMotion } from "@/components/marketing/marketing-motion"

const SEGMENTS = [
  {
    title: "Profesioniști care lucrează singuri",
    plan: "Basic",
    text: "Agenda, clientele și încasările tale, fără să mai răspunzi la telefon între două programări.",
    examples: [
      "Clienții se programează singuri cât lucrezi",
      "Vezi ce formulă ai folosit data trecută",
      "Știi la final de lună cât ai încasat",
    ],
  },
  {
    title: "Saloane cu echipe de 5+",
    plan: "Pro",
    text: "Control fără micromanagement: cine lucrează, ce, cu cine și cât aduce.",
    examples: ["Comisioane calculate automat", "Concedii fără suprapuneri", "Recepția programează fără să întrebe"],
  },
  {
    title: "Hair, beauty și nails sub același acoperiș",
    plan: "Pro sau Premium",
    text: "Mai multe tipuri de servicii, mai mulți specialiști, un singur calendar.",
    examples: [
      "Stoc separat pe categorii",
      "Servicii cu durate și prețuri pe specialist",
      "Rapoarte pe fiecare tip de serviciu",
    ],
  },
  {
    title: "Spații unde experiența contează",
    plan: "Pro sau Premium",
    text: "Clienta e întâmpinată pe nume, cu formula și preferințele ei deja știute.",
    examples: [
      "Fișa clientei deschisă înainte să intre",
      "Puncte de loialitate",
      "Recenzii cerute la momentul potrivit",
    ],
  },
]

export const metadata: Metadata = {
  title: "Pentru cine e ASESOR · de la un singur scaun la o echipă întreagă",
  description:
    "ASESOR pentru profesioniști care lucrează singuri, saloane cu echipe de 5+, hair, beauty și nails sub același acoperiș și spații unde experiența contează.",
}

export default function PentruCinePage() {
  return (
    <main>
      <section className="phero pow">
        <div className="wrap in">
          <p className="eyebrow">Pentru cine</p>
          <h1 className="display">
            <span className="l">
              <span>Pentru cine</span>
            </span>
            <span className="l">
              <span>
                <em>e ASESOR.</em>
              </span>
            </span>
          </h1>
          <p className="lede">De la un singur scaun la o echipă întreagă.</p>
        </div>
      </section>

      <section className="sec f-porc fit">
        <div className="wrap">
          <div className="frows">
            {SEGMENTS.map((s) => (
              <div className="frow rv" key={s.title}>
                <div>
                  <h3>{s.title}</h3>
                  <p className="ptag">{s.plan}</p>
                </div>
                <div>
                  <p>{s.text}</p>
                  <ul className="ex">
                    {s.examples.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <p className="sum rv">
            Nu te regăsești aici?{" "}
            <Link className="tl" href="/contact">
              Scrie-ne
            </Link>{" "}
            și îți spunem sincer dacă ASESOR îți folosește.
          </p>
        </div>
      </section>

      <MarketingMotion />
    </main>
  )
}
