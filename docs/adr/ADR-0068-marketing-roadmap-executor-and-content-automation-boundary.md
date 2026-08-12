# ADR-0068 — Marketing Roadmap Executor and Controlled Content Automation Boundary

Status: PROPOSED
Date: 2026-08-12
Decision Owners: Platform Director / Repository Owner
Related ESS: ESS-0014, ESS-0019, ESS-0021, ESS-0022

## Context

CAPITAL-AI already contains real Social OAuth/account handling and platform publishing for YouTube, TikTok, Instagram, Facebook and X, while the content-generation/rendering layer remains incomplete. The SEO Roadmap also defines a future autonomous marketing capability.

A broad Systemadmin Roadmap Executor is being developed under ESS-0021 and the SA Roadmap. Reusing that logical agent directly for marketing would create unnecessary privilege coupling: the Systemadmin profile is cross-cutting, while marketing execution should be bounded to SEO, content, rendering, distribution and analytics domains.

Current external best-practice guidance points in the same direction:

- NIST AI RMF / GenAI Profile: explicit governance, lifecycle risk management and human accountability;
- NIST SSDF: secure practices integrated into the normal SDLC;
- ISO/IEC 42001: traceable risk treatment and continual improvement;
- OWASP Agentic Security Initiative: prevent tool misuse, privilege abuse, unsafe inter-agent trust and cascading autonomous side effects.

## Decision

CAPITAL-AI will create a separate logical agent:

`capital-ai-marketing-roadmap-executor`

The Marketing Agent will reuse verified control-plane mechanisms from the Systemadmin Roadmap where technically appropriate, but will have a separate identity, mandate, capability ceiling, domain path scope, risk model and kill switch.

The Marketing Agent MUST NOT inherit Systemadmin authority.

### Initial state

The agent begins as documentation/specification and read-only analysis capability only.

No standing `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST`, `DEPLOY_REQUEST`, `PRODUCTION_MUTATION` or public social-publishing authority is enabled by this ADR.

### Future repository execution

A later Marketing Roadmap Execution Mandate may authorize bounded repository work only after:

1. the underlying Systemadmin execution-host/audit chain needed for reuse is VERIFIED PASS;
2. Marketing-specific subject binding is implemented;
3. exact path/capability/risk enforcement is tested;
4. audit-before-side-effect is proven for the Marketing subject;
5. Human/Owner approves the Marketing mandate.

`MERGE` remains Human-only.

### External publishing

Public social publishing is classified as an external business mutation, distinct from repository mutation.

Generated financial content cannot be published solely because an LLM, renderer or Marketing Agent produced it. Publishing requires the defined content validation/provenance/approval chain.

A future lower-risk autonomous publishing class, if desired, requires a separate ADR and evidence. This ADR does not grant it.

### Plane separation

CAPITAL-AI keeps these responsibilities separate:

- Evidence Plane: approved source data and measurement;
- Content Plane: planning and generation;
- Trust Plane: financial-claim validation, provenance, disclosure and compliance;
- Approval Plane: Human/Owner review where required;
- Media Plane: image/audio/video rendering;
- Distribution Plane: existing SocialMediaEngine publisher and OAuth/token boundary;
- Feedback Plane: analytics and optimization recommendations.

No media-generation provider becomes a trust root or publisher.

## Alternatives considered

### A. Use Systemadmin Agent for all marketing work

Rejected. This violates least privilege and couples a high-blast-radius cross-cutting agent to a domain that can be isolated.

### B. Import a full third-party social platform as the new authority

Rejected as the default architecture. CAPITAL-AI already owns OAuth, token storage, access control and platform publishing. A second publisher would duplicate critical state and credentials.

### C. Direct LLM-to-social-platform publishing

Rejected. It removes the validation, provenance and Human approval boundary and increases prompt-injection/tool-misuse blast radius.

### D. Separate Marketing Agent with shared verified security infrastructure

Accepted. It maximizes reuse while keeping authorization domain-specific.

## Consequences

Positive:

- least-privilege agent design;
- independent Marketing kill switch;
- auditable separation between generation and publication;
- easier parallel development with the future five-agent lane model;
- Systemadmin changes do not automatically expand Marketing authority;
- provider/model replacement does not change the trust boundary.

Costs:

- separate mandate/profile validation is required;
- shared integration files require explicit coordination;
- content approval adds latency by design;
- external media providers require supply-chain and data-processing review.

## Security invariants

1. AI product/provider is never the trust root.
2. Retrieved content and tool outputs are untrusted data.
3. Marketing Agent cannot self-approve, self-expand or self-renew authority.
4. Audit/permit failure causes zero protected side effect.
5. No generative provider receives Social OAuth or Owner credentials.
6. Quantitative financial claims require source evidence.
7. Human approval is hash-bound for generated financial marketing content until explicitly replaced by a later approved policy.
8. Public publishing and repository mutation are distinct capabilities.
9. Shared/global repository files are not implicitly Marketing-owned.
10. Merge remains Human-only.

## Implementation dependency

The Marketing Agent Roadmap may be documented now, but mutating enablement is blocked until its prerequisite SA execution-host stages and Marketing-specific control tests are VERIFIED PASS.

## Rollback

Before enablement, rollback is documentation-only: withdraw ESS-0022/ADR-0068 and remove the inactive profile.

After future enablement, rollback order is:

1. activate Marketing kill switch / revoke mandate;
2. stop new generation/publish mutations;
3. preserve audit and content evidence;
4. disable the Marketing execution profile;
5. revert code through a fresh rollback branch;
6. verify existing SocialMediaEngine/OAuth/publishing remains intact.

No rollback may erase audit or publication evidence.

## References

- NIST AI Risk Management Framework and Generative AI Profile
- NIST SP 800-218 Secure Software Development Framework
- ISO/IEC 42001 AI management systems
- OWASP Agentic Security Initiative / Top 10 for Agentic Applications
- `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`
- `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md`
- `.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md`
- `.ai/skills/ESS-0022-Marketing-Roadmap-Executor.md`
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`
- `docs/roadmaps/MARKETING_AGENT_ROADMAP.md`

## Numbering note

`ADR-0068` was checked as unoccupied in the current repository before this draft was created. Canonical ADR indexing/traceability must be updated in the final Human-approved documentation PR.
