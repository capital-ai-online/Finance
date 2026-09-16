# CAPITAL-AI-OPS — Canonical Roadmap

**Project:** `CAPITAL-AI-OPS`  
**Folder:** `docs/projects/operations/`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — post-PR #977 exact-SHA Production correlation and priority sync  
**Baseline:** `main@c89add85ca43a31bff61a27b33eef49f891ffba4`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## Current execution priority — post-PR #977

1. `OPS-PR900-05 — Production observability/readiness` is the next executable OPS Roadmap slice. It consumes the now-verified exact-SHA main→Render→post-deploy identity chain and turns remaining operational readiness gaps into measurable SLI/SLO, incident, release, post-deploy and telemetry evidence without requiring protected provider activation.
2. `OPS-PR900-06 — Security owner returns` follows as the next evidence-return slice where OPS-owned exact-identity/time/snapshot evidence is available; independent Security `VERIFIED/CLOSED` authority remains with `CAPITAL-AI-SEC`.
3. `OPS-PR900-03B` remains `BLOCKED / NOT_STARTED` because the complete Projects V2 + Project Fields + Milestone object-management + Wiki mutation/readback execution surface is still unavailable through an already authorized path.
4. Historical unmerged OPS branches, including `agent/operations-pr-ci-autofix-20260916` and `agent/operations-ops18-main-projection-20260915`, are stale/diverged search input only. They are not current Roadmap authority and are not successor bases.

No open Pull Request existed at this reconciliation point. A successor implementation starts from then-current `main` and repeats current-main, Project/PVC/Owner, Roadmap, ADR/ESS and writer/overlap correlation.

## PR #900 / #901 work packages

### OPS-CARRY-01 — Existing non-terminal OPS backlog
Carry forward all non-terminal OPS work, including controlled implementation, supervisor, version, release, production, EventMesh/trace, recovery, evidence and independently owned verification dependencies.

### OPS-PR900-01 — Event-driven development chain
Correlate the Option-C/project-listener work against current main and applicable authority. Define trigger payloads, deterministic state transitions, idempotency/replay, owner-correct handoff evidence and continuation events; prefer event-native triggers to polling.

**Exit:** one current listener/event flow; no duplicate active listener; every handoff records source event, owner/PVC, exit evidence and continuation trigger.

### OPS-PR900-02 — Deterministic version/release/deploy identity
Complete Stage-2 PVC-06/PVC-07 validation, reconcile version-rule and Release Version Gate semantics, and prove exact-SHA promotion plus post-deploy identity. Render native Auto Deploy remains off unless separately authorized.

**State:** `MERGED / IMPLEMENTED_ON_MAIN / EXACT_SHA_PRODUCTION_IDENTITY_VERIFIED` via Human-merged PR #977 (`merge SHA c89add85ca43a31bff61a27b33eef49f891ffba4`).

**Current result:** current `main`, the successful main CI/build/test/supply-chain workflow, the exact-SHA Render deploy-hook target, the live Render deployment and post-deploy commit/health verification all bind to `c89add85ca43a31bff61a27b33eef49f891ffba4`. The workflow produced both `supply-chain-provenance-c89add85ca43a31bff61a27b33eef49f891ffba4` and `deployment-identity-evidence-c89add85ca43a31bff61a27b33eef49f891ffba4`. `package.json#version` remains `0.6.0`; this package integrated deterministic materialization capability and did not itself create a platform-version bump.

**Authority boundary:** the verified promotion/readback proves identity and health for the executed main pipeline. It does not grant automatic Release Acceptance, tag, merge, future deployment or other protected production-mutation authority.

**Exit:** `PASS` — one exact snapshot has truthful successful checks, deterministic version/release agreement and production identity evidence.

### OPS-PR900-03 — GitHub Enterprise capability matrix
Complete read/write capability coverage for Enterprise controls, custom properties, efficient Actions/artifact/cache usage and repository integration. Governance/Security/QM constraints remain authoritative.

**Exit:** capability matrix distinguishes available, unavailable, read-only and protected-mutation paths with evidence.

#### OPS-PR900-03A — GitHub Work-Management Inventory & Package Materialization
Inventory the currently connected GitHub work-management surfaces and materialize the coordination-only contract without duplicating Roadmap, Project/PVC, platform-version, Governance, Security, Release, Deployment, PR or merge authority.

**State:** `MERGED / CAPABILITY_GAP_VERIFIED` via Human-merged PR #950 (`merge SHA 1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`). Post-merge capability re-correlation was performed against `main@2c4aca31e097a72ed979037eb6ecb66fec1d8619` under `/AGENTS.md` v2.11.0.

