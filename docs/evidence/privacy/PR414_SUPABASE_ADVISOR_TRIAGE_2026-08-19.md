# PR #414 — Supabase Advisor Triage Evidence — 2026-08-19

## Scope

Production advisor review for Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`) in PR #414. This document preserves the original pre-application assessment but supersedes its former statement that the advisor-hardening migration was PR-only.

No additional production mutation is performed by this evidence reconciliation.

## Superseding production verification — 2026-08-19

The controller subsequently authorized the advisor-hardening migration, and it was applied to the production project.

### Migration traceability

| Repository artifact | Production migration history | Verification |
| --- | --- | --- |
| `supabase/migrations/20260819020000_supabase_advisor_policy_hardening.sql` | `20260819035020 / supabase_advisor_policy_hardening` | applied and post-verified |

The differing timestamps are intentional evidence of how the Supabase migration API registered the already-defined repository SQL. The production history version must therefore not be represented as identical to the repository filename timestamp.

### Verified post-application state

The four `service_role_full_access` policies on:

- `public.capability_grants`
- `public.agent_action_approvals`
- `public.m10_registration_challenges`
- `public.m10_owner_credentials`

now target `TO service_role` with `USING (true)` and `WITH CHECK (true)`. The previous `{public}` + `auth.role() = 'service_role'` definitions are no longer present.

`idx_seo_content_inventory_primary_keyword_id` exists as a partial index on `public.seo_content_inventory(primary_keyword_id)` for non-null values.

Fresh post-application Performance Advisor review confirms:

- the four prior `auth_rls_initplan` warnings for these policies are no longer reported;
- the prior unindexed-FK finding for `seo_content_inventory.primary_keyword_id` is no longer reported;
- the new SEO index is currently reported as unused, which is expected immediately after introduction and is not removal evidence.

## Current security findings

### Leaked Password Protection Disabled — accepted residual risk

**Decision:** accepted for the current Supabase Free tier by the controller on 2026-08-19. The control remains disabled because the active plan does not expose the paid capability.

**Treatment:** not represented as remediated and not treated as a compliance pass. Reassess when the Supabase plan changes or an equivalent control becomes available.

Existing compensating controls in repository scope include authenticated server routes, MFA/passkey work, step-up controls and rate-limited sensitive operations. These controls reduce adjacent account-takeover risk but are not equivalent to leaked-password screening.

### RLS enabled with no policy — informational findings retained for architecture review

Fresh Security Advisor review reports `rls_enabled_no_policy` INFO findings for:

- `public.agent_audit_events`
- `public.ai_governance_evaluations`
- `public.m10_approval_evidence`
- `public.m10_authorization_challenges`
- `public.m10_ci_consumptions`
- `public.m10_shadow_evaluations`
- `public.seo_content_inventory`
- `public.seo_keywords`
- `public.seo_rank_snapshots`

Several of these tables are designed as server/service-role-only or deny-by-default surfaces. This evidence does **not** convert every INFO finding into a blanket compliance assertion. The safe treatment is to keep them visible, verify grants and intended access contracts per table, and avoid adding permissive policies merely to silence the advisor.

## Current performance residuals

### Unindexed foreign key — `m10_shadow_evaluations`

Fresh Performance Advisor review reports:

`public.m10_shadow_evaluations.m10_shadow_evaluations_credential_id_fkey`

without a covering index.

This finding appeared in correlated M10 scope after the original advisor-hardening migration had been defined. It is outside the production mutation explicitly authorized for PR #414 and is therefore **not silently remediated** here. A separate migration should be created and reviewed if workload/query evidence confirms the covering index is appropriate.

### Unindexed foreign key — managed Stripe schema

Fresh Performance Advisor review also reports:

`stripe._managed_webhooks.fk_managed_webhooks_account`

without a covering index.

The table belongs to the provider-managed Stripe/Supabase integration schema. PR #414 does not mutate provider-managed schema solely to suppress an advisor signal.

### `promo_redemptions` without primary key

The advisor continues to report `public.promo_redemptions` without a primary key. Earlier production inspection showed the table empty with only `email` and `redeemed_at`. A primary-key change remains deferred until the owning promotion/redemption contract is traced and the intended identity/idempotency invariant is decided.

### Unused indexes

No indexes are removed in PR #414 solely from `unused_index` INFO findings. Newly introduced or low-frequency audit/security indexes can legitimately show no usage in a short observation window. Removal requires workload evidence and an observation period.

## Historical pre-application snapshot — superseded

The original version of this document correctly recorded that, **at that earlier checkpoint**, only `privacy_governance_and_requests` had been applied and the advisor-hardening migration was still PR-only.

That status is now superseded by the production verification above:

- repository migration: `20260819020000_supabase_advisor_policy_hardening.sql`;
- production history: `20260819035020 / supabase_advisor_policy_hardening`;
- target policy/index changes: verified;
- target advisor findings: no longer present.

The historical distinction is retained for audit chronology; it must not be used as the current production-state claim.

## Scope boundary

This reconciliation changes evidence only. It does not:

- apply another Supabase migration;
- add policies to tables with `rls_enabled_no_policy` INFO findings;
- add the M10 shadow-evaluation FK index;
- modify provider-managed Stripe schema;
- enable leaked-password protection;
- remove unused indexes.
