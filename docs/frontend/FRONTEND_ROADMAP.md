# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.5  
**Stand:** 20. August 2026  
**Owner:** Sven Kulessa / Capital-AI  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Bestandsnachweis:** `docs/frontend/COMPONENT_INVENTORY.md`

Dieses Dokument ist die **kanonische Frontend-Migrations- und UX-Roadmap**. Es definiert Reihenfolge, Status und geplante Arbeit, aber **keine** eigene Source-Tree-, Dependency-, Market-Data-, Scoring-, Entitlement- oder Governance-Authority.

Verbindliches Rollenmodell:

- `FRONTEND_ARCH.md` bestimmt **wie** das Frontend strukturiert sein muss.
- `COMPONENT_INVENTORY.md` beschreibt **was** aktuell existiert und wo es physisch liegt.
- `FRONTEND_ROADMAP.md` bestimmt **wann/in welcher Reihenfolge** migriert wird.
- `SC-MD-SPT-0001` und die zuständigen ADR-/ESS-Dokumente bestimmen **wie fachliche Financial-Runtime-/Evidence-/Scoring-Prozesse funktionieren**.

Die Roadmap darf daher keine fachliche Parent-Authority duplizieren. Änderungen an Runtime-/Financial-Contracts werden nur als Abhängigkeit oder Migrationsvoraussetzung referenziert.

---

## 1. Vision

Das Frontend soll sich von einem funktionalen, dichten Dashboard zu einem **ruhigen, präzisen und institutionell wirkenden Cockpit** entwickeln:

- klare visuelle Hierarchie,
- reduzierte kognitive Last,
- exzellente Data-Visualisierung (Recharts / D3),
- AI-native Interaktionen und Explainability,
- hohe Accessibility (WCAG 2.2 AA / BFSG / EN 301 549),
- konsistentes Design-System,
- fachlich saubere Vertical Slices ohne parallele Frontend-Authority.

Zielbild: modernes FinTech-/Quant-Interface mit klarer Trennung zwischen Application Composition, fachlichen Feature-Slices, Shared-Primitives und bestehenden Enterprise-/Runtime-Authorities.

---

## 2. Aktueller Stand

### Stärken

- Dark-Theme-Identität (`#18181b`, AIF-Gold, Neon-Cyan/Purple),
- klare Status-Kommunikation (READY / REJECT / DATA_UNAVAILABLE),
- Multi-Asset-Scoring-/Screening-Funktionalität vorhanden,
- Responsive Basis und Motion-Integration,
- Fokus-Outline und Reduced-Motion-Support,
- `app/features/shared`-Strukturbaseline durch gemergten PR #459,
- Shared-Primitives und Architektur-Gate auf `main`,
- BB-1 Application Composition auf Branch `refactor/frontend-bb1-app-composition-2026-08-20` implementiert und noch nicht gemergt.

### Strukturelle Restschuld

- `Dashboard.tsx` bleibt ein großer zentraler Kopplungspunkt,
- viele fachliche Implementierungen liegen physisch noch in `src/components/`,
- Feature-`ui/index.ts` dienen teilweise noch als Strangler-Fassaden auf Legacy-Pfade,
- Legacy-Type-Consumer können während der Migration noch über die Root-Compatibility-Fassade auf `UserSession` zugreifen,
- die physischen Feature-Migrationen BB-3 bis BB-9 stehen noch aus.

---

## 3. Architektur-Baseline — PR #459

PR #459 ist am 20. August 2026 gemergt und etabliert die strukturelle Voraussetzung für alle folgenden Migrationswellen:

```text
src/app
  ↓
src/features/<domain>/ui
  ↓
src/shared
```

Umgesetzt auf `main`:

- `src/app/AppShell.tsx`,
- Feature-UI-Fassaden für Public, Users, Settings, Screening, Crypto, Stocks, Analytics, News, Portfolio, Billing, Reporting, Social und Governance,
- `StatusBadge` → `src/shared/ui/StatusBadge.tsx`,
- `CapitalAiLogo` → `src/shared/branding/CapitalAiLogo.tsx`,
- `Button`, `Card`, `Input`, `Modal`, `Tooltip`, `Skeleton`, `EmptyState` → `src/shared/ui`,
- `NeuralBackground` → `src/shared/visuals`,
- Legacy-Pfade für bereits migrierte Shared-Bausteine nur als Compatibility-Exports,
- `frontend:architecture:check` als strukturelles Gate,
- klare Dokumentrollen nach `Projection, not Redefinition`.

