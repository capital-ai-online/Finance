# SEO Block D (+ Q2 completion) — Implementation Notes (2026-08-15)

**Roadmap:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md`  
**Branch:** `seo/d-block-foundation`  
**Claim:** `SEO-D-BLOCK-2026-08-15`  
**PR:** https://github.com/SvenKulessa/Finance/pull/280

## Delivered

| ID | Status | Artefakt |
|----|--------|----------|
| **Q2** | code + tests | `server/middleware/seoUrlNormalize.ts` |
| **D1** | done | JSON-LD in `index.html` |
| **D2** | done | `src/lib/routeSeo.ts` + `src/main.tsx` |
| **D3** | code ready | `server/runtime/spaFallback.ts` |
| **D4** | done | `vite.config.ts` `manualChunks` |
| **D5** | docs | `docs/seo/SEARCH_CONSOLE_MCP_RUNBOOK.md` |
| **S1** | scaffold | `src/platform/SeoEngine/**`, migration draft, ADR draft |

## Server-Wiring (noch offen in `server.application.ts`)

Datei ist sehr groß (~140 KB); deshalb extrahierte Module + Contract-Test.

### 1) Imports (nach den bestehenden `server/runtime/*` Imports)

```ts
import { registerTrailingSlashNormalize } from './server/middleware/seoUrlNormalize';
import { registerProductionSpaFallback } from './server/runtime/spaFallback';
```

### 2) Nach dem `PROBE_PATH_PATTERNS`-Block

```ts
registerTrailingSlashNormalize(app);
```

### 3) Produktions-SPA-Zweig ersetzen

```ts
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  registerProductionSpaFallback(app, distPath);
}
```

Danach in `tests/server/seoApplicationWiring.contract.test.ts` `REQUIRE_WIRING = true` setzen.

## Owner follow-ups

1. Q2/D3 Wiring (3 Snippets oben)
2. Q3 Search-Console-Token
3. Migration `20260815010000_seo_engine.sql` review + apply
4. ADR-Nummer für SeoEngine vergeben
5. S2 Prerender ADR
