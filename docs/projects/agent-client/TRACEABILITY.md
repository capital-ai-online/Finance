# CAPITAL-AI-CLIENT — Traceability

Baseline: `main@9be95dd753f962a789312fec77571e2a9778b586`

Project stage: `PVC-01 — Agent Client`

## Authority traceability

| Requirement | Authority/source | CAPITAL-AI-CLIENT projection |
|---|---|---|
| Trust root | `AGENTS.md` | all work/PR/merge gates remain external Human/Owner governed |
| project ownership namespace | `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | PVC-01 owned by CAPITAL-AI-CLIENT |
| AI Client position | `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` | PVC-01 owns AI Client request/response edge |
| Human↔Client boundary | `docs/architecture/ai-agent/AI_AGENT_TRUST_BOUNDARIES.md` TB1 | OWNED |
| Client↔Control boundary | same, TB2 | SHARED; client side only |
| attributable principal semantics | `docs/architecture/ai-agent/AI_AGENT_IAM_MODEL.md`, `src/platform/Security/agentIam.ts` | CONSUMER; identity handoff only |
| capability vocabulary | `src/platform/Security/agentIam.ts` | CONSUMER; requested capability only |
| authorization decision | `src/platform/Security/agentIam.ts::evaluateAgentAuthorization` | NOT-CLIENT |
| provider neutrality | IAM/provider-profile/ESS-0019 sources | metadata compatibility; no authority elevation |
| protected mutation separation | DevelopmentChain + Human/Owner governance | client creates no direct mutation path |
| cross-project routing | `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md` | legacy `VC-*` marker + explicit `project_stage: PVC-*` |
| roadmap portfolio | `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | PVC-01 canonical roadmap referenced from portfolio |

## Workstream traceability

| Workstream | Inputs | Outputs | Foreign dependency |
|---|---|---|---|
| CLIENT-01 Inventory | repository/current main, roadmaps, architecture, runtime search | `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, current re-correlation evidence | none executed |
| CLIENT-02 Request Contract | target architecture, request requirements, canonical IAM/capability vocabulary | `CLIENT_CONTRACTS.md` request contract | downstream accepts/rejects request |
| CLIENT-03 Identity Handoff | IAM model/`AgentPrincipalContext` | `CLIENT_CONTRACTS.md` identity handoff | CAPITAL-AI-OPS/GOV authoritative IAM/control boundary |
| CLIENT-04 Capability Handoff | canonical `AGENT_CAPABILITIES` vocabulary | `CLIENT_CONTRACTS.md` requested-capability handoff | downstream grant/authorization |
| CLIENT-05 Response Contract | downstream response semantics | `CLIENT_CONTRACTS.md` client status/error/UX mapping | response producer external |
| CLIENT-06 Security Boundary | TB1/TB2, redaction/security policies | `CLIENT_CONTRACTS.md` fail-closed boundary invariants | platform/security decisions external |
| CLIENT-07 Testing & Evidence | all PVC-01 contracts + strangler scan | `evidence/RECORRELATION_2026-09-01.md`; runtime tests deferred until physical slice | repository CI/Human gate |

## Cross-project traceability

The marker remains a compatibility `VC-*` marker; project ownership/routing identity is the explicit `PVC-*` stage.

| Marker | Project stage | Input from PVC-01 | Expected return/evidence | Local state rule |
|---|---|---|---|---|
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]` | `PVC-02` | structured request + attribution + requested capability | authoritative controlled-implementation outcome | never mark foreign execution DONE/VERIFIED |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]` | `PVC-05` | contract/policy decision request | canonical governance decision/authority ref | reference/dependency only |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]` | `PVC-18` | correlation/request IDs + client boundary status | authoritative EventMesh/trace linkage | reference/dependency only |

## Runtime relocation traceability

Current state is intentionally `NO_PHYSICAL_RUNTIME_TRIGGER`. Existing Security/Compliance/Server/Tool/Operations code remains in its current domain. The current contract implementation is project-local documentation in `CLIENT_CONTRACTS.md` and does not add a runtime stack.

| Old path | New PVC-01 path | Adapter | Test/evidence | Removal state |
|---|---|---|---|---|
| _none — no productive PVC-01 runtime path identified_ | _none_ | _n/a_ | `evidence/RECORRELATION_2026-09-01.md` | `NO_RELOCATION` |

If a later refactor introduces physical PVC-01 code, append rows with exact old/new paths, compatibility adapter, test/evidence and removal state.

## Current validation projection

| Validation | Result on source baseline |
|---|---|
| PVC-01 has exactly one declared Primary Owner | `PASS — CAPITAL-AI-CLIENT in canonical project routing` |
| project folder resolves canonically | `PASS — docs/projects/agent-client/` |
| current baseline refreshed | `PASS — main@9be95dd753f962a789312fec77571e2a9778b586` |
| open PR writer at pre-write correlation | `PASS — none found` |
| local execution of PVC-02..PVC-18 | `PASS — none introduced by this branch` |
| direct protected mutation path | `PASS — contract/document slice only; prohibited by contract` |
| parallel Agent Client runtime architecture | `PASS — no physical runtime module introduced` |
| strangler trigger for physical runtime | `NOT TRIGGERED` |
| CLIENT-02..CLIENT-06 contract traceability | `PASS — CLIENT_CONTRACTS.md` |
| CLIENT-07 runtime tests | `NOT APPLICABLE ON THIS SLICE — no physical runtime code introduced` |
| cross-project routing format | `PASS — compatibility VC marker plus explicit PVC project stage` |
| runtime mappings traceable | `PASS — RUNTIME_MAPPING.md` |

These are repository/document correlation results, not hosted CI or runtime verification claims.

## Evidence continuity

- Historical initial baseline: `evidence/BASELINE_2026-08-31.md`.
- Current re-correlation and strangler decision: `evidence/RECORRELATION_2026-09-01.md`.
- Any future physical implementation must add exact base/head SHA, concrete code path, executed test result and compatibility/removal state.
