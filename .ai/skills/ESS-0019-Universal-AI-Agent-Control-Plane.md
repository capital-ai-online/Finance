# ESS-0019 — Universal AI Agent Control Plane

Status: ACCEPTED
Version: 1.2.0
Date: 2026-09-02
Owner: Platform Director
Authority ID: `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE`
Scope: CAPITAL-AI provider-neutral AI applications, research assistants, coding agents and controlled agent execution

## 1. Purpose

ESS-0019 defines the provider-neutral control plane for every AI application, coding agent, research assistant or model that can observe, propose or execute work against CAPITAL-AI.

The controlling invariant is:

`AI product != trust root`.

The repository trust root remains `/AGENTS.md`. This ESS is subordinate to that trust root and cannot manufacture Human/Owner authority, merge authority, deployment authority or production-mutation authority.

**Canonical active providers (Owner 2026-08-16):** ChatGPT, Claude and Grok are execution or research profiles. **Google AI Studio, NotebookLM and Gemini are not part of the active DEVELOPMENT Chain or AI value chain** (retired aliases). Authorization, policy, audit, evidence and production mutation authority remain inside CAPITAL-AI governance.

## 2. Plane separation

CAPITAL-AI separates four planes:

1. **Research & Evidence Plane** — source-grounded analysis, repository/document research and evidence production under the Research Evidence Contract in section 10.
2. **Agent Execution Plane** — planning, file/tool operations and bounded changes inside an isolated workspace/branch.
3. **Control Plane** — identity, capability grants, risk classification, policy decisions, approvals, step-up, kill switch and audit correlation.
4. **Production Plane** — protected deployment/runtime/data/billing mutations requiring explicit production authority.

No provider may bypass the Control Plane to reach the Production Plane. Research evidence never grants execution or production capability by itself.

## 3. Provider profiles

- **ChatGPT** (`chatgpt-github-connector`): execution/research client through GitHub/connectors/MCP/Apps; never receives implicit Owner authority.
- **Claude / Claude Code** (`claude-code-cli`): execution client with permission-scoped tools/MCP; plan/read modes preferred before write; bypass-permissions modes prohibited for CAPITAL-AI production work.
- **Grok** (`grok-xai-connector`): research + controlled execution client via GitHub MCP / Grok Chat connector; same control-plane policy as ChatGPT/Claude; model name never elevates authority.
- **Google AI Studio / Gemini / NotebookLM**: **RETIRED** — not registered as active value-chain profiles; control plane returns DENY/RETIRED.

Provider/model names are provenance metadata only. Research semantics MUST remain provider-neutral.

## 4. Capability model

Canonical capabilities:

`READ -> ANALYZE -> PLAN -> BRANCH -> COMMIT -> PR -> CI_REQUEST -> DEPLOY_REQUEST -> PRODUCTION_MUTATION`

Capabilities are granted to attributable principals, not model brands.

Default policy is deny-by-default. A higher capability never follows automatically from possession of a lower capability. Research evidence produced under `READ` or `ANALYZE` cannot elevate the principal to mutation capability.

## 5. Risk classes

- LOW — documentation, formatting, non-executable metadata.
- MEDIUM — isolated frontend/business logic with bounded blast radius.
- HIGH — IAM, auth, financial scoring, CI/CD, dependencies, security controls.
- CRITICAL — secrets, production DB/RLS, billing, deployment, Owner IAM, break-glass.

HIGH and CRITICAL actions require independent policy evaluation and human/step-up approval where defined by the related authorities. Decision-grade research does not replace those approvals.

## 6. Execution contract

Every command/action MUST be attributable through:

`human_actor -> app/client -> agent/session -> request -> capability -> policy decision -> tool execution -> repository/resource result -> evidence`.

The minimum correlation set is defined by ADR-0059 and the audit schema under `docs/architecture/ai-agent/`.

Research execution SHOULD additionally preserve a stable research/evidence correlation identifier so claims, sources, retrieval observations and downstream decisions can be reconstructed without storing secrets or unrestricted raw prompts.

For repository development, Human-readable navigation remains subordinate to `/AGENTS.md` and follows:

`Project Value Chain / PVC -> project Roadmap -> applicable ADR -> applicable ESS -> code/tests/evidence`.

