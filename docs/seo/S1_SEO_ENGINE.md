# SEO S1 — SeoEngine Foundation

**Status:** PR (branch `seo/s1-seo-engine-v2`)  
**Roadmap:** SEO-ROADMAP-0001 / S1

## Geliefert

| Baustein | Pfad |
|----------|------|
| Types + Store | `src/platform/SeoEngine/` |
| Admin API | `server/routes/seoEngineRoutes.ts` → `/api/seo/*` |
| Schema-Draft | `supabase/migrations/20260815010000_seo_engine.sql` (bereits auf main) |
| Tests | `tests/unit/seoEngineStore.test.ts` |

## No-Demo-Data

Ranks starten leer. API akzeptiert nur `search-console` | `manual-import` (kein `estimated`).
