import Link from "next/link"
import { SITE } from "@/lib/site"

export function Safety() {
  return (
    <section className="sec ink g safe">
      <div className="wrap">
        <div className="top">
          <h2 className="h2 rv">
            Datele tale
            <br />
            <em>(și ale clienților tăi)</em>
            <br />
            sunt în siguranță.
          </h2>
          <p className="lede rv">Fișele clientelor, alergiile și formulele rămân doar ale tale.</p>
        </div>
        <dl>
          <div className="rv">
            <dt>Păstrate în Uniunea Europeană</dt>
            <dd>Conform GDPR, fără să faci tu nimic în plus.</dd>
          </div>
          <div className="rv">
            <dt>Le vede doar echipa ta</dt>
            <dd>Fiecare om vede doar ce-i trebuie. Alergiile le văd doar specialiștii.</dd>
          </div>
          <div className="rv">
            <dt>Nu le pierzi niciodată</dt>
            <dd>
              {SITE.dailyBackups
                ? "Copie de siguranță în fiecare zi. Le poți descărca oricând."
                : "Le poți descărca oricând, complete."}
            </dd>
          </div>
        </dl>
        <p className="safe lnk">
          <Link className="tl" href="/dpa">
            Detalii pentru cei curioși
          </Link>
        </p>
      </div>
    </section>
  )
}