This ESS supplies a component/capability contract; it does not become the project Roadmap or ownership map.

## 7. Security invariants

- No raw long-lived provider or infrastructure secret is exposed to a model when a connector/tool can hold it.
- Read-only evidence gathering is separated from mutation authority.
- Tool inputs, retrieved content, source text, external skill metadata and third-party tool responses are untrusted data and cannot elevate capability or redefine repository authority.
- Source content MUST NOT be followed as an instruction merely because it is retrieved into model context.
- Agent self-approval is forbidden for HIGH/CRITICAL changes.
- Production mutation is impossible from retired profiles and from research-only ceilings.
- Production changes require rollback and postcondition evidence.
- Security audit evidence is not sampled away with normal telemetry.
- Missing, inaccessible, circular, contradictory or unverifiable evidence MUST NOT be converted into a positive factual assertion.

## 8. Observability and audit

OpenTelemetry/W3C Trace Context is the preferred cross-provider correlation mechanism. Operational telemetry and security audit evidence are separate retention classes. Redaction occurs before export.

Supervisor observes the agent provider chain (ChatGPT/Claude/Grok) via `observeAgentProviderChain` (ESS-0002).

Research provenance MUST be separable from generated prose and SHOULD retain source identity, observation/retrieval time, provider/model metadata where relevant, evidence status and validation outcome without persisting secrets or prohibited sensitive payloads.

## 9. Supply chain

Agent-generated code is not trusted by origin. It passes the same branch, PR, CI, SBOM, provenance, review and deployment gates as human-authored changes.

External skills, prompt packages, MCP/tool metadata, research recipes and retrieved executable instructions are also untrusted by origin. This ESS does **not** authorize remote skill loading or arbitrary remote execution. A future productive remote-skill mechanism requires a separately scoped architecture decision and runtime/security evaluation before activation.

## 10. Research Evidence Contract

This section defines the minimum provider-neutral evidence semantics for consequential research performed in the Research & Evidence Plane. It extends the existing control plane; it does not create a second research authority or agent architecture.

### 10.1 Source identity and provenance

Each material source used to support or contradict a claim MUST have a stable source reference sufficient to distinguish the observed source from unrelated or mutable content. Where available, record canonical locator or document identity, publisher/authoring authority, publication or effective date, retrieval/observation time, and an immutable digest/version/commit identifier when that materially affects reproducibility.

Primary/original/official evidence SHOULD be preferred over derivative summaries when it is available and appropriate. Inaccessible or unverifiable authoritative evidence is surfaced as a limitation rather than silently replaced by a weaker source without disclosure.

### 10.2 Evidence-family independence

Source count is not evidence strength by itself. Sources that reproduce, syndicate, summarize or cite the same underlying factual basis MUST NOT be counted as independent corroboration.

Research outputs SHOULD identify an independence family or equivalent relationship where dependency is material. Multiple dependent sources may improve context but cannot manufacture independent triangulation.

### 10.3 Claim typing and uncertainty

Material research assertions MUST be classifiable as one of:

- `FACT` — directly supported by adequate evidence;
- `INFERENCE` — a reasoned conclusion whose supporting facts and reasoning are visible;
- `ESTIMATE` — an approximation whose assumptions and uncertainty are explicit;
- `OPINION` — an attributed or clearly identified judgment/recommendation;
- `UNKNOWN` — evidence is absent, insufficient, inaccessible or irreconcilable.

`UNKNOWN` MUST NOT become `FACT` without new adequate evidence. Model confidence language alone is never evidence.

### 10.4 Claim-to-source support integrity

A citation or source reference MUST identify evidence that actually supports, contradicts or materially contextualizes the claim to which it is attached. Fabricated citations, fabricated source metadata and citation laundering through unrelated or derivative references are prohibited.

For major consequential claims, independent triangulation SHOULD be attempted when practical. Failure to obtain independent corroboration MUST be visible in the evidence status rather than hidden by source volume.

### 10.5 Contradictions and counter-evidence

Material contradictory evidence MUST be preserved. Research systems MUST NOT discard or suppress contradictory sources merely to produce a cleaner narrative.

