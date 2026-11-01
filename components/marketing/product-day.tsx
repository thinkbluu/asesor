import Image from "next/image"

const KPIs = [
  { label: "Programări astăzi", value: "14" },
  { label: "Venituri astăzi", value: "2.340 lei" },
  { label: "Clienți noi săptămâna", value: "6" },
  { label: "Necesită confirmare", value: "2" },
]

const STAFF = [
  { name: "Andra", role: "Stilist" },
  { name: "Ioana", role: "Stilist" },
  { name: "Bianca", role: "Manichiuristă", span: "x3" },
  { name: "Mara", role: "Esteticiană", span: "x4" },
]

// [ora, coloana, clasă, titlu, clientă, status, înălțime px]
const APPOINTMENTS: [string, number, string, string, string, string, number][] = [
  ["09:00", 1, "fin", "Tuns dame", "Carmen D.", "Finalizat", 40],
  ["09:00", 2, "fin", "Vopsit rădăcini", "Elena V.", "Finalizat", 86],
  ["10:00", 3, "fin", "Manichiură gel", "Ana S.", "Finalizat", 40],
  ["10:00", 4, "fin", "Tratament facial", "Laura G.", "Finalizat", 63],
  ["11:00", 1, "prog", "Tuns dame", "Irina P.", "În desfășurare", 40],
  ["11:00", 3, "prog", "Manichiură gel", "Roxana T.", "În desfășurare", 63],
  ["12:00", 2, "conf", "Vopsit rădăcini", "Diana M. · online", "Confirmat", 86],
  ["12:00", 4, "conf", "Tratament facial", "Monica R.", "Confirmat", 63],
  ["13:00", 1, "conf", "Tuns dame", "online", "Confirmat", 40],
  ["13:00", 3, "wait", "Manichiură gel", "whatsapp", "În așteptare", 40],
  ["14:00", 4, "wait", "Tratament facial", "telefon", "În așteptare", 40],
]

const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"]

const STATS = [
  { label: "Total vizite", value: "23" },
  { label: "Total cheltuit", value: "4.180 lei" },
  { label: "Valoare medie", value: "182 lei" },
  { label: "Zile de la vizită", value: "28" },
  { label: "Stilist preferat", value: "Andra" },
  { label: "Loialitate", value: "418 puncte" },
]

export function ProductDay() {
  return (
    <section className="sec ink prod">
      <div className="wrap">
        <div className="top">
          <h2 className="h2 rv">
            Ziua salonului,
            <br />
            <em>pe un singur ecran.</em>
          </h2>
          <p className="lede rv">
            Vizualizarea pe zi pune fiecare specialist pe coloana lui. Fișa clientei e la un click: alergii, formula de
            culoare, câte vizite, cât a cheltuit, cum preferă să fie contactată.
          </p>
        </div>
        <div className="app rv" aria-label="Interfața ASESOR — Programări, vizualizare pe zi (date demo)">
          <aside className="side">
            <div className="b">
              <Image src="/img/asesor-mark.png" alt="" width={471} height={463} />
              ASESOR
            </div>
            <a href="#">Dashboard</a>
            <a className="on" href="#">
              Programări
            </a>
            <a className="sub on" href="#">
              Zi
            </a>
            <a className="sub" href="#">
              Săptămână
            </a>
            <a className="sub" href="#">
              Lună
            </a>
            <a className="sub" href="#">
              Listă
            </a>
            <a href="#">Clienți</a>
            <a href="#">Echipă</a>
            <a href="#">Stocuri</a>
            <a href="#">Financiar</a>
            <a href="#">
              Marketing <small>în curând</small>
            </a>
            <div className="s">Salon</div>
            <a href="#">Pagina publică</a>
            <a href="#">Setări</a>
          </aside>
          <div className="main">
            <div className="bar">
              <div>
                <h4>Programări</h4>
                <div className="d">marți, 3 noiembrie · 09:00–20:00</div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="seg">
                  <span className="on">Zi</span>
                  <span>Săptămână</span>
                  <span>Lună</span>
                  <span>Listă</span>
                </div>
                <span className="newb">+ Programare nouă</span>
              </div>
            </div>
            <div className="kpis">
              {KPIs.map((k) => (
                <div key={k.label}>
                  <small>{k.label}</small>
                  <b>{k.value}</b>
                </div>
              ))}
            </div>
            <div className="cal">
              <div className="hd" style={{ height: 44 }} />
              {STAFF.map((s) => (
                <div className={`hd ${s.span ?? ""}`} style={{ height: 44 }} key={s.name}>
                  <b>{s.name}</b>
                  <small>{s.role}</small>
                </div>
              ))}
              {HOURS.map((hour) => (
                <div key={hour} style={{ display: "contents" }}>
                  <div className="t">{hour}</div>
                  {[1, 2, 3, 4].map((col) => {
                    const ap = APPOINTMENTS.find((a) => a[0] === hour && a[1] === col)
                    return (
                      <div className={`c ${col === 3 ? "x3" : col === 4 ? "x4" : ""}`} key={col}>
                        {ap && (
                          <div className={`ap ${ap[2]}`} style={{ height: ap[6] }}>
                            <b>{ap[3]}</b>
                            {ap[4]}
                            <span className="st">{ap[5]}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="now" style={{ top: "calc(44px + 2.66*46px)" }} />
            </div>
          </div>
          <aside className="client">
            <div className="who">
              <div className="av">IP</div>
              <div>
                <b>Irina P.</b>
                <small>Client din 2024 · WhatsApp</small>
              </div>
            </div>
            <div className="tags">
              <span>Fidel</span>
              <span>Sensibil</span>
              <span>VIP</span>
            </div>
            <div className="blk">
              <h5>Alergii / Sensibilități</h5>
              <div className="al">Nu vrea vopsea cu amoniac.</div>
            </div>
            <div className="blk">
              <h5>Formule coloristice</h5>
              <div className="fm">
                7.3 + 7.0 (1:1)
                <br />
                oxidant 6% · 35 min
                <br />
                ultima: 6 octombrie
              </div>
            </div>
            <div className="blk">
              <h5>Istoric</h5>
              <div className="stats">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <small>{s.label}</small>
                    <b>{s.value}</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="blk">
              <h5>Galerie</h5>
              <div style={{ display: "flex", gap: 6 }}>
                <div
                  style={{
                    flex: 1,
                    aspectRatio: "1",
                    background: "#EDE7E1",
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    font: "500 9px/1 var(--mono)",
                    letterSpacing: ".1em",
                    color: "#8a8a8a",
                  }}
                >
                  ÎNAINTE
                </div>
                <div
                  style={{
                    flex: 1,
                    aspectRatio: "1",
                    background: "#E3DCD5",
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    font: "500 9px/1 var(--mono)",
                    letterSpacing: ".1em",
                    color: "#8a8a8a",
                  }}
                >
                  DUPĂ
                </div>
              </div>
            </div>
          </aside>
        </div>
        <div className="under">
          <div className="rv">
            <h3>Șase statusuri, nicio ghicitoare</h3>
            <p>
              Confirmat, în așteptare, în desfășurare, finalizat, anulat, no-show. Și de unde a venit fiecare programare:
              online, telefon, salon, WhatsApp.
            </p>
          </div>
          <div className="rv">
            <h3>Fișa care ține minte</h3>
            <p>Alergii, formule de culoare, galerie înainte și după, puncte de loialitate. Datele sensibile au criptare suplimentară.</p>
          </div>
          <div className="rv">
            <h3>Închidere zi</h3>
            <p>Numerar, card, transfer, bacșiș, comisioane. La final: casa bate cu sistemul.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
