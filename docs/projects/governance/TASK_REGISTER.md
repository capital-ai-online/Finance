# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-06, correlated to repository-visible implementation/PR evidence  
**Current correlation baseline:** `main@56f196fc034c5514463546ee975ffb83fd50f44a`  
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
| `GOV-CHAT-012` | Governance/component architecture assessment | GOV | `CONTINUOUS` | refreshed after PR #775 |
| `GOV-CHAT-013` | Compact PR template | GOV | `DONE_MAIN` | template v1.5.0 |
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | exact-snapshot gate active |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | mandatory current control |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | preserved under `CTRL-SDLC-CHAT-HANDOFF-001` |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | provider evidence remains partial |
| `GOV-CHAT-041` | Lifecycle/pricing/entitlement UX | FE | `FOREIGN_OPEN` | broader lifecycle/pricing/entitlement UX not established |
| `GOV-CHAT-042` | Independent User-Lifecycle Security verification | SEC | `DEPENDENCY` | independent ULS re-verification/provider-E2E residuals remain |
| `GOV-CHAT-043` | Purchase/cancellation consumer-compliance | COMP / Human-Legal | `DEPENDENCY` | external Owner/Legal/Evidence gates remain |
| `GOV-CHAT-044` | Final User-Lifecycle governance correlation | GOV | `OPEN_GOV` | execute only after new OPS/FE/SEC/COMP/Legal returns exist |
| `GOV-CHAT-047` | BGB §312j/§312k applicability | COMP / Human-Legal | `DEPENDENCY` | no GOV legal inference |
| `GOV-CHAT-053` | Deep Research Evidence Contract | GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | ADR-0060 authority/lifecycle reconciliation | GOV | `DONE_MAIN` | GOV-03/DR-02B terminal via PR #743 |
| `GOV-CHAT-061` | Recorrelate after GOV-03 | GOV | `DONE_MAIN` | Human-merged PR #751 |
| `GOV-CHAT-062` | COMP-GAP-002 / ADR-0007 | GOV | `DONE_MAIN` | PR #755/#758 |
| `GOV-CHAT-063` | COMP-GAP-003 / ESS-0006 | GOV | `DONE_MAIN` | PR #757 |
| `GOV-CHAT-064` | Post-ESS-0006 project correlation | GOV | `DONE_MAIN` | PR #762 |
| `GOV-CHAT-065` | GOV-05 no-migration decision closeout | GOV | `DONE_MAIN` | PR #767 |
| `GOV-CHAT-066` | Post-GOV-05 owner/evidence re-correlation | GOV | `DONE_MAIN` | PR #769 |
| `GOV-CHAT-067` | COMP-GAP-008 Document Registry treatment decision | GOV/PVC-05 with DOC/PVC-03 lifecycle input | `DONE_MAIN` | Human-merged PR #775 terminalized Governance decision as `NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT`; Documentary/PVC-03 lifecycle return remains separate |
| `GOV-CHAT-068` | Copyable end-of-chat next steps and Owner responses | GOV lifecycle | `DONE_MAIN` | Human-merged PR #772; Control Plane v2.8.0 active |
| `GOV-CHAT-069` | Post-COMP-GAP-008 owner/dependency re-correlation | GOV/PVC-05 | `IMPLEMENTED_BRANCH` | terminalize #775 in project projections; verify whether any new GOV-owned executable slice exists without absorbing foreign work |

## Current foreign-owner return / dependency state

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-OPS` | PR #771 and PR #774 are merged; no new User-Lifecycle/provider closeout return identified | `FOREIGN_PARTIAL`; GOV-07 remains dependency-held |
| `CAPITAL-AI-FE` | PR #736 + #745 + #763 merged; no later broader lifecycle/pricing/entitlement UX return identified | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | PR #766 merged; no later independent ULS verification return identified | `DEPENDENCY` |
| `CAPITAL-AI-COMP` / Human-Legal | PR #761 and #768 merged; no later Owner/Legal closure return identified | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | WP-DOC-02 remains `ACTIVE / CONTINUOUS`; current Documentary Roadmap contains no concrete `COMP-GAP-008` lifecycle return | separate PVC-03 work; no shared Governance registry-write authority |

## Current scoped GOV writer

Current bounded work uses `agent/governance-post-comp-gap-008-recorrelate-20260906` and is limited to:

- `docs/projects/governance/ROADMAP.md`
- `docs/projects/governance/TASK_REGISTER.md`
- `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md`

No new work claim, ADR, ESS, Authority ID or Control ID is created. There were no open PRs at branch start, and no current active writer was identified for these three Governance projection files.

## Post-COMP-GAP-008 correlation

Current main establishes:

- PR #775 is Human-merged at `main@56f196fc034c5514463546ee975ffb83fd50f44a`;
- Governance/PVC-05 made no Document Registry mutation and is terminal for `COMP-GAP-008`;
- Documentary/PVC-03 lifecycle treatment remains foreign-owned and has not returned concrete new evidence in its current project Roadmap;
- Compliance reassessment remains Compliance-owned;
- GOV-07 still waits on OPS/FE/SEC/COMP/Legal evidence;
- GOV-08 remains CLIENT/FE/OPS productive scope.

Therefore no additional productive PVC-05 implementation is currently justified beyond synchronizing the Governance project projections and preserving the dependency gates. Missing foreign returns are not converted into Governance work and are not treated as PASS.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
