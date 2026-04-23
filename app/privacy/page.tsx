import { MarketingLayout } from "@/components/marketing/marketing-layout"

export const metadata = {
  title: "Politica de confidențialitate — ASESOR",
  description: "Cum colectăm, utilizăm și protejăm datele tale personale.",
}

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        <div className="mb-8 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Draft.</strong> Acest document este un draft. Consultă un avocat înainte de lansarea publică.
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">Politica de confidențialitate</h1>
        <p className="mb-10 text-sm text-muted-foreground">Ultima actualizare: aprilie 2025</p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">1. Identitatea operatorului</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">ASESOR SRL</strong>, CUI: RO[XXXXXXXX], sediu: [Adresă completă], România.<br />
          Contact DPO: <a href="mailto:dpo@asesor.ro" className="text-emerald-600 underline dark:text-emerald-400">dpo@asesor.ro</a>
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">2. Ce date colectăm</h2>
        <p className="mb-2 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Utilizatori ai aplicației (saloane):</strong> adresă de email, nume complet, număr de telefon, date de facturare (adresă, CUI dacă persoană juridică), loguri de utilizare.
        </p>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Clienți finali ai saloanelor:</strong> aceste date (ex. programări, preferințe) sunt introduse și gestionate direct de saloane în calitate de Operator independent. ASESOR acționează exclusiv ca Persoană Împuternicită (Processor) și nu utilizează aceste date în alt scop. A se vedea Acordul de Prelucrare a Datelor (DPA).
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">3. Baza legală</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li><strong className="text-foreground">Contract</strong> — prelucrarea necesară pentru furnizarea serviciului (art. 6(1)(b) GDPR).</li>
          <li><strong className="text-foreground">Interes legitim</strong> — securitate, prevenirea fraudei, îmbunătățirea serviciului (art. 6(1)(f) GDPR).</li>
          <li><strong className="text-foreground">Consimțământ</strong> — comunicări de marketing, newsletter (art. 6(1)(a) GDPR, retras oricând).</li>
          <li><strong className="text-foreground">Obligație legală</strong> — date fiscale păstrate conform legislației române (art. 6(1)(c) GDPR).</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">4. Scopul prelucrării</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Crearea și gestionarea contului de utilizator.</li>
          <li>Furnizarea, îmbunătățirea și securizarea serviciului ASESOR.</li>
          <li>Facturare și colectare plăți.</li>
          <li>Suport tehnic și asistență clienți.</li>
          <li>Comunicări privind modificări ale serviciului sau ale prezentei politici.</li>
          <li>Marketing direct (doar cu consimțământ).</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">5. Durata de stocare</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Date de cont: șterse în termen de <strong className="text-foreground">30 de zile</strong> de la închiderea contului.</li>
          <li>Date fiscale și de facturare: păstrate <strong className="text-foreground">5 ani</strong> conform legislației contabile române.</li>
          <li>Loguri de acces: maximum <strong className="text-foreground">90 de zile</strong>.</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">6. Destinatari și sub-procesatori</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Datele pot fi transferate către sub-procesatorii noștri autorizați. Lista completă este disponibilă la{" "}
          <a href="/subprocessors" className="text-emerald-600 underline dark:text-emerald-400">asesor.ro/subprocessors</a>.
          Principalii sub-procesatori: <strong className="text-foreground">Clerk Inc.</strong> (autentificare),{" "}
          <strong className="text-foreground">Supabase</strong> (bază de date, EU-Frankfurt),{" "}
          <strong className="text-foreground">Vercel</strong> (hosting).
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">7. Drepturile tale</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li><strong className="text-foreground">Acces</strong> — poți solicita o copie a datelor tale.</li>
          <li><strong className="text-foreground">Rectificare</strong> — corectarea datelor inexacte.</li>
          <li><strong className="text-foreground">Ștergere</strong> — „dreptul de a fi uitat", cu excepțiile legale.</li>
          <li><strong className="text-foreground">Portabilitate</strong> — datele în format structurat, machine-readable.</li>
          <li><strong className="text-foreground">Opoziție</strong> — împotriva prelucrării bazate pe interes legitim sau marketing.</li>
          <li><strong className="text-foreground">Restricționare</strong> — limitarea temporară a prelucrării.</li>
          <li><strong className="text-foreground">Plângere</strong> — la ANSPDCP (<a href="https://www.dataprotection.ro" className="text-emerald-600 underline dark:text-emerald-400" target="_blank" rel="noopener noreferrer">dataprotection.ro</a>).</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">8. Securitate</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Datele sunt criptate în tranzit (TLS 1.2+) și la repaus. Utilizăm Row Level Security (RLS) Supabase pentru izolarea datelor între conturi, backup-uri automate zilnice și monitorizare continuă a accesului.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">9. Cookies</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Detalii despre cookie-urile utilizate sunt disponibile în{" "}
          <a href="/cookies" className="text-emerald-600 underline dark:text-emerald-400">Politica de cookies</a>.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">10. Contact</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Pentru orice solicitare legată de datele personale: <a href="mailto:dpo@asesor.ro" className="text-emerald-600 underline dark:text-emerald-400">dpo@asesor.ro</a>
        </p>
      </main>
    </MarketingLayout>
  )
}
