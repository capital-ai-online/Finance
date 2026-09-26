# OPS-02 — Supabase Migration Ledger Exact Reconciliation

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Supporting PVC:** `PVC-08 — Production Operations`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Implementation baseline:** `main@36fd8502178f42fd3b20562f4f60290fcbb2d11f`  
**Merged main:** `main@b4fe15600a20e22c0b5d58f8d358888491cdf0a0`  
**Merged PR:** `#1467`  
**Branch:** `operations/supabase-ledger-exact-reconciliation-20260926`  
**Status:** `MERGED_MAIN / EVIDENCE_GATE / SUPABASE_PREVIEW_NOT_PROVEN`  
**Mutation class:** repository-only; Supabase read-only

## Meaning of the ledger

The migration ledger is the ordered receipt journal in `supabase_migrations.schema_migrations`. Each applied migration is identified by its 14-digit version and name. Supabase Preview compares those remote versions with `supabase/migrations/*.sql`; a name-only alias does not satisfy the provider because the timestamp is the migration identity.

## Correlated failure

The previous OPS-02 guard classified history but intentionally left timestamp aliases and remote-only history in place. At the current baseline:

- remote ledger: `78`;
- local SQL files: `61`;
- exact paths: `19`;
- timestamp aliases: `32`;
- remote-only repository gaps: `27`;
- local-only files: `10`.

This explains why the repository classifier could pass while Supabase Preview failed with `Remote migration versions not found in local migrations directory`.

## Repository-only fix

1. Materialize all 59 missing remote version/name paths from the read-only `schema_migrations.statements` evidence.
2. Remove 32 superseded timestamp-alias paths.
3. Remove three consolidated catch-up duplicates whose exact remote-history paths are now present.
4. Keep seven genuine repository-local migrations explicitly pending.
5. Refresh the canonical machine ledger to `78 EXACT_MATCH / 0 TIMESTAMP_ALIAS / 0 REMOTE_ONLY_HISTORY / 7 local-only`.
6. Update filename-bound tests.

No `migration repair`, `db push`, `apply_migration`, DDL, DML, provider configuration, role, secret, or Production mutation is part of this work item.

## Exit gate

- every remote version/name has one exact repository path;
- no old alias path remains;
- the canonical validator and focused tests pass;
- Supabase Preview passes on the exact PR head;
- Human/CODEOWNER review and merge remain required.

## Post-merge closure — 2026-09-26

Repository reconciliation is Human-merged through PR #1467 as `b4fe15600a20e22c0b5d58f8d358888491cdf0a0`. Exact-head CI #6595, Governance #6106, Container Security #3578, Project Execution Directive #891, OSS/PR #973, GitGuardian and License checks were terminal-success. The Supabase provider check named **Supabase Preview** was observed as `skipped`, however, so the package's explicit Preview exit criterion is not promoted to PASS.

The merged claim is released because the repository writer is terminal. The work package remains evidence-gated until an owner-correct Supabase Preview/readback proves that the exact migration-history paths are accepted by the provider.

**Closure disposition:** `MERGED_MAIN / EVIDENCE_GATE / SUPABASE_PREVIEW_NOT_PROVEN`.
