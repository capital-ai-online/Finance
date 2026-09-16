# FE Public Cockpit CI Regression — 2026-09-16

## Identity

- Repository: `capital-ai-online/Finance`
- Project: `CAPITAL-AI-FE`
- Project folder: `docs/projects/frontend/`
- Primary Owner: `CAPITAL-AI-FE`
- Productive PVC: `N/A — cross-cutting Frontend`
- Trusted baseline: `main@360347948cd4a05e00432ccdd06e1c60442916e7`
- Working branch: `agent/frontend-public-cockpit-ci-regression-20260916`
- Production readback at remediation start: `1780264d567f307c31fab149433969a8c359bcd1`
- Production → trusted-main drift at remediation start: `62` commits

## Incident correlation

The deployment drift began immediately after the human merge of PR #1013 on 2026-09-16.

| Time (CEST) | Event | Result |
| --- | --- | --- |
| 17:22:25 | Render deploy for `1780264d567f307c31fab149433969a8c359bcd1` became live | Production matched the then-verified source identity |
| 17:22:44 | PR #1013 merged as `47a245be78b60494c0f57518f742bbb7923b70fa` | New main source identity |
| 17:22:48 | Main CI started for `47a245be78b60494c0f57518f742bbb7923b70fa` | Full main verification began |
| 17:25:18 | Full test suite failed | `build-and-test = failure` |
| 17:25:23 | Production deployment job skipped | Render correctly remained on the last verified deployment |

Current main remains affected: hosted main CI #4045 also fails in the full test suite and therefore skips the Render production deployment job.

## Root cause

`tests/unit/publicLandingCockpitRecovery.test.ts` still asserted the pre-#1013 source contract while the current `PublicAnalysisWorkbench` intentionally implements the newer Universe presentation contract.

The stale test expected:

- `sideboardOpen = true` as the initial state;
- visible labels `Analysetools öffnen/schließen`;
- an Enterprise Scorer with `server-gated` availability.

Current main intentionally implements:

- `sideboardExpanded = false` as the initial state;
- a narrow desktop sideboard (`88px`) expandable to `300px` and a collapsed mobile sideboard;
- explicit mobile ARIA labels `Analysetools aufklappen/einklappen` and visible labels `Sideboard öffnen/schließen`;
- the public Enterprise Scorer as the default fixed-BTC public capability, while protected tools remain login-required or disabled.

The PR-side validation gap was structural: this regression test inspected `PublicAnalysisWorkbench.tsx` through `fs.readFileSync()` but had no module dependency on the production component. Dependency-aware `vitest --changed` therefore had no import edge through which the changed production module could select this regression test. The pull-request focused suite passed, while the main push full suite exposed the stale assertion only after merge.

## Remediation

This branch performs a bounded, runtime-neutral correction:

1. Align `publicLandingCockpitRecovery.test.ts` with the current intended sideboard and public Enterprise Scorer contract.
2. Add an explicit static import dependency on `PublicAnalysisWorkbench` and assert that the exported component remains a function. This preserves the source-inspection assertions while making the test visible to dependency-aware changed-test selection when `PublicAnalysisWorkbench.tsx` changes.
3. Add assertions for the narrow/expanded desktop columns, collapsed mobile state, fixed BTC public symbol, protected-tool gates and current touch controls.
4. Do not change `src/app/public/PublicAnalysisWorkbench.tsx`, because open FE PR #1026 is an active writer on that production surface.

## Owner boundaries and handoffs

Two adjacent findings are deliberately not implemented in this FE branch:

- `docs/runbooks/RENDER_CI_DEPLOY_GATE.md` describes an older `checksPass/new_commit` Render model, while the current production workflow uses a production-environment-bound `RENDER_DEPLOY_HOOK_URL` exact-SHA deployment path. The runbook correction belongs to the OPS/CI documentation owner and must be handled there.
- A generalized policy for all source-inspection tests would belong to the CI/Governance validation planner. This FE remediation closes the concrete dependency-selection gap locally without creating a second CI authority.

No Render configuration, deploy hook, workflow, application runtime, provider, credential, secret, database, consent, authentication, scoring or external production state is mutated by this branch.

## Validation state before PR creation

- Current-main / Trust-Root / Project / Owner correlation: `PASS`
- Active writer correlation: `PASS` — production module overlap with PR #1026 identified and avoided
- Runtime source changes: `NONE`
- Hosted TypeScript / Vitest / build: `NOT_RUN` before PR creation by cost-control policy
- Exact-head hosted validation: `PENDING` until PR creation
- Production deployment: `NOT_APPLICABLE` before human merge and successful main CI

`NOT_RUN` and `PENDING` are not PASS.

## Before → After

| Dimension | Before | After |
| --- | --- | --- |
| Cockpit regression contract | stale pre-#1013 assertions | current Universe sideboard/public-scorer assertions |
| Initial sideboard semantics | expects `sideboardOpen=true` | protects `sideboardExpanded=false`, 88px → 300px desktop expansion and collapsed mobile state |
| Enterprise Scorer | expects `server-gated` | protects public fixed-BTC default while protected tools remain gated |
| Changed-test dependency | file-system source read only | explicit production-module import edge plus source contract assertions |
| Runtime behavior | unchanged | unchanged |
| Active #1026 production writer | risk of overlap if runtime modified | no runtime file overlap |
| Render/OPS runbook drift | observed | owner-routed; not silently edited by FE |

## Exit gate

This remediation is repository-complete when the exact PR head passes the trusted-main validation selected for the diff and the stale `publicLandingCockpitRecovery` assertions no longer fail. Production convergence remains downstream of human/CODEOWNER merge, successful exact-main CI and the existing protected deployment gate.
