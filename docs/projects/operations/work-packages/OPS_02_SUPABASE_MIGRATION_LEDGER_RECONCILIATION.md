# OPS-02 — Supabase Migration Ledger Reconciliation

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Baseline:** `main@256f02ce2972d8432ad02e8fd8bceba907475efb`  
**Branch:** `agent/operations-supabase-migration-ledger-reconciliation-20260910`  
**Status:** `IMPLEMENTED_BRANCH / EVIDENCE_READY`  
**Mutation class:** repository-only; Supabase read-only discovery only

## Objective

Establish a complete and reproducible reconciliation between the current production Supabase migration-history snapshot and current-main migration files without rewriting remote history or applying schema changes.

## Scope

Included:

- read-only inventory of the Supabase production migration ledger;
- inventory of current `supabase/migrations/*.sql` files;
- deterministic classification of every remote version as `EXACT_MATCH`, `TIMESTAMP_ALIAS`, or `REMOTE_ONLY_HISTORY`;
- explicit current-local-only set difference;
- machine-readable repository ledger;
- fail-closed repository validator and PR test;
- evidence record defining the provider-repair authorization boundary.

Excluded:

- `supabase migration repair`;
- `apply_migration`, `db push`, DDL or DML;
- renaming or rewriting existing migration SQL;
- Supabase project configuration, roles, secrets or permissions;
- Production deployment or schema mutation;
- semantic equivalence claims for differently named migrations without content-level proof.

## Artifacts

- `docs/projects/operations/controlled-implementation/OPS_02_SUPABASE_MIGRATION_LEDGER_RECONCILIATION.json`
- `docs/projects/operations/evidence/OPS_02_SUPABASE_MIGRATION_LEDGER_RECONCILIATION_2026-09-10.md`
- `scripts/governance/verifySupabaseMigrationLedgerReconciliation.mjs`
- `scripts/pr/supabaseMigrationLedgerReconciliation.test.mjs`

## Current result

The exact recorded remote snapshot contains 70 versions. Against 53 current-main local SQL migrations:

- `15` are `EXACT_MATCH`;
- `29` are `TIMESTAMP_ALIAS` by exact normalized migration-name identity;
- `26` are `REMOTE_ONLY_HISTORY` under the conservative current-repository rule;
- `0` are unknown/unclassified;
- `9` current local migrations remain local-only in this identity reconciliation.

The repository validator recomputes the local inventory, rejects missing or mispointed mappings, rejects an alias whose normalized name does not match, rejects remote-only classification when a current timestamp/name match exists, and asserts that all 70 snapshot rows are covered exactly once.

## Exit gate

`IMPLEMENTED_BRANCH / EVIDENCE_READY` is reached when:

1. every one of the 70 remote versions is represented exactly once in the machine ledger;
2. unknown classifications equal zero;
3. all exact/alias local paths exist in current repository state;
4. the declared local-only set equals the actual set difference;
5. the fail-closed validator and negative tests pass;
6. no Supabase provider or Production mutation has occurred;
7. any future provider-history repair is separately scoped, content/schema-aware, minimal and explicitly authorized.

This work package creates no authority to repair provider history. A later repair package is warranted only if independent content/schema evidence proves that a specific remote history row itself is incorrect rather than merely timestamp-divergent.