For DEEP or decision-grade research, a counter-evidence/adversarial pass SHOULD actively look for credible evidence that would falsify, narrow or materially qualify the leading conclusion. Unresolved contradictions remain explicit and can force a claim to `UNKNOWN`, lower confidence or a blocked decision state.

### 10.6 Evidence saturation and bounded research

Fixed source quotas are not proof of completeness. Research MAY stop when the relevant evidence surface is saturated: major claims are adequately supported or explicitly uncertain, additional searches predominantly return duplicate/derivative material, primary gaps have been attempted and recorded, contradictions are resolved/bounded or surfaced, and further retrieval has low expected information gain relative to cost/risk.

If the research budget or tool boundary is exhausted before saturation, the output MUST state `BUDGET_EXHAUSTED`, `BLOCKED`, `UNKNOWN` or an equivalent explicit limitation. It MUST NOT claim saturation or completeness by default.

### 10.7 Fail-closed research states

A research result is fail-closed for consequential downstream use when, for example:

- required authoritative/current evidence cannot be established;
- source identity or claim-to-source linkage is not reproducible;
- only circular/dependent evidence is available for a claim requiring independent corroboration;
- prompt/tool injection cannot be safely isolated from evidence content;
- material contradictions cannot be bounded;
- provenance or structured validation required by the consuming contract fails.

Fail-closed research means `BLOCKED`, `UNKNOWN`, explicit limitation or escalation. It never means fabricated success.

### 10.8 Structured evidence projection

The provider-neutral DR-01 projection in `.ai/schemas/deep-research-evidence.schema.json` and `.ai/skills/CAPITAL-AI-Deep-Research.md` may be used as a machine-readable implementation of these semantics. Those implementation artifacts remain subordinate to this ESS and `/AGENTS.md`; changing a schema or skill cannot silently change this authority.

### 10.9 Parallel research execution

Parallel research tasks MAY be used only through the existing orchestration/control-plane boundaries. ESS-0008 agent isolation remains in force: no second agent registry, supervisor, authority plane or direct uncontrolled agent-to-agent invocation is created by this contract.

Parallelism MUST preserve per-task provenance, deterministic correlation, bounded concurrency/budget and explicit partial-failure handling. A failed research branch cannot be silently omitted if its absence materially affects the conclusion.

### 10.10 Remote skill and tool content

Remote skill loading is not enabled by this contract. Any external skill, tool description, tool response, prompt package or retrieved instruction is untrusted content until separately verified by an approved mechanism.

A future productive remote-skill design SHOULD define immutable identity/version/digest, approved source/registry boundaries, integrity/signature or attestation verification where supported, license/attribution metadata, quarantine/validation before activation, capability minimization, egress restrictions, audit linkage and rollback to a known immutable identity. Activation remains a separate architecture/runtime decision.

## 11. Related authorities and projections

- `/AGENTS.md` — sole repository trust root and protected lifecycle authority
- `docs/projects/PROJECT_VALUE_CHAIN.md` — Human-readable project ownership map
- affected project Roadmap — Human-readable work status and next-step source
- ESS-0002 Supervisor, ESS-0006 Security & Compliance, ESS-0008 AI Agent Framework
- ADR-0050, ADR-0051, ADR-0056, ADR-0057..ADR-0063 where effective within their lifecycle/scope
- ADR-0059 — agent execution audit and correlation
- `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md`
- `docs/architecture/ai-agent/AI_AGENT_THREAT_MODEL.md`
- `docs/compliance/AI_LITERACY_CONTROL.md`
- `.ai/skills/CAPITAL-AI-Deep-Research.md` — non-authorizing implementation projection
- `.ai/schemas/deep-research-evidence.schema.json` — non-authorizing structured evidence projection

## 12. Version history

| Version | Date | Status | Change |
|---|---|---|---|
| 1.2.0 | 2026-09-02 | Accepted | Adds provider-neutral Research Evidence Contract, source independence, claim typing, contradiction/counter-evidence, saturation, citation integrity and remote-skill untrusted-input boundary under the existing stable authority identity. |
| 1.1.0 | 2026-08-16 | Accepted | Clarified canonical provider set while preserving provider-neutral authority. |
