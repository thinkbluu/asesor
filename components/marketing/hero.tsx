import Image from "next/image"
import Link from "next/link"
import { getPlan, TRIAL_REQUIRES_CARD } from "@/lib/plans"

const basic = getPlan("basic")

export function Hero() {
  return (
    <section className="hero">
      <div className="bg">
        <Image
          src="/img/obj-hero.webp"
          alt="Agendă de salon îmbrăcată în pânză, foarfecă argintie, pieptene negru și o sticluță de ojă verde-smarald, pe fond nud"
          fill
          priority
          sizes="(min-width: 761px) 60vw, 100vw"
        />
      </div>
      <div className="wrap in">
        <p className="eyebrow kick">Gestionare salon — simplu, elegant, complet</p>
        <h1 className="display">
          <span className="l">
            <span>Salonul tău</span>
          </span>
          <span className="l">
            <span>merge mai bine</span>
          </span>
          <span className="l">
            <span>
              <em>când totul e clar.</em>
            </span>
          </span>
        </h1>
        <div className="row">
          <p className="lede">Programări, clienți, echipă, stocuri, venituri — totul centralizat. Fără haos. Fără surprize.</p>
          <div className="ctas">
            <Link className="btn pri" href="/register">
              Începe gratuit <span className="ar">→</span>
            </Link>
            <Link className="btn ghost" href="/contact?subiect=demo">
              Programează un demo
            </Link>
          </div>
        </div>
        <div className="facts">
          <div className="fact">
            <b>14 zile</b>
            <span>{TRIAL_REQUIRES_CARD ? "gratuit, anulezi oricând" : "gratuit, fără card bancar"}</span>
          </div>
          <div className="fact">
            <b>~10 minute</b>
            <span>ca să-ți configurezi salonul</span>
          </div>
          <div className="fact">
            <b>Frankfurt</b>
            <span>date găzduite în UE, conform GDPR</span>
          </div>
          <div className="fact">
            <b>{basic.monthly} RON</b>
            <span>pe lună, pachetul de start</span>
          </div>
        </div>
      </div>
    </section>
  )
}
