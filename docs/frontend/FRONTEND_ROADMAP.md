# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.7.2  
**Stand:** 7. September 2026  
**Korrelationsbasis:** `main@12b5ec1886984fb6815ba111108f7f353496de7d`  
**Arbeitsstand:** current main; diese Korrelation enthält keinen separaten Implementierungs-Branch  
**Owner:** Sven Kulessa / Capital-AI  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Bestandsnachweis:** `docs/frontend/COMPONENT_INVENTORY.md`

Dieses Dokument ist die **kanonische Frontend-Migrations- und UX-Roadmap**. Es definiert Reihenfolge, Status und geplante Arbeit, aber keine eigene Source-Tree-, Dependency-, Market-Data-, Scoring-, Entitlement-, IAM- oder Governance-Authority.

Verbindliches Rollenmodell:

- `FRONTEND_ARCH.md` bestimmt **wie** das Frontend strukturiert sein muss.
- `COMPONENT_INVENTORY.md` beschreibt **was** aktuell existiert und wo es physisch liegt.
- `FRONTEND_ROADMAP.md` bestimmt **wann/in welcher Reihenfolge** migriert wird.
- `docs/frontend/design-tokens.json` ist die maschinenlesbare Design-/Branding-Authority.
- `SC-MD-SPT-0001` und die zuständigen ADR-/ESS-Dokumente bestimmen die fachlichen Runtime-/Evidence-/Scoring-/Governance-Contracts.

Prinzip: **Projection, not Redefinition**.

---

## 1. Zielbild

Das Frontend wird schrittweise von einem funktionalen, dichten Dashboard zu einem ruhigen, präzisen und institutionell wirkenden FinTech-/Quant-Cockpit weiterentwickelt:

- klare visuelle Hierarchie,
- reduzierte kognitive Last,
- konsistente Shared-Primitives,
- belastbare Data-Visualisierung,
- AI-native Explainability ohne lokale Scoring-Authority,
- WCAG 2.2 AA / BFSG / EN 301 549,
- fachlich saubere Vertical Slices,
- keine neuen produktiven Implementierungen unter `src/components/`.

---

## 2. Verifizierter Ist-Stand auf current main

### 2.1 Erfolgreich abgeschlossene Architektur- und Recovery-Arbeit

