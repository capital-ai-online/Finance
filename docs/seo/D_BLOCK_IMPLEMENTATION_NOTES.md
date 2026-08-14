# SEO Block D (+ Q2 completion) — Implementation Notes (2026-08-15)

**Roadmap:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md`  
**Branch:** `seo/d-block-foundation`  
**Claim:** `SEO-D-BLOCK-2026-08-15`

## Delivered in this PR

| ID | Status | Artefakt |
|----|--------|----------|
| **Q2** | code ready | `server/middleware/seoUrlNormalize.ts` — 301 Trailing-Slash-Normalize |
| **D1** | done | JSON-LD in `index.html` (`Organization`, `WebSite`, `SoftwareApplication`) |
| **D2** | done | `src/lib/routeSeo.ts` + Anwendung in `src/App.tsx` |
| **D3** | code ready | `server/runtime/spaFallback.ts` — Soft-404 für unbekannte Pfade |
| **D4** | done | `vite.config.ts` `manualChunks` |
| **D5** | docs + config stub | `docs/seo/SEARCH_CONSOLE_MCP_RUNBOOK.md`; Topology-Hinweis |

## Server-Wiring (verpflichtend in `server.application.ts`)

Nach dem Probe-Protection-Block und **vor** den API-Routen:

```ts
import { registerTrailingSlashNormalize } from './server/middleware/seoUrlNormalize';
registerTrailingSlashNormalize(app);
```

Im Produktionszweig von `startServer()` den Catch-all ersetzen:

```ts
import { registerProductionSpaFallback } from './server/runtime/spaFallback';
// ...
app.use(express.static(distPath));
registerProductionSpaFallback(app, distPath);
```

> **Hinweis:** Die reinen Hilfsmodule und Tests sind in diesem PR enthalten. Die zwei Import-/Aufrufzeilen in `server.application.ts` müssen beim Merge/Review gesetzt werden (Datei ist sehr groß; getrennte Review-Oberfläche empfohlen).

## Owner follow-ups

1. Q3: Search-Console-Token (Meta oder DNS)
2. D5: GSC OAuth/Credentials und MCP-Eintrag aktivieren (siehe Runbook)
3. S2: echtes Prerendering für Crawler ohne JS
4. Optional: OG-Image als PNG 1200×630
