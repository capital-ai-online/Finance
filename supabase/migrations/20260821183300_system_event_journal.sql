-- GOVERNANCE-CONVERGENCE-RUNTIME-EXECUTION-2026-08-21
-- Operational System Event Journal for the authenticated Supervisor/admin read model.
--
-- IMPORTANT AUTHORITY BOUNDARY:
-- - This table is NOT the ADR-0059 agent_audit_events authority.
-- - It is NOT security/compliance evidence and MUST NOT authorize mutations.
-- - It replaces the legacy Render-local uploads/system_events.json operational projection only.
-- - Applying this migration to production is a separate Owner-authorized Supabase handoff.

create table if not exists public.system_event_journal (
  id uuid primary key,
  occurred_at timestamptz not null,
  event_type text not null check (event_type in (
    'AUTH', 'SUBSCRIPTION', 'CREDITS', 'ORCHESTRATOR', 'MARKET_DATA', 'SECURITY'
  )),
  action text not null,
  actor_label text not null default 'system',
  details text not null,
  status text not null check (status in ('SUCCESS', 'WARNING', 'FAILED')),
  ip_address text,
  source_component text not null default 'server/systemEvents',
  created_at timestamptz not null default now()
);

comment on table public.system_event_journal is
  'Non-authorizing operational event read model for CAPITAL-AI Supervisor/admin UI. Not ADR-0059 agent audit authority and not compliance evidence.';

create index if not exists system_event_journal_occurred_at_idx
  on public.system_event_journal (occurred_at desc);

alter table public.system_event_journal enable row level security;

-- No browser principal receives direct table access. The authenticated server endpoint performs
-- checkAdminAccess first and then uses the privileged backend client for this operational read model.
revoke all on table public.system_event_journal from anon, authenticated;
revoke update, delete, truncate on table public.system_event_journal from service_role;
grant select, insert on table public.system_event_journal to service_role;

create or replace function public.reject_system_event_journal_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'system_event_journal is append-only';
end;
$$;

revoke all on function public.reject_system_event_journal_mutation() from public, anon, authenticated;
grant execute on function public.reject_system_event_journal_mutation() to service_role;

drop trigger if exists system_event_journal_append_only on public.system_event_journal;
create trigger system_event_journal_append_only
before update or delete on public.system_event_journal
for each row execute function public.reject_system_event_journal_mutation();
