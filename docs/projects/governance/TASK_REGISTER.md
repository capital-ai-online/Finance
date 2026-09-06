# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-06, correlated to repository-visible implementation/PR evidence  
**Current correlation baseline:** `main@1b9def6d414ee8838e5403bfc9f705bbbe438d2a`  
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
| `GOV-CHAT-012` | Governance/component architecture assessment | GOV | `CONTINUOUS` | refreshed by current Governance work |
| `GOV-CHAT-013` | Compact PR template | GOV | `DONE_MAIN` | template v1.5.0 |
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | exact-snapshot gate active |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | mandatory current control |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | Trust Root rule active before current extension |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | provider evidence remains partial |
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
| `GOV-CHAT-067` | COMP-GAP-008 Document Registry treatment decision | GOV/PVC-05 with DOC/PVC-03 lifecycle input | `OPEN_GOV` | next bounded candidate after current chat-handoff control work; PR #768 confirms split ownership |
| `GOV-CHAT-068` | Copyable end-of-chat next steps and Owner responses | GOV lifecycle | `OPEN_GOV` | branch extends existing `CTRL-SDLC-CHAT-HANDOFF-001` with `CHAT_RUN_HANDOFF`; exit requires correlated policy/catalog/registry/test, exact PR-create approval, PR and Human merge |

## Current foreign-owner return / dependency state

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-OPS` | User-Lifecycle harness/stable-ID evidence exists with provider evidence still partial; PR #771 updates OPS Security backlog only | `FOREIGN_PARTIAL`; PR #771 has no GOV-file/semantic overlap with GOV-CHAT-068 |
| `CAPITAL-AI-FE` | PR #736 + #745 + #763 merged | architecture/auth progress; broader lifecycle/pricing/entitlement UX not established |
| `CAPITAL-AI-SEC` | PR #766 merged | assessment-authority drift closed; independent ULS re-verification/provider-E2E residuals remain |
| `CAPITAL-AI-COMP` / Human-Legal | PR #761 and #768 merged | bounded assessment/closeout evidence current; external Owner/Legal/Evidence gates remain |

## Current scoped GOV writer

No historical Governance claim is a current writer. The post-GOV-05 re-correlation branch is terminal through PR #769. Final correlation against `main@1b9def6d414ee8838e5403bfc9f705bbbe438d2a` found no open PR and no changed-file/namespace/semantic overlap from PR #771.

Current bounded work uses `agent/governance-copyable-chat-handoff-20260906` and is limited to the existing Governance instruction/control surfaces, their consistency test and current Governance project projections required to keep the work traceable:

- `AGENTS.md`
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/control-catalog.json`
- `docs/governance/authority-registry.json`
- `tests/unit/governanceAuthorityConsistency.test.ts`
- `docs/projects/governance/ROADMAP.md`
- `docs/projects/governance/TASK_REGISTER.md`
- `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md`

No new work claim, ADR, ESS, Authority ID or Control ID is invented solely for this change.

## Copyable chat-handoff correlation

The Owner request is implemented by extending the existing control rather than introducing a second chat policy hierarchy:

- `CTRL-SDLC-CHAT-HANDOFF-001` now has `CHAT_RUN_HANDOFF` and `POST_PR_HANDOFF` triggers;
- every chat-governed repository execution pass must end with a fenced `text` `NÄCHSTE SCHRITTE` block containing at most two immediately actionable steps and exit gates;
- exact Human/Owner approvals, confirmations or other required response strings are emitted in a separate fenced `text` block;
- the existing PR-creation exact-snapshot approval remains unchanged in authority and becomes consistent with the general copyability requirement;
- recommendations remain non-authorizing and do not expand Human merge, deployment, foreign-owner or protected-mutation authority.

## COMP-GAP-008 ownership correlation

Current main evidence establishes a bounded split:

- ADR-0096 identifies `docs/governance/document-registry.json` as a canonical Governance registry;
- Human-merged PR #768 explicitly routes shared Governance-registry treatment to `CAPITAL-AI-GOV / PVC-05`;
- the same PR routes Documentary lifecycle treatment to `CAPITAL-AI-DOC / PVC-03`;
- ESS-0012 Documentation Governance remains documentation-only/read-only and cannot autonomously modify Registry or documentation;
- Compliance remains assessor and must not mutate the shared Governance Registry in its own branch.

Therefore `COMP-GAP-008` remains a valid next Governance correlation candidate after the current chat-handoff control change reaches main. Any later implementation must be freshly correlated and bounded to the canonical Governance registry decision, without mutating foreign Compliance/Documentary source documents or runtime merely to normalize registry coverage.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
