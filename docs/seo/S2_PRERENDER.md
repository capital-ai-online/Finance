# SEO S2 — Public Route Prerender

**Status:** VERIFIED  
**ADR:** ADR-0084 (Accepted 2026-08-16)  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S2

## Verhalten

1. Nach `vite build` schreibt `scripts/seo/prerender-public-routes.mjs`:
   - `dist/index.html` (aktualisierte Meta)
   - `dist/impressum/index.html`
   - `dist/agb/index.html`
   - `dist/datenschutz/index.html`
2. Pro Route: `<title>`, description, canonical, Open Graph, Twitter, noscript-Haupttext.
3. Produktion: `registerProductionSpaFallback` + `buildPublicHtmlFiles` liefert die route-spezifische Datei, falls vorhanden; sonst Root-Shell nur für allow-listed public paths. Unbekannte Pfade → 404 `text/plain` (WP-D3).

## Scripts

```bash
npm run build          # enthält prerender
npm run seo:prerender  # nur Prerender (dist muss existieren)
```

## Grenzen

- Kein vollständiges React-SSR: der SPA-Body kommt weiter per JS.
- Noscript liefert bewusst nur Kurztext (keine erfundenen Rechtsvolltexte).
- Nächster Ausbau (optional): shared Legal-Copy-Module → echtes HTML im noscript/body; single source mit `routeSeo.ts`.

## Evidence (2026-08-16)

- Prod `/impressum`: unique title + noscript with “Impressum” without JS
- Prod unknown path: HTTP 404 `text/plain`
- ADR-0084 Accepted; WP-S2 closed on roadmap 0002.7
