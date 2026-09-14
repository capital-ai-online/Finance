# CAPITAL-AI-GOV — Canonical Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Folder:** `docs/projects/governance/`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@5dfdfbd4bad088777c48434e65fd7a7ec9921e36`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated sidecar roadmaps, pointer-only `ROADMAP.md` files and PR #900 staging artifacts are removed after this fold. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

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

## Carried-forward baseline (pre-2026-09-13)

Terminal / maintained: GOV-01..GOV-06, GOV-09..GOV-11, GOV-CHAT-070..076, COMP-GAP-008 Governance treatment, copyable chat handoff, owner-approval presentation.

Open:

| ID | State |
|---|---|
| GOV-07 User-Lifecycle closeout | `PARTIAL / OWNER RETURNS PENDING` — DATA/OPS/FE/SEC/COMP returns incomplete; GOV consumes read-only |
| GOV-08 Admin Panel process graph | `REFERRED / FOREIGN OPEN` — CLIENT/FE/OPS |

M10 remains `RETIRED / OFF`. NIST remains non-authorizing. Human/CODEOWNER-only merge remains mandatory. Open PR #904 separately extends project-presentation metadata and must be re-correlated after this fold because it currently writes the dated GOV sidecar.

## Dependencies
OPS version/release, QM gates, SEC/COMP assurance, CLIENT runtime only where productive materialization is needed.

## Project exit gate
One active GOV roadmap; no duplicate authority namespace/writer; current projections agree with effective authority or expose a deterministic blocker.
