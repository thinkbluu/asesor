-- 017_contact.sql — P10 security pass, item 5 (contact form backend).
--
-- contact_requests already exists (002_tables.sql) with a subject column and
-- NO RLS policies (service role only). This script:
--   1. re-asserts the subject column (idempotent, in case of older snapshots)
--   2. adds a service-role-only rate-limit RPC for the contact form
--      (3 attempts per IP per hour, same fixed-window pattern as 015).

-- ── 1. subject column (idempotent) ──────────────────────────────────────────
alter table public.contact_requests add column if not exists subject text;

-- ── 2. Rate limit RPC: 3 per IP per hour ────────────────────────────────────
-- SECURITY DEFINER, callable ONLY by service_role (the server action passes
-- a sha256 hex of the client IP — the raw IP is never stored).
create or replace function public.register_contact_attempt_rpc(p_ip_hash text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_ip_hash is null or length(p_ip_hash) <> 64 then
    return json_build_object('ok', false, 'code', 'invalid');
  end if;

  insert into public.rate_limits (key, window_start, count)
  values (
    'cnt_ip_' || p_ip_hash,
    date_trunc('hour', now()),
    1
  )
  on conflict (key, window_start) do update
    set count = public.rate_limits.count + 1,
        updated_at = now()
  returning public.rate_limits.count into v_count;

  if v_count > 3 then
    return json_build_object(
      'ok', false, 'code', 'rate_limited',
      'message', 'Ai trimis prea multe mesaje într-un timp scurt. Încearcă din nou mai târziu.'
    );
  end if;

  return json_build_object('ok', true);
end;
$$;

revoke execute on function public.register_contact_attempt_rpc(text) from public, anon, authenticated;
grant execute on function public.register_contact_attempt_rpc(text) to service_role;
