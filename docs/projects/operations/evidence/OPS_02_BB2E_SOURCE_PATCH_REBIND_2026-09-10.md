# OPS-02 — BB-2E Source-Patch Rebind Evidence — 2026-09-10

**Status:** `IMPLEMENTED_BRANCH / RUNTIME_NOT_YET_EXECUTABLE_FROM_MAIN`  
**Current Project:** `CAPITAL-AI-OPS`  
**Current Project Folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Target Project:** `CAPITAL-AI-FE`  
**Target FE Branch:** `agent/frontend-bb2e-dashboard-drawer-20260910`  
**Target FE Head at correlation:** `c2eece786eaf04f880cca12a3dce3e0605cb1624`  
**Current-main baseline at implementation:** `main@8226d522d99623b7a0f4ac2fc4938dabe9bf1d29`  
**OPS implementation branch:** `agent/operations-bb2e-source-patch-rebind-20260910`

## Purpose

Rebind the existing OPS-owned BB-2E ast-grep execution host from the deleted historical FE target branch to the fresh current Frontend BB-2E branch without creating a second execution mechanism or weakening any existing validation, privilege, exact-head, validated-blob or Human/CODEOWNER boundary.

This is a bounded `CAPITAL-AI-OPS / PVC-02` execution-host maintenance slice. `CAPITAL-AI-FE` remains owner of the Dashboard presentation cutover and the target source branch. No Frontend domain ownership is transferred to OPS.

## Current-main and ownership correlation

At implementation start, current main was `8226d522d99623b7a0f4ac2fc4938dabe9bf1d29`. `/AGENTS.md` on that exact main identifies `capital-ai-online/Finance` as the canonical repository identity and requires fresh scoped branches, current-main/open-writer correlation, truthful validation evidence, explicit Human/Owner PR-creation approval and Human/CODEOWNER-only merge.

`docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` map `PVC-02 — Controlled Implementation` to `CAPITAL-AI-OPS`, with branch slug `operations`. The Operations project surface permits bounded foreign-project execution while preserving the Target Project identity and ownership.

The Operations Roadmap keeps `OPS-02 Controlled Implementation` active. This BB-2E slice does not replace the general OPS priority queue; it executes the explicit Owner-directed dependency needed by the already-active Frontend BB-2E work item.

## Correlation with concurrent work

Open PR correlation at implementation start found only PR #852, `[CAPITAL-AI-SEC] [ChatGPT] Dependabot und Security Policy konsolidieren`. Its changed files are `.github/dependabot.yml` and `SECURITY.md`; it has no changed-file overlap with this workflow/test/evidence slice and no identified semantic ownership conflict with BB-2E source-patch binding.

The active branch `agent/operations-retired-tooling-cleanup-20260910` was also inspected because it changes CI/workflow-adjacent material. It changes retirement-related surfaces including `.github/workflows/ci.yml`, but not `.github/workflows/ops-ast-grep-source-patch.yml`, `tests/unit/opsAstGrepSourcePatchWorkflow.test.ts`, or this evidence path. No direct concurrent-writer conflict was identified for the bounded BB-2E rebind.

The intended target branch `agent/frontend-bb2e-dashboard-drawer-20260910` is an intentional cross-project dependency, not a conflicting writer. Its exact correlated pre-dispatch head is `c2eece786eaf04f880cca12a3dce3e0605cb1624`.

## Implementation

The existing `.github/workflows/ops-ast-grep-source-patch.yml` remains the single BB-2E source-patch execution path. The bounded rebind changes only its historical target-branch references:

- workflow input description points to `agent/frontend-bb2e-dashboard-drawer-20260910`;
- `TARGET_BRANCH` points to `agent/frontend-bb2e-dashboard-drawer-20260910`;
- both FE checkout steps point to `agent/frontend-bb2e-dashboard-drawer-20260910`.

`tests/unit/opsAstGrepSourcePatchWorkflow.test.ts` is updated to require the new hard-bound target and reject any residual reference to `agent/frontend-dashboard-drawer-strangler-20260907`.

No new workflow, runner, patch format, branch parameter, permission, credential, token, source target or execution architecture is introduced.

## Preserved fail-closed boundaries

The following existing controls are intentionally unchanged:

