# OPS-CI-VALIDATION-CLASSIFICATION-V2

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-06, PVC-07  
**Requested:** 2026-09-24  
**State:** READY_AFTER_SETTINGS_INVENTORY / INDEPENDENT  
**Implementation branch:** fresh CURRENT_MAIN successor after the settings inventory PR

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
