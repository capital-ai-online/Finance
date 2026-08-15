# SEO D3 — Soft-404 Behoben

**Status:** implementiert (Branch `seo/d3-soft-404-wiring`)  
**Roadmap:** SEO-ROADMAP-0001 / D3

## Verhalten

In **Produktion** (`NODE_ENV=production`):

| Pfad | Antwort |
|------|--------|
| `/`, `/impressum`, `/agb`, `/datenschutz` | `200` + `index.html` (SPA-Shell) |
| unbekannte Pfade (z.B. `/foo-bar-xyz`) | **`404 Not Found`** (kein SPA-Shell) |
| Scanner-Köder (`.php`, `/wp-admin`, …) | `404` (bereits via `PROBE_PATH_PATTERNS`) |
| echte Static-Assets unter `/assets/…` | `200` via `express.static` |

In **Development** bleibt Vite-Middleware unverändert (kein Intercept nötig).

## Technik

1. `installProductionSoft404Intercept()` patcht `express.application.get` **einmal**.
2. Wird aus `registerApplicationRoutes()` aufgerufen — **vor** `startServer()`, der `app.get('*', sendFile)` registriert.
3. Jeder spätere Production-Catch-all wird so gewrappt, dass nur `isPublicSpaPath` die SPA-Shell erhält.

Damit entfällt ein Full-Rewrite von `server.application.ts` (~140 KB Composition Root).

## Verifikation

```bash
# nach Deploy
curl -s -o /dev/null -w "%{http_code}" https://capital-ai.online/impressum   # 200
curl -s -o /dev/null -w "%{http_code}" https://capital-ai.online/not-a-real-page-xyz  # 404
```

Unit: `tests/unit/soft404Intercept.test.ts`  
Contract: `tests/server/seoApplicationWiring.contract.test.ts`
