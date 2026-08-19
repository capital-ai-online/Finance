# Phase 1 — Quick Wins

**Status:** IMPLEMENTED / LIVE EVIDENCE PENDING  
**Stand:** 19. August 2026  
**Aktiver Branch:** `feat/frontend-qw-paket-a-2026-08-19`  
**Bezug:** `FRONTEND_ROADMAP.md` §4 Quick Wins, `src/index.css`, `design-tokens.json`, `PHASE0_PERFORMANCE_BASELINE.md`

---

## Ziel

Sofort spürbare visuelle Ruhe und bessere Bedienbarkeit, ohne große Architektur-Umbauten.

| # | Quick Win | Status |
|---|-----------|--------|
| 1 | Mehr Abstand zwischen Hauptkarten | ✅ CSS-Utilities + Enterprise + Universe + AssetUniverse + MarketScreener |
| 2 | Score- / Matrix-Bereiche prominent | ⏳ teilweise (Enterprise-Layout; gehört in Folgearbeit) |
| 3 | Einheitliche Status-Badges | 🟡 Primitive ✅; siteweite Migration folgt paketübergreifend |
| 4 | Mobile Chip- / Button-Größen (44×44 Policy) | 🟡 Kern-Surfaces + Dashboard-P1-Controls umgesetzt; app-weite Konsolidierung folgt |
| 5 | Neural-Pulse abschwächen / Reduced-Motion | ✅ Keyframes + `prefers-reduced-motion` + Dashboard/Landing Root-Scope |
| 6 | Klare primäre Aktion pro Viewport | ✅ Stichprobe Kern-Views: MarketScreener, Free/Gast Dashboard, Myworkspace; app-weite Design-System-Regel folgt |

---

## QW-Paket A — 19.08.2026

### A1 — Dashboard-Code-Splitting

- `src/App.tsx`: statischen `Dashboard`-Import entfernt.
- Dashboard wird über `React.lazy()` und dynamischen `import()` erst beim Rendern der Dashboard-Surface geladen.
- `React.Suspense` stellt einen expliziten, screenreader-kompatiblen Ladezustand bereit.
- Keine manuelle `manualChunks`-Konfiguration eingeführt; damit wird der in PR #288 dokumentierte React-/Vendor-Chunk-Zyklus nicht wiederholt.

**Status:** ✅ IMPLEMENTED — Build-/Bundle-Evidence noch über PR-CI bzw. reproduzierbaren Produktions-Build zu verifizieren.

### A2 — MarketScreener Layout / Hit Targets / Semantik

- Root auf `.ui-stack`, Hauptpanel auf `.ui-panel` vereinheitlicht.
- Primäre Scan-Aktion visuell eindeutig hervorgehoben.
- Suchfeld, Suchergebnisse, Asset-Auswahl, Remove-Buttons, Selects und AI-Zusammenfassung verwenden `.ui-hit`.
- Suchfeld erhält programmatisches Label; Remove-Controls erhalten `aria-label`; technischer Fehlerzustand erhält `role="alert"`.

**Status:** ✅ IMPLEMENTED — visuelle/A11y-Live-Abnahme noch über Browser-Smoke bzw. axe/Lighthouse.

### A3 — Regression Guard

`tests/unit/frontendQuickWinsPackageA.test.ts` schützt statisch:

- Lazy-/Suspense-Grenze für `Dashboard`,
- Dynamic-Import-Fassaden für schwere Sekundäransichten,
- schwere Abhängigkeiten hinter den Implementierungsgrenzen,
- Verbot einer erneuten `manualChunks`-Vendor-Aufteilung,
- Nutzung von `ui-stack`, `ui-panel` und `ui-hit` im `MarketScreener`,
- dominante Screening-CTA,
- programmatisch angekündigten Fehlerzustand,
- Neural-Layer-Dämpfung und 44×44-Sprungziele,
- semantische Dashboard-Profil-/Breadcrumb-/Dismiss-Controls.

**Status:** ✅ IMPLEMENTED — tatsächliche Testausführung über Klasse-C-CI noch offen.

### A4 — Sekundäre Views lazy laden

Drei besonders schwere bzw. selten initial benötigte Views wurden hinter native `React.lazy()`-/`import()`-Grenzen verschoben:

- `BacktestEngine` → `BacktestEngineImpl` (u. a. jsPDF + Recharts),
- `SentimentDashboard` → `SentimentDashboardImpl` (Recharts),
- `AdminPortal` → `AdminPortalImpl` (umfangreicher Admin-Komponentenbaum).

Die öffentlichen Importpfade bleiben unverändert; die vorhandenen Implementierungen wurden byte-identisch als `*Impl.tsx` übernommen. Jede Fassade besitzt einen `Suspense`-Fallback mit `role="status"` und `aria-live="polite"`.

**Status:** ✅ IMPLEMENTED — tatsächliche Chunk-Größen noch über Build-Evidence zu messen.

### A5 — Neural Motion + Dashboard Hit Targets