---

## 4. Schrittweise Auflösung der bisherigen Big-Bang-Restschuld

Jede Welle muss einzeln mergebar und rücksetzbar bleiben. Vor jeder Welle wird gegen den aktuellen `main` synchronisiert und auf offene PR-/Pfadkorrelationen geprüft.

### Welle 0 / BB-0 — Foundation / Architecture Baseline — **DONE**

- [x] `app/features/shared` etablieren.
- [x] Shared-Primitives physisch verschieben.
- [x] Compatibility-Exports für bereits migrierte Shared-Bausteine.
- [x] Feature-UI-Fassaden etablieren.
- [x] Frontend-Architecture-Gate integrieren.
- [x] Frontend-Dokumentrollen entkoppeln.
- [x] Human-/CODEOWNER-Merge von PR #459.

### Welle 1 / BB-1 — Application Composition — **IMPLEMENTED ON BRANCH / VALIDATION PENDING**

**Branch:** `refactor/frontend-bb1-app-composition-2026-08-20`

**Ziel:** historischen Root `src/App.tsx` von Auth-/Session-/Routing-Verantwortungen entkoppeln.

Implementierte Struktur:

```text
src/app/
├── App.tsx
├── AppShell.tsx
├── auth/
│   └── SessionComposition.tsx
├── routing/
│   └── AppRoutes.tsx
├── types/
│   └── UserSession.ts
├── index.ts
└── README.md
```

Umgesetzt:

- [x] `UserSession`/`SubscriptionTier` aus historischem Root extrahiert.
- [x] Supabase-Session-Lifecycle, Onboarding, Login-Step-Up, Password-Recovery und globale 401-Behandlung in `SessionComposition.tsx` komponiert.
- [x] öffentliche Legal-Pfade sowie Landing-/Dashboard-Auswahl nach `AppRoutes.tsx` extrahiert.
- [x] `src/app/App.tsx` als kanonischen Composition Root etabliert.
- [x] `src/App.tsx` auf dünne Compatibility-Fassade reduziert.
- [x] Architektur-Gate um BB-1-Pfade und Root-Fassadenregel erweitert.
- [x] App-README, Frontend-Architektur und Component Inventory aktualisiert.
- [ ] finaler Main-Sync unmittelbar vor PR-Readiness.
- [ ] TypeScript / Unit-/Contract-Tests / Production Build / Architecture Gate auf finalem Head.
- [ ] deutscher Draft PR.
- [ ] Human-/CODEOWNER-Merge.

Bewusst **nicht** Bestandteil von BB-1:

- keine Dashboard-Zerlegung,
- keine physische Feature-Migration,
- kein neues Routing-Framework,
- keine Änderung der IAM-/AuthN-/AuthZ-/MFA-Semantik,
- keine Backend-/Supabase-/Stripe-/Render-Mutation.

### Welle 2 / BB-2 — Dashboard Composition — **NEXT**

**Ziel:** `Dashboard.tsx` als zentralen Kopplungspunkt zerlegen.

Vorgesehene Struktur:

```text
src/app/dashboard/
├── Dashboard.tsx
├── DashboardNavigation.tsx
├── DashboardDrawer.tsx
├── DashboardHeader.tsx
├── DashboardViewRouter.tsx
└── dashboardViews.ts
```

Regeln:

- Dashboard-Composition konsumiert Feature-Fassaden statt direkter `./Component`-Imports.
- Fachliche Komponenten bleiben in dieser Welle zunächst in ihren bestehenden Slices/Legacy-Pfaden.
- `UserSession`-Consumer werden auf die kanonische nicht-zirkuläre Contract-Grenze umgestellt.
- Keine Änderung fachlicher Scoring-/Market-Data-/Entitlement-Contracts.

### Welle 3 / BB-3 — Public / Users / Settings / Billing

Physisch verschieben:

- LandingPage,
- Datenschutz,
- Impressum/AGB,
- LoginStepUpGate,
- RegistrationCompletionGate,
- StepUpModal,
- ProfilePage,
- Passkey/TOTP Settings,
- Subscription-/Checkout-Flächen.

Ziele: `features/public`, `features/users`, `features/settings`, `features/billing`.

### Welle 4 / BB-4 — Screening & Discovery

Physisch verschieben:

