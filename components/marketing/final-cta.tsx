import Link from "next/link"
import { SITE } from "@/lib/site"

export function FinalCta() {
  return (
    <section className="sec ink cta" id="contact">
      <div className="wrap grid">
        <div>
          <p className="eyebrow rv" style={{ marginBottom: 26 }}>
            Gata de start?
          </p>
          <h2 className="big rv">
            14 zile gratuit.
            <br />
            <em>Fără obligații.</em>
          </h2>
          <div className="ctas rv">
            <Link className="btn pri" href="/register">
              Creează cont gratuit <span className="ar">→</span>
            </Link>
            <Link className="btn ghost" href="/contact?subiect=demo">
              Programează un demo
            </Link>
          </div>
        </div>
        <div className="side rv">
          <p>Configurezi salonul în 10 minute. Dacă nu ești convins, anulezi oricând.</p>
          <p style={{ marginTop: 18 }}>
            <a className="tl" href={`mailto:${SITE.emails.contact}`}>
              {SITE.emails.contact}
            </a>
          </p>
          <p style={{ marginTop: 8, fontSize: 13.5 }}>Suport: {SITE.supportHours}</p>
        </div>
      </div>
    </section>
  )
}
