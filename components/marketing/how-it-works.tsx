export function HowItWorks() {
  return (
    <section className="sec f-porc how" id="cum">
      <div className="wrap">
        <div className="top">
          <h2 className="h2 rv">
            Cum <em>începi</em>.
          </h2>
          <p className="lede rv">Trei pași. Primul durează cât o cafea, al doilea merge singur, al treilea îl faci seara.</p>
        </div>
        <div className="steps">
          <ol>
            <li className="rv">
              <span className="n">01</span>
              <div>
                <h3>Configurezi salonul</h3>
                <p>
                  Adaugi serviciile, prețurile, programul de lucru și echipa. Dacă ai deja date într-un Excel, caiet sau
                  alt sistem — te ajutăm să le muți.
                </p>
                <span className="k">~10 minute</span>
              </div>
            </li>
            <li className="rv">
              <span className="n">02</span>
              <div>
                <h3>Clienții se programează singuri</h3>
                <p>
                  Partajezi link-ul de programări pe Instagram, WhatsApp sau direct de pe Google Maps. Clienții aleg
                  serviciul, ora și specialistul. Confirmarea vine automat.
                </p>
                <span className="k">Funcționează 24/7, inclusiv când dormi</span>
              </div>
            </li>
            <li className="rv">
              <span className="n">03</span>
              <div>
                <h3>Tu vezi rezultatele</h3>
                <p>La finalul zilei, deschizi raportul: câți clienți, câte servicii, cât ai încasat. Fără foi, fără calcule.</p>
                <span className="k">Seară de seară, în 2 minute</span>
              </div>
            </li>
          </ol>
          <div>
            <div className="phone rv" aria-label="Pagina publică de programare, pasul Alege data și ora">
              <div className="scr">
                <div className="url">asesor.ro/booking/salonul-tau</div>
                <div className="sal">
                  <div className="lg">s</div>
                  <div>
                    <b>Salonul tău</b>
                    <small>Programare online</small>
                  </div>
                </div>
                <div className="stp">
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                  <i />
                </div>
                <div className="q">Alege data și ora</div>
                <div className="chosen">
                  <b>Vopsit rădăcini</b> · 120 min
                  <br />
                  cu <b>Ioana</b> · sau Fără preferință
                </div>
                <div className="days">
                  <span>
                    Lu<b>2</b>
                  </span>
                  <span className="on">
                    Ma<b>3</b>
                  </span>
                  <span>
                    Mi<b>4</b>
                  </span>
                  <span>
                    Jo<b>5</b>
                  </span>
                  <span>
                    Vi<b>6</b>
                  </span>
                </div>
                <div className="per">Dimineața</div>
                <div className="slots">
                  <span className="x">09:00</span>
                  <span className="x">09:30</span>
                  <span>10:30</span>
                </div>
                <div className="per">După-amiază</div>
                <div className="slots">
                  <span className="on">15:00</span>
                  <span>15:30</span>
                  <span>16:00</span>
                </div>
                <div className="per">Seara</div>
                <div className="slots">
                  <span>18:00</span>
                  <span>18:30</span>
                  <span className="x">19:00</span>
                </div>
                <div className="go">Continuă — Datele tale</div>
              </div>
            </div>
            <p className="phone-cap">
              Pagina publică a salonului: serviciul → specialistul → data și ora → datele tale. Logo și culoare proprii.
            </p>
          </div>
        </div>
        <p className="steps mig rv" style={{ display: "block" }}>
          Vii de pe agendă, Excel sau Booksy? Mutăm datele împreună cu tine.
        </p>
      </div>
    </section>
  )
}
