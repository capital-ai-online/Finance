# SEO S1 — SeoEngine Foundation

**Status:** implementiert (Branch `seo/s1-seo-engine-foundation`)  
**Roadmap:** SEO-ROADMAP-0001 / S1  
**ADR:** `docs/adr/ADR-DRAFT-seo-engine-platform-module.md`

## Was geliefert ist

| Baustein | Pfad |
|----------|------|
| Types | `src/platform/SeoEngine/types.ts` |
| In-Memory Store | `src/platform/SeoEngine/store.ts` |
| HTTP API (Admin) | `server/routes/seoEngineRoutes.ts` → `/api/seo/*` |
| Migration Draft | `supabase/migrations/20260815120000_seo_engine.sql` |
| Tests | `tests/unit/seoEngineStore.test.ts` |

## API (Admin-Rolle via `checkAdminAccess`)

| Method | Path | Zweck |
|--------|------|--------|
| GET | `/api/seo/summary` | Zähler; `hasMeasuredRanks` |
| GET/POST | `/api/seo/keywords` | Keyword-Register |
| GET/POST | `/api/seo/ranks` | Rank-Snapshots (`search-console` \| `manual-import` only) |
| GET/POST | `/api/seo/content` | Content-Inventar |

## No-Demo-Data

- Rank-Liste startet **leer**.
- Keine synthetischen SERP-Positionen.
- Positionen nur aus Search Console (D5) oder Owner-Import.

## Noch offen

- Supabase-Migration nach Security-Review anwenden und Store an DB koppeln
- S3 Dashboard-UI
- D5 GSC-Import-Pipeline
