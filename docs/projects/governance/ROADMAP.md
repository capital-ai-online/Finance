# CAPITAL-AI-GOV — Canonical Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Folder:** `docs/projects/governance/`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — GOV-PR900-05 staged pre-command flow correlated against current main  
**Baseline:** `main@5ae2b371da45a5c07304fd704a7026eded976f1b`  
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

**Current slice:** synchronize the PR-create lifecycle projections after Human-merged PR #952 activated `/AGENTS.md` v2.11.0 and the correlation-gated Draft-PR path on current main. Historical v3.4 bootstrap evidence remains traceability only.

**Exit:** no active projection contradicts current authority without an explicit owner-routed blocker.

### GOV-PR900-03 — Stable authority version convergence
Resolve `AUTH-GOV-CONTROL-PLANE` version/target drift across Authority Registry and control-plane/component projections.

**Exit:** one stable identity has consistent version semantics and target projections.

### GOV-PR900-04 — Fail-closed freshness/version validators
Extend Governance validation so stale project/task/current-state projections and authority target/version drift can fail closed rather than only validating syntax/path existence.

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #953 (`main@2c4aca31e097a72ed979037eb6ecb66fec1d8619`).

### GOV-PR900-05 — Staged pre-command flow
Represent `main/open PRs → AGENTS → capability class → Project/PVC/Roadmap → ADR/ESS/CTRL/AUTH → least-privileged decision → ALLOW|ROUTE|REQUIRE_GATE|BLOCK → execution` without creating another authority plane. Productive client materialization remains CLIENT-owned.

**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING` on `agent/governance-pr900-05-staged-pre-command-20260916`.

**Materialization:** `src/platform/Governance/Contracts/PreCommandFlow.ts` defines a provider-neutral, non-authorizing pre-command projection. It consumes already-resolved current-main/open-writer state, `/AGENTS.md`, capability grant/classification, Project/PVC/Roadmap routing, applicable ADR/ESS/CTRL/AUTH and the existing least-privileged IAM/policy result. It does not discover authority, grant capabilities, execute commands or duplicate Agent IAM. `tests/unit/preCommandFlow.test.ts` covers ALLOW, ROUTE, REQUIRE_GATE and fail-closed BLOCK paths; `src/platform/Governance/index.ts` exposes the contract.

**Exit:** exact current-main trust-root binding, explicit capability grant, owner-correct project routing, complete authority resolution and an authoritative least-privilege projection deterministically yield `ALLOW|ROUTE|REQUIRE_GATE|BLOCK`; only `ALLOW` is ready for an already-authorized execution host. The contract carries an explicit non-authorizing statement, creates no new `AUTH-*`/`CTRL-*`, leaves Agent IAM/PolicyGate semantics unchanged and leaves productive CLIENT materialization with `CAPITAL-AI-CLIENT`.

### GOV-PR900-06 — Cross-owner strategy routing
Decompose monetization/product-expansion proposals into canonical owners; regulated or money-like/token proposals require COMP/SEC/FINTECH/OPS and Human decision before implementation.

### GOV-PR900-07 — Project presentation in PR approval and PR body
Materialize one canonical presentation projection per project routing row: textual display name, symbol, hexadecimal color and canonical project folder. Reuse `docs/projects/README.md` as the single routing source; do not create a second project/PVC or presentation registry.

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #904 (`main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`). Current, Source and Target resolve independently from the same routing row. Textual Project ID/folder/Owner/PVC identity remains authoritative; color is never the sole semantic cue. Candidate-branch semantics cannot self-bootstrap.

**Exit:** PR approval surface and PR body both resolve Current, Source and Target as `Project ID → canonical project folder → display name → symbol → color` from exactly one canonical `docs/projects/README.md` routing row. Missing, duplicate or malformed metadata fails closed; no second registry exists.

### GOV-CHAT-077 — Correlation-gated automated PR creation and ordered Roadmap PR lane

Materialize the 2026-09-15 Owner decision that ordinary bounded agent-managed Pull Requests are created automatically after successful final repository correlation, while Human/Owner authority moves to post-create review and Human/CODEOWNER-only merge.

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #952 (`merge SHA fe5c8ff06a3f0a7171ba9bc4f8f52bf71c6a3388`). `/AGENTS.md` v2.11.0, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v4.0.0 and `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` v3.0.0 are current-main authority.

The merged change evolved the existing stable authorities instead of creating a second Governance or approval plane:

- `/AGENTS.md` `2.10.0 → 2.11.0`;
- `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` `3.4.0 → 4.0.0`;
- `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` `2.9.0 → 3.0.0`;
- Control Catalog `1.25.0 → 1.26.0` while retaining stable `CTRL-SDLC-PR-CREATE-001`;
- Authority Registry `1.61.0 → 1.62.0` while retaining stable `AUTH-*` identities;
- `.github/workflows/open-agent-draft-pr.yml` removes pre-create approval inputs and uses fail-closed current-main/open-writer/create-correlation before Draft PR creation.

The ordered automated Roadmap lane permits at most one not-yet-integrated automated PR at a time. A successor is created only after predecessor terminal outcome; after merge it starts from a fresh branch on the resulting current `main`, while close-without-merge forces queue recomputation without predecessor payload. Stacked unmerged dependency branches cannot bypass this rule. Final PR-head/current-main correlation and Human/CODEOWNER merge remain mandatory; auto-merge remains prohibited.

**Historical bootstrap boundary:** PR #952 itself correctly used the then-effective v3.4 pre-create Approval Envelope before Human Merge. That bootstrap requirement is historical evidence for the introducing PR and is not a current credential for successor PR creation.

**Exit:** `PASS / DONE_MAIN` — v2.11/v4.0/v3.0 are current-main authority; the trusted Draft-PR workflow contains no active pre-create Owner-approval credential path; final create correlation remains fail-closed; ordered successor work cannot be created before predecessor terminal outcome; required hosted checks and final Human merge boundary remain intact.

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
