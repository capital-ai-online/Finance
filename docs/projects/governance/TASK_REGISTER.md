# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-06, correlated to repository-visible implementation/PR evidence  
**Current correlation baseline:** `main@169cf96ac4d90ffaacab22d88541b837fd66fe8d`  
**Role:** chat/backlog traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director` for local rows only  
**Canonical planning surface:** `docs/projects/governance/ROADMAP.md`

## Status vocabulary

- `DONE_MAIN` — merged/current-main evidence supports completion.
- `IMPLEMENTED_BRANCH` — bounded implementation exists on the current scoped branch; PR/Human merge pending.
- `OPEN_GOV` — bounded CAPITAL-AI-GOV work remains.
- `FOREIGN_PARTIAL` — foreign owner implemented part; evidence/verification remains.
- `FOREIGN_OPEN` — foreign Primary Owner still owns execution.
- `DEPENDENCY` — GOV closeout waits on another owner/verifier/Legal.
- `CONTINUOUS` — maintenance/assessment obligation.

## Canonical task register

| ID | Task | Owner | Status | Current-main treatment / exit gate |
|---|---|---|---|---|
| `GOV-CHAT-001` | Canonical `docs/projects/` surface | GOV | `DONE_MAIN` | project model present |
| `GOV-CHAT-002` | `PVC-01..PVC-18` ownership namespace | GOV | `DONE_MAIN` | canonical Project Value Chain present |
| `GOV-CHAT-003` | Platform Director `PVC-05` / Governance scope | GOV | `DONE_MAIN` | boundary preserved |
| `GOV-CHAT-004` | DevelopmentChain integration | OPS + GOV policy | `DONE_MAIN` | PVC → Roadmap → ADR → ESS model active |
| `GOV-CHAT-005` | M0-M10 historical treatment | OPS / GOV | `DONE_MAIN` | M10 retired/off |
| `GOV-CHAT-006` | Financial technical `VC-*` migration assessment | GOV + affected owners | `DONE_MAIN` | Owner confirmed no migration; Human-merged PR #767 terminalized GOV-05 |
| `GOV-CHAT-007` | Preserve `SC-MD-SPT-0001` during any future migration | affected owners | `CONTINUOUS` | existing technical identities retained |
| `GOV-CHAT-008` | CLIENT organizational `PVC-01` migration | CLIENT | `FOREIGN_OPEN` | CLIENT-owned |
| `GOV-CHAT-011` | Admin Panel process/dependency graph | CLIENT / FE / OPS | `FOREIGN_OPEN` | GOV-08 remains referred |
| `GOV-CHAT-012` | Governance/component architecture assessment | GOV | `CONTINUOUS` | refreshed by current COMP-GAP-008 decision |
| `GOV-CHAT-013` | Compact PR template | GOV | `DONE_MAIN` | template v1.5.0 |
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | exact-snapshot gate active |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | mandatory current control |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | preserved under `CTRL-SDLC-CHAT-HANDOFF-001` |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | provider evidence remains partial; PR #771 is OPS-only backlog correlation |
| `GOV-CHAT-041` | Lifecycle/pricing/entitlement UX | FE | `FOREIGN_OPEN` | PR #736/#745/#763 do not close broader lifecycle/pricing/entitlement UX |
| `GOV-CHAT-042` | Independent User-Lifecycle Security verification | SEC | `DEPENDENCY` | PR #766 closes assessment-authority drift; independent ULS re-verification/provider-E2E residuals remain |
| `GOV-CHAT-043` | Purchase/cancellation consumer-compliance | COMP / Human-Legal | `DEPENDENCY` | PR #761/#768 provide current bounded assessment/closeout evidence; external Owner/Legal/Evidence gates remain |
| `GOV-CHAT-044` | Final User-Lifecycle governance correlation | GOV | `OPEN_GOV` | wait for remaining OPS/FE/SEC/COMP/Legal returns |
| `GOV-CHAT-047` | BGB §312j/§312k applicability | COMP / Human-Legal | `DEPENDENCY` | no GOV legal inference |
| `GOV-CHAT-053` | Deep Research Evidence Contract | GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | ADR-0060 authority/lifecycle reconciliation | GOV | `DONE_MAIN` | GOV-03/DR-02B terminal via PR #743 |
| `GOV-CHAT-061` | Recorrelate after GOV-03 | GOV | `DONE_MAIN` | Human-merged PR #751 |
| `GOV-CHAT-062` | COMP-GAP-002 / ADR-0007 | GOV | `DONE_MAIN` | PR #755/#758 |
| `GOV-CHAT-063` | COMP-GAP-003 / ESS-0006 | GOV | `DONE_MAIN` | PR #757 |
| `GOV-CHAT-064` | Post-ESS-0006 project correlation | GOV | `DONE_MAIN` | PR #762 |
| `GOV-CHAT-065` | GOV-05 no-migration decision closeout | GOV | `DONE_MAIN` | PR #767 |
| `GOV-CHAT-066` | Post-GOV-05 owner/evidence re-correlation | GOV | `DONE_MAIN` | Human-merged PR #769 |
| `GOV-CHAT-067` | COMP-GAP-008 Document Registry treatment decision | GOV/PVC-05 with DOC/PVC-03 lifecycle input | `IMPLEMENTED_BRANCH` | current Governance decision: no shared-registry mutation required under current contract; exact-head PR-create approval + hosted checks + Human merge pending; Documentary/PVC-03 lifecycle return remains separate |
| `GOV-CHAT-068` | Copyable end-of-chat next steps and Owner responses | GOV lifecycle | `DONE_MAIN` | Human-merged PR #772 extends existing `CTRL-SDLC-CHAT-HANDOFF-001` with `CHAT_RUN_HANDOFF` while preserving `POST_PR_HANDOFF`; Control Plane v2.8.0 active |

## Current foreign-owner return / dependency state

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-OPS` | PR #771 Human-merged OPS Security-backlog re-correlation; PR #774 Human-merged IONOS/Render `www` CNAME desired-state work | `FOREIGN_PARTIAL`; both are outside this Governance decision; PR #774 changes only DNS config/runbook/systemadmin test |
| `CAPITAL-AI-FE` | PR #736 + #745 + #763 merged | architecture/auth progress; broader lifecycle/pricing/entitlement UX not established |
| `CAPITAL-AI-SEC` | PR #766 merged | assessment-authority drift closed; independent ULS re-verification/provider-E2E residuals remain |
| `CAPITAL-AI-COMP` / Human-Legal | PR #761 and #768 merged | bounded assessment/closeout evidence current; external Owner/Legal/Evidence gates remain |
| `CAPITAL-AI-DOC` | WP-DOC-02 lifecycle/Documentation Governance remains active/continuous | separate PVC-03 lifecycle return only; no shared Governance registry-write authority |

