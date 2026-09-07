# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.7.3  
**Stand:** 7. September 2026  
**Korrelationsbasis:** `main@e7715f542db65e40cca6d39a6dacb0f30ef08b51`  
**Arbeitsstand:** `agent/frontend-public-scorer-landing-r2-20260907` — Public-Enterprise-Scorer-Recovery auf frischem current-main-Branch  
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

## 2. Verifizierter Ist-Stand auf current main + Public-Scorer-Recovery-Branch

### 2.1 Erfolgreich abgeschlossene Architektur- und Recovery-Arbeit auf `main`

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

### 2.2 P0 — ursprüngliche Public Landing + Enterprise Scorer wiederherstellen

**Status:** IMPLEMENTED ON BRANCH / VALIDATION PENDING  
**Branch:** `agent/frontend-public-scorer-landing-r2-20260907`  
**Baseline:** `main@e7715f542db65e40cca6d39a6dacb0f30ef08b51`

Die Root-Recovery aus PR #782/#788 hat die öffentliche Shell gegen den schweren Dashboard-Graph abgesichert. Der aktuelle P0-Slice stellt zusätzlich die ursprüngliche Produktlogik wieder her: die Root-Landingpage zeigt **nicht** länger das komplette Legacy-Dashboard als Preview, sondern lädt gezielt den kanonischen Enterprise Scorer als öffentliche Produktvorschau.

Kanonische Composition dieses Slices:

```text
/
→ src/app/routing/AppRoutes.tsx
→ src/features/public/ui/LandingPage.tsx
→ src/features/crypto/ui/public.ts
→ PublicCryptoScoringPreview
→ canonical CryptoScoringEnterprise implementation
```

Dabei gelten folgende Invarianten:

- `LandingPage` bleibt eine reine Public-Presentation-Fläche und hängt nicht zurück von `src/app/**`.
- Der Enterprise Scorer wird in Sichtnähe lazy geladen; der schwere authentifizierte Dashboard-Graph ist kein Root-Preview-Consumer mehr.
- `/login` bleibt die einzige Authentifizierungsroute; die Public-Preview erzeugt keine anonyme oder persistierte Supabase-/IAM-Session.
- Der Scorer konsumiert weiterhin die bestehenden kanonischen Score-/Evidence-Verträge; insbesondere bleibt `POST /api/crypto/score` die Crypto-Scoring-Grenze.
- Authentifizierte Sub-Surfaces des Scorers werden im Presentation-Modus `public-preview` ausgeblendet, statt deren IAM-/Endpoint-Vertrag zu verändern.
- `EnterpriseBinanceQuickAnalysis` bleibt im authentifizierten Enterprise-Kontext; ADR-0038 wird dadurch **nicht** superseded.
- Die Public-Projektion definiert keine zweite Scoring-, Market-Data-, Evidence- oder Entitlement-Authority.
- Brand-Farben und Brandmark werden ausschließlich aus den kanonischen v6.2-Verträgen projiziert.

**Exit Gate:** Route-/Architecture-/TypeScript-/Unit-/Production-Build-/Browser-Bootstrap-Evidence für den exakten Branch-Head, finaler current-main/open-PR-Abgleich und Human/Owner-PR-Creation-Gate.

### 2.3 Aktuelle strukturelle Restschuld

- `src/components/Dashboard.tsx` bleibt der größte verbleibende Presentation-Kopplungspunkt für den authentifizierten Dashboard-Pfad.
- Der fachliche Detail-View-Router ist mit BB-2D nach `src/app/dashboard/DashboardViewRouter.tsx` extrahiert und produktiv an den Legacy-Consumer gebunden.
- Desktop-Navigation, Mobile Drawer, Header und globale Shell-Verantwortung bleiben noch im Dashboard-Monolithen gekoppelt.
- `src/app/dashboard/DashboardNavigation.tsx` und `DashboardDrawer.tsx` sind auf current main **nicht** materialisiert; der frühere PR #667 wurde geschlossen und nicht gemergt und ist daher keine Current-State-Evidence für BB-2E.
- Viele Feature-Implementierungen liegen physisch weiterhin in `src/components/`.

