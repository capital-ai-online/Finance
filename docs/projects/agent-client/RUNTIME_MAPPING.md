# CAPITAL-AI-CLIENT — Runtime & Architecture Mapping

**Baseline:** `main@896722e55ab1304bd798da6fc8c6f2d9b178a12e`  
**Correlation date:** `2026-09-21`  
**Project stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`

## Migration posture

`logical-ownership-before-physical-relocation`

CLIENT-08 changes project contracts only. No productive code is moved, no client runtime module is introduced, and existing imports/runtime/downstream authority stay in place. Historical strangler evidence remains under `evidence/`; current runtime-trigger status is maintained in this active mapping and `ROADMAP.md`.

## Current-to-PVC-01 mapping

| Current artifact | Role | PVC-01 relationship | Action now |
|---|---|---|---|
| AI Agent target architecture | Human -> AI Client -> Agent Control Plane | canonical architecture input | retain/reference |
| AI Agent trust boundaries TB1/TB2 | client trust/handoff boundaries | `OWNED / SHARED` | retain/reference |
| `AgentPrincipalContext` | principal semantics | `CONSUMER` | retain in Security |
| `AGENT_CAPABILITIES` / `isKnownAgentCapability` | capability vocabulary | `CONSUMER` | reuse; do not duplicate |
| `evaluateAgentAuthorization` | authorization decision | `NOT-CLIENT` | retain downstream |
| `providerProfile.ts` | provider/model security semantics | `CONSUMER` | retain downstream |
| `PolicyGate.ts` | policy decision integration | `NOT-CLIENT` | retain downstream |
| `authorizedAgentExecution.ts` | controlled execution/audit | `NOT-CLIENT` | retain downstream |
| `src/services/agentTools/**` | tool adapters | `NOT-CLIENT` | no local execution ownership |
| `scripts/systemadmin/**` principal/request builders | Operations execution host | `NOT-CLIENT` | foreign; no local refactor |
| ESS-0019 remote-skill semantics | external skill/tool metadata is untrusted; remote loading not enabled | `CONSUMER` | CLIENT-08 consumes contract only; no activation/runtime introduced |
| `CLIENT_CONTRACTS.md` CLIENT-08 | project-skill/plugin/tool discovery + invocation-request contract | `OWNED CONTRACT` | documentation semantics only; no physical adapter |
| root landing `/`, merged #1195/#1206 and open #1209 | established landing/presentation plus remaining desktop stabilization | `FOREIGN PRESENTATION / POTENTIAL FUTURE CONSUMER` | landing existence is satisfied; no PVC-01 runtime trigger is created by presentation work |

## Target logical components

Their concrete non-runtime contract remains [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical module is introduced only after an evidenced productive trigger.

| Logical component | Responsibility | Must not contain |
|---|---|---|
| `AgentClientRequestBuilder` | construct stable request envelope | authorization decision, credentials |
| `AgentClientIdentityHandoff` | package attributable identity | role/grant invention |
| `AgentClientCapabilityHandoff` | express requested capability | grant/elevation |
| `AgentClientResponseAdapter` | preserve authoritative response/deny/error | fail-open success rewriting |
| `AgentClientStatusModel` | client lifecycle state | downstream execution ownership |
| `AgentClientUxContract` | render request/blocked/success/failure | hidden protected mutation path |
| `ProjectSkillInvocationContract` | logical discovery/provenance/invocation-request semantics | remote loader, credential store, policy engine, registry authority |

`ProjectSkillInvocationContract` above is a logical documentation contract name only. It is not evidence of a TypeScript/runtime component and does not authorize one.

## Strangler/refactor trigger

Physical migration is permitted only if at least one is evidenced:

- duplicate productive client request construction in two or more paths;
- inconsistent productive identity/capability handoff causing drift;
- duplicated productive response/status mapping with divergent behavior;
- a concrete productive consumer would reduce duplication through a shared client module without importing authority.

### Current-main trigger check — 2026-09-10

| Trigger | Result |
|---|---|
| duplicate productive client request construction | `NOT TRIGGERED` |
| inconsistent productive identity/capability handoff | `NOT TRIGGERED` |
| duplicated divergent response/status mapping | `NOT TRIGGERED` |
| evidenced productive duplication reduced by shared client module | `NOT TRIGGERED` |
| productive `requestedCapability` client implementation | `NOT FOUND` |
| physical named Agent Client logical-component implementation | `NOT FOUND` |
| productive remote-skill/plugin invocation implementation | `NOT FOUND / NOT INTRODUCED` |

Current relocation state: `NO_PHYSICAL_RUNTIME_TRIGGER`.

### Landing-First trigger check — 2026-09-21

| Landing trigger | Result |
|---|---|
| Root landing existence on current main | `PASS — #1195/#1206 merged` |
| Remaining visual stabilization | `#1209 DESKTOP-ONLY` |
| current root landing requires a canonical PVC-01 runtime module | `NOT EVIDENCED` |
| merged #1195/#1206 or open #1209 create CLIENT ownership | `NO — FOREIGN FE WORK` |
| landing/presentation state is a CLIENT runtime trigger | `NO — NO_PHYSICAL_RUNTIME_TRIGGER remains` |

The landing-creation prerequisite is satisfied, but the physical-runtime gate remains unsatisfied. CLIENT may preserve its contracts and dependency evidence, but must not create a new landing request/session runtime until a later dependency-ready phase demonstrates a concrete PVC-01 consumer trigger.

Current GitHub code search on the CLIENT-08 branch-start baseline finds `requestedCapability` and named logical CLIENT components only in CLIENT documentation/contract/claim material. `src/platform/Security/agentIam.ts` remains the productive principal/capability/authorization surface. Creating an unconsumed Agent Client runtime or remote-skill loader now would therefore be parallel implementation rather than strangler/refactor.

## CLIENT-08 runtime boundary

CLIENT-08 defines provider-neutral discovery, provenance/integrity/freshness and invocation-request semantics only. It does **not** introduce:

- remote skill loading or code execution;
- a skill marketplace/registry service;
- persistent Skill Market Sync;
- MCP server/client runtime code;
- OAuth/token storage or scope changes;
- plugin/app/connector installation, connection or enablement;
- provider/tool credentials;
- policy/authorization evaluation;
- protected mutation execution.

When an already-authorized execution surface exists, a future physical client adapter may only hand an exact invocation request to that surface after an independent productive trigger and then-current architecture/security correlation. Provider-specific protocol mechanics remain adapter concerns and cannot redefine this project contract.

## Prohibited relocation

Do not relocate into PVC-01 solely because the client calls it:

- authorization/policy evaluation;
- approval/step-up verification;
- audit/evidence authority;
- mutation execution;
- provider/tool credentials;
- EventMesh/trace retention;
- deployment/release paths;
- foreign Operations/Systemadmin execution-host code;
- persistent remote-skill or plugin execution infrastructure.

## Trace continuity

Every later physical refactor updates this file with:

`old path -> new path -> compatibility adapter -> tests/evidence -> removal state`.

No old path is removed until current import/reference correlation and exact-head tests prove safe migration.