- [x] **BB-0 Foundation / PR #459:** `src/app`, `src/features`, `src/shared`, Shared-Primitives und `frontend:architecture:check` etabliert.
- [x] **BB-1 Application Composition / PR #462:** `src/app/App.tsx`, `SessionComposition`, `AppRoutes` und kanonischer `UserSession`-Vertrag etabliert; `src/App.tsx` ist Compatibility-Fassade.
- [x] **BB-2 View Contract / PR #546:** `DashboardView`, exhaustive View→Section-Projektion und Regressionstest unter `src/app/dashboard` etabliert.
- [x] **BB-2 Composition Boundary / PR #548:** `AppRoutes` konsumiert den kanonischen `src/app/dashboard/Dashboard.tsx`-Entry; der Legacy-Monolith ist hinter einer expliziten Strangler-Grenze gebunden.
- [x] **BB-2D View Router / PR #763:** die migrierten Dashboard-Detail-Views werden über `src/app/dashboard/DashboardViewRouter.tsx` und Feature-Fassaden aus dem Legacy-Dashboard projiziert; `dashboard` und `myworkspace` bleiben bewusst als Rest-Composition für die folgenden BB-2-Wellen bestehen.
- [x] **Browser-Startup-Recovery / PR #782:** die öffentliche `LandingPage` wird am Root-Pfad eager geladen; der schwere Dashboard-Graph bleibt lazy und blockiert damit nicht mehr die initiale Landing-Shell durch eine vorgelagerte Landing-Lazy-Grenze.
- [x] **Public-Root-Shell-Recovery / PR #788:** die öffentliche Landing-Shell ist von Suspend/Render-Fehlern der Dashboard-Live-Vorschau entkoppelt; nur die Preview besitzt eine lokale `Suspense`-/Error-Boundary mit begrenztem Fallback.
- [x] **Branding / PR #551 + Branding-v6.2-Konsolidierung / PR #791:** Dark Black + AIF Gold bleiben das kanonische Primary Brand Pair; die v6.2-Projektion nutzt `docs/frontend/design-tokens.json` als Farb-/Typografie-Authority und `docs/frontend/brandmark.json` als versionierten Geometrievertrag.
- [x] **Crypto Visualization / CV-0:** Authority-/Freshness-/Evidence-Primitives sowie read-only Presentation Projection vorhanden.
- [x] **Screening:** `RankingBoard` ist produktive kanonische Ranking-Fläche; `UniverseBestWorst` ist Compatibility-Alias.
- [x] **Commodities / PR #539:** `src/features/commodities/ui/RawMaterialsDashboard.tsx` ist kanonische Commodity-UI; Legacy-Pfad bleibt Compatibility-Export.
- [x] **Learning / PR #540:** `src/features/learning/ui` sowie öffentliche `/learning-platform`-Route sind integriert; Vocabulary bleibt read-only Projektion der kanonischen Registry.
- [x] **Newsfeed / PR #529:** Asset-/Quellenfilter, Provider-Evidence und `change24hPct` wurden mit den kanonischen Katalog-/Display-Pfaden korreliert.
- [x] **Release-Version / PR #542:** Plattformversion wird aus `package.json#version` über die Release Control Plane projiziert.
- [x] **Frontend-Orchestrator / PR #541, #534, #543:** Admin-Reads, AuthZ-Evidence und Konfigurationsvalidierung wurden fail-closed gehärtet.

### 2.2 Aktuelle strukturelle Restschuld

- `src/components/Dashboard.tsx` bleibt der größte verbleibende Presentation-Kopplungspunkt.
- Der fachliche Detail-View-Router ist mit BB-2D nach `src/app/dashboard/DashboardViewRouter.tsx` extrahiert und produktiv an den Legacy-Consumer gebunden.
- Desktop-Navigation, Mobile Drawer, Header und globale Shell-Verantwortung bleiben noch im Dashboard-Monolithen gekoppelt.
- `src/app/dashboard/DashboardNavigation.tsx` und `DashboardDrawer.tsx` sind auf current main **nicht** materialisiert; der frühere PR #667 wurde geschlossen und nicht gemergt und ist daher keine Current-State-Evidence für BB-2E.
- Viele Feature-Implementierungen liegen physisch weiterhin in `src/components/`.
- `COMPONENT_INVENTORY.md` ist als Bestandsnachweis älter als die jüngsten BB-2-/Recovery-Merges und muss in einer separaten bounded Korrelation nachgezogen werden; diese Roadmap-Korrektur deklariert das Inventory nicht stillschweigend als aktuell.

Auf current main gilt zusätzlich:

- die lokale View-Union ist aus dem Consumer entfernt; `Dashboard.tsx` konsumiert `DashboardView` direkt aus `src/app/dashboard/dashboardViews.ts`,
- die Section-Projektion erfolgt über `getDashboardSection(activeView)`,
- `UserSession` wird direkt aus `src/app/types/UserSession.ts` konsumiert; die Root-Compatibility-Fassade `src/App.tsx` ist keine Session-Type-Authority des Dashboards mehr,
- migrierte Detail-Views werden über `DashboardViewRouter` und die kanonischen Feature-Fassaden geroutet,
- der separate Navigation-State `universes` bleibt bewusst außerhalb der fachlichen View→Section-Authority,
- `/` rendert die öffentliche `LandingPage` unabhängig von der erfolgreichen Evaluation der Dashboard-Live-Vorschau; Preview-Suspend und Preview-Renderfehler bleiben lokal begrenzt,
- die produktive Root-Shell-Recovery ist implementiert und auf current main deploybar; die tatsächliche Darstellung auf dem zuvor betroffenen Android-Gerät bleibt eine **separate manuelle Production-Observation** und wird ohne Geräte-Evidence nicht als PASS behauptet.

