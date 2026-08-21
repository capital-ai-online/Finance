# FT-3 — Durable Workflow & Traceability Evidence

**Work item:** FT-3 Durable Workflow & Traceability  
**Date:** 2026-08-21  
**Branch:** `feat/fintech-core-ft3-durable-traceability-2026-08-21`  
**Base:** `main@95dea79cb6c67d7925af2b4c6df59c53baf2b46f`  
**Dependency:** PR #467 (`feat/fintech-core-crypto-module-01`) remains the source of the FT-0..FT-2C FinTechCore contracts and ADR-0099 until merged.  
**Production target:** Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`, `eu-west-1`, PostgreSQL 17.6.1)

## 1. Traceability

This persistence slice implements the next roadmap work package **FT-3** from `FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` and the Owner priority from 2026-08-21.

Design input supplied by the Owner:

- Google Drive file ID: `15TtZwH1be6si8mEuo7Xc6inq_e21brfa`
- Title: `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf`
- Modified: 2026-08-20T13:18:52.458Z

The source document requires, among other things:

- the orchestrator to remain a control instance rather than a trading strategy;
- deterministic, testable and controlled numerical risk/execution decisions;
- durable workflow identity through `runId`, `traceId`, `strategyId`, `portfolioId` and `decisionVersion`;
- event-driven workflow state and reconstructable decision history;
- idempotency before side effects;
- explicit risk/compliance approvals before execution;
- reconciliation and immutable/tamper-resistant audit evidence;
- no direct LLM authority over exchange execution, private keys, risk-limit changes or compliance bypasses.

These requirements were mapped to the existing CAPITAL-AI authorities rather than implemented as a second orchestration stack.

## 2. Reuse and architecture decision

### Reused existing repository/platform capabilities

- `public.outbox_jobs` remains the single durable queue/lease/retry/dead-letter primitive (ADR-0054 / R-101).
- `public.agent_audit_events` remains the AI-assisted command audit authority (M5).
- ADR-0087 / SC-2 remains the canonical scoring authority; FT-3 does not own score calculation or score promotion.
- PR #467 remains the pending source for FinTechCore workflow contracts, operating modes and authority boundaries.

### Explicitly not introduced

- no Kafka/Redpanda/NATS/Temporal installation;
- no second queue or worker leasing mechanism;
- no second scoring registry or dispatcher;
- no exchange/custody execution adapter;
- no direct browser/Data API access to the new financial persistence schema;
- no Render or Stripe mutation;
- no IAM or compliance-policy authority change.

This satisfies the repository-first/native-reuse rule and keeps FT-3 scoped to durable domain persistence.

## 3. Repository migrations

The FT-3 branch contains the following versioned migration sources:

1. `supabase/migrations/20260821020000_fintech_core_durable_traceability.sql`
   - creates private schema `fintech_core`;
   - creates `workflow_runs`, `domain_events`, `decision_records`, `order_intents`, `reconciliation_records`;
   - enables RLS as defense in depth;
   - grants schema/table access only to `service_role`;
   - adds append-only mutation guards to evidence tables;
   - makes workflow identity/context immutable while permitting lifecycle progression;
   - introduces idempotency-bound, hash-bound `order_intents` as evidence only, not as an execution capability.
2. `supabase/migrations/20260821020100_fintech_core_durable_traceability_least_privilege.sql`
   - removes table-wide workflow UPDATE;
   - permits `service_role` updates only on `status`, `sequence`, `updated_at`, `completed_at`.
3. `supabase/migrations/20260821020200_fintech_core_fk_indexes.sql`
   - remediates the Supabase Performance Advisor findings for the four composite workflow-correlation foreign keys.

## 4. Production application

The same logical changes were applied to the production Supabase project through tracked migrations:

| Production migration version | Name | Result |
| --- | --- | --- |
| `20260821000550` | `fintech_core_durable_traceability` | PASS |
| `20260821000558` | `fintech_core_durable_traceability_least_privilege` | PASS |
| `20260821000716` | `fintech_core_fk_indexes` | PASS |

No production data migration or seed data was introduced.

## 5. Security and least-privilege verification

Direct privilege checks after migration returned:

- `anon` schema USAGE on `fintech_core`: **false**
- `authenticated` schema USAGE on `fintech_core`: **false**
- `service_role` schema USAGE: **true**
- `service_role` workflow SELECT: **true**
- `service_role` workflow INSERT: **true**
- table-wide workflow UPDATE: **false**
- workflow `status` UPDATE: **true**
- workflow `run_id` UPDATE: **false**
- domain-event UPDATE: **false**
- domain-event DELETE: **false**
- domain-event INSERT: **true**

All five new tables have RLS enabled. Child financial-evidence tables have append-only triggers; `workflow_runs` has both no-delete and immutable-context guards.

## 6. Transactional functional verification

A controlled transaction was used to validate behavior:

1. inserted one temporary `workflow_runs` record;
2. inserted one correlated `domain_events` record;
3. advanced the workflow from `CREATED` to `RUNNING`, sequence `0` to `1`;
4. attempted to mutate the domain event;
5. append-only trigger rejected the mutation;
6. transaction was rolled back.

Post-rollback row counts:

- `workflow_runs`: 0
- `domain_events`: 0
- `decision_records`: 0
- `order_intents`: 0
- `reconciliation_records`: 0

Therefore verification left **no test data in production**.

## 7. Advisor verification

### Security Advisor

No new `fintech_core` security finding was introduced. Existing pre-FT-3 project findings remain outside this work-package scope, including the separate Auth leaked-password-protection warning and service-only public-table informational RLS notices.

### Performance Advisor

The first FT-3 pass identified four unindexed composite foreign keys on:

- `fintech_core.domain_events`;
- `fintech_core.decision_records`;
- `fintech_core.order_intents`;
- `fintech_core.reconciliation_records`.

Migration `fintech_core_fk_indexes` remediated all four. A second advisor run shows **zero unindexed-foreign-key findings for `fintech_core`**.

The remaining `unused_index` informational notices on the new FT-3 tables are expected because the tables are new and empty. They are not treated as evidence that the indexes should be removed before production workload statistics exist.

## 8. Scope and completion state

### Completed in this FT-3 persistence slice

- private durable workflow run persistence;
- append-only domain-event history;
- append-only decision evidence with input/output hashes;
- idempotency-bound OrderIntent evidence scaffold;
- reconciliation evidence scaffold;
- correlation/trace indexes and foreign-key integrity;
- production least privilege and RLS defense in depth;
- transactional verification and advisor remediation.

### Intentionally deferred

The following are **not claimed as complete** in this branch:

- application persistence adapters that import the FinTechCore source contracts from PR #467;
- productive Risk Engine / Compliance Engine adapters;
- execution gateway or venue routing;
- settlement/custody implementation;
- private Storage evidence bucket;
- guarded-live/production activation;
- Pattern Badge/UI;
- 1h/4h pattern promotion.

Application wiring must wait until PR #467 is merged, then this branch must be synchronized against the new `main` so the adapters can bind to the canonical merged FinTechCore types instead of duplicating them.

## 9. Result

**FT-3 durable persistence foundation: PASS.**

The database layer is versioned in the repository, applied to production, least-privilege verified, append-only verified, advisor-checked and free of persisted verification data. The work package remains **partially open** until the post-PR-#467 application persistence adapter slice is implemented and validated against the merged FinTechCore contracts.
