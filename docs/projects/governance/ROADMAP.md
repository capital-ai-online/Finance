# CAPITAL-AI-GOV — Canonical Roadmap

**Baseline:** `main@8f5fff57613f183e0e1a2a8c8b41017338e63491`

**Project:** `CAPITAL-AI-GOV`  
**Folder:** `docs/projects/governance/`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-23 — Owner-directed deploy-batch correlation contract defined against fresh CURRENT_MAIN; productive CI/Render materialization remains owner-correct with CAPITAL-AI-OPS  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

`historical/non-terminal != active`

This file remains a temporary project status projection until the separately requested Roadmap-removal Pull Request after completion of the Social Roadmap. Historical, pre-consolidation, non-terminal, branch-only, chat-derived or superseded entries are ledger/evidence only and are not executable merely because they were previously open.

A work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical repository/project/Roadmap identity, or when the Human/Owner freshly defines or re-authorizes it in the current interaction. Terminal history remains ledger only and is not reopened.

## GOV-DEPLOY-BATCH-01 — 5-Merge Deployment / 10-Merge Version Cadence

**State:** `IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED`  
**Priority:** `P1 🟠 Hoch`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Fresh baseline:** `main@86fb86c69df1b65a69c006b4b08eee262c7db40c`  
**Foreign-owner handoff after merge:** `CAPITAL-AI-OPS / PVC-06, PVC-07, PVC-08`; Live-Roadmap consumption remains `CAPITAL-AI-FE`

Fresh Human/Owner direction defines one application-wide cadence authority. The Human merge of this Governance slice is the non-retroactive `cadenceEpoch`: historical merges do not prefill counters. Repository truth always follows latest `CURRENT_MAIN`; Production is a separate lagging deployment projection.

- normal automatic Render deploy: fixed merge ordinals **5/10/15/...** after the epoch; delayed/failed deployment never shifts later boundaries;
- target at deployment mutation: freshly reread latest `CURRENT_MAIN`;
- expected healthy lag below `5/5`: `DEPLOYMENT_QUEUED`, never drift and never an exact-SHA recovery trigger;
- failed/due deployment: true `PRODUCTION_DRIFT`; bounded existing recovery may retry without another five merges;
- ordinary automatic platform version: fixed merge ordinals **10/20/30/...**, exact next PATCH on the candidate branch before Human merge through the existing Release Version Gate (`0.6.0 → 0.6.1` example); explicit higher releases do not shift those boundaries;
- `package.json#version` remains sole authority; root/package-root lockfile versions are governed mirrors;
- semantic PATCH/MINOR/MAJOR classification remains Release-impact evidence, while between-cadence automatic version mutation is superseded;
- CI/tests, Self-Healing continuation and live/current-state dashboard always follow latest `CURRENT_MAIN`, not the live Production SHA.

This Governance slice intentionally does **not** mutate OPS workflows, Render/provider state or FE dashboard files. Productive OPS materialization must reuse the existing `ci.yml`, Post-Merge Production Correlation, exact-SHA recovery and Release Version Gate writers; no second deploy/version/Self-Healing controller is permitted. Human-merged SEC PR #1337 is terminal on CURRENT_MAIN and completed the Roadmap dashboard convergence. This branch consumes that result as evidence and still avoids creating a second dashboard writer.

**Exit:** one Trust Root + ADR-0105 v1.1 + Versioning Rule Contract v1.1 define the fixed 5/10 cadence, non-retroactive epoch, latest-main semantics and recovery boundary; Control Catalog/Authority Registry and tests agree; OPS/FE successors have one unambiguous owner-correct implementation target after Human merge.

## GOV-SH-V3 — Self-Healing Convergence Program

**State:** `ACTIVE / FOUNDATIONS_MERGED / OWNER-CORRECT CONTINUATION`  
**Priority:** `P0 🔴 Kritisch`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

This program projects the current Owner-directed continuation of the merged PR-convergence and Self-Healing work. It does not reactivate historical chat tasks and does not create a second control plane.

### Verified merged foundations

The following Pull Requests are terminal evidence/prerequisites, not active work items:

- PR #1170 — continuation self-selection fix;
- PR #1171 — SH-02 status convergence before SH-02.7;
- PR #1172 — canonical Evidence → Decision Reconciler;
- PR #1174 — universal PR build/test autofix orchestration;
- PR #1176 — PR1174 reconciliation-test convergence;
- PR #1177 — standardized pre/post-merge PR convergence.
- PR #1179 — SH-V3 convergence milestones/work-package foundation;
- PR #1198 / #1199 / #1214 / #1218 — SH-V3-02 ancestry, serialized repair, merge-continuation and dispatched-CI convergence;
- PR #1229 — bounded Issue intake → canonical project dispatch on the Governance side; productive Self-Healing integration remains OPS-owned.
- PR #1269 — SH-V3-02 v1.8 collapsed Technical-Traceability/Production-Baseline drift recognition and trusted-main bootstrap convergence.

### Active dependency chain

