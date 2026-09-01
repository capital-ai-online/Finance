# CAPITAL-AI Social Media Roadmap

**Project ID:** `CAPITAL-AI-SOCIAL`  
**Document role:** roadmap / non-authorizing domain projection  
**Status:** ACTIVE — CANONICAL SOCIAL DOMAIN ROADMAP CANDIDATE  
**Version:** 2.1.3  
**Date:** 2026-09-01  
**Synchronized baseline:** `main@9be95dd753f962a789312fec77571e2a9778b586`  
**Security source:** PR #631 merged as `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Project-surface source:** PR #655 merged as `37bf7d954363d99d67083edbf520bd77892888dd`  
**Trust root:** `/AGENTS.md`  
**Primary Project Value Chain ownership:** `[]`

## Purpose

Consolidate Social Media as an independent channel-specific domain while preserving explicit boundaries between source content, SEO, Compliance, Security, Quality assurance, protected execution and Social packaging.

Target invariants:

- content generation is not publishing approval;
- provider adapter is not publishing authority;
- no autonomous external publication;
- no credentials in roadmap/evidence;
- no fabricated engagement metrics;
- financial statements remain evidence-bound;
- stale approval cannot authorize modified content;
- no duplicate generator, provider adapter or publishing path.

## Project organization

Current `main` defines `docs/projects/` as the canonical project-organization surface and explicitly names `CAPITAL-AI-SOCIAL` as a cross-cutting project without productive `PVC-*` ownership.

PR #655 materialized the canonical non-authorizing Social project surface at:

`docs/projects/social-media/`

with branch project-folder slug `social-media`. This project surface is organizational navigation/execution projection only. It does not relocate, duplicate or supersede the bounded Social domain execution surface at:

`docs/social-media/CAPITAL-AI-SOCIAL/`

The detailed Social roadmap, contracts, mappings, handoffs, work packages and reports remain canonical under the bounded Social domain path.

## Scope

Social owns:

- Social Content Packages;
- Channel Adaptation;
- Social Copy;
- Platform Adapter Requirements;
- Publishing Preparation;
- Publishing Handoff;
- Social Evidence;
- Social Performance Assessment;
- Social Drift Detection.

Social does not own canonical Documentary truth, SEO architecture, Security requirements/verification, Compliance policy, Quality verification, protected Production/Provider mutation authority or any `PVC-*` Primary Owner stage.

## External boundaries

| Domain | Owner | Social relationship |
|---|---|---|
| Canonical content/provenance | `CAPITAL-AI-DOC` | consume traceable source content; do not duplicate truth |
| SEO | `CAPITAL-AI-SEO` | keep organic search metadata/discoverability external |
| Security | `CAPITAL-AI-SEC` | consume Security requirements/findings; return implementation/evidence for independent verification |
| Compliance | `CAPITAL-AI-COMP` | embed applicable disclosures/risk language without defining policy |
| Quality assurance | `CAPITAL-AI-QM` | expose Social evidence/findings for independent assessment; no authority transfer |
| Protected external execution | `CAPITAL-AI-OPS` where applicable | hand off approved immutable candidates; no self-authorization |

## Quality Management correlation

`docs/projects/quality-management/` is present on current main. Social does not duplicate its project contract, assurance roadmap, findings lifecycle or verification authority. Where Quality assessment later targets Social, Social implements only Social-owned remediation and returns evidence; Quality closure remains with the applicable QM authority lifecycle.

This work item modifies no QM artifact.

## Security cross-project handoff integration

Current main contains the CAPITAL-AI-SEC V2.1.2 Security domain merged through PR #631. Governing sources include:

- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

Security owns Security requirements, threat/control definition, Security findings, negative-test expectations and independent Security verification. Social owns only Social-local implementation/evidence when a valid Security handoff identifies Social-owned work.

`PROJECT_VALUE_CHAIN.md` assigns `PVC-01..PVC-18` to CLIENT/OPS/DOC/GOV/DATA/FINTECH. CAPITAL-AI-SOCIAL therefore has `primary_value_chain_ownership: []`.

The current Security Traceability Matrix contains no existing finding targeted to CAPITAL-AI-SOCIAL. This roadmap does not fabricate a Security finding or `PVC-*` stage. The generic handoff prompt is retained in `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml`; its Social target-project folder is now resolved to `docs/projects/social-media/` from current repository authority. That folder resolution does not make the handoff actionable by itself: a concrete Security finding with valid ownership and PVC routing is still required.

When a future Security finding is routed to Social:

1. verify current main, open PRs, active writers, project/PVC routing and authority conflicts;
2. require valid ownership and routing metadata from the canonical handoff model;
3. implement only Social-owned files/contracts/runtime code;
4. run target-specific positive and negative Security tests;
5. return exact candidate/runtime evidence to CAPITAL-AI-SEC;
6. Social may report `IMPLEMENTED` or `EVIDENCE_READY` only;
7. CAPITAL-AI-SEC independently decides `VERIFIED/CLOSED`.

If remediation belongs to another Primary Owner, Social stops local foreign implementation and emits the repository Cross-Project-Handoff.

## Social value chain

```text
Canonical Source Content
-> Campaign / Communication Intent
-> Social Content Package
-> Channel Adaptation
-> Compliance / Policy Check
-> Publishing Approval
-> Publishing Preparation
-> Provider Adapter / External Handoff
-> Publication Evidence
-> Performance Evidence
-> Finding / Drift
-> Optimization
```

Generation, approval and external mutation are distinct control steps.

## Existing implementation reuse

The canonical runtime provider stack remains `server/socialMedia/` plus `src/routes/socialMediaRoutes.ts`. Existing generator/templates/media-validation/approval contracts are extended or referenced; no parallel Social pipeline is introduced.