---

## 3. Darstellung und Qualitätsbewertung

| Bereich | Bewertung | Befund | Nächste Qualitätsmaßnahme |
|---|---|---|---|
| Branding / Design Tokens | **gut** | Dark Black + AIF Gold sind das kanonische Primary Brand Pair; Purple bleibt sekundärer AI-Akzent und Cyan ausschließlich semantische Market-/Data-/Live-/Technical-Visualisierungsfarbe; Branding v6.2 besitzt eine singuläre Token-/Geometrie-Projektion | neue UI ausschließlich über kanonische Rollen/semantische Tokens; lokale Hex-/Legacy-Aliase weiter abbauen |
| Typografie | **gut mit Drift-Risiko** | Inter/Poppins/JetBrains Mono sind kanonisch definiert | Headings/Body/Tech-Data in Komponenten automatisiert prüfen |
| Shared UI | **gut** | Button, Card, Input, Modal, Tooltip, Skeleton, EmptyState und Status-/Evidence-Primitives vorhanden | Nutzung in Legacy-Komponenten erhöhen und Parallelimplementierungen entfernen |
| Dashboard IA | **kritische Restschuld** | View-/Session-Contracts und Detail-Rendering sind zentralisiert; Navigation, Drawer, Header und Shell bleiben im Monolithen gekoppelt | BB-2E priorisieren |
| Public Root | **Recovery implementiert; Geräte-Evidence offen** | Landing-Shell ist von der Dashboard-Preview entkoppelt; vollständiger schwarzer Root-Screen soll bei Preview-Suspend/-Renderfehler nicht mehr entstehen | produktiven Root auf dem zuvor betroffenen Android-Gerät verifizieren; bei Fehler Browser-/Console-/Network-Evidence erfassen |
| Screening | **gut** | kanonisches RankingBoard und klare Authority-Grenze | Filter-/Search-UX und progressive Disclosure verbessern |
| Commodities | **gut** | eigener Feature-Slice, Research/Verified-Grenze explizit | Visual Consistency und gemeinsame Asset-Universe-Navigation prüfen |
| Learning | **gut** | eigener Slice, Public Route, read-only Vocabulary | Feature-Namespace und gemeinsame Public-Surface-Patterns konsolidieren |
| News / Sentiment | **mittel bis gut** | fachliche Integrity-Härtung stark; Komponenten physisch teils Legacy | BB-5 Migration und einheitliche Loading/Empty/Error-Semantik |
| Governance / Admin | **funktional, hohe Komplexität** | Security-Grenzen gehärtet, UI-Implementierungen teils Legacy | BB-8; Admin-Navigation und Operational Status konsolidieren |
| Accessibility | **Baseline vorhanden** | 44px Targets, Focus und Reduced Motion dokumentiert | axe/Lighthouse-Baseline und vollständige Keyboard-/Screenreader-Prüfung |
| Mobile | **mittel** | responsive Basis vorhanden, Dashboard-Dichte bleibt problematisch; Root-Recovery benötigt reale Android-Observation | Navigation/Drawer in BB-2E entkoppeln und mobile IA separat prüfen |

---

## 4. Kanonische Pfade und Korrelationen

### 4.1 Application Composition

```text
src/main.tsx
  → src/App.tsx                         # Compatibility
  → src/app/App.tsx                     # kanonischer Composition Root
  → src/app/auth/SessionComposition.tsx
  → src/app/routing/AppRoutes.tsx       # Public Root + lokale Preview-Grenze
  → src/app/dashboard/Dashboard.tsx     # kanonische Dashboard-Composition-Grenze
  → src/components/Dashboard.tsx        # bounded Legacy-Strangler
       → src/app/dashboard/DashboardViewRouter.tsx
```

Der Legacy-Strangler konsumiert Presentation-Contracts direkt aus:

