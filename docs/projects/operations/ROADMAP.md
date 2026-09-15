# CAPITAL-AI-OPS — Canonical Roadmap

**Project:** `CAPITAL-AI-OPS`  
**Folder:** `docs/projects/operations/`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### OPS-CARRY-01 — Existing non-terminal OPS backlog
Carry forward all non-terminal OPS work, including controlled implementation, supervisor, version, release, production, EventMesh/trace, recovery, evidence and independently owned verification dependencies.

### OPS-PR900-01 — Event-driven development chain
Correlate the Option-C/project-listener work against current main and applicable authority. Define trigger payloads, deterministic state transitions, idempotency/replay, owner-correct handoff evidence and continuation events; prefer event-native triggers to polling.

**Exit:** one current listener/event flow; no duplicate active listener; every handoff records source event, owner/PVC, exit evidence and continuation trigger.

### OPS-PR900-02 — Deterministic version/release/deploy identity
Complete Stage-2 PVC-06/PVC-07 validation, reconcile version-rule and Release Version Gate semantics, and prove exact-SHA promotion plus post-deploy identity. Render native Auto Deploy remains off unless separately authorized.

**Exit:** one exact snapshot has truthful PASS/FAIL/NOT_AVAILABLE checks, deterministic version/release agreement and production identity evidence.

### OPS-PR900-03 — GitHub Enterprise capability matrix
Complete read/write capability coverage for Enterprise controls, custom properties, efficient Actions/artifact/cache usage and repository integration. Governance/Security/QM constraints remain authoritative.

**Exit:** capability matrix distinguishes available, unavailable, read-only and protected-mutation paths with evidence.

#### OPS-PR900-03A — GitHub Work-Management Inventory & Package Materialization
Inventory the currently connected GitHub work-management surfaces and materialize the coordination-only contract without duplicating Roadmap, Project/PVC, platform-version, Governance, Security, Release, Deployment, PR or merge authority.

**State:** `MATERIALIZED_BRANCH / PRE_PR_CORRELATION_READY` on `agent/operations-github-work-management-20260915`.

**Current inventory:** Issues are `AVAILABLE`; Labels and Milestones expose only partial Issue-association surfaces and cannot be completely enumerated/managed as object classes; Issue Types, Organization Issue Fields, Organization Projects/Project Fields and Wiki Pages/Navigation are `NOT_AVAILABLE_ON_CURRENT_CONNECTOR`. `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` is a connector-capability statement only and never proof that an object does not exist.

**Exit:** each requested metadata category has a reproducible capability classification; Roadmap, work-package register, detail contract and package index are consistent; no parallel valid content is lost; final main/head/open-writer correlation is PASS before PR approval.

Detail: `work-packages/OPS_PR900_03A_GITHUB_WORK_MANAGEMENT_2026-09-15.md`.

#### OPS-PR900-03B — GitHub Work-Management Pilot
Sequence: `Taxonomy -> Issue Intake -> Organization Project -> Milestone -> PR -> Done -> Wiki Navigation`.

**State:** `BLOCKED / NOT_STARTED`.

03B starts only after 03A is completed against then-current main, all required object/mutation/readback surfaces are available through an authorized execution path, and the pilot can preserve the coordination-only authority boundary. No partial pilot counts as success.

**Exit:** one real Roadmap work package traverses Issue -> Project -> PR -> Done with a non-versioned delivery-cohort Milestone and navigation-only Wiki backlinks, without creating a second Roadmap/version/Governance/Security/Release/Deployment authority.

### OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence
Correlate existing gateway foundations; select/reuse one canonical architecture; retire or justify duplicates. Protected provider operations must be least-privileged, attributable and auditable; migration requires rollback/compatibility evidence.

**Exit:** no parallel gateway/control plane; OAuth/MCP/provider activation remains explicitly gated.

### OPS-PR900-05 — Production observability/readiness
Define measurable SLI/SLO, incident, release, post-deploy and telemetry evidence; integrate vendor export/readback only when authorized. PostHog/provider telemetry must respect SEC/privacy constraints.

**Exit:** readiness is evidence-derived, not estimated; no synthetic percentage or synthetic PASS.

### OPS-PR900-06 — Security owner returns
Return reproducible evidence for CORS composition, CSP reporting/strict-CSP promotion, unsupported-method denial, auth audit coverage, deployed supervisor behavior, ULS Stripe→auth.users→subscriptions lineage, recovery/RPO/RTO and demo-billing isolation where owned by OPS.

**Exit:** each return is exact-identity/time/snapshot bound and ready for independent SEC verification.

## Carried-forward baseline (pre-2026-09-13)

| Workstream | PVC | State |
|---|---|---|
| OPS-02 Controlled Implementation | PVC-02 | ACTIVE |
| OPS-04 Supervisor | PVC-04 | PARTIAL — post-deploy evidence open |
| OPS-06 Version Management | PVC-06 | BLOCKED_BY_AUTHORITY_CONFLICT |
| OPS-07 Release Management | PVC-07 | PARTIAL |
| OPS-08 Production Operations | PVC-08 | PARTIAL — measured operational evidence open |
| OPS-18 EventMesh / Traceability | PVC-18 | PARTIAL |
| OPS-POST851-EDGE-01 | PVC-02/08 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-OBS-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-PI-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-ID-02 | — | BLOCKED / SEPARATE FOLLOW-UP |
| OPS-08-SEC-07 Recovery / RPO / RTO | PVC-08 | harness on main; measured evidence open |
| OPS-02-SEC-06 Entitlement inventory | PVC-02 | parent complete; child returns + SEC verification open |
| DR-03 | — | BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE |
| OPS-08-B-SH-01 Self-Healing readiness | PVC-08 | separate branch; fail-closed; not merged |

Invariants: Render native Auto Deploy remains off; productive M10 is `RETIRED / OFF`; provider/production mutation requires separate authorization; GitGuardian health/audit is `sources:read` management evidence, not a second scanner.

## Dependencies
GOV authority, QM gate classification, SEC/COMP verification, CLIENT request boundary, DATA/FINTECH child returns.

## Project exit gate
One active OPS roadmap; all non-terminal baseline work and PR-900 OPS packages are owner-correct; deployment/provider mutation is never inferred from repository implementation.