- Screener,
- MarketScreener,
- AssetUniverseDashboard,
- UniverseBestWorst,
- verwandte Discovery-/Filter-/Alert-Flächen nach Dependency-Audit.

Ziel: `features/screening/ui`.

Financial-Data-Regeln werden nur über die zuständigen Parent-Authorities konsumiert; diese Roadmap definiert keine eigene Request-Sequenz.

### Welle 5 / BB-5 — News / Sentiment / Social / Reporting

Physisch verschieben:

- RealtimeAiNewsfeed,
- Newsticker,
- MarketSentiment,
- SentimentDashboard,
- SocialAccountManager,
- SocialDirectPublisherModal,
- ComplianceExporter,
- PdfExportModal.

Ziele: `features/news`, `features/social`, `features/reporting`.

### Welle 6 / BB-6 — Analytics / Crypto / Data Visualization

Physisch verschieben und bei Bedarf zerlegen:

- Charts,
- HeatmapCreator,
- PerformanceDashboard,
- RealTimeRiskAssessment,
- EnterpriseAnalysisPanels,
- CryptoScoringEnterprise,
- EnterpriseBinanceQuickAnalysis,
- DeFiOrchestration,
- RawMaterialsDashboard nach Domain-/Dependency-Audit.

Nur nach nachgewiesener Fachneutralität dürfen generische Visual-Primitives nach `src/shared` verschoben werden.

### Welle 7 / BB-7 — Portfolio / Risk / Backtesting

Physisch verschieben:

- Watchlist,
- FavoriteAssetPatternSlots,
- BacktestEngine,
- PortfolioBacktester,
- PortfolioPerformance,
- MonteCarloDetailed,
- weitere Portfolio-/Risk-Consumer nach Dependency-Audit.

Ziel: `features/portfolio/ui` bzw. fachlich passende Slices.

### Welle 8 / BB-8 — Governance / Admin / Compliance UI

Physisch verschieben:

- AdminPortal / AdminPanel,
- SupervisorDashboard,
- SecurityComplianceAuditor,
- SecurityRadarBadge,
- Audit-Flächen,
- DocumentHygienePanel,
- VersionManagerPanel,
- ADR-/Governance-Flächen.

Ziel: `features/governance/ui`.

Die UI bleibt Consumer bestehender Governance-/Supervisor-/Compliance-Authorities; keine Platform-Authority wird in den Frontend-Slice verschoben.

### Welle 9 / BB-9 — Stocks / Buffett

`BuffetValueCheck.tsx` wird bewusst **spät und separat** physisch nach `features/stocks/ui` verschoben.

Voraussetzungen:

- aktueller Main-Sync,
- keine parallele Änderung am Buffett-/Verified-Display-Scope,
- alle zuständigen Parent-Contracts unverändert erhalten,
- Tests für Entitlement-/Evidence-/Fail-Closed-Verhalten bleiben grün.

Diese Roadmap normiert die Financial-Subchain nicht; fachlich maßgeblich bleiben `SC-MD-SPT-0001`, ADR-0032, ADR-0034, ADR-0041/ESS-0016 und ADR-0087.

### Welle 10 / BB-10 — Legacy Exit

- alle produktiven Inbound-Imports auf kanonische Pfade umstellen,
- Compatibility-Exports nur bei `0` verbleibenden produktiven Legacy-Consumern entfernen,
- `src/components/` erst löschen, wenn dort keine produktive Implementierung mehr liegt,
- Component Inventory final auf kanonische Pfade aktualisieren,
- Architektur-Gate um nicht mehr benötigte Legacy-Ausnahmen bereinigen.

### Welle 11 / BB-11 — Closure

- finale Architektur-/Dokumentrollen validieren,
- alle Legacy-Ausnahmen aus dem Architektur-Gate entfernen, die nicht mehr benötigt werden,
- TypeScript, Unit-/Contract-/Architecture-Tests und Production Build auf dem vollständigen Zielzustand ausführen,
- Documentation Hygiene und Governance Control Plane gegen den finalen Frontend-Zustand prüfen,
- keine neue fachliche Authority im Frontend zurücklassen.

---

## 5. Visual-/UX-Roadmap

Die strukturelle Migration ersetzt nicht die bestehende UX-/Design-Weiterentwicklung.

### Phase A — Visual Design System

