# SEO S1 / WP-S1 — SeoEngine Foundation & Persistenz

**Status:** Foundation auf main; **Store-Code IN PR** (WP-S1)  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Claim:** `SEO-WP-S1-PERSISTENCE-2026-08-15` → `SEO-WP-S1-STORE-CODE-2026-08-15`  
**Prep-Doc:** `docs/seo/WP_S1_PERSISTENCE_IMPLEMENTATION.md`

## Geliefert (Foundation)

| Baustein | Pfad |
|----------|------|
| Types + In-Memory Service | `src/platform/SeoEngine/` |
| Store-Abstraktion | `src/platform/SeoEngine/store/` (`ISeoEngineStore`, Memory, Supabase) |
| Admin API | `server/routes/seoEngineRoutes.ts` → `/api/seo/*` |
| Schema | `supabase/migrations/20260815010000_seo_engine.sql` |
| Source-Align + RLS Harden | `supabase/migrations/20260815200000_seo_engine_source_align_rls.sql` |
| service_role Grants | `supabase/migrations/20260815210000_seo_engine_service_role_grants.sql` (PR #333) |
| FK RESTRICT (Repo) | `supabase/migrations/20260815220000_seo_rank_snapshots_fk_restrict.sql` (Owner-Apply) |
| Tests (memory + contracts) | `tests/unit/seoEngineStore.test.ts`, `seoEnginePersistence.contract.test.ts` |
| Dashboard | S3 / PR #309 |

## No-Demo-Data

Ranks starten leer. API akzeptiert nur `search-console` | `manual-import` (kein `estimated`).

## WP-S1 offen bis DoD

1. ~~`ISeoEngineStore` + Supabase-Adapter (`getServerSupabase`)~~ — Code in Branch `seo/wp-s1-store-adapters`
2. ~~Production fail-closed ohne privileged Supabase~~ — Factory + 503 in Routes
3. Migration Production-Apply: Foundation/Grants angewendet (Owner); FK RESTRICT + Ledger-Abgleich noch Owner-Gate
4. ~~Contract-Tests für Source-Reject und leere Rank-Liste~~

Siehe Implementierungsplan: `WP_S1_PERSISTENCE_IMPLEMENTATION.md`.
