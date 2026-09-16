# OPS-02-CI-01 — Repository-wide CI Cost Profiles

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Parent work package:** `OPS-02-CI-01 — Build/Test Cost & Scope Reduction`  
**State:** `IMPLEMENTED_ON_BRANCH / HOSTED_EVIDENCE_PENDING`  
**Correlation baseline:** `main@7e083b6c99327884fbc4169525bf8646519d06a7`  
**Branch:** `agent/operations-ci-cost-profiles-resync-20260916`  
**Authority:** `/AGENTS.md@current-main`, ADR-0073, ESS-0001-CONTRACTS Chapter 12  
**Production mutation:** none

## 1. Problem evidence

PR #983 was a class-D documentation-only change. The trusted PR validation planner correctly resolved:

- `vitest_mode=none`;
- `codeql_mode=none`;
- `automated_code_review_mode=none`;
- reason `documentation-only`.

Nevertheless, the separate `Selective CodeQL` workflow had already allocated a GitHub-hosted `ubuntu-latest` runner for `Trusted-base CodeQL-Plan`. The later `Analyze` job was skipped. The plan job therefore consumed hosted runner time solely to discover that no CodeQL analysis was required. The same topology existed in `Selective Copilot Code Review`: a separate post-CI planning runner was allocated before the planner could return `automated_code_review_mode=none`.

The required `build-and-test` path already behaved differently: class D materialized the required check while skipping Node setup, `npm ci`, TypeScript, unit tests, Production build, predeploy and Docker-image work. Required-check materialization and expensive validation are therefore already separable without synthetic PASS reporting.

## 2. Repository- and application-wide execution contract

The trusted `scripts/pr/planPrValidation.mjs` now exposes one orthogonal validation profile for every changed-file set:

| Change scope | `validation_profile` | Required validation behavior |
|---|---|---|
| Docs / `.ai` / Markdown only | `none` | no software tests, CodeQL or automated code review |
| Test-only | `focused` | changed/explicit test groups only; no CodeQL or automated review |
| Known bounded application/source change | `focused` | changed/related Vitest plus mapped Node validators; targeted advisory analysis where applicable |
| Known non-deploy workflow outside protected CI/provider controls | `focused` | workflow-specific validation; no unrelated full-suite escalation |
| Dependency/global configuration | `full` | complete fail-closed test scope plus applicable audit |
| Security/high-risk runtime surface | `full` | complete fail-closed validation |
| Unknown non-documentary path | `full` | complete fail-closed validation |
| CI/classifier/planner/optional-provider-control surface | `full` | self-demotion prohibited; candidate cannot weaken its own validation |
| `push` to `main` / explicit force-full | `full` | complete canonical main test/build/attestation prerequisites |
| Previously successful exact `(workflow, PR, head SHA, base SHA)` snapshot | `reuse` in `ci.yml` | no second checkout/npm/test/build; reuse remains separate from planner profiles |

`REUSE` is intentionally not emitted by the planner. It requires historical successful run evidence and remains controlled by the existing exact-snapshot logic in `.github/workflows/ci.yml`.

## 3. Optional provider fan-out rule

Repository policy now distinguishes required merge checks from optional provider work:

1. **Required checks remain stable.** The live `main-production-protection` ruleset is not changed by this slice.
2. **Required workflows are not path-filtered away.** Their check context must continue to materialize; cost reduction happens inside the required job.
3. **Optional provider workflows do not start automatic planning runners merely to discover `none`.**
4. `.github/workflows/selective-codeql.yml` is retained as an explicit `workflow_dispatch` fallback only. Automatic PR, main-push and schedule fan-out is retired. GitHub Default Setup/provider configuration is not changed.
5. `.github/workflows/selective-copilot-code-review.yml` is retained as explicit `workflow_dispatch` only for a Human-selected open same-repository PR targeting `main`. It performs no checkout and grants only `pull-requests: write` to the request job. No provider license, permission, API-key or subscription mutation is performed.
6. Paid or quota-consuming provider execution remains explicit rather than an automatic consequence of every PR.

