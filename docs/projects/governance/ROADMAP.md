# CAPITAL-AI-GOV — Canonical Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Folder:** `docs/projects/governance/`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-15 — PR #944 Human-merge and authority-version convergence correlated; GOV-PR900-04 synchronized after Human-merged PR #946  
**Baseline:** `main@c8a88afc7f9cfad367b592e9567654451f81e436`  
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

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #944 (`main@cda972b2def5a2449b96cde774942364ae1fa697`). Authority Registry, `src/platform/Governance` README/manifest and the control-plane documentation projection now resolve `AUTH-GOV-CONTROL-PLANE` to authority version `1.2.0`; documentation projection version `1.3.1` remains explicitly non-authorizing version metadata.

**Exit:** one stable identity has consistent version semantics and target projections.

### GOV-PR900-04 — Fail-closed freshness/version validators
Extend Governance validation so stale project/task/current-state projections and authority target/version drift can fail closed rather than only validating syntax/path existence.

**State:** `IN IMPLEMENTATION` on `agent/governance-pr900-04-freshness-version-validators-20260915`, synchronized from `main@c8a88afc7f9cfad367b592e9567654451f81e436` after Human merge of FINTECH PR #946. The existing `governance:control-plane` entrypoint remains the single canonical repository Governance validator; implementation is additive inside that execution path and does not create a second Governance authority or command surface.

**Exit:** the canonical validator rejects mismatched declared authority target/projection identity or version for `AUTH-GOV-CONTROL-PLANE` and rejects any changed canonical current-state/project Roadmap or Task Register whose recognized `main@<sha>` baseline is missing or differs from then-current main. Negative regression tests prove both fail-closed paths.

### GOV-PR900-05 — Staged pre-command flow
Represent `main/open PRs → AGENTS → capability class → Project/PVC/Roadmap → ADR/ESS/CTRL/AUTH → least-privileged decision → ALLOW|ROUTE|REQUIRE_GATE|BLOCK → execution` without creating another authority plane. Productive client materialization remains CLIENT-owned.

### GOV-PR900-06 — Cross-owner strategy routing
Decompose monetization/product-expansion proposals into canonical owners; regulated or money-like/token proposals require COMP/SEC/FINTECH/OPS and Human decision before implementation.

### GOV-PR900-07 — Project presentation in PR approval and PR body
Materialize one canonical presentation projection per project routing row: textual display name, symbol, hexadecimal color and canonical project folder. Reuse `docs/projects/README.md` as the single routing source; do not create a second project/PVC or presentation registry.

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #904 (`main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`). Current, Source and Target resolve independently from the same routing row. Textual Project ID/folder/Owner/PVC identity remains authoritative; color is never the sole semantic cue. Candidate-branch semantics cannot self-bootstrap.

**Exit:** PR approval surface and PR body both resolve Current, Source and Target as `Project ID → canonical project folder → display name → symbol → color` from exactly one canonical `docs/projects/README.md` routing row. Missing, duplicate or malformed metadata fails closed; no second registry exists.

### GOV-UNIVERSE-BRANDING-01 — Owner decision and Frontend routing

Materialize the 2026-09-14 Owner decision for one application-wide CAPITAL-AI Universe branding contract without creating a Governance-side design architecture.

**State:** `GOV SCOPE READY / CAPITAL-AI-FE HANDOFF OPEN`.

Current-main correlation confirms that `docs/frontend/design-tokens.json` is already the single machine-readable Branding-/Design-Token authority and `docs/frontend/brandmark.json` the geometry contract. `docs/frontend/FRONTEND_ARCH.md` explicitly prohibits parallel presentation/design authority. Suspended legacy ADR-0004 is non-authorizing; current Accepted PDF/Media ADRs consume the canonical token source. The Owner decision therefore changes values/naming/presentation policy inside the existing Frontend authority boundary and requires **no new ADR/ESS or ADR/ESS supersession** in this GOV slice.

Owner-directed active state routed to FE:

- primary brand: Vader Black `#08080C` + Capital Gold `#F9BF21`;
- Krypto Purple `#8D26FF`, Deadly Green `#44DE88`, Pluto Blue `#60A5FA`, StarTroops Magenta `#E879F9`;
- Meteor Amber `#FF9F1C` remains `OWNER-DESIGN-PROPOSAL` and is not silently activated;
- Bond/Anleihen is `DISABLED` for productive Frontend Universe navigation/filter/ranking/presentation/selectability, without deleting DATA/FINTECH/API contracts or stable technical identifiers;
- Pattern direction is independent from Asset-Class color; BUY derives from `color.score.best`, SELL from `color.score.worst`;
- `strong|medium|weak` use deterministic base-derived foreground/background/border intensity while preserving accessible text/icon semantics;
- `renderWhenMissing=false` / `missingState=omit` remains mandatory and missing Pattern evidence never synthesizes a signal.

Decision evidence and the directly executable CAPITAL-AI-FE handoff prompt are preserved at `docs/projects/governance/evidence/UNIVERSE_BRANDING_OWNER_DECISION_2026-09-14.md`.

**GOV exit:** exactly one existing Frontend Branding-/Design-Token authority remains; Owner state and foreign-owner boundary are explicit; no GOV runtime/design implementation is introduced. Productive token/consumer materialization remains CAPITAL-AI-FE-owned.

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
