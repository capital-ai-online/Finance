# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-07, correlated to repository-visible implementation/PR evidence  
**Current correlation baseline:** `main@4ac4d7574cdf52e9158f5aee2c2563c0f8c8a58a`  
**Role:** chat/backlog traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director` for local rows only  
**Canonical planning surface:** `docs/projects/governance/ROADMAP.md`

## Status vocabulary

- `DONE_MAIN` — merged/current-main evidence supports completion.
- `OPEN_GOV` — bounded CAPITAL-AI-GOV work remains.
- `FOREIGN_PARTIAL` — foreign owner implemented part; evidence/verification remains.
- `FOREIGN_OPEN` — foreign Primary Owner still owns execution.
- `DEPENDENCY` — GOV closeout waits on another owner/verifier/Legal.
- `CONTINUOUS` — maintenance/assessment obligation.
- `HISTORICAL` — terminal coordination state retained only for traceability.

## Canonical task register

| ID | Task | Owner | Status | Current-main treatment / exit gate |
|---|---|---|---|---|
| `GOV-CHAT-001` | Canonical `docs/projects/` surface | GOV | `DONE_MAIN` | project model present |
| `GOV-CHAT-002` | `PVC-01..PVC-18` ownership namespace | GOV | `DONE_MAIN` | canonical Project Value Chain present |
| `GOV-CHAT-003` | Platform Director `PVC-05` / Governance scope | GOV | `DONE_MAIN` | boundary preserved |
| `GOV-CHAT-004` | DevelopmentChain integration | OPS + GOV policy | `DONE_MAIN` | PVC → Roadmap → ADR → ESS model active |
| `GOV-CHAT-005` | M0-M10 historical treatment | OPS / GOV | `DONE_MAIN` | M10 retired/off; no current implementation gap |
| `GOV-CHAT-006` | Financial technical `VC-*` migration assessment | GOV + affected owners | `DONE_MAIN` | Owner confirmed no migration; PR #767 terminalized GOV-05 |
| `GOV-CHAT-007` | Preserve `SC-MD-SPT-0001` during any future migration | affected owners | `CONTINUOUS` | existing technical identities retained |
| `GOV-CHAT-008` | CLIENT organizational `PVC-01` migration | CLIENT | `FOREIGN_OPEN` | CLIENT-owned |
| `GOV-CHAT-011` | Admin Panel process/dependency graph | CLIENT / FE / OPS | `FOREIGN_OPEN` | GOV-08 remains referred |
| `GOV-CHAT-012` | Governance/component architecture assessment | GOV | `CONTINUOUS` | maintain current-state projection |
| `GOV-CHAT-013` | Compact PR template | GOV | `DONE_MAIN` | template v1.5.0 |
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | exact-main/head approval gate active |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | mandatory current control |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | `CTRL-SDLC-CHAT-HANDOFF-001` active |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | PR #794 merged the refreshed OPS owner return as `EVIDENCE_READY`; provider E2E and independent Security verification remain open |
| `GOV-CHAT-041` | Lifecycle/pricing/entitlement UX | FE | `FOREIGN_OPEN` | broader lifecycle/pricing/entitlement UX not established |
| `GOV-CHAT-042` | Independent User-Lifecycle Security verification | SEC | `DEPENDENCY` | independent ULS re-verification/provider-E2E residuals remain |
| `GOV-CHAT-043` | Purchase/cancellation consumer-compliance | COMP / Human-Legal | `DEPENDENCY` | external Owner/Legal/Evidence gates remain |
| `GOV-CHAT-044` | Final User-Lifecycle governance correlation | GOV | `OPEN_GOV` | OPS return from PR #794 is consumed; final closeout remains dependency-held on remaining FE/SEC/COMP/Legal and applicable provider-assurance evidence |
| `GOV-CHAT-047` | BGB §312j/§312k applicability | COMP / Human-Legal | `DEPENDENCY` | no GOV legal inference |
| `GOV-CHAT-053` | Deep Research Evidence Contract | GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | ADR-0060 authority/lifecycle reconciliation | GOV | `DONE_MAIN` | GOV-03/DR-02B terminal via PR #743 |
| `GOV-CHAT-061` | Recorrelate after GOV-03 | GOV | `DONE_MAIN` | PR #751 |
| `GOV-CHAT-062` | COMP-GAP-002 / ADR-0007 | GOV | `DONE_MAIN` | PR #755/#758 |
| `GOV-CHAT-063` | COMP-GAP-003 / ESS-0006 | GOV | `DONE_MAIN` | PR #757 |
| `GOV-CHAT-064` | Post-ESS-0006 project correlation | GOV | `DONE_MAIN` | PR #762 |
| `GOV-CHAT-065` | GOV-05 no-migration decision closeout | GOV | `DONE_MAIN` | PR #767 |
| `GOV-CHAT-066` | Post-GOV-05 owner/evidence re-correlation | GOV | `DONE_MAIN` | PR #769 |
| `GOV-CHAT-067` | COMP-GAP-008 Document Registry treatment decision | GOV/PVC-05 with DOC/PVC-03 lifecycle input | `DONE_MAIN` | PR #775: no registry change required under current contract |
| `GOV-CHAT-068` | Copyable end-of-chat next steps and Owner responses | GOV lifecycle | `DONE_MAIN` | PR #772; Control Plane v2.8.0 active |
| `GOV-CHAT-069` | Post-COMP-GAP-008 owner/dependency re-correlation | GOV/PVC-05 | `DONE_MAIN` | PR #780 synchronized post-#775 projections |
| `GOV-CHAT-070` | GOV-07 validated-baseline evolution policy | GOV/PVC-05 policy; productive variants stay with resolved Primary Owner | `DONE_MAIN` | Human-merged PR #790; `CTRL-AIMS-PDCA-001` baseline-not-ceiling semantics active; broader GOV-07 closeout remains separately dependency-held |

## Current foreign-owner return / dependency state

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides the current GOV-07 Newsfeed Entitlement Return | current evidence may be consumed; no DATA ownership transfer |
| `CAPITAL-AI-OPS` | Human-merged PR #794 provides the refreshed GOV-07 User-Lifecycle owner return as `EVIDENCE_READY`; provider E2E and independent Security verification remain open | `FOREIGN_PARTIAL` |
| `CAPITAL-AI-FE` | prior auth/router progress exists; no broader lifecycle/pricing/entitlement UX closeout established here | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | PR #787 is `CLOSED / NOT MERGED` | independent verification remains a dependency |
| `CAPITAL-AI-COMP` / Human-Legal | prior bounded assessment evidence exists; Legal/Owner gates remain | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | D8 planning is merged via PR #792 but Documentary/PVC-03 remains separately owned | no foreign lifecycle implementation is absorbed by GOV |

## Current writer / correlation state

At `main@4ac4d7574cdf52e9158f5aee2c2563c0f8c8a58a`:

- PR #794 is Human-merged and no longer an open writer; its OPS-owned evidence is current-main input only;
- no foreign-owner open Pull Request with changed-file, namespace or Authority overlap was identified for the bounded Governance projection;
- no competing Governance writer was identified for `docs/projects/governance/ROADMAP.md`, `TASK_REGISTER.md`, `docs/architecture/ROADMAP.md` or the bounded DevelopmentChain registry projection;
- `agent/governance-gov07-evolution-policy-20260906` is terminal historical coordination state after Human Merge of PR #790;
- historical/released claims are non-authorizing and do not reserve current writer authority.

## GOV-07 Evolution Policy current-main correlation

Human-merged PR #790 establishes on current main:

- validation is an accepted baseline rather than a freeze on demonstrably superior development;
- claimed superiority must be evidenced against current main and applicable Roadmap/ADR/ESS/contracts;
- superior development proceeds within the resolved Primary Owner scope and requires revalidation before replacing/promoting the baseline;
- equivalent variants prefer the lowest-risk and lowest-complexity option;
- inferior or unproven variants retain the current validated baseline;
- Security, Compliance, Governance, contract compatibility and required functionality remain non-regression boundaries;
- the policy does not bypass Owner, evidence, approval, PR, merge or production gates.

`GOV-CHAT-070` is therefore terminal on main. This does **not** close `GOV-CHAT-044` or the broader GOV-07 User-Lifecycle cycle, which still waits on foreign-owner/assurance returns.

## Deep Research current-main correlation

`GOV-CHAT-054 / DR-02B` is terminal through Human-merged PR #743. ADR-0060 v1.1.0 is accepted and registered. Productive DR-03 provider-adapter work remains `CAPITAL-AI-OPS` scope and is not a Governance implementation backlog item.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
