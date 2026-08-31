# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-08-31  
**Baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Role:** execution backlog / traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV` for local rows only

## Status vocabulary

- `DONE_MAIN` — implementation is already merged on current main.
- `IN_CANDIDATE` — local GOV work is part of the current consolidation candidate.
- `OPEN_GOV` — local GOV follow-up remains after this candidate.
- `REFERRED_NOT_EXECUTED` — foreign Primary Owner must execute.
- `DEPENDENCY` — cross-cutting participant/evidence dependency.
- `HISTORICAL_REUSE_ONLY` — old branch/artifact is input, not a current merge source.

## Canonical task register

| ID | Task | Owner | Status | Repository treatment / exit gate |
|---|---|---|---|---|
| `GOV-CHAT-001` | Establish `docs/projects/` as canonical non-authorizing project execution surface | CAPITAL-AI-GOV | `IN_CANDIDATE` | P1 docs present; exact-candidate governance/docs validation + Human PR gate |
| `GOV-CHAT-002` | Introduce qualified `PVC-01..PVC-18` Project Value Chain ownership namespace | CAPITAL-AI-GOV | `IN_CANDIDATE` | `PROJECT_VALUE_CHAIN.md`; no technical `SC-MD-SPT-0001` rewrite |
| `GOV-CHAT-003` | Consolidate Platform Director `PVC-05` and Governance scope without self-approval/self-elevation | CAPITAL-AI-GOV | `IN_CANDIDATE` | `AUTHORITY_AND_DECISION_BOUNDARIES.md`; ADR-0096/AGENTS remain controlling |
| `GOV-CHAT-004` | Integrate DevelopmentChain into project architecture | CAPITAL-AI-OPS | `REFERRED_NOT_EXECUTED` | GOV contract + P2 handoff; OPS fresh-main implementation required |
| `GOV-CHAT-005` | Preserve M0-M10 as historical DevelopmentChain maturity evidence; keep M10 suspended | CAPITAL-AI-OPS / GOV controls | `REFERRED_NOT_EXECUTED` | P2 must preserve history; no M10 reactivation without separate Owner decision |
| `GOV-CHAT-006` | Assess financial technical `VC-*` -> `FVC-*` namespace migration | GOV assessment + DATA/FINTECH/DOC/QM/OPS | `REFERRED_NOT_EXECUTED` | P3 assessment complete; coordinated multi-owner decision/test plan required |
| `GOV-CHAT-007` | Keep stable technical authority identity `SC-MD-SPT-0001` during any future stage-label migration | affected technical owners | `REFERRED_NOT_EXECUTED` | P3 invariant; historical evidence remains immutable |
| `GOV-CHAT-008` | Migrate CLIENT project label `VC-01` -> `PVC-01` | CAPITAL-AI-CLIENT | `REFERRED_NOT_EXECUTED` | CLIENT-owned docs update; no GOV foreign edit |
| `GOV-CHAT-009` | Create/migrate `docs/projects/operations/**` | CAPITAL-AI-OPS | `REFERRED_NOT_EXECUTED` | P2 handoff exit gate |
| `GOV-CHAT-010` | Converge DATA/DOC/FINTECH and cross-cutting project navigation under `docs/projects/<project>/` | respective project owners | `REFERRED_NOT_EXECUTED` | owner-scoped fresh-main migrations; normative/runtime files may stay in canonical domain paths |
| `GOV-CHAT-011` | Graph complete process chain and dependencies in Admin Panel | CAPITAL-AI-CLIENT + CAPITAL-AI-OPS; GOV semantic contract | `REFERRED_NOT_EXECUTED` | `ADMIN_PANEL_PROCESS_GRAPH_HANDOFF.md`; UI/runtime implementation outside GOV |
| `GOV-CHAT-012` | Maintain compact Governance/application component assessment | CAPITAL-AI-GOV | `IN_CANDIDATE` | `COMPONENT_ARCHITECTURE_MATRIX.md`; reassess after structural changes |
| `GOV-CHAT-013` | Compact PR template and hide explanatory comments from visible PR body | CAPITAL-AI-GOV | `DONE_MAIN` | merged PR #628 |
| `GOV-CHAT-014` | Restore direct PR creation through Chat/API/MCP/Connector under exact-snapshot rules | CAPITAL-AI-GOV | `DONE_MAIN` | merged PR #629; Human-only merge remains unchanged |
| `GOV-CHAT-015` | Clean old GOV writer claims / stop parallel GOV merge sources | CAPITAL-AI-GOV | `IN_CANDIDATE` | all historical GOV branch claims terminal; current consolidation is sole GOV writer |
| `GOV-CHAT-016` | Close merged PR #629 claim that remained `active` on main | CAPITAL-AI-GOV | `IN_CANDIDATE` | claim changed to `released/merged`; merge of this candidate is exit gate |
| `GOV-CHAT-017` | Branch names must include project-folder name + compact task | CAPITAL-AI-GOV governance rule owner | `IN_CANDIDATE` | `AGENTS.md` 2.2.1 + `CTRL-SDLC-BRANCH-001` in Control Catalog 1.8.0; Authority Registry 1.37.0 aligned |
| `GOV-CHAT-018` | Keep PR titles/bodies in project-qualified German presentation where repository automation does not require fixed machine text | CAPITAL-AI-GOV / relevant project owner | `OPEN_GOV` | capture as versioned PR-convention clarification if repository-wide enforcement is desired; current title pattern already used operationally |
| `GOV-CHAT-019` | Build/test only after PR where cost-control policy permits; avoid unnecessary pre-PR paid CI | existing Governance/CI authority | `DONE_MAIN` | `/AGENTS.md` already requires smallest sufficient checks and cost control |
| `GOV-CHAT-020` | Sync candidate against current main and correlate open PRs/writers before PR | existing Governance authority | `DONE_MAIN` | `CTRL-SDLC-SYNC-001` / `CTRL-SDLC-PR-CREATE-001` |
| `GOV-CHAT-021` | Maintain before/after or migration matrix for GOV structural changes | CAPITAL-AI-GOV | `IN_CANDIDATE` | P1 matrix + component matrix + final validation report |
| `GOV-CHAT-022` | Preserve explicit cross-project handoff markers and target-roadmap/evidence gates | CAPITAL-AI-GOV coordination | `IN_CANDIDATE` | `CROSS_PROJECT_HANDOFF_CONTRACT.md` + handoff register |
| `GOV-CHAT-023` | Do not create duplicate ADR/ESS/AUTH/CTRL identities merely for project-folder assignment | CAPITAL-AI-GOV | `IN_CANDIDATE` | no new identity introduced in this candidate |
| `GOV-CHAT-024` | Retain old GOV branches as historical/reuse inputs only | CAPITAL-AI-GOV | `IN_CANDIDATE` | branch disposition below; no direct stale-branch merge |
| `GOV-CHAT-025` | Maintain one canonical current CAPITAL-AI-GOV roadmap/task surface instead of parallel current roadmap variants | CAPITAL-AI-GOV | `IN_CANDIDATE` | `ROADMAP.md` + this register are current project surfaces; old branch roadmaps are reuse/history only |
| `GOV-CHAT-026` | Emit bounded post-PR chat handoff with at most two prioritized next steps | existing Governance authority | `DONE_MAIN` | `CTRL-SDLC-CHAT-HANDOFF-001` in current Trust Root/control catalog |
| `GOV-CHAT-027` | Reuse repository/native/plugin/open-source capability before custom implementation | existing Governance authority + affected owner | `DONE_MAIN` | `/AGENTS.md` reuse order applies; Admin Panel handoff requires graph-tool evaluation before custom build |

## Historical GOV branch disposition

| Branch | Claim state | Disposition |
|---|---|---|
| `docs/capital-ai-gov-consolidation-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/capital-ai-gov-v2-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/capital-ai-gov-vc-integration-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/project-architecture-pvc-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `agent/governance-pvc-architecture-20260831` | `superseded` | final P1 reuse source; replaced by this consolidation candidate |
| `agent/governance-chat-pr-20260831` | `released` | superseded by PR #629 path; historical only |

## Consolidation rule

This register is the canonical current task inventory for CAPITAL-AI-GOV project execution. It does not supersede `/AGENTS.md`, the control catalog, ADR/ESS authorities, domain roadmaps or foreign project ownership. A foreign row changes state only when its Primary Owner returns current-main implementation/evidence.
