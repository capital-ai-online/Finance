# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.8.0  
**Stand:** 7. September 2026  
**Korrelationsbasis:** `main@fb3fff1f3959d1c6f87d20228036366848600487`  
**Current Project:** `CAPITAL-AI-FE`  
**Current Project Folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` (`[]`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Owner:** Sven Kulessa / Capital-AI  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Bestandsnachweis:** `docs/frontend/COMPONENT_INVENTORY.md`

Dieses Dokument ist die **kanonische Frontend-Migrations-, Visual-Recovery- und UX-Roadmap**. Version 1.8.0 ersetzt keine Frontend-Architektur und erzeugt keine Parallel-Roadmap: sie aktualisiert und erweitert die bestehende kanonische Roadmap auf Current Main.

Verbindliches Rollenmodell:

- `FRONTEND_ARCH.md` bestimmt **wie** das Frontend strukturiert sein muss.
- `COMPONENT_INVENTORY.md` beschreibt **was** aktuell existiert, wo es physisch liegt und welche Recovery-/Contract-Gates gelten.
- `FRONTEND_ROADMAP.md` bestimmt **wann/in welcher Reihenfolge** migriert und modernisiert wird.
- `docs/frontend/design-tokens.json` ist die maschinenlesbare Design-/Branding-Authority.
- `SC-MD-SPT-0001`, aktuelle Projekt-Roadmaps sowie zuständige ADR-/ESS-/Data-Contracts bestimmen fachliche Runtime-/Evidence-/Scoring-/Governance-Contracts.

Prinzip: **Projection, not Redefinition. One Frontend architecture, one roadmap, no parallel authority.**

---

## 1. Zielbild und harte Qualitätsgates

Das Frontend wird schrittweise von einem funktionalen, dichten Legacy-Dashboard zu einem ruhigen, präzisen, zugänglichen und institutionell wirkenden FinTech-/Quant-Cockpit weiterentwickelt. Die Migration erhält genehmigte Nutzerfunktionalität, entfernt aber produktive Legacy-Architektur vollständig.

Zielarchitektur:

```text
src/app
  -> src/features/<domain>/ui
  -> src/shared
