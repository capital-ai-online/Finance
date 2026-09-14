# CAPITAL-AI-GOV — Canonical Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Folder:** `docs/projects/governance/`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #909 merged; historical-framework purge continues  
**Baseline:** `main@66f8b15e0dfe88084cf1fdbe022955b3e8d30257`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated 2026-09-13 sidecar/archive roadmaps are absorbed here and deleted. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### GOV-CARRY-01 — Existing non-terminal GOV backlog
Carry forward every non-terminal Governance work package, writer/gate dependency and validation obligation.

### GOV-PR900-01 — Option-C/current-main correlation
Correlate active Option-C Governance prototype work against current main and current writers. Remove stale transition blockers that are already DONE_MAIN without erasing their evidence.

### GOV-PR900-02 — Current-state projection integrity
Refresh stale repository-wide current-state projections; reconcile ADR-0069's historical M10/WebAuthn statement with current Trust Root where productive M10 is retired/off.

**Exit:** no active projection contradicts current authority without an explicit owner-routed blocker.

### GOV-PR900-03 — Stable authority version convergence
Resolve `AUTH-GOV-CONTROL-PLANE` version/target drift across Authority Registry and control-plane/component projections.

**Exit:** one stable identity has consistent version semantics and target projections.

### GOV-PR900-04 — Fail-closed freshness/version validators
Extend Governance validation so stale project/task/current-state projections and authority target/version drift can fail closed rather than only validating syntax/path existence.

### GOV-PR900-05 — Staged pre-command flow
Represent `main/open PRs → AGENTS → capability class → Project/PVC/Roadmap → ADR/ESS/CTRL/AUTH → least-privileged decision → ALLOW|ROUTE|REQUIRE_GATE|BLOCK → execution` without creating another authority plane. Productive client materialization remains CLIENT-owned.

### GOV-PR900-06 — Cross-owner strategy routing
Decompose monetization/product-expansion proposals into canonical owners; regulated or money-like/token proposals require COMP/SEC/FINTECH/OPS and Human decision before implementation.

### GOV-PR900-07 — Project presentation in PR approval and PR body
Materialize one canonical presentation projection per project routing row: textual display name, symbol, hexadecimal color and canonical project folder. Reuse `docs/projects/README.md` as the single routing source; do not create a second project/PVC or presentation registry.

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #904 (`main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`). Current, Source and Target resolve independently from the same routing row. Textual Project ID/folder/Owner/PVC identity remains authoritative; color is never the sole semantic cue. Candidate-branch semantics cannot self-bootstrap.

**Exit:** PR approval surface and PR body both resolve Current, Source and Target as `Project ID → canonical project folder → display name → symbol → color` from exactly one canonical `docs/projects/README.md` routing row. Missing, duplicate or malformed metadata fails closed; no second registry exists.

### GOV-PR908-01 — External-framework purge
Remove withdrawn external-framework bindings from Trust Root, Control Plane, Compliance inventories, runtime evidence labels, ADRs, skills, evidence and roadmaps. ISO/IEC 42001 remains the only adopted external Governance benchmark. No deleted binding may re-enter as a requirement, gate, finding or backlog.

**State:** `IN IMPLEMENTATION` after Human-merged PR #909 (`main@66f8b15e0dfe88084cf1fdbe022955b3e8d30257`). Current surfaces and 2026-09-13 archives are closed. Remaining work is Trust-Root §10 wording, registry/catalog phrasing, GOV-CHAT-073 wording and historical Evidence/ADR/Compliance mentions.

### GOV-SOTA02-F05 — Stale provider-instruction references
Replace remaining provider-specific trust-root wording in ESS-0018/ADR-0051 projections with current `/AGENTS.md` authority. Routed from SEC-SOTA-02 historical inventory; GOV-owned.

## Carried-forward baseline (pre-2026-09-13)

Terminal / maintained: GOV-01..GOV-06, GOV-09..GOV-11, GOV-CHAT-070..076, COMP-GAP-008 Governance treatment, copyable chat handoff, owner-approval presentation.

Open:

| ID | State |
|---|---|
| GOV-07 User-Lifecycle closeout | `PARTIAL / OWNER RETURNS PENDING` — DATA/OPS/FE/SEC/COMP returns incomplete; GOV consumes read-only |
| GOV-08 Admin Panel process graph | `REFERRED / FOREIGN OPEN` — CLIENT/FE/OPS |

M10 remains `RETIRED / OFF`. Human/CODEOWNER-only merge remains mandatory.

## Terminal chat ledger (absorbed from 2026-09-13 archive)

`GOV-CHAT-076 / cross-chat current-main consolidation` — `DONE_MAIN / TERMINAL` via PR #868

`GOV-CHAT-074 / Approval Envelope v3.4 rollout` — `DONE_MAIN / TERMINAL` via PR #874

## GOV-CHAT-072

**State:** `DONE_MAIN / TERMINAL`

Human-merged PR #886, merge SHA `0945b7264d6819a57451748888e1fb8c71981762`, materialized exactly one `CTRL-SDLC-PLUGIN-USE-001` under existing Development-Chain authority. No unconditional plugin invocation is authorized.

## Dependencies
OPS version/release, QM gates, SEC/COMP assurance, CLIENT runtime only where productive materialization is needed.

## Project exit gate
One active GOV roadmap; no duplicate authority namespace/writer; current projections agree with effective authority or expose a deterministic blocker; dated 2026-09-13 GOV archive is deleted; current Trust Root and registries name no withdrawn external framework.
