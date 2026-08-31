# CAPITAL-AI Social Media Roadmap

**Project ID:** `CAPITAL-AI-SOCIAL`  
**Document role:** roadmap / non-authorizing domain projection  
**Status:** ACTIVE — CANONICAL SOCIAL DOMAIN ROADMAP CANDIDATE  
**Version:** 2.1.1  
**Date:** 2026-08-31  
**Baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Security source:** PR #631 merged as `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Trust root:** `/AGENTS.md`  
**Primary Project Value Chain ownership:** `[]`

## Purpose

Consolidate Social Media as an independent channel-specific domain while preserving explicit boundaries between source content, SEO, compliance, Security, protected execution and Social packaging.

Target invariants:

- content generation is not publishing approval;
- provider adapter is not publishing authority;
- no autonomous external publication;
- no credentials in roadmap/evidence;
- no fabricated engagement metrics;
- financial statements remain evidence-bound;
- stale approval cannot authorize modified content;
- no duplicate generator, provider adapter or publishing path.

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

Social does not own canonical Documentary truth, SEO architecture, Security requirements/verification, Compliance policy, protected Production/Provider mutation authority or any `PVC-*` Primary Owner stage.

## External boundaries

| Domain | Owner | Social relationship |
|---|---|---|
| Canonical content/provenance | `CAPITAL-AI-DOC` | consume traceable source content; do not duplicate truth |
| SEO | `CAPITAL-AI-SEO` | keep organic search metadata/discoverability external |
| Security | `CAPITAL-AI-SEC` | consume Security requirements/findings; return implementation/evidence for independent verification |
| Compliance | `CAPITAL-AI-COMP` | embed applicable disclosures/risk language without defining policy |
| Protected external execution | `CAPITAL-AI-OPS` where applicable | hand off approved immutable candidates; no self-authorization |

## Security cross-project handoff integration

Current main contains the CAPITAL-AI-SEC V2.1.2 Security domain merged through PR #631. Its governing sources are:

- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

Security owns Security requirements, threat/control definition, Security findings, negative-test expectations and independent Security verification. Social owns only Social-local implementation/evidence when a valid Security handoff identifies Social-owned work.

`PROJECT_VALUE_CHAIN.md` explicitly assigns `PVC-01..PVC-18` to CLIENT/OPS/DOC/GOV/DATA/FINTECH and states that Social does not introduce an implicit `PVC-19`. Therefore CAPITAL-AI-SOCIAL has `primary_value_chain_ownership: []`.

The current Security Traceability Matrix routes active findings to OPS, DATA and GOV; it contains no existing finding targeted to CAPITAL-AI-SOCIAL. This roadmap therefore does not fabricate a Security finding or a `PVC-*` stage. The received generic handoff prompt is retained in `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml` with the current target context and `security_findings: []`.

When a future Security finding is routed to Social:

1. verify current main, open PRs, active writers, project/PVC routing and authority conflicts;
2. require a real `project_stage: PVC-NN` from the canonical Primary Owner mapping;
3. implement only Social-owned files/contracts/runtime code;
4. run target-specific positive and negative Security tests;
5. return exact candidate/runtime evidence to CAPITAL-AI-SEC;
6. Social may report `IMPLEMENTED` or `EVIDENCE_READY` only;
7. CAPITAL-AI-SEC independently decides `VERIFIED/CLOSED`.

If the actual remediation belongs to another Primary Owner, Social emits a separate cross-project handoff and leaves it `REFERRED_NOT_EXECUTED`.

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

Provider-backed repository identities currently evidenced:

- X;
- Facebook;
- Instagram;
- TikTok;
- YouTube.

LinkedIn remains partial without canonical provider adapter. Mastodon remains unsupported in the inspected repository state.

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

Generation can:

- prepare content;
- adapt channel format;
- validate content constraints;
- generate preview;
- prepare provider payload.

Generation cannot:

- approve external publication;
- self-authorize provider mutation;
- reuse stale approval after content changes.

Real external mutation requires the existing applicable Human/Owner and protected-operation boundaries, valid provider capability/credentials outside content, a final immutable content/asset/platform snapshot and evidence-backed provider response handling.

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

All foreign work is recorded in `mappings/CROSS_PROJECT_HANDOFFS.md`. Required Security handoff semantics are additionally captured in `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml`.

No handoff transfers Domain/PVC ownership or permits Social to edit a foreign project's roadmap/implementation.

## Testing

Applicable Social checks include:

- channel constraint tests;
- no duplicate provider path;
- source/provenance contract tests;
- disclosure preservation;
- immutable candidate/hash behavior;
- provider explicit-error behavior;
- publication evidence completeness;
- analytics provenance checks;
- Security positive/negative tests when a concrete CAPITAL-AI-SEC finding is routed to Social.

Security-specific pass/closure remains independent CAPITAL-AI-SEC verification.

## Risks / findings

Current Social gaps retained:

1. complete runtime SocialContentPackage source/provenance/status model;
2. complete durable publication evidence contract;
3. true provider scheduling not evidenced;
4. LinkedIn adapter absent;
5. provider rate-limit/last-verified evidence model incomplete;
6. Social analytics consumption absent.

Current Security cross-project correlation adds **no new Social Security finding** because no such finding is present in the merged Security traceability. Any future Security item must arrive through a valid handoff rather than being inferred from generic Security coverage.

## Exit criteria

The Social roadmap is consolidated when supported channels/providers are evidence-based, source content is traceable, generation/preparation/approval/external mutation remain separated, publication evidence is explicit, analytics is evidence-backed, foreign work is handed off, no duplicate provider/publish authority exists and any routed Security finding has returned evidence for independent CAPITAL-AI-SEC verification.

PR creation and merge remain governed by `/AGENTS.md`; direct `main` edits and self-merge are prohibited.