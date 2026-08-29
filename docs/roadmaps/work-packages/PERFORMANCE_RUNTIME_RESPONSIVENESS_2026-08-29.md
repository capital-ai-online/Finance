# PERFORMANCE Runtime Responsiveness — Work Package

- **Claim-ID:** `WP-PERFORMANCE-RUNTIME-RESPONSIVENESS-2026-08-29`
- **Datum:** 2026-08-29
- **Baseline:** `main@4c25dec3ff4a9b2507bae8cfd265f055c6afa52f`
- **Branch:** `perf/frontend-runtime-responsiveness-20260829`
- **Status:** IMPLEMENTED ON BRANCH / PR VALIDATION PENDING

## Anlass

Die Produktionswebsite war grundsätzlich erreichbar, reagierte auf mobilen Clients jedoch zeitweise sehr langsam oder wirkte vollständig blockiert.

Die Render-Evidence auf der Baseline zeigte zwei getrennte Performance-Klassen:

1. **Initiales Frontend-Bundle:** `index-BbX2v3F-.js` mit ca. 2.93 MB minifiziert / 802.88 KB gzip. Vite meldete einen Chunk > 900 KB und empfahl dynamische Imports.
2. **Sporadische Runtime-Stalls:** `GET /` und `GET /sources` liefen im selben Zeitfenster jeweils ca. 8.003 Sekunden, obwohl dieselben Pfade davor im Millisekundenbereich antworteten. Im korrelierten Fenster trat zusätzlich ein CoinGecko HTTP 429 während Crypto-Evidence/Scoring auf.

CPU/RAM waren dabei nicht als dauerhafte Kapazitätsgrenze auffällig. Deshalb wird nicht an Render-Ressourcen skaliert, sondern an den identifizierten Frontend- und Event-Loop-Grenzen angesetzt.

## Architekturkorrelation

- Keine offenen PRs zum Zeitpunkt der Branch-Erstellung.
- Der Branch wurde exakt von `main@4c25dec3ff4a9b2507bae8cfd265f055c6afa52f` abgeleitet.
- Auth/IAM aus PR #603 bleibt unangetastet; `/login`, SessionComposition, AAL2 und Supabase-Authority werden nicht verändert.
- Market-Data Provider-Reihenfolge, ScoringDispatcher, Cache-Authority und Evidence-Semantik bleiben unverändert.
- Keine Schema-, Secret-, DNS-, Stripe-, Supabase- oder Render-Konfigurationsmutation.

## Umsetzung

### P0 — Öffentliche Landingpage vom Dashboard-Monolithen entkoppelt

`src/features/public/ui/LandingPage.tsx` importiert das Legacy-Dashboard nicht mehr. Die öffentliche Root-Route besitzt eine kleine, eigenständige Public-Shell.

Der Enterprise Scorer bleibt als limitierte Produktvorschau erhalten, wird aber über `React.lazy()` und `IntersectionObserver` erst geladen, wenn der Scorer-Bereich in Sichtnähe kommt.

Damit zieht `/` nicht mehr automatisch Admin-, PDF-, Social-, Backtesting-, Chart- und weitere Dashboard-Module in den initialen Modulgraphen.

### P0 — Route-level Code Splitting

`src/app/routing/AppRoutes.tsx` hält nur die Landingpage eager. Folgende Flächen werden dynamisch geladen:

- Dashboard
- Login
- Datenschutz / Impressum / AGB
- Learning Platform
- Media Studio

Direkte Legal-Route-Adapter vermeiden, dass der Public-Barrel unnötige Implementierungen in denselben statischen Graphen zieht.

### P0 — Market-Data / Evidence Fan-out begrenzt

`marketDataCompatibilityFacade` ersetzt unbeschränktes `Promise.all()` für Live-Evidence-Enrichment durch einen geordneten Worker-Pool.

- Standard: 4 parallele Enrichments
- Hard Cap: 8
- kooperativer `setImmediate()`-Yield nach jeder Arbeitseinheit
- Ergebnisreihenfolge bleibt stabil
- Fallback-Assets lösen weiterhin kein Evidence-Enrichment aus

Dies reduziert Provider-Bursts (insbesondere 429-Risiko) und große Promise-Continuation-Bursts auf dem Single-Process-Render-Runtime.

### P1 — Background-Refresh Event-Loop-freundlich

`marketDataRuntimeFacade`:

- gibt Background-Refreshes vor Provider-Arbeit zunächst einen Event-Loop-Turn,
- synchronisiert größere Assetmengen kooperativ,
- hält Cache- und Refresh-Coalescing-Semantik unverändert,
- liefert Timing-Evidence für `foreground` und `background` Refreshes.

Die Application-Composition protokolliert diese Timing-Evidence produktiv und setzt das Enrichment-Budget explizit auf 4.

### P1 — Event-Loop Observability

`/metrics` exponiert zusätzlich:

- `nodejs_event_loop_lag_seconds`
- `nodejs_event_loop_lag_max_seconds`
- `nodejs_event_loop_utilization_ratio`

Damit können erneute Mehrsekunden-Stalls direkt mit HTTP-Latenz und Market-Data-Refresh-Timings korreliert werden.

### P1 — Build Performance Budget

Vite erhält ein Release-Gate für den initialen Entry-Chunk:

- **Initial Entry:** maximal 900 KiB minifiziert; Überschreitung bricht den Build ab.
- **Async Chunk:** > 2 MiB erzeugt eine Warnung.
- Kein erneutes `manualChunks`-Vendor-Splitting, da die frühere vendor/vendor-react-Trennung einen React-Zyklus verursacht hatte.

## Regressionstests

Neu bzw. angepasst:

- `tests/unit/publicLandingRoute.test.ts`
- `tests/unit/frontendPerformanceBoundary.test.ts`
- `tests/unit/marketDataRuntimeResponsiveness.test.ts`
- `tests/unit/runtimePerformanceMetrics.test.ts`

Sie sichern insbesondere Public/Dashboard-Entkopplung, Lazy-Routen, Lazy-Scorer, Build-Budget, begrenzte Evidence-Parallelität, Cache-/Timing-Semantik und Event-Loop-Metriken.

## Validierungsregel

Gemäß Repository-Kostenregel werden Build und vollständige Tests erst nach PR-Erstellung durch die PR-Pipeline ausgeführt. Vor PR-Erstellung erfolgen Repository-/Scope-/Main-Korrelation und statische Vertragsprüfung. Der PR darf erst nach dem finalen Owner-Gate für den exakt korrelierten Head erstellt werden.

## Rollback

Repository-only. Rücksetzung über human-reviewed Git-Revert des Merge-Commits. Es wurden keine externen Provider-, Datenbank-, Secret- oder Infrastruktur-Mutationen vorgenommen.
