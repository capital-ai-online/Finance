-- ADR-0003.5 / ADR-0008 — IAM-Grundlage
-- Erstellt in der Entwicklungsumgebung (Prompt 1), Ausführung erfolgt in Produktion (Prompt 2)
-- über die Capital-AI Systemadmin-Schnittstelle mit Supabase-Zugriff.
--
-- WICHTIG: Vor Ausführung in Produktion zwingend Backup erstellen (siehe Prompt 2, Abschnitt 1).
-- Diese Datei ist idempotent geschrieben (IF NOT EXISTS / DO-Blöcke), kann also gefahrlos
-- erneut ausgeführt werden, falls ein Lauf abbricht.

-- 1. Rollenfeld auf bestehender profiles-Tabelle
alter table public.profiles
  add column if not exists role text
    check (role in ('owner','admin','supervisor','user'))
    default 'user';

-- 2. Audit-Trail für IAM-relevante Ereignisse (Rollenänderungen, Break-Glass, Step-up)
create table if not exists public.audit_logs_iam (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'IAM',
  actor_user_id uuid references auth.users(id),
  target_user_id uuid references auth.users(id),
  action text not null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- 3. Zugriffsprotokoll für zugriffsbeschränkte Systemzonen
create table if not exists public.iam_access_log (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  token_id text not null,
  zone text not null,
  outcome text not null,
  created_at timestamptz not null default now()
);

-- 4. Row Level Security aktivieren
alter table public.profiles enable row level security;
alter table public.audit_logs_iam enable row level security;
alter table public.iam_access_log enable row level security;

-- 5. Policy: Nutzer dürfen ausschließlich die eigene profiles-Zeile lesen
--    (wird von AdminPortal.tsx für die UX-seitige Rollenanzeige genutzt;
--    die eigentliche Autorisierung erfolgt weiterhin serverseitig über den Service-Role-Key).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own'
  ) then
    execute 'create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id)';
  end if;
end $$;

-- 6. Keine Update/Delete-Policies für audit_logs_iam / iam_access_log definieren.
--    -> Tabellen sind damit append-only für alle Rollen außer dem Service-Role-Key
--    (der RLS ohnehin umgeht). Absichtlich keine Policies hier ergänzen.

-- 7. Owner-Rollenzuweisung erfolgt NICHT über diese Migration, sondern manuell über die
--    Systemadmin-Schnittstelle in Prompt 2 (Abschnitt 2, Punkt 3). Owner-E-Mail-Adressen
--    dürfen nicht in Migrationen oder Seeds referenziert werden.
