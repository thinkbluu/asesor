import { MarketingLayout } from "@/components/marketing/marketing-layout"

export const metadata = {
  title: "Termeni și condiții — ASESOR",
  description: "Termenii și condițiile de utilizare a platformei ASESOR.",
}

export default function TermsPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        <div className="mb-8 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Draft.</strong> Acest document este un draft. Consultă un avocat înainte de lansarea publică.
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">Termeni și condiții</h1>
        <p className="mb-10 text-sm text-muted-foreground">Ultima actualizare: aprilie 2025</p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">1. Definiții</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li><strong className="text-foreground">ASESOR / Furnizor</strong> — ASESOR SRL, furnizorul platformei.</li>
          <li><strong className="text-foreground">Utilizator / Abonat</strong> — persoana fizică sau juridică care creează un cont și utilizează platforma.</li>
          <li><strong className="text-foreground">Client final</strong> — clientul salonului gestionat de Abonat prin intermediul platformei.</li>
          <li><strong className="text-foreground">Serviciul</strong> — platforma software ASESOR accesibilă la asesor.ro.</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">2. Serviciul oferit</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          ASESOR furnizează o platformă SaaS pentru gestionarea salonelor de înfrumusețare, incluzând funcționalități de programări, gestiune clienți, stocuri, financiar și marketing. Platforma este furnizată „ca atare" și poate fi modificată fără notificare prealabilă, cu excepția modificărilor materiale.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">3. Înregistrare și responsabilități</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Utilizatorul este responsabil pentru acuratețea datelor furnizate la înregistrare, pentru securitatea credențialelor de acces și pentru toate activitățile desfășurate sub contul său. ASESOR nu răspunde pentru pierderi cauzate de accesul neautorizat rezultat din neglijența utilizatorului.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">4. Prețuri, facturare și TVA</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Prețurile sunt afișate pe pagina <a href="/preturi" className="text-emerald-600 underline dark:text-emerald-400">/preturi</a> și sunt exprimate în RON, fără TVA. TVA se aplică în cotă standard de <strong className="text-foreground">21%</strong> pentru persoane juridice și fizice din România. Facturarea se face lunar sau anual, în avans. Neplata la termen poate duce la suspendarea contului.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">5. Perioada de probă</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Fiecare cont nou beneficiază de o perioadă de probă gratuită de <strong className="text-foreground">14 zile</strong>, fără obligația furnizării datelor de card. La expirarea perioadei de probă, contul trece automat în plan gratuit limitat sau necesită selectarea unui abonament plătit.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">6. Reînnoire automată și anulare</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Abonamentele se reînnoiesc automat la sfârșitul perioadei de facturare. Utilizatorul poate anula oricând din setările contului. Anularea intră în vigoare la finalul perioadei de facturare curente. Nu se emit rambursări pro-rata pentru perioadele neutilizate, cu excepția cazurilor prevăzute la secțiunea 7.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">7. Politica de rambursare</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Rambursările se acordă exclusiv în cazul unor defecțiuni tehnice majore atribuibile ASESOR, care au împiedicat utilizarea serviciului mai mult de 72 de ore consecutive într-o lună de facturare. Solicitările se transmit la <a href="mailto:facturare@asesor.ro" className="text-emerald-600 underline dark:text-emerald-400">facturare@asesor.ro</a> în termen de 14 zile de la incident.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">8. Proprietate intelectuală</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Platforma ASESOR, codul sursă, designul, logo-urile și toate materialele asociate sunt proprietatea exclusivă a ASESOR SRL și sunt protejate de legislația privind drepturile de autor. Utilizatorul primește o licență limitată, non-exclusivă, netransferabilă, pentru utilizarea serviciului conform prezentelor termeni.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">9. Limitarea răspunderii</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Răspunderea totală a ASESOR față de un utilizator, pentru orice cauză, este limitată la suma plătită de utilizator în ultimele <strong className="text-foreground">12 luni</strong> calendaristice anterioare evenimentului generator de prejudiciu. ASESOR nu răspunde pentru pierderi indirecte, daune consecvente sau pierdere de profit.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">10. Suspendare și reziliere</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          ASESOR poate suspenda sau rezilia un cont în cazul încălcării prezentelor termeni, al neplății, al utilizării abuzive sau al solicitării autorităților competente. Utilizatorul va fi notificat cu cel puțin 7 zile înainte, cu excepția situațiilor urgente (ex. activitate ilegală).
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">11. Lege aplicabilă și jurisdicție</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Prezentul contract este guvernat de legislația română. Orice litigiu se va soluționa pe cale amiabilă sau, în lipsă, prin instanțele competente din <strong className="text-foreground">Timișoara, România</strong>.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">Contact</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          <a href="mailto:legal@asesor.ro" className="text-emerald-600 underline dark:text-emerald-400">legal@asesor.ro</a>
        </p>
      </main>
    </MarketingLayout>
  )
}
