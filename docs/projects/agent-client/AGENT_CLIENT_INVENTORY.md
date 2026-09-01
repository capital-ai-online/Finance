# CAPITAL-AI-CLIENT — Agent Client Inventory

Baseline: `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`

Project stage: `PVC-01 — Agent Client`

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

## Current repository-wide scan

Evidence: [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md).

Key findings on `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`:

1. No dedicated productive `AgentClient` runtime module was found.
2. No productive `requestedCapability` implementation was found.
3. `AgentPrincipalContext` remains canonical in Security/IAM and is consumed by downstream/control surfaces.
4. `evaluateAgentAuthorization` remains in Security/Compliance/provider/control paths, not client-owned request construction.
5. Similar Systemadmin/Operations principal builders are foreign execution-host code and do not establish a PVC-01 refactor target.
6. No productive request, identity/capability or response/status duplication currently satisfies the strangler trigger.
7. Historical PR #668 is closed/unmerged; its candidate never became current authority or project state.

## Conclusion

- Mature IAM/control architecture already exists; CAPITAL-AI-CLIENT must not create a parallel authorization stack.
- No physical Agent Client runtime module is justified on this baseline.
- CLIENT-02 through CLIENT-06 use `CLIENT_CONTRACTS.md` as the current provider-neutral project contract.
- A future physical client slice requires a concrete productive consumer/duplication trigger and exact-head contract tests.
- Completed/historical source-roadmap phases are referenced rather than reopened.

## Ownership migration rule

If a future source roadmap contains work exclusively owned by request construction, identity/capability handoff, response/status/error handling or Agent Client UX, its operational state moves here. Mixed tasks remain split logically and foreign productive work is handed off rather than executed locally.
