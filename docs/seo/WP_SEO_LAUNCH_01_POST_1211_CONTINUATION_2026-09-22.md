# WP-SEO-LAUNCH-01 — Post-PR #1211 Continuation

**Date:** 2026-09-22  
**Status:** `ACTIVE / TOPIC_CONTENT_EVIDENCE_REFRESH / FAQ_OWNER_HANDOFF_OPEN`  
**Baseline:** `main@11f0bcc6f1c4bf44c52c5cdda8d0bd2d965f66e1`  
**Project:** `CAPITAL-AI-SEO`  
**Work package:** `WP-SEO-LAUNCH-01`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## 1. Post-merge readback

PR #1211 was Human/CODEOWNER merged at `main@c01e1096ef0c2595b97daa23e4aca25129b2545c` and is the SEO convergence baseline inherited by this continuation. FE PR #1250 subsequently moved CURRENT_MAIN to `main@375bab9f3b05c08ce86d9909e3b024b34097d8b2`, and SOCIAL PR #1234 then moved CURRENT_MAIN to `main@11f0bcc6f1c4bf44c52c5cdda8d0bd2d965f66e1`. Neither change set overlaps this SEO documentation/topic-evidence slice.

Merged outcomes:

- root landing metadata aligns to the current “Marktdaten verstehen. Chancen besser erkennen.” proposition;
- Impressum metadata uses `§ 5 DDG`;
- stale active dependency references to older Frontend snapshots were removed from the active SEO implementation;
- provider evidence remains independently gated rather than inferred from repository state.

The predecessor exclusive work claim is released in this slice because its merge release condition is satisfied.

## 2. FAQ continuation and owner boundary

OPS #1223 / PR #1249 made `/faq` directly reachable through the Production SPA shell.

Fresh current-main inspection shows that this is intentionally an intermediate state:

- `/faq` remains in `APPLICATION_SPA_PATHS`;
- it is not yet in `PUBLIC_SPA_PATHS`;
- Production fallback returns the generic root document for `/faq`;
- the canonical SEO regression still requires exact equality across route SEO, sitemap, prerender, `PUBLIC_SPA_PATHS` and route-specific public HTML fallback.

Therefore SEO Issue #1233 cannot atomically promote `/faq` by changing only SEO-owned surfaces.

Owner-correct handoff: **CAPITAL-AI-OPS Issue #1252**.  
SEO #1233 state: `BLOCKED_ON_OPS_PUBLIC_ROUTE_PROMOTION`.

No test or security invariant is weakened to bypass this dependency.

## 3. Writer / overlap correlation

Correlation across branch creation and pre-PR sync:

- FE PR #1250 changed login/session/landing presentation and subscription badge surfaces and then Human/CODEOWNER merged while this SEO slice was being authored;
- its changed-file set does not overlap this SEO documentation/topic-evidence slice;
- the SEO branch was first synchronized to `main@375bab9f3b05c08ce86d9909e3b024b34097d8b2` after FE #1250 and then re-synchronized to `main@11f0bcc6f1c4bf44c52c5cdda8d0bd2d965f66e1` after SOCIAL #1234;
- SOCIAL #1234 changed only `docs/runbooks/SOCIAL_MEDIA_OAUTH_SETUP.md` and has no overlap with this SEO slice;
- no competing open SEO writer was found.

This branch changes SEO project/evidence documents and work-claim coordination only.

## 4. Next dependency-ready SEO-owned slice

Selected continuation:

- `WP-SEO-TOPICS`;
- `WP-SEO-CONTENT`.

Rationale:

- the FAQ implementation path is foreign-owner blocked;
- GSC Search Analytics/GA4/GenAI measurements remain provider-read gated;
- topic/content research can advance without provider mutation, publication, Frontend runtime change or invented measurement data.

## 5. Public search / competitor evidence

Current public search results show repeated user/product emphasis on:

- AI stock/market analysis;
- understandable scoring factors;
- data-source and model transparency;
- multi-asset analysis;
- model/confidence limitations and explicit non-advisory boundaries.

This evidence is used only for qualitative intent/content-gap analysis.

No ranking order, search volume, keyword difficulty, traffic estimate, conversion estimate or competitor superiority score is recorded as CAPITAL-AI evidence.

## 6. CAPITAL-AI differentiation hypothesis

The strongest evidence-backed content gap is:

**transparent, evidence-first multi-asset scoring and analysis boundaries.**

The repository supports a differentiated story around:

- multi-asset research;
- provenance/data-quality/scoring lineage;
- model/version governance;
- explicit separation of some research lenses from canonical scoring;
- fail-closed handling of missing/unverified evidence where the applicable contract requires it.

The story must remain model-specific. A universal formula is not inferred.

## 7. Artifacts

Updated:

- `docs/projects/seo/ROADMAP.md`;
- `docs/seo/SEO_TOPIC_MAP_PUBLIC_LAUNCH_2026-09-21.md`.

Added:

- `docs/seo/SEO_LAUNCH_CONTENT_BRIEF_02_2026-09-22.md`;
- this continuation evidence record;
- a fresh bounded SEO work claim.

## 8. Remaining gates

| Lane | State |
|---|---|
| PR #1211 repository SEO baseline | `MERGED` |
| FAQ direct SPA reachability | `PASS_REPOSITORY` via OPS #1223/#1249 |
| FAQ public SEO route promotion | `BLOCKED_ON_OPS_1252` |
| GSC Search Analytics/current performance | `READ_BLOCKED_NOT_CONNECTED` unless a fresh provider read proves otherwise |
| GA4 baseline | `READ_BLOCKED_NOT_CONNECTED` unless a fresh provider read proves otherwise |
| GenAI visibility | `EVIDENCE_GATED` |
| Pilot Brief #02 | `SEO_SOURCE_BRIEF / NOT_PUBLISHED` |
| Publishing / new route | `NOT_AUTHORIZED_BY_THIS_SLICE` |

## 9. Exit evidence for this slice

- predecessor merged claim released;
- canonical SEO roadmap reconciled to the post-#1211 main baseline;
- FAQ blocker reclassified from completed #1223 to exact remaining OPS #1252;
- topic map enriched with real public intent/competitor evidence without synthetic metrics;
- Pilot Brief #02 ties all CAPITAL-AI scoring claims to FINTECH truth gates;
- no provider, publication, credential, Product/Frontend or Runtime mutation occurs.
