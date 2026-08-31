# CAPITAL-AI-SOCIAL Content Package Contract

**Contract role:** target Social execution contract / non-authorizing  
**Version:** 2.1.1  
**Date:** 2026-08-31

## 1. SocialContentPackage

A Social content package MUST carry:

| Field | Required | Semantics |
|---|---|---|
| `content_package_id` | yes | stable Social package identity |
| `source_content_id` | yes | canonical source identity |
| `source_domain` | yes | owning source domain |
| `campaign_id` | when applicable | Marketing-owned campaign/communication intent reference |
| `channel` | yes | target Social channel |
| `content_type` | yes | post/thread/carousel/video caption/etc. |
| `text` | yes for text surface | final candidate copy |
| `media_requirements` | yes | required media/aspect/accessibility constraints or explicit none |
| `hashtags` | yes | explicit list, may be empty |
| `links` | yes | explicit list, may be empty |
| `disclosures` | yes | required disclosure/risk language, may only be empty when validated not applicable |
| `language` | yes | package language |
| `tone` | yes | approved tone/adaptation intent |
| `provenance` | yes | source/evidence + transformation trace |
| `generated_at` | yes | generation timestamp |
| `approval_status` | yes | workflow status only; not authority itself |
| `publish_status` | yes | publication/handoff state only |

## 2. Approval statuses

Allowed values:

- `DRAFT`
- `REVIEW_REQUIRED`
- `APPROVED_FOR_HANDOFF`
- `REJECTED`
- `SUPERSEDED`

`APPROVED_FOR_HANDOFF` is valid only when linked to the existing Human/Owner approval authority. A Social generator cannot set this state by self-approval.

Any material change to text, title, hashtags, media, disclosures or target-platform set invalidates stale approval and requires the applicable approval process again.

## 3. Publish statuses

Allowed values:

- `NOT_REQUESTED`
- `READY_FOR_HANDOFF`
- `HANDOFF_PENDING`
- `PUBLISHED_VERIFIED`
- `PUBLISH_FAILED`
- `UNKNOWN`

`PUBLISHED_VERIFIED` requires publication evidence; a request, scheduler log, HTTP attempt or optimistic UI state is insufficient.

## 4. Source-content invariants

- Source content is traceable and remains authoritative in its source domain.
- Social adaptation preserves factual meaning.
- Public financial claims require verified evidence.
- Required disclosures/risk language cannot be silently removed or weakened.
- AI-assisted copy remains traceable to source and transformation.
- Generated copy cannot fabricate prices, scores, performance, reach or engagement.
- Scoring output is not transformed into personalized investment advice unless a separately authorized architecture explicitly permits it.

## 5. Channel adaptation contract

An adaptation records or validates, where applicable:

- text length/counting rule;
- surface/format;
- link handling;
- hashtag/mention limits;
- media dimensions/type;
- thread/carousel support;
- disclosure support;
- accessibility requirements.

A shortened variant that cannot preserve required meaning/disclosures is `REVIEW_REQUIRED` or rejected; it is not silently truncated into compliance drift.

## 6. PublishHandoff

The separate publish handoff MUST include:

| Field | Required |
|---|---|
| `content_package_id` | yes |
| `channel` | yes |
| `provider_id` | yes |
| `candidate_content_hash` | yes |
| `approval_reference` | yes for real external mutation |
| `requested_operation` | yes |
| `scheduled_time` | when applicable |
| `evidence_destination` | yes |

The provider adapter validates the final handoff against its channel capability. It does not grant authority.

Security requirements or findings associated with this handoff are referenced separately and remain CAPITAL-AI-SEC-owned. A Social package or handoff status cannot self-assert Security `VERIFIED/CLOSED`.

## 7. Publication evidence

For `PUBLISHED_VERIFIED`, evidence should include:

- package ID;
- channel/provider;
- external post ID;
- external URL if returned;
- provider-confirmed timestamp/state;
- content hash;
- approval reference;
- trace ID;
- provider response classification.

Asynchronous provider `pending` is not promoted to `PUBLISHED_VERIFIED` until confirmation evidence exists.

## 8. Security evidence return

If a concrete CAPITAL-AI-SEC handoff applies to Social-owned implementation, Social returns at minimum:

- source Security finding;
- Social project identity;
- project stage supplied by the valid handoff;
- implementation status;
- changed files;
- exact candidate SHA;
- runtime SHA when applicable;
- Security tests and negative tests;
- evidence paths;
- known residual risk;
- unresolved dependencies;
- `verification_requested: true` when evidence is ready.

Only CAPITAL-AI-SEC may independently set the Security finding to `VERIFIED/CLOSED`.

## 9. Current implementation mapping

Current repository implementation is **PARTIAL** relative to this target contract:

- existing Social text generation provides channel variants but not the complete source/provenance/status model;
- publish payloads carry channel/caption/media information but not every canonical package identity field;
- existing content hashing can be reused for final-snapshot approval binding;
- publish logging persists partial publication evidence but not the complete evidence fields above.

Implementation work MUST extend/reuse existing contracts rather than create a parallel Social pipeline.