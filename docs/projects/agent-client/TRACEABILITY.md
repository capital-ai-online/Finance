# CAPITAL-AI-CLIENT — Traceability

**Baseline:** `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`  
**Correlation date:** `2026-09-10`  
**Project stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`

## Authority traceability

| Requirement | Authority/source | CAPITAL-AI-CLIENT projection |
|---|---|---|
| Trust root | `/AGENTS.md` Control Plane 2.9.0 | repository lifecycle, exact PR-create approval and Human/CODEOWNER merge remain controlling |
| project ownership | `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | PVC-01 owned by CAPITAL-AI-CLIENT |
| project work priority | `docs/projects/agent-client/ROADMAP.md` | current CLIENT scope and sequencing |
| AI Client position | AI Agent target architecture | PVC-01 owns client request/response edge |
| Human↔Client boundary | AI Agent trust boundary TB1 | OWNED |
| Client↔Control boundary | TB2 | SHARED; client side only |
| attributable principal semantics | IAM model / `AgentPrincipalContext` | CONSUMER |
| capability vocabulary | `src/platform/Security/agentIam.ts` | requested capability only |
| authorization decision | `evaluateAgentAuthorization` | NOT-CLIENT |
| provider neutrality / external skill input | ESS-0019 v1.2.0 | metadata/content is untrusted; no elevation or remote-skill activation |
| protected mutation separation | `/AGENTS.md` + downstream control/execution authorities | no direct client mutation path |
| ADR-0104 conditional session | ADR-0104 v1.5.0 | conditional partial supersession only when an ACTIVE exact-chat activation is evidenced; none is evidenced for this correlation, so normal exact PR-create approval applies |
| folder-to-PVC routing | `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | foreign implementation is not executed locally; withdrawn post-PVC overlays are not current policy |

## Workstream traceability

| Workstream | Inputs | Current output | Foreign dependency |
|---|---|---|---|
| CLIENT-01 Inventory / re-correlation | current main, project mapping, architecture, runtime search | seven active docs re-correlated; runtime gate retained | none executed |
| CLIENT-02 Request Contract | architecture + canonical IAM/capability semantics | `CLIENT_CONTRACTS.md` request contract | downstream accepts/rejects |
| CLIENT-03 Identity Handoff | `AgentPrincipalContext` | `CLIENT_CONTRACTS.md` identity handoff | authoritative IAM/control boundary |
| CLIENT-04 Capability Handoff | canonical capability vocabulary | requested-capability handoff | downstream grant/authorization |
| CLIENT-05 Response Contract | downstream response semantics | status/error/UX contract | response producer external |
| CLIENT-06 Security Boundary | trust boundaries + security policies | fail-closed client invariants | Security/Governance decisions external |
| CLIENT-07 Tests/Evidence | all PVC-01 contracts + scan | historical contract evidence retained; active-doc correlation current; runtime tests deferred | hosted CI/Human merge gate |
| CLIENT-08 Project Skill / Plugin Contract | current PVC mapping + ESS-0019 | `OPEN — separate future branch/PR slice` | OPS persistent execution and GOV authority changes remain foreign |

## Cross-project traceability

| Target | Project stage | Input from PVC-01 | Expected return | Local state |
|---|---|---|---|---|
| `CAPITAL-AI-OPS` | `PVC-02` and applicable OPS stages | structured request + attribution + requested capability | authoritative controlled-implementation outcome | `DEPENDENCY_ONLY` |
| `CAPITAL-AI-GOV` | `PVC-05` | contract/authority decision request | canonical governance decision | `DEPENDENCY_ONLY` |
| `CAPITAL-AI-OPS` | `PVC-08` | approved production-operation request | authoritative production outcome | `DEPENDENCY_ONLY` |
| `CAPITAL-AI-OPS` | `PVC-18` | request/correlation IDs + client status boundary | authoritative trace/event linkage | `DEPENDENCY_ONLY` |

Legacy `[CROSS_PROJECT_HANDOFF ... | VC-*]` markers and withdrawn post-PVC handoff overlays are not used as current routing authority.

## Runtime relocation traceability

Current state: `NO_PHYSICAL_RUNTIME_TRIGGER`. Existing Security/Compliance/Server/Tool/Operations code remains in its current domain. The current implementation slice is project-local documentation/contract correlation only.

| Old path | New PVC-01 path | Adapter | Test/evidence | Removal state |
|---|---|---|---|---|
| _none — no productive PVC-01 runtime path identified_ | _none_ | _n/a_ | current active-doc correlation + historical evidence under `evidence/` | `NO_RELOCATION` |

## Current validation projection

| Validation | Result |
|---|---|
| PVC-01 has exactly one Primary Owner | `PASS — CAPITAL-AI-CLIENT` |
| canonical project folder | `PASS — docs/projects/agent-client/` |
| current correlation baseline | `PASS — main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0` |
| open Pull Requests | `PASS — 0 at correlation time` |
| retained CLIENT work claim | `PASS — released / not an active writer` |
| stale second agent-client branch | `PASS — 0 ahead / 17 behind; no unique unmerged content` |
| PR #693 contract baseline | `PASS — merged` |
| foreign PR #691 M10 retirement | `PASS — merged; not a CLIENT gap` |
| historical #668 authority | `PASS — closed/unmerged; non-authorizing` |
| local execution of PVC-02..PVC-18 | `PASS — none introduced` |
| direct protected mutation path | `PASS — prohibited by contract` |
| parallel Agent Client runtime | `PASS — none found` |
| physical strangler trigger | `NOT TRIGGERED` |
| CLIENT-02..06 contract traceability | `PASS — CLIENT_CONTRACTS.md` |
| CLIENT-07 runtime tests | `N/A — no physical runtime code introduced` |
| CLIENT-08 implementation | `NOT RUN / NOT IMPLEMENTED — separate future slice` |

These are repository/document correlation results, not hosted CI or runtime PASS claims.

## Evidence continuity

- `evidence/BASELINE_2026-08-31.md` remains historical initial evidence.
- `evidence/RECORRELATION_2026-09-01.md` remains historical PR #693-era re-correlation/strangler evidence.
- PR #693 is the merged CLIENT contract/evidence baseline.
- PR #691 is merged foreign OPS evidence for M10 retirement.
- Historical unmerged attempt PR #668 remains non-authorizing GitHub evidence.
- Any future physical implementation must add then-current main/branch-head SHA, concrete code path, executed tests and compatibility/removal state.
