# CAPITAL-AI-CLIENT — Agent Client Inventory

**Baseline:** `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`  
**Correlation date:** `2026-09-10`  
**Project stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`

This inventory classifies current Agent/architecture/runtime surfaces by their relationship to PVC-01. Classification does not supersede source authority.

| Source | Relevant item | Classification | PVC-01 treatment | Foreign owner / note |
|---|---|---|---|---|
| `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` | Human -> AI Client -> Agent Control Plane | `OWNED / SHARED` | own client edge/request-response handoff | control plane onward foreign |
| `docs/architecture/ai-agent/AI_AGENT_TRUST_BOUNDARIES.md` TB1 | Human↔AI Client | `OWNED` | client input/UX trust boundary | PVC-01 |
| same TB2 | AI Client↔Control Plane | `SHARED` | own client-side handoff only | downstream authority external |
| `docs/architecture/ai-agent/AI_AGENT_IAM_MODEL.md` | principal attribution | `CONSUMER` | package attribution; do not authorize | IAM/control external |
| `src/platform/Security/agentIam.ts` | `AgentPrincipalContext`, capability vocabulary, `evaluateAgentAuthorization` | `CONSUMER / NOT-CLIENT` | reuse types/semantics; do not relocate authorization | Security/control authority |
| `src/platform/Security/providerProfile.ts` | provider-neutral security profile | `CONSUMER` | provider/model metadata remains non-authoritative | Security/control authority |
| `src/platform/Compliance/PolicyGate.ts` | authorization/policy integration | `NOT-CLIENT` | consume outcome only | Governance/Compliance boundary |
| `server/agentAudit/authorizedAgentExecution.ts` | authorized execution/audit | `NOT-CLIENT` | consume outcome only | Controlled Implementation |
| `src/services/agentTools/**` | tool adapters | `NOT-CLIENT` | no local execution ownership | downstream tooling/operations |
| `scripts/systemadmin/**` principal/request construction | controlled execution host | `NOT-CLIENT / CONSUMER` | do not refactor locally under PVC-01 | CAPITAL-AI-OPS |
| `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md` | ACCEPTED v1.2.0 control-plane contract | `CONSUMER` | conform to boundary; remote skill loading remains disabled | control-plane external |
| `.ai/contracts/development-chain-mutation-handoff.schema.json` | mutation handoff | `CONSUMER` | downstream handoff only | CAPITAL-AI-OPS |

## Current repository-wide scan

Current GitHub code search against `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0` resolves:

1. No dedicated productive `AgentClient` runtime module is found.
2. `requestedCapability` is found only in CLIENT documentation/contract/claim material, not in productive runtime code.
3. Named logical components such as `AgentClientRequestBuilder`, `AgentClientResponseAdapter` and `AgentClientStatusModel` are found only in CLIENT documentation.
4. `AgentPrincipalContext` and the canonical capability vocabulary remain implemented in `src/platform/Security/agentIam.ts`.
5. `evaluateAgentAuthorization` remains productive downstream authorization logic and is not client-owned request construction.
6. Similar Systemadmin/Operations principal builders remain foreign execution-host code and do not establish a PVC-01 refactor target.
7. No productive request, identity/capability or response/status duplication currently satisfies the strangler trigger.
8. PR #693 is merged and remains the CLIENT contract-baseline implementation; PR #691 is merged foreign OPS retirement work; historical PR #668 is closed/unmerged and non-authorizing.
9. Open PR #856 belongs to `CAPITAL-AI-FE`, changes only `src/components/MarkdownOrchestrator.tsx`, and has no changed-file, PVC-ownership or semantic overlap with this CLIENT documentation slice. The retained CLIENT work claim is `released`.

## Conclusion

- Mature IAM/control architecture already exists; CAPITAL-AI-CLIENT must not create a parallel authorization stack.
- No physical Agent Client runtime module is justified on this baseline.
- `NO_PHYSICAL_RUNTIME_TRIGGER` remains the controlling relocation decision.
- CLIENT-02 through CLIENT-06 continue to use `CLIENT_CONTRACTS.md` as the provider-neutral project contract.
- CLIENT-08 remains separate future contract-design work and does not activate remote skills, plugins or a physical client runtime.
- A future physical client slice requires a concrete productive consumer/duplication trigger and exact-head contract tests.

## Ownership migration rule

If a future source roadmap contains work exclusively owned by request construction, identity/capability handoff, response/status/error handling or Agent Client UX, its operational state moves here. Mixed tasks remain split logically and foreign productive work is routed by canonical project/PVC ownership rather than executed locally.
