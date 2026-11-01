import { TRIAL_REQUIRES_CARD } from "@/lib/plans"

const FAQ = [
  {
    q: "Pot testa gratuit?",
    a: TRIAL_REQUIRES_CARD
      ? "Da. Ai 14 zile cu toate funcțiile pachetului ales. Nu plătești nimic dacă anulezi înainte."
      : "Da. Ai 14 zile să explorezi platforma, fără card bancar și fără obligații.",
  },
  {
    q: "Ce se întâmplă după perioada de test?",
    a: TRIAL_REQUIRES_CARD
      ? "Abonamentul pornește pe pachetul ales. Îl poți anula oricând din cont."
      : "Alegi un pachet sau contul rămâne inactiv. Datele tale sunt păstrate 30 de zile.",
  },
  { q: "Pot schimba pachetul ulterior?", a: "Oricând. Upgrade instant, downgrade la finalul perioadei de facturare." },
  { q: "Există contracte pe termen lung?", a: "Nu. Plătești lunar. Poți anula oricând." },
  {
    q: "Ce metode de plată acceptați?",
    a: "Card bancar (Visa, Mastercard). Pentru plata anuală prin transfer bancar, scrie-ne.",
  },
]

export function Faq() {
  return (
    <section className="sec f-porc faq">
      <div className="wrap grid">
        <h2 className="h2 rv">
          Întrebări
          <br />
          <em>frecvente.</em>
        </h2>
        <div className="rv">
          {FAQ.map((item, i) => (
            <details key={item.q} open={i === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
