# SEO S2 — Public Route Prerender

**Status:** Build-wired  
**Roadmap:** SEO-ROADMAP-0001 / S2

## Verhalten

1. Nach `vite build` schreibt `scripts/seo/prerender-public-routes.mjs`:
   - `dist/index.html` (aktualisierte Meta)
   - `dist/impressum/index.html`
   - `dist/agb/index.html`
   - `dist/datenschutz/index.html`
2. Pro Route: `<title>`, description, canonical, Open Graph, Twitter, noscript-Haupttext.
3. Produktion: `resolvePublicHtmlFile` liefert die route-spezifische Datei, falls vorhanden.

## Scripts

```bash
npm run build          # enthält prerender
npm run seo:prerender  # nur Prerender (dist muss existieren)
```

## Grenzen

- Kein vollständiges React-SSR: der SPA-Body kommt weiter per JS.
- Noscript liefert bewusst nur Kurztext (keine erfundenen Rechtsvolltexte).
- Nächster Ausbau: shared Legal-Copy-Module → echtes HTML im noscript/body.