Current provider-backed repository identities:

- X;
- Facebook;
- Instagram;
- TikTok;
- YouTube.

LinkedIn remains partial without canonical provider adapter. Mastodon remains unsupported in the inspected repository state.

Current main still permits the approval gate to be disabled through `SOCIAL_MEDIA_REQUIRE_APPROVAL=false`; this roadmap does **not** claim that foreign Security/Operations enforcement is remediated. Instant publishing only consumes an approval while that gate is enabled. Any hardening of that protected runtime boundary remains a separate correctly owned implementation/handoff.

## Content package contract

The target package is defined in `contracts/SOCIAL_CONTENT_PACKAGE_CONTRACT.md` and carries source identity/domain, channel/type, text/media constraints, links/hashtags, disclosures, language/tone, provenance, generation time and workflow statuses.

The runtime implementation is partial relative to this target contract. This is an extension/reuse gap, not permission to build a second generator.

## Channel adaptation

Channel adaptation validates as applicable:

- text length/counting rules;
- content format;
- link handling;
- hashtags/mentions;
- media requirements/dimensions;
- thread/carousel support;
- disclosure preservation;
- accessibility requirements.

A channel limit must not silently remove mandatory risk/disclosure language or change factual meaning.

## Publishing boundary

Generation can prepare content, adapt channel format, validate constraints, generate previews and prepare provider payloads.

Generation cannot approve external publication, self-authorize provider mutation or reuse stale approval after material content changes.

Real external mutation requires the applicable Human/Owner and protected-operation boundaries, valid provider capability/credentials outside content, a final immutable content/asset/platform snapshot and evidence-backed provider response handling.

Current `draft` and `scheduled` requests remain preparation/log states in the inspected route; they do not by themselves prove later provider scheduling or publication.

## Publishing handoff

Target fields:

- `content_package_id`;
- `channel`;
- `provider_id`;
- `candidate_content_hash`;
- `approval_reference`;
- `requested_operation`;
- `scheduled_time` when applicable;
- `evidence_destination`.

A provider adapter is technical capability only; it never creates approval authority.

## Provider/security boundary

Social may document provider IDs, operations and approved configuration identifiers, but never credential values.

Security-specific expectations such as OAuth hardening, secrets boundaries, authorization/negative tests and independent verification remain CAPITAL-AI-SEC-owned. Protected provider execution and production mutation remain with the applicable OPS/Owner authority.

## Publishing evidence

`PUBLISHED_VERIFIED` requires actual returned/confirmed publication evidence. Target evidence includes package identity, channel/provider, external post ID/URL when available, timestamp/state, content hash, approval reference and trace identity.

A local request, scheduled log record, optimistic UI status or unverified asynchronous provider state is insufficient.

## Analytics and performance

No Social performance metric may be invented. Social consumes only canonical evidenced provider/analytics data, preserving provider metric semantics, channel and measurement window. Missing analytics remains `UNKNOWN`/GAP.

Legacy type fields or estimated scores are not observed engagement/performance evidence.

## Workstreams

| ID | Name | Current state |
|---|---|---|
| SOC-01 | Channel Inventory | BASELINE MAPPED |
| SOC-02 | Provider Inventory | BASELINE MAPPED / Security boundary referenced |
| SOC-03 | Content Sources | HANDOFF-BOUND |
| SOC-04 | Content Packages | CONTRACT DEFINED / RUNTIME PARTIAL |
| SOC-05 | Channel Adaptation | PARTIAL |
| SOC-06 | Publishing Preparation | PARTIAL / Security requirements consumable via handoff |
| SOC-07 | Publishing Handoff | CONTRACT DEFINED / external approval authority retained |
| SOC-08 | Provider Adapters | REUSE / Security verification external |
| SOC-09 | Publishing Evidence | PARTIAL |
| SOC-10 | Analytics Consumption | GAP |
| SOC-11 | Social Drift | DOCUMENTED |

Detailed scope and exit evidence: `work-packages/SOCIAL_WORK_PACKAGES.md`.

## Cross-project handoffs

Foreign work is recorded in `mappings/CROSS_PROJECT_HANDOFFS.md`. Security handoff semantics are additionally captured in `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml`.

No handoff transfers Domain/PVC ownership or permits Social to edit a foreign project's roadmap/implementation.

## Testing

Applicable Social checks include channel constraints, duplicate-provider detection, source/provenance contracts, disclosure preservation, immutable candidate/hash behavior, provider error handling, publication evidence completeness, analytics provenance and routed Security positive/negative tests.

Security or Quality closure remains independently owned by the corresponding assurance domain.

## Risks / findings

Current Social gaps retained:

1. complete runtime SocialContentPackage source/provenance/status model;
2. complete durable publication evidence contract;
3. true provider scheduling not evidenced;
4. LinkedIn adapter absent;
5. provider rate-limit/last-verified evidence model incomplete;
6. Social analytics consumption absent;
7. runtime approval gate remains environment-disableable on current main and therefore must not be misreported as unconditionally fail-closed.

Resolved project-organization finding:

- canonical Social project folder is resolved and present as `docs/projects/social-media/` through merged PR #655; this remains an organizational, non-authorizing project surface.

## Exit criteria

The Social roadmap is consolidated when supported channels/providers are evidence-based, source content is traceable, generation/preparation/approval/external mutation remain separated, publication evidence is explicit, analytics is evidence-backed, foreign work is handed off, no duplicate provider/publish authority exists and routed assurance findings have returned evidence for independent verification.

PR creation and merge remain governed by `/AGENTS.md`; direct `main` edits and self-merge are prohibited.
