# FT-3 — Durable Workflow & Traceability Evidence

**Work item:** FT-3 Durable Workflow & Traceability  
**Date:** 2026-08-21  
**Branch:** `feat/fintech-core-ft3-durable-traceability-v2-2026-08-21`  
**Base:** `main@5595ec0abe1f1b6755620f3435badbf874d54aba`  
**Dependency state:** PR #467 is merged; ADR-0099 and the FT-0..FT-2C FinTechCore contracts are canonical on `main`.  
**Production target:** Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`, `eu-west-1`, PostgreSQL 17.6.1)

## 1. Traceability

This work implements **FT-3 Durable Workflow & Traceability** from `FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` and the Owner priority from 2026-08-21.

Design input supplied by the Owner:

- Google Drive file ID: `15TtZwH1be6si8mEuo7Xc6inq_e21brfa`
- title: `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf`
- modified: `2026-08-20T13:18:52.458Z`

Requirements carried forward from that source include:

- the orchestrator remains a control instance rather than a trading strategy;
- numerical risk/execution decisions must remain deterministic, testable and controlled;
- workflow identity is durable across `runId`, `traceId`, `strategyId`, `portfolioId` and `decisionVersion`;
- workflow/event/decision history is reconstructable;
- side effects require idempotency;
- risk/compliance approval remains a prerequisite for later execution;
- reconciliation and immutable/tamper-resistant evidence are required;
- an LLM receives no exchange execution, private-key, risk-limit or compliance-bypass authority.

The implementation maps these requirements to existing CAPITAL-AI authorities instead of creating a parallel orchestration stack.

## 2. Main correlation and continuation branch

PR #467 merged the FinTechCore foundation into `main` at:

`5595ec0abe1f1b6755620f3435badbf874d54aba`

The original FT-3 persistence branch had been created from the pre-merge baseline and became 69 commits behind after PR #467 merged. It was therefore **not** force-rebased or overwritten. A continuation branch was created directly from the new `main`:

`feat/fintech-core-ft3-durable-traceability-v2-2026-08-21`

The already verified FT-3 migration/evidence artifacts were transferred onto that clean baseline, then the application adapter slice was implemented against the now-canonical FinTechCore contracts.

## 3. Reuse and architecture decision

### Reused repository/platform capabilities

- `server/db.ts` remains the privileged backend Supabase credential/client boundary.
- `public.outbox_jobs` remains the single durable queue/lease/retry/dead-letter primitive (ADR-0054 / R-101).
- `public.agent_audit_events` remains the AI-assisted command audit authority.
- `public.score_snapshots` remains existing score-evidence persistence.
- ADR-0087 / SC-2 remains the canonical scoring authority.
- merged FT-0..FT-2C `FinTechCore` contracts remain the workflow/domain contract source.

### Rejected alternatives

- **Expose `fintech_core` as a browser/Data API schema:** rejected. The financial persistence schema remains private.
- **Add `pg` or another direct PostgreSQL client:** rejected. The repository already has a hardened privileged Supabase client and RPC pattern; a new dependency would add integration and supply-chain surface without functional benefit.
- **Add Kafka/NATS/Temporal/pgmq:** rejected for FT-3. Existing `public.outbox_jobs` remains the queue authority.
- **Create another scoring/risk/compliance/execution authority:** rejected by ADR-0099 and ADR-0087.

## 4. Durable database model

The following private tables are implemented:

- `fintech_core.workflow_runs`
- `fintech_core.domain_events`
- `fintech_core.decision_records`
- `fintech_core.order_intents`
- `fintech_core.reconciliation_records`

Repository migration sources:

1. `supabase/migrations/20260821020000_fintech_core_durable_traceability.sql`
2. `supabase/migrations/20260821020100_fintech_core_durable_traceability_least_privilege.sql`
3. `supabase/migrations/20260821020200_fintech_core_fk_indexes.sql`
4. `supabase/migrations/20260821023000_fintech_core_rpc_persistence_boundary.sql`

The first three migration files were originally authored while PR #467 was still pending. Their historical header text records that creation context; the continuation evidence in this document is authoritative for the post-merge state.

## 5. Application persistence boundary

FT-3 now adds a storage-agnostic core port:

`src/platform/FinTechCore/Persistence/FinTechCorePersistencePort.ts`

and the server implementation:

`server/fintechCorePersistence.ts`

The port supports:

- durable workflow creation;
- compare-and-set workflow transition persistence;
- append-only domain events;
- append-only decision records;
- idempotency-bound OrderIntent evidence.

A typed reconciliation persistence method is intentionally **not** invented in FT-3 because the merged FinTechCore contracts do not yet define settlement/reconciliation semantics. The database table remains a durable evidence scaffold; the application-level reconciliation contract belongs to FT-6.

`src/platform/FinTechCore/index.ts` exports the persistence port, but the core engine remains storage-agnostic and receives no Supabase dependency.

## 6. RPC security boundary

The private `fintech_core` schema is not opened to browser roles. The existing privileged Supabase client reaches the database through five narrowly scoped `public` RPC functions:

- `fintech_core_create_workflow_run_v1`
- `fintech_core_advance_workflow_run_v1`
- `fintech_core_append_domain_event_v1`
- `fintech_core_append_decision_record_v1`
- `fintech_core_append_order_intent_v1`

Security properties verified in production:

- all five functions are `SECURITY INVOKER` (`prosecdef=false`);
- `anon` EXECUTE: **false**;
- `authenticated` EXECUTE: **false**;
- `service_role` EXECUTE: **true**;
- functions operate with the caller's existing private-schema/table privileges;
- no `SECURITY DEFINER` privilege elevation is introduced;
- no public table grants or custom-schema Data API exposure is introduced.

The workflow transition RPC uses expected status + expected sequence as compare-and-set preconditions. Creation/event/decision/OrderIntent writes support deterministic replay without silently accepting identity or idempotency-key collisions with different content.

## 7. Production migrations

Tracked production migrations:

| Production version | Name | Result |
| --- | --- | --- |
| `20260821000550` | `fintech_core_durable_traceability` | PASS |
| `20260821000558` | `fintech_core_durable_traceability_least_privilege` | PASS |
| `20260821000716` | `fintech_core_fk_indexes` | PASS |
| `20260821003628` | `fintech_core_rpc_persistence_boundary` | PASS |

No Render, Stripe, IAM, scoring, exchange or custody mutation was performed.

## 8. Least privilege and append-only verification

The original FT-3 production verification established:

- `anon` schema USAGE on `fintech_core`: false;
- `authenticated` schema USAGE: false;
- `service_role` schema USAGE: true;
- workflow SELECT/INSERT for `service_role`: true;
- table-wide workflow UPDATE: false;
- workflow `status` UPDATE: true;
- workflow `run_id` UPDATE: false;
- domain-event UPDATE/DELETE: false;
- domain-event INSERT: true;
- all five tables have RLS enabled;
- financial child evidence is append-only;
- workflow rows cannot be deleted and immutable context cannot be rewritten.

## 9. RPC functional verification

A production transaction executed under `SET LOCAL ROLE service_role` verified the new boundary:

1. workflow create returned `true`;
2. exact workflow create replay returned `false`;
3. `CREATED/0 -> RUNNING/1` compare-and-set transition returned `true`;
4. exact transition replay returned `false`;
5. domain-event insert returned `true`;
6. exact event replay returned `false`;
7. same `event_id` with conflicting payload was rejected;
8. decision insert returned `true` and exact replay returned `false`;
9. OrderIntent insert returned `true` and exact replay returned `false`.

Inside the transaction, the expected one workflow/event/decision/intent existed and workflow state was `RUNNING`, sequence `1`. The entire transaction was rolled back.

Post-rollback verification:

- workflow verification rows: **0**
- domain-event verification rows: **0**
- decision verification rows: **0**
- OrderIntent verification rows: **0**

No production verification data persisted.

## 10. Advisor verification

### Security Advisor

After the RPC migration there are **no new `fintech_core` security findings**. Existing project-level findings remain outside FT-3, including informational RLS-without-policy notices on unrelated service-only `public.*` tables and the existing Auth leaked-password-protection warning.

Reference remediation for the existing RLS informational class: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### Performance Advisor

There are **zero `unindexed_foreign_keys` findings for `fintech_core`**. Remaining FT-3 notices are `unused_index` informational findings on new/empty durable tables. They are retained until real workload statistics justify removal.

Reference remediation for unused indexes: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

## 11. Code validation status

A focused unit test was added:

`tests/unit/fintechCoreSupabasePersistence.test.ts`

It covers workflow mapping, invalid initial-state rejection, compare-and-set transition mapping, terminal completion timestamps, event/decision/OrderIntent RPC mapping and fail-closed Supabase errors.

No GitHub CI was manually started before PR creation, in accordance with the repository cost/governance rule. A local checkout could not be obtained in the execution environment because outbound DNS to GitHub is unavailable; therefore pre-PR validation consists of repository/API source review plus the production transaction/security verification above. Post-PR CI remains mandatory before merge.

## 12. Completion state

### FT-3 completed scope

- private durable workflow state;
- append-only event history;
- append-only decision evidence;
- idempotency-/hash-bound OrderIntent evidence;
- reconciliation evidence scaffold;
- correlation/trace integrity and FK indexes;
- least-privilege/RLS defense in depth;
- service-role-only `SECURITY INVOKER` application RPC boundary;
- storage-agnostic FinTechCore persistence port;
- fail-closed server Supabase persistence adapter;
- production idempotency/collision/compare-and-set verification;
- advisor revalidation;
- no persisted test data.

### Intentionally deferred to later roadmap phases

- productive Risk Engine / Compliance Engine adapters;
- execution gateway / venue routing;
- settlement/custody semantics and typed reconciliation adapter (FT-6);
- private Storage evidence bucket (separate project-chat follow-up, not part of the five-table FT-3 gate);
- Guarded Live / Production activation;
- Pattern Badge/UI;
- 1h/4h pattern promotion.

## 13. Result

**FT-3 Durable Workflow & Traceability: IMPLEMENTED.**

The durable database foundation and canonical server application persistence boundary are implemented and production-verified without opening the private schema, adding a second queue, or changing scoring/execution authority. Merge readiness still requires the mandated final `main` synchronization and post-PR CI.
