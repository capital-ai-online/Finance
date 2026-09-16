# CAPITAL-AI-OPS — Canonical Roadmap

**Project:** `CAPITAL-AI-OPS`  
**Folder:** `docs/projects/operations/`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — post-PR #996 and PR #1001 current-main status sync  
**Baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## Current execution priority — post-PR #996

1. `OPS-PR900-06 — Security owner returns` is the next normal executable OPS Roadmap evidence-return slice. `OPS-PR900-05` repository materialization is Human-merged via PR #980; its deterministic evidence contract is ready while real live SLO/incident/RPO/RTO/vendor measurements remain explicitly open and must not be synthesized.
2. `OPS-02-CI-01 — Build/Test Cost & Scope Reduction` is repository-integrated for the current bounded slices: PR #988 merged the `NONE / FOCUSED / FULL / REUSE` cost-profile policy and PR #996 merged snapshot-bound stale-event/concurrency hardening. Remaining hosted cost/race observations stay real-evidence-only; no unobserved race or saving is promoted to PASS.
3. `OPS-PR900-03B` remains `BLOCKED / NOT_STARTED — PROVIDER_HOST / EFFECTIVE-GRANT / READBACK GAP`. PR #970 and PR #982 put the Reader contract and bounded GitHub Work-Management adapter on main, but no separately authorized provider host with Finance-only effective grants plus real Projects/Fields, Issue Types/Fields, Milestone and Wiki `Read -> Write -> Readback` evidence exists yet.
4. `OPS-PR900-04` repository preparation is current: 04A and 04B are merged. GitHub App creation/installation, permission grants, repository selection, OAuth/MCP connection changes, Vault/private-key provisioning and any PAT provisioning remain `HELD_EXTERNAL_OWNER_AUTHORIZATION` until a separate explicit Human/Owner request authorizes the exact protected mutation.
5. Historical unmerged/diverged OPS branches are search input only and are not successor bases. In particular, `agent/operations-roadmap-current-main-sync-20260916`, `agent/operations-roadmap-post996-sync-20260916`, `agent/operations-github-status-sync-20260916` and `agent/operations-ops18-main-projection-20260915` are not used as current-main integration bases.

At this reconciliation point no Pull Request is open. PR #1001 is terminal/Human-merged into current main and its `/AGENTS.md` work-package-granularity plus post-merge continuation semantics were fully re-read before this rematerialization. Those semantics do not relax the separate protected external-mutation boundary: the Provider-Host setup remains a distinct Human/Owner-authorized action and is not aggregated into this repository documentation package.

## PR #900 / #901 work packages

### OPS-CARRY-01 — Existing non-terminal OPS backlog
Carry forward all non-terminal OPS work, including controlled implementation, supervisor, version, release, production, EventMesh/trace, recovery, evidence and independently owned verification dependencies.

### OPS-PR900-01 — Event-driven development chain
Correlate the Option-C/project-listener work against current main and applicable authority. Define trigger payloads, deterministic state transitions, idempotency/replay, owner-correct handoff evidence and continuation events; prefer event-native triggers to polling.

**Exit:** one current listener/event flow; no duplicate active listener; every handoff records source event, owner/PVC, exit evidence and continuation trigger.

### OPS-PR900-02 — Deterministic version/release/deploy identity
Complete Stage-2 PVC-06/PVC-07 validation, reconcile version-rule and Release Version Gate semantics, and prove exact-SHA promotion plus post-deploy identity. Render native Auto Deploy remains off unless separately authorized.

**State:** `MERGED / IMPLEMENTED_ON_MAIN / EXACT_SHA_PRODUCTION_IDENTITY_VERIFIED` via Human-merged PR #977 (`merge SHA c89add85ca43a31bff61a27b33eef49f891ffba4`).

**Current result:** the terminal PR #977 evidence proved one exact snapshot across successful main CI/build/test/supply-chain workflow, exact-SHA Render deploy-hook target and post-deploy commit/health verification. Later current-main commits do not reopen that terminal package; each future promotion requires its own exact-SHA evidence. `package.json#version` remains the sole platform-version authority.

**Authority boundary:** the verified promotion/readback proves identity and health for the executed snapshot. It does not grant automatic Release Acceptance, tag, merge, future deployment or other protected production-mutation authority.

**Exit:** `PASS` — one exact snapshot has truthful successful checks, deterministic version/release agreement and production identity evidence.

### OPS-PR900-03 — GitHub Enterprise capability matrix
Complete read/write capability coverage for Enterprise controls, custom properties, efficient Actions/artifact/cache usage and repository integration. Governance/Security/QM constraints remain authoritative.

**Exit:** capability matrix distinguishes available, unavailable, read-only and protected-mutation paths with evidence.

#### OPS-PR900-03A — GitHub Work-Management Inventory & Package Materialization
Inventory the currently connected GitHub work-management surfaces and materialize the coordination-only contract without duplicating Roadmap, Project/PVC, platform-version, Governance, Security, Release, Deployment, PR or merge authority.