1. `SH-V3-01 — Convergence Readback & Overlap Recovery`: `FOUNDATION_MERGED / CONTINUOUS_INVARIANT` via PR #1179; reused by later convergence, not reopened as branch work.
2. `SH-V3-02 — Control Panel Autofix Orchestration Watchdog`: `IMPLEMENTED_ON_MAIN / CONTINUOUS_WATCHDOG` through PR #1198, #1199, #1214, #1218 and #1269; v1.8 collapsed-details drift now re-enters the existing trusted-main Decision/Evidence repair path, and future findings remain evidence-bound to registered repairers.
3. `SH-V3-03 — Exact-SHA Runtime Recovery`: `IMPLEMENTED_ON_MAIN` through owner-correct OPS PR #1187; repository implementation is distinct from any later production/readback evidence.
4. `SH-02.8 — Protected rollback/restore contracts`: `HELD` until its explicit recovery-evidence plus SEC/COMP/QM prerequisites are satisfied; merge of SH-02.7 alone does not synthesize that evidence.
5. `SH-02.9A — Issue Intake & Project Dispatch`: `DONE_MAIN / TERMINAL` through OPS PR #1246 and post-merge convergence PR #1259, consuming the Governance-side dispatch contract from PR #1229.
6. `SH-02.9 — Observability/SLO/incident convergence`: `IMPLEMENTED_ON_MAIN` through merged OPS PR #1262. Open OPS PR #1271 owns the post-merge projection/convergence readback and does not overlap this GOV roadmap reconciliation.
7. `SH-02.10 — Fault injection/convergence suite`: remains dependency-held until the owner-correct SH-02.9 post-merge projection in PR #1271 reaches verified terminal evidence.
8. `SH-02.11 — Staged production activation`: dependency-held until the enabled preceding tiers are verified.

### Single-writer and protected-blocker rules

- Canonical v1.8 Decision/Evidence drift delegates only to the existing PR Decision Evidence Reconciler; merged PR #1269 also binds missing collapsed Technical Traceability / machine-readable Production-Baseline boundaries to that trusted-main bootstrap path.
- Markerless/legacy PR-template bootstrap and atomic Production-Baseline repair remain owned by the existing PR Production Baseline Auto-Refresh specialist; this is distinct from v1.8 Decision/Evidence reconciliation.
- Current-State projection baseline drift remains owned by its existing dedicated baseline repair path.
- Deterministic CI expectation drift is repairable only through an individually registered, evidence-bound repairer.
- The 45,000-minute GitHub Actions state is a protected blocker and is never an autonomous repair candidate.
- Unchanged failed Governance is never generically rerun; a rerun requires a proven baseline or deterministic metadata mutation.
- No second branch-sync writer and no second PR-body writer may be introduced.

### Cross-project continuation references

These are coordination references only and do not transfer productive ownership:

- `CAPITAL-AI-FE`: landing/runtime/data/desktop work is merged through PR #1241/#1243/#1245 and the incognito consent interaction fix through #1261; all presentation/runtime status remains FE-owned.
- `CAPITAL-AI-SEO`: `WP-SEO-LAUNCH-01` remains the canonical public Web/Search/Social launch coordination package.
- `CAPITAL-AI-FINTECH`: data, scoring and orchestrator work remains FINTECH-owned under PVC-09..PVC-17.
- `CAPITAL-AI-SEC`, `CAPITAL-AI-COMP`, `CAPITAL-AI-QM`: independent security/compliance/assurance gates remain owner-correct and cannot be absorbed by GOV.

**Program exit:** Current-main/head/readback, dispatch/readback and exact-SHA runtime recovery converge with reproducible evidence; protected blockers remain fail-closed; future SH-02.8..02.11 work advances only when dependency-ready.

## PR #900 / #901 work packages

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

The ordered automated Roadmap lane permits at most one not-yet-integrated automated PR at a time. A successor is created only after predecessor terminal outcome; after merge it starts from a fresh branch on the resulting current `main`, while close-without-merge forces queue recomputation without predecessor payload. Stacked unmerged dependency branches cannot bypass this sequencing rule. Final PR-head/current-main correlation and Human/CODEOWNER merge remain mandatory; auto-merge remains prohibited.

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

## Historical baseline (pre-2026-09-13) — non-active ledger

The former baseline is historical evidence only. A prior non-terminal marker does not imply present activity.

| ID | Historical state |
|---|---|
| GOV-07 User-Lifecycle closeout | `PARTIAL / OWNER RETURNS PENDING` — historical dependency state only |
| GOV-08 Admin Panel process graph | `REFERRED / FOREIGN OPEN` — historical routing state only |

M10 remains `RETIRED / OFF`. Human/CODEOWNER-only merge remains mandatory.

## Terminal chat ledger

`GOV-CHAT-076 / cross-chat current-main consolidation` — `DONE_MAIN / TERMINAL` via PR #868

`GOV-CHAT-074 / Approval Envelope v3.4 rollout` — `DONE_MAIN / TERMINAL` via PR #874

## GOV-CHAT-072

**State:** `DONE_MAIN / TERMINAL`

Human-merged PR #886, merge SHA `0945b7264d6819a57451748888e1fb8c71981762`, materialized exactly one `CTRL-SDLC-PLUGIN-USE-001` under existing Development-Chain authority. No unconditional plugin invocation is authorized.

## Dependencies
OPS version/release, QM gates, SEC/COMP assurance, CLIENT runtime only where productive materialization is needed.

## Project exit gate
One active GOV roadmap; no duplicate authority namespace/writer; current projections agree with effective authority or expose a deterministic blocker; historical task state never self-activates; current Trust Root and registries name no withdrawn external framework.
