# CAPITAL-AI-CLIENT — Agent Client Inventory

Baseline: `main@eee9a8af3f3d2532a213154dd61f678454a2200b`  
Correlation date: `2026-09-07`

Project stage: `PVC-01 — Agent Client`  
Primary Owner: `CAPITAL-AI-CLIENT`

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
| `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md` | control-plane contract | `CONSUMER` | conform to boundary; do not copy authority | control-plane external |
| `.ai/contracts/development-chain-mutation-handoff.schema.json` | mutation handoff | `CONSUMER` | downstream handoff only | CAPITAL-AI-OPS |

## Current repository-wide correlation

Historical scan evidence is preserved in [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md). It remains evidence, not current policy. The active project surface was refreshed against `main@eee9a8af3f3d2532a213154dd61f678454a2200b` on 2026-09-07.

Current findings:

1. Canonical organizational ownership resolves `CAPITAL-AI-CLIENT -> docs/projects/agent-client/ -> PVC-01 -> CAPITAL-AI-CLIENT`.
2. There were `0` open Pull Requests at correlation time; no active CLIENT branch writer was found.
3. The historical CLIENT contract-baseline work claim is `released` and therefore is not an active writer.
4. Current code search finds no productive `requestedCapability` client implementation; matches are project documentation/contracts or historical coordination metadata.
5. Current code search finds no physical `AgentClientRequestBuilder` or `AgentClientStatusModel` runtime component; those names remain logical/documentation contracts only.
6. `AgentPrincipalContext` remains canonical in Security/IAM and is consumed by downstream/control surfaces.
7. `evaluateAgentAuthorization` remains outside client-owned request construction.
8. Similar Systemadmin/Operations principal builders remain foreign execution-host code and do not establish a PVC-01 refactor target.
9. No current evidence changes the strangler decision; `NO_PHYSICAL_RUNTIME_TRIGGER` remains in force.
10. Historical PR #668 remains closed/unmerged and non-authorizing; merged PR #693 remains the CLIENT contract/evidence baseline and merged foreign PR #691 is not an active parallel writer.

## Conclusion

- Mature IAM/control architecture already exists; CAPITAL-AI-CLIENT must not create a parallel authorization stack.
- No physical Agent Client runtime module is justified on the current baseline.
- CLIENT-02 through CLIENT-06 use `CLIENT_CONTRACTS.md` as the current provider-neutral project contract.
- A future physical client slice requires a concrete productive consumer/duplication trigger and exact-head contract tests.
- Historical source-roadmap phases and evidence are retained as history rather than rewritten as current authority.

## Ownership migration rule

If a future source roadmap contains work exclusively owned by request construction, identity/capability handoff, response/status/error handling or Agent Client UX, its operational state moves here. Mixed tasks remain split logically and foreign productive work is routed to its canonical Primary Owner rather than executed locally.
