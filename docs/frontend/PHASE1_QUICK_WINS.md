# Phase 1 — Quick Wins

**Status:** IN PROGRESS  
**Stand:** 16. August 2026  
**Branch:** `feat/frontend-phase1-quickwins-2026-08-16`  
**Bezug:** `FRONTEND_ROADMAP.md` §4 Quick Wins, `src/index.css`, `design-tokens.json`

---

## Ziel

Sofort spürbare visuelle Ruhe und bessere Bedienbarkeit, ohne große Architektur-Umbauten.

| # | Quick Win | Status |
|---|-----------|--------|
| 1 | Mehr Abstand zwischen Hauptkarten | ✅ CSS-Utilities + Enterprise-Scorer Spacing |
| 2 | Score- / Matrix-Bereiche prominent | ⏳ teilweise (Enterprise-Layout) |
| 3 | Einheitliche Status-Badges | ✅ Phase 0 (`StatusBadge`) |
| 4 | Mobile Chip- / Button-Größen (BFSG 44×44) | ✅ `.ui-hit` + Enterprise Filter/Timeframe |
| 5 | Neural-Pulse abschwächen / Reduced-Motion | ✅ Keyframes + `prefers-reduced-motion` |
| 6 | Klare primäre Aktion pro Viewport | ⏳ backlog |

---

## CSS-Fundament (`src/index.css`)

### Motion (Phase 1)
- Neural-/Gold-Pulse: längere Dauer, geringere Scale (±3 %), weichere Glows
- Brand-Border-Animationen: langsamer und leiser
- `@media (prefers-reduced-motion: reduce)`: dekorative Animationen aus

### Utilities
| Klasse | Zweck |
|--------|--------|
| `.ui-panel` | Standard-Glass-Card (blur + border + padding) |
| `.ui-stack` | Vertikaler Stack mit `--ui-section-gap` (2rem) |
| `.ui-hit` | `min-height/width: 44px` (BFSG / EN 301 549) |
| `.neural-decor` | Opacity 0.4 für dekorative SVG-Layer |

### CSS-Variablen
```css
--ui-section-gap: 2rem;
--ui-card-gap: 1.5rem;
--ui-hit-min: 44px;
```

---

## Call-Sites (dieser PR)

1. **Global** — `index.css` Motion + Utilities  
2. **CryptoScoringEnterprise** — `space-y-8`, weichere Blur-Orbs, Filter-Chips und Timeframe-Buttons mit `min-h-11`  

---

## Nächste Schritte (Phase 1 fortsetzen)

1. `.ui-stack` / größere Gaps in `Dashboard`, `AssetUniverseDashboard`, `MarketScreener`
2. Neural-SVG in `Dashboard` / `LandingPage` mit Klasse `neural-decor` markieren
3. Primäre CTA pro Viewport (eine dominante Aktion)
4. Einheitliche Button-/Chip-Primitive (analog StatusBadge)

---

*Phase 1 gestartet 16.08.2026.*
