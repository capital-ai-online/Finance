# ADR-0092 — Privacy Retention and Lifecycle Hardening

**Status:** Accepted for implementation  
**Date:** 2026-08-19  
**Scope:** CAPITAL-AI / Finance repository and productive Supabase project `ryzywoktpmyhwzxmstyu`  
**Authority:** Controller decision; follows ADR-0085 privacy remediation and ADR-0086 vendor-evidence governance

## Context

Post-PR #414 production verification found a gap between repository intent and productive enforcement:

1. `public.purge_expired_privacy_operational_data()` exists in production, but the productive database does not contain the three social-media persistence tables defined by `20260801150000_social_media_publishing.sql`.
2. The purge function references `public.social_media_oauth_states`; a retention run can therefore fail at runtime before completing the remaining cleanup steps.
3. `pg_cron` is installed in production, but no scheduled job invokes the privacy-retention function.
4. Successful retention executions are not recorded in a dedicated evidence table.
5. Security-event and completed privacy-request records have no machine-readable preservation override for incident, dispute or legal-hold situations.
6. The privacy-request status field has allowed values but no transition invariant.

The remediation must not silently shorten statutory billing/accounting retention, must not claim legal completeness, and must remain least-privilege and auditable.

## Decision

### 1. Reconcile social-media schema drift

A catch-up migration creates the repository-defined tables if they are missing:

- `social_media_accounts`
- `social_media_oauth_states`
- `social_media_publish_log`

The tables remain server/service-role-only and RLS-enabled. OAuth access/refresh tokens remain application-encrypted; the migration does not introduce plaintext token handling.

### 2. Make privacy retention fail-safe

`purge_expired_privacy_operational_data()` becomes:

- table-presence-aware for operational sources;
- concurrency-safe using a transaction-scoped advisory lock;
- retention-hold-aware for security events and completed privacy requests;
- explicitly scoped away from billing/statutory business records.

Operational default windows remain:

| Data class | Default purge rule |
|---|---|
| Security events | older than 180 days, unless an active retention hold applies |
| Social OAuth state | more than 1 day past expiry |
| Step-up tokens | more than 7 days past expiry |
| Quota state | no update for 90 days |
| Unconfirmed alert subscription | older than 14 days |
| Completed/rejected privacy request | more than 3 years after completion, unless an active retention hold applies |

These are application governance defaults, not a statement that every legal retention question is exhausted by these periods.

### 3. Schedule execution in the database control plane

Because productive Supabase already has `pg_cron`, the migration registers exactly one named daily job:

`privacy-operational-retention-daily`

Schedule: `03:17 UTC` daily.

The migration removes an existing job with the same canonical name before scheduling it, making repeated application deterministic.

### 4. Persist successful execution evidence

`privacy_retention_runs` records successful or concurrency-skipped runs and their aggregate purge counts. It intentionally does not store row payloads or deleted personal data.

Failed cron executions remain observable through `cron.job_run_details`; the retention function does not suppress database errors to manufacture a successful run.

### 5. Add preservation boundaries

`security_events.retention_hold_until` and `privacy_requests.retention_hold_until` allow an authorized process to defer generic deletion for a bounded incident/accountability/legal reason.

A hold is an exception to generic automation, not permission for indefinite storage. The reason and authorization for a hold belong in the associated incident/compliance evidence process rather than in public user-facing records.

### 6. Enforce DSAR lifecycle transitions

The existing `privacy_requests` workflow gains `identity_verified_at` and a database state machine:

`received -> identity_verified -> in_progress -> completed`

Rejection is permitted from `received`, `identity_verified`, or `in_progress`. Completed and rejected states are terminal in the generic workflow.

This prevents an accidental direct jump from a newly received request to `completed` without the intermediate identity/lifecycle gates.

## Stripe boundary

This ADR does not modify the provider-managed Stripe→Supabase `stripe-sync` webhook. A separate application webhook remains necessary for the CAPITAL-AI-specific `checkout.session.completed` side effects. The approved Stripe mutation for this workstream is therefore minimization of the application-owned webhook to the event(s) actually required by the current handler, after fresh live endpoint verification.

## Consequences

### Positive

- retention moves from documented/manual capability to scheduled control;
- production schema matches the social runtime contract;
- one missing optional table can no longer abort unrelated retention cleanup;
- execution produces compact, non-PII evidence;
- retention exceptions are explicit and bounded;
- privacy-request lifecycle has a database invariant.

### Trade-offs / residuals

- `pg_cron` execution evidence remains infrastructure evidence and requires monitoring;
- a legal hold still requires an authorized human/process decision;
- the three-year privacy-request accountability period and other configured periods remain subject to legal review if processing purposes or obligations change;
- social-platform processing remains conditional on actual feature use and vendor/transfer evidence; creating the tables does not establish that all social integrations are active;
- vendor TIAs and provider-specific transfer mapping remain separate evidence work.

## Verification gates

Before merge-readiness:

1. Draft PR exists before GitHub build/test expenditure.
2. Repository CI/governance checks are observed on the PR head.
3. Productive Supabase migration is applied only with explicit owner approval and is post-verified for table existence, RLS/grants, cron registration, function execution and evidence-row creation.
4. Stripe endpoint inventory is freshly read before mutation; provider-managed endpoints are excluded.
5. Branch is compared again with then-current `main` and concurrent open-PR correlations are reviewed.
6. Human/CODEOWNER review remains required; no autonomous merge.
