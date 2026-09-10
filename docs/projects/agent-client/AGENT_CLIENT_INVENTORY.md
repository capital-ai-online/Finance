# CAPITAL-AI-CLIENT — Agent Client Inventory

**Baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
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
| `docs/projects/README.md` + `PROJECT_VALUE_CHAIN.md` | canonical project/folder/PVC/Primary-Owner mapping | `CONSUMER` | derive CLIENT-08 routing context; never duplicate | repository organization |
| `CLIENT_CONTRACTS.md` CLIENT-08 | provider-neutral project-skill/plugin/tool discovery + invocation request | `OWNED CONTRACT` | document non-authorizing semantics only | no runtime/provider mutation |
| `.ai/contracts/development-chain-mutation-handoff.schema.json` | mutation handoff | `CONSUMER` | downstream handoff only | CAPITAL-AI-OPS |

## Current repository-wide scan

Current correlation against `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42` resolves:

1. PR #858 is Human-merged and its merge commit is the CLIENT-08 branch baseline.
2. Immediately before CLIENT-08 branch creation there were zero open Pull Requests and no existing `agent-client` work branch; the scoped branch `agent/agent-client-client08-skill-invocation-20260910` was created exactly from current main.
3. The retained CLIENT work claim `CAPITAL-AI-CLIENT-CONTRACT-BASELINE-R2-2026-09-01` remains `released` and `exclusive: false`; it is not an active writer.
4. No dedicated productive `AgentClient` runtime module is found.
5. `requestedCapability` is found only in CLIENT documentation/contract/claim material, not in productive runtime code.
6. Named logical components such as `AgentClientRequestBuilder`, `AgentClientResponseAdapter` and `AgentClientStatusModel` are found only in CLIENT documentation.
7. `AgentPrincipalContext` and the canonical capability vocabulary remain implemented in `src/platform/Security/agentIam.ts`.
8. `evaluateAgentAuthorization` remains productive downstream authorization logic and is not client-owned request construction.
9. Similar Systemadmin/Operations principal builders remain foreign execution-host code and do not establish a PVC-01 refactor target.
10. ESS-0019 defines remote skill/tool content as untrusted and does not enable productive remote skill loading.
11. Repository reuse discovery found no existing separate CLIENT runtime/skill registry that should be adopted; CLIENT-08 therefore extends the existing CLIENT contract surface instead of adding a new registry or execution plane.
12. No productive request, identity/capability, response/status or remote-skill invocation duplication currently satisfies the physical strangler trigger.

## CLIENT-08 reuse decision

CLIENT-08 reuses existing repository structures rather than creating new authority or runtime:

- canonical project/PVC mapping for project selection and ownership;
- existing CLIENT-02 request/correlation envelope semantics;
- canonical IAM capability vocabulary for requested capability;
- ESS-0019 untrusted external skill/tool-content and remote-loading boundary;
- existing execution hosts/connectors for credentials and provider-specific authorization where separately available and authorized.

External MCP/plugin/tool metadata is normalized only as untrusted discovery/provenance input. Tool annotations, provider/model labels and successful discovery never establish authorization or trust.

## Conclusion

- Mature IAM/control architecture already exists; CAPITAL-AI-CLIENT must not create a parallel authorization stack.
- No physical Agent Client runtime module is justified on this baseline.
- `NO_PHYSICAL_RUNTIME_TRIGGER` remains the controlling relocation decision.
- CLIENT-02 through CLIENT-06 and CLIENT-08 use `CLIENT_CONTRACTS.md` as the provider-neutral project contract.
- CLIENT-08 is implemented as documentation/contract semantics only; it activates no remote skill/plugin/MCP integration and creates no persistent execution path.
- Persistent Skill Market Sync remains a foreign CAPITAL-AI-OPS dependency; material authority changes remain CAPITAL-AI-GOV/PVC-05 work.
- A future physical client slice requires a concrete productive consumer/duplication trigger and exact-head contract tests.

## Ownership migration rule

If a future source roadmap contains work exclusively owned by request construction, identity/capability handoff, project-skill invocation-request construction, response/status/error handling or Agent Client UX, its operational state moves here. Mixed tasks remain split logically and foreign productive work is routed by canonical project/PVC ownership rather than executed locally.
