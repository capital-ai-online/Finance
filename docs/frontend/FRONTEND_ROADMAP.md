# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.7.2  
**Stand:** 5. September 2026  
**Korrelationsbasis:** `main@a5026e194e243d556c91e2749da8f405e946c025`  
**Candidate:** `agent/frontend-bb2d-router-cutover-20260905`  
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

## 2. Verifizierter Ist-Stand auf main + BB-2D Candidate

### 2.1 Erfolgreich abgeschlossene Architekturarbeit

- [x] **BB-0 Foundation / PR #459:** `src/app`, `src/features`, `src/shared`, Shared-Primitives und `frontend:architecture:check` etabliert.
- [x] **BB-1 Application Composition / PR #462:** `src/app/App.tsx`, `SessionComposition`, `AppRoutes` und kanonischer `UserSession`-Vertrag etabliert; `src/App.tsx` ist Compatibility-Fassade.
- [x] **BB-2 View Contract / PR #546:** `DashboardView`, exhaustive View→Section-Projektion und Regressionstest unter `src/app/dashboard` etabliert.
- [x] **BB-2 Composition Boundary / PR #548:** `AppRoutes` konsumiert den kanonischen `src/app/dashboard/Dashboard.tsx`-Entry; der Legacy-Monolith ist hinter einer expliziten Strangler-Grenze gebunden.
- [x] **Branding / PR #551:** Dark Black `#08080C` + AIF Gold `#F9BF21` sind das kanonische Primary Brand Pair; Cyan bleibt ausschließlich semantische Market-/Data-/Live-/Technical-Visualisierungsfarbe und Purple sekundärer AI-/Intelligence-Akzent.
- [x] **Crypto Visualization / CV-0:** Authority-/Freshness-/Evidence-Primitives sowie read-only Presentation Projection vorhanden.
- [x] **Screening:** `RankingBoard` ist produktive kanonische Ranking-Fläche; `UniverseBestWorst` ist Compatibility-Alias.
- [x] **Commodities / PR #539:** `src/features/commodities/ui/RawMaterialsDashboard.tsx` ist kanonische Commodity-UI; Legacy-Pfad bleibt Compatibility-Export.
- [x] **Learning / PR #540:** `src/features/learning/ui` sowie öffentliche `/learning-platform`-Route sind integriert; Vocabulary bleibt read-only Projektion der kanonischen Registry.
- [x] **Newsfeed / PR #529:** Asset-/Quellenfilter, Provider-Evidence und `change24hPct` wurden mit den kanonischen Katalog-/Display-Pfaden korreliert.
- [x] **Release-Version / PR #542:** Plattformversion wird aus `package.json#version` über die Release Control Plane projiziert.
- [x] **Frontend-Orchestrator / PR #541, #534, #543:** Admin-Reads, AuthZ-Evidence und Konfigurationsvalidierung wurden fail-closed gehärtet.

### 2.2 Aktuelle strukturelle Restschuld

- `src/components/Dashboard.tsx` bleibt der größte Presentation-Kopplungspunkt.
- `Dashboard.tsx` importiert für Dashboard-/Workspace-Composition und Compatibility weiterhin Komponenten direkt aus `./...`; die migrierten Detail-Views werden im BB-2D-Candidate jedoch über den kanonischen `DashboardViewRouter` und dessen Feature-Fassaden gerendert.
- Navigation, Drawer und Header sind weiterhin gemeinsam im Dashboard-Monolithen gebunden.
- Viele Feature-Implementierungen liegen physisch weiterhin in `src/components/`.
- `FRONTEND_ARCH.md` und `COMPONENT_INVENTORY.md` müssen nach jeder weiteren Welle erneut mit dem exakten Main-Stand korreliert werden.

Mit dem BB-2D-Candidate gilt zusätzlich:

- die lokale 27er-View-Union ist aus dem Consumer entfernt; `Dashboard.tsx` konsumiert `DashboardView` direkt aus `src/app/dashboard/dashboardViews.ts`,
- das lokale `getViewCategory()`-Mapping ist entfernt; die Section-Projektion erfolgt über `getDashboardSection(activeView)`,
- `UserSession` wird direkt aus `src/app/types/UserSession.ts` konsumiert; die Root-Compatibility-Fassade `src/App.tsx` ist keine Session-Type-Authority des Dashboards mehr,
- der separate Navigation-State `universes` bleibt bewusst außerhalb der fachlichen View→Section-Authority,
- die 19 migrierten Detail-Views werden vom Legacy-Consumer über `src/app/dashboard/DashboardViewRouter.tsx` projiziert; `dashboard` und `myworkspace` bleiben bewusst Legacy-Composition für die folgenden BB-2-Wellen.

---

## 3. Darstellung und Qualitätsbewertung