- `workflow_dispatch` only, with explicit `confirm_apply`;
- jobs execute only when the workflow runs on `main`;
- exact 40-character lowercase `expected_head_sha` input;
- trusted-main checkout and exact trusted-main SHA comparison;
- exact FE branch-head comparison before validation and again before privileged apply;
- target branch toolchain/runner surface must not differ from trusted main;
- `patch-and-validate` has `contents: read` only;
- current main is merged into the FE worktree before patch validation;
- ast-grep plan and runner remain `scripts/frontend/codemods/bb2e-dashboard-drawer-strangler.json` and `scripts/operations/sourcePatch/astGrepSourcePatch.ts`;
- ast-grep dry-run remains exact 10 matches and apply remains exact 10 → 0;
- only `src/components/Dashboard.tsx` may change during the source patch;
- legacy `menuOpen` / drawer markers must be zero after apply;
- focused BB-2E Vitest, TypeScript/Lint, Frontend Architecture, Production Build and `git diff --check` run before any write-capable push;
- validated patch blob is captured by the read-only job and rechecked in the privileged job;
- privileged job runs only after validation success;
- remote FE head must still equal `expected_head_sha` immediately before push;
- Human/Owner PR-creation approval and Human/CODEOWNER merge boundaries are unchanged.

## Target FE branch state

The target FE branch currently has head `c2eece786eaf04f880cca12a3dce3e0605cb1624`. Since that head predates later current-main merges, it is not itself claimed as PR-ready or current-main synchronized here. The existing workflow is designed to integrate its trusted `main` execution SHA into the checked-out FE worktree before patch validation and again before the final committed push.

A workflow dispatch must still supply the exact then-current remote FE head. Any intervening FE head change causes the execution to fail closed and requires fresh correlation.

## Validation truth

Performed in this repository execution pass:

- current main SHA readback: **PASS** at implementation baseline `8226d522d99623b7a0f4ac2fc4938dabe9bf1d29`;
- `/AGENTS.md` fully read from that exact current main: **PASS**;
- Project/PVC/Primary Owner resolution: **PASS** — `CAPITAL-AI-OPS`, `docs/projects/operations/`, `PVC-02`, Primary Owner `CAPITAL-AI-OPS`;
- OPS project README/Roadmap correlation: **PASS**;
- open PR changed-file/semantic correlation for this bounded scope: **PASS**;
- relevant active OPS branch overlap inspection: **PASS — no direct BB-2E workflow/test/evidence overlap identified**;
- exact target FE branch/head readback: **PASS** — `c2eece786eaf04f880cca12a3dce3e0605cb1624`;
- static workflow safety-boundary review after rebind: **PASS** — existing exact-head/read-only/10→0/validated-blob/remote-head gates remain in source;
- historical target branch reference removal is enforced by the updated regression-test source.

Not executed and therefore not claimed as PASS:

- local/hosted `opsAstGrepSourcePatchWorkflow.test.ts`: **NOT RUN**;
- workflow YAML parser / workflow-security hosted checks: **NOT RUN**;
- actual corrected `workflow_dispatch`: **NOT RUN**;
- ast-grep dry-run exact 10: **NOT RUN**;
- ast-grep apply 10 → 0: **NOT RUN**;
- Legacy Drawer / `menuOpen` zero-result: **NOT RUN**;
- focused Frontend Vitest: **NOT RUN**;
- TypeScript/Lint: **NOT RUN**;
- Frontend Architecture check: **NOT RUN**;
- Production Build: **NOT RUN**;
- `git diff --check`: **NOT RUN**;
- validated FE branch push: **NOT RUN**;
- browser accessibility interaction evidence: **NOT RUN**.

## Activation and execution boundary

The rebind does not affect the main-dispatched workflow until the OPS branch is reviewed, its PR is explicitly approved for creation, hosted checks are completed, and a Human/CODEOWNER merges it to `main`.

After Human merge, current main/open PRs and the FE target head must be re-read. The workflow must then be dispatched from `main` with `confirm_apply=true` and the exact then-current FE head. A successful run is required before any ast-grep, build, Legacy-zero or accessibility contract result can be recorded as PASS.

The currently connected GitHub execution surface used for this chat exposes workflow/read/rerun inspection but no action for starting a new `workflow_dispatch`. This capability limitation does not authorize another execution path or connector mutation; if it remains true after merge, the dispatch is a Human-executed GitHub Actions step.
