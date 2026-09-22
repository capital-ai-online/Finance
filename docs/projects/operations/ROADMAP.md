# CAPITAL-AI-OPS — Canonical Roadmap

**Baseline:** `main@d5829ff2fd40228cc938d07638563f56e178dfa6`
**Project:** `CAPITAL-AI-OPS`  
**Folder:** `docs/projects/operations/`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-22 — SH-02.9 post-merge convergence is terminal; SH-02.10 is the current dependency-ready P0 verification slice  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

`historical/non-terminal != active`

This file remains a temporary project execution projection until the separately requested Roadmap-removal Pull Request after completion of the Social Roadmap. Archive/superseded copies, old chat/work context, prior branch state and historical non-terminal markers are ledger/evidence only. A work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical identity or freshly defined/re-authorized by the Human/Owner in the current interaction. Terminal history is retained as ledger and is not reopened.

## Current execution priority — Owner-directed Self-Healing 2026-09-20

SH-02.0..02.7, SH-02.9A and SH-02.9 are Human-merged on main; SH-02.9 post-merge convergence is terminal through PR #1271 (`886486e057fea2fe833104b23f7a36d05d0b9b58`). Against `main@d5829ff2fd40228cc938d07638563f56e178dfa6`, SH-02.10 — Fault Injection & Convergence Suite — is the current dependency-ready P0 slice. It is non-destructive: SH-02.8 remains HELD and is exercised only as negative-control capability evidence. Hosted exact-head validation and independent QM/Security assurance remain required before SH-02.10 terminal closure or SH-02.11 staged activation.

Current Self-Healing semantics resolve through `/AGENTS.md@CURRENT_MAIN`, `CAPITAL-AI-ASH-01` and `self-healing-contract/1.0.0`. The predecessor SH-01 rule set is archived at `docs/archive/projects/operations/superseded/OPS_08_B_SH_01_SELF_HEALING_READINESS_2026-09-10.md` and has no execution authority.

Detailed package: `work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md`.

### Existing OPS backlog context

**Priority rule:** while a dependency-ready SH-02 slice exists, `OPS-08-B-SH-02` is the highest executable OPS priority. The backlog below remains valid but is not selected ahead of SH-02 unless Self-Healing is genuinely blocked by a real dependency.

1. `OPS-PR900-06 — Security owner returns` is the next normal executable OPS Roadmap evidence-return slice only if fresh current-main correlation still confirms that exact active identity. `OPS-PR900-05` repository materialization is Human-merged via PR #980; its deterministic evidence contract is ready while real live SLO/incident/RPO/RTO/vendor measurements remain explicitly open and must not be synthesized.
2. `OPS-02-CI-01 — Build/Test Cost & Scope Reduction` is repository-integrated for the current bounded slices: PR #988 merged the `NONE / FOCUSED / FULL / REUSE` cost-profile policy and PR #996 merged snapshot-bound stale-event/concurrency hardening. Remaining hosted cost/race observations stay real-evidence-only; no unobserved race or saving is promoted to PASS. Fresh Owner direction activates child `OPS-02-CI-01E — ChatGPT Preflight & Runner-Minute Convergence` at P0 for a machine-readable pre-PR evidence contract and a three-day full-lifecycle runner-minute baseline. This child does not change Required Check, Security, QM, Governance, Human or CODEOWNER semantics; P1 workflow reduction waits on the measured baseline.
3. `OPS-PR900-03B` remains historical `BLOCKED / NOT_STARTED — PROVIDER_HOST / EFFECTIVE-GRANT / READBACK GAP` until fresh current-main correlation explicitly revalidates it. PR #970 and PR #982 put the Reader contract and bounded GitHub Work-Management adapter on main, but no separately authorized provider host with Finance-only effective grants plus real Projects/Fields, Issue Types/Fields, Milestone and Wiki `Read -> Write -> Readback` evidence exists yet.
4. `OPS-PR900-04` repository preparation is current: 04A and 04B are merged. GitHub App creation/installation, permission grants, repository selection, OAuth/MCP connection changes, Vault/private-key provisioning and any PAT provisioning remain `HELD_EXTERNAL_OWNER_AUTHORIZATION` until a separate explicit Human/Owner request authorizes the exact protected mutation.
5. Historical unmerged/diverged OPS branches are search input only and are not successor bases. In particular, `agent/operations-roadmap-current-main-sync-20260916`, `agent/operations-roadmap-post996-sync-20260916`, `agent/operations-github-status-sync-20260916` and `agent/operations-ops18-main-projection-20260915` are not used as current-main integration bases.