Auf current main gilt zusätzlich:

- die lokale View-Union ist aus dem Consumer entfernt; `Dashboard.tsx` konsumiert `DashboardView` direkt aus `src/app/dashboard/dashboardViews.ts`,
- die Section-Projektion erfolgt über `getDashboardSection(activeView)`,
- `UserSession` wird direkt aus `src/app/types/UserSession.ts` konsumiert; die Root-Compatibility-Fassade `src/App.tsx` ist keine Session-Type-Authority des Dashboards mehr,
- migrierte Detail-Views werden über `DashboardViewRouter` und die kanonischen Feature-Fassaden geroutet,
- der separate Navigation-State `universes` bleibt bewusst außerhalb der fachlichen View→Section-Authority,
- die produktive Root-Shell-Recovery ist implementiert; die tatsächliche Darstellung auf dem zuvor betroffenen Android-Gerät bleibt eine **separate manuelle Production-Observation** und wird ohne Geräte-Evidence nicht als PASS behauptet.

---

## 3. Darstellung und Qualitätsbewertung

| Bereich | Bewertung | Befund | Nächste Qualitätsmaßnahme |
|---|---|---|---|
| Branding / Design Tokens | **gut** | Dark Black + AIF Gold sind das kanonische Primary Brand Pair; Branding v6.2 besitzt eine singuläre Token-/Geometrie-Projektion | neue UI ausschließlich über kanonische Rollen/semantische Tokens; lokale Hex-/Legacy-Aliase weiter abbauen |
| Typografie | **gut mit Drift-Risiko** | Inter/Poppins/JetBrains Mono sind kanonisch definiert | Headings/Body/Tech-Data in Komponenten automatisiert prüfen |
| Shared UI | **gut** | Button, Card, Input, Modal, Tooltip, Skeleton, EmptyState und Status-/Evidence-Primitives vorhanden | Nutzung in Legacy-Komponenten erhöhen und Parallelimplementierungen entfernen |
| Dashboard IA | **kritische Restschuld** | View-/Session-Contracts und Detail-Rendering sind zentralisiert; Navigation, Drawer, Header und Shell bleiben im Monolithen gekoppelt | nach Abschluss des Public-P0-Slices BB-2E priorisieren |
| Public Root | **P0 Recovery implemented on branch** | eigenständige Landing-Shell + lazy kanonischer Enterprise Scorer statt vollständigem Legacy-Dashboard-Preview | exakten Branch technisch und im Browser validieren |
| Scoring Preview | **architektonisch korreliert** | Public-Projection nutzt denselben kanonischen Scorer und blendet nur authentifizierte Sub-Surfaces presentation-only aus | keine neue Scoring-/IAM-Authority einführen; Regressionstest erhalten |
| Screening | **gut** | kanonisches RankingBoard und klare Authority-Grenze | Filter-/Search-UX und progressive Disclosure verbessern |
| Commodities | **gut** | eigener Feature-Slice, Research/Verified-Grenze explizit | Visual Consistency und gemeinsame Asset-Universe-Navigation prüfen |
| Learning | **gut** | eigener Slice, Public Route, read-only Vocabulary | Feature-Namespace und gemeinsame Public-Surface-Patterns konsolidieren |
| News / Sentiment | **mittel bis gut** | fachliche Integrity-Härtung stark; Komponenten physisch teils Legacy | BB-5 Migration und einheitliche Loading/Empty/Error-Semantik |
| Governance / Admin | **funktional, hohe Komplexität** | Security-Grenzen gehärtet, UI-Implementierungen teils Legacy | BB-8; Admin-Navigation und Operational Status konsolidieren |
| Accessibility | **Baseline vorhanden** | 44px Targets, Focus und Reduced Motion dokumentiert | axe/Lighthouse-Baseline und vollständige Keyboard-/Screenreader-Prüfung |
| Mobile | **mittel** | responsive Basis vorhanden; Root-Recovery benötigt reale Android-Observation | Public-P0 in Chromium/Android prüfen; danach mobile Dashboard-IA |

