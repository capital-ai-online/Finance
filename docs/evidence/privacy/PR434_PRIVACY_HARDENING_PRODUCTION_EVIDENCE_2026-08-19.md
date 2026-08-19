# PR #434 — Privacy Hardening Production Evidence

**Date:** 2026-08-19  
**Branch:** `agent/privacy-post414-hardening`  
**Pull Request:** #434  
**Authority:** Owner-authorized Supabase and Stripe production mutation  
**Decision:** ADR-0092 — Privacy Retention and Lifecycle Hardening  
**Status:** SUPABASE MUTATION VERIFIED · STRIPE MINIMIZATION VERIFIED · MERGE NOT AUTHORIZED

## 1. Scope and safety boundary

This evidence records the production changes performed for PR #434. It is a technical/accountability record, not a declaration of GDPR compliance or legal certification.

Explicit mutation boundaries:

- Supabase: repair repository/production social-schema drift, make privacy retention scheduled/auditable/fail-safe, add DSAR lifecycle/retention holds, and cover newly introduced foreign keys.
- Stripe: minimize only the clearly CAPITAL-AI-owned application billing webhook to the event currently required by application-specific side effects.
- Stripe provider-managed `stripe-sync`: read/verify only; no mutation.
- No Render mutation.
- No endpoint deletion or disable operation.
- No broad billing/accounting retention change.

## 2. GitHub / execution gate

A Draft PR existed before any repository build/test expenditure, satisfying the project cost gate.

Observed automatic PR-head workflow state before production mutation:

| Workflow | Result | Jobs |
|---|---|---:|
| CI | `action_required` | 0 |
| PR Governance | `action_required` | 0 |

No build/test job executed in those runs, so this is not recorded as a test failure. Expensive workflow dispatch remains subject to the repository's separate M10 owner-authorization control.

## 3. Supabase pre-state

Productive project: `ryzywoktpmyhwzxmstyu`.

Verified immediately before the mutation:

- `pg_cron` installed; prior verification identified version `1.6.4`.
- canonical job `privacy-operational-retention-daily`: **0**.
- `public.social_media_accounts`: absent.
- `public.social_media_oauth_states`: absent.
- `public.social_media_publish_log`: absent.
- `public.privacy_retention_runs`: absent.
- existing `public.purge_expired_privacy_operational_data(timestamptz)`: present.

Deletion preflight returned **0 eligible rows** in every already-existing generic retention class:

| Data class | Eligible before controlled run |
|---|---:|
| security events >180d | 0 |
| expired step-up tokens >7d | 0 |
| stale user quota >90d | 0 |
| unconfirmed alerts >14d | 0 |
| completed privacy requests >3y | 0 |

The social OAuth table did not yet exist and therefore contained no rows.

## 4. Supabase mutations

### 4.1 Retention/lifecycle migration

Repository migration:

`supabase/migrations/20260819103000_privacy_retention_lifecycle_hardening.sql`

Supabase migration-control-plane registration:

`20260819084254 / privacy_retention_lifecycle_hardening`

Applied successfully.

Post-state verified:

- all three social persistence tables exist;
- `privacy_retention_runs` exists;
- all four new tables have RLS enabled;
- policies are explicitly scoped to `service_role`;
- `security_events.retention_hold_until` exists;
- `privacy_requests.identity_verified_at` exists;
- `privacy_requests.retention_hold_until` exists;
- purge function remains registered;
- exactly one active canonical cron job exists:
  - job name: `privacy-operational-retention-daily`
  - schedule: `17 3 * * *`
  - command: `select public.purge_expired_privacy_operational_data();`

### 4.2 Controlled retention execution

After the zero-row preflight, one owner-authorized controlled production execution was run:

`select public.purge_expired_privacy_operational_data(now());`

Result:

```text
status: succeeded
purged_at: 2026-08-19T08:43:52.599213+00:00
security_events: 0
social_media_oauth_states: 0
step_up_tokens: 0
user_quota: 0
unconfirmed_alert_subscriptions: 0
privacy_requests: 0
```

The execution produced evidence row `privacy_retention_runs.id=1` with status `succeeded` and only aggregate purge counts. No retained user payload was copied into the evidence table.

### 4.3 Advisor follow-up

The first post-migration performance advisor correctly identified two foreign keys introduced by the social catch-up that lacked covering indexes:

- `social_media_oauth_states_user_id_fkey`
- `social_media_publish_log_account_id_fkey`

Rather than altering an already-applied migration, PR #434 added a separate immutable follow-up migration:

`supabase/migrations/20260819104500_privacy_retention_advisor_indexes.sql`

Supabase registration:

`20260819084451 / privacy_retention_advisor_indexes`

It added:

- `idx_social_media_oauth_states_user_id`
- `idx_social_media_publish_log_account_id`

The next advisor read no longer reported either foreign key as unindexed. The fresh/empty-table indexes are naturally reported as `unused_index` until workload uses them; that is not treated as a defect immediately after creation.

