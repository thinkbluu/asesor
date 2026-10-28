# Data pattern (P4)

Every feature that touches the database follows the same four layers. The flow is
always: **client view → server action → validation → data layer → Supabase (RLS)**.

```
components/app/<feature>.tsx        "use client" — UI state only, calls actions, sonner toasts
app/.../actions.ts                  "use server" — parse → guard → data fn → revalidatePath → ActionResult
lib/validation/<domain>.ts          zod 3 schemas, Romanian error messages
lib/mappers/<domain>.ts             pure row ↔ view-model mapping (no I/O, importable anywhere)
lib/data/<domain>.ts                "server-only" — Supabase server client, all queries, RLS as the user
```

## Rules

1. **Validation (`lib/validation/<domain>.ts`)**
   - zod 3 (`zod@3.25.76`). Every message in Romanian, addressed to the salon owner.
   - Schemas are the single source of truth for action input shapes (`z.infer`).
   - Shared action plumbing lives in `lib/validation/onboarding.ts` and is re-exported:
     - `ActionResult<T>` = `{ ok: true; data?: T } | { ok: false; error: string; fieldErrors?: FieldErrors }`
     - `zodToActionError(err)` → first issue message + per-field messages.
   - Server actions never trust client data: `safeParse` first, return `{ ok: false, error }` on failure.

2. **Mappers (`lib/mappers/<domain>.ts`)**
   - Pure functions `Row → view model` and `view model → DB payload`. No imports with side
     effects, no `server-only` — the client wizard imports the *types* and the server page
     imports the functions.
   - jsonb columns (`booking_settings`, `branding`, `loyalty_config`, `reviews_config`) are
     read through defensive readers (`readBookingSettings`) that merge DB values over
     defaults — the DB may hold older shapes.

3. **Data layer (`lib/data/<domain>.ts`)**
   - `"server-only"` at the top. Uses `createSupabaseServerClient()` from
     `lib/supabase/server.ts` — anon key + cookies, so **RLS applies as the signed-in user**.
     Never use a service-role key in app code.
   - Every function returns `{ ok: … } | { ok: false, error }`; unexpected DB errors are
     logged with `console.error("[v0] <scope> failed:", error)` and collapsed into one
     Romanian user-facing message. Known DB errors (e.g. duplicate slug `23505`) are
     translated to specific Romanian copy.
   - Multi-row writes are sequential `insert/update/delete` calls (small volumes); the
     Postgres RPC `create_salon_for_current_user` is used for salon creation (security
     definer: generates the unique slug, inserts the owner membership, seeds default hours).

4. **Server actions (`app/**/actions.ts`)**
   - `"use server"`. Order: `safeParse` → `getSession()` / `requireRole(["owner","manager"])`
     (from `lib/auth/session.ts`) → data function → `revalidatePath` → `ActionResult`.
   - `salon_id` always comes from the session, never from the client payload.
   - Onboarding step 1 cannot use `requireRole` (the user has no salon yet) — it uses
     `getSession()` and the creation RPC; steps 2–5 use `requireRole`.

5. **Pages**
   - Server page loads data via `lib/data/*`, maps with `lib/mappers/*`, passes plain props
     to the client view. Client views keep their own editable state initialized from props
     and call one action per save; refresh resumes from persisted state.

## Onboarding mapping (5 steps + done)

| Step | UI | Persisted to |
| --- | --- | --- |
| 1 Salonul tău | name, city, address, phone | `salons.name/city/address/phone` (create via RPC, then update); `booking_settings.onboarding_step = 2` |
| 2 Servicii | flat service list | one `service_categories` row named „General" + `services` rows (upsert by id, delete removed); step → 3 |
| 3 Program | 7-day schedule | `salon_hours` upsert (`weekday` 0 = luni … 6 = duminică); step → 4 |
| 4 Echipă | staff list + service chips | `staff` (name split into first/last, removed rows soft-deleted), `staff_schedules` copied from salon hours, `staff_services` (empty selection → all services); step → 5 |
| 5 Reguli | min advance, cancel window, online toggle | `booking_settings.min_notice_min/online_enabled` + `salons.cancellation_window_hours`; `onboarding_step = 6` (done) |
| Gata | public link + copy + calendar button | transient client state; refreshing `/app/onboarding` with step 6 redirects to `/app` |

`onboarding_step` lives in `booking_settings` jsonb and is advanced after **every** step, so a
refresh resumes where the user left off. „Sari peste" persists the step without writing data
(step 1 skip is client-only — no salon exists yet).

## Setări mapping

| Tab | Persisted to |
| --- | --- |
| Profil | `salons.name/description/phone/email/address/city` |
| Program | `salon_hours` (same schema as onboarding step 3) |
| Servicii | `service_categories`, `services`, `staff_services` (overrides), `service_products` (consum), `sort_order` reorders |
| Politici | `booking_settings` (min_notice_min, max_days_ahead, online_enabled, require_confirmation, slot_interval_min) + `salons.cancellation_window_hours` |
| Loialitate | `salons.loyalty_config` jsonb (validated against `LoyaltyConfig`) |
| Recenzii | `salons.reviews_config` jsonb + mirror of the Google URL in `salons.google_review_url` |
| Booking → Branding | `salons.slug`, `salons.cancellation_policy`, `salons.branding` jsonb (logo, color, welcome texts, deposit), `booking_settings.min_notice_min/max_days_ahead` |

## Known not-persisted (deliberate, schema has no columns)

- **Pauză între programări (buffer)** in onboarding step 5 — no global column; per-service
  `services.buffer_min` exists and is editable in Setări → Servicii.
- **Category icon + color** — `service_categories` has no columns; UI keeps local defaults.
- **Profil extra fields** (website, județ, cod poștal, social URLs, CUI, nr. RC) — no columns.
- **Notificări / Permisiuni / Abonament** tabs — no tables yet; UI-only until the backend lands.

When a column later exists, add it to the mapper + validation schema and delete the entry here.