At this reconciliation point PR #1001 is terminal/Human-merged into current main. Its historical execution-model text is evidence only and does not create a continuation trigger, chat wake-up, task resurrection or protected external-mutation authority. Provider-host setup remains a distinct Human/Owner-authorized action and is not aggregated into repository documentation work.

## PR #900 / #901 work packages

### OPS-PR900-01 — Event-driven development chain
Correlate the Option-C/project-listener work against current main and applicable authority. Define trigger payloads, deterministic state transitions, idempotency/replay, owner-correct evidence and events; prefer event-native triggers to polling.

**Exit:** one current listener/event flow; no duplicate active listener; every event records source, owner/PVC and exit evidence without becoming task-activation authority.

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

**State:** historical `BLOCKED / NOT_STARTED — PROVIDER_HOST / EFFECTIVE-GRANT / READBACK GAP`; not active by status alone.

**Current blocker:** repository-side prerequisites have advanced but do not constitute a live authorized provider path. PR #970 materialized the least-privileged Reader contract and PR #982 materialized the bounded repository adapter that complements the official GitHub MCP Server for Milestone object management and navigation-only Wiki read/write/readback. Any future execution still requires fresh canonical activation plus one separately authorized execution host, real effective grants, Finance-only repository scope and reproducible provider `Read -> Write -> Readback`.

No connector, OAuth, permission, GitHub App, Vault or provider integration mutation is implied by this Roadmap state.

#### OPS-PR900-03C — GitHub Enterprise API Authority & Capability Matrix
**State:** `MERGED / REVALIDATED / PROVIDER_MUTATION_NOT_AUTHORIZED` via Human-merged PR #962 (`merge SHA 770756209b6248395ce4eedce63981355728004f`).

Provider-native API capability, connected execution-surface capability and effective credential grants remain separate evidence classes. Effective Enterprise/Organization admin grants remain `NOT_PROVEN` until real provider readback exists. Reader and Controller capabilities remain separate and deny-by-default. No provider write is authorized by this slice.

### OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence
Correlate existing gateway foundations; select/reuse one canonical architecture; retire or justify duplicates. Protected provider operations must be least-privileged, attributable and auditable; migration requires rollback/compatibility evidence.

**State:** `REPOSITORY_PREPARATION_READY / PROVIDER_SETUP_HELD` — 04A and 04B are Human-merged on main; protected provider-host/credential setup remains separately authorized.

#### OPS-PR900-04A — GitHub App / MCP Reader Setup
**State:** `MERGED / READER_CONTRACT_READY / PROVIDER_MUTATION_HELD` via Human-merged PR #970 (`merge SHA 7f680c432dbf172a5b672ae0a3bd521b36b11dbe`).

The normal target identity is a GitHub App with short-lived installation tokens behind the CAPITAL-AI MCP gateway. Reader capabilities are explicitly allowlisted. No Controller/write grant, universal admin PAT, GitHub credential in model context or speculative `.codex` GitHub endpoint is introduced. Protected setup requires a separate explicit Human/Owner request.

#### OPS-PR900-04B — GitHub Work-Management Gateway Adapter
**State:** `MERGED / REPOSITORY_ADAPTER_READY / PROVIDER_HOST_HELD` via Human-merged PR #982 (`merge SHA 89d10a14830285ca8d7abd344f6f0da7b3b4c399`).

