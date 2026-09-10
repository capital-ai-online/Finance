# CAPITAL-AI-CLIENT — Traceability

**Baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
**Correlation date:** `2026-09-10`  
**Project stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`

## Authority traceability

| Requirement | Authority/source | CAPITAL-AI-CLIENT projection |
|---|---|---|
| Trust root | `/AGENTS.md` Control Plane 2.9.0 | repository lifecycle, exact PR-create approval and Human/CODEOWNER merge remain controlling |
| project ownership | `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | PVC-01 owned by CAPITAL-AI-CLIENT |
| project work priority | `docs/projects/agent-client/ROADMAP.md` | CLIENT-08 is the active bounded work item after PR #858 |
| AI Client position | AI Agent target architecture | PVC-01 owns client request/response edge |
| Human↔Client boundary | AI Agent trust boundary TB1 | OWNED |
| Client↔Control boundary | TB2 | SHARED; client side only |
| attributable principal semantics | IAM model / `AgentPrincipalContext` | CONSUMER |
| capability vocabulary | `src/platform/Security/agentIam.ts` | requested capability only |
| authorization decision | `evaluateAgentAuthorization` | NOT-CLIENT |
| provider neutrality / external skill input | ESS-0019 v1.2.0 | metadata/content is untrusted; no elevation or remote-skill activation |
| project-skill/plugin invocation | `CLIENT_CONTRACTS.md` CLIENT-08 | discovery + integrity/freshness validation + invocation request only |
| protected mutation separation | `/AGENTS.md` + downstream control/execution authorities | no direct client mutation path |
| ADR-0104 conditional session | ADR-0104 v1.5.0 | conditional partial supersession only when an ACTIVE exact-chat activation is evidenced; none is evidenced for this correlation, so normal exact PR-create approval applies |
| folder-to-PVC routing | `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | external metadata cannot override project/PVC/Owner routing |

## Workstream traceability

| Workstream | Inputs | Current output | Foreign dependency |
|---|---|---|---|
| CLIENT-01 Inventory / re-correlation | current main, project mapping, architecture, runtime search | PR #858 Human-merged; post-merge baseline re-correlated | none executed |
| CLIENT-02 Request Contract | architecture + canonical IAM/capability semantics | `CLIENT_CONTRACTS.md` request contract | downstream accepts/rejects |
| CLIENT-03 Identity Handoff | `AgentPrincipalContext` | `CLIENT_CONTRACTS.md` identity handoff | authoritative IAM/control boundary |
| CLIENT-04 Capability Handoff | canonical capability vocabulary | requested-capability handoff | downstream grant/authorization |
| CLIENT-05 Response Contract | downstream response semantics | status/error/UX contract | response producer external |
| CLIENT-06 Security Boundary | trust boundaries + security policies | fail-closed client invariants | Security/Governance decisions external |
| CLIENT-07 Tests/Evidence | all PVC-01 contracts + scan | historical evidence retained; PR #858 class-D hosted checks passed; runtime tests deferred | hosted CI/Human merge gate |
| CLIENT-08 Project Skill / Plugin Contract | canonical PVC mapping + ESS-0019 + reuse/SOTA advisory | provider-neutral discovery/provenance/integrity/freshness/invocation-request contract in `CLIENT_CONTRACTS.md` | OPS persistent execution and GOV authority changes remain foreign |

## CLIENT-08 contract traceability

| Contract concern | Canonical input | CLIENT behavior | Prohibited inference |
|---|---|---|---|
| project routing | `docs/projects/README.md` + `PROJECT_VALUE_CHAIN.md` | derive project/folder/PVC/Owner locally | remote metadata cannot reroute ownership |
| requested capability | `AGENT_CAPABILITIES` / `isKnownAgentCapability` | express one requested capability | request is not grant |
| skill/tool identity | exact source + skill/tool ID + immutable version/revision | preserve exact selected identity | mutable alias alone is insufficient for protected invocation |
| provenance/integrity | source/publisher/revision/digest/verification evidence | verify identity binding where required and preserve evidence | integrity is not safety or authorization |
| freshness | observed time + bounded source freshness hint | reuse only within valid scope/time; otherwise refresh | stale cache is not current evidence |
| risk/tool annotations | external metadata/MCP-style hints | preserve as untrusted advisory context | hint is not enforcement or permission |
| credentials | execution host/connector | keep credentials outside client envelope | client never stores/relays reusable privileged secrets |
| invocation | CLIENT-02 request envelope + exact skill identity | produce downstream invocation request | discovery is not activation/execution |
| result | authoritative downstream response | preserve DENY/BLOCKED/error/success semantics | client cannot rewrite failure into success |

## Cross-project traceability

| Target | Project stage | Input from PVC-01 | Expected return | Local state |
|---|---|---|---|---|
| `CAPITAL-AI-OPS` | `PVC-02` and applicable OPS stages | structured invocation request/contract | authoritative controlled/persistent execution outcome where separately authorized | `DEPENDENCY_ONLY` |
| `CAPITAL-AI-GOV` | `PVC-05` | material authority/architecture decision request | canonical governance decision | `DEPENDENCY_ONLY` |
| `CAPITAL-AI-OPS` | `PVC-08` | approved production-operation request | authoritative production outcome | `DEPENDENCY_ONLY` |
| `CAPITAL-AI-OPS` | `PVC-18` | request/correlation IDs + client status boundary | authoritative trace/event linkage | `DEPENDENCY_ONLY` |

Withdrawn post-PVC handoff overlays are not used as current routing authority.

## Runtime relocation traceability

Current state: `NO_PHYSICAL_RUNTIME_TRIGGER`. Existing Security/Compliance/Server/Tool/Operations code remains in its current domain. CLIENT-08 changes documentation/contracts only and adds no runtime adapter, remote-skill loader, registry, workflow or credential path.

| Old path | New PVC-01 path | Adapter | Test/evidence | Removal state |
|---|---|---|---|---|
| _none — no productive PVC-01 runtime path identified_ | _none_ | _n/a_ | current active-doc correlation + historical evidence under `evidence/` | `NO_RELOCATION` |

## Current validation projection

| Validation | Result |
|---|---|
| PVC-01 has exactly one Primary Owner | `PASS — CAPITAL-AI-CLIENT` |
| canonical project folder | `PASS — docs/projects/agent-client/` |
| current baseline at CLIENT-08 branch start | `PASS — main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42` |
| PR #858 | `PASS — Human-merged; merge commit is CLIENT-08 branch baseline` |
| open Pull Requests before CLIENT-08 branch creation | `PASS — none` |
| retained CLIENT work claim | `PASS — released / exclusive:false / not an active writer` |
| CLIENT-08 branch | `PASS — agent/agent-client-client08-skill-invocation-20260910 created exactly from current main` |
| local execution of PVC-02..PVC-18 | `PASS — none introduced` |
| direct protected mutation path | `PASS — prohibited by contract` |
| connector/plugin/MCP installation or permission mutation | `PASS — none performed` |
| remote skill activation | `PASS — none performed or authorized` |
| parallel skill registry/control plane | `PASS — none introduced` |
| physical Agent Client runtime | `PASS — none introduced` |
| physical strangler trigger | `NOT TRIGGERED` |
| CLIENT-08 contract | `PASS — defined in CLIENT_CONTRACTS.md; documentation-only validation pending final diff/correlation` |
| CLIENT-08 runtime tests | `N/A — no physical runtime code introduced` |

These are repository/document correlation results, not hosted CI or runtime PASS claims.

## Evidence continuity

- `evidence/BASELINE_2026-08-31.md` remains historical initial evidence.
- `evidence/RECORRELATION_2026-09-01.md` remains historical PR #693-era re-correlation/strangler evidence.
- PR #693 is the merged CLIENT contract/evidence baseline.
- PR #858 is the Human-merged current-document re-correlation baseline for CLIENT-08.
- PR #691 is merged foreign OPS evidence for M10 retirement.
- Historical unmerged attempt PR #668 remains non-authorizing GitHub evidence.
- Any future physical implementation must add then-current main/branch-head SHA, concrete code path, executed tests and compatibility/removal state.
