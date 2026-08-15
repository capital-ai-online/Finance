# SEO S1 / WP-S1 — SeoEngine Foundation & Persistenz

**Status:** Foundation + Store-Code **auf main** (PR #335); Schema + Grants + FK RESTRICT + Ledger **vollständig auf Produktion angewendet**; WP-S1 DoD **nur noch ADR-Nummerierung offen**  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Claims:** `SEO-WP-S1-PERSISTENCE-2026-08-15` → `SEO-WP-S1-STORE-CODE-2026-08-15` (merged) → `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15` (applied)  
**Prep-Doc:** `docs/seo/WP_S1_PERSISTENCE_IMPLEMENTATION.md`  
**Handoff:** `docs/seo/HANDOFF_WP_S1_NEXT_2026-08-15.md`

## Geliefert

| Baustein | Pfad | Evidence |
|----------|------|----------|
| Types + Service-Facade | `src/platform/SeoEngine/` | main |
| Store-Abstraktion | `src/platform/SeoEngine/store/` (`ISeoEngineStore`, Memory, Supabase) | PR #335 |
| Admin API | `server/routes/seoEngineRoutes.ts` → `/api/seo/*` | Store + 503 fail-closed |
| Schema Foundation | `supabase/migrations/20260815010000_seo_engine.sql` | Prod applied |
| Source-Align + RLS Harden | `supabase/migrations/20260815200000_seo_engine_source_align_rls.sql` | Prod applied |
| service_role Grants | `supabase/migrations/20260815210000_seo_engine_service_role_grants.sql` | PR #333 + Prod applied |
| FK RESTRICT | `supabase/migrations/20260815220000_seo_rank_snapshots_fk_restrict.sql` | Prod applied 2026-08-15 |
| Ledger-Abgleich | `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md` | Ausgeführt 2026-08-15 |
| Tests (memory + contracts) | `tests/unit/seoEngineStore.test.ts`, `seoEnginePersistence.contract.test.ts` | main |
| Dashboard | S3 / PR #309 | main |

## No-Demo-Data

Ranks starten leer. API akzeptiert nur `search-console` | `manual-import` (kein `estimated`).

## WP-S1 DoD-Status

1. ~~`ISeoEngineStore` + Supabase-Adapter (`getServerSupabase`)~~ — **main** (PR #335)
2. ~~Production fail-closed ohne privileged Supabase~~ — Factory + 503 in Routes
3. ~~Migration Production-Apply: Foundation / Source-Align / Grants / FK RESTRICT / Ledger-Abgleich~~ — **alle fünf angewendet** (Evidenz: `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`)
4. ~~Contract-Tests für Source-Reject und leere Rank-Liste~~ — main
5. ADR-Draft (`docs/adr/ADR-DRAFT-seo-engine-platform-module.md`) — **noch nicht nummeriert** (nächste freie Nummer: `ADR-0075`, Kollisionscheck offen) — **letzter offener Punkt für WP-S1 VERIFIED**

Siehe Implementierungsplan: `WP_S1_PERSISTENCE_IMPLEMENTATION.md`, Übergabe: `HANDOFF_WP_S1_NEXT_2026-08-15.md`.
