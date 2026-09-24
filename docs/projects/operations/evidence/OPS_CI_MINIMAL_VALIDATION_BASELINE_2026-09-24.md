# OPS CI Minimal Validation Baseline — 2026-09-24

**Project:** `CAPITAL-AI-OPS`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02` with PVC-06/PVC-07 release boundaries  
**Assurance:** `CAPITAL-AI-QM` and `CAPITAL-AI-SEC`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Execution baseline:** `main@13c27d69ba5564e32eea089455d3ccf60860c391`  
**Evidence state:** `PARTIAL_REAL_EVIDENCE / FULL_LIFECYCLE_LEDGER_NOT_YET_MATERIALIZED`

## Purpose

This record separates observed hosted GitHub evidence from estimates. It is the
baseline for `OPS-CI-MINIMAL-VALIDATION-V3`; it is not a synthetic PASS and it
does not replace Required Checks.

## Canonical three-day window

The canonical `OPS-02-CI-01E` measurement window is:

- start: `2026-09-21T21:42:00+02:00`;
- end: `2026-09-24T21:42:00+02:00`.

Provider readback found **160 Pull Requests merged inside that window**.

The repository analyzer `scripts/pr/analyzeRunnerLifecycle.mjs` requires every
attributable workflow run, attempt and actually started job for every merged PR
before the canonical P0-B lifecycle baseline can be declared complete. That
complete 160-PR ledger has not been materialized in this execution. Therefore:

- canonical three-day total runner minutes: `NOT_PROVEN`;
- canonical waste ratio: `NOT_PROVEN`;
- canonical preflight-avoidable minutes: `NOT_PROVEN`;
- no complete P0-B PASS is claimed.

Fresh Human/Owner direction on 2026-09-24 separately authorizes the bounded V3
CI reduction from current main. The incomplete aggregate ledger remains an
evidence gap rather than a blocker to making already observed over-validation
more selective.

## Detailed build-and-test sample

The twenty consecutive `ci.yml` runs `#6400..#6419` were inspected at
provider level, including their build-and-test job/step states.

| Mode | Runs | Observed wall-time summary |
|---|---:|---:|
| FULL | 15 | ~2602 s total / ~173.5 s average |
| CHANGED | 4 | ~241 s total / ~60.3 s average |
| NONE | 1 | ~22 s |
| REUSE | 0 | no observed reuse in this sample |

The FULL count includes one concurrency-cancelled main run. The table is a
bounded sample of `ci.yml`, not a repository-wide billing total.

### Observed causes

1. FULL runs executed roughly 574–575 Vitest files. Representative Vitest
   durations were approximately 80–123 seconds even though aggregate test-body
   time was much lower; discovery/import/process overhead therefore dominates.
2. CHANGED runs selected one affected Vitest file in the observed examples.
   Their test-body duration was roughly 120–165 ms while end-to-end CI remained
   around one minute because checkout, setup, `npm ci`, TypeScript and build
   still execute.
3. PR #1428 produced `profile=focused` but `vitest=full` for a mixed
   workflow/PR-validator change. That is direct evidence of planner coupling.
4. Runs #6402, #6404 and #6408 spent the full-suite cost before the same
   Supabase migration-ledger contract failed.
5. Main run #6409 passed the test/build work and failed later during keyless
   Sigstore/Cosign signing while reading the GitHub OIDC token. A cheap OIDC
   capability check can therefore fail before the expensive main path.

## V3 comparison target

Post-change evidence must distinguish:

- documentary NONE;
- frontend/application CHANGED;
- server/runtime CHANGED + security sentinels + build/predeploy;
- database CHANGED + migration-ledger fail-fast;
- workflow/governance focused Node validation;
- dependency/global/unknown/main FULL.

The target of roughly 45–60 seconds applies to ordinary focused Pull Requests.
It is not a promise for full main production validation.

## Evidence integrity

No Required Check is removed. No Security, QM, Governance, Release, Production,
Human or CODEOWNER gate is downgraded. Unknown impact remains fail-closed FULL.
Post-change hosted timings remain `NOT_RUN` until GitHub executes the exact PR
head.
