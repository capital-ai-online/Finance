-- FT-4 / ADR-0099 -- Durable Paper Trading replay boundary.
--
-- Reuses fintech_core.domain_events as the append-only paper journal. No new financial ledger,
-- queue or live-execution authority is introduced. One PAPER_ACCOUNT_INITIALIZED event and one
-- paperSequence per run are enforced at the database layer to fail closed under concurrent writers.

begin;

create unique index if not exists domain_events_one_paper_account_init_per_run_idx
  on fintech_core.domain_events (run_id)
  where event_type = 'PAPER_ACCOUNT_INITIALIZED';

create unique index if not exists domain_events_paper_sequence_unique_idx
  on fintech_core.domain_events (run_id, ((payload ->> 'paperSequence')::bigint))
  where event_type in ('PAPER_ACCOUNT_INITIALIZED', 'PAPER_FILL_SIMULATED')
    and payload ? 'paperSequence';

create or replace function public.fintech_core_list_domain_events_v1(
  p_run_id text
)
returns table (
  event_id text,
  contract_version text,
  event_type text,
  event_version text,
  run_id text,
  trace_id text,
  correlation_id text,
  causation_id text,
  module_id text,
  asset_id text,
  decision_version text,
  occurred_at timestamptz,
  evidence_refs jsonb,
  payload jsonb,
  recorded_at timestamptz
)
language plpgsql
security invoker
set search_path = pg_catalog, fintech_core
as $$
begin
  if nullif(btrim(p_run_id), '') is null then
    raise exception 'fintech_core_list_domain_events_v1 requires p_run_id';
  end if;

  return query
    select
      e.event_id,
      e.contract_version,
      e.event_type,
      e.event_version,
      e.run_id,
      e.trace_id,
      e.correlation_id,
      e.causation_id,
      e.module_id,
      e.asset_id,
      e.decision_version,
      e.occurred_at,
      e.evidence_refs,
      e.payload,
      e.recorded_at
    from fintech_core.domain_events e
    where e.run_id = p_run_id
    order by e.occurred_at asc, e.recorded_at asc, e.event_id asc;
end;
$$;

revoke all on function public.fintech_core_list_domain_events_v1(text)
  from public, anon, authenticated;
grant execute on function public.fintech_core_list_domain_events_v1(text)
  to service_role;

commit;
