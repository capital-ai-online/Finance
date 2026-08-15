# SEO D3 — Soft-404 Behoben

**Status:** CODE FIX in PR (prod gap closed) — was **broken in production** despite helpers on main  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-D3  
**Evidence:** `docs/evidence/seo/D3_SOFT_404_PROD_GAP_2026-08-16.md`

## Verhalten (Soll / nach Fix)

In **Produktion** (`NODE_ENV=production`):

| Pfad | Antwort |
|------|--------|
| `/`, `/impressum`, `/agb`, `/datenschutz` | `200` + passendes HTML (SPA/prerender shell) |
| unbekannte Pfade (z.B. `/foo-bar-xyz`) | **`404 Not Found`** (kein SPA-Shell) |
| Scanner-Köder (`.php`, `/wp-admin`, …) | `404` (bereits via `PROBE_PATH_PATTERNS`) |
| echte Static-Assets unter `/assets/…` | `200` via `express.static` |

In **Development** bleibt Vite-Middleware unverändert.

## Technik (aktuell)

1. **`registerProductionSpaFallback(app, distPath)`** — kanonischer Production-Catch-all (Allow-List, fail-closed 404).
2. **`express.static(distPath, { redirect: false, index: false })`** — kein Directory-Trailing-Slash-Redirect (Konflikt mit Q2 + S2-Prerender-Ordnern).
3. `installProductionSoft404Intercept()` bleibt als optionaler Defense-in-Depth-Patch, ist aber **nicht** die Production-Source-of-Truth (unzuverlässig unter esbuild-Bundle / dual express instance).

## Verifikation

```bash
# nach Deploy
curl -s -o /dev/null -w "%{http_code}" https://capital-ai.online/impressum   # 200
curl -s -o /dev/null -w "%{http_code}" https://capital-ai.online/not-a-real-page-xyz  # 404
```

Unit: `tests/unit/soft404Intercept.test.ts`  
Contract: `tests/server/seoApplicationWiring.contract.test.ts`