## Current scoped GOV writer

Current bounded work uses `agent/governance-comp-gap-008-decision-v4-20260906`, freshly based on `main@169cf96ac4d90ffaacab22d88541b837fd66fe8d`, and is limited to:

- `docs/projects/governance/ROADMAP.md`
- `docs/projects/governance/TASK_REGISTER.md`
- `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md`

PR #772 is Human-merged and its copyable chat-handoff semantics are preserved from current main. PR #773 is `CLOSED / NOT MERGED` after a concurrent-main race and is non-authorizing history only. The intermediate v3 branch was based before PR #774 and is not the current PR candidate. PR #774 is disjoint OPS/DNS work. There are no open PRs at this correlation point.

`docs/governance/document-registry.json` is deliberately **not** changed because the current contract does not require exhaustive registration of all `DOC-*` artifacts.

No new work claim, ADR, ESS, Authority ID or Control ID is invented solely for this change.

## COMP-GAP-008 ownership and decision correlation

Current main evidence establishes a bounded split:

- ADR-0096 identifies `docs/governance/document-registry.json` as a canonical Governance registry;
- Human-merged PR #768 explicitly routes shared Governance-registry treatment to `CAPITAL-AI-GOV / PVC-05`;
- the same PR routes Documentary lifecycle treatment to `CAPITAL-AI-DOC / PVC-03`;
- ESS-0012 Documentation Governance remains documentation-only/read-only and cannot autonomously modify Registry or documentation;
- Compliance remains assessor and must not mutate the shared Governance Registry in its own branch;
- Human-merged PR #772 changes the chat-handoff/control-plane presentation contract but does not create an exhaustive Document Registry requirement;
- Human-merged PR #774 changes only OPS/DNS administration surfaces and has no file, semantic, namespace, authority or owner conflict with this decision;
- PR #773 is closed and does not contribute authority, merge state or an active writer.

The current PVC-05 decision is **NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT**:

1. the Compliance V2.1 source documents already carry stable `DOC-COMP-*` identities, explicit non-authorizing roles and canonical `docs/compliance/**` paths;
2. ADR-0096 defines the Registry's canonical role but does not mandate exhaustive registration of every `DOC-*` file;
3. the Document Lifecycle Policy requires registry updates for path moves and stable metadata for material governance/decision documents, not blanket registration of all non-normative Compliance artifacts;
4. the current Governance validator contract has no generic all-`DOC-*` completeness requirement;
5. current `document-registry.json` is demonstrably selective for Compliance documents.

Therefore adding the eight candidates would be policy-unjustified registry churn rather than closure of a present invariant. The branch records the decision only in Governance project projections. It does not mutate Compliance/Documentary source files, Registry, Runtime, ADR, ESS, Authority Registry or Control Catalog.

After Human merge of this bounded decision, the `CAPITAL-AI-GOV / PVC-05` portion of `COMP-GAP-008` is complete. The overall Compliance finding can remain `PARTIALLY_COMPLIANT` until the independent Documentary/PVC-03 lifecycle return is available and Compliance reassesses it.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