```text
src/app/dashboard/dashboardViews.ts
src/app/dashboard/DashboardViewRouter.tsx
src/app/types/UserSession.ts
```

Die öffentliche Root-Composition konsumiert:

```text
src/features/public/ui/LandingPage.tsx
src/app/dashboard/Dashboard.tsx         # lazy Dashboard-Preview innerhalb lokaler Boundary
```

### 4.2 Feature- und Shared-Richtung

```text
src/app
  → src/features/<domain>/ui
  → src/shared
```

Nicht zulässig:

- `shared → features/app`,
- `platform → React UI`,
- neue fachliche Implementierung unter `src/components/`,
- lokale Neuautorisierung von Scoring, IAM, Evidence oder Entitlements.

### 4.3 Aktuelle kanonische Feature-Slices

- `features/screening/ui`
- `features/crypto/ui`
- `features/commodities/ui`
- `features/stocks/ui`
- `features/analytics/ui`
- `features/news/ui`
- `features/portfolio/ui`
- `features/billing/ui`
- `features/reporting/ui`
- `features/social/ui`
- `features/governance/ui`
- `features/learning/ui`

`src/features/index.ts` muss diese produktiven Namespaces vollständig projizieren.

---

## 5. Migrationswellen

### BB-0 — Foundation — **DONE**

- [x] App/Features/Shared-Baseline.
- [x] Shared-Primitives.
- [x] Architecture Gate.

### BB-1 — Application Composition — **DONE**

- [x] Session/Auth Composition.
- [x] Public/Root Route Composition.
- [x] kanonischer Presentation-Session-Vertrag.

### BB-2 — Dashboard Composition — **IN PROGRESS / P0**

**Ziel:** `Dashboard.tsx` als zentralen Kopplungspunkt in kleine Composition-Bausteine zerlegen, ohne fachliche Contracts zu verändern.

Zielstruktur:

```text
src/app/dashboard/
├── Dashboard.tsx
├── DashboardNavigation.tsx
├── DashboardDrawer.tsx
├── DashboardHeader.tsx
├── DashboardViewRouter.tsx
└── dashboardViews.ts
```

Arbeitspakete:

- [x] **BB-2A Readiness:** aktuellen Main, Roadmap, Feature-Slices und kanonische Pfade korrelieren.
- [x] **BB-2A Namespace-Korrektur:** `LearningUI` in `src/features/index.ts` aufnehmen.
- [x] **BB-2B View Contract:** `DashboardView` und View→Section-Mapping nach `src/app/dashboard/dashboardViews.ts` extrahieren und Legacy-Consumer auf den kanonischen Contract umstellen.
- [x] **BB-2C Session Contract:** Dashboard direkt auf `src/app/types/UserSession` umstellen; Root-Compatibility-Import entfernen.
- [x] **BB-2D View Router / PR #763:** fachliche Detail-Render-Switches nach `DashboardViewRouter.tsx` verschoben, Legacy-Consumer auf den kanonischen Router umgestellt und Feature-Fassaden konsumiert.
- [ ] **BB-2E Navigation:** Desktop Navigation und Mobile Drawer aus dem Monolithen lösen. Der geschlossene, nicht gemergte PR #667 ist keine Current-State-Implementierung; ein neuer Slice muss von dann-current main starten.
- [ ] **BB-2F Header/Shell:** Header, Profil-/Logout-Flächen und globale Shell-Verantwortung extrahieren.
- [ ] **BB-2G Closure:** `Dashboard.tsx` auf reine Composition reduzieren; Architecture-/Unit-/Build-Gates aktualisieren.

Unterstützende Browser-/Root-Recovery innerhalb der BB-2-Composition:

