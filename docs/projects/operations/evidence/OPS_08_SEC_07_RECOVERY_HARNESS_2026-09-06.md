# OPS-08-SEC-07 Recovery Evidence Harness — 2026-09-06

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-08` Production Operations  
**Finding:** `S1-R2-07` Recovery / RPO / RTO  
**Branch:** `agent/operations-recovery-rpo-rto-20260906`  
**Implementation baseline:** `main@1b9def6d414ee8838e5403bfc9f705bbbe438d2a`  
**Status:** `IMPLEMENTED_BRANCH / EXECUTION_EVIDENCE_PENDING / SECURITY_UNVERIFIED`

## 1. Purpose

This package operationalizes the existing recovery runbook. It does not create a second recovery architecture, perform a Production restore, change a provider plan, configure secrets, or claim Security closure.

The current OPS roadmap identifies `OPS-08-SEC-07` as the highest executable OPS Security gap. The pre-existing runbook already defined the required conceptual boundary: recurring off-site backup plus an isolated measured restore are required before RPO/RTO can be treated as evidence-backed values.

## 2. Current-main and ownership correlation

At implementation start:

- current `main` was `1b9def6d414ee8838e5403bfc9f705bbbe438d2a`, the Human merge of PR #771;
- zero open Pull Requests were found against `main`;
- no active `OPS-08-SEC-07` work claim was found;
- the known older OPS branches are stale/different-scope and do not authorize or overlap this package;
- `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` assign Production Operations / `PVC-08` to `CAPITAL-AI-OPS`;
- `/AGENTS.md` remains the repository trust root and keeps provider/Production mutations separately protected.

## 3. Provider baseline — read-only

The connected Supabase project was re-read without mutation:

| Property | Observed value |
|---|---|
| Organization | `AIFINANCIAL` |
| Organization plan | `free` |
| Project | `AIFINANCIAL` |
| Project ref | `ryzywoktpmyhwzxmstyu` |
| Region | `eu-west-1` |
| Project status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.127` / engine 17 |
| Storage buckets | `0` |
| Storage objects | `0` |

Current Supabase documentation states that automatic daily platform backups are provided for Pro/Team/Enterprise projects; Free projects should regularly export data. PITR is a paid add-on for eligible paid plans and therefore is not treated as the current CAPITAL-AI recovery baseline.

## 4. Reuse / implementation decision

Repository scan found:

- canonical recovery runbook already exists at `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`;
- no existing recurring backup workflow exists under `.github/workflows/`;
- `supabase/migrations/**` reconstructs schema history but not current user/business data;
- current CI already uses immutable action pins, explicit permissions, workflow security validation, and GitHub Actions artifacts.

Decision: extend those existing controls with one bounded Recovery Evidence workflow rather than introduce an additional backup platform or custom persistence service.

## 5. Implemented repository surface

### `.github/workflows/ops-recovery-evidence.yml`

The workflow provides:

1. daily schedule at `02:17 UTC` and explicit manual modes;
2. main-only execution;
3. fail-closed execution switch `OPS_RECOVERY_EXECUTION_ENABLED=true`;
4. source-project correlation to `ryzywoktpmyhwzxmstyu`;
5. Supabase CLI `2.116.0` installed through immutable action commit `46f7f98c7f948ad727d22c1e67fab04c223a0520`;
6. logical export of roles, schema and data;
7. SHA-256 integrity metadata;
8. client-side `age` X25519 encryption before artifact upload;
9. deletion of plaintext dump files before off-site artifact upload;
10. 35-day encrypted artifact retention;
11. optional restore drill only into a local isolated Supabase target;
12. restored `public`-relation row-count/content fingerprint comparison;
13. measured database restore duration with fail-closed 3600-second target gate;
14. machine-readable JSON evidence carrying source, repository/run identity, hashes, sizes, targets, measured values when available and `securityClosure=NOT_CLAIMED`;
15. cleanup of temporary sensitive files.

### `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`

The runbook now binds the implementation to explicit objectives and evidence semantics:

- database RPO target: **≤24 hours**;
- isolated database-restore RTO target: **≤60 minutes**;
- full-service RTO: **UNVERIFIED**, not inferred from database restore;
- objective values remain `TARGET_ONLY` until measured evidence exists;
- Storage binaries, Render configuration/secrets and external provider state are explicitly outside a logical database dump.

## 6. Protected configuration boundary

The workflow expects these execution-host inputs, but this branch does not create/change them:

- GitHub Secret `SUPABASE_DB_URL`;
- GitHub Variable `OPS_RECOVERY_AGE_RECIPIENT`;
- GitHub Secret `OPS_RECOVERY_AGE_IDENTITY` for restore drills;
- GitHub Variable `OPS_RECOVERY_EXECUTION_ENABLED`.

Changing connector/app permissions or repository execution-host secrets/variables is outside this branch and requires separate Human/Owner authorization under the current trust root.

## 7. Validation truth

Completed before PR preparation:

- current-main / project / PVC / Primary Owner correlation;
- zero-open-PR correlation at branch start;
- existing runbook and existing workflow capability scan;
- current Supabase organization/project/plan read-only correlation;
- current Supabase backup/PITR documentation lookup;
- current Supabase Storage metadata read-only correlation;
- workflow action pin resolved to immutable upstream commit;
- branch implementation constrained to Recovery/OPS documentation plus one workflow.

Not yet executed / not represented as PASS:

- scheduled backup workflow;
- production-source logical dump through GitHub Actions;
- encrypted artifact upload through the new workflow;
- isolated local-Supabase restore drill;
- measured RPO operating interval;
- measured restore RTO;
- full-service recovery drill;
- CAPITAL-AI-SEC independent verification;
- PR hosted checks for this branch.

## 8. Exit gate

`OPS-08-SEC-07` is **not closed** by this implementation branch.

Repository implementation exit:

- [x] bounded recovery objectives defined;
- [x] recurring encrypted off-site backup harness implemented;
- [x] isolated measured restore harness implemented;
- [x] secret/plaintext handling is fail-closed and no dump is committed;
- [x] Production/provider mutation is absent from the package.

Operational evidence exit:

- [ ] separately authorized protected GitHub inputs configured;
- [ ] at least two consecutive scheduled backup runs succeed;
- [ ] encrypted artifact hashes/retention evidence are available;
- [ ] at least one isolated restore drill succeeds with integrity match;
- [ ] observed backup interval supports the ≤24 h RPO target;
- [ ] measured isolated DB restore supports the ≤60 min RTO target;
- [ ] full-service recovery remains explicitly separate or is measured by a later E2E drill;
- [ ] CAPITAL-AI-SEC independently verifies returned evidence.