---

## 4. Kanonische Pfade und Korrelationen

### 4.1 Application Composition

```text
src/main.tsx
  → src/App.tsx                         # Compatibility
  → src/app/App.tsx                     # kanonischer Composition Root
  → src/app/auth/SessionComposition.tsx
  → src/app/routing/AppRoutes.tsx
      ├─ / → src/features/public/ui/LandingPage.tsx
      │      → lazy src/features/crypto/ui/public.ts
      │      → PublicCryptoScoringPreview
      │      → canonical CryptoScoringEnterprise
      └─ /dashboard → src/app/dashboard/Dashboard.tsx
                      → src/components/Dashboard.tsx
                      → src/app/dashboard/DashboardViewRouter.tsx
```

Der Legacy-Strangler konsumiert Presentation-Contracts direkt aus:

```text
src/app/dashboard/dashboardViews.ts
src/app/dashboard/DashboardViewRouter.tsx
src/app/types/UserSession.ts
```

Der Public-Scorer-Pfad konsumiert:

```text
src/features/public/ui/LandingPage.tsx
src/features/crypto/ui/public.ts
src/features/crypto/ui/PublicCryptoScoringPreview.tsx
src/features/crypto/ui/EnterpriseScorerPresentationContext.tsx
src/features/crypto/ui/CryptoScoringEnterprise.tsx
```

### 4.2 Feature- und Shared-Richtung

```text
src/app
  → src/features/<domain>/ui
  → src/shared
```

Nicht zulässig:

- `shared → features/app`,
- `features → app`,
- `platform → React UI`,
- neue fachliche Implementierung unter `src/components/`,
- lokale Neuautorisierung von Scoring, IAM, Evidence oder Entitlements.

### 4.3 Aktuelle kanonische Feature-Slices

- `features/public/ui`
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

### BB-2 — Dashboard Composition — **IN PROGRESS / P0 after Public Recovery**

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

Unterstützende Browser-/Root-Recovery:

- [x] **PR #782 — Browser Bootstrap Recovery:** `LandingPage` eager an die Root-Composition gebunden; Dashboard bleibt lazy.
- [x] **PR #788 — Public Root Shell Recovery:** Landing-Shell außerhalb der Dashboard-Preview-Suspense-/Error-Grenze.
- [ ] **Public Enterprise Scorer Recovery:** Branch `agent/frontend-public-scorer-landing-r2-20260907` ersetzt den Root-Dashboard-Preview durch eine schmale, lazy Public-Projektion des kanonischen Enterprise Scorers; technische und Browser-Evidence noch offen.
- [ ] **Production Android Observation:** nach Human-Merge/Deployment auf dem zuvor betroffenen Gerät bestätigen, dass Landing-Shell und Scorer-Preview korrekt sichtbar sind.

Regeln:

- keine neue Routing-Library in BB-2,
- keine fachliche Feature-Migration erzwingen,
- keine Änderung von Scoring-/Market-Data-/Entitlement-/IAM-Contracts,
- jede Teilwelle separat mergebar und revertierbar,
- ein geschlossener oder ungemergter früherer Candidate/PR ist keine Current-State-Evidence,
- Production-/Geräte-Evidence wird nur als PASS markiert, wenn sie tatsächlich erhoben wurde.

### BB-3 — Public / Users / Settings / Billing — **PARTIAL / PLANNED**

`LandingPage` liegt bereits kanonisch unter `src/features/public/ui`. Der Public-Enterprise-Scorer-Recovery-Slice korrigiert Root-Composition und Produktvorschau, nimmt aber nicht die vollständige BB-3-Migration von Legal-, Login-/Registration-, Profile-, Passkey/TOTP- und Subscription-/Checkout-Flächen vorweg.

### BB-4 — Screening & Discovery — **PARTIAL / PLANNED**

