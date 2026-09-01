# CAPITAL-AI-CLIENT — Runtime & Architecture Mapping

Baseline: `main@9be95dd753f962a789312fec77571e2a9778b586`

Project stage: `PVC-01 — Agent Client`

## Migration posture

`logical-ownership-before-physical-relocation`

No productive code is moved by this contract-baseline slice. Existing imports, contracts, tests and runtime behavior remain unchanged. This mapping is the old-to-new ownership reference required before any later strangler/refactor migration.

Current strangler evidence: [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md).

## Current-to-PVC-01 mapping

| Current artifact | Current role | PVC-01 logical relationship | Physical action now | Reason |
|---|---|---|---|---|
| `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` | system architecture | canonical upstream architecture for Agent Client boundary | retain | already defines Human -> AI Client -> Control Plane |
| `docs/architecture/ai-agent/AI_AGENT_TRUST_BOUNDARIES.md` TB1 | Human/client trust boundary | `OWNED` by PVC-01 | retain/reference | normative architecture source remains canonical |
| `docs/architecture/ai-agent/AI_AGENT_TRUST_BOUNDARIES.md` TB2 | client/control handoff | `SHARED` boundary | retain/reference | PVC-01 owns only client side |
| `docs/architecture/ai-agent/AI_AGENT_IAM_MODEL.md` | identity/authorization model | `CONSUMER` | retain/reference | client passes attribution; IAM remains authoritative elsewhere |
| `src/platform/Security/agentIam.ts::AgentPrincipalContext` | principal contract | input semantics consumed by identity handoff | retain in place | moving it would imply Security/IAM ownership transfer |
| `src/platform/Security/agentIam.ts::AGENT_CAPABILITIES` | canonical capability vocabulary | capability request vocabulary consumed by client | retain in place | request does not equal grant |
| `src/platform/Security/agentIam.ts::isKnownAgentCapability` | canonical vocabulary validator | future syntactic client validation may call/reference it | retain in place | avoid duplicated capability enum/validator |
| `src/platform/Security/agentIam.ts::evaluateAgentAuthorization` | deny-by-default authorization | downstream boundary, `NOT-CLIENT` | retain in place | client cannot self-authorize |
| `src/platform/Security/providerProfile.ts` | provider-neutral security profile | client may provide provider/model metadata compatible with contract | retain in place | provider identity is non-authoritative |
| `src/platform/Compliance/PolicyGate.ts` | policy/control decision integration | downstream decision source | retain in place | policy authority outside PVC-01 |
| `server/agentAudit/authorizedAgentExecution.ts` | authorized execution/audit | downstream execution result source | retain in place | Controlled Implementation outside PVC-01 |
| `src/services/agentTools/**` | connector/tool adapters | downstream execution surface | retain in place | tool credentials and mutations stay behind boundary |
| `scripts/systemadmin/runSa4Pilot.mjs` | Operations execution-host principal construction | foreign execution surface; not a PVC-01 productive client path | retain / do not modify locally | CAPITAL-AI-OPS ownership |
| `scripts/systemadmin/runWorkPackage.mjs` | Operations execution-host principal construction | foreign execution surface; not a PVC-01 productive client path | retain / do not modify locally | CAPITAL-AI-OPS ownership |

## Target logical components

The following remain logical PVC-01 components. Their current concrete contract is [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical TypeScript module is introduced only when application code needs it and a strangler/refactor trigger is evidenced.

| Logical component | Responsibility | Must not contain |
|---|---|---|
| `AgentClientRequestBuilder` | construct stable request envelope | authorization decision, secret/tool credential |
| `AgentClientIdentityHandoff` | package attributable identity inputs | role/grant invention, self-approval |
| `AgentClientCapabilityHandoff` | express requested canonical capability | capability grant/elevation |
| `AgentClientResponseAdapter` | preserve authoritative response/deny/error semantics | fail-open success rewriting |
| `AgentClientStatusModel` | client lifecycle/status state | downstream execution ownership |
| `AgentClientUxContract` | render request/blocked/success/failure states | hidden protected mutation path |

## Strangler/refactor trigger

Physical migration is permitted only if at least one of these conditions is evidenced:

- duplicate client request construction exists in two or more productive paths;
- inconsistent identity/capability handoff causes contract drift;
- response/status mapping is duplicated and behavior diverges;
- a dedicated shared client module reduces evidenced productive duplication without importing control-plane authority.

### Current decision on `main@9be95dd753f962a789312fec77571e2a9778b586`

| Trigger | Result |
|---|---|
| duplicate productive client request construction | `NOT TRIGGERED` |
| inconsistent productive identity/capability handoff | `NOT TRIGGERED` |
| duplicated divergent client response/status mapping | `NOT TRIGGERED` |
| evidenced productive duplication reduced by shared client module | `NOT TRIGGERED` |

Current relocation state: `NO_PHYSICAL_RUNTIME_TRIGGER`.

Repository searches found canonical IAM/control consumers, Operations/Systemadmin principal builders and tests, but no productive PVC-01 request/status implementation requiring extraction. Creating an unconsumed Agent Client runtime module now would be a parallel implementation rather than a strangler/refactor.

When a trigger is later met, the new client-owned implementation must be introduced behind stable interfaces and consumers migrated incrementally. The old path is removed only after contract tests and runtime behavior prove equivalence.

## Prohibited relocation

The following are not candidates for relocation into CAPITAL-AI-CLIENT solely because they are called by a client:

- authorization evaluation;
- policy gates;
- approval/step-up verification;
- audit writer/authoritative evidence store;
- mutation executor;
- provider/tool credentials;
- EventMesh/trace retention;
- production deployment or release paths;
- foreign Operations/Systemadmin execution-host code.

## Trace continuity

Every later physical refactor updates this file with:

`old path -> new path -> compatibility adapter (if any) -> tests -> evidence -> removal state`.

No old path may be deleted until import/reference correlation proves that no productive consumer is orphaned.
