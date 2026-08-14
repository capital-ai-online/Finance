# ADR-DRAFT — SeoEngine Platform Module (S1)

**Status:** Draft — number to be assigned on acceptance (avoid AUD5-F-002 collisions)  
**Date:** 2026-08-15  
**Roadmap:** SEO-ROADMAP-0001 / S1

## Context

CAPITAL-AI has no in-app SEO management. Block Q/D establish crawl/index basics. S1 introduces a platform module for keyword register, rank history, and content inventory without fabricating rankings (No-Demo-Data).

## Decision

1. Place domain code under `src/platform/SeoEngine/`.
2. Persist via Supabase tables `seo_keywords`, `seo_rank_snapshots`, `seo_content_inventory` (migration draft).
3. Rank positions only from Search Console (D5) or explicit manual import — never synthetic SERP data.
4. UI dashboard (S3) and prerender (S2) remain separate ADRs.

## Consequences

- Positive: measurable keyword/content inventory; foundation for H3 feedback loop.
- Negative: schema + RLS must pass security review before production apply.
- Neutral: in-memory seed works offline until migration is applied.