```

Nicht zulässig sind ein zweiter Frontend-Root, eine parallele Visualization-Architektur, lokale Scoring-/Ranking-/Evidence-/Freshness-/Entitlement-Authority oder neue produktive Domain-Implementierungen unter `src/components/`.

### Closure-Gates

| Dimension | Aktueller Reifegrad | Ziel | Messbare Exit-Bedingung |
|---|---:|---:|---|
| Visualization | **6.5/10** | **>= 8.5/10** | gemeinsame Visual-Primitives, explizite Data States, Accessibility-Alternative, kanonische Renderer-Strategie, keine synthetische Finanzdarstellung |
| Server-/Data-Contract Architecture | **6.0/10** | **>= 8.5/10** | Server-State getrennt von UI-State, Runtime-Validation an Boundaries, Cancellation/Dedup/Invalidation, canonical contract consumption, keine lokalen Evidence-/Freshness-Neudefinitionen |
| Accessibility | **6.5/10** | **>= 8.0/10** | WCAG-2.2-AA-Scope, Keyboard/Focus/Screenreader-Evidence, chart text/table alternatives, axe + manuelle Evidence |
| Performance | **7.0/10** | **>= 8.5/10** | p75 LCP <=2.5s, INP <=200ms, CLS <=0.1, Lighthouse Performance >=90, route/workspace bundle budgets, keine unnötigen Waterfalls |
| Productive Legacy Exit | **4.0/10** | **10.0/10** | 0 produktive Implementierungen unter `src/components/`, 0 erforderliche Compatibility-Re-exports, 0 produktive superseded UI/API consumers, 0 Legacy Dashboard composition |

Die Ist-Scores sind **Planungsbewertungen aus Current-Main-Code/Docs**, keine formale Testzertifizierung. Ziel-Scores werden erst als erreicht markiert, wenn die zugehörigen Implementierungs-, Test- und Evidence-Gates auf dann-current main belegt sind.

---

## 2. Verifizierter Current-Main-Stand

### 2.1 Abgeschlossene Architektur- und Recovery-Arbeit

- [x] **BB-0 Foundation / PR #459:** `src/app`, `src/features`, `src/shared`, Shared-Primitives und Architecture Gate etabliert.
- [x] **BB-1 Application Composition / PR #462:** kanonischer Composition Root, SessionComposition, AppRoutes und UserSession-Vertrag etabliert.
- [x] **BB-2 View Contract / PR #546:** `DashboardView` und exhaustive View->Section-Projektion etabliert.
- [x] **BB-2 Composition Boundary / PR #548:** Legacy-Monolith hinter expliziter Strangler-Grenze gebunden.
- [x] **BB-2D View Router / PR #763:** fachliche Detail-Views über `DashboardViewRouter` und Feature-Fassaden projiziert.
- [x] **Browser-Startup-Recovery / PR #782:** öffentliche Landingpage eager, schwerer Dashboard-Graph lazy.
- [x] **Public-Root-Shell-Recovery / PR #788:** öffentliche Shell von Preview-Suspend/Render-Fehlern entkoppelt.
- [x] **Public Enterprise Scorer / PR #820:** Enterprise Scorer als Public-Projektion derselben kanonischen Crypto-Scorer-Implementierung wiederhergestellt.
- [x] **Public Analysis Sideboard / PR #825:** etablierte Assessment-/Analysis-Navigation auf `/` wiederhergestellt, ohne das Legacy Dashboard als Public Root zu reaktivieren.
- [x] **Branding v6.2 / PR #791:** `design-tokens.json` + `brandmark.json` bleiben singuläre Brand-Verträge.
- [x] **Crypto Visualization / CV-0:** Authority-/Freshness-/Evidence-Primitives und read-only Presentation Projection vorhanden.
- [x] **Screening:** `RankingBoard` ist produktive kanonische Ranking-Fläche; `UniverseBestWorst` ist Compatibility-Alias.
- [x] **Commodities / PR #539:** `src/features/commodities/ui/RawMaterialsDashboard.tsx` ist kanonische Commodity-UI; Legacy-Pfad ist dünner Export.
- [x] **Newsfeed / PR #529:** Realtime-AI-Newsfeed verwendet verifizierte News-/Metadata-Surfaces ohne erfundene Headlines oder Score-Mutation.

### 2.2 Aktuelle strukturelle Restschuld

- `src/components/Dashboard.tsx` bleibt der größte Presentation-Kopplungspunkt des authentifizierten Dashboards.
- Desktop Navigation, Mobile Drawer, Header und Home/MyWorkspace-Composition sind noch nicht vollständig aus dem Legacy-Monolithen gelöst.
- Zahlreiche Feature-Fassaden re-exportieren weiterhin Implementierungen aus `src/components/`; sie sind damit noch keine physische Migration.
- Mehrere Legacy-Visuals enthalten synthetische, deterministische oder Compatibility-basierte Datenpfade und dürfen nicht allein aufgrund ihrer visuellen Qualität produktiv canonicalized werden.
- `src/components/PortfolioPerformance.tsx` generiert deterministische Performance-Zeitreihen und feste Risikokennzahlen; diese sind keine produktive finanzielle Evidence.
- `src/components/HeatmapCreator.tsx` enthält voreingestellte Bullish/Bearish-/Volume-/Pattern-Werte und erzeugt weitere Heatmap-Semantik lokal aus Marktdaten; diese Surface ist nicht production-valid.
- `src/components/MarketSentiment.tsx` ersetzt fehlende Score-/Label-Werte lokal durch `50` / `Neutral`; dies verletzt fail-closed Evidence-Semantik.
- `src/components/Charts.tsx` konsumiert noch den Compatibility-Endpoint `/api/charts-scoring`, der auf Current Main ausdrücklich `NON_PRODUCTION_SIMULATION` ist; `/api/backtest-history` ist ebenfalls ein Compatibility-History-Pfad mit markiertem simulated fallback.
- `src/components/ComplianceExporter.tsx` enthält feste Portfolio-/Risk-Metriken im Bericht; der Export darf erst nach Contract-Remediation als evidence-valid gelten.
- `src/components/RealTimeRiskAssessment.tsx` ist ausdrücklich archiviert/deaktiviert und rendert nur einen Null-Stub; keine stille Reaktivierung.

---

## 3. BB-2 Composition bleibt höchste Frontend-Priorität

**Ziel:** Legacy Dashboard als Composition-Monolith eliminieren, ohne genehmigte sichtbare Funktionalität zu verlieren.

Reihenfolge bleibt verbindlich:

1. **BB-2E — Navigation / Drawer completion**
2. **BB-2F — Header / Application Shell extraction**
3. **BB-2G — Dashboard Home / MyWorkspace visual-parity cutover and composition closure**

Neue Visualization-Arbeit darf diese Reihenfolge nicht umgehen, sofern keine neue explizite Owner-Priorität sie ändert.

### BB-2E — Navigation / Drawer

- Desktop Navigation und Mobile Drawer aus `src/components/Dashboard.tsx` lösen.
- kanonische `DashboardView`-/Section-Contracts konsumieren.
- mobile Navigation, Focus-Order, Drawer-Focus-Trap/Return-Focus und 44px Touch Targets belegen.
- keine neue Routing-Library und keine neue Navigation-Authority.

### BB-2F — Header / Application Shell

- Header, Profile/Logout, globale Workspace-Chrome und shell-nahe Statusflächen aus dem Monolithen lösen.
- Session/Auth bleibt `src/app/auth`-owned.
- Header darf keine browserseitige AuthZ-/Entitlement-Entscheidung etablieren.

### BB-2G — Visual Parity + Composition Closure

Vor physischer Legacy-Dashboard-Löschung muss Visual-/Functional-Parity für alle genehmigten produktiven Home/MyWorkspace-Funktionen nachgewiesen werden.

Ziel-Composition:

```text
src/app/dashboard/DashboardHome.tsx (oder äquivalente app-owned Composition)
src/app/dashboard/MyWorkspaceView.tsx (oder äquivalente app-owned Composition)
  -> feature facades
  -> canonical feature implementations
  -> shared UI/visualization primitives