**State:** `MERGED / CAPABILITY_GAP_VERIFIED` via Human-merged PR #950 (`merge SHA 1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`).

**Provider vs connector capability:** Finance repository metadata confirms GitHub-native Issues/Projects/Wiki feature availability where observed, while current connector capability remains a separate evidence class. Provider feature availability does not prove complete object-level inventory, mutation or readback through the connected execution surface.

**Exit:** `PASS` for 03A — requested metadata categories have a reproducible provider-versus-connector classification; no partial 03B pilot is represented as success.

Detail: `work-packages/OPS_PR900_03A_GITHUB_WORK_MANAGEMENT_2026-09-15.md`.

#### OPS-PR900-03B — GitHub Work-Management Pilot
Sequence: `Taxonomy -> Issue Intake -> Organization Project -> Milestone -> PR -> Done -> Wiki Navigation`.

**State:** `BLOCKED / NOT_STARTED — PROVIDER_HOST / EFFECTIVE-GRANT / READBACK GAP`.

**Current blocker:** repository-side prerequisites have advanced but do not constitute a live authorized provider path. PR #970 materialized the least-privileged Reader contract and PR #982 materialized the bounded repository adapter that complements the official GitHub MCP Server for Milestone object management and navigation-only Wiki read/write/readback. The pilot still requires one separately authorized execution host, real effective grants, Finance-only repository scope and reproducible provider `Read -> Write -> Readback` across Organization Projects V2/Project Fields, Issue Types/Fields, Milestones and Wiki navigation.

03B starts only after those required object/mutation/readback surfaces are available through that authorized path and the pilot can preserve the coordination-only authority boundary. No connector, OAuth, permission, GitHub App, Vault or provider integration mutation is implied by this Roadmap state.

**Exit:** one real Roadmap work package traverses Issue -> Project -> PR -> Done with a non-versioned delivery-cohort Milestone and navigation-only Wiki backlinks, with each mutable provider step reproducibly read back, without creating a second Roadmap/version/Governance/Security/Release/Deployment authority.

#### OPS-PR900-03C — GitHub Enterprise API Authority & Capability Matrix
Re-correlate the previously materialized GitHub Enterprise API/permission design against the Human-merged 03A/03B state and then-current repository authority before any productive credential or provider mutation.

**State:** `MERGED / REVALIDATED / PROVIDER_MUTATION_NOT_AUTHORIZED` via Human-merged PR #962 (`merge SHA 770756209b6248395ce4eedce63981355728004f`).

**Current result:** provider-native API capability, connected execution-surface capability and effective credential grants remain separate evidence classes. Effective Enterprise/Organization admin grants remain `NOT_PROVEN` until real provider readback exists.

**Authority boundary:** Reader and Controller capabilities remain separate and deny-by-default. GitHub App short-lived installation identity is the normal target; PAT-only compatibility surfaces are explicit exceptions. No GitHub App install, PAT creation, OAuth/connector permission change, secret/IAM mutation or provider write is authorized by this slice.

**03B dependency:** 03C documentation does not itself unblock 03B.

**Exit:** `PASS` for the repository capability/authority matrix; downstream provider grant/readback and Controller mutation remain separately gated.

Detail: `work-packages/OPS_PR900_03C_GITHUB_API_AUTHORITY_MATRIX_2026-09-16.md`.

### OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence
Correlate existing gateway foundations; select/reuse one canonical architecture; retire or justify duplicates. Protected provider operations must be least-privileged, attributable and auditable; migration requires rollback/compatibility evidence.

**State:** `REPOSITORY_PREPARATION_READY / PROVIDER_SETUP_HELD` — 04A and 04B are Human-merged on main; protected provider-host/credential setup remains separately authorized.

**Exit:** no parallel gateway/control plane; OAuth/MCP/provider activation remains explicitly gated.

#### OPS-PR900-04A — GitHub App / MCP Reader Setup
Materialize the least-privileged Reader contract for durable GitHub Enterprise, Organization, Repository and Security readback through the existing Codex/MCP convergence path without enabling Controller authority or creating a second credential/control plane.

**State:** `MERGED / READER_CONTRACT_READY / PROVIDER_MUTATION_HELD` via Human-merged PR #970 (`merge SHA 7f680c432dbf172a5b672ae0a3bd521b36b11dbe`).

**Reader boundary:** normal target identity is a GitHub App with short-lived installation tokens behind the CAPITAL-AI MCP gateway. Reader capabilities are explicitly allowlisted. No Controller/write grant, universal admin PAT, GitHub credential in model context or speculative `.codex` GitHub endpoint is introduced.

**Protected setup gate:** GitHub App creation/installation, permission grants, repository selection, OAuth/MCP connection changes, Vault credential creation and any PAT provisioning require a separate explicit Human/Owner request under current `/AGENTS.md`.

