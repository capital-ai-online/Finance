# SH-02 Baseline Evidence Handoff — 2026-09-24

**Issue:** #1357  
**Parent:** OPS-08-B-SH-02  
**Implementation baseline:** `main@db5c673502c6ae62547371d7bd6c58d42460be25`  
**Branch:** `operations/sh02-baseline-evidence-handoff-20260924`

## Observed failure

PR #1353 CI #6043 produced the deterministic finding:

`CURRENT_STATE_PROJECTION_BASELINE_STALE: docs/projects/documentary/ROADMAP.md`

The source CI completed with the full test suite failed while TypeScript and the
rest of the corpus were healthy. The Current-State Baseline Autofix listener then
completed its read-only plan but skipped patch/write. Its eligibility path read
`gh run view --log-failed`; the listener received no exact target evidence at
that observation point.

The PR Autofix Controller independently returned:

- classification: `UNKNOWN_FAILURE`
- decision: `BLOCKED_UNKNOWN`
- reason: `no-exact-allowlisted-failure-class`

Later readback of the same CI job contained the exact baseline-stale record.
This establishes a handoff/materialization race in failure-log consumption rather
than an unregistered Self-Healing class.

## Convergence decision

The existing Self-Healing class and writer remain authoritative:

`CURRENT_STATE_PROJECTION_BASELINE_STALE`
→ `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT`
→ `RECONCILE_REPOSITORY_PROJECTION`
→ Current-State Baseline Autofix.

No second writer is introduced.

Eligibility now uses two stable evidence layers:

1. structured completed-run job metadata proves that the exact
   `build-and-test / Vollständige Test-Suite ausführen` step failed;
2. trusted-main code reads the exact PR-head changed projection and reproduces
   `CURRENT_STATE_PROJECTION_BASELINE_MISSING|STALE` against the exact
   CURRENT_MAIN SHA.

Only then may the existing repairer produce its bounded baseline patch.

## Fail-closed behavior

- no changed project ROADMAP/TASK_REGISTER candidate → no specialist action;
- full-suite step did not fail → no specialist action;
- exact repository reproduction finds no baseline drift → no mutation;
- required candidate file/evidence unavailable → explicit
  `EVIDENCE_UNAVAILABLE` failure;
- central classifier receives empty failure evidence →
  `FAILURE_EVIDENCE_UNAVAILABLE / BLOCKED_NOT_PROVEN`, not
  `UNKNOWN_FAILURE`;
- current main/head drift before write → existing branch-sync lane;
- write remains force=false through the existing canonical writer lease;
- Human/CODEOWNER merge authority is unchanged.

## Writer correlation

Two historical claims still appeared `active/exclusive=true` on CURRENT_MAIN,
but their own release conditions had already fired:

- `GOV-SH-V3-02-DISPATCH-REENTRY-FIX-20260921` → associated PR #1218 merged;
- `OPS-PR-CONVERGENCE-CHAIN-HARDENING-20260920` → associated PR #1139 merged.

They are released in this slice as stale coordination metadata. Open PR #1356
does not touch the files mutated by this slice.

## Validation target

Required exact-head evidence:

- detector unit tests PASS;
- PR autofix classifier tests PASS;
- Current-State Baseline Autofix workflow tests PASS;
- workflow security PASS;
- Governance PASS;
- build-and-test PASS;
- no new writer/controller/authority.
