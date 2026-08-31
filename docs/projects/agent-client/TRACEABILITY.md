# CAPITAL-AI-CLIENT — Traceability

Baseline: `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## Authority traceability

| Requirement | Authority/source | CAPITAL-AI-CLIENT projection |
|---|---|---|
| Trust root | `AGENTS.md` | all work/PR/merge gates remain external Human/Owner governed |
| AI Client position | `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` | VC-01 owns AI Client request/response edge |
| Human↔Client boundary | `docs/architecture/ai-agent/AI_AGENT_TRUST_BOUNDARIES.md` TB1 | OWNED |
| Client↔Control boundary | same, TB2 | SHARED; client side only |
| attributable principal semantics | `docs/architecture/ai-agent/AI_AGENT_IAM_MODEL.md`, `src/platform/Security/agentIam.ts` | CONSUMER; identity handoff only |
| capability vocabulary | `src/platform/Security/agentIam.ts` | CONSUMER; capability request only |
| authorization decision | `src/platform/Security/agentIam.ts::evaluateAgentAuthorization` | NOT-CLIENT |
| provider neutrality | IAM/provider-profile/ESS-0019 sources | metadata compatibility; no authority elevation |
| protected mutation separation | DevelopmentChain + Human/Owner governance | client creates no direct mutation path |
| roadmap portfolio | `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | VC-01 canonical roadmap referenced from portfolio |

## Workstream traceability

| Workstream | Inputs | Outputs | Foreign dependency |
|---|---|---|---|
| CLIENT-01 Inventory | repository/main, roadmaps, architecture, runtime search | `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md` | none executed |
| CLIENT-02 Request Contract | target architecture, request requirements | future client request schema/module if needed | downstream accepts/rejects request |
| CLIENT-03 Identity Handoff | IAM model/principal contract | client identity handoff | CAPITAL-AI-OPS/GOV authoritative IAM/control boundary |
| CLIENT-04 Capability Handoff | canonical capability vocabulary | requested-capability handoff | downstream grant/authorization |
| CLIENT-05 Response Contract | downstream response semantics | client status/error/UX mapping | response producer external |
| CLIENT-06 Security Boundary | TB1/TB2, redaction/security policies | negative boundary tests/evidence | platform/security decisions external |
| CLIENT-07 Testing & Evidence | all VC-01 contracts | commit-bound tests/evidence | repository CI/Human gate |

## Cross-project traceability

| Marker | Input from VC-01 | Expected return/evidence | Local state rule |
|---|---|---|---|
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]` | structured request + attribution + requested capability | authoritative controlled-implementation outcome | never mark foreign execution DONE/VERIFIED |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]` | contract/policy decision request | canonical governance decision/authority ref | reference only |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]` | correlation/request IDs + client boundary status | authoritative EventMesh/trace linkage | reference only |

## Runtime relocation traceability

Current state is intentionally `NO_PHYSICAL_RELOCATION`. Existing Security/Compliance/Server/Tool code remains in its current domain. If a later refactor introduces physical VC-01 code, append rows here:

| Old path | New VC-01 path | Adapter | Test/evidence | Removal state |
|---|---|---|---|---|
| _none on baseline_ | _none_ | _n/a_ | baseline documents only | `NO_RELOCATION` |

## Validation projection

| Validation | Baseline result |
|---|---|
| VC-01 has exactly one declared Primary Owner | `PASS — CAPITAL-AI-CLIENT in canonical project docs` |
| local execution of VC-02..VC-18 | `PASS — none introduced by this branch` |
| direct protected mutation path | `PASS — documentation-only branch; prohibited by contract` |
| parallel Agent Client architecture | `PASS — existing architecture reused; no new runtime stack` |
| cross-project references complete | `PASS — required VC-02, VC-05, VC-18 handoffs recorded` |
| runtime mappings traceable | `PASS — RUNTIME_MAPPING.md` |

These are consolidation-document validation results, not runtime/CI verification claims.