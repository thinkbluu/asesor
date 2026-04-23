import { MarketingLayout } from "@/components/marketing/marketing-layout"

export const metadata = {
  title: "Acord de prelucrare a datelor (DPA) — ASESOR",
  description: "Acordul de prelucrare a datelor între ASESOR și salonul tău, conform GDPR.",
}

export default function DPAPage() {
  return (
    <MarketingLayout>
      <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
        <div className="mb-8 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Draft.</strong> Acest document este un draft bazat pe clauzele contractuale standard SCC 2021/914/EU. Consultă un avocat înainte de lansarea publică.
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">Acord de prelucrare a datelor (DPA)</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Bazat pe Clauzele Contractuale Standard ale Comisiei Europene — Decizia 2021/914/EU.<br />
          Ultima actualizare: aprilie 2025
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">1. Părțile</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Operatorul (Controller):</strong> Abonatul ASESOR — salonul care utilizează platforma și gestionează datele clienților finali.<br />
          <strong className="text-foreground">Persoana Împuternicită (Processor):</strong> ASESOR SRL, CUI: RO[XXXXXXXX].
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">2. Obiectul și scopul prelucrării</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          ASESOR prelucrează datele cu caracter personal ale clienților finali ai salonului exclusiv în scopul furnizării serviciilor descrise în Termenii și Condițiile ASESOR: gestionarea programărilor, istoricul clienților, notificări, raportare. Nu sunt permise utilizări secundare fără instrucțiunile explicite ale Operatorului.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">3. Categorii de date prelucrate</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Identificatori: nume, prenume, număr de telefon, adresă de email.</li>
          <li>Date de programare: data, ora, serviciul solicitat, angajatul alocat.</li>
          <li>Preferințe și note interne introduse de salon.</li>
          <li>Istoricul vizitelor și al serviciilor efectuate.</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">4. Obligațiile Persoanei Împuternicite (ASESOR)</h2>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Prelucrează datele exclusiv conform instrucțiunilor documentate ale Operatorului.</li>
          <li>Asigură că personalul cu acces la date este supus obligației de confidențialitate.</li>
          <li>Implementează măsuri tehnice și organizatorice adecvate (criptare, RLS, acces minim necesar).</li>
          <li>Notifică Operatorul în termen de <strong className="text-foreground">72 de ore</strong> de la constatarea unei încălcări a securității datelor.</li>
          <li>Asistă Operatorul în îndeplinirea obligațiilor față de persoanele vizate (DSAR-uri).</li>
          <li>Șterge sau returnează toate datele la încheierea contractului, la alegerea Operatorului.</li>
          <li>Pune la dispoziție informațiile necesare pentru demonstrarea conformității și permite audituri.</li>
        </ul>

        <h2 className="mb-3 mt-10 text-xl font-semibold">5. Sub-procesatori</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Operatorul autorizează în mod general utilizarea sub-procesatorilor listați la{" "}
          <a href="/subprocessors" className="text-emerald-600 underline dark:text-emerald-400">asesor.ro/subprocessors</a>.
          ASESOR va notifica Operatorul cu cel puțin <strong className="text-foreground">30 de zile</strong> înainte de adăugarea sau înlocuirea unui sub-procesator. Operatorul poate obiecta motivat în scris în acest termen.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">6. Transferuri internaționale</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Datele sunt stocate prioritar în EU (Supabase Frankfurt). Unde sunt implicați sub-procesatori din afara SEE (ex. Clerk Inc., SUA), transferurile se realizează pe baza Clauzelor Contractuale Standard adoptate prin Decizia 2021/914/EU a Comisiei Europene.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">7. Durata</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Prezentul acord este valabil pe durata contractului de abonament ASESOR. La încetarea contractului, ASESOR va șterge datele clienților finali în termen de 30 de zile, cu excepția obligațiilor legale de retenție.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">8. Lege aplicabilă</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Prezentul acord este guvernat de Regulamentul (UE) 2016/679 (GDPR) și legislația română de implementare.
        </p>

        <h2 className="mb-3 mt-10 text-xl font-semibold">Contact</h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          <a href="mailto:dpo@asesor.ro" className="text-emerald-600 underline dark:text-emerald-400">dpo@asesor.ro</a>
        </p>
      </main>
    </MarketingLayout>
  )
}
