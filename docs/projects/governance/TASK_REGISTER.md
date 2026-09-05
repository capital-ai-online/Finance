# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-05, correlated to repository-visible implementation/PR evidence  
**Current correlation baseline:** `main@465a5f77c7b7fe6530648acd24c7033a40d5327e`  
**Role:** chat/backlog traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director` for local rows only  
**Canonical planning surface:** `docs/projects/governance/ROADMAP.md`

## Status vocabulary

- `DONE_MAIN` — implementation/decision is merged and visible on the correlation baseline.
- `OPEN_GOV` — bounded CAPITAL-AI-GOV work remains.
- `FOREIGN_PARTIAL` — target owner implemented part; explicit evidence/verification remains.
- `FOREIGN_OPEN` — target project/Primary Owner still owns execution.
- `DEPENDENCY` — GOV closeout waits on current-main evidence from another owner/verifier.
- `DEFERRED_OWNER_DECISION` — no implementation until Human/Owner or multi-owner architecture decision.
- `SUPERSEDED_CURRENT_MODEL` — historical chat task was replaced/withdrawn by current Authority.
- `CONTINUOUS` — maintenance/assessment obligation.
- `HISTORICAL_REUSE_ONLY` — historical branch/evidence is input, not current merge/authority source.

## Canonical task register

| ID | Task | Owner | Current status | Current-main treatment / exit gate |
|---|---|---|---|---|
| `GOV-CHAT-001` | Establish `docs/projects/` as canonical non-authorizing project surface | CAPITAL-AI-GOV | `DONE_MAIN` | canonical project model present |
| `GOV-CHAT-002` | Introduce `PVC-01..PVC-18` Project Value Chain ownership namespace | CAPITAL-AI-GOV | `DONE_MAIN` | `PROJECT_VALUE_CHAIN.md`; no technical `SC-MD-SPT-0001` rewrite |
| `GOV-CHAT-003` | Consolidate Platform Director `PVC-05` and Governance scope | CAPITAL-AI-GOV | `DONE_MAIN` | current `/AGENTS.md`, ADR-0096 and project mapping preserve boundary |
| `GOV-CHAT-004` | Integrate DevelopmentChain into project architecture | CAPITAL-AI-OPS + GOV policy | `DONE_MAIN` | current model uses PVC/Roadmap/ADR/ESS; productive execution stays OPS-owned |
| `GOV-CHAT-005` | Preserve M0-M10 only as historical DevelopmentChain evidence | CAPITAL-AI-OPS / GOV | `DONE_MAIN` | M10 retired/off in current Trust Root |
| `GOV-CHAT-006` | Assess financial technical `VC-*` namespace migration | GOV + affected owners | `DEFERRED_OWNER_DECISION` | coordinated multi-owner decision required |
| `GOV-CHAT-007` | Preserve stable authority `SC-MD-SPT-0001` during any future label migration | affected technical owners | `DEFERRED_OWNER_DECISION` | invariant retained |
| `GOV-CHAT-008` | Migrate CLIENT organizational label to `PVC-01` where appropriate | CAPITAL-AI-CLIENT | `FOREIGN_OPEN` | CLIENT-owned correlation |
| `GOV-CHAT-009` | Create/migrate `docs/projects/operations/**` | CAPITAL-AI-OPS | `DONE_MAIN` | canonical OPS surface present |
| `GOV-CHAT-010` | Converge project navigation under `docs/projects/<project>/` | respective owners | `DONE_MAIN` | canonical project surfaces materialized |
| `GOV-CHAT-011` | Graph complete process chain/dependencies in Admin Panel | CLIENT / FE / OPS; GOV semantic boundary | `FOREIGN_OPEN` | no current-main React Flow / `ProcessGraphProjection` implementation evidence |
| `GOV-CHAT-012` | Maintain compact Governance/application component assessment | CAPITAL-AI-GOV | `CONTINUOUS` | refreshed by GOV-ROADMAP-RECORRELATE after material authority/project changes |
| `GOV-CHAT-013` | Compact PR template | CAPITAL-AI-GOV | `DONE_MAIN` | current template v1.5.0 |
| `GOV-CHAT-014` | Direct PR creation through Chat/API/MCP/Connector under Human gate | CAPITAL-AI-GOV | `DONE_MAIN` | exact snapshot approval + Human-only merge remain current |
| `GOV-CHAT-015` | Clean old GOV writer claims / stop parallel merge sources | CAPITAL-AI-GOV | `CONTINUOUS` | stale merged writers terminalized; future claims remain coordination metadata only |
| `GOV-CHAT-016` | Close merged PR #629 stale claim | CAPITAL-AI-GOV | `DONE_MAIN` | terminalized historically |
| `GOV-CHAT-017` | Branch names include project-folder slug + compact task + date | GOV policy owner | `DONE_MAIN` | current `/AGENTS.md` convention applies |
| `GOV-CHAT-018` | Project-qualified PR presentation/naming | GOV / affected owner | `CONTINUOUS` | use current repository/project contracts |
| `GOV-CHAT-019` | Minimize unnecessary paid CI | existing Governance/CI authority | `DONE_MAIN` | smallest sufficient checks apply |
| `GOV-CHAT-020` | Sync branch and correlate open PRs/writers before PR | existing Governance authority | `DONE_MAIN` | current protected lifecycle requires it |
| `GOV-CHAT-021` | Maintain before/after or migration evidence for GOV structural changes | CAPITAL-AI-GOV | `CONTINUOUS` | bounded evidence where material |
| `GOV-CHAT-022` | Preserve explicit post-PVC handoff policy overlays | historical coordination | `SUPERSEDED_CURRENT_MODEL` | overlays withdrawn; use PVC → target Roadmap |
| `GOV-CHAT-023` | Do not duplicate ADR/ESS/AUTH/CTRL identities for folder assignment | CAPITAL-AI-GOV | `DONE_MAIN` | stable identities preserved |
| `GOV-CHAT-024` | Retain old GOV branches as historical/reuse inputs only | CAPITAL-AI-GOV | `DONE_MAIN` | no stale-branch direct merge |
| `GOV-CHAT-025` | Maintain one canonical current GOV roadmap/task surface | CAPITAL-AI-GOV | `CONTINUOUS` | `ROADMAP.md` planning source; this register traceability projection |
| `GOV-CHAT-026` | Emit bounded post-PR handoff with max two next steps | existing Governance authority | `DONE_MAIN` | current `/AGENTS.md` rule applies |
| `GOV-CHAT-027` | Reuse native/plugin/OSS before custom implementation | existing Governance + owner | `DONE_MAIN` | current reuse order applies |
| `GOV-CHAT-028` | Resolve canonical folders for SEC/COMP/FE/SEO/SOCIAL | GOV + target owners | `DONE_MAIN` | surfaces exist |
| `GOV-CHAT-029` | Terminalize stale merged Security handoff writer | CAPITAL-AI-SEC | `DONE_MAIN` | released/archived |
| `GOV-CHAT-030` | Materialize Security project navigation | CAPITAL-AI-SEC | `DONE_MAIN` | present |
| `GOV-CHAT-031` | Materialize Compliance project navigation | CAPITAL-AI-COMP | `DONE_MAIN` | present |
| `GOV-CHAT-032` | Materialize Frontend project navigation | CAPITAL-AI-FE | `DONE_MAIN` | present |
| `GOV-CHAT-033` | Materialize SEO project navigation | CAPITAL-AI-SEO | `DONE_MAIN` | present |
| `GOV-CHAT-034` | Materialize Social project navigation | CAPITAL-AI-SOCIAL | `DONE_MAIN` | present |
| `GOV-CHAT-035` | Complete Documentary project surface | CAPITAL-AI-DOC | `DONE_MAIN` | present |
| `GOV-CHAT-036` | Normalize owner-side handoff target folders under old overlay | historical coordination | `SUPERSEDED_CURRENT_MODEL` | current PVC/Roadmap model replaces overlay |
| `GOV-CHAT-037` | Bootstrap User-Lifecycle governance orchestration | CAPITAL-AI-GOV | `DONE_MAIN` | governance orchestration/decisions on main |
| `GOV-CHAT-038` | Resolve Pro annual-price rule | CAPITAL-AI-GOV | `DONE_MAIN` | Owner decision merged |
| `GOV-CHAT-039` | Resolve logout semantics | CAPITAL-AI-GOV | `DONE_MAIN` | both functions, local default |
| `GOV-CHAT-040` | Implement User-Lifecycle harness/provider tests | CAPITAL-AI-OPS | `FOREIGN_PARTIAL` | harness/stable-ID exists; isolated provider evidence open |
| `GOV-CHAT-041` | Unify lifecycle/pricing/entitlement UI projection | CAPITAL-AI-FE | `FOREIGN_OPEN` | PR #736 restores email-login/password-recovery; PR #745 hardens startup/dependency validation; broader lifecycle/pricing/entitlement UX remains owner-scoped |
| `GOV-CHAT-042` | Independently verify User-Lifecycle Security properties | CAPITAL-AI-SEC | `DEPENDENCY` | independent Security evidence remains required |
| `GOV-CHAT-043` | Assess purchase/cancellation consumer-compliance flow | CAPITAL-AI-COMP / Human-Legal | `DEPENDENCY` | PR #735 improves factual scope; Legal/Evidence gates remain open |
| `GOV-CHAT-044` | Lifecycle Harness Governance Integration / final orchestration correlation | CAPITAL-AI-GOV | `OPEN_GOV` | close only after required OPS/FE/SEC/COMP returns |
| `GOV-CHAT-045` | Terminalize stale merged Frontend authority writer | GOV / FE | `DONE_MAIN` | released historically |
| `GOV-CHAT-046` | Terminalize stale merged Compliance project-surface writer | CAPITAL-AI-COMP | `DONE_MAIN` | released historically |
| `GOV-CHAT-047` | Determine BGB §312j/§312k applicability before legal PASS/FAIL gating | COMP / Human-Legal | `DEPENDENCY` | PR #735 preserves bounded Legal Review; GOV cannot infer conclusion |
| `GOV-CHAT-048` | Terminalize stale merged Frontend project-surface writer | CAPITAL-AI-FE | `DONE_MAIN` | released historically |
| `GOV-CHAT-049` | Recorrelate User-Lifecycle owner sequence | CAPITAL-AI-GOV | `DONE_MAIN` | merged reconciliation retained |
| `GOV-CHAT-050` | Record User-Lifecycle Owner decisions and close fulfilled writer | CAPITAL-AI-GOV | `DONE_MAIN` | decision evidence retained |
| `GOV-CHAT-051` | Deactivate/archive Cross-Project-Handoff and post-PVC overlays | CAPITAL-AI-GOV | `DONE_MAIN` | PR #715 withdrew overlay |
| `GOV-CHAT-052` | Simplify DevelopmentChain to PVC → Roadmap → ADR → ESS → code/tests/evidence | CAPITAL-AI-GOV | `DONE_MAIN` | current normative surfaces use simplified model |
| `GOV-CHAT-053` | Add provider-neutral Deep Research Evidence Contract to ESS-0019 | CAPITAL-AI-GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | Reconcile ADR-0060 Supply-Chain authority/lifecycle after implementation | CAPITAL-AI-GOV | `DONE_MAIN` | GOV-03/DR-02B terminal via Human-merged PR #743; ADR-0060 v1.1.0 accepted/active with stable Authority and registry alignment |
| `GOV-CHAT-055` | Add AI Development Chat & Execution Terminology Vocabulary category | Vocabulary implementation; GOV naming boundary | `DONE_MAIN` | category and tests exist |
| `GOV-CHAT-056` | Integrate repository-wide Version Manager / version-impact logic | CAPITAL-AI-OPS `PVC-06`; GOV boundary | `FOREIGN_PARTIAL` | package version sole authority; only non-duplicative OPS logic may remain |
| `GOV-CHAT-057` | Ensure canonical paths/references after overlay removal | CAPITAL-AI-GOV | `CONTINUOUS` | remediate current-authority references within owner scope |
| `GOV-CHAT-058` | Consolidate all GOV chat tasks and refresh active Roadmap | CAPITAL-AI-GOV | `DONE_MAIN` | Human-merged PR #738; post-merge stale consolidation writer terminalized by PR #741 |
| `GOV-CHAT-059` | Terminalize stale merged ADR-0104 cross-project-scope claim | CAPITAL-AI-GOV | `DONE_MAIN` | released/archived after fulfilled PR #699 release condition |
| `GOV-CHAT-060` | Terminalize stale merged post-PVC-overlay claim | CAPITAL-AI-GOV | `DONE_MAIN` | released/archived after fulfilled PR #715 release condition |
| `GOV-CHAT-061` | Recorrelate GOV Roadmap, Task Register and Component Architecture Matrix after GOV-03 merge | CAPITAL-AI-GOV | `OPEN_GOV` | this bounded work item; terminalize GOV-03/DR-02B and stale priority/writer wording against current main |
| `GOV-CHAT-062` | Resolve COMP-GAP-002 / ADR-0007 lifecycle and semantic ambiguity | CAPITAL-AI-GOV | `OPEN_GOV` | next fresh-branch work item after GOV-CHAT-061 reaches terminal state; correlate Authority/registry/PVC/Compliance/runtime facts before deciding clarify/migrate/supersede/archive |
| `GOV-CHAT-063` | Reconcile COMP-GAP-003 / ESS-0006 stale assumptions | CAPITAL-AI-GOV / applicable ESS owner boundary | `OPEN_GOV` | execute only after ADR-0007 treatment is clear; preserve independent Security/Compliance boundaries and avoid a second Requirement Registry/runtime plane |

## Current foreign-owner User-Lifecycle return state

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-OPS` | harness/stable-user-ID evidence exists; isolated provider scenarios/final hosted validation open | `FOREIGN_PARTIAL` |
| `CAPITAL-AI-FE` | PR #736 restores email-login/password-recovery and PR #745 hardens browser startup/dependency validation; broader lifecycle/pricing/entitlement UX completion is not established | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | independent verification remains separate/pending where evidence incomplete | `DEPENDENCY` |
| `CAPITAL-AI-COMP` / Human-Legal | PR #735 completed COMP-01 factual packages; Legal/Evidence gates remain explicit; open PR #746 is not current-main evidence | `DEPENDENCY` |

## Current scoped GOV writer

No historical Governance claim is treated as a current writer for this task. `CAPITAL-AI-GOV-CHAT-TASK-CONSOLIDATION-V3-2026-09-05` is `released / archived / activeWriter:false / exclusive:false` on current `main` after Human-merged PR #741.

`GOV-ROADMAP-RECORRELATE` is executed on `agent/governance-roadmap-recorrelate-20260905` and is intentionally limited to `docs/projects/governance/ROADMAP.md`, `TASK_REGISTER.md` and `COMPONENT_ARCHITECTURE_MATRIX.md`; no new work claim is created solely to satisfy branch/PR mechanics.

## Current open-PR correlation

At this snapshot PR #746 (`CAPITAL-AI-COMP`) is open and changes only `docs/compliance/CAPITAL-AI-COMP/inventory/COMPLIANCE_REQUIREMENTS_INVENTORY.md`. It is read-only correlation input, is not current-main evidence and has no changed-file overlap with GOV-ROADMAP-RECORRELATE. Any semantic change introduced by a future merge must be re-read during final pre-PR correlation.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps. A task is complete only when current-main evidence supports completion.
