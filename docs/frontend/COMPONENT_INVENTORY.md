# CAPITAL-AI Frontend – Component Inventory

**Stand:** 1. September 2026  
**Korrelationsbasis:** `main@9be95dd753f962a789312fec77571e2a9778b586` + `agent/frontend-bb2e-navigation-20260901`  
**Dokumentrolle:** Ist-Bestand und Migrationsstatus  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`

Dieses Dokument inventarisiert vorhandene UI-/Feature-Komponenten und ihren Migrationsstatus. Es definiert **keine** eigene Source-Tree-, Dependency-, Market-Data-, Scoring-, Entitlement- oder Governance-Authority.

Verbindliche Abgrenzung:

- Architektur- und Zielpfade werden ausschließlich durch `FRONTEND_ARCH.md` normiert.
- Die Migrationsreihenfolge wird ausschließlich durch `FRONTEND_ROADMAP.md` geplant.
- Fachliche Financial-Runtime-/Evidence-/Scoring-Regeln werden durch `SC-MD-SPT-0001` und die zuständigen ADR-/ESS-Authorities definiert.
- Angaben zu fachlichem Verhalten in diesem Inventory sind beschreibend und dürfen keine Parent-Authority überschreiben.
- Nicht ausdrücklich als kanonisch markierte Dateinamen in den Tabellen liegen derzeit physisch unter `src/components/` und gehören damit zur Legacy-/Compatibility-Zone.

---

## Application Composition — BB-1 / BB-2

| Verantwortung | Kanonischer Pfad | Legacy-/Compatibility-Pfad | Status |
|---|---|---|---|
| Application Composition Root | `src/app/App.tsx` | `src/App.tsx` | BB-1 implementiert; Root-Pfad ist dünne Compatibility-Fassade |
| Session/Auth Composition | `src/app/auth/SessionComposition.tsx` | zuvor Bestandteil von `src/App.tsx` | BB-1 extrahiert; bestehende Security-Semantik erhalten |
| Route/Presentation Composition | `src/app/routing/AppRoutes.tsx` | zuvor Bestandteil von `src/App.tsx` | BB-1 extrahiert; öffentliche Pfade und Landing/Dashboard-Auswahl erhalten |
| Presentation Session Type | `src/app/types/UserSession.ts` | zuvor Interface in `src/App.tsx` | BB-1 extrahiert; Root re-exportiert Typ temporär für Legacy-Consumer |
| App Shell | `src/app/AppShell.tsx` | N/A | kanonisch seit Foundation |
| Dashboard Composition Boundary | `src/app/dashboard/Dashboard.tsx` | `src/components/Dashboard.tsx` | kanonischer Entry kapselt weiterhin den bounded Legacy-Strangler |
| Dashboard View Contract | `src/app/dashboard/dashboardViews.ts` | lokale View-Union entfernt | BB-2B kanonisch; Legacy-Consumer projiziert `DashboardView` |
| Dashboard View Router | `src/app/dashboard/DashboardViewRouter.tsx` + `dashboardRoutedViews.ts` | Render-Switches teilweise noch in `src/components/Dashboard.tsx` | BB-2D Foundation auf Main vorhanden; produktiver Consumer-Cutover offen |
| Dashboard Navigation | `src/app/dashboard/DashboardNavigation.tsx` | Inline-Hamburger/Drawer im Legacy-Dashboard | BB-2E Candidate; Menu-Trigger und Open/Close-State extrahiert |
| Dashboard Drawer | `src/app/dashboard/DashboardDrawer.tsx` | Inline-Drawer im Legacy-Dashboard | BB-2E Candidate; produktiver Inline-Drawer-Renderpfad aus Legacy-Dashboard entfernt |
| Dashboard Header/Shell | geplant `src/app/dashboard/DashboardHeader.tsx` | weiterhin in `src/components/Dashboard.tsx` | BB-2F offen |

BB-1/BB-2 verschieben keine fachliche Authority. Die App-Schicht komponiert und präsentiert vorhandene Feature-/Shared-Contracts; Scoring, Market Data, Evidence, Entitlements, IAM und Governance bleiben bei ihren Parent-Authorities.

---

## Kanonische Shared-Primitives

| Komponente | Kanonischer Pfad | Legacy-/Compatibility-Pfad | Status |
|---|---|---|---|
| StatusBadge | `src/shared/ui/StatusBadge.tsx` | `src/components/StatusBadge.tsx` | migriert; Legacy-Pfad ist Compatibility-Export |
| AuthorityBadge | `src/shared/ui/AuthorityBadge.tsx` | N/A | CV-0; Presentation-Authority-Label für Canonical/Research/Evidence/MarketData |
| FreshnessBadge | `src/shared/ui/FreshnessBadge.tsx` | N/A | CV-0; projiziert gelieferten Status/Zeitstempel, berechnet keine Freshness |
| EvidenceStateIndicator | `src/shared/ui/EvidenceStateIndicator.tsx` | N/A | CV-0; scanbare Evidence-/Data-State-Projektion |
| ResearchOnlyBanner | `src/shared/ui/ResearchOnlyBanner.tsx` | N/A | CV-0; explizit non-authorizing (`scoreEligible=false`, `executionEligible=false`) |
| CapitalAiLogo | `src/shared/branding/CapitalAiLogo.tsx` | `src/components/CapitalAiLogo.tsx` | migriert; Legacy-Pfad ist Compatibility-Export |
| Button | `src/shared/ui/Button.tsx` | N/A | kanonisch |
| Card | `src/shared/ui/Card.tsx` | N/A | kanonisch |
| Input | `src/shared/ui/Input.tsx` | N/A | kanonisch |
| Modal | `src/shared/ui/Modal.tsx` | N/A | kanonisch |
| Tooltip | `src/shared/ui/Tooltip.tsx` | N/A | kanonisch |
| Skeleton | `src/shared/ui/Skeleton.tsx` | N/A | kanonisch |
| EmptyState | `src/shared/ui/EmptyState.tsx` | N/A | kanonisch |
| NeuralBackground | `src/shared/visuals/NeuralBackground.tsx` | N/A | kanonisch |

Die CV-0-Primitives sind **fachneutrale Presentation-Komponenten**. Sie wählen kein Modell, bewerten keine Evidence und erzeugen keine Eligibility. Ihre Semantik ist in `docs/evidence/frontend/CV0_CRYPTO_VISUALIZATION_AUTHORITY_2026-08-23.md` nachgewiesen.

---

## Kern-Dashboard & Cockpit — aktuelle Implementierungen

| Komponente | Aktueller Pfad | Ziel-/Ownership-Slice |
|---|---|---|
| Dashboard Legacy-Strangler | `src/components/Dashboard.tsx` | `src/app/dashboard`; BB-2E entfernt den produktiven Inline-Drawer, Render-/Header-Restschuld bleibt |
| DashboardNavigation | `src/app/dashboard/DashboardNavigation.tsx` | `src/app/dashboard`; BB-2E App-Composition |
| DashboardDrawer | `src/app/dashboard/DashboardDrawer.tsx` | `src/app/dashboard`; BB-2E Presentation-only Drawer |
| DashboardViewRouter | `src/app/dashboard/DashboardViewRouter.tsx` | `src/app/dashboard`; BB-2D Foundation, Consumer-Cutover noch offen |
| AssetUniverseDashboard | `src/components/AssetUniverseDashboard.tsx` | `src/features/screening/ui` |
| RankingBoard | `src/features/screening/ui/RankingBoard.tsx` | **produktive** Ranking-Fläche (Top/Worst 3, Sentiment, Momentum, Pattern); ersetzt UniverseBestWorst |
| UniverseBestWorst | `src/components/UniverseBestWorst.tsx` | `src/features/screening/ui/UniverseBestWorst.tsx` — **nur noch Compatibility-Alias** → `RankingBoard as UniverseBestWorst` |
| Screener | `src/components/Screener.tsx` | `src/features/screening/ui` |
| MarketScreener | `src/components/MarketScreener.tsx` | `src/features/screening/ui` |
| Watchlist | `src/components/Watchlist.tsx` | `src/features/portfolio/ui` |
| FavoriteAssetPatternSlots | `src/components/FavoriteAssetPatternSlots.tsx` | `src/features/portfolio/ui` |

Development-Einstieg für Agents: `AGENTS.md` §12 (Screening Ranking Board / homogene Wertschöpfungskette).

---

## Scoring & Analyse — aktuelle Implementierungen / Migrationsziele

| Komponente | Aktueller bzw. Compatibility-Pfad | Kanonischer Ziel-/Ownership-Slice |
|---|---|---|
| CryptoScoringEnterprise | `src/components/CryptoScoringEnterprise.tsx` als Compatibility-Pfad | `src/features/crypto/ui/CryptoScoringEnterprise.tsx` |
| CryptoVisualizationViewModel | N/A | `src/features/crypto/ui/cryptoVisualizationViewModel.ts` — CV-0 read-only Presentation Projection |
| EnterpriseAsset4hChart | N/A | `src/features/crypto/ui/EnterpriseAsset4hChart.tsx` — MARKET_DATA-Projektion |
| EnterpriseBinanceQuickAnalysis | `src/components/EnterpriseBinanceQuickAnalysis.tsx` als Compatibility-Pfad | `src/features/crypto/ui/EnterpriseBinanceQuickAnalysis.tsx` — MARKET_DATA + RESEARCH getrennt |
| BuffetValueCheck | `BuffetValueCheck.tsx` | `src/features/stocks/ui`; stock-only Research-/Presentation-Consumer gemäß zuständigen Parent-Authorities |
| BacktestEngine | `BacktestEngine.tsx` | `src/features/portfolio/ui` |
| PortfolioBacktester | `PortfolioBacktester.tsx` | `src/features/portfolio/ui` |
| PortfolioPerformance | `PortfolioPerformance.tsx` | `src/features/portfolio/ui` |
| MonteCarloDetailed | `MonteCarloDetailed.tsx` | `src/features/portfolio/ui` |
| RealTimeRiskAssessment | `RealTimeRiskAssessment.tsx` | `src/features/analytics/ui` |
| EnterpriseAnalysisPanels | `EnterpriseAnalysisPanels.tsx` | `src/features/analytics/ui` |
| LandingBinanceQuickAnalysis | `LandingBinanceQuickAnalysis.tsx` | `src/features/crypto/ui` / Public-Consumer zu prüfen |
| HeatmapCreator | `HeatmapCreator.tsx` | `src/features/analytics/ui` |
| QuantumGraph | `QuantumGraph.tsx` | `src/features/analytics/ui` |
| Charts | `Charts.tsx` | `src/features/analytics/ui`; generische Chart-Primitives später auf `src/shared` prüfen |
| PerformanceDashboard | `PerformanceDashboard.tsx` | `src/features/analytics/ui` |
| RawMaterialsDashboard | `src/features/commodities/ui/RawMaterialsDashboard.tsx` | Commodity-Domain-Slice; `src/components/RawMaterialsDashboard.tsx` bleibt dünner Compatibility-Export |
| DeFiOrchestration | `DeFiOrchestration.tsx` | `src/features/crypto/ui` |

### Fachliche Authority-Referenz

Dieses Inventory definiert **keine** eigene Financial-Data-Consumer-Sequenz. Für Asset Catalog ↔ Market Evidence, Entitlement, Provider-/Evidence-Provenance, Verified Display und Canonical Scoring gelten ausschließlich die jeweils aktuellen Parent-Authorities:

- `ADR-0032` — Asset Catalog ↔ Market Evidence,
- `ADR-0034` — Buffett Access / Quota,
- `ADR-0041` + `ESS-0016` — Provider Data Plane / Provenance / Freshness,
- `SC-MD-SPT-0001` — kanonische Screening-/Scoring-/Market-Data-Wertschöpfungskette,
- `ADR-0087` — Canonical Scoring.

Die physische Migration oder Presentation-Projektion einer Komponente darf diese Contracts nicht verändern.

### CV-0 Presentation Projection

`src/features/crypto/ui/cryptoVisualizationViewModel.ts` stellt ausschließlich Backend-/Platform-Ergebnisse dar. Das View Model darf insbesondere nicht:

- Scores oder Modellgewichte berechnen,
- `NOT_AVAILABLE`, `STALE`, `PARTIAL` oder `NOT_COMPUTABLE` zu `0`, `50`, READY oder PASS umdeuten,
- Freshness-Schwellen lokal berechnen,
- Research-/Evidence-Ergebnisse zu kanonischen Scores hochstufen,
- Execution-Eligibility erzeugen.

Die Authority-Klassen `CANONICAL_SCORE`, `RESEARCH`, `EVIDENCE_ONLY` und `MARKET_DATA` sind Presentation-Metadaten und keine neue fachliche Registry.

---

## Sentiment, News & AI — derzeitige Legacy-Implementierungen

| Komponente | Datei unter `src/components/` | Ziel-/Ownership-Slice |
|---|---|---|
| SentimentDashboard | `SentimentDashboard.tsx` | `src/features/news/ui` bzw. Analytics nach Dependency-Audit |
| MarketSentiment | `MarketSentiment.tsx` | `src/features/news/ui` |
| RealtimeAiNewsfeed | `RealtimeAiNewsfeed.tsx` | `src/features/news/ui` |
| Newsticker | `Newsticker.tsx` | `src/features/news/ui` |
| MarkdownOrchestrator | `MarkdownOrchestrator.tsx` | Governance-/Documentary-Consumer; Ziel nach Dependency-Audit |
| OrchestratorPanel | `OrchestratorPanel.tsx` | Governance-/Orchestration-Consumer; Ziel nach Dependency-Audit |
| InteractModule | `InteractModule.tsx` | Ziel nach Dependency-Audit |
| ImageAnalyzer | `ImageAnalyzer.tsx` | Ziel nach Dependency-Audit |

---

## Auth, Profile, Billing — derzeitige Legacy-Implementierungen

| Komponente | Datei unter `src/components/` | Ziel-/Ownership-Slice |
|---|---|---|
| LoginStepUpGate | `LoginStepUpGate.tsx` | `src/features/users/ui` |
| StepUpModal | `StepUpModal.tsx` | `src/features/users/ui` |
| RegistrationCompletionGate | `RegistrationCompletionGate.tsx` | `src/features/users/ui` |
| ProfilePage | `ProfilePage.tsx` | `src/features/settings/ui` |
| PasskeySettings | `PasskeySettings.tsx` | `src/features/settings/ui` |
| TotpSettings | `TotpSettings.tsx` | `src/features/settings/ui` |
| Abonnements | `Abonnements.tsx` | `src/features/billing/ui` |
| SubscriptionModal | `SubscriptionModal.tsx` | `src/features/billing/ui` |
| Checkout | `Checkout.tsx` | `src/features/billing/ui` |
| GuestCliffhangerModal | `GuestCliffhangerModal.tsx` | `src/features/billing/ui` bzw. Public-Consumer nach Dependency-Audit |

Die Auth-Gates selbst bleiben in BB-1 physisch unverändert; nur ihre globale Composition wurde aus dem historischen Root-App-Modul nach `src/app/auth/SessionComposition.tsx` verschoben.

---

## Compliance, Admin, Governance — derzeitige Legacy-Implementierungen

| Komponente | Datei unter `src/components/` | Ziel-/Ownership-Slice |
|---|---|---|
| ComplianceBadge | `ComplianceBadge.tsx` | `src/features/governance/ui` oder Shared nur bei nachgewiesener Fachneutralität |
| ComplianceConsentModal | `ComplianceConsentModal.tsx` | `src/features/governance/ui` |
| ComplianceExporter | `ComplianceExporter.tsx` | `src/features/reporting/ui` |
| ComplianceNotifications | `ComplianceNotifications.tsx` | `src/features/governance/ui` |
| SecurityComplianceAuditor | `SecurityComplianceAuditor.tsx` | `src/features/governance/ui` |
| SecurityRadarBadge | `SecurityRadarBadge.tsx` | `src/features/governance/ui` |
| AuditLog | `AuditLog.tsx` | `src/features/governance/ui` |
| AuditLogs | `AuditLogs.tsx` | `src/features/governance/ui` |
| AuditLogManager | `AuditLogManager.tsx` | `src/features/governance/ui` |
| AdminPanel | `AdminPanel.tsx` | `src/features/governance/ui` |
| AdminPortal | `AdminPortal.tsx` | `src/features/governance/ui` |
| SupervisorDashboard | `SupervisorDashboard.tsx` | `src/features/governance/ui` |
| DocumentHygienePanel | `DocumentHygienePanel.tsx` | `src/features/governance/ui` |
| VersionManagerPanel | `VersionManagerPanel.tsx` | `src/features/governance/ui` |
| AdrForm | `AdrForm.tsx` | `src/features/governance/ui` |
| AuthStateDebugger | `AuthStateDebugger.tsx` | Governance/diagnostic; Ziel nach Dependency-Audit |
| SystemLatencyMonitor | `SystemLatencyMonitor.tsx` | `src/features/governance/ui` bzw. Analytics nach Dependency-Audit |
| SeoDashboard | `SeoDashboard.tsx` | Governance/Marketing-Slice nach Dependency-Audit |

---

## Landing, Legal, Reporting, Social, Utils — derzeitige Legacy-Implementierungen

| Komponente | Datei unter `src/components/` | Ziel-/Ownership-Slice |
|---|---|---|
| LandingPage | `LandingPage.tsx` | `src/features/public/ui` |
| AssetLogo | `AssetLogo.tsx` | Shared nur nach Fachneutralitäts-/Dependency-Prüfung |
| Datenschutz | `Datenschutz.tsx` | `src/features/public/ui` |
| ImpressumAgb | `ImpressumAgb.tsx` | `src/features/public/ui` |
| PdfExportModal | `PdfExportModal.tsx` | `src/features/reporting/ui` |
| PriceAlert | `PriceAlert.tsx` | Screening/Portfolio nach Dependency-Audit |
| SocialAccountManager | `SocialAccountManager.tsx` | `src/features/social/ui` |
| SocialDirectPublisherModal | `SocialDirectPublisherModal.tsx` | `src/features/social/ui` |
| ErrorBoundary | `ErrorBoundary.tsx` | `src/app` oder `src/shared` nach Verantwortungsprüfung |

`CapitalAiLogo` ist nicht mehr in dieser Legacy-Tabelle als produktive Implementierung geführt; der kanonische Pfad liegt unter `src/shared/branding/`.

---

## Design-Tokens / Patterns

| Token / Pattern | Kanonische Quelle | Bemerkung |
|---|---|---|
| Canvas / Surface / Border | `docs/frontend/design-tokens.json` → `src/index.css` | `#08080C` / `#121215` / `#252529` gemäß Manifest v6.1 |
| `brand-primary` / Gold | `docs/frontend/design-tokens.json` | Premium / Primär / Fokus |
| `brand-accent` / Purple | `docs/frontend/design-tokens.json` | AI / Intelligence / Research |
| `brand-cyan` | `docs/frontend/design-tokens.json` | Market Data / Live / technische Visualisierung |
| `asset-*`, `score-*`, `factor-*`, `status-*` | `docs/frontend/design-tokens.json` | semantische Visual-Rollen; lokale Branding-Hexwerte vermeiden |
| historische `aif-*`-Namen | Compatibility-Aliase | deprecated; keine neue Verwendung |
| Presentation-/Dependency-Regeln | `docs/frontend/FRONTEND_ARCH.md` | normative Frontend-Authority |
| Focus Outline | `docs/frontend/design-tokens.json` → `src/index.css` | Gold, 2px, Offset 4px |
| Fonts | Inter, Poppins, JetBrains Mono | `display` / `sans` / `mono` gemäß Manifest v6.1 |
| StatusBadge tones | `src/shared/ui/StatusBadge.tsx` | kanonische Shared-Implementierung |
| CV-0 Authority/Freshness/Evidence | `src/shared/ui/*Badge.tsx`, `EvidenceStateIndicator.tsx`, `ResearchOnlyBanner.tsx` | Presentation-only; Status zusätzlich über Text/Icon |

