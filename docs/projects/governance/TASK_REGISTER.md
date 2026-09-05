# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-05, correlated to repository-visible implementation/PR evidence  
**Current correlation baseline:** `main@d69e75b6853f3b56ca313fe3c3256e56bc21c220`  
**Role:** chat/backlog traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director` for local rows only  
**Canonical planning surface:** `docs/projects/governance/ROADMAP.md`

## Status vocabulary

- `DONE_MAIN` — merged/current-main evidence supports completion.
- `OPEN_GOV` — bounded CAPITAL-AI-GOV work remains.
- `FOREIGN_PARTIAL` — foreign owner implemented part; evidence/verification remains.
- `FOREIGN_OPEN` — foreign Primary Owner still owns execution.
- `DEPENDENCY` — GOV closeout waits on another owner/verifier/Legal.
- `DEFERRED_OWNER_DECISION` — no implementation until Human/Owner or multi-owner decision.
- `SUPERSEDED_CURRENT_MODEL` — historical task replaced/withdrawn by current Authority.
- `CONTINUOUS` — maintenance/assessment obligation.

## Canonical task register

| ID | Task | Owner | Status | Current-main treatment / exit gate |
|---|---|---|---|---|
| `GOV-CHAT-001` | Canonical `docs/projects/` surface | GOV | `DONE_MAIN` | project model present |
| `GOV-CHAT-002` | `PVC-01..PVC-18` ownership namespace | GOV | `DONE_MAIN` | canonical Project Value Chain present |
| `GOV-CHAT-003` | Platform Director `PVC-05` / Governance scope | GOV | `DONE_MAIN` | boundary preserved |
| `GOV-CHAT-004` | DevelopmentChain integration | OPS + GOV policy | `DONE_MAIN` | PVC → Roadmap → ADR → ESS model active |
| `GOV-CHAT-005` | M0-M10 historical treatment | OPS / GOV | `DONE_MAIN` | M10 retired/off |
| `GOV-CHAT-006` | Financial technical `VC-*` migration assessment | GOV + affected owners | `DEFERRED_OWNER_DECISION` | coordinated architecture decision required |
| `GOV-CHAT-007` | Preserve `SC-MD-SPT-0001` during any future migration | affected owners | `DEFERRED_OWNER_DECISION` | invariant retained |
| `GOV-CHAT-008` | CLIENT organizational `PVC-01` migration | CLIENT | `FOREIGN_OPEN` | CLIENT-owned |
| `GOV-CHAT-009` | Operations project surface | OPS | `DONE_MAIN` | present |
| `GOV-CHAT-010` | Project navigation convergence | respective owners | `DONE_MAIN` | canonical surfaces present |
| `GOV-CHAT-011` | Admin Panel process/dependency graph | CLIENT / FE / OPS | `FOREIGN_OPEN` | no current-main `ProcessGraphProjection` evidence |
| `GOV-CHAT-012` | Governance/component architecture assessment | GOV | `CONTINUOUS` | refreshed by GOV-ROADMAP-RECORRELATE |
| `GOV-CHAT-013` | Compact PR template | GOV | `DONE_MAIN` | template v1.5.0 |
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | exact-snapshot gate active |
| `GOV-CHAT-015` | GOV writer hygiene | GOV | `CONTINUOUS` | stale writers terminalized; claims non-authorizing |
| `GOV-CHAT-016` | PR #629 stale claim | GOV | `DONE_MAIN` | terminalized historically |
| `GOV-CHAT-017` | Branch naming convention | GOV | `DONE_MAIN` | current Trust Root applies |
| `GOV-CHAT-018` | Project-qualified PR naming | GOV / owner | `CONTINUOUS` | derive from current contracts |
| `GOV-CHAT-019` | Minimize unnecessary paid CI | GOV/CI | `DONE_MAIN` | smallest sufficient checks |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | mandatory current control |
| `GOV-CHAT-021` | Before/after evidence for structural changes | GOV | `CONTINUOUS` | bounded evidence where material |
| `GOV-CHAT-022` | Preserve post-PVC overlays | historical | `SUPERSEDED_CURRENT_MODEL` | overlays withdrawn |
| `GOV-CHAT-023` | No duplicate ADR/ESS/AUTH/CTRL for folder mapping | GOV | `DONE_MAIN` | stable identities preserved |
| `GOV-CHAT-024` | Historical GOV branches reuse-only | GOV | `DONE_MAIN` | no stale-branch direct merge |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | Trust Root rule active |
| `GOV-CHAT-027` | Reuse before custom implementation | GOV + owner | `DONE_MAIN` | Trust Root reuse order active |
| `GOV-CHAT-028` | Cross-cutting project folders | GOV + owners | `DONE_MAIN` | SEC/COMP/FE/SEO/SOCIAL surfaces present |
| `GOV-CHAT-029` | Security handoff stale writer | SEC | `DONE_MAIN` | released/archived |
| `GOV-CHAT-030` | Security project navigation | SEC | `DONE_MAIN` | present |
| `GOV-CHAT-031` | Compliance project navigation | COMP | `DONE_MAIN` | present |
| `GOV-CHAT-032` | Frontend project navigation | FE | `DONE_MAIN` | present |
| `GOV-CHAT-033` | SEO project navigation | SEO | `DONE_MAIN` | present |
| `GOV-CHAT-034` | Social project navigation | SOCIAL | `DONE_MAIN` | present |
| `GOV-CHAT-035` | Documentary project surface | DOC | `DONE_MAIN` | present |
| `GOV-CHAT-036` | Old overlay handoff normalization | historical | `SUPERSEDED_CURRENT_MODEL` | replaced by PVC/Roadmap model |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-038` | Pro annual-price rule | GOV | `DONE_MAIN` | Owner decision merged |
| `GOV-CHAT-039` | Logout semantics | GOV | `DONE_MAIN` | merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | provider evidence remains partial |
| `GOV-CHAT-041` | Lifecycle/pricing/entitlement UX | FE | `FOREIGN_OPEN` | PR #736 auth recovery + PR #745 startup hardening do not close broader UX |
| `GOV-CHAT-042` | Independent User-Lifecycle Security verification | SEC | `DEPENDENCY` | PR #749 confirms integration evidence on main, but `SEC-VERIFY-ULS-001` subscription-identity re-verification plus provider/E2E residuals remain open |
| `GOV-CHAT-043` | Purchase/cancellation consumer-compliance | COMP / Human-Legal | `DEPENDENCY` | Legal/Evidence gates remain |
| `GOV-CHAT-044` | Final User-Lifecycle governance correlation | GOV | `OPEN_GOV` | wait for remaining OPS/FE/SEC/COMP returns; do not close on implementation evidence alone |
| `GOV-CHAT-045` | Frontend authority stale writer | GOV / FE | `DONE_MAIN` | released historically |
| `GOV-CHAT-046` | Compliance project-surface stale writer | COMP | `DONE_MAIN` | released historically |
| `GOV-CHAT-047` | BGB §312j/§312k applicability | COMP / Human-Legal | `DEPENDENCY` | no GOV legal inference |
| `GOV-CHAT-048` | Frontend project-surface stale writer | FE | `DONE_MAIN` | released historically |
| `GOV-CHAT-049` | User-Lifecycle owner sequence | GOV | `DONE_MAIN` | merged reconciliation retained |
| `GOV-CHAT-050` | User-Lifecycle Owner decisions | GOV | `DONE_MAIN` | evidence retained |
| `GOV-CHAT-051` | Withdraw Cross-Project-Handoff/post-PVC overlays | GOV | `DONE_MAIN` | PR #715 |
| `GOV-CHAT-052` | Simplify DevelopmentChain | GOV | `DONE_MAIN` | current normative model |
| `GOV-CHAT-053` | Deep Research Evidence Contract | GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | ADR-0060 authority/lifecycle reconciliation | GOV | `DONE_MAIN` | **GOV-03/DR-02B terminal via PR #743** |
| `GOV-CHAT-055` | AI Development terminology | GOV/Vocabulary | `DONE_MAIN` | implementation/tests exist |
| `GOV-CHAT-056` | Version Manager/version-impact logic | OPS/PVC-06 | `FOREIGN_PARTIAL` | package version sole authority |
| `GOV-CHAT-057` | Canonical references after overlay removal | GOV | `CONTINUOUS` | owner-scoped remediation only |
| `GOV-CHAT-058` | GOV chat/roadmap consolidation | GOV | `DONE_MAIN` | PR #738 merged; writer terminalized by PR #741 |
| `GOV-CHAT-059` | ADR-0104 cross-project claim terminalization | GOV | `DONE_MAIN` | released/archived |
| `GOV-CHAT-060` | post-PVC claim terminalization | GOV | `DONE_MAIN` | released/archived |
| `GOV-CHAT-061` | Recorrelate Roadmap + Task Register + Component Matrix after GOV-03 | GOV | `OPEN_GOV` | current work item; exit after exact-snapshot PR gate, hosted checks and Human merge |
| `GOV-CHAT-062` | COMP-GAP-002 / ADR-0007 lifecycle-semantic decision | GOV | `OPEN_GOV` | **next fresh-branch task only after GOV-CHAT-061 terminal**; correlate Authority/registry/PVC/Compliance/runtime before decision |
| `GOV-CHAT-063` | COMP-GAP-003 / ESS-0006 stale assumptions | GOV / ESS boundary | `OPEN_GOV` | after ADR-0007; preserve SEC/COMP independence and no parallel Requirement Registry |

