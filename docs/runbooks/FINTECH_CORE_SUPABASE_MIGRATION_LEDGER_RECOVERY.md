# FinTechCore — Supabase Migration Ledger Recovery

**Work item:** P0 — Supabase-Migrationsledger konsolidieren, bevor weitere FinTechCore-Schemata entstehen  
**Authority:** ADR-0099 / `FT-CORE-CRYPTO-01`  
**Status:** branch implementation / pre-PR  
**Production project:** `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)  
**Validated against:** production migration ledger and schema state on 2026-08-27

## 1. Problem

The repository contained FinTechCore migration SQL with timestamps that did not match the versions registered in `supabase_migrations.schema_migrations`.

Supabase migration reconciliation is version/timestamp based. A repository timestamp that differs from the already-applied remote version can therefore be interpreted as a separate migration even when the SQL originated from the same implementation.

A second, more severe gap was found for FT-6A:

- repository migration existed as `20260822002500_fintech_core_ft6_order_intent_reconciliation.sql`;
- no corresponding FT-6A entry existed in the production migration ledger;
- the production `fintech_core.order_intents` table did not contain the FT-6A binding columns;
- FT-6B was nevertheless registered as applied and its v2 persistence contract references the FT-6A binding fields.

This is treated as migration-ledger/schema recovery, not as a new FinTechCore feature or execution promotion.

## 2. Verified production ledger baseline

The following already-applied production versions are the canonical repository timestamps:

| Migration | Canonical remote version |
| --- | --- |
| `fintech_core_durable_traceability` | `20260821000550` |
| `fintech_core_durable_traceability_least_privilege` | `20260821000558` |
| `fintech_core_fk_indexes` | `20260821000716` |
| `fintech_core_rpc_persistence_boundary` | `20260821003628` |
| `fintech_core_paper_replay_reader` | `20260821071823` |
| `fintech_core_ft6b_fixed_point_reconciliation` | `20260822012200` |

The repository files were renamed to these exact versions without changing their SQL blob contents.

## 3. FT-6A recovery migration

The original FT-6A SQL blob is preserved unchanged and re-versioned as:

```text
20260827135000_fintech_core_ft6a_order_intent_reconciliation_ledger_recovery.sql
```

The recovery remains additive and fail-closed. It restores the already-designed FT-6A persistence prerequisites, including:

- `binding_version`;
- `client_order_id`;
- risk/compliance decision IDs and output hashes;
- supporting indexes and foreign keys;
- service-role-only `SECURITY INVOKER` persistence RPCs;
- PAPER-only decision-binding behavior.

It does not add a second queue, a second persistence authority, exchange/custody connectivity, real-order execution, `GUARDED_LIVE`, or `PRODUCTION` eligibility.

## 4. Repository gate

`scripts/governance/verifyFintechCoreMigrationLedger.mjs` establishes the reviewed FinTechCore migration baseline.

The existing `scripts/pr/*.test.mjs` test chain now includes `scripts/pr/fintechCoreMigrationLedger.test.mjs` and fails closed when:

1. a canonical migration is missing;
2. an applied/recovery migration SQL blob is rewritten;
3. an unreviewed additional `fintech_core` migration appears.

This intentionally prevents further FinTechCore schema growth until the production ledger is reconciled and the governed baseline is explicitly advanced.

## 5. Deployment sequence

No production database mutation is performed by this branch before PR/merge governance is complete.

After Owner approval, final main synchronization, PR review, required CI and merge:

1. run `supabase migration list` against production;
2. verify that the six already-applied FinTechCore versions match on local and remote sides;
3. run `supabase db push --dry-run`;
4. expected FinTechCore delta: only `20260827135000_fintech_core_ft6a_order_intent_reconciliation_ledger_recovery.sql` is pending;
5. if any other FinTechCore migration is planned, stop and reconcile before applying;
6. apply through the normal versioned Supabase migration path, never by ad-hoc production DDL;
7. verify the migration ledger entry and FT-6A columns/indexes/FKs/RPC privileges;
8. run Supabase security and performance advisors;
9. keep FT-7 and every real-execution promotion blocked.

## 6. Rollback / failure handling

The FT-6A recovery migration is transactional (`BEGIN`/`COMMIT`). A failure before commit must leave no partial durable schema state.

After a successful production application, rollback must use an explicit reviewed follow-up migration. Do not delete or rewrite the production migration-history row to simulate rollback.

Because the recovered columns are additive and nullable and FT-7 remains disabled, the preferred incident response is to keep the ledger truthful, disable any affected consumer path, and remediate forward.

## 7. Acceptance evidence

P0 ledger recovery is complete only when all of the following are true:

- repository FinTechCore applied versions match the production migration ledger;
- the FT-6A recovery is either the sole pending FinTechCore migration or is registered as applied after controlled deployment;
- the old divergent FinTechCore filenames are absent;
- the repository ledger gate passes;
- production contains the FT-6A binding columns, indexes, FKs and expected RPC privilege boundary after deployment;
- Supabase security/performance advisor results are reviewed;
- no additional FinTechCore schema migration bypasses this gate;
- FT-7 / real-execution eligibility remains fail-closed.
