# CAPITAL-AI-CLIENT — Runtime & Architecture Mapping

Baseline: `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`

Project stage: `PVC-01 — Agent Client`

## Migration posture

`logical-ownership-before-physical-relocation`

No productive code is moved by this contract-baseline slice. Existing imports, runtime behavior and downstream authority stay in place. Current strangler evidence: [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md).

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

## Target logical components

Their current concrete contract is [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical module is introduced only after an evidenced productive trigger.

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

### Current decision

| Trigger | Result |
|---|---|
| duplicate productive client request construction | `NOT TRIGGERED` |
| inconsistent productive identity/capability handoff | `NOT TRIGGERED` |
| duplicated divergent response/status mapping | `NOT TRIGGERED` |
| evidenced productive duplication reduced by shared client module | `NOT TRIGGERED` |

Current relocation state: `NO_PHYSICAL_RUNTIME_TRIGGER`.

Repository searches find canonical IAM/control consumers and foreign Operations/Systemadmin execution-host builders, but no productive PVC-01 request/status implementation requiring extraction. Creating an unconsumed Agent Client runtime module now would be parallel implementation rather than strangler/refactor.

## Prohibited relocation

Do not relocate into PVC-01 solely because the client calls it:

- authorization/policy evaluation;
- approval/step-up verification;
- audit/evidence authority;
- mutation execution;
- provider/tool credentials;
- EventMesh/trace retention;
- deployment/release paths;
- foreign Operations/Systemadmin execution-host code.

## Trace continuity

Every later physical refactor updates this file with:

`old path -> new path -> compatibility adapter -> tests/evidence -> removal state`.

No old path is removed until current import/reference correlation and exact-head tests prove safe migration.
