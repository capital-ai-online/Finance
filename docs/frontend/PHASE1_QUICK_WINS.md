# Phase 1 — Quick Wins

**Status:** IN PROGRESS  
**Stand:** 19. August 2026  
**Aktiver Branch:** `feat/frontend-qw-paket-a-2026-08-19`  
**Bezug:** `FRONTEND_ROADMAP.md` §4 Quick Wins, `src/index.css`, `design-tokens.json`, `PHASE0_PERFORMANCE_BASELINE.md`

---

## Ziel

Sofort spürbare visuelle Ruhe und bessere Bedienbarkeit, ohne große Architektur-Umbauten.

| # | Quick Win | Status |
|---|-----------|--------|
| 1 | Mehr Abstand zwischen Hauptkarten | ✅ CSS-Utilities + Enterprise + Universe + AssetUniverse + MarketScreener |
| 2 | Score- / Matrix-Bereiche prominent | ⏳ teilweise (Enterprise-Layout) |
| 3 | Einheitliche Status-Badges | 🟡 Primitive ✅; siteweite Migration noch offen |
| 4 | Mobile Chip- / Button-Größen (44×44 Policy) | 🟡 Enterprise / Universe / AssetUniverse + MarketScreener; weitere Surfaces offen |
| 5 | Neural-Pulse abschwächen / Reduced-Motion | ✅ Keyframes + `prefers-reduced-motion`; `neural-decor` Call-Sites noch offen |
| 6 | Klare primäre Aktion pro Viewport | 🟡 MarketScreener umgesetzt; weitere Views offen |

---

## QW-Paket A — 19.08.2026

### A1 — Dashboard-Code-Splitting

- `src/App.tsx`: statischen `Dashboard`-Import entfernt.
- Dashboard wird über `React.lazy()` und dynamischen `import()` erst beim Rendern der Dashboard-Surface geladen.
- `React.Suspense` stellt einen expliziten, screenreader-kompatiblen Ladezustand bereit.
- Keine manuelle `manualChunks`-Konfiguration eingeführt; damit wird der in PR #288 dokumentierte React-/Vendor-Chunk-Zyklus nicht wiederholt.

**Status:** ✅ IMPLEMENTED — Build-/Bundle-Evidence noch über CI bzw. Produktions-Baseline zu verifizieren.

### A2 — MarketScreener Layout / Hit Targets / Semantik

- Root auf `.ui-stack`, Hauptpanel auf `.ui-panel` vereinheitlicht.
- Primäre Scan-Aktion visuell eindeutig hervorgehoben.
- Suchfeld, Suchergebnisse, Asset-Auswahl, Remove-Buttons, Selects und AI-Zusammenfassung verwenden `.ui-hit`.
- Suchfeld erhält programmatisches Label; Remove-Controls erhalten `aria-label`; technischer Fehlerzustand erhält `role="alert"`.

**Status:** ✅ IMPLEMENTED — visuelle/A11y-Abnahme noch über CI/Browser-Smoke bzw. axe/Lighthouse.

### A3 — Regression Guard

`tests/unit/frontendQuickWinsPackageA.test.ts` schützt statisch:

- Lazy-/Suspense-Grenze für `Dashboard`,
- Nutzung von `ui-stack`, `ui-panel` und `ui-hit` im `MarketScreener`,
- dominante Screening-CTA,
- programmatisch angekündigten Fehlerzustand.

**Status:** ✅ IMPLEMENTED — Testausführung noch offen.

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
| `.ui-hit` | `min-height/width: 44px` (Projekt-Policy; konservativer als WCAG 2.2 AA Minimum) |
| `.neural-decor` | Opacity 0.4 für dekorative SVG-Layer |

### CSS-Variablen
```css
--ui-section-gap: 2rem;
--ui-card-gap: 1.5rem;
--ui-hit-min: 44px;
```

---

## Call-Sites

1. **Global** — `index.css` Motion + Utilities  
2. **CryptoScoringEnterprise** — `space-y-8`, weichere Blur-Orbs, Filter-Chips und Timeframe-Buttons mit `min-h-11`  
3. **AssetUniverseDashboard** — `ui-stack` Root, `ui-panel` Cards, Asset-Tabs + JSON-Buttons mit `ui-hit` / `min-h-11`  
4. **UniverseBestWorst** — `ui-panel` Root, Refresh + Ranking-Rows mit `ui-hit` / `min-h-11`, Grid `gap-6`  
5. **Dashboard** — Main Content bereits `space-y-8` / `py-8` (Shell-Spacing); App-Shell jetzt lazy geladen  
6. **MarketScreener** — `ui-stack`, `ui-panel`, `.ui-hit`, dominante Primary CTA, programmatische Search-/Error-Semantik

---

## Nächste Schritte (QW-Paket A fortsetzen)

1. Neural-SVG in `Dashboard` / `LandingPage` mit Klasse `neural-decor` markieren.
2. Weitere schwere Dashboard-Views nach erfolgreichem Shell-Code-Splitting gezielt lazy laden; keine manuelle Vendor-Chunk-Aufteilung.
3. Primäre CTA-Regel auf Dashboard-Hauptansicht und weitere Kern-Views ausweiten.
4. Weitere kleine Icon-Controls gegen die 44×44-Projekt-Policy prüfen.
5. Live Lighthouse / axe sowie Bundle-/Chunk-Baseline dokumentieren.
6. Danach einheitliche Button-/Chip-Primitive (analog `StatusBadge`) als nächstes Paket vorbereiten.

---

*Phase 1 gestartet 16.08.2026 · Spacing Dashboard/Universe 16.08.2026 · QW-Paket A gestartet 19.08.2026.*