---

## Regeln zur Pflege dieses Inventars

1. **Keine neue UI-Komponente wird aufgrund dieses Inventars unter `src/components/` angelegt.** Zielpfade bestimmt ausschließlich `FRONTEND_ARCH.md`.
2. Neue fachliche UI gehört grundsätzlich in `src/features/<domain>/ui`; Application Composition in `src/app`; fachneutrale wiederverwendbare Basisbausteine in `src/shared`.
3. `src/components/` ist ausschließlich Legacy-/Compatibility-Zone während der Strangler-Migration.
4. Dieses Inventory dokumentiert nach jeder Migrationswelle den realen physischen Pfad, Ziel-/Ownership-Slice und Compatibility-Status.
5. Fachliche Runtime-/Data-/Scoring-Regeln werden nur referenziert und nicht hier erneut normiert.
6. Ein Legacy-Eintrag darf erst entfernt werden, wenn keine produktive Implementierung bzw. kein erforderlicher Compatibility-Export mehr vorhanden ist.
7. Application-Composition-Logik darf nach BB-1 nicht wieder in die Root-Compatibility-Fassade `src/App.tsx` zurückwandern.
8. Presentation-Authority-Labels dürfen Backend-/Platform-Authority nur projizieren und niemals neu definieren oder hochstufen.

---

*Erstellt am 16.08.2026 im Rahmen der Frontend-Roadmap. Am 20.08.2026 auf die `app/features/shared`-Architektur, das Projection-not-Redefinition-Prinzip und BB-1 Application Composition ausgerichtet. Am 23.08.2026 RankingBoard als Ersatz von UniverseBestWorst dokumentiert und mit CV-0 um Authority-/Freshness-/Evidence-Primitives sowie Manifest-v6.1-Iststand ergänzt. Am 01.09.2026 mit `main@9be95dd753f962a789312fec77571e2a9778b586` und dem BB-2E-Navigation-Candidate korreliert; BB-2D bleibt als vorhandene Router-Foundation mit offenem Consumer-Cutover ausgewiesen.*
