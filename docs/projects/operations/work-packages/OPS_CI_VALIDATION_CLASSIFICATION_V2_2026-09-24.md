# OPS-CI-VALIDATION-CLASSIFICATION-V2

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-06, PVC-07  
**Requested:** 2026-09-24  
**State:** `MERGED_ON_MAIN / SUPERSEDED_BY OPS-CI-MINIMAL-VALIDATION-V3`  
**Merged PR:** `#1411` on 2026-09-24  
**Historical implementation branch:** `agent/operations-ci-validation-classification-v2-20260924` from `main@332861e4ae19f80c3bdc15dccf3733cdc52c265f`

## Goal

Drastically reduce pull-request runner cost and latency without reducing Required Check, Security, Governance, Human/CODEOWNER or main-push validation semantics.

## Existing authority to extend

The canonical planner already owns:

- `none`;
- `focused`;
- `full`;
- exact-snapshot `REUSE` in `ci.yml`.

No second CI controller is permitted.

## V2 classification target

Add deterministic sub-classification underneath the existing profiles:

- documentary-only;
- test-only;
- PR/governance-validator tooling;
- operations/tooling;
- ordinary workflow-only;
- application/frontend source;
- backend/runtime;
- auth/security/billing/entitlement high-risk;
- dependency/global-config;
- unknown fail-closed.

Primary quick win: ordinary `scripts/operations/**` changes should use changed/importgraph Vitest plus directly relevant validators rather than the entire repository test suite, unless runtime-consumed/high-risk/global-trigger evidence escalates them.

## Preflight target

Pre-PR evidence should bind:

- base SHA;
- head SHA;
- tree SHA;
- changed paths;
- planner version/fingerprint;
- Node/tool versions;
- selected test groups and real PASS/FAIL/NOT_RUN results.

GitHub CI may reuse preflight evidence only where a trusted policy explicitly proves equivalence; Required Checks remain exact-head GitHub checks.

## Main protection

Pushes to `main` stay force-FULL until separately proven safe. Dependency manifests, `ci.yml`, release/deploy controls, high-risk security/auth/billing and unknown paths remain fail-closed FULL.

## Render runner assessment

Do not introduce a persistent Render self-hosted runner as the first optimization:

- Render Background Workers/Private Services require paid compute;
- free web services spin down and are not a suitable continuously available runner host;
- GitHub recommends ephemeral self-hosted runners for autoscaling and warns about persistent-runner compromise boundaries.

A Render-based ephemeral/JIT runner remains a later feasibility option only if measured GitHub-hosted runner cost exceeds Render compute and an isolated one-job lifecycle plus external logs can be proven.

## Exit target

Measure before/after runner minutes and prove that representative small OPS/tooling, docs, test-only and frontend PRs select strictly smaller validation sets while protected/high-risk examples remain FULL.


## Implemented V2 slice

The existing planner remains the single CI-selection authority.

Implemented on the branch:

- ordinary `scripts/operations/**` tooling uses `FOCUSED` + `vitest --changed <base>` instead of the full repository suite;
- release/deploy/production/cadence controls remain fail-closed `FULL`;
- documentary/evidence snapshots consumed only by known test files are classified as non-production validation inputs;
- exact direct Vitest consumers are discovered and executed in addition to the changed dependency graph;
- documentary artifacts consumed by runtime/workflow or an unhandled test surface remain `FULL`;
- main pushes, dependency manifests, `ci.yml`, security/auth/billing/entitlement and unknown paths remain `FULL`;
- candidate changes cannot self-demote because `ci.yml` continues loading classifier/planner policy from the trusted PR base snapshot.

## ChatGPT preflight boundary

The repository contains a machine-readable ChatGPT preflight contract, not a separate repository-bound ChatGPT CI provider.

The pre-PR evidence now exposes:

- exact base/head/tree identity;
- changed paths and runtime/test consumers;
- selected focused/full validation;
- real `PASS / FAIL / NOT_RUN` results only;
- `BLOCKED / EVIDENCE_PENDING / READY_FOR_GITHUB_VALIDATION` pre-PR state;
- explicit confirmation that GitHub mergeability and exact-head Required Checks remain authoritative after PR creation.

This prevents a local/hosted-agent preflight from falsely claiming a PR is mergeable.

The canonical one-time PR-creation Production Preflight remains the trusted provider confirmation. Repeated Live-Dashboard/Production-Baseline coupling inside Required PR Governance is owned by the separate GOV convergence slice and is not duplicated here.

## Expected cost effect

Representative examples after merge:

- ordinary OPS adapter + unit test: focused changed tests, no application production build/predeploy;
- FRONTEND upstream evidence snapshot referenced only from a Vitest regression: changed graph plus the direct regression consumer, no global suite;
- documentation only with no executable consumer: no software tests;
- release/deploy/security/dependency/global configuration: full validation.

No Required context is removed and no Human/CODEOWNER gate is weakened.


## Post-merge supersession — 2026-09-24

PR #1411 merged the V2 selective-validation foundation. Its historical work claim is released and non-exclusive. Fresh Human/Owner direction now extends that merged foundation through `OPS-CI-MINIMAL-VALIDATION-V3` from `main@13c27d69ba5564e32eea089455d3ccf60860c391`.

V3 does not revive the historical branch or create a second CI controller. The existing D/C/R classifier, `NONE / FOCUSED / FULL` planner and exact-snapshot reuse path remain the canonical architecture.