- [x] **PR #782 — Browser Bootstrap Recovery:** `LandingPage` eager an die Root-Composition gebunden; Dashboard bleibt lazy.
- [x] **PR #788 — Public Root Shell Recovery:** Landing-Shell außerhalb der Dashboard-Preview-Suspense-/Error-Grenze; lokaler Preview-Fallback statt vollständigem Root-Ausfall.
- [ ] **Production Android Observation:** auf dem zuvor betroffenen Gerät bestätigen, dass mindestens die öffentliche Landing-Shell statt eines schwarzen Screens sichtbar ist. Diese Observation ist Evidence, keine neue Frontend- oder Deployment-Authority.

Regeln:

- keine neue Routing-Library in BB-2,
- keine fachliche Feature-Migration erzwingen,
- keine Änderung von Scoring-/Market-Data-/Entitlement-/IAM-Contracts,
- jede Teilwelle separat mergebar und revertierbar,
- ein geschlossener oder ungemergter früherer Candidate/PR ist keine Current-State-Evidence,
- Production-/Geräte-Evidence wird nur als PASS markiert, wenn sie tatsächlich erhoben wurde.

### BB-3 — Public / Users / Settings / Billing — **PLANNED**

Landing, Legal, Login-/Registration-Gates, Profile, Passkey/TOTP und Subscription-/Checkout-Flächen physisch in ihre Slices verschieben. Die bereits implementierte Root-Shell-Recovery ist keine Vorwegnahme des vollständigen BB-3-Pfad-/Feature-Migrationsumfangs.

### BB-4 — Screening & Discovery — **PARTIAL / PLANNED**

`RankingBoard` ist bereits kanonisch. Screener, MarketScreener, AssetUniverseDashboard und weitere Discovery-Flächen nach Dependency-Audit physisch migrieren.

### BB-5 — News / Sentiment / Social / Reporting — **PLANNED**

RealtimeAiNewsfeed, Newsticker, MarketSentiment, SentimentDashboard, SocialAccountManager, Publisher und Export-Flächen physisch migrieren.

### BB-6 — Analytics / Crypto / Commodities / Visualization — **PARTIAL**

Crypto- und Commodity-Slices sind bereits teilweise kanonisch. Charts, Heatmap, Performance, Risk und verbleibende Analyseflächen nach Dependency-Audit migrieren.

### BB-7 — Portfolio / Risk / Backtesting — **PLANNED**

Watchlist, Pattern Slots, Backtesting, Portfolio Performance und Monte Carlo physisch migrieren.

### BB-8 — Governance / Admin / Compliance — **PLANNED**

AdminPortal/AdminPanel, Supervisor, Security/Audit, Document Hygiene, VersionManager und Governance-Flächen migrieren; bestehende Platform-Authorities bleiben außerhalb des UI-Slice.

### BB-9 — Stocks / Buffett — **PLANNED**

`BuffetValueCheck` separat und spät migrieren; Parent-Contracts und fail-closed Evidence unverändert erhalten.

### BB-10 — Legacy Exit — **PLANNED**

- produktive Inbound-Imports auf kanonische Pfade umstellen,
- Compatibility-Exports erst bei 0 produktiven Legacy-Consumern entfernen,
- `src/components/` erst bei 0 produktiven Implementierungen löschen.

### BB-11 — Closure — **PLANNED**

Architecture-/Authority-Drift, TypeScript, Unit-/Contract-/Architecture-Tests, Production Build, Accessibility und Documentation Hygiene final validieren.

---

## 6. Visual-/UX-Roadmap

### Phase A — Design System

- [ ] semantische Farben in produktiven Komponenten weiter konsolidieren,
- [x] Shared-Primitives und Evidence-/Authority-Badges,
- [ ] Score-Gauges und Multi-Faktor-Matrix konsolidieren,
- [ ] Typografie/Icon-Nutzung automatisiert prüfen,
- [ ] Storybook-/Component-Library-Grundlage bewerten.

### Phase B — Information Architecture

- [ ] Progressive Disclosure,
- [ ] Score → Kurzanalyse → Detail-Matrix als dominante Hierarchie,
- [ ] Asset-Suche und Filter vereinheitlichen,
- [ ] Secondary Navigation reduzieren,
- [ ] Command Palette bewerten.

