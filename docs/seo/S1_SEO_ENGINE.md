# SEO S1 / WP-S1 — SeoEngine Foundation & Persistenz

**Status:** Foundation + Store-Code **auf main** (PR #335); WP-S1 DoD **teilweise** (Owner-Gates offen)  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Claims:** `SEO-WP-S1-PERSISTENCE-2026-08-15` → `SEO-WP-S1-STORE-CODE-2026-08-15` (merged)  
**Prep-Doc:** `docs/seo/WP_S1_PERSISTENCE_IMPLEMENTATION.md`

## Geliefert

| Baustein | Pfad | Evidence |
|----------|------|----------|
| Types + Service-Facade | `src/platform/SeoEngine/` | main |
| Store-Abstraktion | `src/platform/SeoEngine/store/` (`ISeoEngineStore`, Memory, Supabase) | PR #335 |
| Admin API | `server/routes/seoEngineRoutes.ts` → `/api/seo/*` | Store + 503 fail-closed |
| Schema Foundation | `supabase/migrations/20260815010000_seo_engine.sql` | Prod apply (Owner) |
| Source-Align + RLS Harden | `supabase/migrations/20260815200000_seo_engine_source_align_rls.sql` | Prod apply (Owner) |
| service_role Grants | `supabase/migrations/20260815210000_seo_engine_service_role_grants.sql` | PR #333 + Prod apply |
| FK RESTRICT (Repo) | `supabase/migrations/20260815220000_seo_rank_snapshots_fk_restrict.sql` | **Owner-Apply pending** |
| Tests (memory + contracts) | `tests/unit/seoEngineStore.test.ts`, `seoEnginePersistence.contract.test.ts` | main |
| Dashboard | S3 / PR #309 | main |

## No-Demo-Data

Ranks starten leer. API akzeptiert nur `search-console` | `manual-import` (kein `estimated`).

## WP-S1 DoD-Status

1. ~~`ISeoEngineStore` + Supabase-Adapter (`getServerSupabase`)~~ — **main** (PR #335)
2. ~~Production fail-closed ohne privileged Supabase~~ — Factory + 503 in Routes
3. Migration Production-Apply: Foundation / Source-Align / Grants **angewendet** (Owner); **FK RESTRICT + Ledger-Abgleich noch Owner-Gate**
4. ~~Contract-Tests für Source-Reject und leere Rank-Liste~~ — main
5. ADR-Draft (`docs/adr/ADR-DRAFT-seo-engine-platform-module.md`) — **noch nicht nummeriert** (Kollisionscheck offen)

Siehe Implementierungsplan: `WP_S1_PERSISTENCE_IMPLEMENTATION.md`.
