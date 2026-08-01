-- Nachholmigration (Audit ARCH-AUDIT-0002, Befund AUD2-F-012): server/stepUp.ts und server.ts
-- schreiben/lesen security_events, step_up_tokens, break_glass_codes sowie
-- profiles.totp_secret_encrypted / totp_pending_secret_encrypted / totp_enabled, obwohl keine
-- dieser Strukturen je als Migration im Repository vorlag. Sie wurden bereits ausserhalb der
-- versionierten Migrationshistorie auf der Produktivinstanz angelegt
-- ("create_security_events_log", "harden_security_events_grants", "add_totp_stepup_breakglass",
-- 2026-07-12/07-14) - diese Datei holt das im Repository nach, damit eine Neuprovisionierung aus
-- supabase/migrations/ denselben Stand ergibt. IF NOT EXISTS / DO-Bloecke machen sie als
-- Wiederholung gegen die bereits aktuelle Produktivinstanz sicher.

-- 1. TOTP-Felder auf profiles (ADR-0003.5 Step-Up-Authentication)
alter table public.profiles
  add column if not exists totp_secret_encrypted text,
  add column if not exists totp_pending_secret_encrypted text,
  add column if not exists totp_enabled boolean not null default false;

-- 2. Security-Events-Audit-Log (server.ts CORS-Block-Logging, server/stepUp.ts)
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in (
    'failed_login', 'unauthorized_access', 'invalid_token',
    'rate_limit_exceeded', 'permission_denied', 'suspicious_request'
  )),
  attempted_email text,
  actor_user_id uuid references auth.users(id),
  ip_address inet,
  user_agent text,
  device_vendor text,
  device_type text,
  endpoint text,
  outcome text not null default 'blocked',
  reason text
);
comment on table public.security_events is
  'Audit log fuer unautorisierte Zugriffsversuche (IP, User-Agent, Geraetehersteller). Read-only fuer verifizierten Owner-Account, Schreibzugriff nur via Service-Role.';

-- 3. Step-Up-Tokens (server/stepUp.ts /step-up/verify, requireStepUp() in authMiddleware.ts)
create table if not exists public.step_up_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  token_hash text not null,
  purpose text not null default 'owner-action',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
comment on table public.step_up_tokens is
  'Kurzlebige, einmalig verwendbare Step-Up-Tokens (TOTP-verifiziert) fuer Owner-Aktionen. Server-only, kein Client-Zugriff.';

-- 4. Break-Glass-Recovery-Codes (server/stepUp.ts /totp/verify-setup, /break-glass/redeem)
create table if not exists public.break_glass_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  code_hash text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
comment on table public.break_glass_codes is
  'Gehashte Einmal-Recovery-Codes fuer den Break-Glass-Prozess. Server-only, kein Client-Zugriff.';

-- 5. RLS aktivieren
alter table public.security_events enable row level security;
alter table public.step_up_tokens enable row level security;
alter table public.break_glass_codes enable row level security;

-- 6. Owner-Leserecht auf security_events (nur der verifizierte, telefonbestaetigte Owner-Account
--    darf das eigene Sicherheits-Log einsehen; Schreiben bleibt ausschliesslich Service-Role
--    vorbehalten - siehe Policy 7 unten).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'security_events'
      and policyname = 'security_events_select_verified_owner'
  ) then
    execute $policy$
      create policy "security_events_select_verified_owner" on public.security_events
        for select
        using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.iam_role = 'owner' and p.phone_verified = true
          )
          and (select u.email from auth.users u where u.id = auth.uid())::text = 'sven.kulessa@gmail.com'
        )
    $policy$;
  end if;
end $$;

-- 7. Service-Role-Policies, konsistent mit dem Muster aus
--    20260731000000_add_missing_service_role_rls_policies.sql fuer die Schwestertabellen.
drop policy if exists "service_role_full_access" on public.security_events;
create policy "service_role_full_access" on public.security_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.step_up_tokens;
create policy "service_role_full_access" on public.step_up_tokens
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.break_glass_codes;
create policy "service_role_full_access" on public.break_glass_codes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
