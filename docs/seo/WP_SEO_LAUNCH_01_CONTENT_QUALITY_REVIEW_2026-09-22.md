# WP-SEO-LAUNCH-01 — Content Quality & Review Convergence

**Date:** 2026-09-22  
**Status:** `ACTIVE / SEO_OWNED_REVIEW_COMPLETE_FOR_SLICE / FOREIGN_OWNER_GATES_OPEN`  
**Baseline:** `main@93893ab46cc0753dc4e86cd7d6120d321bc48651`  
**Project:** `CAPITAL-AI-SEO`  
**Work package:** `WP-SEO-LAUNCH-01`  
**Sub-workstreams:** `WP-SEO-SPAM`, `WP-SEO-REVIEW`, coordination readback for `WP-SEO-TECH-GATE`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## 1. Post-merge readback

PR #1253 was Human/CODEOWNER merged into `main@93893ab46cc0753dc4e86cd7d6120d321bc48651`.

Merged outcomes retained:

- current qualitative Topic Map includes public intent/competitor evidence without synthetic search metrics;
- Pilot Brief #02 defines evidence-first Multi-Asset Scoring as a source brief only;
- FINTECH truth review remains required before public scoring-methodology claims;
- FAQ public-SEO promotion remains blocked on the owner-correct server/runtime prerequisite.

The predecessor exclusive work claim is released in this continuation.

## 2. Current writer / ownership correlation

At branch creation:

- CURRENT_MAIN = `93893ab46cc0753dc4e86cd7d6120d321bc48651`;
- open SEC PR #1257 changes Security/Auth implementation and associated Security claims/tests;
- no changed-file overlap exists between #1257 and this SEO document/claim slice;
- CAPITAL-AI-SEO remains cross-cutting and gains no productive PVC.

Foreign-owner gates:

| Dependency | Owner | State | SEO behavior |
|---|---|---|---|
| OPS #1252 | CAPITAL-AI-OPS | OPEN | `/faq` remains outside public SEO route set; SEO #1233 blocked |
| FINTECH #1254 | CAPITAL-AI-FINTECH | OPEN | Brief #02 stays source-only / not published |
| OPS #1258 | CAPITAL-AI-OPS | OPEN | external root-metadata divergence requires exact runtime/cache classification |
| GSC/GA4/GenAI reads | provider/read plane | EVIDENCE_GATED | no synthetic zero/PASS |

## 3. Repository-level Helpful Content / Spam review

Inspected canonical SEO surfaces include:

- six-URL `public/sitemap.xml`;
- six-route `src/lib/routeSeo.ts` public SEO mapping;
- Topic Map;
- Launch Brief #01;
- Launch Brief #02;
- current SEO checklist/roadmap constraints.

Current bounded classification:

| Guardrail | Repository observation | State |
|---|---|---|
| scaled keyword/query pages | canonical public set is finite; no mass query-variant route generation is introduced by inspected SEO artifacts | `PASS_REPOSITORY_SCOPE` |
| doorway pages | no separate near-duplicate query landing program is defined in current SEO briefs/map | `PASS_REPOSITORY_SCOPE` |
| cloaking | no SEO requirement or brief requests crawler-only content or alternate hidden copy | `PASS_REPOSITORY_SCOPE` |
| synthetic proof | briefs explicitly prohibit invented ranking, traffic, conversion, return and predictive-accuracy claims | `PASS_REPOSITORY_SCOPE` |
| site reputation abuse | no third-party reputation-hosting strategy is authorized | `PASS_REPOSITORY_SCOPE` |
| link manipulation | no link-buy/exchange/spam program is authorized | `PASS_REPOSITORY_SCOPE` |
| AI content quality | content requires original/product-grounded evidence, reviewer and refresh gate | `PASS_REPOSITORY_SCOPE` |

These states apply only to the inspected repository/content-control surface. They are **not** Google/provider/indexation or whole-public-web PASS states.

## 4. External root metadata divergence

Fresh public crawl observation on 2026-09-22:

- public `https://capital-ai.online/` was surfaced externally as `CAPITAL-AI Portal`;
- the crawled summary referenced quantitative analyses, Compliance and Asset-Scoring.

CURRENT_MAIN source instead declares:

- `CAPITAL-AI – Marktdaten verstehen. Chancen besser erkennen.`;
- corresponding current root description in `index.html`, `src/lib/routeSeo.ts` and prerender configuration.

Classification:

`EXTERNAL_CRAWL_METADATA_DIVERGENCE / ROOT_CAUSE_NOT_PROVEN`

Possible causes include a stale external crawl/cache or an actual build/deploy/cache mismatch. SEO does not choose among them without exact runtime evidence.

Owner-correct verification: OPS #1258.

## 5. Current review — at most two immediate actions

### Action 1 — OPS #1258

Verify exact Production identity and raw initial root HTML. Close as `PRODUCTION_MATCH` if the current metadata is truly live; otherwise remediate only the proven cache/deploy/build root cause.

### Action 2 — OPS #1252 → SEO #1233

Complete `/faq` promotion into the public server/static-HTML route contract. After that exit gate, SEO #1233 can atomically add FAQ metadata, sitemap and prerender while preserving strict route-set equality.

### Active but not immediate publication action

FINTECH #1254 remains required for Pilot Brief #02. It does not become a publication task until the domain-truth review returns and a separate owner-correct publication decision exists.

## 6. Checklist convergence

This slice updates `docs/seo/SEO_CHECKLIST.md` to record:

- current-main correlation;
- Pilot Brief completion at the source-brief level;
- fresh repository-level spam/helpful-content review;
- current technical evidence gap;
- exactly two immediate review actions.

No provider result is inferred from configuration or repository state.

## 7. Exit evidence for this slice

- PR #1253 merged outcome read back;
- predecessor claim released;
- no writer overlap with open SEC #1257;
- content-quality/spam negative gates revalidated at repository scope;
- external metadata discrepancy owner-routed as OPS #1258 without fabricated root cause;
- review produces exactly two immediate actions;
- no Product/Frontend/Runtime/provider/publishing/credential mutation occurs.
