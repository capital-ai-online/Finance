# OPS-08-SEC-07 Recovery Evidence Harness — 2026-09-06

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-08` Production Operations  
**Finding:** `S1-R2-07` Recovery / RPO / RTO  
**Branch:** `agent/operations-recovery-rpo-rto-20260906`  
**Implementation-start baseline:** `main@1b9def6d414ee8838e5403bfc9f705bbbe438d2a`  
**Latest resync/correlation baseline:** `main@169cf96ac4d90ffaacab22d88541b837fd66fe8d`  
**Status:** `IMPLEMENTED_BRANCH / EXECUTION_EVIDENCE_PENDING / SECURITY_UNVERIFIED`

## 1. Purpose

This package operationalizes the existing recovery runbook. It does not create a second recovery architecture, perform a Production restore, change a provider plan, configure secrets, or claim Security closure.

The current OPS roadmap identifies `OPS-08-SEC-07` as the highest executable OPS Security gap. The pre-existing runbook already defined the required conceptual boundary: recurring off-site backup plus an isolated measured restore are required before RPO/RTO can be treated as evidence-backed values.

## 2. Current-main and ownership correlation

At implementation start, `main` was `1b9def6d414ee8838e5403bfc9f705bbbe438d2a`. Before continuing the package on 2026-09-06, the branch was re-correlated and merge-resynced to `main@169cf96ac4d90ffaacab22d88541b837fd66fe8d` without rewriting its prior history.

At the latest correlation point:

- zero open Pull Requests were found against `main`;
- the `main` commits added since branch start had no changed-file overlap with the Recovery package;
- `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` assign Production Operations / `PVC-08` to `CAPITAL-AI-OPS`;
- `docs/projects/operations/ROADMAP.md` still identifies `OPS-08-SEC-07` as the highest executable OPS Security gap;
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
| `auth.users` | `5` rows |
| `auth.identities` | `5` rows |
| Storage buckets | `0` |
| Storage objects | `0` |

Current Supabase documentation states that automatic daily platform backups are provided for Pro/Team/Enterprise projects; Free projects should regularly export data. PITR is a paid add-on for eligible paid plans and therefore is not treated as the current CAPITAL-AI recovery baseline.

Current Supabase CLI source/documentation was also correlated to remove ambiguity around managed schemas:

- the normal schema dump filters provider-managed `auth` and `storage` schema definitions because the target Supabase instance supplies those managed schemas;
- the documented `--data-only --use-copy` backup path includes Auth/Storage database data, including `auth.users`;
- Supabase Storage **binary objects** are not recovered by the database dump and require a separate transfer/backup path.

This distinction is now enforced by the repository harness instead of being left as documentation-only knowledge.

## 4. Reuse / implementation decision

Repository scan found:

- canonical recovery runbook already exists at `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`;
- no existing recurring backup workflow exists under `.github/workflows/`;
- `supabase/migrations/**` reconstructs schema history but not current user/business data;
- current CI already uses immutable action pins, explicit permissions, workflow security validation, and GitHub Actions artifacts.

Decision: extend those existing controls with one bounded Recovery Evidence workflow plus one focused dump-integrity helper rather than introduce an additional backup platform or custom persistence service.

## 5. Implemented repository surface

### `.github/workflows/ops-recovery-evidence.yml`

The workflow provides:

1. daily schedule at `02:17 UTC` and explicit manual modes;
2. main-only execution;
3. fail-closed execution switch `OPS_RECOVERY_EXECUTION_ENABLED=true`;
4. exact-`github.sha` checkout with immutable `actions/checkout` pin and no persisted credentials;
5. source-project correlation to `ryzywoktpmyhwzxmstyu`;
6. Supabase CLI `2.116.0` installed through immutable action commit `46f7f98c7f948ad727d22c1e67fab04c223a0520`;
7. logical export of roles, schema and data;
8. pre-encryption source coverage validation for `public`, `auth.users`, `auth.identities`, `storage.buckets` and `storage.objects`;
9. fail-closed refusal when `storage.objects` contains rows because Storage binary backup is not implemented by this bounded package;
10. SHA-256 integrity metadata;
11. client-side `age` X25519 encryption before artifact upload;
12. deletion of plaintext dump files before off-site artifact upload;
13. 35-day encrypted artifact retention;
14. optional restore drill only into a local isolated Supabase target;
15. order-independent row-count/content fingerprint comparison for all `public` relations plus recovery-critical Auth/Storage relations;
16. measured database restore duration with fail-closed 3600-second target gate;
17. machine-readable JSON evidence carrying source, repository/run identity, hashes, sizes, Auth/Storage coverage, targets, measured values when available and `securityClosure=NOT_CLAIMED`;
18. cleanup of temporary sensitive files.

### `scripts/operations/recoveryDumpIntegrity.mjs`

The helper parses Supabase `COPY ... FROM stdin` data dumps without retaining raw recovered rows in evidence. It hashes each row, compares sorted row-digest multisets, and therefore treats dump row order as non-authoritative while detecting row-count/content drift.

Its recovery comparison scope is deliberately bounded:

- all `public` relations;
- `auth.users`;
- `auth.identities`;
- `storage.buckets`;
- `storage.objects`.

Other provider-internal Auth/Storage helper tables are not promoted into a CAPITAL-AI recovery contract because their shape/content can legitimately vary by Supabase runtime version.

### `tests/unit/opsRecoveryEvidence.test.ts`

Focused regression coverage locks:

- main-only and least-privilege workflow boundaries;
- immutable checkout and no persisted credentials;
- pre-encryption recovery coverage inspection;
- Auth/Public/Storage restore comparison;
- order-independent data matching;
- negative Auth divergence;
- fail-closed Storage-object boundary;
- required Auth/Storage recovery relation presence.

### `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`

The runbook binds the implementation to explicit objectives and evidence semantics:

- database RPO target: **≤24 hours**;
- isolated database-restore RTO target: **≤60 minutes**;
- full-service RTO: **UNVERIFIED**, not inferred from database restore;
- objective values remain `TARGET_ONLY` until measured evidence exists;
- Storage binaries, Render configuration/secrets and external provider state remain explicitly outside a logical database dump.

## 6. Protected configuration boundary

The workflow expects these execution-host inputs, but this branch does not create/change them:

- GitHub Secret `SUPABASE_DB_URL`;
- GitHub Variable `OPS_RECOVERY_AGE_RECIPIENT`;
- GitHub Secret `OPS_RECOVERY_AGE_IDENTITY` for restore drills;
- GitHub Variable `OPS_RECOVERY_EXECUTION_ENABLED`.

Changing connector/app permissions or repository execution-host secrets/variables is outside this branch and requires separate Human/Owner authorization under the current trust root.

## 7. Validation truth

Completed during repository implementation/correlation:

- current-main / project / PVC / Primary Owner correlation;
- zero-open-PR correlation at implementation start and latest continuation point;
- changed-file overlap check after main advanced;
- branch merge-resync to `main@169cf96ac4d90ffaacab22d88541b837fd66fe8d`;
- existing runbook and existing workflow capability scan;
- current Supabase organization/project/plan read-only correlation;
- current Supabase Auth row-count readback (`5` users / `5` identities);
- current Supabase Storage metadata read-only correlation (`0` buckets / `0` objects);
- current Supabase backup/restore documentation lookup;
- current Supabase CLI dump-source correlation distinguishing schema filtering from data-dump inclusion;
- workflow action pins resolved to immutable commits;
- dump-integrity helper syntax/fixture prototyping including positive order-independent comparison and fail-closed Storage-object behavior.

Repository/hosted checks must still be reported from actual executions; they are not inferred from code review.

Not yet executed / not represented as PASS:

- scheduled backup workflow;
- production-source logical dump through GitHub Actions;
- encrypted artifact upload through the new workflow;
- isolated local-Supabase restore drill through the hosted workflow;
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
- [x] Auth recovery coverage is explicit and fail-closed;
- [x] Storage binary-coverage limitation is explicit and fail-closed when objects exist;
- [x] secret/plaintext handling is fail-closed and no dump is committed;
- [x] Production/provider mutation is absent from the package.

Operational evidence exit:

- [ ] separately authorized protected GitHub inputs configured;
- [ ] at least two consecutive scheduled backup runs succeed;
- [ ] encrypted artifact hashes/retention evidence are available;
- [ ] at least one isolated restore drill succeeds with Auth/Public/Storage integrity match;
- [ ] observed backup interval supports the ≤24 h RPO target;
- [ ] measured isolated DB restore supports the ≤60 min RTO target;
- [ ] any future Supabase Storage object use is preceded by an authorized binary-backup implementation or this harness remains fail-closed;
- [ ] full-service recovery remains explicitly separate or is measured by a later E2E drill;
- [ ] CAPITAL-AI-SEC independently verifies returned evidence.