**Provider vs connector capability:** Finance repository metadata confirms the GitHub-native repository features `has_issues=true`, `has_projects=true` and `has_wiki=true`, and the Issue surface supports association to an already known milestone number. Those provider facts do not prove that the currently connected ChatGPT GitHub connector exposes complete object-level inventory, mutation and readback. On the current connector, Issues are `AVAILABLE`; Labels and Milestones remain `PARTIAL_SURFACE`; Issue Types, Organization Issue Fields, Organization Projects/Project Fields and Wiki Pages/Navigation remain `NOT_AVAILABLE_ON_CURRENT_CONNECTOR`. This is an execution-surface gap, not proof that the corresponding GitHub-native object or feature does not exist.

**Exit:** `PASS` for 03A — each requested metadata category has a reproducible provider-versus-connector classification; Roadmap, work-package register and detail contract distinguish GitHub-native feature state from connected execution-surface capability; no partial 03B pilot is represented as success.

Detail: `work-packages/OPS_PR900_03A_GITHUB_WORK_MANAGEMENT_2026-09-15.md`.

#### OPS-PR900-03B — GitHub Work-Management Pilot
Sequence: `Taxonomy -> Issue Intake -> Organization Project -> Milestone -> PR -> Done -> Wiki Navigation`.

**State:** `BLOCKED / NOT_STARTED`.

**Current blocker:** `CONNECTOR / EXECUTION-SURFACE GAP`. 03B requires Organization Projects V2 + Project Fields, Milestone object management and Wiki navigation to be available through an already authorized execution path with both mutation and readback. The current connected connector does not expose that complete capability set, so no Issue/Project/Milestone/Wiki partial pilot is created.

03B starts only after all required object/mutation/readback surfaces are available through an authorized execution path and the pilot can preserve the coordination-only authority boundary. No connector, OAuth, permission or provider integration mutation is implied by this Roadmap state.

**Exit:** one real Roadmap work package traverses Issue -> Project -> PR -> Done with a non-versioned delivery-cohort Milestone and navigation-only Wiki backlinks, with each mutable provider step reproducibly read back, without creating a second Roadmap/version/Governance/Security/Release/Deployment authority.

#### OPS-PR900-03C — GitHub Enterprise API Authority & Capability Matrix
Re-correlate the previously materialized GitHub Enterprise API/permission design against the Human-merged 03A/03B state and then-current repository authority before any productive credential or provider mutation.

**State:** `MERGED / REVALIDATED / PROVIDER_MUTATION_NOT_AUTHORIZED` via Human-merged PR #962 (`merge SHA 770756209b6248395ce4eedce63981355728004f`).

**Current result:** provider-native API capability, connected ChatGPT GitHub connector capability and effective credential grants are separate evidence classes. Repository ruleset readback is `CURRENT_CONNECTOR_READ_AVAILABLE` and reproduced the active `main-production-protection` ruleset. Enterprise-ruleset and Organization-Actions endpoints are `CURRENT_CONNECTOR_NOT_EXPOSED` on this connector even though official GitHub APIs exist. Effective Enterprise/Organization admin grants remain `NOT_PROVEN`.

**Authority boundary:** Reader and Controller capabilities remain separate and deny-by-default. GitHub App short-lived installation identity is the normal target; PAT-only compatibility surfaces are explicit exceptions. Enterprise audit-log token support remains `DOC_CONTRADICTION_LIVE_VERIFY`. No GitHub App install, PAT creation, OAuth/connector permission change, secret/IAM mutation or provider write is authorized by this slice.

**03B dependency:** 03C documentation does not unblock 03B. Projects V2 + Project Fields, Milestone object management and Wiki navigation still require an already authorized Write + reproducible Readback execution path before any pilot starts.

**Exit:** `PASS` for the repository capability/authority matrix; downstream provider grant/readback and Controller mutation remain separately gated.

Detail: `work-packages/OPS_PR900_03C_GITHUB_API_AUTHORITY_MATRIX_2026-09-16.md`.

### OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence
Correlate existing gateway foundations; select/reuse one canonical architecture; retire or justify duplicates. Protected provider operations must be least-privileged, attributable and auditable; migration requires rollback/compatibility evidence.

**Exit:** no parallel gateway/control plane; OAuth/MCP/provider activation remains explicitly gated.

#### OPS-PR900-04A — GitHub App / MCP Reader Setup
Materialize the least-privileged Reader contract for durable GitHub Enterprise, Organization, Repository and Security readback through the existing Codex/MCP convergence path without enabling Controller authority or creating a second credential/control plane.

