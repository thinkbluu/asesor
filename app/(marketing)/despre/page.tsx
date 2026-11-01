import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SITE } from "@/lib/site"
import { MarketingMotion } from "@/components/marketing/marketing-motion"

export const metadata: Metadata = {
  title: "Despre — De ce există ASESOR",
  description:
    "Am văzut de aproape cum se conduce un salon: agenda de hârtie la recepție, stocurile ținute minte, comisioanele calculate duminică seara. ASESOR e un singur loc pentru tot.",
}

export default function DesprePage() {
  return (
    <main>
      <section className="phero pow">
        <div className="wrap in">
          <p className="eyebrow kick">Despre</p>
          <h1 className="display">
            <span className="l">
              <span>De ce există</span>
            </span>
            <span className="l">
              <span>
                <em>ASESOR.</em>
              </span>
            </span>
          </h1>
        </div>
      </section>

      <section className="sec f-porc">
        <div className="wrap dgrid">
          <figure className="dimg rv">
            <Image
              src="/img/obj-hero.webp"
              alt="Agendă de salon îmbrăcată în pânză, foarfecă argintie, pieptene negru și o sticluță de ojă verde-smarald, pe fond nud"
              width={1024}
              height={1280}
              sizes="(min-width: 1101px) 38vw, 100vw"
            />
          </figure>
          <div className="drows">
            <div className="drow rv">
              <h2>Agenda de la recepție</h2>
              <p>
                Am văzut de aproape cum se conduce un salon: agenda de hârtie la recepție,
                stocurile ținute minte, comisioanele calculate duminică seara. Există aplicații
                pentru câte o bucată din problemă. Noi am vrut un singur loc pentru tot.
              </p>
            </div>
            <div className="drow rv">
              <h2>Cum lucrăm</h2>
              <p>
                Nu inventăm cifre și nu publicăm recenzii pe care nu le avem. Construim împreună
                cu saloanele din programul pilot și schimbăm aplicația după ce ne spun ele.
                Datele rămân ale salonului, mereu.
              </p>
            </div>
            <div className="drow rv">
              <h2>Cine suntem</h2>
              <p>ASESOR e dezvoltat în Timișoara de {SITE.legalEntity}.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec ink cta">
        <div className="wrap talk">
          <div>
            <h2 className="big rv">
              Hai să <em>vorbim.</em>
            </h2>
            <div className="ctas rv">
              <Link className="btn pri" href="/contact">
                Vorbește cu noi <span className="ar">→</span>
              </Link>
            </div>
          </div>
          <div className="side rv">
            <p>Îți răspundem în maxim {SITE.responseTime}.</p>
          </div>
        </div>
      </section>

      <MarketingMotion />
    </main>
  )
}
