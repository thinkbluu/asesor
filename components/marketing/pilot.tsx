import { SITE } from "@/lib/site"

export function Pilot() {
  return (
    <section className="sec f-porc pilot" id="demo">
      <div className="wrap">
        <p className="eyebrow rv" style={{ marginBottom: 28 }}>
          Poți fi printre primii
        </p>
        <h2 className="big rv">
          Nu-ți promitem 200 de clienți fericiți. <em>Îți promitem altceva.</em>
        </h2>
        <div className="grid">
          <p className="lede rv">
            Îți punem la dispoziție o echipă gata să te ajute să integrezi totul — de la servicii și prețuri până la
            clientela din caiet.
          </p>
          <ul className="rv">
            <li>
              Onboarding personalizat<span>inclus</span>
            </li>
            <li>
              Acces direct la echipa de produs<span>inclus</span>
            </li>
            <li>
              Fără contract — plătești lunar, anulezi oricând<span>inclus</span>
            </li>
            <li>
              Vorbește cu noi — răspundem în maxim {SITE.responseTime}
              <span>
                <a
                  className="tl"
                  href={`mailto:${SITE.emails.contact}`}
                  style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)" }}
                >
                  {SITE.emails.contact}
                </a>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
