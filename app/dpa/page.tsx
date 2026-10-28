import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { LegalDocHeader } from "@/components/legal/legal-doc-header"
import { SITE } from "@/lib/site"

export const metadata = {
  title: "Acord de prelucrare a datelor (DPA) — ASESOR",
  description: "Acordul de prelucrare a datelor între ASESOR și saloane, conform art. 28 GDPR.",
}

export default function DpaPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        <LegalDocHeader
          doc="dpa"
          title="Acord de prelucrare a datelor (DPA)"
          lead="Prezentul acord se aplică în mod automat tuturor abonaților ASESOR și completează Termenii și condiții. Reglementează prelucrarea datelor clienților salonului de către ASESOR, în calitate de persoană împuternicită, conform art. 28 GDPR."
        />

        <h2 className="mb-3 mt-10 text-xl font-semibold">1. Părțile și rolurile</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Operator (Controller):</strong> salonul abonat, care determină scopurile și mijloacele
            prelucrării datelor clienților săi introduse în platformă.
          </li>
          <li>
            <strong className="text-foreground">Persoană împuternicită (Processor):</strong> {SITE.legalEntity} (ASESOR), care prelucrează
            aceste date exclusiv pe instrucțiunile documentate ale salonului.
          </li>
        </ul>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Pentru datele propriului cont, ale vizitatorilor site-ului public și ale marketingului său, ASESOR acționează ca operator — vezi{" "}
          <a href="/privacy" className="text-emerald-600 underline dark:text-emerald-400">Politica de confidențialitate</a>.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">2. Categorii de date și persoane vizate</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li><strong className="text-foreground">Persoane vizate:</strong> clienții finali ai salonului.</li>
          <li><strong className="text-foreground">Date de identificare și contact:</strong> nume, telefon, email, data nașterii (opțional).</li>
          <li><strong className="text-foreground">Date de serviciu:</strong> programări, servicii efectuate, preferințe, note comerciale, istoric financiar.</li>
          <li>
            <strong className="text-foreground">Date privind sănătatea (art. 9 GDPR):</strong> alergii și formule de culoare, înregistrate
            la alegerea salonului pentru siguranța serviciilor. Acestea sunt criptate câmp cu câmp (AES-256-GCM) și vizibile doar rolurilor
            autorizate de salon.
          </li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">3. Obligațiile ASESOR (art. 28 GDPR)</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Prelucrăm datele doar pe instrucțiuni documentate ale salonului, inclusiv privind transferurile; dacă instrucțiunile neaparțin, informăm salonul.</li>
          <li>Personalul autorizat este obligat la confidențialitate contractuală.</li>
          <li>Aplicăm măsurile de securitate de la secțiunea 4 și asistăm salonul la îndeplinirea obligațiilor din articolele 32–36 GDPR.</li>
          <li>Nu angajăm alt împuternicit fără informarea prealabilă a salonului; lista curentă este publică la{" "}
            <a href="/subprocessors" className="text-emerald-600 underline dark:text-emerald-400">/subprocessors</a>, iar salonul poate
            obiecta în termen de 14 zile de la notificarea unei modificări.</li>
          <li>Asistăm salonul la răspunsurile către persoanele vizate (acces, rectificare, ștergere etc.).</li>
          <li>La finalul prestărilor, la alegerea salonului, returnăm sau ștergem datele conform secțiunii 7.</li>
          <li>Punem la dispoziție informațiile necesare demonstrării conformității și permit audituri rezonabile.</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">4. Măsuri de securitate implementate</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Criptare în tranzit (TLS) și criptare la repos (AES-256, standard Supabase/Postgres).</li>
          <li>Criptare câmp cu câmp <strong className="text-foreground">AES-256-GCM</strong> pentru datele privind sănătatea, cu cheie gestionată separat de baza de date.</li>
          <li>Control al accesului pe roluri (proprietar, manager, recepție, specialist) cu permisiuni diferențiate, inclusiv restricționarea datelor sensibile.</li>
          <li>Izolarea datelor pe rânduri per salon (Row Level Security) — un salon nu poate accesa datele altui salon.</li>
          <li>Jurnal de audit (audit_log) pentru accesul la date sensibile și acțiunile administrative, păstrat 24 de luni.</li>
          <li>Găzduire în Uniunea Europeană (Frankfurt).</li>
          {SITE.dailyBackups ? <li>Backup-uri zilnice ale bazei de date.</li> : null}
          <li>Autentificare cu factor suplimentar (TOTP) disponibilă și impusă opțional pentru acțiuni sensibile.</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">5. Notificarea încălcărilor securității</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          În cazul unei încălcări a securității datelor personale prelucrate pentru salon, notificăm salonul{" "}
          <strong className="text-foreground">în termen de 48 de ore</strong> de la constatare, cu descrierea încălcării, categoriile și
          numărul aproximativ de persoane vizate, măsurile luate și punctul de contact. Salonul, în calitate de operator, rămâne responsabil
          pentru notificarea autorității și a persoanelor vizate, acolo unde este necesar.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">6. Transferuri internaționale</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Baza de date și fișierele sunt găzduite în UE (Frankfurt). Unii împuterniciți (vezi{" "}
          <a href="/subprocessors" className="text-emerald-600 underline dark:text-emerald-400">/subprocessors</a>) pot prelucra date din
          afara UE; în aceste cazuri transferul se bazează pe Clauzele Contractuale Standard ale Comisiei Europene sau pe un mecanism
          echivalent de adecvare.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">7. Returnarea și ștergerea datelor</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Salonul poate exporta datele sale oricând din Setări → „Date și confidențialitate" (fișier ZIP cu CSV-uri; datele sensibile
          separate, decriptate, după o confirmare suplimentară). La încetarea contractului, datele rămân accesibile în regim de export
          timp de 30 de zile, după care sunt <strong className="text-foreground">șterse definitiv în maximum 30 de zile</strong>, inclusiv
          fișierele stocate (fotografii clienți, chitanțe).
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">8. Contact</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Pentru orice întrebare legată de prezentul acord:{" "}
          <a href={`mailto:${SITE.emails.legal}`} className="text-emerald-600 underline dark:text-emerald-400">{SITE.emails.legal}</a>
        </p>
      </main>
    </MarketingLayout>
  )
}
