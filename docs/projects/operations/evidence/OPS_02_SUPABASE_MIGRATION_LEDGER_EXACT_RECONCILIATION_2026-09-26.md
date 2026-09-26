# OPS-02 — Supabase Migration Ledger Exact Reconciliation Evidence

**Date:** `2026-09-26`  
**Project:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02` with supporting `PVC-08`  
**Repository baseline:** `36fd8502178f42fd3b20562f4f60290fcbb2d11f`  
**Supabase project:** `ryzywoktpmyhwzxmstyu`  
**Mode:** repository mutation; provider read-only  
**Status:** `BRANCH_IMPLEMENTED / EXACT_HEAD_CHECKS_PENDING`

## Read-only provider evidence

A fresh `list_migrations` readback returned 78 ordered version/name rows. The latest entries are `20260924011545_auth_registration_profile_convergence` and `20260924161429_profile_identity_settings`. The latter is already exact on current main.

The provider history table exposes one recorded statement payload for every row. Those payloads were read without executing them and used to materialize missing historical files. No provider history row was inserted, updated, deleted, repaired, marked applied, or marked reverted.

## Before and after

| Metric | Before | Branch target |
|---|---:|---:|
| Remote rows | 78 | 78 |
| Local SQL files | 61 | 85 |
| Exact version/name paths | 19 | 78 |
| Timestamp aliases | 32 | 0 |
| Remote-only repository gaps | 27 | 0 |
| Local-only migrations | 10 | 7 |

The three removed local-only files are consolidated duplicates now represented by their exact remote-history paths:

- `20260711000000_iam.sql`;
- `20260731000300_iam_access_log_context.sql`;
- `20260731000400_security_events_stepup_totp.sql`.

The seven retained local-only migrations remain explicit and are not applied by this PR.

## Safety boundary

- no Supabase schema/data mutation;
- no `migration repair`;
- no production deployment;
- no secret or provider-setting change;
- no claim that filename alignment alone authorizes a future push;
- database/migration change remains Human/CODEOWNER merge only.

## Pending exact-head evidence

- canonical ledger validator;
- focused migration-ledger tests;
- repository build/test/security/governance checks;
- Supabase Preview.
