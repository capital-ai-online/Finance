# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-01  
**Original consolidation baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Current project-folder correlation baseline:** `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`  
**User-Lifecycle orchestration baseline:** `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`  
**Role:** execution backlog / traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV` for local rows only

## Status vocabulary

- `DONE_MAIN` — implementation is already merged on current main.
- `IN_CANDIDATE` — local GOV work is part of the current scoped candidate.
- `OPEN_GOV` — local GOV follow-up remains after this candidate.
- `REFERRED_NOT_EXECUTED` — foreign project/Primary Owner must execute.
- `REFERRED` — foreign work has target-side evidence/acceptance or merged return evidence but remains outside GOV execution authority.
- `READY_FOR_HANDOFF` — the current correlation allows an atomic foreign-owner handoff; implementation remains foreign.
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
| `GOV-CHAT-010` | Converge DATA/DOC/FINTECH and cross-cutting project navigation under `docs/projects/<project>/` | respective project owners | `DONE_MAIN` | Documentary/Security/Compliance/Frontend/SEO/Social project surfaces are materialized; relevant OPS/FE/COMP writers were released via PR #661 |
| `GOV-CHAT-011` | Graph complete process chain and dependencies in Admin Panel | CAPITAL-AI-CLIENT + CAPITAL-AI-OPS; GOV semantic contract | `REFERRED_NOT_EXECUTED` | `ADMIN_PANEL_PROCESS_GRAPH_HANDOFF.md`; UI/runtime implementation outside GOV |
| `GOV-CHAT-012` | Maintain compact Governance/application component assessment | CAPITAL-AI-GOV | `OPEN_GOV` | reassess after architecture or authority changes |
| `GOV-CHAT-013` | Compact PR template and hide explanatory comments from visible PR body | CAPITAL-AI-GOV | `DONE_MAIN` | merged PR #628 |
| `GOV-CHAT-014` | Restore direct PR creation through Chat/API/MCP/Connector under exact-snapshot rules | CAPITAL-AI-GOV | `DONE_MAIN` | merged PR #629; Human-only merge remains unchanged |
| `GOV-CHAT-015` | Clean old GOV writer claims / stop parallel GOV merge sources | CAPITAL-AI-GOV | `DONE_MAIN` | historical GOV claims terminalized where completed; new work uses scoped claims |
| `GOV-CHAT-016` | Close merged PR #629 claim that remained `active` on main | CAPITAL-AI-GOV | `DONE_MAIN` | terminalized in merged GOV follow-up |
| `GOV-CHAT-017` | Branch names must include project-folder name + compact task | CAPITAL-AI-GOV governance rule owner | `DONE_MAIN` | `/AGENTS.md` 2.2.1 + `CTRL-SDLC-BRANCH-001` enforce convention |
| `GOV-CHAT-018` | Keep PR titles/bodies in project-qualified German presentation where repository automation does not require fixed machine text | CAPITAL-AI-GOV / relevant project owner | `OPEN_GOV` | capture as versioned PR-convention clarification if repository-wide enforcement is desired |
| `GOV-CHAT-019` | Build/test only after PR where cost-control policy permits; avoid unnecessary pre-PR paid CI | existing Governance/CI authority | `DONE_MAIN` | `/AGENTS.md` requires smallest sufficient checks and cost control |
| `GOV-CHAT-020` | Sync candidate against current main and correlate open PRs/writers before PR | existing Governance authority | `DONE_MAIN` | `CTRL-SDLC-SYNC-001` / `CTRL-SDLC-PR-CREATE-001` |
| `GOV-CHAT-021` | Maintain before/after or migration matrix for GOV structural changes | CAPITAL-AI-GOV | `DONE_MAIN` | P1 matrix plus PR-specific matrix |
| `GOV-CHAT-022` | Preserve explicit cross-project handoff markers and target-roadmap/evidence gates | CAPITAL-AI-GOV coordination | `DONE_MAIN` | handoff contract remains controlling |
| `GOV-CHAT-023` | Do not create duplicate ADR/ESS/AUTH/CTRL identities merely for project-folder assignment | CAPITAL-AI-GOV | `DONE_MAIN` | no new authority identity introduced |
| `GOV-CHAT-024` | Retain old GOV branches as historical/reuse inputs only | CAPITAL-AI-GOV | `DONE_MAIN` | no direct stale-branch merge |
| `GOV-CHAT-025` | Maintain one canonical current CAPITAL-AI-GOV roadmap/task surface instead of parallel current roadmap variants | CAPITAL-AI-GOV | `DONE_MAIN` | `ROADMAP.md` + this register remain current GOV project surfaces |
| `GOV-CHAT-026` | Emit bounded post-PR chat handoff with at most two prioritized next steps | existing Governance authority | `DONE_MAIN` | `CTRL-SDLC-CHAT-HANDOFF-001` |
| `GOV-CHAT-027` | Reuse repository/native/plugin/open-source capability before custom implementation | existing Governance authority + affected owner | `DONE_MAIN` | `/AGENTS.md` reuse order applies |
| `GOV-CHAT-028` | Resolve canonical project-folder identities for implemented cross-cutting projects SEC/COMP/FE/SEO/SOCIAL | CAPITAL-AI-GOV | `DONE_MAIN` | target project surfaces now materialized on main |
| `GOV-CHAT-029` | Terminalize stale merged `CAPITAL-AI-SEC-PVC-HANDOFF-CORRELATION-2026-08-31` writer metadata | CAPITAL-AI-SEC | `DONE_MAIN` | claim is `released`; preserve PR #631 evidence |
| `GOV-CHAT-030` | Materialize `docs/projects/security/**` navigation | CAPITAL-AI-SEC | `DONE_MAIN` | merged via PR #647 |
| `GOV-CHAT-031` | Materialize `docs/projects/compliance/**` navigation | CAPITAL-AI-COMP | `DONE_MAIN` | merged via PR #652; project-surface writer released via PR #661 |
| `GOV-CHAT-032` | Materialize `docs/projects/frontend/**` navigation | CAPITAL-AI-FE | `DONE_MAIN` | merged via PR #653; project/authority writers released via PR #661 |
| `GOV-CHAT-033` | Materialize `docs/projects/seo/**` navigation | CAPITAL-AI-SEO | `DONE_MAIN` | merged via PR #654 |
| `GOV-CHAT-034` | Materialize `docs/projects/social-media/**` navigation | CAPITAL-AI-SOCIAL | `DONE_MAIN` | merged via PR #655 |
| `GOV-CHAT-035` | Complete canonical Documentary project surface under `docs/projects/documentary/**` | CAPITAL-AI-DOC | `DONE_MAIN` | merged via PR #645 |
| `GOV-CHAT-036` | Normalize owner-side Handoff target folders after cross-cutting project surfaces merge | referring project owners | `REFERRED_NOT_EXECUTED` | owner-local follow-up where still required |
| `GOV-CHAT-037` | Bootstrap complete User-Lifecycle-Simulation governance orchestration | CAPITAL-AI-GOV | `DONE_MAIN` | six required artifacts merged via PR #656; no productive code |
| `GOV-CHAT-038` | Resolve Pro annual-price rule (`248 EUR` vs `313.20 EUR`) | CAPITAL-AI-GOV | `IN_CANDIDATE` | Owner selected current catalog `248 EUR`; projection merge clears the price-decision gate without authorizing a Stripe migration |
| `GOV-CHAT-039` | Resolve logout semantics (local/global/both) | CAPITAL-AI-GOV | `IN_CANDIDATE` | Owner selected both functions with local as default; projection merge clears the logout-decision gate |
| `GOV-CHAT-040` | Implement lifecycle harness and provider tests | CAPITAL-AI-OPS | `READY_FOR_HANDOFF` | OPS writer released via PR #661; handoff follows Human merge of the stable GOV decision projection |
| `GOV-CHAT-041` | Unify lifecycle/pricing/entitlement UI projection | CAPITAL-AI-FE | `REFERRED_NOT_EXECUTED` | FE writers released via PR #661; Owner decisions resolved in this candidate; stable OPS contract remains required |
| `GOV-CHAT-042` | Independently verify User-Lifecycle Security properties | CAPITAL-AI-SEC | `REFERRED_NOT_EXECUTED` | after OPS/FE evidence; Security alone owns final Security verification |
| `GOV-CHAT-043` | Assess purchase/cancellation consumer-compliance flow | CAPITAL-AI-COMP | `REFERRED_NOT_EXECUTED` | COMP writer released via PR #661; consume OPS/FE evidence and retain independent applicability review; technical evidence is not legal advice |
| `GOV-CHAT-044` | Correlate merged owner SHAs/evidence and close User-Lifecycle orchestration | CAPITAL-AI-GOV | `DEPENDENCY` | separate GOV closeout only after OPS/FE/SEC/COMP returns |
| `GOV-CHAT-045` | Terminalize stale merged `GOVERNANCE-FRONTEND-AUTHORITY-CORRELATION-2026-08-20` writer metadata | CAPITAL-AI-GOV / FE correlation | `DONE_MAIN` | released with merge evidence via PR #661 |
| `GOV-CHAT-046` | Terminalize stale merged `CAPITAL-AI-COMP-PROJECT-SURFACE-2026-09-01` writer metadata | CAPITAL-AI-COMP | `DONE_MAIN` | released with merge evidence via PR #661 |
| `GOV-CHAT-047` | Determine applicability of BGB §312j/§312k to CAPITAL-AI subscription flow before legal PASS/FAIL gating | CAPITAL-AI-COMP / Human-Legal authority | `REFERRED_NOT_EXECUTED` | official provisions contain financial-services exceptions; GOV keeps technical checks conditional |
| `GOV-CHAT-048` | Terminalize stale merged `CAPITAL-AI-FE-PROJECT-SURFACE-2026-09-01` writer metadata | CAPITAL-AI-FE | `DONE_MAIN` | released with merge evidence via PR #661 |
| `GOV-CHAT-049` | Recorrelate User-Lifecycle owner sequence after PRs #656/#661 | CAPITAL-AI-GOV | `DONE_MAIN` | merged via PR #675; no foreign implementation or production mutation |
| `GOV-CHAT-050` | Record User-Lifecycle Owner decisions and release the fulfilled PR #675 writer | CAPITAL-AI-GOV | `IN_CANDIDATE` | ten-file GOV-only candidate; `248 EUR`, both logout modes/local default; no live Billing/Auth/production mutation |

## Historical GOV branch disposition

| Branch | Claim state | Disposition |
|---|---|---|
| `docs/capital-ai-gov-consolidation-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/capital-ai-gov-v2-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/capital-ai-gov-vc-integration-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `gov/project-architecture-pvc-20260831` | `superseded` | `HISTORICAL_REUSE_ONLY` |
| `agent/governance-pvc-architecture-20260831` | `superseded` | final P1 reuse source; replaced by merged consolidation |
| `agent/governance-chat-pr-20260831` | `released` | historical only |
| `agent/governance-crosscutting-folder-correlation-20260901` | `superseded` | historical only |
| `agent/governance-crosscutting-folder-correlation-v2-20260901` | `released` | merged routing/correlation source |

## Current scoped GOV writer

`agent/governance-user-lifecycle-decisions-20260901` owns only the ten paths declared by `.ai/work-claims/CAPITAL-AI-GOV-ULS-DECISIONS-2026-09-01.json`. It atomically releases the fulfilled PR #675 writer and updates Governance decision/coordination projections. It does not own or modify OPS, FE, SEC or COMP productive/project-owned implementation surfaces.

## Consolidation rule

This register is the canonical current task inventory for CAPITAL-AI-GOV project execution. It does not supersede `/AGENTS.md`, the control catalog, ADR/ESS authorities, domain roadmaps or foreign project ownership. A foreign row changes state only when its target project returns current-main implementation/evidence; Governance coordination does not itself complete foreign implementation, independent Security verification or Compliance assessment.
