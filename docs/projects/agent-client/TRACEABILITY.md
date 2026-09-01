# CAPITAL-AI-CLIENT — Traceability

Baseline: `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`

Project stage: `PVC-01 — Agent Client`

## Authority traceability

| Requirement | Authority/source | CAPITAL-AI-CLIENT projection |
|---|---|---|
| Trust root | `AGENTS.md` | repository lifecycle and Human Owner merge remain controlling |
| project ownership | `docs/projects/README.md`, project README | PVC-01 owned by CAPITAL-AI-CLIENT |
| AI Client position | AI Agent target architecture | PVC-01 owns client request/response edge |
| Human↔Client boundary | AI Agent trust boundary TB1 | OWNED |
| Client↔Control boundary | TB2 | SHARED; client side only |
| attributable principal semantics | IAM model / `AgentPrincipalContext` | CONSUMER |
| capability vocabulary | `agentIam.ts` | requested capability only |
| authorization decision | `evaluateAgentAuthorization` | NOT-CLIENT |
| provider neutrality | provider-profile/ESS-0019 | metadata only; no elevation |
| protected mutation separation | DevelopmentChain + Human Owner governance | no direct client mutation path |
| ADR-0104 scoped session | ADR-0104 v1.3 / S1 | standing scoped execution/PR-create authority for this exact chat/project only; never merge authority |
| cross-project routing | `CROSS_PROJECT_HANDOFF_CONTRACT.md` | foreign implementation stops and is referred |

## Workstream traceability

| Workstream | Inputs | Current output | Foreign dependency |
|---|---|---|---|
| CLIENT-01 Inventory | current main, architecture, runtime search | inventory, runtime mapping, re-correlation evidence | none executed |
| CLIENT-02 Request Contract | architecture + canonical IAM/capability semantics | `CLIENT_CONTRACTS.md` request contract | downstream accepts/rejects |
| CLIENT-03 Identity Handoff | `AgentPrincipalContext` | `CLIENT_CONTRACTS.md` identity handoff | authoritative IAM/control boundary |
| CLIENT-04 Capability Handoff | canonical capability vocabulary | requested-capability handoff | downstream grant/authorization |
| CLIENT-05 Response Contract | downstream response semantics | status/error/UX contract | response producer external |
| CLIENT-06 Security Boundary | trust boundaries + security policies | fail-closed client invariants | Security/Governance decisions external |
| CLIENT-07 Tests/Evidence | all PVC-01 contracts + scan | current evidence; runtime tests deferred | hosted CI/Human merge gate |

## Cross-project traceability

| Marker | Project stage | Input from PVC-01 | Expected return | Local state |
|---|---|---|---|---|
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]` | `PVC-02` | structured request + attribution + requested capability | authoritative controlled-implementation outcome | never mark foreign execution DONE/VERIFIED |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]` | `PVC-05` | contract/policy decision request | canonical governance decision | dependency/reference only |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]` | `PVC-18` | request/correlation IDs + client status boundary | authoritative trace/event linkage | dependency/reference only |

## Runtime relocation traceability

Current state: `NO_PHYSICAL_RUNTIME_TRIGGER`. Existing Security/Compliance/Server/Tool/Operations code remains in its current domain. The current implementation slice is project-local documentation/contract material only.

| Old path | New PVC-01 path | Adapter | Test/evidence | Removal state |
|---|---|---|---|---|
| _none — no productive PVC-01 runtime path identified_ | _none_ | _n/a_ | `evidence/RECORRELATION_2026-09-01.md` | `NO_RELOCATION` |

## Current validation projection

| Validation | Result |
|---|---|
| PVC-01 has exactly one Primary Owner | `PASS — CAPITAL-AI-CLIENT` |
| canonical project folder | `PASS — docs/projects/agent-client/` |
| baseline refreshed | `PASS — main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68` |
| parallel open writer | `PASS — #691 is CAPITAL-AI-OPS; no client project-path overlap` |
| historical #668 authority | `PASS — closed/unmerged; non-authorizing` |
| local execution of PVC-02..PVC-18 | `PASS — none introduced` |
| direct protected mutation path | `PASS — prohibited by contract` |
| parallel Agent Client runtime | `PASS — none introduced` |
| physical strangler trigger | `NOT TRIGGERED` |
| CLIENT-02..06 contract traceability | `PASS — CLIENT_CONTRACTS.md` |
| CLIENT-07 runtime tests | `N/A — no physical runtime code introduced` |

These are repository/document correlation results, not hosted CI or runtime PASS claims.

## Evidence continuity

- Historical initial baseline: `evidence/BASELINE_2026-08-31.md`.
- Current re-correlation/strangler decision: `evidence/RECORRELATION_2026-09-01.md`.
- Historical unmerged attempt: PR #668, retained only as historical GitHub evidence.
- Any future physical implementation must add exact base/head SHA, concrete code path, executed tests and compatibility/removal state.
