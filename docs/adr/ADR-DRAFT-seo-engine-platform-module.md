# ADR-DRAFT — SeoEngine Platform Module (S1 / WP-S1)

**Status:** Draft — number to be assigned on acceptance (avoid AUD5-F-002 collisions)  
**Date:** 2026-08-15  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Related:** ESS-0014 (read plane later), ADR-0043 privilege separation patterns

## Context

CAPITAL-AI introduced an in-app SeoEngine (keywords, rank snapshots, content inventory) with admin HTTP under `/api/seo` and an in-memory store. A draft Supabase schema exists on main but is not wired and diverges on `source` enum values (`estimated` in SQL vs API No-Demo-Data).

## Decision

1. Keep domain code under `src/platform/SeoEngine/`.
2. Persist via Supabase tables `seo_keywords`, `seo_rank_snapshots`, `seo_content_inventory`.
3. Rank `source` **only** `search-console` | `manual-import` — never synthetic/estimated SERP data.
4. Access path: Express admin routes → `checkAdminAccess` → store → **privileged** server Supabase client only; RLS deny-by-default for anon/authenticated.
5. Abstract storage behind `ISeoEngineStore`; memory adapter for tests; production fails closed without privileged configuration.
6. UI dashboard (S3) and prerender (S2) remain separate decisions/WPs.
7. Production migration apply is an Owner-gated external mutation, not implied by merging repository SQL.

## Consequences

- Positive: durable inventory; honest empty ranks; aligns with platform store patterns (`Compliance/store`).
- Negative: schema + RLS security review and Owner apply step required before production durability.
- Neutral: in-memory remains valid offline/test path until apply.

## Security invariants

1. No publishable/anon fallback for writes.
2. No estimated ranks in schema or API.
3. Admin zone IAM unchanged.
4. Shared migration files limited to `seo_*` objects.
