import Image from "next/image"

// Exported for /functionalitati, which reuses the same still-life objects
// and digital-twin cards one per module section.
export const OBJECTS = [
  {
    cls: "o1",
    src: "/img/obj-programari.webp",
    alt: "Agendă de programări din hârtie, plină de tăieturi în creion",
    caption: "Agenda de hârtie",
    num: "i",
    twin: (
      <>
        <div className="h">
          <span>Programare</span>
          <span>marți</span>
        </div>
        <span className="m">10:30</span> · <b>Vopsit rădăcini</b> · Ioana
        <br />
        <span className="ok">Confirmat</span> · email trimis
      </>
    ),
  },
  {
    cls: "o2",
    src: "/img/obj-clienti.webp",
    alt: "Fișă de client din carton crem cu o mostră de șuvițe prinsă cu o agrafă",
    caption: "Fișa și mostra de culoare",
    num: "ii",
    twin: (
      <>
        <div className="h">
          <span>Fișă client</span>
          <span>Fidel</span>
        </div>
        Alergii: <b>nu vrea vopsea cu amoniac</b>
        <hr />
        <span className="m">7.3 + 7.0 · 6% · 35 min</span>
      </>
    ),
  },
  {
    cls: "o3",
    src: "/img/obj-echipa.webp",
    alt: "Două foarfeci, un pieptene și două clame de secționat, aliniate",
    caption: "Sculele echipei",
    num: "iii",
    twin: (
      <>
        <div className="h">
          <span>Echipă azi</span>
        </div>
        <div className="kv">
          <span>Andra</span>
          <span className="m">6 prog.</span>
        </div>
        <div className="kv">
          <span>Bianca</span>
          <span className="m">5 prog.</span>
        </div>
      </>
    ),
  },
  {
    cls: "o4",
    src: "/img/obj-stocuri.webp",
    alt: "Tub de vopsea, castron de amestec cu pensulă și trei sticluțe de ojă",
    caption: "Raftul de produse",
    num: "iv",
    twin: (
      <>
        <div className="h">
          <span>Stoc</span>
          <span className="warn">scăzut</span>
        </div>
        <b>Oxidant 6% · 1000 ml</b>
        <br />
        <span className="m">rămas 2 buc · comandă sugerată</span>
      </>
    ),
  },
  {
    cls: "o5",
    src: "/img/obj-financiar.webp",
    alt: "Rolă de bon termic desfășurată pe un fond negru lucios",
    caption: "Rola de casă",
    num: "v",
    twin: (
      <>
        <div className="h">
          <span>Închidere zi</span>
        </div>
        <div className="kv">
          <span>Card</span>
          <span className="m">1.610 lei</span>
        </div>
        <div className="kv">
          <span>Numerar</span>
          <span className="m">730 lei</span>
        </div>
        <hr />
        <span className="ok">Casa bate cu sistemul.</span>
      </>
    ),
  },
  {
    cls: "o6",
    src: "/img/obj-marketing.webp",
    alt: "Felicitare și plic crem, cu o crenguță de gipsofilă legată cu panglică verde",
    caption: "Felicitarea",
    num: "vi",
    twin: (
      <>
        <div className="h">
          <span>Recenzii</span>
        </div>
        Mulțumire post-vizită
        <br />
        <span className="m">trimisă azi la 19:00</span>
      </>
    ),
  },
] as const

const ROWS = [
  {
    n: "i.",
    title: "Programări inteligente",
    text: "Calendar pe zi, săptămână, lună. Programări online 24/7. Confirmare și reamintire pe email. Reguli de anulare.",
    result: "Mai puține apeluri. Mai puține anulări.",
  },
  {
    n: "ii.",
    title: "Clienți & CRM",
    text: "Fișă completă: istoric, formule, preferințe și note — „nu vrea vopsea cu amoniac”. Segmente: nou, fidel, inactiv.",
    result: "Clienți care se simt cunoscuți și apreciați.",
  },
  {
    n: "iii.",
    title: "Echipă & Performanță",
    text: "Program individual, servicii alocate, comision fix sau procentual, roluri pentru proprietar, manager, specialist și recepție.",
    result: "Fiecare știe ce are de făcut.",
  },
  {
    n: "iv.",
    title: "Stocuri & Produse",
    text: "Ce ai, ce consumă fiecare serviciu (1 tuns = X ml șampon), ce trebuie comandat. Alertă automată la stoc scăzut.",
    result: "Nu mai rămâi fără vopsea vineri seara.",
  },
  {
    n: "v.",
    title: "Financiar & Rapoarte",
    text: "Venituri pe zi, săptămână, lună. Pe fiecare specialist și serviciu. Închiderea zilei. Export CSV pentru contabil.",
    result: "Știi exact unde ești.",
  },
  {
    n: "vi.",
    title: "Loialitate & recenzii",
    text: "Mulțumire după vizită cu cerere de recenzie, puncte de loialitate la fiecare vizită, reamintire cu o zi înainte. Campanii de reactivare și zile de naștere: în curând.",
    result: "Clienți care revin. Recenzii care vin.",
  },
] as const

export function ModuleBoard() {
  return (
    <section className="sec f-porc desk" id="module" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="top">
          <h2 className="h2 rv">
            Șase module.
            <br />
            <em>O singură recepție.</em>
          </h2>
          <p className="lede rv">
            Tot ce stătea pe biroul de la intrare — agenda, fișele, sculele, stocul, rola de casă, felicitările — își
            găsește locul. Fiecare obiect primește pereche în ASESOR.
          </p>
        </div>
        <div className="table-pin">
          <div className="table">
            <ol className="rows">
              {ROWS.map((r) => (
                <li key={r.n}>
                  <span className="n">{r.n}</span>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.text}</p>
                    <p className="res">
                      <i>Rezultat</i>
                      {r.result}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="board" aria-label="Biroul de recepție: șase obiecte, câte unul pentru fiecare modul">
              {OBJECTS.map((o) => (
                <figure className={`obj ${o.cls}`} key={o.cls}>
                  <Image src={o.src} alt={o.alt} width={1024} height={1024} sizes="(min-width: 1101px) 30vw, (min-width: 761px) 45vw, 50vw" />
                  <figcaption>
                    <i>{o.num}</i>
                    {o.caption}
                  </figcaption>
                  <div className="twin">{o.twin}</div>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
