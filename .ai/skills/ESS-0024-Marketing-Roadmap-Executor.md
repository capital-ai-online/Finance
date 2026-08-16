# ESS-0024 — Marketing Roadmap Executor

Status: ACCEPTED / NOT ENABLED (Owner-ACCEPT 2026-08-16; keine Runtime-Capability)
Version: 0.1.0
Date: 2026-08-12
Owner: Platform Director / Repository Owner
Scope: CAPITAL-AI Marketing, SEO, Social Content and Content-Distribution DevelopmentChain

## 1. Purpose

ESS-0024 defines the provider-neutral logical agent `capital-ai-marketing-roadmap-executor`.

The Marketing Roadmap Executor is a domain-limited development and operations agent for Owner-approved Marketing Roadmap work packages. It is deliberately separate from the broader `capital-ai-systemadmin-roadmap-executor` defined by ESS-0021.

Core invariant:

`Marketing automation != infrastructure authority != publishing authority`.

The Marketing Agent may eventually plan and implement SEO, content-generation, media-rendering, social-distribution and analytics-feedback work, but it MUST NOT inherit Systemadmin privileges merely because it reuses the same execution-host and audit foundations.

## 2. Best-practice basis

The profile applies the following reference principles:

- NIST AI RMF / Generative AI Profile: Govern, Map, Measure and Manage AI risk throughout the lifecycle;
- NIST SSDF: integrate secure software practices into the existing SDLC instead of creating a parallel insecure automation path;
- ISO/IEC 42001: accountable AI governance, traceability, transparency, continual improvement and risk treatment;
- OWASP Agentic Security Initiative: treat tools, retrieved content, memory and inter-agent messages as untrusted; prevent excessive agency, tool misuse and privilege expansion;
- CAPITAL-AI ESS-0019: AI provider/client is never the trust root;
- CAPITAL-AI ESS-0021 / SA Roadmap: bounded mandate, exact capabilities, audit-before-side-effect, Human-only merge and branch deletion.

External standards are crosswalk references. CAPITAL-AI ESS/ADR/Policy remains the executable repository authority.

## 3. Logical agent identity

Canonical logical agent id:

`capital-ai-marketing-roadmap-executor`

Provider/model metadata is non-authoritative. ChatGPT, Claude, Gemini or a later approved host may execute the logical profile only when the CAPITAL-AI Control Plane can attribute the action to the same logical agent, mandate, human owner and request.

## 4. Initial state

This ESS creates the specification only.

Current enablement state:

`READ / ANALYZE / PLAN only`.

The profile has no standing repository mutation authority, no social-platform publishing authority and no production mutation authority until the later Marketing Agent Roadmap gates are individually VERIFIED PASS.

## 5. Future capability ceiling

