# CAPITAL-AI-SOCIAL Cross-Project Handoffs

**Version:** 2.1.1  
**Baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Rule:** foreign-domain work is referenced here and is not implemented by the Social project branch.

## Repository routing boundary

Current project routing is governed by:

- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

`CAPITAL-AI-SOCIAL` has no Primary `PVC-*` ownership. No implicit `PVC-19` exists. Therefore this file does not invent a PVC stage for Social.

Where a real Security or repository cross-project handoff is created, the compatibility marker must be accompanied by the explicit `project_namespace: PVC` and valid `project_stage: PVC-NN` identifying the actual Primary Owner stage. Foreign work remains `REFERRED_NOT_EXECUTED`, `DEPENDENCY`, `BLOCKED_BY` or `WAITING_FOR_EVIDENCE` as applicable; Social cannot mark it `DONE/VERIFIED/CLOSED`.

## CAPITAL-AI-DOC

[SOCIAL_HANDOFF -> CAPITAL-AI-DOC | Define/confirm canonical source-content identity and provenance contract consumed by Social Content Packages. Social requires stable `source_content_id`, source-domain identity and transformation trace but must not become the content-truth authority.]

[SOCIAL_HANDOFF -> CAPITAL-AI-DOC | Confirm canonical vocabulary/product naming and provenance treatment for AI-assisted Social adaptations, including financial source attribution.]

## CAPITAL-AI-SEO

[SOCIAL_HANDOFF -> CAPITAL-AI-SEO | Retain organic-search metadata, search discoverability and SEO architecture outside CAPITAL-AI-SOCIAL. Social channel copy may consume approved campaign/source material but must not duplicate SEO truth or reopen completed SEO work.]

[SOCIAL_HANDOFF -> CAPITAL-AI-SEO | Replace or reference legacy roadmap wording that treats Social Distribution as SEO execution ownership when the SEO project next changes its own roadmap. No SEO roadmap file is modified by this Social branch.]

## CAPITAL-AI-SEC

Source synchronization:

- PR #631 merged as `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`;
- Security roadmap: `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- Security work packages: `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- Security traceability: `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`.

Current Security traceability routes findings to `CAPITAL-AI-OPS`, `CAPITAL-AI-DATA` and `CAPITAL-AI-GOV`; no existing Security finding is routed to `CAPITAL-AI-SOCIAL` on this baseline. Accordingly there is **no fabricated Security handoff record** in this file.

[SOCIAL_HANDOFF -> CAPITAL-AI-SEC | Own provider credential/API Security requirements, Security findings, negative-test expectations, secret/OAuth Security and independent Security verification. Social stores no credential values and does not self-close Security findings.]

[SOCIAL_HANDOFF -> CAPITAL-AI-SEC | If a future Security finding affects Social-owned content/package/channel/provider-requirement code, route it through the canonical PVC handoff contract with a real Primary Owner stage; Social may return IMPLEMENTED/EVIDENCE_READY evidence but CAPITAL-AI-SEC alone decides Security VERIFIED/CLOSED.]

The inbound generic Security prompt is preserved at `../handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml`.

## CAPITAL-AI-COMP

[SOCIAL_HANDOFF -> CAPITAL-AI-COMP | Define applicable disclosures, risk-language and marketing-communication requirements for Social Content Packages, including financial statements. Social embeds validated requirements but does not define compliance policy.]

[SOCIAL_HANDOFF -> CAPITAL-AI-COMP | Define fail/review behavior when a channel text limit cannot preserve mandatory disclosure or risk wording.]

## CAPITAL-AI-OPS

[SOCIAL_HANDOFF -> CAPITAL-AI-OPS | Own protected external-mutation execution where platform publication is treated as protected operations. Social hands off an approved immutable candidate snapshot; it does not self-authorize or autonomously publish.]

[SOCIAL_HANDOFF -> CAPITAL-AI-OPS | Preserve execution enforcement for final approved content/asset/platform identity and operational provider mutation. Social defines the handoff contract but does not implement foreign protected execution in this documentation branch.]

[SOCIAL_HANDOFF -> CAPITAL-AI-OPS | If true scheduled publication is introduced, implement and evidence scheduler/provider execution under the applicable OPS/Owner authority. Social `scheduled` semantics must not imply provider mutation without evidence.]

[SOCIAL_HANDOFF -> CAPITAL-AI-OPS | Provide durable publication-evidence persistence/trace correlation where operational ownership applies, including external post identity, provider state and trace identity.]

## Security return path

When a valid CAPITAL-AI-SEC handoff has been implemented in Social-owned scope, return:

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

with source finding, target project, project stage from the received valid handoff, implementation status, changed files, candidate SHA, runtime SHA where applicable, Security/negative tests, evidence paths, residual risk, unresolved dependencies and `verification_requested`.

Social must not set the originating Security finding to `VERIFIED/CLOSED`.

## Handoff completion rule

A handoff is not completed merely because it is listed here. The actual Primary Owner/target project executes its own work under its own branch/PR/authority model. No handoff grants Social permission to modify foreign-domain files.