# CAPITAL-AI-SOCIAL

**Display name:** CAPITAL-AI Social Media  
**Role:** `SOCIAL_MEDIA_DOMAIN`  
**Roadmap version:** 2.1.3  
**Synchronized baseline:** `main@9be95dd753f962a789312fec77571e2a9778b586`  
**Security source merge:** PR #631 / `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Project-surface merge:** PR #655 / `37bf7d954363d99d67083edbf520bd77892888dd`  
**Primary Project Value Chain ownership:** `[]`

## Purpose

`CAPITAL-AI-SOCIAL` is the channel-specific execution domain for Social Content Packages, Channel Adaptation, Social Copy, Provider Adapter Requirements, Publishing Preparation/Handoff, Social Evidence, Performance Assessment and Social Drift Detection.

It is deliberately **not** a publishing authority, canonical-content authority, SEO authority, Security verification authority, Compliance authority or protected external-mutation authority.

## Current project-organization correlation

Current `main` defines `docs/projects/` as the canonical organizational execution surface and explicitly lists `CAPITAL-AI-SOCIAL` as a cross-cutting project with **no productive PVC ownership**.

The canonical project folder is explicitly resolved and present on current `main` as:

`docs/projects/social-media/`

with branch project-folder slug `social-media`. The project surface is a non-authorizing project navigation/execution projection. The existing bounded Social domain and detailed execution surface remains:

`docs/social-media/CAPITAL-AI-SOCIAL/`

The project-folder surface does not relocate, duplicate or supersede the Social domain roadmap, contracts, mappings, handoffs, work packages or reports.

## Quality Management correlation

`CAPITAL-AI-QM` exists under `docs/projects/quality-management/`. Social reuses the repository's project/assurance separation principles where applicable:

- Social owns Social-domain planning/contracts/evidence assessment;
- QM may independently assess quality and findings under its own authority lifecycle;
- Social does not self-assert QM verification;
- QM does not acquire Social publishing, provider or content authority.

This Social synchronization modifies no QM artifact.

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

`CAPITAL-AI-SOCIAL` owns no `PVC-*` stage. Current Security traceability contains no existing finding routed to Social. Therefore this synchronization does **not** invent a PVC identity or Security finding. The received cross-project Security prompt is retained as `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml`; its Social target-project-folder metadata now resolves to `docs/projects/social-media/`, while the prompt remains actionable only when CAPITAL-AI-SEC routes a concrete finding with valid ownership/routing metadata.

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
11. The canonical `docs/projects/social-media/` surface is organizational only and does not create productive PVC, publishing, provider, credential or infrastructure authority.

## Project contents

- `ROADMAP.md` — Social domain execution roadmap candidate.
- `contracts/SOCIAL_CONTENT_PACKAGE_CONTRACT.md` — target Social package and handoff contract.
- `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml` — inbound CAPITAL-AI-SEC handoff prompt/boundary synchronized from PR #631 with current Social project-folder routing metadata.
- `mappings/CHANNEL_PROVIDER_MATRIX.md` — evidence-based channel/provider capabilities.
- `mappings/CROSS_PROJECT_HANDOFFS.md` — foreign-domain handoffs and Security routing rules.
- `work-packages/SOCIAL_WORK_PACKAGES.md` — SOC-01 through SOC-11.
- `reports/VALIDATION_REPORT_2026-08-31.md` — V2.1.2 historical validation and PR-gate state.

`SOC-*` identifiers are workstream labels only. They create no ADR, ESS, AUTH, CTRL or PVC authority.
