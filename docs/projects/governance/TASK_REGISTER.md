# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-01  
**Original consolidation baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Current project-folder correlation baseline:** `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc`  
**Role:** execution backlog / traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV` for local rows only

## Status vocabulary

- `DONE_MAIN` — implementation is already merged on current main.
- `IN_CANDIDATE` — local GOV work is part of the current scoped candidate.
- `OPEN_GOV` — local GOV follow-up remains after this candidate.
- `REFERRED_NOT_EXECUTED` — foreign project/Primary Owner must execute.
- `REFERRED` — foreign work has target-side evidence/acceptance or merged return evidence but remains outside GOV execution authority.
- `DEPENDENCY` — cross-cutting participant/evidence dependency.
- `HISTORICAL_REUSE_ONLY` — old branch/artifact is input, not a current merge source.

## Canonical task register

| ID | Task | Owner | Status | Repository treatment / exit gate |
|---|---|---|---|---|
| `GOV-CHAT-001` | Establish `docs/projects/` as canonical non-authorizing project execution surface | CAPITAL-AI-GOV | `DONE_MAIN` | established via PR #630; maintained by current project model |
| `GOV-CHAT-002` | Introduce qualified `PVC-01..PVC-18` Project Value Chain ownership namespace | CAPITAL-AI-GOV | `DONE_MAIN` | `PROJECT_VALUE_CHAIN.md`; no technical `SC-MD-SPT-0001` rewrite |
| `GOV-CHAT-003` | Consolidate Platform Director `PVC-05` and Governance scope without self-approval/self-elevation | CAPITAL-AI-GOV | `DONE_MAIN` | `AUTHORITY_AND_DECISION_BOUNDARIES.md`; ADR-0096/AGENTS remain controlling |
| `GOV-CHAT-004` | Integrate DevelopmentChain into project architecture | CAPITAL-AI-OPS | `REFERRED` | `docs/projects/operations/**` present; subsequent OPS remediation remains owner-scoped |
| `GOV-CHAT-005` | Preserve M0-M10 as historical DevelopmentChain maturity evidence; keep M10 suspended | CAPITAL-AI-OPS / GOV controls | `REFERRED` | OPS project surface preserves DevelopmentChain; no M10 reactivation without separate Owner decision |
| `GOV-CHAT-006` | Assess financial technical `VC-*` -> `FVC-*` namespace migration | GOV assessment + DATA/FINTECH/DOC/QM/OPS | `REFERRED_NOT_EXECUTED` | P3 assessment complete; coordinated multi-owner decision/test plan required |
| `GOV-CHAT-007` | Keep stable technical authority identity `SC-MD-SPT-0001` during any future stage-label migration | affected technical owners | `REFERRED_NOT_EXECUTED` | P3 invariant; historical evidence remains immutable |
| `GOV-CHAT-008` | Migrate CLIENT project label `VC-01` -> `PVC-01` | CAPITAL-AI-CLIENT | `REFERRED_NOT_EXECUTED` | CLIENT-owned docs update; no GOV foreign edit |
| `GOV-CHAT-009` | Create/migrate `docs/projects/operations/**` | CAPITAL-AI-OPS | `REFERRED` | canonical OPS project surface is present on main |
| `GOV-CHAT-010` | Converge DATA/DOC/FINTECH and cross-cutting project navigation under `docs/projects/<project>/` | respective project owners | `REFERRED_NOT_EXECUTED` | DATA/FINTECH/DOC complete; five cross-cutting owner migrations remain; normative/runtime files stay in canonical domain paths |
| `GOV-CHAT-011` | Graph complete process chain and dependencies in Admin Panel | CAPITAL-AI-CLIENT + CAPITAL-AI-OPS; GOV semantic contract | `REFERRED_NOT_EXECUTED` | `ADMIN_PANEL_PROCESS_GRAPH_HANDOFF.md`; UI/runtime implementation outside GOV |
| `GOV-CHAT-012` | Maintain compact Governance/application component assessment | CAPITAL-AI-GOV | `OPEN_GOV` | reassess after project-folder migrations or architecture changes |
| `GOV-CHAT-013` | Compact PR template and hide explanatory comments from visible PR body | CAPITAL-AI-GOV | `DONE_MAIN` | merged PR #628 |
| `GOV-CHAT-014` | Restore direct PR creation through Chat/API/MCP/Connector under exact-snapshot rules | CAPITAL-AI-GOV | `DONE_MAIN` | merged PR #629; Human-only merge remains unchanged |
| `GOV-CHAT-015` | Clean old GOV writer claims / stop parallel GOV merge sources | CAPITAL-AI-GOV | `DONE_MAIN` | historical GOV claims terminalized; new work uses scoped claims |
| `GOV-CHAT-016` | Close merged PR #629 claim that remained `active` on main | CAPITAL-AI-GOV | `DONE_MAIN` | terminalized in merged GOV follow-up |
| `GOV-CHAT-017` | Branch names must include project-folder name + compact task | CAPITAL-AI-GOV governance rule owner | `DONE_MAIN` | `/AGENTS.md` 2.2.1 + `CTRL-SDLC-BRANCH-001` enforce convention |
| `GOV-CHAT-018` | Keep PR titles/bodies in project-qualified German presentation where repository automation does not require fixed machine text | CAPITAL-AI-GOV / relevant project owner | `OPEN_GOV` | capture as versioned PR-convention clarification if repository-wide enforcement is desired |
| `GOV-CHAT-019` | Build/test only after PR where cost-control policy permits; avoid unnecessary pre-PR paid CI | existing Governance/CI authority | `DONE_MAIN` | `/AGENTS.md` requires smallest sufficient checks and cost control |
| `GOV-CHAT-020` | Sync candidate against current main and correlate open PRs/writers before PR | existing Governance authority | `DONE_MAIN` | `CTRL-SDLC-SYNC-001` / `CTRL-SDLC-PR-CREATE-001` |
| `GOV-CHAT-021` | Maintain before/after or migration matrix for GOV structural changes | CAPITAL-AI-GOV | `IN_CANDIDATE` | P1 matrix updated for current cross-cutting folder correlation |
| `GOV-CHAT-022` | Preserve explicit cross-project handoff markers and target-roadmap/evidence gates | CAPITAL-AI-GOV coordination | `IN_CANDIDATE` | handoff register normalized with target folder/owner/reason/dependency/evidence/gate fields |
| `GOV-CHAT-023` | Do not create duplicate ADR/ESS/AUTH/CTRL identities merely for project-folder assignment | CAPITAL-AI-GOV | `IN_CANDIDATE` | current folder-correlation candidate creates no new authority identity |
| `GOV-CHAT-024` | Retain old GOV branches as historical/reuse inputs only | CAPITAL-AI-GOV | `DONE_MAIN` | no direct stale-branch merge |
| `GOV-CHAT-025` | Maintain one canonical current CAPITAL-AI-GOV roadmap/task surface instead of parallel current roadmap variants | CAPITAL-AI-GOV | `DONE_MAIN` | `ROADMAP.md` + this register remain current GOV project surfaces |
| `GOV-CHAT-026` | Emit bounded post-PR chat handoff with at most two prioritized next steps | existing Governance authority | `DONE_MAIN` | `CTRL-SDLC-CHAT-HANDOFF-001` |
| `GOV-CHAT-027` | Reuse repository/native/plugin/open-source capability before custom implementation | existing Governance authority + affected owner | `DONE_MAIN` | `/AGENTS.md` reuse order applies |
| `GOV-CHAT-028` | Resolve canonical project-folder identities for implemented cross-cutting projects SEC/COMP/FE/SEO/SOCIAL | CAPITAL-AI-GOV | `IN_CANDIDATE` | `docs/projects/README.md` maps `security`, `compliance`, `frontend`, `seo`, `social-media`; Human merge is correlation exit gate |
| `GOV-CHAT-029` | Terminalize stale merged `CAPITAL-AI-SEC-PVC-HANDOFF-CORRELATION-2026-08-31` active writer metadata | CAPITAL-AI-SEC | `REFERRED_NOT_EXECUTED` | SEC-owned fresh-main branch must preserve PR #631 evidence and change stale claim state before new SEC protected work |
| `GOV-CHAT-030` | Materialize `docs/projects/security/**` navigation | CAPITAL-AI-SEC | `REFERRED_NOT_EXECUTED` | only after GOV folder mapping is merged; reuse `src/platform/Security/**` and current Security roadmap/traceability |
| `GOV-CHAT-031` | Materialize `docs/projects/compliance/**` navigation | CAPITAL-AI-COMP | `REFERRED_NOT_EXECUTED` | reuse `docs/compliance/CAPITAL-AI-COMP/**`; no normative/legal relocation for symmetry |
| `GOV-CHAT-032` | Materialize `docs/projects/frontend/**` navigation | CAPITAL-AI-FE | `REFERRED_NOT_EXECUTED` | reuse `docs/frontend/**`; no acquisition of FINTECH PVC-17 ranking authority |
| `GOV-CHAT-033` | Materialize `docs/projects/seo/**` navigation | CAPITAL-AI-SEO | `REFERRED_NOT_EXECUTED` | reuse consolidated SEO/Google-Marketing roadmap and `docs/seo/**`; no second SEO truth |
| `GOV-CHAT-034` | Materialize `docs/projects/social-media/**` navigation and remove Social-owned `REQUIRES_CORRELATION` metadata | CAPITAL-AI-SOCIAL | `REFERRED_NOT_EXECUTED` | only after GOV mapping merge; reuse `docs/social-media/CAPITAL-AI-SOCIAL/**`; no implicit PVC-19/publication authority |
| `GOV-CHAT-035` | Complete canonical Documentary project surface under `docs/projects/documentary/**` | CAPITAL-AI-DOC | `REFERRED` | PR #645 merged; surface is present on `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc` |
| `GOV-CHAT-036` | Normalize owner-side Handoff target folders after cross-cutting project surfaces merge | FINTECH/SOCIAL/other referring owners | `REFERRED_NOT_EXECUTED` | e.g. FINTECH FE/COMP targets and Social `REQUIRES_CORRELATION` must be updated owner-scoped after target navigation exists |

## Historical GOV branch disposition

| Branch | Claim state | Disposition |
|---|---|---|
| `docs/capital-ai-gov-consolidation-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/capital-ai-gov-v2-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/capital-ai-gov-vc-integration-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/project-architecture-pvc-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `agent/governance-pvc-architecture-20260831` | `superseded` | final P1 reuse source; replaced by merged consolidation |
| `agent/governance-chat-pr-20260831` | `released` | superseded by PR #629 path; historical only |
| `agent/governance-crosscutting-folder-correlation-20260901` | `superseded` | stale exact-snapshot candidate after PR #645 changed main; reused into v2 only |

## Current scoped GOV writer

`agent/governance-crosscutting-folder-correlation-v2-20260901` owns only the project-routing/documentation paths declared by `.ai/work-claims/CAPITAL-AI-GOV-CROSSCUTTING-FOLDER-CORRELATION-V2-2026-09-01.json`. It does not own or modify the foreign target project surfaces listed in GOV-CHAT-029..036.

## Consolidation rule

This register is the canonical current task inventory for CAPITAL-AI-GOV project execution. It does not supersede `/AGENTS.md`, the control catalog, ADR/ESS authorities, domain roadmaps or foreign project ownership. A foreign row changes state only when its target project returns current-main implementation/evidence; Governance project-folder correlation does not itself complete foreign materialization.
