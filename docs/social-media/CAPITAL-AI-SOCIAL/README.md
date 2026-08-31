# CAPITAL-AI-SOCIAL

**Display name:** CAPITAL-AI Social Media  
**Role:** `SOCIAL_MEDIA_DOMAIN`  
**Roadmap version:** 2.1.2  
**Synchronized baseline:** `main@1f01120164ba4a3c194a4e0a79292a262a372588`  
**Security source merge:** PR #631 / `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Primary Project Value Chain ownership:** `[]`

## Purpose

`CAPITAL-AI-SOCIAL` is the channel-specific execution domain for Social Content Packages, Channel Adaptation, Social Copy, Provider Adapter Requirements, Publishing Preparation/Handoff, Social Evidence, Performance Assessment and Social Drift Detection.

It is deliberately **not** a publishing authority, canonical-content authority, SEO authority, Security verification authority, Compliance authority or protected external-mutation authority.

## Current project-organization correlation

Current `main` defines `docs/projects/` as the canonical organizational execution surface and explicitly lists `CAPITAL-AI-SOCIAL` as a cross-cutting project with **no productive PVC ownership**.

A canonical `docs/projects/<social-slug>/` folder is **not present or explicitly resolved on current main**. Therefore this PR does not guess or manufacture one. The current bounded Social domain surface remains:

`docs/social-media/CAPITAL-AI-SOCIAL/`

Any later migration into `docs/projects/<resolved-social-folder>/` requires a fresh current-main correlation and explicit canonical folder resolution.

## Quality Management correlation

`CAPITAL-AI-QM` now exists under `docs/projects/quality-management/`. Social reuses the repository's project/assurance separation principles where applicable:

- Social owns Social-domain planning/contracts/evidence assessment;
- QM may independently assess quality and findings under its own authority lifecycle;
- Social does not self-assert QM verification;
- QM does not acquire Social publishing, provider or content authority.

No QM file is modified by this Social PR.

## Domain boundaries

- Canonical source content and provenance: `CAPITAL-AI-DOC`.
- Organic search/SEO: `CAPITAL-AI-SEO`.
- Provider/API credentials, Security requirements/findings/negative-test expectations and independent Security verification: `CAPITAL-AI-SEC`.
- Content compliance/disclosures: `CAPITAL-AI-COMP`.
- Protected external execution where applicable: `CAPITAL-AI-OPS`.
- Independent Quality assurance where applicable: `CAPITAL-AI-QM`.

Foreign-domain work is not implemented in this project. It is recorded in `mappings/CROSS_PROJECT_HANDOFFS.md` using the applicable Social, Security and repository handoff contracts.

## Security handoff integration

The merged CAPITAL-AI-SEC program is consumed from:

- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

`CAPITAL-AI-SOCIAL` owns no `PVC-*` stage. Current Security traceability contains no existing finding routed to Social. Therefore this synchronization does **not** invent a PVC identity or Security finding. The received cross-project Security prompt is retained as `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml` and becomes actionable only when CAPITAL-AI-SEC routes a concrete finding with valid ownership/routing metadata.

## Non-negotiable rules

1. Content generation is not publishing approval.
2. A provider adapter is not publishing authority.
3. Social cannot autonomously publish externally.
4. Credentials and secret values never enter roadmap/evidence content.
5. Engagement/performance metrics are evidence-only and never fabricated.
6. Financial statements remain source/evidence-bound.
7. A changed content snapshot invalidates stale approval.
8. No duplicate generator, provider adapter or publishing path is introduced.
9. Security findings and verification remain CAPITAL-AI-SEC-owned; Social may report `IMPLEMENTED` or `EVIDENCE_READY`, never self-set Security `VERIFIED/CLOSED`.
10. Foreign PVC work is handed off and remains `REFERRED_NOT_EXECUTED` until the actual Primary Owner executes it.
11. A missing canonical Social project-folder mapping is `REQUIRES_CORRELATION`, not permission to invent one.

## Project contents

- `ROADMAP.md` — Social domain execution roadmap candidate.
- `contracts/SOCIAL_CONTENT_PACKAGE_CONTRACT.md` — target Social package and handoff contract.
- `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml` — inbound CAPITAL-AI-SEC handoff prompt/boundary synchronized from PR #631.
- `mappings/CHANNEL_PROVIDER_MATRIX.md` — evidence-based channel/provider capabilities.
- `mappings/CROSS_PROJECT_HANDOFFS.md` — foreign-domain handoffs and Security routing rules.
- `work-packages/SOCIAL_WORK_PACKAGES.md` — SOC-01 through SOC-11.
- `reports/VALIDATION_REPORT_2026-08-31.md` — V2.1.2 validation and PR-gate state.

`SOC-*` identifiers are workstream labels only. They create no ADR, ESS, AUTH, CTRL or PVC authority.