- [ ] Semantic Colors weiter konsolidieren.
- [x] `StatusBadge` als Shared-Primitive.
- [x] `Button`, `Card`, `Input`, `Modal`, `Tooltip`, `Skeleton`, `EmptyState` als Shared-Baseline.
- [x] NeuralBackground als Shared-Visual.
- [ ] Score-Gauges und Multi-Faktor-Matrix vervollständigen.
- [ ] Typografie und Icon-Nutzung vereinheitlichen.
- [ ] Storybook-/Component-Library-Grundlage prüfen.

### Phase B — Information Architecture & UX

- [ ] Progressive Disclosure,
- [ ] primäre Hierarchie Score → Kurzanalyse → Detail-Matrix,
- [ ] verbesserte Asset-Suche & Filter-UX,
- [ ] Onboarding / First-Time-User-Flow,
- [x] Shared Empty-/Loading-Primitives als technische Basis,
- [ ] Secondary Navigation reduzieren,
- [ ] Command-Palette prüfen.

### Phase C — Interaktionen & Data Visualization

- [ ] Mikro-Interaktionen und Transitions,
- [ ] interaktive Multi-Faktor-Bewertungsmatrix,
- [ ] Score-Visualisierung mit Recharts/D3,
- [ ] Keyboard-Navigation und Focus-Management,
- [ ] Live-Daten-Feedback,
- [ ] Export-/Share-UX.

### Phase D — Mobile & Accessibility

- [x] 44×44 Touch-Targets als Baseline,
- [ ] mobile Informationsarchitektur,
- [ ] vollständige Screenreader-Unterstützung,
- [ ] Kontrast-/Fokus-Optimierung,
- [x] `prefers-reduced-motion` Baseline.

### Phase E — AI-native Features & Skalierung

- [ ] Conversational Layer,
- [ ] personalisierte Dashboards / Saved Views,
- [ ] Explainability-UI,
- [ ] Design-System + Storybook,
- [ ] Komponentenbibliothek dokumentieren,
- [ ] optionales Theming / Light Mode bewerten.

---

## 6. Governance-Regeln je Migrationswelle

Vor jedem Migrations-PR sind mindestens folgende Punkte zu prüfen:

1. aktueller `main` und Merge-Base,
2. offene PRs und überlappende Pfade,
3. Inbound-/Outbound-Imports der Zielkomponente,
4. zuständige fachliche Parent-Authority,
5. Tests/Contracts, die zusammen mit der Komponente erhalten werden müssen,
6. ob ein Compatibility-Export erforderlich ist,
7. ob das `COMPONENT_INVENTORY.md` den realen Pfad-/Migrationsstatus widerspiegelt,
8. ob `FRONTEND_ARCH.md` unverändert gültig bleibt,
9. ob fachliche Regeln nur referenziert und nicht als zweite Authority neu beschrieben werden,
10. TypeScript, Unit-/Contract-Tests, Production Build und Frontend-Architecture-Gate.

Eine Migrationswelle darf keine bestehende Runtime-/Scoring-/IAM-/Compliance-/Governance-Authority in `src/shared` oder eine neue Frontend-Parallelarchitektur verschieben.

---

## 7. Erfolgsmetriken

- Lighthouse Performance ≥ 90,
- Accessibility Score ≥ 95,
- Reduktion der Time-to-First-Score,
- positive Nutzerbewertung zu Klarheit und Übersichtlichkeit,
- steigende Komponenten-Wiederverwendbarkeit,
- sinkende Anzahl produktiver Implementierungen unter `src/components/`,
- keine neuen Shared→Feature/App-Abhängigkeiten,
- keine duplizierten fachlichen Authorities in Frontend-Dokumenten.

---

## 8. Nächste Schritte

1. BB-1 Branch gegen den dann aktuellen `main` revalidieren und Pfadkorrelationen erneut prüfen.
2. BB-1 Architecture Gate, TypeScript, Tests und Production Build auf dem finalen Head ausführen.
3. BB-1 als deutschen Draft PR zur Human-/CODEOWNER-Prüfung bereitstellen.
4. Erst nach BB-1-Merge BB-2 Dashboard Composition auf frischem Branch beginnen.
5. Nach jeder Welle Inventory und Roadmap aktualisieren und Architecture-/Authority-Drift prüfen.
6. Live Lighthouse-/axe-Baseline ergänzen.

---

*Ursprung: Frontend-Roadmap vom 16.08.2026. Version 1.5 vom 20.08.2026 dokumentiert den Merge der Foundation und den implementierten BB-1 Application-Composition-Schnitt.*
