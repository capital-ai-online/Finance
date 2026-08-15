# SEO Block D (+ Q2 completion) — Implementation Notes

**PR:** https://github.com/SvenKulessa/Finance/pull/280  
**Branch:** `seo/d-block-foundation`

## Wiring status (2026-08-15)

| ID | Status | How |
|----|--------|-----|
| **Q2 Trailing-Slash 301** | **LIVE in branch** | `registerTrailingSlashNormalize(app)` in `server/routes/registerApplicationRoutes.ts` |
| **D3 Soft-404** | helper ready | `server/runtime/spaFallback.ts` — SPA catch-all in `server.application.ts` still uses `app.get('*')` until script applied |

### Apply remaining D3 soft-404 (one command)

```bash
node scripts/seo/apply-server-wiring.mjs
git add server.application.ts && git commit -m "seo(D3): wire registerProductionSpaFallback in production SPA branch"
```

The script is idempotent and also adds the import if missing.

### Manual D3 snippet (if script is not used)

Replace in `startServer()` production branch:

```ts
import { registerProductionSpaFallback } from './server/runtime/spaFallback';
// ...
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  registerProductionSpaFallback(app, distPath);
}
```

## Delivered artefacts

- D1 JSON-LD, D2 routeSeo, D4 vite chunks, D5 GSC runbook
- S1 SeoEngine scaffold
- N1 `POST /api/social-media/generate` + client `generateSeries`