**State:** `MERGED / READER_CONTRACT_READY / PROVIDER_MUTATION_HELD` via Human-merged PR #970 (`merge SHA 7f680c432dbf172a5b672ae0a3bd521b36b11dbe`).

**Reader boundary:** normal target identity is a GitHub App with short-lived installation tokens behind the CAPITAL-AI MCP gateway. Reader capabilities are explicitly allowlisted and limited to required Enterprise/Organization/Repository settings inventory plus Actions, Code Scanning, Secret Scanning and Dependabot readback. No Controller/write grant, universal admin PAT, GitHub credential in model context or speculative `.codex` GitHub endpoint is introduced.

**Provider gaps:** effective GitHub App grants remain `NOT_PROVEN` until a separately authorized App/gateway setup exists. Enterprise audit-log token support remains `DOC_CONTRADICTION_LIVE_VERIFY`; Enterprise code-security configuration remains `PAT_COMPATIBILITY_REQUIRED`. Current connector rejection of those endpoint families is classified as execution-surface evidence, not provider permission denial. Secret Scanning readback requires `hide_secret=true` wherever supported and forbids literal secret output.

**Protected setup gate:** GitHub App creation/installation, permission grants, repository selection, OAuth/MCP connection changes, Vault credential creation and any PAT provisioning require a separate explicit Human/Owner request under current `/AGENTS.md`; this repository slice performs none of those mutations.

**Exit:** `PASS` for the repository Reader contract; unresolved provider grants/contradictions remain fail-closed and independent Security verification stays separate after real provider readback.

Detail: `work-packages/OPS_PR900_04A_GITHUB_APP_MCP_READER_SETUP_2026-09-16.md`.

### OPS-PR900-05 — Production observability/readiness
Define measurable SLI/SLO, incident, release, post-deploy and telemetry evidence; integrate vendor export/readback only when authorized. PostHog/provider telemetry must respect SEC/privacy constraints.

**State:** `NEXT_EXECUTABLE / PRIORITY_1` after terminal `OPS-PR900-02` exact-SHA production-identity verification.

**Execution boundary:** start with repository-native and already available production/readback evidence. Do not activate a new vendor export, provider integration, paid capability, connector permission or production mutation merely to satisfy this package.

**Exit:** readiness is evidence-derived, not estimated; no synthetic percentage or synthetic PASS.

### OPS-PR900-06 — Security owner returns
Return reproducible evidence for CORS composition, CSP reporting/strict-CSP promotion, unsupported-method denial, auth audit coverage, deployed supervisor behavior, ULS Stripe→auth.users→subscriptions lineage, recovery/RPO/RTO and demo-billing isolation where owned by OPS.

**State:** `QUEUED / PRIORITY_2` after the production-readiness evidence slice, with independent Security verification retained.

**Exit:** each return is exact-identity/time/snapshot bound and ready for independent SEC verification.

## Carried-forward baseline (pre-2026-09-13)

| Workstream | PVC | State |
|---|---|---|
| OPS-02 Controlled Implementation | PVC-02 | ACTIVE |
| OPS-04 Supervisor | PVC-04 | PARTIAL — post-deploy evidence open |
| OPS-06 Version Management | PVC-06 | deterministic materialization integrated; unrelated Node authority conflict remains separately blocked |
| OPS-07 Release Management | PVC-07 | PARTIAL — deterministic Stage-2 path integrated; broader release evidence remains open |
| OPS-08 Production Operations | PVC-08 | PARTIAL — measured operational evidence open |
| OPS-18 EventMesh / Traceability | PVC-18 | PARTIAL |
| OPS-POST851-EDGE-01 | PVC-02/08 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-OBS-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-PI-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-ID-02 | — | BLOCKED / SEPARATE FOLLOW-UP |
| OPS-08-SEC-07 Recovery / RPO / RTO | PVC-08 | harness on main; measured evidence open |
| OPS-02-SEC-06 Entitlement inventory | PVC-02 | parent complete; child returns + SEC verification open |
| DR-03 | — | BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE |
| OPS-08-B-SH-01 Self-Healing readiness | PVC-08 | separate historical branch; requires fresh current-main correlation before any continuation |

Invariants: Render native Auto Deploy remains off; productive M10 is `RETIRED / OFF`; provider/production mutation requires separate authorization; GitGuardian health/audit is `sources:read` management evidence, not a second scanner.

## Dependencies
GOV authority, QM gate classification, SEC/COMP verification, CLIENT request boundary, DATA/FINTECH child returns.

## Project exit gate
One active OPS roadmap; all non-terminal baseline work and PR-900 OPS packages are owner-correct; deployment/provider mutation is never inferred from repository implementation.