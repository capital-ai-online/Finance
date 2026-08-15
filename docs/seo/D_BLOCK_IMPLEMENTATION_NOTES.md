# SEO Block D (+ Q2 completion) — Implementation Notes

**Roadmap:** SEO-GM-ROADMAP-0002  
**Branch (prod Soft-404 fix):** `seo/wp-d3-soft-404-prod-fix-2026-08-16`

## Wiring status (2026-08-16)

| ID | Status | How |
|----|--------|-----|
| **Q2 Trailing-Slash 301** | **LIVE** | `registerTrailingSlashNormalize(app)` in `server/routes/registerApplicationRoutes.ts` |
| **D3 Soft-404** | **CODE FIX (this PR)** | `registerProductionSpaFallback` + `express.static(..., { redirect: false, index: false })` in composition root; evidence of prior prod gap documented |

### Apply / re-apply D3 soft-404 (idempotent)

```bash
node scripts/seo/apply-server-wiring.mjs
git add server.application.ts && git commit -m "seo(D3): wire registerProductionSpaFallback + static redirect:false"
```

### Target production branch in `startServer()`

```ts
import { registerProductionSpaFallback } from './server/runtime/spaFallback';
// ...
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath, { redirect: false, index: false }));
  registerProductionSpaFallback(app, distPath);
}
```

`installProductionSoft404Intercept()` remains as defense-in-depth only; it is **not** the production source of truth under the esbuild bundle (dual express instance).

## Evidence

- `docs/evidence/seo/D3_SOFT_404_PROD_GAP_2026-08-16.md`
- `docs/seo/D3_SOFT_404.md`

## Other D-block artefacts

- D1 JSON-LD, D2 routeSeo, D4 vite chunks, D5 GSC runbook
- S1 SeoEngine (VERIFIED)
