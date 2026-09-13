# CAPITAL-AI-GOV — Roadmap 2026-09-13

**Project:** `CAPITAL-AI-GOV`  
**Folder:** `docs/projects/governance/`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Status:** `ACTIVE — CANONICAL DATED ROADMAP`  
**Baseline:** `main@9634053b222725db69d557f61d44d77b9eb8cb04` (PR #900 merged)  
**Superseded baseline:** `archive/CAPITAL_AI_GOVERNANCE_ROADMAP_SUPERSEDED_2026-09-13.md`

## Consolidation rule
All non-terminal Governance work from the superseded baseline remains active unless explicitly replaced. This roadmap does not alter ADR/ESS/control authority; it projects work against current authority.

## Active work packages

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

## Dependencies
OPS version/release, QM gates, SEC/COMP assurance, CLIENT runtime only where productive materialization is needed.

## Project exit gate
One active GOV roadmap; no duplicate authority namespace/writer; current projections agree with effective authority or expose a deterministic blocker.