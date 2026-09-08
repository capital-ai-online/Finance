# OPS-02-CI-01 — Build/Test Cost & Scope Reduction

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02` — Controlled Implementation  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Status:** `PLANNED / OWNER-REQUESTED`  
**Correlation baseline:** `main@29b46dc9131168036a0c067d8e9a14461b411bfe`  
**Applicable authority:** `/AGENTS.md`, ADR-0073, ESS-0001-CONTRACTS Chapter 12  
**Scope:** GitHub Actions PR-CI cost/reliability; no Production mutation

## 1. Objective

Reduce hosted GitHub Actions consumption per Pull Request and reduce the number of tests executed inside the required `build-and-test` check without weakening merge protection, test evidence, Security boundaries or the full `main` Production pipeline.

The package extends the existing ADR-0073 single-`build-and-test` architecture. It does not introduce a second CI authority, a synthetic PASS reporter, a new merge authority or a second PR-class model.

## 2. Current-state baseline

At the correlation baseline:

- `.github/workflows/ci.yml` exposes the stable Required Check context `build-and-test` for Pull Requests and `main` pushes;
- PR CI already uses exact-snapshot PASS reuse bound to `(workflow_id, PR number, head SHA, base SHA)`;
- workflow concurrency cancels superseded in-progress runs for the same PR/ref;
- `scripts/pr/classifyPrScope.mjs` classifies the top-level PR scope as `D`, `C` or `R`;
- class `D` runs no Node/test/build work;
- narrow class `C` can already skip Production build/predeploy, but still executes `unit=true`, which maps to the complete `npm test` command;
- class `R` already suppresses PR Production build/predeploy/Docker-image construction but still executes the full unit/test phase;
- `npm test` delegates to `scripts/automation/runQualityExecution.ts test`, which runs the complete `test:raw` chain;
- `test:raw` currently combines the complete Vitest suite, Node test suites and several repository/documentation/governance validators;
- every `push` to `main` remains force-full and must retain the complete test/build/attestation/deployment evidence path.

The live `main-production-protection` ruleset currently requires these contexts:

1. `GitGuardian Security Checks`;
2. `Hardened image / HIGH+CRITICAL CVE gate`;
3. `PR Governance (Kosten / Workflow / Vorlage)`;
4. `build-and-test`.

`strict_required_status_checks_policy` is active. This package does not weaken or mutate that live ruleset during planning.

## 3. Design principles

1. **Stable Required Check, variable internal work.** `build-and-test` remains the required technical aggregation context. Cost reduction happens through conditional steps inside the job, not by dynamically adding/removing required contexts.
2. **No workflow-level path skipping for a required context.** A required workflow must continue to materialize a check result; path-/branch-filtered absence can leave a required check pending.
3. **Top-level D/C/R remains stable.** Test selection is an orthogonal validation profile and does not proliferate PR classes or PR-template values.
4. **Trusted policy decides cost reduction.** A PR must not be able to change its own classifier/test-plan logic and thereby self-demote required work. Changes to classifier, CI, Quality execution or test-planning control surfaces force `full`.
5. **Fail closed.** Unknown paths, ambiguous dependency impact, missing test mapping or test-plan errors fall back to the full suite.
6. **Main remains force-full.** No PR optimization is reused to suppress complete `main` test/build/attestation evidence.
7. **Evidence semantics are preserved.** Focused PR tests must be reported as focused PR validation, not falsely materialized as complete ESS-0001 Chapter-12 test evidence where the full suite was not executed.

## 4. Target classification model

The existing PR class remains authoritative at the top level:

| PR class | Meaning | Build/Test default |
|---|---|---|
| `D` | documentation / `.ai` / Markdown only | no Node tests/build |
| `C` | application, tests, scripts, non-deploy configuration | select validation profile from impact |
| `R` | runtime/dependency/Docker/deployment-sensitive repository surface | fail-closed high-impact validation; no PR Production artifact build unless separately authorized by current classifier contract |

Add one orthogonal output:

`validation_profile = none | focused | full`

### 4.1 `none`

Use only when the current trusted classifier proves that no executable/test-relevant surface changed.

Expected examples:

- pure class `D` changes;
- metadata-only cases explicitly classified as non-executable by the trusted policy.

Result: repository integrity and applicable governance checks only; zero unit-test execution.

### 4.2 `focused`

Use only when impact can be determined safely and deterministically.

Candidate scopes:

- tests-only changes;
- known non-Production validation/tooling paths;
- bounded application/module changes with deterministic test dependency mapping;
- changes for which Vitest related/changed selection plus explicit non-Vitest test mapping is complete.

Focused validation must include:

- tests related to changed source files;
- directly changed tests;
- mandatory component contract/security tests declared by the impact map;
- relevant Node `--test` suites for changed scripts;
- classifier/test-plan contract tests when CI classification surfaces are affected.

A fixed numeric cap on tests is prohibited. The reduction is impact-based; if the safe impacted set is large, the focused plan may legitimately approach the full suite.

### 4.3 `full`

Mandatory when any of the following applies:

- dependency manifests/lockfiles change;
- TypeScript/Vite/Vitest/global test configuration changes;
- shared/core platform boundaries with broad fan-out change;
- `.github/workflows/ci.yml`, `scripts/pr/classifyPrScope.mjs`, the test-plan resolver, `scripts/automation/runQualityExecution.ts`, or equivalent CI/Quality authority surfaces change;
- the impact resolver cannot prove a complete focused set;
- an explicit force-full trigger is present;
- the event is `push` to `main`.

Result: current complete `npm test` / `test:raw` semantics plus any class-specific build/audit/runtime checks.

## 5. Test-selection implementation contract

### WP-1 — Baseline measurement

Use existing GitHub Actions run metadata to establish a before-baseline without starting extra hosted runs:

- full `build-and-test` executions per PR;
- duplicate/superseded executions per unique `(PR, head, base)`;
- median and p95 `build-and-test` duration;
- duration share of `npm ci`, TypeScript, unit tests, build and predeploy;
- test count where the existing runners expose it.

**Exit Gate:** baseline covers a representative recent PR window and can distinguish D/C/R plus duplicate snapshot executions.

### WP-2 — Trusted impact/test-plan resolver

Extend the classifier contract or add a single bounded resolver under `scripts/pr/` that emits at minimum:

- `class`;
- `validation_profile`;
- `force_full_reason`;
- deterministic test-plan identity/hash;
- machine-readable selected Vitest targets/changed-base strategy;
- selected Node test groups;
- mandatory sentinel/contract/security groups.

The plan used for cost reduction must originate from trusted base/current-main policy. Candidate changes to the planner/classifier must force full execution for that PR.

**Exit Gate:** positive/negative unit tests prove `none`, `focused`, `full`, unknown-path fallback and self-demotion prevention.

### WP-3 — Separate full and focused test entrypoints

Preserve the current complete test command as the canonical full path. Add a focused PR-only entrypoint that does not overwrite complete Quality evidence.

Target shape:

- `test:ci:full` → current complete Quality/test semantics;
- `test:ci:focused` → impacted Vitest tests plus explicitly mapped Node/sentinel tests;
- `npm test` remains backward-compatible until an explicit migration proves all callers.

Vitest's changed/related capability may be reused for deterministic source-to-test selection. Non-Vitest suites require an explicit repository-owned mapping; they must not silently disappear from validation.

**Exit Gate:** focused execution demonstrates materially fewer tests for representative narrow C diffs while full execution remains byte-for-byte/evidence-equivalent in intended scope to the current complete suite.

### WP-4 — `build-and-test` runner reduction

Adjust `.github/workflows/ci.yml` so that one required `build-and-test` job continues to materialize per relevant PR event while heavy steps follow the trusted validation profile.

Required behavior:

- retain exact-snapshot PASS reuse;
- retain concurrency cancellation for superseded heads;
- avoid duplicate dependency installation/test/build within one job;
- `none` does not run `npm ci` or tests;
- `focused` installs dependencies once and runs only the trusted focused test plan plus currently required non-test checks;
- `full` preserves current full behavior;
- `main` push always force-full;
- no synthetic Required Check reporter.

Optional optimization to evaluate with evidence: draft-PR heavy-work suppression while keeping the stable check context and rerunning real validation on `ready_for_review`. It may be adopted only if Required Check behavior is proven deterministic and no merge gate can be satisfied by draft-only evidence.

**Exit Gate:** representative D, focused-C, full-C/R and `main` scenarios produce the expected step matrix; no required context is missing or permanently pending.

### WP-5 — Required ruleset / merge-safety contract

Target ruleset contract for this package:

- keep `build-and-test` required from the GitHub Actions integration;
- do not add per-profile Required Check contexts;
- keep the other currently required Security/Governance contexts unchanged unless a separately authorized package owns their optimization;
- keep strict/up-to-date required status checks during this package;
- keep zero bypass actors;
- keep Pull Request and non-fast-forward protections;
- do not use workflow-level path filtering to suppress `build-and-test`.

A future proposal to change `strict_required_status_checks_policy` is explicitly outside this package unless a separate owner-approved architecture/merge-compatibility decision supplies equivalent protection (for example a separately governed merge-queue model). Reducing rebuilds alone is insufficient justification to weaken strictness.

**Exit Gate:** repository expectation/evidence and live ruleset readback agree on the unchanged required contexts and strict policy after implementation; no Ruleset mutation is required merely to enable focused internal test execution.

### WP-6 — Validation and cost evidence

Minimum scenario matrix:

| Scenario | Expected profile | Expected expensive work |
|---|---|---|
| docs-only | `none` | no `npm ci`, no tests, no build |
| tests-only / known validation tooling | `focused` | impacted tests only; no Production build/predeploy |
| bounded app change with complete mapping | `focused` | related + mandatory sentinel tests; build only if current production-impact contract requires it |
| unknown C path | `full` | full test suite and current class-C required steps |
| dependency/global config | `full` | full suite + applicable audit |
| runtime/deploy-sensitive | `full` | full unit/test safety; current class-R runtime checks; PR Production artifact suppression remains per ADR-0073/current classifier |
| classifier/CI/test-planner change | `full` | full suite; candidate cannot self-demote |
| `push` to `main` | `full` | complete test/build/attestation/Production-pipeline prerequisites |
| repeated exact PR snapshot | reuse | no second checkout/npm/test/build when prior exact snapshot PASS is safely reusable |

**Exit Gate:** hosted PR evidence demonstrates reduced runner minutes/test executions for narrow diffs and no loss of required merge blocking or `main` evidence.

## 6. Quantitative success criteria

The package is complete only when measured evidence demonstrates all of the following against the WP-1 baseline:

1. **Unique-snapshot invariant:** at most one heavy `build-and-test` execution is needed for an already successful exact `(workflow, PR, head, base)` snapshot; safe reuse performs no second checkout/npm/test/build.
2. **Docs invariant:** class `D` executes zero software tests and zero Production build work.
3. **Focused-C reduction:** representative narrow-C PRs execute fewer tests than the full baseline while still running every test selected by the trusted impact contract.
4. **Fail-closed coverage:** ambiguous/broad/high-impact changes execute the full suite.
5. **Main invariant:** `main` executes the full canonical test/build chain with unchanged attestation/deployment prerequisites.
6. **Ruleset invariant:** required contexts remain present and merge-blocking; no new bypass or missing/pending Required Check regression is introduced.
7. **Quality-evidence invariant:** focused PR validation is not mislabeled as complete full-suite Quality evidence.

No percentage reduction is declared in advance without baseline evidence. The implementation must report actual before/after runner minutes, full-suite invocations and selected-test counts.

## 7. Files expected in the implementation slice

Likely implementation surfaces, subject to final current-main re-correlation:

- `.github/workflows/ci.yml`;
- `scripts/pr/classifyPrScope.mjs` and its tests, or one bounded adjacent test-plan resolver;
- `package.json` only if dedicated full/focused scripts are necessary;
- `scripts/automation/runQualityExecution.ts` only if required to preserve correct focused-vs-full evidence semantics;
- focused classifier/test-plan tests;
- OPS evidence for before/after cost and scenario matrix.

Changes to unrelated Required Check workflows, Security tools, Production deployment authority or external GitHub settings are excluded.

## 8. Dependencies and boundaries

- **ADR-0073:** single technical Required Check architecture and exact-snapshot cost control are reused, not replaced.
- **ESS-0001-CONTRACTS Chapter 12:** complete Quality evidence remains a distinct full-validation concept; focused PR validation must remain truthful.
- **CAPITAL-AI-GOV:** required only if implementation discovers that a normative Governance/control-plane change is actually necessary. Ordinary internal `build-and-test` optimization remains OPS execution scope.
- **CAPITAL-AI-SEC / CAPITAL-AI-QM:** independent requirements/verification remain with their owners; OPS does not claim Security or Quality authority by executing tests.
- **GitHub Ruleset:** provider-side mutation is not authorized by this documentation package. Readback is allowed; any later settings mutation requires its then-current authority/Owner gate.

## 9. Rollback

If focused classification causes false negatives, missing tests, unstable Required Check behavior or evidence ambiguity:

1. force all non-D PR scopes back to `validation_profile=full`;
2. retain the stable `build-and-test` Required Check and current ruleset;
3. retain exact-snapshot reuse only if its identity invariants remain valid;
4. perform remediation on a fresh branch from then-current `main`.

Rollback must never disable a Required Check merely to recover mergeability.

## 10. Completion evidence

Completion requires:

- classifier/test-plan unit evidence;
- representative hosted D/focused/full PR evidence;
- exact-snapshot reuse evidence;
- full `main` push evidence after Human merge;
- live Ruleset readback showing the intended unchanged Required Check contract;
- before/after runner-minute and test-count comparison;
- explicit `PASS / FAIL / NOT RUN` reporting for every scenario in WP-6.
