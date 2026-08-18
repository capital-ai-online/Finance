# PR #414 — Supabase Advisor Triage Evidence — 2026-08-19

## Scope

Post-production-migration review of Supabase Security and Performance Advisor findings for project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`). This document distinguishes remediations from intentional architecture and accepted platform constraints.

## Security findings

### Leaked Password Protection Disabled — accepted residual risk

**Decision:** accepted for the current Supabase Free tier by the controller on 2026-08-19. The control remains disabled because the account plan does not expose the paid capability.

**Treatment:** not represented as remediated and not treated as a false compliance pass. Reassess when the Supabase plan changes or an equivalent control becomes available on the active plan.

Existing compensating controls in repository scope include authenticated server routes, MFA/passkey work, step-up controls and rate-limited sensitive operations. These do not make leaked-password screening equivalent; they only reduce adjacent account-takeover risk.

### RLS enabled with no policy — intentional deny-by-default

Affected advisor INFO findings:

- `public.agent_audit_events`
- `public.seo_keywords`
- `public.seo_rank_snapshots`
- `public.seo_content_inventory`

Repository migrations explicitly revoke client-facing access and grant only required server/service-role privileges. These tables are intentionally not given authenticated/anonymous RLS policies. Adding a permissive policy only to silence `rls_enabled_no_policy` would weaken the documented server-only design.

**Treatment:** accepted informational findings; retain RLS + least-privilege table grants; verify grants during security reviews.

## Performance findings remediated in PR

### Deprecated/per-row `auth.role()` service-role policies

Affected tables:

- `public.capability_grants`
- `public.agent_action_approvals`
- `public.m10_registration_challenges`
- `public.m10_owner_credentials`

Live production inspection showed each `service_role_full_access` policy targeted `{public}` and evaluated `auth.role() = 'service_role'` in both `USING` and `WITH CHECK`.

PR migration `20260819020000_supabase_advisor_policy_hardening.sql` replaces these with explicit `TO service_role USING (true) WITH CHECK (true)`. This matches current Supabase RLS guidance, removes deprecated `auth.role()` authorization logic and avoids unnecessary per-row auth evaluation.

### Unindexed SEO foreign key

`public.seo_content_inventory.primary_keyword_id` references the SEO keyword register without a covering index. The PR migration adds a partial index for non-null values.

## Findings deferred with rationale

### `promo_redemptions` without primary key

Production inspection on 2026-08-19 showed the table is currently empty and contains only `email` and `redeemed_at`. A primary-key change is deferred until the owning promotion/redemption contract is traced in application code and the desired identity/idempotency invariant is decided. Inventing a UUID key without understanding whether `email` should instead be unique would suppress the advisor without proving the correct domain model.

### Unused indexes

No indexes are removed in this PR based solely on the advisor's `unused_index` signal. Newly introduced privacy indexes are expected to have no usage history immediately after deployment; other indexes may protect low-frequency incident, audit or operational queries. Removal requires a production observation window plus query/workload evidence.

## Production mutation status

The original privacy migration `privacy_governance_and_requests` was already applied and verified in production. The new advisor-hardening migration added by this follow-up is **PR-only at this stage** and must not be described as production-applied until a separate production mutation is explicitly authorized and verified.
