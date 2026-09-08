# OPS-02 — BB-2E ast-grep Workflow Dispatch Evidence

**Status:** `SUPERSEDED — PARTIAL EVIDENCE ONLY`  
**Superseded by:** `OPS_02_BB2E_AST_GREP_GIT_IDENTITY_SUPERSESSION_2026-09-08.md`  
**Supersession scope:** execution-readiness and Git-identity assumptions only; architecture, Node 24.18.0 selection, privilege split, FE ownership and Human/CODEOWNER merge boundary remain historical evidence and are not superseded.  
**Reason:** the first real `workflow_dispatch` reached a Git merge that required commit identity and failed with `fatal: empty ident name`; the replacement evidence records the repository-local Git identity fix and the still-open rerun gates.

**Date:** 2026-09-08  
**Current Project:** `CAPITAL-AI-OPS`  
**Current Project Folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Target project:** `CAPITAL-AI-FE`  
**Target branch:** `agent/frontend-dashboard-drawer-strangler-20260907`  
**Correlation baseline:** `main@29b46dc9131168036a0c067d8e9a14461b411bfe`

## Purpose

Provide a repository-native GitHub Actions execution host for the already merged
`scripts/operations/sourcePatch/astGrepSourcePatch.ts` primitive so BB-2E can remove the productive
Legacy Dashboard drawer through the existing ast-grep plan rather than through an ad-hoc full-file
connector rewrite.

The workflow is intentionally BB-2E-specific. It is not a general remote source editor and creates no
new Frontend, Governance, Release or merge authority.

## Files

- `.github/workflows/ops-ast-grep-source-patch.yml`
- `tests/unit/opsAstGrepSourcePatchWorkflow.test.ts`
- this evidence record

The workflow consumes, but does not modify in this OPS work item:

- `scripts/operations/sourcePatch/astGrepSourcePatch.ts`
- `scripts/frontend/codemods/bb2e-dashboard-drawer-strangler.json`
- `scripts/frontend/codemods/bb2e-dashboard-drawer-strangler.yml`
- `src/components/Dashboard.tsx`

## Toolchain authority

`ADR-0053` and `.nvmrc` currently select Node.js `24.18.0`. The workflow therefore uses the existing
immutable `actions/setup-node` pin with `node-version: '24.18.0'`; it does not adopt the still
non-authoritative 24.20.0 proposal.

The ast-grep runner remains the existing repository primitive and pins `@ast-grep/cli@0.45.3` when an
explicit download is required.

## Security boundary

The workflow follows a two-job privilege split.

### 1. `patch-and-validate` — `contents: read`

- may run only from `refs/heads/main` and only after the Human explicitly checks `confirm_apply`;
- accepts only the expected 40-character FE branch head SHA as dynamic input;
- hard-codes the FE target branch, BB-2E plan, runner path and `src/components/Dashboard.tsx` target;
- checks out trusted `main` and the FE branch with `persist-credentials: false`;
- imports the exact trusted main commit into the FE worktree through a local checkout, not through a
  token-bearing shell fetch;
- rejects FE changes to `package.json`, `package-lock.json`, `.npmrc` or the OPS runner relative to the
  trusted main baseline;
- verifies the FE runner copy byte-for-byte against trusted main before execution;
- runs the native runner first as dry-run and then as apply, preserving its fail-closed exact
  `expectedMatches: 10` and `expectedPostMatches: 0` contract;
- rejects any ast-grep working-tree change outside `src/components/Dashboard.tsx`;
- rejects residual `menuOpen`, `setMenuOpen`, `DashboardExpandedSection`,
  `getDashboardSection(activeView)` or the Legacy inline-drawer marker;
- requires the app-owned `DashboardNavigation` consumer after the patch;
- runs the focused BB-2E Vitest set, TypeScript, Frontend architecture validation, Production build
  and `git diff --check` before producing a patch artifact;
- uploads only the single validated Dashboard patch for one day.

The read-only job receives no repository write token in its shell environment. Branch code and npm
lifecycle code therefore cannot push repository mutations from this phase.

### 2. `apply-and-push` — `contents: write`

The privileged job starts only after the read-only job succeeds. It does not install dependencies,
run target repository scripts, run tests, or execute ast-grep.

It:

- checks out trusted main and the exact FE branch with non-persistent credentials;
- rechecks both the expected FE head and exact workflow `main` SHA;
- merges that exact current-main commit locally into the FE branch;
- applies only the validated patch artifact;
- rejects any changed file other than `src/components/Dashboard.tsx`;
- requires the resulting Dashboard blob SHA to equal the blob validated by the read-only job;
- commits the bounded FE cutover;
- exposes `${{ github.token }}` only to the final push step;
- rereads the remote FE head before push and fails closed if it no longer equals the dispatch input.

Human/CODEOWNER merge remains outside this workflow.

## Workflow-dispatch boundary

GitHub requires a `workflow_dispatch` workflow to exist on the repository default branch before it can
be manually started. Therefore this OPS workflow must first pass PR review/hosted checks and receive a
Human/CODEOWNER merge. Only then can it execute the BB-2E branch cutover.

The workflow is manual only; it has no `push`, `pull_request`, `workflow_run`, schedule, issue, comment
or other automatic trigger.

## Pre-PR validation state

Available repository/chat validation before PR creation:

- current-main / project / PVC correlation: **PASS**;
- open PR correlation: **PASS** — PR #843 changes only
  `docs/projects/operations/WORK_PACKAGES.md` and
  `docs/projects/operations/work-packages/OPS_02_CI_TEST_COST_REDUCTION_2026-09-07.md`; no changed-file
  overlap with this workflow work item;
- workflow design review against current `verifyChangedWorkflowSecurity.mjs`: immutable action SHAs,
  explicit permissions and `persist-credentials: false` are present;
- accepted Node identity correlation: **PASS** — `24.18.0` from ADR-0053 / `.nvmrc`.

Not executed before PR creation because the chat sandbox has no private repository checkout / Node 24
runtime:

- `vitest tests/unit/opsAstGrepSourcePatchWorkflow.test.ts`: **NOT RUN**;
- `npm run pr:workflow-security`: **NOT RUN**;
- zizmor workflow scan: **NOT RUN**;
- BB-2E workflow dispatch: **NOT RUN** — additionally impossible until the workflow exists on default
  branch;
- BB-2E ast-grep `10 -> 0`, focused Vitest, TypeScript, Frontend architecture and Production build:
  **NOT RUN** in this OPS branch; these are runtime gates of the later dispatch.

Hosted PR CI and workflow-security/zizmor checks remain required evidence before Human merge.