After the required Control-Plane and execution-host gates are proven, a Marketing Roadmap Execution Mandate may delegate only explicitly listed capabilities:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`.

Capabilities never inherit.

`MERGE` is permanently prohibited.

`DEPLOY_REQUEST` and `PRODUCTION_MUTATION` are not part of the default Marketing profile and require separate future ADRs, exact-target technical enforcement and Human/Owner approval.

Public social publishing is treated as an external business mutation even if the underlying API is technically simple.

## 6. Domain authority

The Marketing Agent is intended for the following domains:

- SEO management and measurement;
- SocialMediaEngine content-generation contracts;
- content templates and platform variants;
- AI content provenance and disclosure;
- content-compliance gates;
- media-rendering adapters;
- social publishing bridge code;
- marketing analytics feedback;
- marketing documentation, tests and evidence.

The Marketing Agent is NOT a general backend, infrastructure, IAM, billing, scoring or release administrator.

## 7. Initial repository path scope

Candidate owned paths for later mandate-controlled mutation:

- `src/platform/SocialMediaEngine/**`;
- `server/socialMedia/**`;
- `src/routes/socialMediaRoutes.ts` only when explicitly in the work package;
- `src/platform/SeoEngine/**` when implemented;
- `docs/seo/**`;
- `docs/architecture/*CONTENT*` / Marketing-specific architecture documents;
- Marketing-specific tests and evidence;
- Marketing-specific `.ai/contracts/**` and `.ai/skills/**` entries after Human-approved governance changes.

Shared integration paths are NOT implicitly owned:

- `AGENTS.md`;
- `package.json` / lock file;
- `.github/workflows/**`;
- global security/IAM files;
- global Event Mesh registries;
- global Traceability registries;
- `server.ts` / application bootstrap;
- deployment configuration;
- production database schemas shared with unrelated domains.

A shared integration change requires explicit scope, conflict inspection and Human/Systemadmin coordination.

## 8. Marketing content trust boundary

AI-generated marketing content MUST be separated into these planes:

1. source/evidence;
2. content planning/generation;
3. financial-claim and policy validation;
4. provenance/disclosure;
5. Human review/approval;
6. media rendering;
7. asset validation;
8. existing CAPITAL-AI publishing;
9. analytics/feedback.

No generative model or media renderer receives Social OAuth tokens, Supabase service credentials, Stripe credentials, GitHub credentials, Owner session material, TOTP secrets or passkey material.

## 9. Financial-content invariants

Public quantitative financial claims require attributable source evidence.

Synthetic, heuristic, placeholder or unverified values MUST NOT be presented as live market facts.

The Marketing Agent MUST fail closed or require Human review when content contains:

- investment recommendations or recommendation-like language;
- market forecasts;
- rankings or scores used as persuasive claims;
- performance promises;
- unsupported financial statistics;
- regulatory/compliance-sensitive claims;
- conflicting source evidence;
- incomplete AI provenance.

## 10. Human approval boundary

Until a later separately approved architecture proves a lower-risk autonomous publication class, Human/Owner approval remains mandatory before generated financial marketing content is published externally.

Approval SHOULD be bound to the final content hash, final asset hashes and target platforms. Material content or asset changes invalidate approval.

## 11. Reuse of Systemadmin foundations

The Marketing Agent SHOULD reuse verified foundations from the SA Roadmap rather than introduce a second security stack:

- provider-neutral Agent IAM;
- execution-host identity;
- OIDC where applicable;
- Policy Gate;
- durable append-only M5 audit;
- permit-before-side-effect enforcement;
- kill switch;
- branch/PR evidence;
- Human review and Human-only merge;
- fresh branch and post-merge branch deletion.

Reuse of infrastructure does not imply reuse of authority. The Marketing profile has its own subject identity, mandate, allowed paths, capabilities and risk ceiling.

## 12. Non-delegable actions

The Marketing Agent MUST NOT autonomously:

- merge Pull Requests;
- weaken Human review or repository protections;
- modify its own authorization policy or expand its own mandate;
- change Owner/admin IAM or MFA;
- disclose or rotate unrestricted credentials;
- mutate billing/customer entitlements;
- change financial scoring formulas or weights unless a separate scoring-domain mandate explicitly authorizes it;
- mutate production market data;
- delete production resources;
- change DNS/TLS/domain ownership;
- disable security, audit, RLS or consent controls;
- publish generated financial content without the required content approval;
- bypass platform review requirements.

## 13. Threat model requirements

At minimum, implementation must test:

- prompt/retrieval injection cannot elevate capability;
- external content cannot issue tool instructions;
- renderer/provider compromise cannot access publishing credentials;
- wrong mandate/agent/path/capability -> DENY;
- stale source evidence -> REVIEW_REQUIRED or DENY;
- unsupported financial claim -> DENY;
- approval hash mismatch -> DENY;
- cross-tenant content/asset access -> DENY;
- invalid/private media URL -> DENY;
- kill switch active -> DENY;
- audit persistence failure -> zero repository/external side effect;
- publication cannot precede required approval.

## 14. Enablement sequence

`MA0 documentation package -> Human acceptance -> MA1 read-only profile/validator -> MA2 content contracts -> MA3 provenance/compliance/approval -> MA4 rendering -> MA5 bounded repository pilot -> MA6 separately governed external publishing control -> MA7 feedback loop`.

Mutation authority MUST NOT be activated before the relevant SA execution-host foundation is VERIFIED PASS and the Marketing-specific negative tests succeed.

## 15. Branch lifecycle

Every future mutating Marketing work package uses a fresh scoped branch from current `main`.

After successful Human merge into `Finance`, the remote work branch MUST be deleted. Closed or superseded branches are deleted after required evidence retention. Merged branches are never reused.

## 16. Related authorities

- ESS-0006 Security & Compliance
- ESS-0008 AI Agent Framework
- ESS-0011 Enterprise Traceability
- ESS-0013 Enterprise Event Mesh
- ESS-0014 Google Marketing MCP Governance
- ESS-0019 Universal AI Agent Control Plane
- ESS-0021 Systemadmin Roadmap Executor
- ADR-0039 Human-authorized PR creation
- ADR-0058 Provider-neutral Agent IAM
- ADR-0059 Agent Audit / OTel Correlation
- ADR-0065 Systemadmin Roadmap Execution Mandate
- ADR-0067 Systemadmin execution-host binding
- ADR-0080 Marketing Roadmap Executor and Content Automation Boundary
- `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`
- `docs/roadmaps/MARKETING_AGENT_ROADMAP.md`
- `docs/governance/MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md`

## 17. Registry note

This specification was originally filed as `ESS-0022`. That number was already held by `ESS-0022-Passkey-Only-Owner-PR-Authorization.md`; the stated collision check had been performed against the file listing instead of the canonical registry, which at the time ended at `ESS-0018`. Under **ADR-0085** the ESS namespace was cleaned up and the registry backfilled: this specification is now `ESS-0024`, and `ESS-0022` remains the Passkey specification. Content is unchanged.

`ESS-0024` is registered in `.ai/registry/ess-registry.json`. New ESS numbers MUST be allocated against that registry, never against the file listing under `.ai/skills/`.

The specification is `ACCEPTED` as of 2026-08-16 (Owner decision, WP-M0) but remains `NOT ENABLED`: acceptance establishes the boundary, not any capability. The profile stays at `READ / ANALYZE / PLAN` until the Execution Policy §18 gates are individually VERIFIED PASS.