## Current foreign-owner return / dependency state

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-OPS` | User-Lifecycle harness/stable-ID evidence exists with provider evidence still partial; Human-merged PR #747 additionally materializes Deep Research DR-03 in the OPS roadmap but keeps it behind the higher-priority OPS security/data-integrity gate | `FOREIGN_PARTIAL` / foreign roadmap input |
| `CAPITAL-AI-FE` | PR #736 auth recovery + PR #745 startup hardening merged; broader lifecycle/pricing/entitlement UX not established | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | Human-merged PR #749 makes current Security return explicit: User-Lifecycle integration is implemented on main, but independent subscription-identity re-verification and provider/E2E residuals remain open | `DEPENDENCY` |
| `CAPITAL-AI-COMP` / Human-Legal | COMP-01 evidence and COMP-02 requirements work through Human-merged PR #746 are current-main inputs; Legal/Evidence gates remain | `DEPENDENCY` |

## Current scoped GOV writer

No historical Governance claim is a current writer. `CAPITAL-AI-GOV-CHAT-TASK-CONSOLIDATION-V3-2026-09-05` is `released / archived / activeWriter:false / exclusive:false` after Human-merged PR #741.

`GOV-ROADMAP-RECORRELATE` is executed on `agent/governance-roadmap-recorrelate-20260905` and is limited to:

- `docs/projects/governance/ROADMAP.md`
- `docs/projects/governance/TASK_REGISTER.md`
- `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md`

No new work claim is invented solely for branch/PR mechanics.

## Current-main / PR correlation

Human-merged PR #746 advanced Compliance requirements evidence, Human-merged OPS PR #747 advanced OPS planning/DR-03 evidence, and Human-merged Security PR #749 advanced Security verification planning. Current `main` is `d69e75b6853f3b56ca313fe3c3256e56bc21c220`. None of those merges writes the three Governance project files. Their semantic returns are reflected here without absorbing foreign execution or independent verification authority.

The earlier attempted Governance PR #748 was closed unmerged after `main` changed between the final pre-create read and the GitHub create mutation, invalidating the exact-SHA Human approval. It is historical execution evidence only and does not satisfy the PR gate for the current branch state.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
