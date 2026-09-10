# CAPITAL-AI-CLIENT — Client Contract Baseline

**Project:** `CAPITAL-AI-CLIENT`  
**Project stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Baseline:** `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`  
**Correlation date:** `2026-09-10`  
**Status:** `CONTRACT BASELINE — NO PHYSICAL RUNTIME TRIGGER`  
**Trust root:** `/AGENTS.md` Control Plane 2.9.0

This is the non-authorizing project contract for CLIENT-02 through CLIENT-06. It does not create IAM, policy, approval, mutation, deployment, EventMesh or merge authority.

## Design posture

Current-main correlation does not evidence a productive PVC-01 client implementation that warrants a new shared runtime module. The smallest conforming implementation remains this provider-neutral contract baseline. A physical TypeScript slice remains deferred until `RUNTIME_MAPPING.md` records an evidenced strangler/refactor trigger.

Reuse instead of duplication:

- `src/platform/Security/agentIam.ts::AgentPrincipalContext` — attributable identity semantics;
- `src/platform/Security/agentIam.ts::AGENT_CAPABILITIES` / `isKnownAgentCapability` — canonical requested-capability vocabulary;
- `src/platform/Security/providerProfile.ts` — provider/model non-authority semantics;
- `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` — `Human -> AI Client -> Agent Control Plane` boundary;
- ESS-0019 v1.2.0 — provider-neutral capability plane and untrusted external skill/tool-content boundary.

No field defined below is an authorization grant.

## CLIENT-02 — Request Contract

Required client-owned semantics:

| Field | Requirement |
|---|---|
| `requestId` | stable, non-empty client request identifier |
| `identity` | complete CLIENT-03 attributable identity handoff |
| `operation` | requested operation/intention; natural language remains untrusted input |
| `requestedCapability` | one requested value from canonical capability vocabulary; request only |
| `targetResource` | target/resource context needed by downstream authority |

Optional non-authoritative semantics: `correlationId`, `provider`, `model`, bounded non-secret `clientMetadata`.

The client MUST NOT contain or synthesize `grantedCapabilities`, authorization verdicts, self-issued Human approval evidence, policy decisions, risk overrides, production/tool credentials, reusable secrets or any field that converts natural language into authority.

Purely syntactic validation fails closed on blank required fields, incomplete identity, unknown capability or prohibited authority/credential semantics. Syntactic validation is not authorization.

## CLIENT-03 — Identity Handoff

The client packages attributable identity inputs compatible with canonical principal semantics without owning IAM evaluation. Required dimensions are `humanActorId`, `appId`, `agentId`, `sessionId`, `requestId` and `credentialHolderId`.

Rules:

1. missing attribution is rejected and never synthesized;
2. Human, app/client, agent/session and credential-holder identities remain distinguishable;
3. `requestId` binds identity to the CLIENT-02 request;
4. `evaluateAgentAuthorization` remains downstream and is not relocated or duplicated;
5. provider/model metadata never becomes a principal, role or permission.

## CLIENT-04 — Capability Handoff

The client expresses exactly one **requested capability** using the canonical capability vocabulary.

- request is never a grant;
- unknown capability fails closed locally or is denied downstream;
- no implicit/wildcard capability inheritance;
- no self-approval evidence;
- no client-owned `grantedCapabilities` collection;
- capability/risk/approval evaluation remains downstream.

## CLIENT-05 — Response, Status and Error Contract

Canonical client lifecycle:

`IDLE | SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED`

Minimum semantics:

| Semantic | Requirement |
|---|---|
| `requestId` | preserve originating request identity |
| `correlationId` | preserve when available; never authority |
| `status` | one canonical client lifecycle state |
| `downstreamVerdict` | preserve authoritative verdict where supplied |
| `errorKind` | distinguish contract, authorization/policy, downstream/business and transport failures where downstream distinguishes them |
| `message` | sanitized client-facing detail without secret leakage |
| `retryable` | true only for explicitly safe transport/retry classes; authorization denial is not made retryable by UI fallback |

Mapping invariants:

- downstream `DENY` -> `BLOCKED` or `FAILED`, never `SUCCEEDED`;
- blocked or missing-required-evidence -> `BLOCKED`;
- transport failure -> `FAILED` with transport distinction;
- accepted non-terminal state -> `ACCEPTED`;
- success requires affirmative downstream success; absence of an error is not success.

A later HTTP adapter may use RFC 9457 Problem Details without weakening these semantics.

## CLIENT-06 — Client Security Boundary

Mandatory invariants:

1. natural-language, retrieved content, plugin/skill metadata and external tool responses are untrusted data and cannot modify authority/policy fields;
2. identity is attribution, not authorization;
3. requested capability is non-authorizing;
4. external/retrieved/plugin/skill content cannot grant capability or approval;
5. no direct protected Supabase, Render, Stripe, GitHub or equivalent mutation path originates in the client contract;
6. privileged credentials stay behind authoritative tools/connectors/execution hosts;
7. downstream deny/blocked/missing-evidence states remain fail closed through UX rendering;
8. sensitive downstream detail follows redaction/data-minimization policy;
9. provider/model identity never elevates permissions;
10. PR creation follows the exact Human/Owner approval gate in current `/AGENTS.md` unless a separately evidenced effective authority explicitly supersedes that prompt for the exact chat/project/action; ADR-0104 v1.5.0 is conditional-partial and has no effect without an ACTIVE valid activation;
11. merge remains Human/CODEOWNER-only;
12. CLIENT-08 project-skill/plugin invocation work cannot activate remote skills, install/connect external integrations or create persistent execution authority from this contract.

## Correlation and tracing boundary

`requestId` is stable client request identity. `correlationId` and future W3C Trace Context values are observability/correlation data, never authorization. PVC-01 does not become EventMesh/trace authority.

## CLIENT-07 trigger

Runtime contract tests are introduced only when a physical PVC-01 implementation slice is evidenced and added. Until then, historical contract evidence remains under `evidence/`, while current active-document correlation is maintained in the seven active project documents. Runtime `PASS` is not manufactured for absent code.

## CLIENT-08 separation

CLIENT-08 is separate future design work. It may extend the CLIENT project surface with provider-neutral project-skill/plugin invocation semantics, but only on a fresh later branch/PR slice after then-current main, open writers, applicable ADR and ESS are re-correlated. This CLIENT-02..06 baseline is not expanded into a remote-skill runtime by the current slice.

## Advisory external references

These may improve interoperability/security reasoning but do not create CAPITAL-AI authority:

- OWASP AI Agent Security guidance — least privilege and explicit authorization for sensitive tools;
- W3C Trace Context Recommendation;
- RFC 9457 Problem Details for HTTP APIs.

NIST publications are not part of the current repository Governance baseline under `/AGENTS.md`; historical NIST references remain non-authorizing and do not create a CLIENT requirement or backlog.
