# SEO S1 / WP-S1 — SeoEngine Foundation & Persistenz

**Status:** Foundation auf main; **Persistenz PREPARED** (WP-S1)  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Claim:** `SEO-WP-S1-PERSISTENCE-2026-08-15`  
**Prep-Doc:** `docs/seo/WP_S1_PERSISTENCE_IMPLEMENTATION.md`

## Geliefert (Foundation)

| Baustein | Pfad |
|----------|------|
| Types + In-Memory Service | `src/platform/SeoEngine/` |
| Admin API | `server/routes/seoEngineRoutes.ts` → `/api/seo/*` |
| Schema-Draft | `supabase/migrations/20260815010000_seo_engine.sql` |
| Source-Align + RLS Harden (Prep) | `supabase/migrations/20260815200000_seo_engine_source_align_rls.sql` |
| Tests (memory) | `tests/unit/seoEngineStore.test.ts` |
| Dashboard | S3 / PR #309 |

## No-Demo-Data

Ranks starten leer. API akzeptiert nur `search-console` | `manual-import` (kein `estimated`).

## WP-S1 offen bis DoD

1. `ISeoEngineStore` + Supabase-Adapter (`getServerSupabase`)
2. Production fail-closed ohne privileged Supabase
3. Migration Production-Apply nur mit Owner-Freigabe + Evidence
4. Contract-Tests für Source-Reject und leere Rank-Liste

Siehe Implementierungsplan: `WP_S1_PERSISTENCE_IMPLEMENTATION.md`.
