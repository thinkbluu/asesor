import type { Metadata } from "next"
import Image from "next/image"
import { OBJECTS } from "@/components/marketing/module-board"
import { FinalCta } from "@/components/marketing/final-cta"
import { MarketingMotion } from "@/components/marketing/marketing-motion"

const MODULES = [
  {
    id: "programari",
    num: "i.",
    title: "Programări",
    items: [
      "Vizualizare pe zi, săptămână și lună",
      "Muti o programare trăgând-o",
      "Aplicația nu te lasă să suprapui doi clienți la același om",
      "Programări recurente",
      "Șase statusuri și sursa fiecărei programări",
      "Recepția și specialiștii văd schimbările în timp real",
      "Pagina publică de programare, cu logo și culoare proprii",
      "Confirmare și reamintire pe email",
    ],
  },
  {
    id: "clienti",
    num: "ii.",
    title: "Clienți",
    items: [
      "Istoric de vizite și servicii",
      "Alergii și formule de culoare, vizibile doar specialiștilor",
      "Galerie înainte și după, cu acordul clientei",
      "Etichete și note",
      "Import din Excel sau CSV",
      "Export și ștergere la cerere",
    ],
  },
  {
    id: "echipa",
    num: "iii.",
    title: "Echipă",
    items: [
      "Program săptămânal pe om",
      "Cereri de concediu aprobate de tine",
      "Servicii și prețuri diferite pe specialist",
      "Comision procentual, fix sau salariu",
      "Fiecare își vede propriile cifre",
      "Roluri: proprietar, manager, specialist, recepție",
    ],
  },
  {
    id: "stocuri",
    num: "iv.",
    title: "Stocuri",
    items: [
      "Stoc minim pe produs",
      "Consum automat la fiecare serviciu finalizat",
      "Recepție de marfă pe factură",
      "Inventar cu diferențe",
      "Listă de comandat pe furnizor",
    ],
  },
  {
    id: "financiar",
    num: "v.",
    title: "Financiar",
    items: [
      "Încasare la final de programare: numerar, card sau transfer, cu reduceri și baciș",
      "Cheltuieli cu poză după bon",
      "Închiderea zilei cu diferența de numerar",
      "Rapoarte pe zi, specialist și serviciu",
      "Export CSV pentru contabil",
    ],
  },
  {
    id: "loialitate",
    num: "vi.",
    title: "Loialitate & recenzii",
    items: [
      "Puncte la fiecare vizită, niveluri și recompense",
      "Cerere de părere după vizită",
      "Clienții mulțumiți sunt trimiși spre Google, ceilalți îți scriu ție direct",
    ],
  },
]

export const metadata: Metadata = {
  title: "Funcționalități — ASESOR · programări, clienți, echipă, stocuri, financiar, loialitate",
  description:
    "Fiecare modul înlocuiește un obiect de pe biroul de la recepție: programări, fișe de client, echipă, stocuri, încasări și loialitate. Le folosești pe toate sau doar pe cele de care ai nevoie.",
}

export default function FunctionalitatiPage() {
  return (
    <main>
      <section className="phero pow">
        <div className="wrap in">
          <p className="eyebrow">Funcționalități</p>
          <h1 className="display">
            <span className="l">
              <span>Tot ce face ASESOR,</span>
            </span>
            <span className="l">
              <span>
                <em>pe module.</em>
              </span>
            </span>
          </h1>
          <p className="lede">
            Fiecare modul înlocuiește un obiect de pe biroul de la recepție. Le folosești pe toate sau doar pe cele de
            care ai nevoie.
          </p>
        </div>
      </section>

      {MODULES.map((mod, i) => {
        const obj = OBJECTS[i]
        return (
          <section className={`sec mod ${i % 2 === 1 ? "f-pow rev" : "f-porc"}`} id={mod.id} key={mod.id}>
            <div className="wrap">
              <div className="grid">
                <div>
                  <p className="num rv">{mod.num}</p>
                  <h2 className="rv">{mod.title}</h2>
                  <ul className="rv">
                    {mod.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mcol">
                  <figure className="mobj rv">
                    <Image
                      src={obj.src}
                      alt={obj.alt}
                      width={1024}
                      height={1024}
                      sizes="(min-width: 1101px) 40vw, (min-width: 761px) 50vw, 100vw"
                    />
                    <figcaption>
                      <i>{obj.num}</i>
                      {obj.caption}
                    </figcaption>
                    <div className="twin">{obj.twin}</div>
                  </figure>
                </div>
              </div>
            </div>
          </section>
        )
      })}

      <section className="sec f-pow">
        <div className="wrap soon">
          <h3 className="rv">În curând</h3>
          <ul className="rv">
            <li>Mesaje SMS și WhatsApp</li>
            <li>Campanii de reactivare și zile de naștere</li>
            <li>Mai multe locații sub același cont</li>
          </ul>
        </div>
      </section>

      <FinalCta />
      <MarketingMotion />
    </main>
  )
}
