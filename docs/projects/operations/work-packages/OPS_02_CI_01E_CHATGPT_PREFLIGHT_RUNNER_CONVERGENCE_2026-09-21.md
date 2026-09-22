# OPS-02-CI-01E — ChatGPT Preflight & Runner-Minute Convergence

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Assurance:** `CAPITAL-AI-QM`  
**Security boundary:** `CAPITAL-AI-SEC`  
**Governance boundary:** `CAPITAL-AI-GOV`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Fresh execution baseline:** `main@22541eedb57d5cc690b13bc9b8284ae5a6f07c0c`  
**Parent:** `OPS-02-CI-01 — Build/Test Cost & Scope Reduction`  
**Status:** `OWNER-DIRECTED / ACTIVE / P0 FOUNDATION`

## Objective

Reduce GitHub Actions executions, runner minutes and PR convergence time without reducing Required Checks, Security, Quality, Human or CODEOWNER gates.

Validation converges through:

`ChatGPT Preflight -> Minimal Exact-Head PR Validation -> Full Main Validation`

Preflight evidence is advisory for hosted-check selection/error avoidance until a separately accepted attestation contract cryptographically binds all required execution inputs. Missing execution is `NOT_RUN`, never inferred `PASS`.

## Preliminary baseline

The Owner-provided final-head sample of ten merged PRs totals **52.66 runner-minutes**, averaging **5.27 min/PR**, with mean created-to-merge **48.2 min/PR**. This is explicitly a lower bound because earlier heads, failed attempts and reruns were not fully included.

The three-day lifecycle baseline supersedes this preliminary number only after all heads, runs, attempts and started jobs are collected.

## P0-A — Machine-readable ChatGPT preflight

`scripts/pr/planPrValidation.mjs --preflight-evidence` emits exact:

- base SHA;
- head SHA;
- tree SHA;
- PR class;
- Production impact;
- changed paths;
- `NONE / FOCUSED / FULL` profile;
- selected tests;
- expected Required exact-head contexts;
- tool versions;
- per-check `PASS / FAIL / NOT_RUN`;
- SHA-256 evidence fingerprint.

The planner defaults every unexecuted result to `NOT_RUN`. Invalid result states fail closed.

Current preflight selection also exposes whether Gitleaks, OSV, Knip, jscpd and zizmor are relevant to the diff. The contract does not claim these tools ran merely because they were selected.

### P0-A exit gate

1. documentary-only scope produces `D / NONE`;
2. bounded source scope produces `C / FOCUSED` when deterministically resolvable;
3. dependency/runtime scope produces `R / FULL`;
4. fingerprint changes when exact identity or results change;
5. no absent command/tool becomes `PASS`.

## P0-B — Three-day full-lifecycle telemetry

`scripts/pr/analyzeRunnerLifecycle.mjs` consumes a read-only lifecycle ledger collected from GitHub evidence and calculates per PR:

- class;
- created -> first green;
- created -> merge;
- unique heads;
- workflow runs;
- attempts;
- runner minutes from actually started jobs;
- failed minutes;
- cancelled minutes;
- duplicate exact-snapshot minutes;
- waste ratio;
- preflight-avoidable minutes;
- top-cost workflow.

Window aggregation provides total/average, p50/p95, class totals and waste.

The analyzer does **not** start hosted Actions. Provider collection remains read-only.

### Three-day measurement window

Start: `2026-09-21T21:42:00+02:00`  
Target end: `2026-09-24T21:42:00+02:00`

The final lifecycle baseline must include every merged PR in the window and all attributable PR runs/attempts across every head.

## Deferred P1/P2 implementation

No Required context is removed or downgraded by this P0 slice.

After the lifecycle baseline:

- **P1:** split OSS Quality by scope while retaining the Unified Finding Contract;
- **P1:** deduplicate Governance exact-snapshot versus body-only evidence;
- **P1:** consolidate small non-independent validator runners when check-context semantics permit;
- **P2:** cache/reuse optimization and waste dashboard;
- **P2:** post-change measurement across at least ten further merged PRs.

Security checks are not silently downgraded. Unknown impact stays fail-closed FULL. Every main push stays FULL.

## Success evidence

Final comparison table:

`PR class | PR count | total runner min | avg runner min | p50 | p95 | failed/cancelled/duplicate min | created->green | created->merge | before->after delta`

Preliminary comparison anchor:

`52.66 Final-Head-Runner-Minuten / 10 PRs = 5.27 Min/PR`

The anchor is historical evidence only once the full three-day lifecycle baseline is available.