Projects, Issue Types, Issue Fields and normal Issue lifecycle operations remain delegated to the official GitHub MCP Server. The bounded CAPITAL-AI adapter adds only Finance-bound Milestone object inventory/create/update/readback and generated navigation-only Wiki read/write/readback. Real gateway/Vault-host provisioning and effective-grant readback remain separately authorized.

### OPS-PR900-05 — Production observability/readiness
Define measurable SLI/SLO, incident, release, post-deploy and telemetry evidence; integrate vendor export/readback only when authorized. PostHog/provider telemetry must respect SEC/privacy constraints.

**State:** `MERGED / EVIDENCE_CONTRACT_READY / LIVE_MEASUREMENT_OPEN` via Human-merged PR #980 (`merge SHA b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`).

The canonical package defines a deterministic evidence model over existing liveness/readiness, exact-SHA release/deployment identity, structured request telemetry and incident evidence. Numerical SLO targets/windows, measured incident/RPO/RTO drills and vendor telemetry remain `NOT_PROVEN` until real observations exist. No synthetic readiness percentage/PASS or provider mutation is inferred from repository completion.

### OPS-PR900-06 — Security owner returns
Return reproducible evidence for CORS composition, CSP reporting/strict-CSP promotion, unsupported-method denial, auth audit coverage, deployed supervisor behavior, ULS Stripe→auth.users→subscriptions lineage, recovery/RPO/RTO and demo-billing isolation where owned by OPS.

**Historical state:** prior projection marked this `NEXT_EXECUTABLE / PRIORITY_1`. That marker does not activate work. Execution requires fresh current-main confirmation of this exact identity.

## Historical baseline (pre-2026-09-13) — non-active ledger

| Workstream | PVC | Historical state |
|---|---|---|
| OPS-02 Controlled Implementation | PVC-02 | ACTIVE in prior projection; not active by status alone |
| OPS-04 Supervisor | PVC-04 | PARTIAL — post-deploy evidence open |
| OPS-06 Version Management | PVC-06 | deterministic materialization integrated |
| OPS-07 Release Management | PVC-07 | PARTIAL — broader release evidence may remain |
| OPS-08 Production Operations | PVC-08 | PARTIAL — measured operational evidence may remain |
| OPS-18 EventMesh / Traceability | PVC-18 | PARTIAL |
| OPS-POST851-EDGE-01 | PVC-02/08 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-OBS-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-PI-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-ID-02 | — | historical BLOCKED state |
| OPS-08-SEC-07 Recovery / RPO / RTO | PVC-08 | harness on main; measured evidence may remain |
| OPS-02-SEC-06 Entitlement inventory | PVC-02 | parent complete; child/SEC evidence may remain |
| OPS-02-CI-01 Build/Test Cost & Scope Reduction | PVC-02 | integrated via PR #988 and PR #996; child OPS-02-CI-01E ACTIVE / P0 for preflight + three-day lifecycle telemetry |
| DR-03 | — | historical blocked state |
| OPS-08-B-SH-01 Self-Healing readiness | PVC-08 | ARCHIVED / NON-AUTHORIZING — `docs/archive/projects/operations/superseded/OPS_08_B_SH_01_SELF_HEALING_READINESS_2026-09-10.md` |

Invariants: Render native Auto Deploy remains off; productive M10 is `RETIRED / OFF`; new provider capability/credential provisioning remains separately authorized, while eligible mutations already inside an authorized workflow/provider capability boundary follow `/AGENTS.md@CURRENT_MAIN`; GitGuardian health/audit is management evidence, not a second scanner.

## Dependencies
GOV authority, QM gate classification, SEC/COMP verification, CLIENT request boundary, FINTECH child returns. PVC-09..11 no longer route to a separate DATA project.

## Project exit gate
One active OPS roadmap; active work is selected only from current canonical state or fresh Human/Owner direction; historical/non-terminal state never self-activates; repository state distinguishes merged materialization from open live/provider evidence; deployment/provider mutation is never inferred from repository implementation.
