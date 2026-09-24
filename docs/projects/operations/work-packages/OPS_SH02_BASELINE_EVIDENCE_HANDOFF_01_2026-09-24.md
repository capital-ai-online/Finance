# OPS-SH02-BASELINE-EVIDENCE-HANDOFF-01

**Project:** `CAPITAL-AI-OPS`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-08, PVC-18`  
**Parent:** `OPS-08-B-SH-02 — Autonomous Self-Healing Backend & Frontend`  
**Source Issue:** `#1357`  
**Baseline:** `main@db5c673502c6ae62547371d7bd6c58d42460be25`  
**Status:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`

## Goal

Harden the existing Current-State Baseline Autofix so the deterministic
`CURRENT_STATE_PROJECTION_BASELINE_STALE|MISSING` class does not depend on the
eventual availability of GitHub run log archives.

The existing specialist remains the only writer. No second classifier, workflow,
branch-sync lane, PR-body writer or Self-Healing authority is introduced.

## Reproduced source evidence

PR #1353 / CI #6043 failed in the full test suite because
`docs/projects/documentary/ROADMAP.md` carried a stale main baseline. The
specialist workflow started after CI completion but its `gh run view --log-failed`
handoff yielded no target evidence, so patch/write were skipped. The central
classifier independently degraded the same run to `UNKNOWN_FAILURE`.

## Scope

- release stale coordination claims whose associated PRs are already merged;
- derive stable completed-run evidence from the structured failed
  `build-and-test / Vollständige Test-Suite ausführen` step;
- reproduce baseline drift read-only on the exact PR head with trusted-main
  `validateCurrentStateProjectionFreshness`;
- preserve the exact `docs/projects/<project>/(ROADMAP|TASK_REGISTER).md`
  allowlist and existing max-two-line repair scope;
- expose empty failure-log evidence as explicit
  `FAILURE_EVIDENCE_UNAVAILABLE / BLOCKED_NOT_PROVEN`;
- retain one writer, exact CURRENT_MAIN/head revalidation, force=false write and
  Human/CODEOWNER merge authority.

## Dependencies

- `/AGENTS.md@CURRENT_MAIN`;
- existing `.github/workflows/current-state-baseline-autofix.yml`;
- existing `RECONCILE_REPOSITORY_PROJECTION` SH-1 action;
- existing `scripts/governance/controlPlaneFreshnessRules.mjs`;
- existing `repairCurrentStateProjectionBaselines.mjs`.

## Exit evidence

1. #1353-shaped stale and missing baseline fixtures are reproduced from repository evidence.
2. A current baseline produces no repair.
3. Missing candidate evidence fails closed with an explicit evidence-unavailable error.
4. The specialist no longer uses `gh run view --log-failed` to decide baseline repair eligibility.
5. Patch/write execute only after structured full-suite failure plus trusted repository reproduction.
6. Empty central classifier evidence is not reported as `UNKNOWN_FAILURE`.
7. Existing writer lease, branch sync, exact-head CI and Human/CODEOWNER merge boundaries remain unchanged.
8. Exact-head CI, Governance, workflow-security and relevant Self-Healing tests pass.

## Non-goals

- generic Issue-to-code remediation;
- provider or Production mutation;
- SH-02.12 activation;
- a second Self-Healing controller or baseline writer;
- broader TypeScript/test autofix.
