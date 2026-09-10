# CAPITAL-AI-CLIENT — Runtime & Architecture Mapping

**Baseline:** `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`  
**Correlation date:** `2026-09-10`  
**Project stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`

## Migration posture

`logical-ownership-before-physical-relocation`

No productive code is moved by the current correlation-hygiene slice. Existing imports, runtime behavior and downstream authority stay in place. Historical strangler evidence remains under `evidence/`; current runtime-trigger status is maintained in this active mapping and `ROADMAP.md`.

## Current-to-PVC-01 mapping

| Current artifact | Role | PVC-01 relationship | Action now |
|---|---|---|---|
| AI Agent target architecture | Human -> AI Client -> Control Plane | canonical architecture input | retain/reference |
| AI Agent trust boundaries TB1/TB2 | client trust/handoff boundaries | `OWNED / SHARED` | retain/reference |
| `AgentPrincipalContext` | principal semantics | `CONSUMER` | retain in Security |
| `AGENT_CAPABILITIES` / `isKnownAgentCapability` | capability vocabulary | `CONSUMER` | reuse; do not duplicate |
| `evaluateAgentAuthorization` | authorization decision | `NOT-CLIENT` | retain downstream |
| `providerProfile.ts` | provider/model security semantics | `CONSUMER` | retain downstream |
| `PolicyGate.ts` | policy decision integration | `NOT-CLIENT` | retain downstream |
| `authorizedAgentExecution.ts` | controlled execution/audit | `NOT-CLIENT` | retain downstream |
| `src/services/agentTools/**` | tool adapters | `NOT-CLIENT` | retain downstream |
| `scripts/systemadmin/**` principal/request builders | Operations execution host | `NOT-CLIENT` | foreign; no local refactor |
| ESS-0019 remote-skill semantics | external skill/tool metadata is untrusted; remote loading not enabled | `CONSUMER` | no activation/runtime introduced |

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

Current relocation state: `NO_PHYSICAL_RUNTIME_TRIGGER`.

Current GitHub code search finds `requestedCapability` and the named logical components only in CLIENT documentation/contract/claim material. `src/platform/Security/agentIam.ts` remains the productive principal/capability/authorization surface. Creating an unconsumed Agent Client runtime module now would therefore be parallel implementation rather than strangler/refactor.

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

## CLIENT-08 separation

CLIENT-08 may define provider-neutral project-skill/plugin invocation semantics in a later separate fresh branch/PR slice. It does not itself satisfy the physical-runtime trigger and must not introduce remote skill activation, a second routing registry, persistent execution jobs or client-held privileged credentials.

## Trace continuity

Every later physical refactor updates this file with:

`old path -> new path -> compatibility adapter -> tests/evidence -> removal state`.

No old path is removed until current import/reference correlation and exact-head tests prove safe migration.
