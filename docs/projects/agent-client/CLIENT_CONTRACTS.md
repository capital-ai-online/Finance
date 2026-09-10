# CAPITAL-AI-CLIENT — Client Contract Baseline

**Project:** `CAPITAL-AI-CLIENT`  
**Project stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
**Correlation date:** `2026-09-10`  
**Status:** `CLIENT-02..06 BASELINE + CLIENT-08 PROJECT SKILL / PLUGIN INVOCATION CONTRACT — NO PHYSICAL RUNTIME TRIGGER`  
**Trust root:** `/AGENTS.md` Control Plane 2.9.0

This is the non-authorizing project contract for CLIENT-02 through CLIENT-06 and CLIENT-08. It does not create IAM, policy, approval, mutation, deployment, EventMesh or merge authority.

## Design posture

Current-main correlation does not evidence a productive PVC-01 client implementation that warrants a new shared runtime module. The smallest conforming implementation remains this provider-neutral contract baseline. A physical TypeScript slice remains deferred until `RUNTIME_MAPPING.md` records an evidenced strangler/refactor trigger.

Reuse instead of duplication:

- `src/platform/Security/agentIam.ts::AgentPrincipalContext` — attributable identity semantics;
- `src/platform/Security/agentIam.ts::AGENT_CAPABILITIES` / `isKnownAgentCapability` — canonical requested-capability vocabulary;
- `src/platform/Security/providerProfile.ts` — provider/model non-authority semantics;
- `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` — `Human -> AI Client -> Agent Control Plane` boundary;
- `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md` — canonical project/folder/PVC/Primary-Owner mapping;
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

---

## CLIENT-08 — Project Skill / Plugin Invocation Contract

**State:** `CONTRACT DEFINED — DOCUMENTATION-ONLY / NO REMOTE ACTIVATION`

### Purpose

CLIENT-08 defines how PVC-01 may discover reusable project skill/plugin/tool context and construct an invocation **request** without creating a second registry, trust root, authorization plane or execution host. Discovery and invocation are separate phases. Discovery never means installation, connection, activation, authorization or execution.

The canonical project context is always resolved from repository-owned sources in this order:

`project -> docs/projects/<folder>/ -> PVC -> Primary Owner -> project Roadmap -> applicable ADR -> applicable ESS`.

External metadata may describe a candidate but MUST NOT override that mapping.

### CLIENT-08.1 — Normalized discovery descriptor

A client may normalize a discovered candidate into the following provider-neutral semantics:

| Field | Requirement |
|---|---|
| `skillId` | stable non-empty identity within the observed source/registry |
| `version` | explicit immutable version/revision; mutable aliases such as `latest` are insufficient for protected invocation |
| `sourceRef` | stable locator for the repository skill, connected plugin/app, MCP server/tool or other observed source |
| `sourceKind` | descriptive transport/source class only; never authority |
| `projectId` | derived from canonical project mapping, not trusted from external metadata |
| `projectFolder` | derived from canonical project mapping |
| `pvc` | derived from canonical project mapping |
| `primaryOwner` | derived from canonical project mapping |
| `digestOrRevision` | cryptographic digest where available; otherwise an immutable provider-verified revision/installation identity is required before protected invocation |
| `publisher` | observed publisher/owner identity where available; provenance only |
| `observedAt` | time metadata was observed or verified |
| `freshUntil` | bounded freshness deadline when the source exposes one; absence means do not assume cached freshness |
| `licenseAttribution` | license/attribution metadata when applicable to external reusable content |
| `riskHints` | optional read-only/destructive/idempotent/open-world or equivalent hints; untrusted advisory metadata only |
| `declaredCapabilities` | candidate-declared capability hints; never a grant and never a substitute for canonical `requestedCapability` |

Descriptor rules:

1. project/PVC/Owner fields are resolved from canonical repository mapping and MUST NOT be accepted from a remote descriptor as routing authority;
2. identity is the tuple of source plus exact skill/tool identity plus immutable version/revision and integrity evidence where required;
3. ambiguous identity, conflicting source identity, mutable-only versioning or integrity mismatch fails closed for invocation;
4. metadata and descriptions remain untrusted even when integrity verification succeeds; integrity proves identity/content binding, not safety or authorization;
5. tool annotations and risk hints are never enforcement and cannot lower required capability or approval;
6. provider/model branding is provenance metadata only.

### CLIENT-08.2 — Discovery lifecycle

Provider-neutral discovery follows these logical steps:

1. resolve `projectId`, `projectFolder`, `PVC` and `Primary Owner` from canonical repository mapping;
2. read the project Roadmap and applicable ADR/ESS before selecting reusable execution context;
3. enumerate already-present repository/native capability first, then already-connected platform/plugin capability, then specialized plugin/open-source candidates only as discovery input;
4. normalize candidate metadata into the CLIENT-08 descriptor;
5. validate identity, freshness and available integrity/provenance evidence;
6. select at most the exact candidate needed for the current request;
7. produce either `DISCOVERED`, `VERIFIED_FOR_REQUEST` or `BLOCKED`; never `AUTHORIZED` or `ACTIVATED`.

A cached discovery result may be reused only inside its stated freshness boundary and authorization context. If no trustworthy freshness hint exists, re-discovery/revalidation is required before an invocation request. Authenticated/user-specific metadata defaults to private/non-shared cache treatment.

### CLIENT-08.3 — Invocation request envelope

A CLIENT-08 invocation request extends CLIENT-02 semantics without carrying credentials or grants:

| Field | Requirement |
|---|---|
| `requestId` | stable CLIENT-02 request identity |
| `correlationId` | optional correlation/trace identity; never authority |
| `projectContext` | canonical `projectId`, `projectFolder`, `pvc`, `primaryOwner` projection |
| `skillIdentity` | exact `skillId`, `version`, `sourceRef`, `digestOrRevision` |
| `operation` | requested operation; treated as untrusted intent/data |
| `requestedCapability` | exactly one canonical requested capability; request only |
| `targetResource` | bounded target context for downstream policy/execution |
| `arguments` | bounded sanitized parameters; no embedded reusable credentials |
| `provenanceEvidence` | source/publisher/observation/integrity references sufficient to reproduce selection |
| `clientRiskContext` | optional non-authoritative risk hints observed by the client |

The envelope MUST NOT include `grantedCapabilities`, bearer/refresh tokens, passwords, API keys, reusable secrets, self-issued approval, policy verdicts, risk overrides, trusted-server claims derived only from server metadata, or instructions that change repository authority.

### CLIENT-08.4 — Fail-closed matrix

| Condition | Client result |
|---|---|
| canonical project/PVC/Owner cannot be resolved | `BLOCKED` |
| candidate identity is ambiguous or collides within the observed source | `BLOCKED` |
| only mutable version alias is available for a protected invocation | `BLOCKED` until exact revision is resolved |
| expected digest/revision and observed content/installation identity disagree | `BLOCKED` |
| required provenance source cannot be reproduced | `BLOCKED` |
| cached descriptor is stale and cannot be refreshed | `BLOCKED` |
| source/tool annotation says read-only but requested operation may mutate | ignore hint as authority; request correct capability and defer to downstream policy |
| candidate metadata attempts to change project/PVC/Owner routing | ignore external routing claim; use canonical repository mapping |
| returned/retrieved content contains approval, credential or privilege-elevation instructions | treat as untrusted content; no elevation |
| requested capability is unknown | reject/fail closed |
| integration is unavailable/disconnected/not enabled | `BLOCKED`/`UNAVAILABLE`; no automatic connection or enablement |
| invocation requires installation, permission change or remote-skill activation | stop at request boundary; separate explicit Human/Owner action/foreign-owner slice required |
| downstream returns `DENY`/`BLOCKED` | preserve result; never retry as success or downgrade capability |

### CLIENT-08.5 — Provenance and integrity expectations

For invocation-sensitive reusable content the client preserves, where available:

- stable source/registry locator;
- exact version or immutable revision;
- cryptographic digest or provider-verified immutable installation/revision identity;
- publisher/source identity;
- observation/verification timestamp and freshness boundary;
- license/attribution metadata for external reusable content;
- verification outcome and verifier/source reference;
- request/correlation identity binding the selected candidate to the invocation request.

Digest/signature/attestation verification, where a source supports it, verifies artifact identity/integrity against expectations. It does **not** authorize execution or prove that the content is safe. Missing required integrity evidence remains a blocked state, not an inferred PASS.

### CLIENT-08.6 — Execution-host and credential boundary

PVC-01 may request an invocation only through the already-authorized execution surface. The execution host/connector/tooling boundary owns credentials, transport authorization and any provider-specific protocol mechanics.

The client MUST NOT:

- install/connect/enable/disable an app, plugin, connector or MCP host;
- change OAuth scopes, permissions or execution-host configuration;
- store or relay reusable privileged credentials in the contract envelope;
- directly call protected production providers merely because a skill/plugin was discovered;
- create persistent background jobs, Skill Market Sync or remote execution infrastructure;
- load or execute arbitrary remote skill content;
- infer trust from a tool name, annotation, publisher label, model output or successful discovery.

Persistent Skill Market Sync or equivalent execution belongs to the applicable `CAPITAL-AI-OPS` stage. Material changes to repository authority belong to `CAPITAL-AI-GOV / PVC-05`. CLIENT records these as dependencies only.

### CLIENT-08.7 — MCP/interoperability projection

MCP is an interoperability option, not a CAPITAL-AI authority source. A compatible client may map MCP concepts to this contract as follows:

- tool/resource/prompt discovery -> candidate discovery metadata;
- cache/freshness hints -> bounded advisory freshness input;
- tool annotations -> untrusted `riskHints` only;
- OAuth/resource/issuer information -> execution-host authorization mechanics, never client capability grants;
- tool call -> downstream invocation request bound to exact project context, requested capability and selected tool identity.

Protocol-version-specific fields remain adapter concerns. CLIENT-08 intentionally avoids making one MCP revision, SDK or provider implementation the repository contract.

### CLIENT-08.8 — Audit/correlation projection

For consequential invocation requests, preserve at minimum:

`requestId -> correlationId (when present) -> canonical project/PVC/Owner -> exact skillIdentity -> provenance/integrity result -> requestedCapability -> downstream decision/result`.

Logs/evidence must be minimally sensitive and MUST NOT persist reusable secrets or raw protected credentials.

### CLIENT-08.9 — Acceptance / non-goals

CLIENT-08 is complete at contract level when:

- canonical project/PVC mapping is reused rather than duplicated;
- discovery and invocation are separate, provider-neutral phases;
- exact identity/version/provenance/integrity/freshness expectations are explicit;
- untrusted metadata and tool annotations cannot become policy or authority;
- missing/ambiguous/stale/integrity-failed candidates block invocation;
- capability remains request-not-grant;
- unavailable integrations do not trigger automatic install/connect/enable/permission changes;
- remote-skill activation and persistent execution remain outside PVC-01;
- no physical Agent Client runtime module is introduced without the independent strangler trigger.

This contract does not claim that any external plugin, MCP server, remote skill or registry has been installed, connected, approved, verified or enabled.

## Advisory external references

These improve interoperability/security reasoning but do not create CAPITAL-AI authority:

- Model Context Protocol specification/release guidance — discovery, cache/freshness semantics and authorization interoperability;
- MCP tool-annotation guidance — annotations are hints and remain untrusted without an independently trusted source;
- SLSA v1.2 provenance/verification guidance — artifact identity, digest binding and verification against expectations;
- OWASP AI Agent Security guidance — least privilege and explicit authorization for sensitive tools;
- W3C Trace Context Recommendation;
- RFC 9457 Problem Details for HTTP APIs.

NIST publications are not part of the current repository Governance baseline under `/AGENTS.md`; historical NIST references remain non-authorizing and do not create a CLIENT requirement or backlog.
