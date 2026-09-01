# CAPITAL-AI-CLIENT — Agent Client Inventory

Baseline: `main@9be95dd753f962a789312fec77571e2a9778b586`

Project stage: `PVC-01 — Agent Client`

This inventory classifies existing Agent/roadmap/architecture artifacts by their relationship to PVC-01. Classification does not supersede the authority or historical state of the source document.

| Source | Relevant item | Classification | PVC-01 treatment | Foreign owner / note |
|---|---|---|---|---|
| `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` | `Human -> AI Client -> Agent Control Plane` | `OWNED / SHARED` | Own the AI Client edge and request/response handoff; reuse architecture | Control Plane onward is foreign |
| `docs/architecture/ai-agent/AI_AGENT_TRUST_BOUNDARIES.md` | TB1 Human↔AI Client | `OWNED` | Client UX/input trust boundary | PVC-01 |
| `docs/architecture/ai-agent/AI_AGENT_TRUST_BOUNDARIES.md` | TB2 AI Client↔Control Plane | `SHARED` | Own client-side request/handoff behavior only | downstream authority external |
| `docs/architecture/ai-agent/AI_AGENT_IAM_MODEL.md` | principal attribution model | `CONSUMER` | Package attributable identity inputs; do not authorize | IAM/control authority external |
| `docs/architecture/M4_AGENT_IAM_IMPLEMENTATION_PLAN.md` | principal/capability/risk contracts | `CONSUMER` | Consume vocabulary and boundary; no local IAM execution | control-plane/security implementation external |
| `src/platform/Security/agentIam.ts` | `AgentPrincipalContext`, capability vocabulary, `evaluateAgentAuthorization` | `CONSUMER / NOT-CLIENT` | Reuse types/semantics as handoff contract; do not relocate or duplicate authorization | authorization remains outside PVC-01 |
| `src/platform/Security/providerProfile.ts` | provider-neutral profile semantics | `CONSUMER` | Provider/model metadata remains non-authoritative client metadata | security/control authority external |
| `src/platform/Compliance/PolicyGate.ts` | authorization/policy gate integration | `NOT-CLIENT` | response/deny may be consumed; no policy decision in PVC-01 | governance/control external |
| `server/agentAudit/authorizedAgentExecution.ts` | authorized execution/audit boundary | `NOT-CLIENT` | consume outcome only | controlled implementation/audit external |
| `src/services/agentTools/**` | tool adapters | `NOT-CLIENT` | no local execution ownership | downstream tooling/operations |
| `scripts/systemadmin/runSa4Pilot.mjs` | principal/request construction for controlled execution | `NOT-CLIENT / CONSUMER` | do not refactor locally; may consume a future shared client contract only if owner integration requires it | CAPITAL-AI-OPS |
| `scripts/systemadmin/runWorkPackage.mjs` | principal/request construction for controlled execution | `NOT-CLIENT / CONSUMER` | do not refactor locally; may consume a future shared client contract only if owner integration requires it | CAPITAL-AI-OPS |
| `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md` | universal control-plane authority | `CONSUMER` | PVC-01 conforms to boundary; does not copy authority | control-plane authority external |
| `.ai/contracts/development-chain-mutation-handoff.schema.json` | mutation handoff | `CONSUMER` | downstream handoffs may reference; no mutation authority acquired | DevelopmentChain/operations |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | M4 Agent IAM | `CONSUMER` | identity/capability semantics consumed | implementation external/historical phase status preserved |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | M5 Audit | `NOT-CLIENT` | response/audit correlation may be consumed | foreign PVC |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | M6 Supply Chain | `NOT-CLIENT` | no local execution | foreign PVC |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | M7 Deployment Identity | `NOT-CLIENT` | no local production/deploy execution | foreign PVC |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | M8 Provider-neutral Agent Cutover | `SHARED` | provider-neutral client request/response behavior belongs to PVC-01; cutover/control execution does not | operations/control external |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | M9 Assurance | `NOT-CLIENT / CONSUMER` | client negative-contract tests only where PVC-01-specific | assurance execution external |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | M10 Owner PR authorization | `NOT-CLIENT` | client must not bypass it; no local ownership | Owner/Governance/Operations |
| `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | DevelopmentChain phases | `NOT-CLIENT / CONSUMER` | preserve history/current dependencies; no PVC-01 phase takeover | CAPITAL-AI-OPS/GOV as applicable |
| `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` | DC + Systemadmin execution | `NOT-CLIENT` | no local execution | CAPITAL-AI-OPS |
| `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | Systemadministrator Agent | `NOT-CLIENT` | may consume PVC-01 contract in future; no takeover | CAPITAL-AI-OPS |
| `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` and canonical SEO-GM successor | domain agent work | `NOT-CLIENT / CONSUMER` | domain agents may consume shared client contract only | domain project ownership retained |
| `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` | historical/current agent traceability | `CONSUMER` | source evidence reference; PVC-01 status maintained only in this project | no duplicate status maintenance |

## Current repository-wide scan

Evidence: [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md).

Key findings on `main@9be95dd753f962a789312fec77571e2a9778b586`:

1. No productive `requestedCapability` Agent Client implementation was found.
2. The complete PVC-01 client lifecycle vocabulary exists in the project roadmap/contract surface, not in a productive status adapter.
3. `AgentAuthorizationRequest` consumers are Security/Compliance/server/Documentary/test surfaces; they are downstream/control consumers, not a PVC-01 runtime stack.
4. Similar principal builders were found in Systemadmin/Operations scripts, but those are foreign execution-host code and are not a local refactor target.
5. No productive client request, identity/capability handoff or response/status duplication currently satisfies the strangler trigger.

## Repository-wide conclusion

1. The repository already contains a mature Agent Control/IAM architecture, so CAPITAL-AI-CLIENT must not create a parallel authorization stack.
2. No dedicated productive Agent Client runtime module is justified on the current main baseline. PVC-01 therefore remains contract-first with runtime mappings to existing downstream contracts.
3. CLIENT-02 through CLIENT-06 now have a concrete provider-neutral baseline in `CLIENT_CONTRACTS.md` without introducing runtime authority or duplicated capability definitions.
4. A later client runtime module is created only if a concrete application requirement proves it necessary and `RUNTIME_MAPPING.md` records an evidenced strangler trigger; it must reuse existing canonical identity/capability semantics and avoid embedding authorization decisions.
5. Completed/historical roadmap phases remain untouched. Their client-relevant semantics are referenced rather than re-opened.

## Ownership migration rule

If a source roadmap contains a future task that is exclusively request construction, identity/capability handoff, response/status/error handling or Agent Client UX, its operational status moves to `ROADMAP.md` and the source retains a reference only. Mixed tasks are split logically: only the PVC-01 portion moves; the foreign portion remains with its canonical project and receives a cross-project handoff when action is required.
