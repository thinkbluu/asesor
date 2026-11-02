# P19 QA Report — ASESOR

Data: 2026-11-02 · Branch: `v0/salon-management-system-ddf708eb` · Scope: verificare și corectări, fără funcționalități noi.

## Verificări pre-P19

**1. Istoric branch** — Toate cele 11 commituri P14–P17 sunt strămoși ai HEAD (`git merge-base --is-ancestor`, toate OK):
`496b154` (auth), `f53a929` (booking/manage/feedback), `32639d2` (emails), `2e3cf59` (fixes), `fae920e`/`3d2f51c`/`56ae601`/`3285db0` (P15), `930a86f`/`b53c5d2`/`5512d1f` (P16). Niciun istoric rescris.

**2. Screenshot-uri 360px/1440px light** — `/app/setari` și `/booking/salonul-ana` nu pot încărca date live în sandbox (Supabase inaccesibil, vezi Note de mediu), deci au fost verificate prin harness cu date mock (șters înainte de commit). Defecte găsite și reparate:

| Defect | Reparat |
|---|---|
| `text-accent`/`border-accent`/`bg-accent` folosite ca „accent de brand" în 9 fișiere — tokenul `--accent` a devenit porțelan deschis la P18, deci tabul activ, prețurile, iconițele și stările active erau invizibile (text deschis pe deschis) | Înlocuite sistematic cu `text-primary`/`border-primary`/`bg-primary` (booking-tabs, settings-servicii, programari-view, marketing-view, legal-acceptance-modal, settings-abonament, billing-banner, setari-view, cookie-banner) |
| Setări mobil: bara de taburi se întindea pe 2701px (stretch în flex-row cu formularul înalt) și strângea conținutul la 32px — pagină goală | Bara de taburi mutată în afara flex-row-ului; `main` primește `min-w-0` |
| Setări: headerul cu `h-14` fix suprapunea butonul „Salvează" peste subtitlu pe 360px | `min-h-14` + `flex-wrap`; subtitlul ascuns sub `sm` |
| Label „Județ" cu 2× U+FFFD (mojibake) — caracterul ț corupt în fișier | Reparat la `Județ` (U+021B); curățate și 6 linii de comentarii cu box-drawing corupt |

La `/booking/salonul-ana` headerul apărea de două ori — artefact de harness (BookingFlow își randează singur SalonShell); pagina reală e corectă.

## 1. Crawl linkuri interne + erori consolă