```

BB-2G darf keine Domain-Implementierung klonen, keine lokalen Scores/Research-/Evidence-Werte erzeugen und keine Entitlement-/IAM-Grenzen verschieben.

---

## 4. Visual Recovery Matrix

Klassifikation:

- **Class A — CANONICALIZE_NOW:** genehmigte produktive Visual-Funktionalität mit gültigem aktuellen Contract.
- **Class B — CONTRACT_REMEDIATION_REQUIRED:** nützliche Visual-Funktionalität, deren aktueller Daten-/Evidence-/Authority-Vertrag nicht production-valid ist. Keine Aktivierung mit synthetischen Ersatzwerten.
- **Class C — EXPLICITLY_DISABLED_OR_ARCHIVED:** historisch/deaktiviert; Reaktivierung nur durch explizite aktuelle Owner-Entscheidung plus notwendige Contract-/Architecture-Gates.

| Surface | Class | Current-Main-Befund | Kanonischer Zielpfad / Recovery Gate |
|---|---|---|---|
| Enterprise Scorer / CryptoScoringEnterprise | **A** | kanonischer Crypto-Slice; Public Preview + Sideboard bereits gemergt | `src/features/crypto/ui`; Home/MyWorkspace konsumieren Feature-Fassade, keine Legacy-Kopie |
| RankingBoard | **A** | produktive kanonische UI; FINTECH-Rankingauthority backendseitig noch zu konsolidieren | `src/features/screening/ui/RankingBoard.tsx`; bei FIN-17 Cutover kein FE-local rank semantics |
| Realtime AI Newsfeed | **A** | evidence-only Newsfeed, keine erfundenen Headlines/Score-Mutation | physisch nach `src/features/news/ui`; explizite loading/partial/unavailable states |
| RawMaterialsDashboard | **A** | bereits canonical; verified commodity score getrennt von Research/Sandbox; missing score bleibt unavailable | `src/features/commodities/ui`; Legacy bridge bei 0 consumers entfernen |
| MarketScreener | **A/B boundary** | verified screening nutzt canonical score/context; Consumer liegt physisch Legacy und AI-summary bleibt getrennt | physisch nach `src/features/screening/ui`; Contract-Validation + server-state modernization vor Legacy deletion |
| Watchlist | **B** | Legacy/local persistence + registry/market fallbacks; keine ausreichende current contract proof für alle dargestellten Werte | `src/features/portfolio/ui`; DATA/FINTECH contracts prüfen, unverfügbare Werte explizit darstellen |
| Market Sentiment | **B** | lokaler Default `score=50` / Label `Neutral` bei fehlender Evidence | `src/features/news/ui`; Defaults entfernen, canonical sentiment status/nullable semantics konsumieren |
| Charts | **B** | Recharts vorhanden; History/score compatibility paths und simulation-only chart scoring | `src/features/analytics/ui`; canonical HistoryGateway/OHLCV evidence + FINTECH removal of chart-scoring compatibility consumer |
| Heatmap | **B** | preset nodes, lokale bullish/pattern/volume fabrication aus MarketData | `src/features/analytics/ui`; benötigt verifizierten heatmap/sentiment/volume contract oder bleibt unavailable/research-only |
| Portfolio Performance | **B** | deterministische upward random-walk-Zeitreihe + feste Sharpe/Drawdown/Vol/VaR | `src/features/portfolio/ui`; erst aktiv nach verifiziertem NAV/performance time-series contract mit provenance/freshness |
| Backtest / PortfolioBacktester | **B** | protected execution und canonical history/entitlement migration noch owner-side relevant | `src/features/portfolio/ui`; FINTECH protected-execution + DATA canonical history consumer before Legacy exit |
| Monte Carlo | **B** | protected execution/authority nicht vollständig konsolidiert | `src/features/portfolio/ui`; FINTECH authority/entitlement contract first |
| Compliance / Reporting Export | **B** | canonical PDF brand + server grant vorhanden, aber feste Portfolio-/Risk-KPIs im Report | `src/features/reporting/ui`; financial metrics aus verified contract oder explicit unavailable |
| Governance / Admin Portal | **A/B boundary** | UI funktional und IAM-gated, aber Feature-Fassade re-exportiert weiterhin Legacy-Komponenten | `src/features/governance/ui`; physische Migration, keine Governance/IAM-Authority in FE |
| Admin Process Graph | **A** | bereits feature-owned read-only process/dependency projection | `src/features/governance/ui/process-graph`; React Flow nur evaluieren, wenn echte node-edge Anforderungen über aktuelle Lösung hinausgehen |
| Risk Assessment / VaR | **C** | archivierter Null-Stub; ausdrücklich deaktiviert | keine Reaktivierung ohne aktuelle Owner-Entscheidung, architecture decision und verified risk contract |
| InteractModule | **C** | archiviert/deaktiviert | bleibt archiviert, sofern keine neue Owner-Entscheidung |

### Visual Recovery Rule

**Visual Recovery bedeutet Funktionalität erhalten oder verbessern, nicht Legacy-Code erhalten.** Ein Surface wird erst entfernt, wenn seine genehmigte produktive Funktion canonicalized ist oder eine aktuelle Owner-Entscheidung es ausdrücklich deaktiviert/archiviert.

---

## 5. Visualization System — Ziel >= 8.5/10

### Renderer-Strategie

- **Recharts** bleibt Default für Standard-Dashboard-/Financial-Charts, da es bereits im Repository produktiv vorhanden ist.
- **D3** bleibt für begründete Custom Geometry/Interaction, nicht als Default-Chart-Framework.
- **React Flow / XYFlow** wird nur für echte Node-Edge-Prozess-/PVC-/Dependency-Graphen evaluiert; kein Ersatz für Standardcharts.

### Geplante Shared-Primitives

Unter `src/shared` nur fachneutrale Presentation-Primitives:

- `ChartFrame`
- `ResponsiveChartContainer`
- `VisualizationToolbar`
- `TimeRangeControl`
- `VisualizationLegend`
- `DataStateOverlay`
- `VisualizationSkeleton`
- `AccessibleDataSummary`
- Crosshair-/Tooltip-Primitives

Diese Primitives dürfen keine Freshness-Schwellen, Score-Semantik, Ranking- oder Evidence-Entscheidung selbst definieren.

### Einheitliche Data States

Jede finanzielle Visualisierung muss mindestens unterscheiden können:

`loading | available | partial | stale | invalid | not-computable | unavailable | error`

Die Backend-/DATA-Semantik bleibt maßgeblich. `unavailable`, `stale`, `invalid` oder `not-computable` darf nie durch lokale Defaultwerte, fake READY, synthetische Trends oder erfundene Finanzwerte ersetzt werden.

### Accessibility für Charts

- sichtbarer Status nicht nur farbcodiert;
- zugänglicher Name/Description;
- textuelle oder tabellarische Datenalternative für relevante Charts;
- Keyboard-Zugriff auf interaktive Controls;
- Tooltips nicht als einzige Informationsquelle;
- Reduced Motion beachten;
- Focus-Styles aus kanonischen Tokens.

---

## 6. Server-State / Data-Contract Architecture — Ziel >= 8.5/10

Frontend bleibt Consumer der aktuellen DATA-/FINTECH-Verträge. Insbesondere projiziert FE die durch DATA bereitgestellten Provider-Input-, Provenance-, Freshness- und DQ-Zustände; Frontend-Caches definieren keine eigene Evidence-Freshness.

### Frontend-owned Evaluation

**TanStack Query** wird für Server-State-Lifecycle evaluiert:

- zentrale Query-Key-Konventionen;
- `AbortSignal`/Cancellation;
- Request-Deduplication;
- explizite Invalidation;
- bounded retries;
- klare Trennung von local UI state und server state;
- keine Änderung von Domain-/Evidence-Semantik durch Cache-Staleness.

### Contract Boundary Tooling

- **Zod:** Runtime-Validation von API-/Data-Boundaries, wo aktuelle Verträge keine gleichwertige Validierung bereits bereitstellen.
- **openapi-typescript:** typed contract/client generation nur dort, wo eine kanonische aktuelle OpenAPI-Spezifikation existiert.
- **MSW:** deterministische API-/failure-/stale-/partial-/error Tests auf Browser-/Component-Ebene.

Keine dieser Libraries wird durch diese Roadmap installiert. Dependency-Mutation erfolgt nur in einem separaten autorisierten Implementation Slice nach aktueller Reuse-/Security-/License-Prüfung.

### Observability

**OpenTelemetry JS** wird nur für presentation-layer telemetry evaluiert, wenn dies mit OPS-, Privacy- und bestehenden Observability-Contracts vereinbar ist. FE darf keinen zweiten Trace-/Telemetry-Authority-Pfad aufbauen.

---

## 7. Contract Supersession Lane

Supersession ist erlaubt, wenn ein aktueller ADR/ESS/API/Data compatibility contract die kanonische Zielarchitektur oder Datenintegrität materiell blockiert. Sie ist **kein FE-Selbstermächtigungsmechanismus**.

Workflow:

1. blocking contract exakt identifizieren;
2. Primary Owner über PVC/Projektzuordnung bestimmen;
3. replacement/supersession scope, exclusions und migration impact definieren;
4. Owner-side Contract-/ADR-/ESS-Entscheidung umsetzen;
5. Consumer auf Replacement cut over;
6. zero productive consumers belegen;
7. Compatibility implementation entfernen;
8. historische/audit Evidence erhalten.

### Aktuelle Supersession-/Owner-Dependencies

| Blocker / Compatibility Surface | Frontend-Auswirkung | Primary Owner / Route |
|---|---|---|
| `/api/charts-scoring` | `Charts.tsx` konsumiert NON_PRODUCTION_SIMULATION; produktiver Consumer muss weg | `CAPITAL-AI-FINTECH`; FE migriert Consumer nach owner-side replacement/decision |
| `/api/backtest-history` Compatibility | Charts/Backtest können simulated fallback erhalten; canonical DATA history path existiert separat | `CAPITAL-AI-DATA` für canonical history/evidence; FINTECH für Backtest protected execution; FE cutover danach |
| FIN-17 Ranking order | RankingBoard darf langfristig keine eigene Rank-/Order-Semantik tragen | `CAPITAL-AI-FINTECH / PVC-17`; FE konsumiert stable backend rank/order result |
| Portfolio NAV/performance series fehlt | PortfolioPerformance kann nicht evidence-valid reaktiviert werden | Owner muss aus current PVC/contract scope bestimmt werden; voraussichtlich DATA für verified time-series evidence + FINTECH für abgeleitete risk/performance semantics; keine FE-Annahme ohne owner-side contract |
| Heatmap sentiment/pattern semantics | aktuelle UI berechnet/seedet fachliche Werte lokal | DATA/FINTECH je nach zukünftiger Evidence-/analysis contract ownership; FE bleibt blocked bis eindeutiger current contract vorliegt |
| Compliance report financial KPIs | feste Kennzahlen dürfen nicht als Audit-Evidence erscheinen | jeweilige DATA/FINTECH financial contract owner; Reporting UI nur Consumer |

---

## 8. Portfolio Performance Integrity Gate

`src/components/PortfolioPerformance.tsx` ist ausdrücklich **Class B — CONTRACT_REMEDIATION_REQUIRED**.

Current-Main-Fund:

- deterministisch erzeugte Performance-Zeitreihe auf Basis von `baseCapital`;
- künstlicher Aufwärtstrend/Waves/Noise;
- feste timeframe-abhängige Sharpe-, Drawdown-, Volatility- und VaR-Werte.

Diese Werte sind **keine produktive Financial Evidence** und dürfen nicht als reale Portfolio-Performance oder Risikomessung dargestellt werden.

### Required future contract

Eine spätere produktive Aktivierung benötigt mindestens:

- portfolio NAV/performance time series;
- `observedAt`/`asOf`;
- provenance/source identity;
- freshness state;
- explicit unavailable/stale/error state;
- für abgeleitete Risk Metrics eine owner-authoritative Methodology-/Result-Semantik.

Bis dahin bleibt die genehmigte visuelle Idee recoverable, aber die aktuelle Datenimplementierung darf nicht canonicalized werden.

---

## 9. Accessibility Program — Ziel >= 8.0/10

Zielstandard für den vereinbarten Product Scope:

- WCAG 2.2 AA;
- BFSG / EN 301 549, soweit für den aktuellen Produkt-/Rechts-Scope anwendbar.

Toolchain-Evaluation:

- bestehendes Vitest;
- Storybook + Storybook Accessibility Addon;
- axe-core;
- Playwright.

Required evidence gates:

- keyboard-only critical journeys;
- logischer Focus Order;
- Dialog-/Drawer-Focus-Management inklusive return focus;
- Landmarks und accessible names;
- Chart text/table alternatives;
- Status nie color-only;
- reduced motion;
- zoom/reflow;
- touch target baseline;
- mobile navigation;
- accessible loading/error/empty states.

Automatisierte axe-Prüfung ergänzt, ersetzt aber keine manuelle Keyboard-/Screenreader-Evidence.

---

## 10. Performance Program — Ziel >= 8.5/10

Toolchain-Evaluation:

- Vite;
- Lighthouse CI;
- `web-vitals`;
- `rollup-plugin-visualizer`;
- Browser Performance APIs.

### Core Web Vitals / Quality Targets

p75:

- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1

Zusätzlich:

- Lighthouse Performance >= 90
- Lighthouse Accessibility >= 95

### Architekturmaßnahmen

- route/workspace lazy loading;
- schwere Chart-/D3-Module nur bei Bedarf laden;
- keine authenticated domain bundles im Public bootstrap ohne Bedarf;
- vermeidbare request waterfalls eliminieren;
- Server-State-Requests deduplizieren;
- route/workspace bundle budgets definieren;
- long tasks/main-thread blocking beobachten;
- Reduced Motion respektieren.

Performance-Optimierung darf Security, Data Integrity, Provenance, Evidence oder Authorization niemals abschwächen.

---

## 11. OSS-/Freemium-Tooling Evaluation

Die aktuelle Repository-Fähigkeit hat Vorrang. Tooling wird nur eingeführt, wenn es einen belegten Gap besser und risikoärmer schließt als bestehende Mittel.

| Kandidat | Rolle | Lizenz / Verfügbarkeit | Current Repo | Empfehlung |
|---|---|---|---|---|
| Recharts | Standard charts | Open Source / MIT | **bereits vorhanden** | **REUSE / DEFAULT** |
| D3 | custom geometry/interactions | Open Source / ISC | **bereits vorhanden** | **REUSE BOUNDED** |
| React Flow / XYFlow | node-edge graphs | Open Source package; aktuelle Library aktiv gepflegt | nicht als Standarddependency belegt | **EVALUATE ONLY** für echte Graph-Gaps |
| TanStack Query | server-state | Open Source / MIT | nicht current dependency | **EVALUATE / HIGH FIT** |
| Zod | runtime validation | Open Source / MIT | nicht current dependency | **EVALUATE / HIGH FIT** an API boundaries |
| openapi-typescript | typed OpenAPI contracts | Open Source / MIT | nicht current dependency | **EVALUATE CONDITIONALLY** bei canonical OpenAPI |
| MSW | API virtualization/tests | Open Source / MIT | nicht current dependency | **EVALUATE / HIGH FIT** für deterministic contract/failure tests |
| Storybook | component lab | Open Source / MIT | nicht current dependency | **EVALUATE** nach BB-2 Composition, nicht als Prioritätsbypass |
| Storybook a11y addon | component accessibility | nutzt axe-core | nicht current dependency | **EVALUATE WITH STORYBOOK** |
| axe-core | automated a11y | Open Source / MPL-2.0 | nicht current dependency | **EVALUATE / HIGH FIT** |
| Playwright | browser/E2E/a11y journeys | Open Source / Apache-2.0 | nicht current dependency belegt | **EVALUATE / HIGH FIT** |
| Lighthouse CI | performance/a11y budgets | Open Source / Apache-2.0 | nicht current dependency | **EVALUATE / HIGH FIT** |
| web-vitals | field metric collection | Open Source / Apache-2.0 | nicht current dependency | **EVALUATE** mit OPS/privacy boundary |
| rollup-plugin-visualizer | bundle analysis | Open Source / MIT | nicht current dependency | **EVALUATE / LOW-RISK DEV TOOL** |
| OpenTelemetry JS | telemetry | Open Source / Apache-2.0 | nicht current dependency | **EVALUATE CONDITIONALLY**; OPS/privacy integration required |

Keine Empfehlung macht die Zielarchitektur von einem paid-only proprietären Service abhängig.

---

## 12. Domain Waves und Definition of Done

### BB-3 — Public / Users / Settings / Billing — PARTIAL

Public Landing/Sideboard ist canonicalized; Legal/Login/Profile/Step-up/Subscription/Checkout verbleiben teilweise Legacy.

### BB-4 — Screening & Discovery — PARTIAL

RankingBoard canonical; Screener/MarketScreener/AssetUniverse physisch migrieren und FINTECH-ranking boundary respektieren.

### BB-5 — News / Sentiment / Social / Reporting — PLANNED

Realtime Newsfeed canonicalize; MarketSentiment erst nach Default-50/Neutral-Remediation; Reporting financial metrics contract-valid machen.

### BB-6 — Analytics / Crypto / Commodities / Visualization — PARTIAL

Crypto/Commodities teilweise canonical; Charts/Heatmap nur nach Contract-Remediation; Shared Visualization System schrittweise einführen.

### BB-7 — Portfolio / Risk / Backtesting — PLANNED

Watchlist/Pattern Slots/Backtest/Portfolio Performance/Monte Carlo. PortfolioPerformance bleibt blocked, bis verified NAV/performance contract vorliegt. Risk Assessment bleibt Class C.

### BB-8 — Governance / Admin / Compliance — PLANNED

Feature-owned UI herstellen, ohne Governance/IAM-Control-Plane zu duplizieren. Process Graph bleibt read-only projection.

### BB-9 — Stocks / Buffett — PLANNED

Buffett-Flächen spät migrieren; serverseitige entitlement-/evidence contracts unverändert konsumieren.

### Gemeinsame DoD-Gates für BB-3..BB-9

Jede migrierte Domain-Welle benötigt:

- zero productive Legacy consumer für die migrierte Surface;
- Server/Data contract reviewed;
- Shared Visualization/Accessibility primitives verwendet, wo passend;
- Performance budget erfüllt;
- genehmigte sichtbare Funktionalität erhalten;
- keine neue Domain-/Authority-Logik in FE.

---

## 13. BB-10 — Absolute Productive Legacy Exit — Ziel 10/10

Required end state:

- `0` produktive Implementierungen unter `src/components/`;
- `0` erforderliche Compatibility re-exports;
- `0` produktive Consumer superseded UI aliases;
- `0` Frontend-Consumer superseded API contracts;
- `0` produktive Legacy Dashboard composition;
- `0` produktive Legacy branding aliases/lokale obsolete color literals, soweit durch Tokens geregelt.

Compatibility wird erst entfernt, wenn produktive Consumerzahl `0` ist und erforderliche owner-side Contract-/Authority-Supersession wirksam ist.

Immutable historische Evidence/Audit Records werden nicht gelöscht, nur um Legacy `10/10` zu erreichen.

---

## 14. BB-11 — Closure

Finale Gates:

| Gate | Required |
|---|---|
| Visualization | `>= 8.5/10` |
| Server/Data Contract Architecture | `>= 8.5/10` |
| Accessibility | `>= 8.0/10` |
| Performance | `>= 8.5/10` |
| Productive Legacy Exit | `10/10` |
| TypeScript | PASS |
| Unit/Contract Tests | PASS |
| Architecture Tests | PASS |
| Production Build | PASS |
| Accessibility Evidence | PASS |
| Performance Budget | PASS |
| Authority/Data Contract Correlation | PASS |
| Duplicate Authority | NONE |

Nicht ausgeführte Checks bleiben `NOT RUN` und dürfen nicht als PASS erscheinen.

---

## 15. Governance je Welle

Vor jedem Frontend-PR:

1. current `main` + `/AGENTS.md`;
2. offene PRs, aktive Writers/Claims und branch overlap;
3. changed-file + semantic + namespace/authority overlap;
4. Project/PVC/Primary Owner;
5. aktuelle Frontend Roadmap + Inventory;
6. applicable ADR/ESS/API/Data contracts;
7. inbound/outbound consumers und Compatibility-Exit;
8. Design-Token-/Accessibility-/Performance-Drift;
9. erforderliche low-cost local/sandbox validators;
10. final main resync/correlation vor PR-Creation approval.

Eine ADR-/ESS-/API-/Data-Supersession erfolgt nur über den Primary Owner der betroffenen Authority. Frontend darf Replacement konsumieren, aber keine foreign authority übernehmen.

---

## 16. Unmittelbare Reihenfolge

1. **BB-2E Navigation / Drawer completion** auf frischem then-current-main Frontend-Branch.
2. Nach dessen Re-Korrelation **BB-2F Header / Application Shell extraction**.

BB-2G folgt danach als Visual-Parity-/Composition-Closure. Die Visualization-/Server-State-/Accessibility-/Performance-Programme werden in diesen und den folgenden Domain-Waves angewandt, ohne die BB-2-Priorität zu umgehen.

---

*Version 1.8.0 re-korreliert die bestehende kanonische Roadmap gegen `main@fb3fff1f3959d1c6f87d20228036366848600487`, übernimmt Public Enterprise Scorer und Public Analysis Sideboard als gemergte Current-Main-Recovery, integriert die Visual-Recovery-A/B/C-Matrix, Contract-Supersession-Lane, state-of-the-art Tooling-Evaluation und messbare Accessibility-/Performance-/Legacy-Exit-Gates. Sie erzeugt weder eine zweite Frontend-Roadmap noch eine parallele Frontend-, Scoring-, Data-, Evidence-, IAM- oder Governance-Architektur.*