**Exit:** `PASS` for the repository Reader contract; unresolved provider grants/contradictions remain fail-closed and independent Security verification stays separate after real provider readback.

Detail: `work-packages/OPS_PR900_04A_GITHUB_APP_MCP_READER_SETUP_2026-09-16.md`.

#### OPS-PR900-04B — GitHub Work-Management Gateway Adapter
Materialize the smallest repository-side complement to the official GitHub MCP Server without creating a generic GitHub proxy or a second credential/control plane.

**State:** `MERGED / REPOSITORY_ADAPTER_READY / PROVIDER_HOST_HELD` via Human-merged PR #982 (`merge SHA 89d10a14830285ca8d7abd344f6f0da7b3b4c399`).

**Current result:** Projects, Issue Types, Issue Fields and normal Issue lifecycle operations remain delegated to the official GitHub MCP Server. The bounded CAPITAL-AI adapter adds only Finance-bound Milestone object inventory/create/update/readback and generated navigation-only Wiki read/write/readback. It accepts or persists no GitHub token or private key and exposes no generic REST/GraphQL/Git pass-through.

**Provider-host gate:** real gateway/Vault-host provisioning, GitHub App private key, short-lived installation-token minting, effective-grant readback and real provider `Read -> Write -> Readback` remain `NOT RUN / HELD_EXTERNAL_OWNER_AUTHORIZATION` until separately authorized.

**Exit:** repository-side 04B is complete on main; provider-host exit remains separate and is the remaining prerequisite before 03B can be reconsidered.

Detail: `work-packages/OPS_PR900_04B_GITHUB_WORK_MANAGEMENT_GATEWAY_ADAPTER_2026-09-16.md`.

### OPS-PR900-05 — Production observability/readiness
Define measurable SLI/SLO, incident, release, post-deploy and telemetry evidence; integrate vendor export/readback only when authorized. PostHog/provider telemetry must respect SEC/privacy constraints.

**State:** `MERGED / EVIDENCE_CONTRACT_READY / LIVE_MEASUREMENT_OPEN` via Human-merged PR #980 (`merge SHA b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`).

**Current result:** the canonical package defines a deterministic evidence model over existing liveness/readiness, exact-SHA release/deployment identity, structured request telemetry and incident evidence. Numerical SLO targets/windows, measured incident/RPO/RTO drills and vendor telemetry remain `NOT_PROVEN` until real observations exist.

**Execution boundary:** no synthetic readiness percentage/PASS, no new vendor export/provider integration/paid capability, and no connector permission or production mutation is inferred from repository completion.

**Exit:** repository materialization `PASS`; live operational/provider measurements remain an open evidence stream and are not backfilled with estimates.

Detail: `work-packages/OPS_PR900_05_PRODUCTION_READINESS_2026-09-16.md`.

### OPS-PR900-06 — Security owner returns
Return reproducible evidence for CORS composition, CSP reporting/strict-CSP promotion, unsupported-method denial, auth audit coverage, deployed supervisor behavior, ULS Stripe→auth.users→subscriptions lineage, recovery/RPO/RTO and demo-billing isolation where owned by OPS.

**State:** `NEXT_EXECUTABLE / PRIORITY_1` after the Human-merged OPS-PR900-05 repository evidence contract. Live readiness measurements and independent Security verification remain separate evidence gates rather than prerequisites that silently promote themselves to PASS.

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
| OPS-08-SEC-07 Recovery / RPO / RTO | PVC-08 | harness on main; measured operational RPO/RTO evidence open |
| OPS-02-SEC-06 Entitlement inventory | PVC-02 | parent complete; child returns + SEC verification open |
| OPS-02-CI-01 Build/Test Cost & Scope Reduction | PVC-02 | `IMPLEMENTED_ON_MAIN / COST_PROFILE_AND_STALE_EVENT_GUARD_MERGED` via PR #988 (`741cdaccb2b2236d626de13c9293d604f48c53e7`) and PR #996 (`60ae94a07ab19c497e841fce48e4e96c81cdfcf1`); hosted cost/race evidence remains real-evidence-only |
| DR-03 | — | BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE |
| OPS-08-B-SH-01 Self-Healing readiness | PVC-08 | historical branch state requires fresh current-main correlation before any continuation |

Invariants: Render native Auto Deploy remains off; productive M10 is `RETIRED / OFF`; provider/production mutation requires separate authorization; GitGuardian health/audit is `sources:read` management evidence, not a second scanner.

## Dependencies
GOV authority, QM gate classification, SEC/COMP verification, CLIENT request boundary, DATA/FINTECH child returns.

## Project exit gate
One active OPS roadmap; all non-terminal baseline work and PR-900 OPS packages are owner-correct; repository state distinguishes merged contract/materialization work from still-open live/provider evidence; deployment/provider mutation is never inferred from repository implementation.