**PASS (parțial — vezi limitări).**
- 15 rute publice (`/`, `/preturi`, `/functionalitati`, `/despre`, `/pentru-cine`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/dpa`, `/subprocessors`, `/login`, `/register`, `/forgot-password`, `/booking/salonul-ana`): toate răspund, fără erori de consolă, fără avertismente de hidratare (agent-browser, mod dev).
- Linkurile interne extrase din `/`, `/terms`, `/preturi` (header/footer partajat) — toate se rezolvă.
- `/app/*` neautentificat: toate `307 → /login`. Corect.
- `/booking/salonul-ana`: randează pagina not-found proiectată (slugul nu există în DB). Notă: statusul HTTP este 200 (soft-404) pentru că pagina streaming comite header-ele înainte de `notFound()` — nu afectează utilizatorul, doar SEO pentru sluguri inexistente.
- **Not run: needs live services** — crawl-ul rutelor `/app` ca owner autentificat (auth Supabase live). în schimb, view-urile /app (programari, dashboard, client, clienți, setări, booking) au fost verificate prin harness: fără erori de consolă sau hidratare.

## 2. Matrice de roluri (owner/manager/staff/receptionist, 2 saloane)

**Not run: needs live services.** Necesită utilizatori de test în Supabase (auth live), două saloane și apeluri directe la DB — sandboxul nu poate ajunge la Supabase (DNS + env malformat, vezi Note de mediu). Regulile RLS și ale stratului de date nu au fost modificate față de auditurile P8–P10.

## 3. Flux rezervare end-to-end pe mobil

**Not run: needs live services.** Necesită RPC-uri Supabase live (`create_public_booking_rpc`, disponibilitate) + Resend pentru email + link de gestionare. UI-ul de rezervare a fost verificat pe harness la 360px (pasul servicii, navigare tastatură OK).

## 4. Accesibilitate

**PASS (după corectări).**
- `html lang="ro"`: PASS.
- Text alternativ imagini: PASS — toate `<img>`/`<Image>` au `alt` (decorative: `alt=""`).
- Focus vizibil: **REPARAT** — adăugată regulă globală `:focus-visible` în `globals.css` (CSS-ul scoped marketing/auth/booking seta `outline:none` pe inputuri; linkurile simple depindeau de default-urile UA). Pass tastatură pe `/`, `/register`, booking (harness), calendar (harness): ordine logică, contur vizibil 2–3px la fiecare oprire.
- Erori de formulare anunțate: **REPARAT** — eroarea de slot din booking are acum `role="alert"`; auth/contact/confirmare/anulare aveau deja; onboarding/setări folosesc toasturi sonner (aria-live).
- Formularul de register în sandbox apare dezactivat cu „Autentificarea va fi disponibilă în curând." — degradare proiectată pentru Supabase neconfigurat (env malformat în sandbox), nu bug de accesibilitate.

## 5. Performanță

**Lighthouse: not run** — binarul nu există în acest sandbox. Măsurătoarea cea mai apropiată: `agent-browser vitals` (mod dev, sandbox 2 nuclee; dev supraestimează timpii de producție):

| Pagină | LCP | CLS | FCP |
|---|---|---|---|
| `/` | 1,3s (obj-hero.webp) | 0,0 | ~1,1s |
| `/preturi` | 0,79s (obj-preturi.webp) | 0,0 | 0,79s |
| booking (harness) | 1,36s (text) | 0,0 | 0,54s |

Toate în buget (LCP ≤ 2,5s, CLS ≤ 0,1) chiar și în mod dev. Imaginea hero are deja `priority` + `sizes` responsive; în producție `next/image` servește variante redimensionate. Recomandare: rulează Lighthouse pe deploy-ul Vercel.

## 6. Verificare diacritice

**PASS (după corectări).**
- Cedilla (U+015F/U+0163): 0 apariții în app/components/lib/docs — ș/ț sunt exclusiv comma-below (U+0219/U+021B).
- Mojibake: **REPARAT** — label „Județ" + 6 comentarii (vezi pre-P19).
- Cuvinte românești fără diacritice în stringuri user-facing: negăsite (două treceri grep pe app/components/lib inclusiv șabloanele de email; potrivirile au fost identificatori, rute sau forme corecte gen „adresa contului", „plata").

## 7. Onestitate (claims fără acoperire)

**PASS.** Nu există testimoniale, ratinguri, număr de clienți, logo-wall sau procente de marketing fără sursă. Potrivirile „%" sunt date de produs (oxidant 6%) și configurare loialitate; glyph-urile stea există doar în widgeturile de recenzii din aplicație (afișare date, nu claims).

## 8. Spot-checks securitate

- Header-e de răspuns: **PASS** — CSP, XFO DENY, HSTS, nosniff, Referrer-Policy, Permissions-Policy prezente pe răspunsuri.
- Endpoint-uri cron/webhook/export fără autentificare: **PASS** — `/api/cron/*` → 401, `/api/notificari/preview` → 401, `/api/export{,/sensitive}` → 307 → /login, webhook Stripe → 400 la POST fără semnătură.
- Rate limits: **Not run: needs live services** — limitele sunt aplicate în RPC-uri (Supabase live).
- Cheia service-role în bundle-urile de client: **DEFECT CRITIC GĂSIT, atenuat în cod** — `NEXT_PUBLIC_SUPABASE_ANON_KEY` din `.env.development.local` conține o cheie de service `sb_secret_...` (regresie de sincronizare env v0), deci valoarea ajunge inline în bundle-urile de client. Guardrail-ul interzice editarea fișierelor `.env*`, deci am reparat în cod: `supabaseAnonKey()` refuză acum cheile `sb_secret_` și JWT-urile cu `role: "service_role"` (fail-closed → aplicația se degradează grațios în loc să folosească putere service-role în browser). **Acțiune necesară în afara sandboxului: rotește cheia service-role în Supabase și corectează `NEXT_PUBLIC_SUPABASE_ANON_KEY`** — valoarea a fost expusă în bundle-uri și trebuie considerată compromisă.

## Build

- `tsc --noEmit`: **PASS** (0 erori).
- `next build`: **PASS** — toate rutele compilate; paginile de conținut statice (○), rutele dinamice corect ƒ.

## Note de mediu

- `NEXT_PUBLIC_SUPABASE_URL` în `.env.development.local` este malformat (URL parse fail) și `NEXT_PUBLIC_SUPABASE_ANON_KEY` conține cheia de service — ambele regresii ale sincronizării env v0. Guardrail-ul interzice editarea fișierelor `.env*`; nu au fost modificate. Supabase rămâne inaccesibil în sandbox (DNS `ENOTFOUND` pe `*.supabase.co`), de aceea verificările live sunt marcate „not run".
- Platforma a auto-commit-uit mid-session (90f9a1e) fix-urile P19 împreună cu harness-ul temporar; harness-ul a fost șters în commit-ul următor (fără rewrite de istoric, conform guardrail-ului).
