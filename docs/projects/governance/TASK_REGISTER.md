# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-06, correlated to repository-visible implementation/PR evidence  
**Current correlation baseline:** `main@a088b4d368b6d48b1d248f132c674281cde68b8d`  
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
| `GOV-CHAT-069` | Post-COMP-GAP-008 owner/dependency re-correlation | GOV/PVC-05 | `DONE_MAIN` | Human-merged PR #780 synchronized the post-#775 Governance projections; later current-main work supersedes the branch-state label |
| `GOV-CHAT-070` | GOV-07 validated-baseline evolution policy | GOV/PVC-05 policy; productive variants stay with resolved Primary Owner | `IMPLEMENTED_BRANCH` | reuse `CTRL-AIMS-PDCA-001`: validated baseline is not a ceiling; demonstrably better in-scope variants continue and revalidate, equivalent variants prefer lower risk/complexity, inferior/unproven variants keep the validated baseline; exact-head validation + Human PR-create + Human/CODEOWNER merge remain pending |

## Current foreign-owner return / dependency state

This table is a bounded current correlation for the GOV-07 evolution-policy work item. It does not promote closed/unmerged or stale evidence to current authority.

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides the current GOV-07 Newsfeed Entitlement Return | current evidence may be consumed by GOV-07 correlation; it does not transfer DATA ownership |
| `CAPITAL-AI-OPS` | previously merged User-Lifecycle/operations returns remain partial for broader closeout | `FOREIGN_PARTIAL`; better future OPS variants remain OPS-owned and must return evidence |
| `CAPITAL-AI-FE` | prior auth/router progress exists; no current broader lifecycle/pricing/entitlement UX closeout is established here | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | PR #787 is `CLOSED / NOT MERGED` | no new current Security return inferred; independent verification remains a dependency |
| `CAPITAL-AI-COMP` / Human-Legal | prior bounded assessment/closeout evidence exists; Legal/Owner gates are not altered by this policy | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned | no foreign lifecycle implementation is absorbed by GOV |

## Current scoped GOV writer

Current bounded work uses `agent/governance-gov07-evolution-policy-20260906` and is limited to:

- `docs/governance/control-catalog.json`
- `docs/projects/governance/ROADMAP.md`
- `docs/projects/governance/TASK_REGISTER.md`

No new work claim, ADR, ESS, Authority ID or Control ID is created. The existing stable `CTRL-AIMS-PDCA-001` is amended in place. At branch start there were no open Pull Requests against `main`, and no competing current Governance writer was identified for this three-file scope.

## GOV-07 evolution-policy correlation

Current bounded baseline `main@a088b4d368b6d48b1d248f132c674281cde68b8d` establishes:

- Human-merged PR #786 is current DATA evidence for GOV-07;
- closed/unmerged PR #787 is non-authorizing and cannot be counted as a current Security return;
- validation is treated as an accepted baseline rather than a freeze on superior development;
- a purported improvement must be evidenced against current main and applicable Roadmap/ADR/ESS/contracts before being classified as superior;
- superior development proceeds inside the resolved Primary Owner scope and requires revalidation before replacing/promoting the baseline;
- equivalent variants prefer the lowest-risk and lowest-complexity option;
- inferior or unproven variants retain the current validated baseline;
- Security, Compliance, Governance, contract compatibility and required functionality remain non-regression boundaries;
- the policy does not bypass Owner, evidence, approval, PR, merge or production gates.

This is a Governance policy/traceability change only. It does not implement a foreign productive User-Lifecycle variant and does not convert missing evidence into PASS.

## Prior post-COMP-GAP-008 correlation snapshot

The previous snapshot established that PR #775 terminalized Governance/PVC-05 for `COMP-GAP-008`, Documentary/PVC-03 lifecycle treatment remained foreign-owned, Compliance reassessment remained Compliance-owned, GOV-07 still waited on owner/assurance evidence, and GOV-08 remained CLIENT/FE/OPS productive scope. That snapshot is retained for traceability but its embedded earlier main SHA is not the current baseline above.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