## 4. Required-check invariants

Read-only provider readback at the implementation baseline showed the active `main-production-protection` ruleset requiring:

1. `GitGuardian Security Checks`;
2. `Hardened image / HIGH+CRITICAL CVE gate`;
3. `PR Governance (Kosten / Workflow / Vorlage)`;
4. `build-and-test`.

`strict_required_status_checks_policy=true` and no bypass actor was present. This repository slice performs no ruleset mutation and removes none of these contexts.

CodeQL and Copilot Code Review are not converted into synthetic required contexts. The manual fallbacks do not authorize merge and do not replace Required Check evidence.

## 5. Security and Quality invariants

- Unknown and high-risk changes remain fail-closed `full`.
- Changes to `ci.yml`, the classifier/planner, `selective-codeql.yml` or `selective-copilot-code-review.yml` force `full`; a candidate cannot self-demote these control surfaces.
- `main` remains force-full; no PR optimization suppresses the Production build/attestation path.
- Focused validation is not represented as complete ESS-0001-CONTRACTS Chapter-12 full-suite evidence.
- No `pull_request_target`, candidate-code execution with write credentials, `contents: write`, auto-merge or synthetic check reporter is introduced.
- No GitHub Code Security, Copilot, Advanced Security, billing, license, subscription, OAuth or connector setting is enabled or modified.

## 6. Validation state

### Repository contract implemented

The branch changes:

- expose `validation_profile=none|focused|full` from the trusted planner;
- preserve existing exact-snapshot `reuse` semantics in `ci.yml`;
- force protected CI/provider-control workflow changes to `full`;
- retire automatic optional CodeQL runner fan-out;
- retire automatic optional Copilot-review runner fan-out;
- retain explicit manual fallback workflows;
- update repository contract tests for the new trigger and permission boundaries.

### Pre-PR execution truth

No GitHub-hosted validation run is intentionally started before Draft PR creation merely to validate a cost-control change. Actual Node/Vitest/workflow-security execution is therefore `NOT RUN` at this stage and must not be reported as PASS.

### Hosted evidence required after PR creation

The implementation is not cost-verified until hosted evidence demonstrates the scenario matrix:

| Scenario | Expected profile/state | Expected expensive work |
|---|---|---|
| D/docs-only | `none` | no npm/test/build; no automatic CodeQL/Copilot workflow run |
| tests-only / bounded validation | `focused` | affected tests only; no automatic CodeQL/Copilot fan-out when planner mode is `none` |
| bounded app source | `focused` | changed/related tests; no unrelated full test suite |
| unknown/high-risk/control surface | `full` | complete fail-closed validation |
| exact successful PR snapshot replay | `reuse` | no second checkout/npm/test/build |
| main push | `full` | complete main test/build/attestation prerequisites |

Required contexts must remain present and merge-blocking throughout this evidence phase.

## 7. Before/after measurement contract

Use existing GitHub Actions metadata without creating artificial benchmark runs. Compare representative pre-cutover and post-cutover snapshots on:

- number of GitHub-hosted jobs per PR event;
- automatic `Selective CodeQL` runs;
- automatic `Selective Copilot Code Review` runs;
- `npm ci` invocations;
- Vitest/full-suite invocations;
- Docker/Trivy work;
- build-and-test job duration;
- exact-snapshot reuse frequency;
- missing/pending Required Check regressions.

No percentage saving is declared until real post-cutover data exists.

## 8. Rollback

If the cost profiles omit required validation or destabilize check behavior:

1. force all non-D PRs back to `full` in the trusted planner;
2. preserve the stable Required Check set;
3. preserve `main` force-full;
4. restore optional automatic provider fan-out only through a fresh owner-reviewed branch if evidence proves it is required and cost-authorized.

Rollback must not weaken Required Checks or create a merge bypass.
