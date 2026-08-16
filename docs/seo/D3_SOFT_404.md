# SEO D3 — Soft-404 Behoben

**Status:** **VERIFIED in production** (PR #360 merged; deploy commit `54c48ca`)  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-D3  
**Evidence:** `docs/evidence/seo/D3_SOFT_404_PROD_GAP_2026-08-16.md`

## Verhalten (Soll / live)

In **Produktion** (`NODE_ENV=production`):

| Pfad | Antwort |
|------|--------|
| `/`, `/impressum`, `/agb`, `/datenschutz` | `200` + passendes HTML (SPA/prerender shell) |
| unbekannte Pfade (z.B. `/foo-bar-xyz`) | **`404 Not Found`** (`text/plain`, kein SPA-Shell) |
| Scanner-Köder (`.php`, `/wp-admin`, …) | `404` (via `PROBE_PATH_PATTERNS`) |
| echte Static-Assets unter `/assets/…` | `200` via `express.static` |

In **Development** bleibt Vite-Middleware unverändert.

## Technik

1. **`registerProductionSpaFallback(app, distPath)`** — kanonischer Production-Catch-all (Allow-List, fail-closed 404).
2. **`express.static(distPath, { redirect: false, index: false })`** — kein Directory-Trailing-Slash-Redirect (Konflikt mit Q2 + S2-Prerender-Ordnern).
3. `installProductionSoft404Intercept()` bleibt als optionaler Defense-in-Depth-Patch, ist aber **nicht** die Production-Source-of-Truth (unzuverlässig unter esbuild-Bundle / dual express instance).

## Produktions-Verifikation (2026-08-16T00:40Z)

Deploy-Header: `x-capital-ai-commit: 54c48ca28817b41b93623be61ea8292f0a8288c2`, `x-capital-ai-branch: main`.

| URL | Observed |
|-----|----------|
| `https://capital-ai.online/` | **200** |
| `https://capital-ai.online/impressum` | **200** |
| `https://capital-ai.online/impressum/` | **301** → `/impressum` (Q2) |
| `https://capital-ai.online/agb` | **200** |
| `https://capital-ai.online/datenschutz` | **200** |
| `https://capital-ai.online/not-a-real-page-xyz-seo-check` | **404** `text/plain` body `Not Found` |
| `https://capital-ai.online/wp-admin` | **404** |

```bash
curl -s -o /dev/null -w "%{http_code}" https://capital-ai.online/impressum   # 200
curl -s -o /dev/null -w "%{http_code}" https://capital-ai.online/not-a-real-page-xyz-seo-check  # 404
```

Unit: `tests/unit/soft404Intercept.test.ts`  
Contract: `tests/server/seoApplicationWiring.contract.test.ts`