### Phase C — Interaktion / Visualization

- [ ] interaktive Multi-Faktor-Matrix,
- [ ] Recharts/D3-Score-Visualisierung,
- [ ] vollständige Keyboard-Navigation und Focus-Management,
- [ ] Live-Daten-Feedback,
- [ ] Export-/Share-UX.

### Phase D — Mobile / Accessibility

- [x] 44×44 Target-Baseline,
- [x] Reduced-Motion-Baseline,
- [ ] mobile Informationsarchitektur,
- [ ] Screenreader-End-to-End-Prüfung,
- [ ] Lighthouse Accessibility ≥ 95 und axe-Baseline,
- [ ] produktive Android-Root-Observation nach Public-Shell-Recovery dokumentieren.

### Phase E — AI-native UX

- [ ] Conversational Layer,
- [ ] Saved Views / personalisierte Dashboards,
- [ ] Explainability-UI,
- [ ] dokumentierte Komponentenbibliothek.

---

## 7. Governance je Welle

Vor jedem Frontend-PR:

1. aktueller `main` und Merge-Base,
2. offene PRs und File-/Namespace-Overlap,
3. Inbound-/Outbound-Imports,
4. fachliche Parent-Authority,
5. Tests und Contracts,
6. Compatibility-Export-Bedarf,
7. `COMPONENT_INVENTORY.md`-Korrelation,
8. `FRONTEND_ARCH.md`-Korrelation,
9. Design-Token-/Accessibility-Drift,
10. TypeScript, Unit-/Contract-/Architecture-Tests und Production Build soweit die aktuelle PR-Klasse sie tatsächlich verlangt.

Documentation-only Roadmap-Korrelationen dürfen nicht durch nicht ausgeführte Runtime-/Browser-Checks als PASS dargestellt werden. Geräte-/Production-Observation bleibt separate Evidence.

---

## 8. Erfolgsmetriken

- Lighthouse Performance ≥ 90,
- Accessibility ≥ 95,
- sinkende Time-to-First-Score,
- sinkende Anzahl produktiver Implementierungen unter `src/components/`,
- steigende Nutzung von Shared-Primitives,
- keine Shared→Feature/App-Abhängigkeiten,
- keine duplizierten fachlichen Authorities,
- geringere Dashboard-Komplexität und kleinere Composition-Units,
- öffentliche Root-Shell bleibt auch bei lokaler Dashboard-Preview-Störung sichtbar.

---

## 9. Unmittelbare Reihenfolge

1. **BB-2E:** Navigation und Drawer auf einem frischen Branch von dann-current main extrahieren; der frühere ungemergte PR #667 wird nicht fortgeschrieben.
2. **BB-2F:** Header/Shell-Verantwortung extrahieren.
3. **BB-2G:** Dashboard auf reine Composition reduzieren und Closure-Gates aktualisieren.
4. Danach Roadmap/Inventory/Architecture erneut gegen den dann aktuellen `main` korrelieren.
5. Erst anschließend mit BB-3/BB-4 physischen Legacy-Migrationen fortfahren.

Parallel zur Implementierungsreihenfolge bleibt die **manuelle Production-Observation des zuvor betroffenen Android-Root-Pfads** offen. Sie bestätigt oder widerlegt die reale Gerätewirkung der bereits gemergten Root-Recovery, verändert aber nicht die BB-2E/2F/2G-Ownership oder Reihenfolge.

---

*Version 1.7.2 korreliert die Roadmap mit `main@12b5ec1886984fb6815ba111108f7f353496de7d`. Sie übernimmt BB-2D aus dem gemergten PR #763 als DONE, hält BB-2E wegen des geschlossenen und nicht gemergten PR #667 offen, dokumentiert die gemergten Browser-/Public-Root-Recoveries aus PR #782 und #788 und trennt deren implementierten Current-State ausdrücklich von der noch ausstehenden manuellen Android-Production-Observation. Nächster P0-Implementierungsschritt ist BB-2E.*
