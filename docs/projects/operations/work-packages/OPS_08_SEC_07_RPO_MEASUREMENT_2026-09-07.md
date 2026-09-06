# OPS-08-SEC-07 — Measured RPO Evidence Evaluation

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-08 — Production Operations`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Security finding:** `S1-R2-07 — Disaster recovery / RPO / RTO`  
**Branch:** `agent/operations-recovery-rpo-evidence-20260907`  
**Implementation baseline:** `main@b64b5e70fb66b5e22c34c9237c37b10fa7f0efbf`  
**Status:** `IMPLEMENTED_BRANCH / OPERATIONAL_EVIDENCE_PENDING / SECURITY_UNVERIFIED`

## 1. Current-main correlation

The existing Recovery Evidence Harness from Human-merged PR #776 is already present on current main. It provides the recurring encrypted off-site backup path, the isolated Supabase restore drill, integrity comparison and measured database-restore duration. This package does **not** introduce another backup or recovery architecture.

The remaining repository-local measurement gap is narrower: existing recovery evidence records `workflowRunId` and backup timestamps, but there was no deterministic evaluator that correlated multiple successful scheduled workflow runs and calculated the observed interval against the database RPO target of `<= 86400` seconds.

Current repository boundaries remain unchanged:

- `/AGENTS.md` is the repository trust root;
- `PVC-08` is owned by `CAPITAL-AI-OPS`;
- `S1-R2-07` remains `OPEN / UNVERIFIED` until measured operational evidence and independent CAPITAL-AI-SEC verification exist;
- provider/execution-host configuration and Production mutation remain separately Human-gated;
- full-service RTO remains outside the database-RPO evaluator.

## 2. Reuse decision

Reuse order was applied before custom implementation:

1. existing repository Recovery Evidence workflow — **REUSED unchanged**;
2. existing machine-readable recovery evidence schema `1.1.0` — **REUSED**;
3. existing GitHub workflow-run identity `workflowRunId` — **REUSED**;
4. existing GitHub read-only workflow-run metadata — **CORRELATED**, not duplicated into another authority surface;
5. only the missing deterministic RPO interval evaluator is added as repository-local code.

No new provider, plugin, persistence service, backup system, recovery authority, ADR or ESS is introduced.

## 3. Implemented code

### `scripts/operations/recoveryRpoEvidence.mjs`

The evaluator:

- accepts one or more existing `OPS-08-SEC-07` evidence JSON files;
- requires the existing evidence schema `1.1.0` and work item identity;
- preserves `source.readOnlyBackup=true` and `securityClosure=NOT_CLAIMED` as fail-closed invariants;
- rejects evidence with Storage objects while binary backup coverage is still unavailable;
- joins each evidence file to read-only GitHub workflow-run metadata by `workflowRunId`;
- counts only runs whose metadata is `status=completed`, `conclusion=success`, `event=schedule`;
- excludes manual `workflow_dispatch` runs from recurring RPO evidence;
- deduplicates workflow run/attempt identities;
- sorts successful scheduled backups by `backup.startedAt`;
- calculates every observed inter-backup interval and the maximum observed interval;
- returns `MEASURED_PASS` only when at least two eligible scheduled runs exist and the maximum interval is `<= 86400` seconds;
- returns `MEASURED_FAIL` when the measured interval exceeds the target;
- returns `INSUFFICIENT_EVIDENCE` when fewer than two eligible scheduled runs exist;
- returns `securityClosure=NOT_CLAIMED` in every result.

If future evidence embeds an event identity and the GitHub run metadata disagrees, evaluation fails closed rather than selecting one silently.

## 4. Read-only operational input contract

The evaluator intentionally does not fetch or mutate provider state itself. Its inputs are:

1. machine-readable recovery evidence JSON files downloaded from successful Recovery Evidence workflow artifacts;
2. a read-only GitHub Actions workflow-runs response containing at least `id`, `event`, `status` and `conclusion` for the corresponding workflow runs.

Example invocation:

```bash
RPO_TARGET_SECONDS=86400 node scripts/operations/recoveryRpoEvidence.mjs \
  --runs workflow-runs.json \
  ops-recovery-20260907T021700Z-evidence.json \
  ops-recovery-20260908T021700Z-evidence.json
```

A `MEASURED_PASS` result is OPS evidence only. It does not constitute CAPITAL-AI-SEC `VERIFIED/CLOSED`, does not prove full-service RTO, and does not authorize a restore or other Production mutation.

## 5. Test coverage

`tests/unit/opsRecoveryRpoEvidence.test.ts` covers:

- exact-target `86400` second successful scheduled interval -> `MEASURED_PASS`;
- manual `workflow_dispatch` exclusion -> `INSUFFICIENT_EVIDENCE` when only one scheduled run remains;
- unsuccessful scheduled run exclusion;
- `86401` second interval -> `MEASURED_FAIL`;
- evidence/run-metadata event identity mismatch -> fail closed;
- Storage-object evidence without binary backup coverage -> fail closed.

## 6. Validation truth

Executed locally against the branch implementation logic:

- Node syntax check for `recoveryRpoEvidence.mjs`: **PASS**;
- exact 24-hour interval evaluation: **PASS / MEASURED_PASS**;
- manual workflow-dispatch exclusion: **PASS**;
- 24-hour + 1-second interval: **PASS / MEASURED_FAIL**;
- Storage object without binary backup path: **PASS / fail closed**.

Not run / not claimed:

- repository `npm ci`;
- Vitest suite in a full repository checkout;
- TypeScript/lint/full production build;
- hosted GitHub PR checks;
- actual scheduled Recovery Evidence workflow execution;
- download/correlation of real Recovery Evidence artifacts;
- measured operational RPO;
- isolated restore drill for this branch;
- measured database RTO for this branch;
- full-service recovery drill;
- CAPITAL-AI-SEC independent verification.

Hosted checks remain post-PR evidence under the current repository lifecycle and are not inferred from code inspection.

## 7. Exit gates

### Repository implementation exit

- [x] existing PR #776 Recovery architecture reused;
- [x] deterministic RPO interval evaluator implemented;
- [x] successful scheduled-vs-manual run classification bound to GitHub workflow-run metadata;
- [x] failed runs excluded;
- [x] Storage binary-coverage limitation remains fail closed;
- [x] Security closure remains explicitly unclaimed;
- [x] focused regression tests added;
- [x] no provider/Production mutation introduced.

### Operational evidence exit

- [ ] protected Recovery Evidence execution inputs are separately configured/authorized where required;
- [ ] at least two successful scheduled backup evidence artifacts exist;
- [ ] corresponding read-only workflow-run metadata is captured;
- [ ] evaluator returns `MEASURED_PASS` for the observed interval;
- [ ] at least one isolated restore drill returns integrity match and measured database RTO `<= 3600` seconds;
- [ ] full-service RTO remains separately scoped or separately measured;
- [ ] CAPITAL-AI-SEC independently verifies the returned evidence.

Until those operational gates complete, `OPS-08-SEC-07 / S1-R2-07` remains `OPEN / OPERATIONAL_EVIDENCE_PENDING / SECURITY_UNVERIFIED`.