| Bereich | Bewertung | Befund | Nächste Qualitätsmaßnahme |
|---|---|---|---|
| Branding / Design Tokens | **gut** | Dark Black + AIF Gold sind das kanonische Primary Brand Pair; Purple bleibt sekundärer AI-Akzent und Cyan ausschließlich semantische Market-/Data-/Live-/Technical-Visualisierungsfarbe; historische `aif-*`-/`brand-cyan`-Compatibility-Aliase existieren noch | neue UI ausschließlich über kanonische Rollen/semantische Tokens; lokale Hex-/Legacy-Aliase weiter abbauen |
| Typografie | **gut mit Drift-Risiko** | Inter/Poppins/JetBrains Mono sind kanonisch definiert | Headings/Body/Tech-Data in Komponenten automatisiert prüfen |
| Shared UI | **gut** | Button, Card, Input, Modal, Tooltip, Skeleton, EmptyState und Status-/Evidence-Primitives vorhanden | Nutzung in Legacy-Komponenten erhöhen und Parallelimplementierungen entfernen |
| Dashboard IA | **kritische Restschuld** | View-/Session-Contracts und Detail-Rendering sind zentralisiert; Navigation, Drawer und Header bleiben im Monolithen gekoppelt | BB-2E priorisieren |
| Screening | **gut** | kanonisches RankingBoard und klare Authority-Grenze | Filter-/Search-UX und progressive Disclosure verbessern |
| Commodities | **gut** | eigener Feature-Slice, Research/Verified-Grenze explizit | Visual Consistency und gemeinsame Asset-Universe-Navigation prüfen |
| Learning | **gut** | eigener Slice, Public Route, read-only Vocabulary | Feature-Namespace und gemeinsame Public-Surface-Patterns konsolidieren |
| News / Sentiment | **mittel bis gut** | fachliche Integrity-Härtung stark; Komponenten physisch teils Legacy | BB-5 Migration und einheitliche Loading/Empty/Error-Semantik |
| Governance / Admin | **funktional, hohe Komplexität** | Security-Grenzen gehärtet, UI-Implementierungen teils Legacy | BB-8; Admin-Navigation und Operational Status konsolidieren |
| Accessibility | **Baseline vorhanden** | 44px Targets, Focus und Reduced Motion dokumentiert | axe/Lighthouse-Baseline und vollständige Keyboard-/Screenreader-Prüfung |
| Mobile | **mittel** | responsive Basis vorhanden, Dashboard-Dichte bleibt problematisch | Navigation/Drawer in BB-2E entkoppeln und mobile IA separat prüfen |

---

## 4. Kanonische Pfade und Korrelationen

### 4.1 Application Composition

```text
src/main.tsx
  → src/App.tsx                         # Compatibility
  → src/app/App.tsx                     # kanonischer Composition Root
  → src/app/auth/SessionComposition.tsx
  → src/app/routing/AppRoutes.tsx
  → src/app/dashboard/Dashboard.tsx     # kanonische Dashboard-Composition-Grenze
  → src/components/Dashboard.tsx        # bounded Legacy-Strangler
```

Der Legacy-Strangler konsumiert Presentation-Contracts direkt aus:

```text
src/app/dashboard/dashboardViews.ts
src/app/dashboard/DashboardViewRouter.tsx
src/app/types/UserSession.ts
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
- [x] **BB-2D View Router:** fachliche Render-Switches nach `DashboardViewRouter.tsx` verschieben und Feature-Fassaden konsumieren.
- [ ] **BB-2E Navigation:** Desktop Navigation und Mobile Drawer aus dem Monolithen lösen.
- [ ] **BB-2F Header/Shell:** Header, Profil-/Logout-Flächen und globale Shell-Verantwortung extrahieren.
- [ ] **BB-2G Closure:** `Dashboard.tsx` auf reine Composition reduzieren; Architecture-/Unit-/Build-Gates aktualisieren.

Regeln:

- keine neue Routing-Library in BB-2,
- keine fachliche Feature-Migration erzwingen,
- keine Änderung von Scoring-/Market-Data-/Entitlement-/IAM-Contracts,
- jede Teilwelle separat mergebar und revertierbar.

### BB-3 — Public / Users / Settings / Billing — **PLANNED**

Landing, Legal, Login-/Registration-Gates, Profile, Passkey/TOTP und Subscription-/Checkout-Flächen physisch in ihre Slices verschieben.

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
- [ ] Lighthouse Accessibility ≥ 95 und axe-Baseline.

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
10. TypeScript, Unit-/Contract-/Architecture-Tests und Production Build.

---

## 8. Erfolgsmetriken

- Lighthouse Performance ≥ 90,
- Accessibility ≥ 95,
- sinkende Time-to-First-Score,
- sinkende Anzahl produktiver Implementierungen unter `src/components/`,
- steigende Nutzung von Shared-Primitives,
- keine Shared→Feature/App-Abhängigkeiten,
- keine duplizierten fachlichen Authorities,
- geringere Dashboard-Komplexität und kleinere Composition-Units.

---

## 9. Unmittelbare Reihenfolge

1. **BB-2E:** Navigation und Drawer extrahieren.
2. **BB-2F:** Header/Shell-Verantwortung extrahieren.
3. **BB-2G:** Dashboard auf reine Composition reduzieren und Closure-Gates aktualisieren.
4. Danach Roadmap/Inventory/Architecture erneut gegen den dann aktuellen `main` korrelieren.
5. Erst anschließend mit BB-3/BB-4 physischen Legacy-Migrationen fortfahren.

---

*Version 1.7.2 korreliert die Roadmap mit `main@a5026e194e243d556c91e2749da8f405e946c025` und dokumentiert den BB-2D-Candidate: Der Legacy-Dashboard-Consumer projiziert die 19 migrierten Detail-Views über den kanonischen `DashboardViewRouter`, während `dashboard` und `myworkspace` für die folgenden Composition-Wellen bewusst im Legacy-Strangler verbleiben. Nächster P0-Schritt ist BB-2E.*