- Dashboard- und LandingPage-Neural-Layer werden über präzise Root-Selektoren auf `opacity: 0.4` begrenzt.
- `.neural-decor` bleibt die bevorzugte Utility für neue bzw. bei späteren Refactorings angefasste Call-Sites.
- Die Dashboard-Sprungnavigation erfüllt zentral die 44×44-Projektpolicy, ohne die kompakte visuelle Darstellung aufzugeben.
- `prefers-reduced-motion` deaktiviert die dekorativen Animationen weiterhin vollständig.

**Status:** ✅ IMPLEMENTED.

### A6 — Dashboard-Semantik

Die konkrete P1-Stichprobe aus dem Accessibility Audit wurde direkt im Source behoben:

- Drawer-Profil: klickbares `div` → semantischer Link mit zugänglichem Namen.
- Drawer-Close: echter `button`, `.ui-hit`, `aria-label`, dekoratives X als `aria-hidden`.
- Breadcrumb „Capital-AI“: klickbares `span` → semantischer `.ui-hit`-Button.
- Push-Notification-Close: `.ui-hit`, dynamischer zugänglicher Name, dekoratives X als `aria-hidden`.

Der Commit-Diff wurde nach dem Großdatei-Update geprüft und enthält ausschließlich diese vorgesehenen Controls.

**Status:** ✅ IMPLEMENTED.

### A7 — Primary-CTA-Stichprobe

Die zentralen Arbeitsansichten wurden statisch auf visuelle Aktionshierarchie geprüft:

| View | Primäre Aktion | Sekundäre Aktion(en) | Ergebnis |
|------|----------------|----------------------|----------|
| MarketScreener | `Screening starten` (Gold, dominant) | Asset-/AI-Detailaktionen | ✅ klar |
| Dashboard Free/Gast | `Abonnement Upgraden` / Premium | Support / Sprungnavigation | ✅ klar |
| Myworkspace | `Chart Analyse` (Gold) | `Assets suchen`, Schnellzugriffe | ✅ klar |
| Enterprise-Hauptcockpit | bewusst informationszentriert; keine künstliche globale CTA erzwungen | Analyse-/Navigationsaktionen | ✅ kein unnötiger CTA-Wettbewerb in der Stichprobe |

**Status:** ✅ STATIC AUDIT für Kern-Views — app-weite Design-System-Konsolidierung gehört in Paket B/Phase 2.

---

## CSS-Fundament (`src/index.css`)

### Motion (Phase 1)
- Neural-/Gold-Pulse: längere Dauer, geringere Scale (±3 %), weichere Glows
- Brand-Border-Animationen: langsamer und leiser
- `@media (prefers-reduced-motion: reduce)`: dekorative Animationen aus
- Dashboard-/Landing-Neural-Layer: Root-Scoped Opacity 0.4

### Utilities
| Klasse | Zweck |
|--------|--------|
| `.ui-panel` | Standard-Glass-Card (blur + border + padding) |
| `.ui-stack` | Vertikaler Stack mit `--ui-section-gap` (2rem) |
| `.ui-hit` | `min-height/width: 44px` (Projekt-Policy; konservativer als WCAG 2.2 AA Minimum) |
| `.neural-decor` | Bevorzugte Utility: Opacity 0.4 für dekorative SVG-Layer |

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
5. **Dashboard** — App-Shell lazy; Neural-Layer gedämpft; Sprungnavigation + P1-Semantikcontrols 44×44/semantisch  
6. **LandingPage** — Neural-Layer gedämpft; Reduced-Motion greift global  
7. **MarketScreener** — `ui-stack`, `ui-panel`, `.ui-hit`, dominante Primary CTA, programmatische Search-/Error-Semantik  
8. **BacktestEngine / SentimentDashboard / AdminPortal** — native Lazy-Fassaden mit zugänglichem Suspense-Fallback

---

## Verbleibende Evidence vor VERIFIED-Abschluss von Paket A

1. **Build-/Test-Evidence:** Klasse-C-Validierung ausführen (`npm ci`, Audit, TypeScript, Unit Tests, Production Build, `build-and-test`) und bestätigen, dass Dashboard sowie Backtest/Sentiment/Admin als Async-Chunks erzeugt werden.
2. **Accessibility-Evidence:** axe/Lighthouse sowie Tastatur-Smoke gegen Public-/Guest- und authentifizierte Kernansichten ausführen und Findings dokumentieren.
3. **Messwerte:** Lighthouse Performance/Accessibility und relevante CWV nur aus reproduzierbarem Browserlauf übernehmen — keine Schätzung aus Code-Evidence.

### Danach

QW-Paket B: einheitliche `Button` / `IconButton` / `Chip` / `Skeleton`-Primitives (analog `StatusBadge`) und anschließende app-weite Migration.

---

*Phase 1 gestartet 16.08.2026 · Spacing Dashboard/Universe 16.08.2026 · QW-Paket A Source-Scope abgeschlossen 19.08.2026; Live Evidence pending.*
