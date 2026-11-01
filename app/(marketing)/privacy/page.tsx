import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { LegalDocHeader } from "@/components/legal/legal-doc-header"
import { SITE } from "@/lib/site"

export const metadata = {
  title: "Politica de confidențialitate — ASESOR",
  description: "Cum colectăm, utilizăm și protejăm datele tale personale.",
}

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        <LegalDocHeader
          doc="privacy"
          title="Politica de confidențialitate"
          lead="Această politică descrie datele personale prelucrate de ASESOR în calitate de operator, precum și modul în care sunt protejate datele clienților saloanelor, prelucrate de ASESOR în calitate de persoană împuternicită."
        />

        <h2 className="mb-3 mt-10 text-xl font-semibold">1. Identitatea operatorului</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">{SITE.legalEntity}</strong>, CUI: {SITE.cui}, nr. reg. comerț: {SITE.regCom}, sediu: {SITE.address}
          <br />
          Contact DPO:{" "}
          <a href={`mailto:${SITE.emails.dpo}`} className="text-emerald-600 underline dark:text-emerald-400">
            {SITE.emails.dpo}
          </a>
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">2. Rolurile noastre</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          ASESOR acționează în două roluri distincte:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Operator</strong> — pentru datele utilizatorilor platformei (conturi de salon), datele
            vizitatorilor site-ului public și datele de marketing.
          </li>
          <li>
            <strong className="text-foreground">Persoană împuternicită (Processor)</strong> — pentru datele clienților finali ai saloanelor,
            introduse de saloane în platformă. Prelucrarea se face exclusiv pe instrucțiunile salonului, conform Acordului de prelucrare a
            datelor (<a href="/dpa" className="text-emerald-600 underline dark:text-emerald-400">/dpa</a>).
          </li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">3. Ce date colectăm</h2>
        <p className="mb-2 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Utilizatori ai platformei (saloane):</strong> adresă de email, nume complet, număr de telefon,
          date de facturare (adresă, CUI), conținutul introdus în platformă (programări, servicii, clienți, stocuri, financiar), loguri de
          utilizare și jurnal de audit al acțiunilor sensibile.
        </p>
        <p className="mb-2 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Vizitatori ai site-ului public:</strong> date tehnice agregate (pagini vizitate, țară, tip de
          dispozitiv) colectate prin Vercel Analytics <strong className="text-foreground">doar după consimțământul exprimat în bannerul de
          cookie-uri</strong>. Fără consimțământ, nu se încarcă nicio unealtă de măsurare.
        </p>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Clienți finali ai saloanelor:</strong> datele de contact și programările sunt introduse și
          gestionate de salon. Salonul poate alege să înregistreze și <strong className="text-foreground">date privind sănătatea</strong>
          {" "}(alergii, formule de culoare) — categorie specială conform art. 9 GDPR — criptate câmp cu câmp și vizibile doar rolurilor
          autorizate. ASESOR nu utilizează aceste date în alt scop decât furnizarea serviciului.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">4. Baza legală</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li><strong className="text-foreground">Executarea contractului</strong> — furnizarea serviciului (art. 6(1)(b) GDPR).</li>
          <li><strong className="text-foreground">Interes legitim</strong> — securitate, prevenirea fraudei și a abuzului, îmbunătățirea serviciului (art. 6(1)(f) GDPR).</li>
          <li><strong className="text-foreground">Consimțământ</strong> — analytics pe site-ul public, comunicări de marketing (art. 6(1)(a) GDPR, retras oricând).</li>
          <li><strong className="text-foreground">Obligație legală</strong> — date fiscale și contabile (art. 6(1)(c) GDPR).</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">5. Scopul prelucrării</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Crearea și gestionarea contului de utilizator și a salonului.</li>
          <li>Furnizarea, securizarea și îmbunătățirea serviciului ASESOR.</li>
          <li>Facturare și colectare plăți pentru abonament.</li>
          <li>Suport tehnic și asistență clienți.</li>
          <li>Comunicări privind modificări ale serviciului sau ale prezentei politici.</li>
          <li>Marketing direct (doar cu consimțământ).</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">6. Durata de stocare</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Date de cont și datele salonului: șterse definitiv la <strong className="text-foreground">30 de zile</strong> după solicitarea de închidere a contului (perioadă de anulare a ștergerii).</li>
          <li>Date fiscale și de facturare: păstrate conform legislației contabile române.</li>
          <li>Jurnal de audit (audit_log): <strong className="text-foreground">24 de luni</strong>.</li>
          <li>Loguri de mesaje trimise (message_log): <strong className="text-foreground">12 luni</strong>.</li>
          <li>Răspunsuri de feedback (feedback_requests): <strong className="text-foreground">12 luni</strong>.</li>
          <li>Înregistrări de limitare a ratei (rate_limits): <strong className="text-foreground">2 zile</strong>.</li>
          <li>Date de sănătate înregistrate de salon: cât timp salonul le păstrează; șterse odată cu salonul sau la cererea salonului.</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">7. Drepturile tale</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          În calitate de operator, îți putem satisface următoarele drepturi: acces, rectificare, ștergere, restricționare, portabilitate,
          opoziție și retragerea consimțământului. Solicitările se trimit la{" "}
          <a href={`mailto:${SITE.emails.dpo}`} className="text-emerald-600 underline dark:text-emerald-400">{SITE.emails.dpo}</a> și se
          răspunde în termen de 30 de zile. Pentru datele clienților finali, drepturile se exercită față de salonul respectiv, în calitate
          de operator; ASESOR asistă salonul la solicitări.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">8. Securitate și împuterniciți</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Măsurile de securitate implementate (criptare, controlul accesului pe roluri, izolarea datelor per salon, jurnal de audit,
          găzduire în UE) sunt descrise în{" "}
          <a href="/dpa" className="text-emerald-600 underline dark:text-emerald-400">Acordul de prelucrare a datelor</a>. Lista
          împuterniciților noastre este publică la{" "}
          <a href="/subprocessors" className="text-emerald-600 underline dark:text-emerald-400">/subprocessors</a>.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">9. Plângere</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Ai dreptul să depui o plângere la autoritatea de supraveghere:{" "}
          <strong className="text-foreground">ANSPDCP</strong> — Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter
          Personal, B-dul G-ral. Gheorghe Magheru 28-30, sector 1, București,{" "}
          <a href="https://www.dataprotection.ro" className="text-emerald-600 underline dark:text-emerald-400" target="_blank" rel="noopener noreferrer">
            www.dataprotection.ro
          </a>
          . Prelucrarea datelor cu caracter personal în scopul informării publice privind riscurile este reglementată de{" "}
          <strong className="text-foreground">Legea nr. 190/2018</strong> privind măsuri de implementare a GDPR.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">10. Contact</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Întrebări despre prezenta politică:{" "}
          <a href={`mailto:${SITE.emails.dpo}`} className="text-emerald-600 underline dark:text-emerald-400">{SITE.emails.dpo}</a>
        </p>
      </main>
    </MarketingLayout>
  )
}
