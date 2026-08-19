# PR #434 — Privacy Retention / Stripe Production Rollback Runbook

**Date:** 2026-08-19  
**Scope:** ADR-0092 production changes applied through PR #434  
**Owner:** Controller / Human CODEOWNER  
**Principle:** Forward-fix or forward-rollback; do not rewrite already-applied migration history

## 1. When to invoke

Invoke this runbook if post-mutation verification or later production evidence shows one of the following:

- retention deletes or is about to delete data outside the approved classes/windows;
- the canonical retention job repeatedly fails or causes material database load;
- an active preservation hold is not respected;
- social schema/grants expose data beyond the intended service-role boundary;
- the CAPITAL-AI application webhook no longer receives an application-required event;
- Stripe billing activation/confirmation regresses after event minimization;
- live state no longer matches the evidence in PR #434;
- PR #434 is abandoned after the Supabase production migrations were already applied, leaving production ahead of `main`.

## 2. Authority and safety rules

1. Human/owner authorization is required before a new production rollback mutation.
2. Do not drop social tables or new retention columns as a first-line rollback; those operations can destroy data/evidence.
3. Do not alter the provider-managed Stripe Sync endpoint as part of this rollback.
4. Do not rewrite or delete Supabase migration-history entries that have already been applied.
5. Prefer suspending automation and applying a reviewed forward migration/configuration correction.
6. If any retention deletion has already occurred, do not claim that schema rollback restores the deleted rows. Recovery requires an independent backup/restore assessment.

## 3. Known verified production state after PR #434 mutation

### Supabase

Applied control-plane migrations:

- `20260819084254 / privacy_retention_lifecycle_hardening`
- `20260819084451 / privacy_retention_advisor_indexes`

Canonical cron job:

- name: `privacy-operational-retention-daily`
- schedule: `17 3 * * *`
- command: `select public.purge_expired_privacy_operational_data();`

First controlled execution: successful, all purge counts `0`.

### Stripe

Provider-managed endpoint — **never rollback manually in this runbook**:

- `we_1Tytx6PKr4joNbEcx28r87Qz`
- `managed_by=stripe-sync`

CAPITAL-AI-owned application endpoint:

- `we_1TlsozPKr4joNbEcI2vik5yO`
- URL `https://capital-ai.online/billing/webhook`
- post-change event set: `checkout.session.completed`

Verified pre-change event set for that application endpoint:

- `customer.subscription.deleted`
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.trial_will_end`
- `customer.subscription.updated`
- `invoice_payment.paid`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `subscription_schedule.updated`
- `subscription_schedule.created`
- `subscription_schedule.canceled`
- `subscription_schedule.aborted`
- `subscription_schedule.completed`

## 4. Retention emergency stop

Use when there is credible risk of over-deletion or recurring failure.

### Pre-check

- capture current `cron.job` entry for `privacy-operational-retention-daily`;
- capture the latest `privacy_retention_runs` rows and relevant `cron.job_run_details` without copying personal-data payloads;
- calculate the currently eligible row counts per retention class;
- identify whether any active `retention_hold_until` values should block deletion.

### Stop action

Human-authorized forward mutation:

1. unschedule the canonical cron job by its current `jobid` using `cron.unschedule(jobid)`;
2. verify no job with `jobname='privacy-operational-retention-daily'` remains active;
3. do **not** drop `privacy_retention_runs`, social tables or hold columns;
4. preserve evidence and investigate the predicate/function defect.

### Recovery

- implement a new forward migration with the corrected function/predicate;
- run a read-only eligible-row count;
- execute a controlled manual run only after owner approval;
- recreate exactly one canonical cron job;
- verify run evidence and advisors.

## 5. Supabase schema / authorization regression

If RLS/grants/policies are incorrect:

1. suspend the retention cron only if the defect can affect deletion safety;
2. verify effective table privileges and RLS policies;
3. apply a new forward migration that revokes unintended privileges / restores explicit `service_role` scope;
4. do not remove tables merely to remove exposure;
5. rerun Supabase security/performance advisors and document the new post-state.

If the DSAR state machine blocks a legitimate workflow due to a logic defect:

1. do not disable RLS;
2. create a reviewed forward migration that corrects allowed transitions;
3. keep completed/rejected terminality unless a separately reviewed business/legal requirement changes it;
4. verify the trigger definition and representative negative cases.

## 6. Stripe application-webhook rollback

Use only if evidence shows that an application-specific event removed by PR #434 is still required by the CAPITAL-AI application path.

### Pre-check

1. fresh-list all live webhook endpoints;
2. confirm endpoint `we_1TlsozPKr4joNbEcI2vik5yO` still has metadata `managed_by=capital-ai` and expected URL;
3. confirm the provider-managed endpoint separately and exclude it from the write;
4. identify the exact missing application event from code/runtime evidence rather than restoring events speculatively.

### Preferred rollback

Restore only the newly proven required event(s), keeping `checkout.session.completed` and maintaining least-event scope.

### Full known-state rollback

Only if a broad emergency rollback is explicitly authorized and the prior application behavior must be restored, set the CAPITAL-AI endpoint back to the 13-event pre-change set listed in section 3.

Then:

- read the endpoint again;
- verify URL, status, metadata and enabled event set;
- verify the provider-managed Stripe Sync endpoint remains unchanged;
- update flow-mapping/evidence in the same reconciliation PR.

Do not delete or disable either endpoint as an implicit rollback step.

## 7. Repository rollback

If application code changes in PR #434 must be reverted before merge:

- use a Human-reviewed Git revert/forward-fix on the branch;
- retain the migration and production-evidence files if production still contains the corresponding schema/config state;
- never create a repository state that pretends the production migrations did not occur.

If PR #434 is not going to merge after production mutation:

**mandatory resolution:** choose one of these human-approved paths:

A. create/retain an approved reconciliation PR that contains the exact applied Supabase migrations and Stripe production evidence; or

B. perform a controlled forward rollback under this runbook and then commit the rollback/evidence to a reviewed PR.

Simply closing/deleting the branch would leave an unacceptable production-to-main governance drift.

## 8. Verification after rollback/fix

Required evidence depends on the changed control but should include:

- current main/branch correlation;
- exact Supabase migration history and relevant schema/policy/cron state;
- eligible-row counts before any retention execution;
- retention result/evidence if executed;
- security/performance advisor delta;
- fresh Stripe endpoint inventory before/after any Stripe write;
- explicit confirmation that provider-managed Stripe Sync was not altered;
- updated ADR/evidence if architecture or ownership assumptions changed;
- repository CI on the final head through the required M10 owner-authorized path;
- Human/CODEOWNER review.

## 9. Completion criterion

Rollback/fix is complete only when live production, repository migrations/configuration, evidence and PR metadata describe the same state and the final branch has been re-correlated with then-current `main`.