`RankingBoard` ist bereits kanonisch. Screener, MarketScreener, AssetUniverseDashboard und weitere Discovery-Flächen nach Dependency-Audit physisch migrieren.

### BB-5 — News / Sentiment / Social / Reporting — **PLANNED**

RealtimeAiNewsfeed, Newsticker, MarketSentiment, SentimentDashboard, SocialAccountManager, Publisher und Export-Flächen physisch migrieren.

### BB-6 — Analytics / Crypto / Commodities / Visualization — **PARTIAL**

Crypto- und Commodity-Slices sind bereits teilweise kanonisch. `PublicCryptoScoringPreview` ist eine Presentation-Projektion derselben kanonischen Crypto-Scorer-Implementierung und keine zweite Crypto-Implementation. Charts, Heatmap, Performance, Risk und verbleibende Analyseflächen nach Dependency-Audit migrieren.

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

- [x] öffentliche Root-Hierarchie Landing → Enterprise Scorer wiederhergestellt (Branch, Validation pending),
- [ ] Progressive Disclosure im authentifizierten Dashboard,
- [ ] Score → Kurzanalyse → Detail-Matrix als dominante Hierarchie weiter konsolidieren,
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
- [ ] produktive Android-Root-Observation nach Public-Scorer-Recovery dokumentieren.

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

Eine ADR-/ESS-Supersession erfolgt nur bei tatsächlicher semantischer Authority-Änderung. Eine reine Public-Presentation-Projektion des bestehenden Enterprise Scorers rechtfertigt keine neue oder superseding Scoring-/Market-Data-/IAM-Authority.

Nicht ausgeführte Runtime-/Browser-Checks dürfen nicht als PASS dargestellt werden. Geräte-/Production-Observation bleibt separate Evidence.

---

## 8. Erfolgsmetriken

- Lighthouse Performance ≥ 90,
- Accessibility ≥ 95,
- sinkende Time-to-First-Score,
- öffentliche Root-Shell bleibt ohne Legacy-Dashboard-Preview sofort nutzbar,
- Enterprise-Scorer-Preview bleibt lazy und lokal fehlertolerant,
- sinkende Anzahl produktiver Implementierungen unter `src/components/`,
- steigende Nutzung von Shared-Primitives,
- keine Shared→Feature/App- oder Feature→App-Abhängigkeiten,
- keine duplizierten fachlichen Authorities,
- geringere Dashboard-Komplexität und kleinere Composition-Units.

---

## 9. Unmittelbare Reihenfolge

1. **Public Enterprise Scorer Recovery abschließen:** Route-/Architecture-/TypeScript-/Unit-/Build-/Browser-Gates für `agent/frontend-public-scorer-landing-r2-20260907` erheben und nach finaler current-main-Korrelation durch das PR-Creation-Gate führen.
2. **BB-2E:** nach Abschluss des Recovery-Slices Navigation und Drawer auf einem frischen dann-current-main-Branch extrahieren; der frühere ungemergte PR #667 wird nicht fortgeschrieben.
3. **BB-2F:** Header/Shell-Verantwortung extrahieren.
4. **BB-2G:** Dashboard auf reine Composition reduzieren und Closure-Gates aktualisieren.
5. Danach Roadmap/Inventory/Architecture erneut gegen den dann aktuellen `main` korrelieren.

Parallel bleibt die **manuelle Production-Observation des zuvor betroffenen Android-Root-Pfads** offen. Sie ist erst nach Human-Merge/Deployment des Recovery-Slices aussagekräftig und verändert keine Ownership oder fachliche Authority.

---

*Version 1.7.3 übernimmt die dokumentbasierte Korrelation aus dem historischen Roadmap-Branch, bindet sie an `main@e7715f542db65e40cca6d39a6dacb0f30ef08b51` und ergänzt den aktuellen P0-Slice zur Wiederherstellung der eigenständigen Landingpage mit kanonischem Enterprise Scorer. ADR-/ESS-Supersession wurde geprüft und ist für diese Presentation-/Routing-Änderung nicht erforderlich.*