## 5. Supabase residual findings — deliberately not mutated

Security advisor residuals are pre-existing/info-level RLS-with-no-policy findings on server-only/fail-closed tables plus the known Auth warning that leaked-password protection is disabled on the current tier/configuration.

Performance advisor residuals include pre-existing findings outside PR #434, notably:

- `public.m10_shadow_evaluations.m10_shadow_evaluations_credential_id_fkey` without a covering index;
- provider-managed `stripe._managed_webhooks.fk_managed_webhooks_account` without a covering index;
- `public.promo_redemptions` without a primary key;
- numerous unused-index informational findings.

PR #434 does not silently mutate those unrelated controls.

Supabase remediation references:

- RLS enabled/no policy: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- unindexed foreign keys: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
- leaked-password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 6. Stripe pre-state and ownership verification

Fresh connected Stripe live read returned exactly **two enabled livemode endpoints**.

### Provider-managed endpoint

- endpoint: `we_1Tytx6PKr4joNbEcx28r87Qz`
- URL: `https://ryzywoktpmyhwzxmstyu.supabase.co/functions/v1/stripe-webhook`
- metadata: `managed_by=stripe-sync`, `lifecycle=managed`, version `1.0.32`
- description explicitly marks it as a protected managed Stripe→Supabase sync endpoint and instructs against manual event-scope modification.

Disposition: **READ/VERIFY ONLY — NOT MUTATED**.

### CAPITAL-AI application endpoint

- endpoint: `we_1TlsozPKr4joNbEcI2vik5yO`
- URL: `https://capital-ai.online/billing/webhook`
- metadata: `managed_by=capital-ai`, `lifecycle=legacy-review`, `purpose=legacy-billing-webhook`, `primary_sync=supabase-edge-function`

Its pre-mutation event set contained 13 event types:

1. `customer.subscription.deleted`
2. `checkout.session.completed`
3. `customer.subscription.created`
4. `customer.subscription.trial_will_end`
5. `customer.subscription.updated`
6. `invoice_payment.paid`
7. `invoice.payment_succeeded`
8. `invoice.payment_failed`
9. `subscription_schedule.updated`
10. `subscription_schedule.created`
11. `subscription_schedule.canceled`
12. `subscription_schedule.aborted`
13. `subscription_schedule.completed`

Repository verification of `server/stripe.ts` established CAPITAL-AI-specific side effects under `processStripeEventSideEffects()` for `checkout.session.completed`; no second `else if` event-specific application-side branch was found. Subscription/object synchronization remains assigned to the provider-managed Stripe Sync path.

## 7. Stripe mutation and post-state

Owner-authorized mutation applied to **only** `we_1TlsozPKr4joNbEcI2vik5yO`:

```text
enabled_events = [checkout.session.completed]
```

The endpoint remained enabled and retained the same URL/ownership metadata.

Fresh post-mutation list verification returned:

- total enabled livemode endpoints: **2**;
- managed Stripe→Supabase endpoint: unchanged;
- CAPITAL-AI application endpoint: enabled events exactly `[checkout.session.completed]`.

No endpoint was deleted or disabled.

The canonical flow evidence is updated in:

`docs/compliance/vendor-evidence/subprocessor-evidence/2026-08-19-stripe-flow-mapping.json`

Historical endpoint IDs/topologies remain recorded there as superseded observations rather than being rewritten as if they never existed.

## 8. Privacy / FinTech engineering assessment

### Before

- repository retention function existed but could fail on a missing social table;
- no canonical scheduled privacy-retention job existed;
- successful retention runs had no dedicated aggregate evidence table;
- DSAR status values were not a transition state machine;
- mailer operational logs could expose direct recipient identifiers/raw provider detail;
- Stripe application webhook received a substantially broader event set than its verified application side effects required.

### After

- database retention is scheduled, concurrency-safe, table-aware and hold-aware;
- production/repository social schema drift is repaired;
- aggregate retention-run evidence is persisted without copied row payloads;
- DSAR lifecycle transitions are enforced in the DB control plane;
- operational mailer logging is minimized/pseudonymized in repository code;
- application-owned Stripe webhook follows a least-data/least-event event-subscription boundary;
- provider-managed Stripe Sync remains provider-controlled.

This follows enterprise privacy-engineering patterns of data minimization, least privilege, explicit lifecycle control, deterministic automation, evidence without unnecessary payload duplication, immutable migration history, and provider/control-plane ownership separation.

## 9. Remaining gates / residual risk

- GitHub required CI/governance still requires the repository's owner-authorized M10 path; current automatic PR events produced zero-job `action_required`, not PASS.
- Stripe onward-transfer/TIA evidence remains pending and is not closed by webhook minimization.
- Final legal validation of configured retention periods remains appropriate when purposes/obligations change.
- Final branch-vs-current-main/open-PR correlation is required after all evidence commits.
- Human/CODEOWNER review and separate merge authorization remain mandatory.
