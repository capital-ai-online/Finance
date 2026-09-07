# CAPITAL-AI-CLIENT — Traceability

Baseline: `main@eee9a8af3f3d2532a213154dd61f678454a2200b`  
Correlation date: `2026-09-07`

Project stage: `PVC-01 — Agent Client`  
Primary Owner: `CAPITAL-AI-CLIENT`

## Authority traceability

| Requirement | Authority/source | CAPITAL-AI-CLIENT projection |
|---|---|---|
| Trust root | `/AGENTS.md` | repository lifecycle and protected-action boundaries remain controlling subject to applicable higher authority |
| project ownership | `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | PVC-01 owned by CAPITAL-AI-CLIENT |
| project work priority | `docs/projects/agent-client/ROADMAP.md` | Priority 1 documentation correlation hygiene; physical runtime remains gated |
| AI Client position | AI Agent target architecture | PVC-01 owns client request/response edge |
| Human↔Client boundary | AI Agent trust boundary TB1 | OWNED |
| Client↔Control boundary | TB2 | SHARED; client side only |
| attributable principal semantics | IAM model / `AgentPrincipalContext` | CONSUMER |
| capability vocabulary | `agentIam.ts` | requested capability only |
| authorization decision | `evaluateAgentAuthorization` | NOT-CLIENT |
| provider neutrality | provider-profile / ESS-0019 v1.2.0 | metadata only; no elevation; remote skill loading not enabled |
| protected mutation separation | `/AGENTS.md` + downstream control plane | no direct client mutation path |
| PR creation lifecycle | `/AGENTS.md` / `CTRL-SDLC-PR-CREATE-001` | project docs claim no standing session authority; exact current main/branch-head correlation and Human approval apply unless a separately proven applicable higher-authority activation explicitly supersedes that prompt surface |
| ADR-0104 historical/session semantics | ADR-0104 v1.5.0 | no activation is inferred from historical slots/evidence; any ACTIVE-session effect requires separate current activation evidence and exact chat/project binding |
| folder-to-PVC routing | `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | foreign implementation is routed to its canonical Primary Owner, not executed locally |

## Workstream traceability

| Workstream | Inputs | Current output | Foreign dependency |
|---|---|---|---|
| CLIENT-01 Inventory | current main, architecture, runtime search | inventory, runtime mapping, current project-surface correlation | none executed |
| CLIENT-02 Request Contract | architecture + canonical IAM/capability semantics | `CLIENT_CONTRACTS.md` request contract | downstream accepts/rejects |
| CLIENT-03 Identity Handoff | `AgentPrincipalContext` | `CLIENT_CONTRACTS.md` identity handoff | authoritative IAM/control boundary |
| CLIENT-04 Capability Handoff | canonical capability vocabulary | requested-capability handoff | downstream grant/authorization |
| CLIENT-05 Response Contract | downstream response semantics | status/error/UX contract | response producer external |
| CLIENT-06 Security Boundary | trust boundaries + security policies | fail-closed client invariants | Security/Governance decisions external |
| CLIENT-07 Tests/Evidence | all PVC-01 contracts + scan | contract evidence plus current documentation correlation; runtime tests deferred | hosted CI/Human merge gate |

## Cross-project traceability

Project routing uses only the canonical PVC mapping plus the target project Roadmap; no Cross-Project-Handoff policy overlay is required for ordinary routing.

| Target owner / PVC | Input from PVC-01 | Expected return | Local state |
|---|---|---|---|
| `CAPITAL-AI-OPS / PVC-02` | structured request + attribution + requested capability | authoritative controlled-implementation outcome | dependency only; never mark foreign execution DONE/VERIFIED |
| `CAPITAL-AI-GOV / PVC-05` | contract/policy decision request | canonical governance decision | dependency/reference only |
| `CAPITAL-AI-OPS / PVC-18` | request/correlation IDs + client status boundary | authoritative trace/event linkage | dependency/reference only |

## Runtime relocation traceability

Current state: `NO_PHYSICAL_RUNTIME_TRIGGER`. Existing Security/Compliance/Server/Tool/Operations code remains in its current domain. This hygiene slice changes project documentation only and does not create or relocate runtime code.

| Old path | New PVC-01 path | Adapter | Test/evidence | Removal state |
|---|---|---|---|---|
| _none — no productive PVC-01 runtime path identified_ | _none_ | _n/a_ | historical scan evidence plus 2026-09-07 current-main search | `NO_RELOCATION` |

## Current validation projection

| Validation | Result |
|---|---|
| PVC-01 has exactly one Primary Owner | `PASS — CAPITAL-AI-CLIENT` |
| canonical project folder | `PASS — docs/projects/agent-client/` |
| baseline refreshed | `PASS — main@eee9a8af3f3d2532a213154dd61f678454a2200b` |
| open Pull Requests at correlation time | `PASS — 0` |
| active CLIENT branch writer | `PASS — none found before this scoped hygiene branch was created` |
| released historical CLIENT work claim | `PASS — non-active coordination metadata` |
| Frontend branch overlap | `PASS — existing frontend branch changes docs/frontend/FRONTEND_ROADMAP.md only; no changed-file overlap with this CLIENT slice` |
| historical #668 authority | `PASS — closed/unmerged; non-authorizing` |
| merged CLIENT #693 baseline | `PASS — contract/evidence baseline retained` |
| merged foreign OPS #691 | `PASS — not an active writer; M10 retirement is not a CLIENT runtime gap` |
| standing chat/session authority assumed | `PASS — none assumed` |
| local execution of PVC-02..PVC-18 | `PASS — none introduced` |
| direct protected mutation path | `PASS — prohibited by contract` |
| parallel Agent Client runtime | `PASS — none introduced` |
| physical strangler trigger | `NOT TRIGGERED` |
| CLIENT-02..06 contract traceability | `PASS — CLIENT_CONTRACTS.md` |
| CLIENT-07 runtime tests | `N/A — no physical runtime code introduced` |

These are repository/document correlation results, not hosted CI or runtime PASS claims.

## Evidence continuity

- `evidence/BASELINE_2026-08-31.md` is historical initial evidence.
- `evidence/RECORRELATION_2026-09-01.md` is historical re-correlation/strangler evidence and is not rewritten to mimic current policy.
- Historical unmerged PR #668 is retained only as GitHub history.
- Historical/expired ADR-0104 activation evidence remains evidence only; it does not establish a standing session for this project/chat.
- Any future physical implementation must add exact main/branch-head SHA, concrete code path, executed tests and compatibility/removal state.
