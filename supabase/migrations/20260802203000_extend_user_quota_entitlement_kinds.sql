-- ADR-0034 — central subscription entitlements.
-- Repository migration only. Apply through the controlled production Supabase handoff
-- before enabling the Warren-Buffett quota endpoint in production.

alter table public.user_quota
  drop constraint if exists user_quota_quota_kind_check;

alter table public.user_quota
  add constraint user_quota_quota_kind_check
  check (quota_kind in (
    'screening',
    'monte_carlo',
    'full_ai_analysis',
    'buffett_value_check'
  ));
