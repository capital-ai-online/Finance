-- Issue #92 / ADR-0043 — Supabase privilege separation and RLS hardening.
-- Production-safe goals:
--   * service-role policies target service_role explicitly instead of PUBLIC + auth.role()
--   * authenticated policies use initPlan-friendly (select auth.uid())
--   * security_events owner access no longer depends on a hard-coded e-mail identity
--   * screening_slo_evidence remains server-only with an explicit deny-client policy
--   * security/audit foreign keys receive covering indexes

begin;

-- Server-only policies. Secret/service-role credentials use the service_role Postgres role and
-- bypass RLS, but explicit policy targeting keeps the database contract reviewable and prevents
-- accidental PUBLIC policy semantics from being copied into future tables.
alter policy service_role_full_access on public.agent_evaluation_runs
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.alert_subscriptions
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.audit_logs_iam
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.break_glass_codes
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.compliance_certificates
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.compliance_runs
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.iam_access_log
  to service_role using (true) with check (true);
alter policy service_role_only_tokens on public.iam_stepup_tokens
  to service_role using (true) with check (true);
alter policy service_role_only_challenges on public.phone_stepup_challenges
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.promo_redemptions
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.score_snapshots
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.security_events
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.site_metrics
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.step_up_tokens
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.subscription_confirmations_sent
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.subscriptions
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.usage_log
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.user_quota
  to service_role using (true) with check (true);
alter policy service_role_full_access on public.users
  to service_role using (true) with check (true);

-- User-scoped reads: keep ownership authorization and avoid per-row auth function re-evaluation.
alter policy profiles_select_own on public.profiles
  to authenticated
  using ((select auth.uid()) = id);

alter policy "Users can read own subscriptions" on public.subscriptions
  to authenticated
  using ((select auth.uid()) = user_id);

-- Owner audit visibility: authorization is based on immutable server-managed IAM state, not on a
-- hard-coded e-mail identity. phone_verified remains an additional recovery/identity assurance gate.
alter policy security_events_select_verified_owner on public.security_events
  to authenticated
  using (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.iam_role = 'owner'
        and p.phone_verified = true
    )
  );

-- Append-only SLO evidence is intentionally server-only. Make the deny contract explicit so a
-- future GRANT to anon/authenticated cannot accidentally create access without an RLS review.
drop policy if exists screening_slo_evidence_deny_client_access on public.screening_slo_evidence;
create policy screening_slo_evidence_deny_client_access
  on public.screening_slo_evidence
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.screening_slo_evidence from anon, authenticated;
grant select, insert, update, delete on table public.screening_slo_evidence to service_role;

-- Cover security/audit foreign keys to avoid expensive FK maintenance and incident-query joins.
create index if not exists audit_logs_iam_actor_user_id_idx
  on public.audit_logs_iam (actor_user_id);
create index if not exists audit_logs_iam_target_user_id_idx
  on public.audit_logs_iam (target_user_id);
create index if not exists security_events_actor_user_id_idx
  on public.security_events (actor_user_id);

commit;
