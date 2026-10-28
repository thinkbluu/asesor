# ASESOR — Supabase schema scripts

Numerele indică ordinea exactă de rulare. Toate fișierele sunt idempotente
și pot fi rulate în **Supabase SQL Editor** (Database → SQL Editor), în ordine,
fără modificări.

## Ordinea de rulare

| # | Fișier | Ce face |
|---|--------|---------|
| 1 | `001_extensions_enums.sql` | Extensii (pgcrypto, btree_gist, pg_trgm, citext) + toate enum-urile |
| 2 | `002_tables.sql` | Toate tabelele public + indecși (inclusiv EXCLUDE anti-double-booking pe `appointments`) |
| 3 | `003_functions_triggers.sql` | Helper-e membership, `create_salon_for_current_user`, `accept_invite`, trigger-e stock/loyalty/`handle_new_user`, `dashboard_summary`, funcțiile de mentenanță, trigger `set_updated_at` pe toate tabelele |
| 4 | `004_rls.sql` | RLS activat pe toate tabelele + politici explicite select/insert/update/delete |
| 5 | `005_public_rpc.sql` | RPC-uri publice pentru pagina de programare (`public_salon_profile`, `public_services`, `public_staff`, `public_availability`) + view-ul `products_public` |
| 6 | `006_storage.sql` | Bucket-uri (`client-photos`, `receipts` private; `salon-public` public) + politici pe `storage.objects` |
| 7 | `007_seed_demo.sql` | Salon demo `salonul-ana` (3 staff, 8 servicii, program, 5 clienți, 10 programări) |
| 8 | `tests/rls_isolation.sql` | Test de izolare multi-tenant (rulează după 007) |

## Cum rulezi în Supabase SQL Editor

1. Deschide proiectul Supabase (EU Frankfurt) → **SQL Editor** → **New query**.
2. Copiază conținutul unui fișier, întreg, și apasă **Run**. Un fișier = o rulare.
3. Continuă cu fișierul următor din tabel. Nu sări pași — fiecare fișier depinde
   de obiectele create înainte (ex. politicile din 004 folosesc funcțiile din 003).
4. La final rulează `tests/rls_isolation.sql`. Dacă se termină fără eroare,
   izolarea multi-tenant funcționează. Dacă apare `FAIL: ...`, oprește și
   verifică fișierul indicat de mesaj.
5. Re-rularea oricărui fișier este sigură (create if not exists / drop+create /
   delete-then-insert pentru salonul demo).

## Note

- **Nu există încă UI conectat la Supabase.** Codul de aplicație va fi conectat
  într-un pas ulterior; `lib/supabase/types.ts` este deja aliniat cu schema.
- `contact_requests` și `rate_limits` au RLS activat dar **fără politici** —
  accesibile doar prin service role (server).
- Crearea programărilor din pagina publică NU este expusă anon — se va face
  printr-un server action cu service role.
- Funcțiile de mentenanță (`purge_demo_bookings`, `expire_loyalty_points`,
  `retention_cleanup`, `purge_deleted_salons`) sunt doar pentru service role;
  se vor lega de cron (pg_cron / Vercel Cron → endpoint cu service key) mai târziu.
- Salonul demo (`salonul-ana`) nu are niciun user atașat; `purge_demo_bookings`
  îi șterge programările mai vechi de 1 zi.
- Testul `rls_isolation.sql` creează și șterge doi useri fake în `auth.users`
  și două saloane de test — nu atinge datele demo.
