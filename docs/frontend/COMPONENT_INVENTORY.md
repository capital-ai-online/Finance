# CAPITAL-AI Frontend – Component Inventory

**Stand:** 7. September 2026  
**Korrelationsbasis:** `main@e7715f542db65e40cca6d39a6dacb0f30ef08b51` + `agent/frontend-public-scorer-landing-r2-20260907`  
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
| Route/Presentation Composition | `src/app/routing/AppRoutes.tsx` | zuvor Bestandteil von `src/App.tsx` | kanonisch; trennt `/`, `/login`, `/dashboard`, Legal, Learning und Media-Studio |
| Dashboard Composition | `src/app/dashboard/Dashboard.tsx` + `DashboardViewRouter.tsx` | `src/components/Dashboard.tsx` | BB-2D produktiv; Legacy-Dashboard bleibt bounded Strangler für authentifizierte Composition |
| Presentation Session Type | `src/app/types/UserSession.ts` | zuvor Interface in `src/App.tsx` | BB-1 extrahiert; Root re-exportiert Typ temporär für Legacy-Consumer |
| App Shell | `src/app/AppShell.tsx` | N/A | kanonisch seit Foundation |

### Öffentliche Root-Composition — Public Enterprise Scorer Recovery

Der aktuelle Recovery-Branch materialisiert folgende Composition:

```text
src/app/routing/AppRoutes.tsx
  → src/features/public/ui/LandingPage.tsx
  → lazy src/features/crypto/ui/public.ts
  → PublicCryptoScoringPreview
  → canonical CryptoScoringEnterprise implementation
```

Verbindliche Bestandsgrenzen:

- `/` konsumiert **nicht** mehr den vollständigen Legacy-Dashboard-Graph als Produktvorschau.
- `LandingPage` bleibt feature-owned Presentation und importiert nicht aus `src/app/**`.
- `/login` bleibt dedizierte Authentifizierungsroute.
- die Public-Scorer-Projektion erzeugt keine `UserSession` und keine persistierte/anonyme Supabase-Session.
- `PublicCryptoScoringPreview` ist keine zweite Scorer-Implementierung, sondern ein Presentation-Wrapper um dieselbe kanonische Enterprise-Scorer-Implementierung.
- `EnterpriseScorerPresentationContext` besitzt keine IAM-/Entitlement-Authority; er blendet im Modus `public-preview` ausschließlich bereits authentifizierungsgebundene UI-Sub-Surfaces aus.
- `EnterpriseBinanceQuickAnalysis` bleibt an seinen authentifizierten Enterprise-Kontext gebunden; ADR-0038 wird nicht verändert oder superseded.

---

## Kanonische Shared-Primitives

| Komponente | Kanonischer Pfad | Legacy-/Compatibility-Pfad | Status |
|---|---|---|---|
| StatusBadge | `src/shared/ui/StatusBadge.tsx` | `src/components/StatusBadge.tsx` | migriert; Legacy-Pfad ist Compatibility-Export |
| AuthorityBadge | `src/shared/ui/AuthorityBadge.tsx` | N/A | CV-0; Presentation-Authority-Label für Canonical/Research/Evidence/MarketData |
| FreshnessBadge | `src/shared/ui/FreshnessBadge.tsx` | N/A | CV-0; projiziert gelieferten Status/Zeitstempel, berechnet keine Freshness |
| EvidenceStateIndicator | `src/shared/ui/EvidenceStateIndicator.tsx` | N/A | CV-0; scanbare Evidence-/Data-State-Projektion |
| ResearchOnlyBanner | `src/shared/ui/ResearchOnlyBanner.tsx` | N/A | CV-0; explizit non-authorizing (`scoreEligible=false`, `executionEligible=false`) |
| CapitalAiLogo | `src/shared/branding/CapitalAiLogo.tsx` | `src/components/CapitalAiLogo.tsx` | migriert; Landingpage konsumiert die kanonische Brandmark-v6.2-Projektion |
| Button | `src/shared/ui/Button.tsx` | N/A | kanonisch |
| Card | `src/shared/ui/Card.tsx` | N/A | kanonisch |
| Input | `src/shared/ui/Input.tsx` | N/A | kanonisch |
| Modal | `src/shared/ui/Modal.tsx` | N/A | kanonisch |
| Tooltip | `src/shared/ui/Tooltip.tsx` | N/A | kanonisch |
| Skeleton | `src/shared/ui/Skeleton.tsx` | N/A | kanonisch |
| EmptyState | `src/shared/ui/EmptyState.tsx` | N/A | kanonisch |
| NeuralBackground | `src/shared/visuals/NeuralBackground.tsx` | N/A | kanonisch |

Die CV-0-Primitives sind **fachneutrale Presentation-Komponenten**. Sie wählen kein Modell, bewerten keine Evidence und erzeugen keine Eligibility.

---

## Kern-Dashboard & Cockpit — derzeitige Legacy-/Strangler-Implementierungen

| Komponente | Aktueller Pfad | Ziel-/Ownership-Slice |
|---|---|---|
| Dashboard | `src/components/Dashboard.tsx` hinter `src/app/dashboard/Dashboard.tsx` | `src/app/dashboard`; BB-2E/2F/2G verbleiben |
| DashboardViewRouter | `src/app/dashboard/DashboardViewRouter.tsx` | kanonische app-owned Detail-View-Composition; BB-2D DONE |
| AssetUniverseDashboard | `src/components/AssetUniverseDashboard.tsx` | `src/features/screening/ui` |
| RankingBoard | `src/features/screening/ui/RankingBoard.tsx` | **produktive** Ranking-Fläche; ersetzt UniverseBestWorst |
| UniverseBestWorst | `src/features/screening/ui/UniverseBestWorst.tsx` + Legacy-Bridge | nur Compatibility-Alias → `RankingBoard as UniverseBestWorst` |
| Screener | `src/components/Screener.tsx` | `src/features/screening/ui` |
| MarketScreener | `src/components/MarketScreener.tsx` | `src/features/screening/ui` |
| Watchlist | `src/components/Watchlist.tsx` | `src/features/portfolio/ui` |
| FavoriteAssetPatternSlots | `src/components/FavoriteAssetPatternSlots.tsx` | `src/features/portfolio/ui` |

Development-Einstieg für Agents: `AGENTS.md` §12 (Screening Ranking Board / homogene Wertschöpfungskette).

---

## Scoring & Analyse — aktuelle Implementierungen / Migrationsziele

| Komponente / Rolle | Aktueller bzw. Compatibility-Pfad | Kanonischer Status / Ownership |
|---|---|---|
| Enterprise-Scorer Core | `src/features/crypto/ui/CryptoScoringEnterprise.tsx` | produktive Scorer-UI; konsumiert kanonische Backend-Score-/Evidence-Verträge |
| CryptoScoringWorkspace | `src/features/crypto/ui/CryptoScoringWorkspace.tsx` | kanonische routed Crypto-Scoring-Composition; Feature-Fassade exportiert sie als `CryptoScoringEnterprise` |
| Crypto Feature Facade | `src/features/crypto/ui/index.ts` | `CryptoScoringWorkspace as CryptoScoringEnterprise`; aktuelle Naming-Convention für routed Consumer |
| Public Crypto Facade | `src/features/crypto/ui/public.ts` | schmale Route-Level-Fassade; exportiert ausschließlich `PublicCryptoScoringPreview` |
| PublicCryptoScoringPreview | `src/features/crypto/ui/PublicCryptoScoringPreview.tsx` | Public-Presentation-Wrapper um denselben Scorer Core; **keine zweite Scoring-Implementation** |
| EnterpriseScorerPresentationContext | `src/features/crypto/ui/EnterpriseScorerPresentationContext.tsx` | Presentation-only `authenticated | public-preview`; keine IAM-/Scoring-/Entitlement-Authority |
| Legacy CryptoScoringEnterprise Bridge | `src/components/CryptoScoringEnterprise.tsx` | Compatibility-Pfad; keine neue Implementierung |
| CryptoVisualizationViewModel | `src/features/crypto/ui/cryptoVisualizationViewModel.ts` | CV-0 read-only Presentation Projection |
| EnterpriseAsset4hChart | `src/features/crypto/ui/EnterpriseAsset4hChart.tsx` | MARKET_DATA-Projektion |
| EnterpriseBinanceQuickAnalysis | `src/features/crypto/ui/EnterpriseBinanceQuickAnalysis.tsx` | MARKET_DATA + RESEARCH; im `public-preview` Presentation-Modus ausgeblendet, authentifizierter Endpoint-Vertrag unverändert |
| Legacy EnterpriseBinanceQuickAnalysis Bridge | `src/components/EnterpriseBinanceQuickAnalysis.tsx` | Compatibility-Pfad |
| BuffetValueCheck | `src/components/BuffetValueCheck.tsx` | `src/features/stocks/ui`; stock-only Research-/Presentation-Consumer gemäß Parent-Authorities |
| BacktestEngine | `src/components/BacktestEngine.tsx` | `src/features/portfolio/ui` |
| PortfolioBacktester | `src/components/PortfolioBacktester.tsx` | `src/features/portfolio/ui` |
| PortfolioPerformance | `src/components/PortfolioPerformance.tsx` | `src/features/portfolio/ui` |
| MonteCarloDetailed | `src/components/MonteCarloDetailed.tsx` | `src/features/portfolio/ui` |
| RealTimeRiskAssessment | `src/components/RealTimeRiskAssessment.tsx` | `src/features/analytics/ui` |
| EnterpriseAnalysisPanels | `src/components/EnterpriseAnalysisPanels.tsx` | `src/features/analytics/ui` nach Dependency-Audit |
| LandingBinanceQuickAnalysis | `src/components/LandingBinanceQuickAnalysis.tsx` | historischer/separater Public-Quick-Analysis-Consumer; nicht Teil des neuen Enterprise-Scorer-Preview-Wrappers |
| HeatmapCreator | `src/components/HeatmapCreator.tsx` | `src/features/analytics/ui` |
| QuantumGraph | `src/components/QuantumGraph.tsx` | `src/features/analytics/ui` |
| Charts | `src/components/Charts.tsx` | `src/features/analytics/ui`; generische Chart-Primitives später auf `src/shared` prüfen |
| PerformanceDashboard | `src/components/PerformanceDashboard.tsx` | `src/features/analytics/ui` |
| RawMaterialsDashboard | `src/features/commodities/ui/RawMaterialsDashboard.tsx` | Commodity-Domain-Slice; Legacy-Pfad bleibt dünner Compatibility-Export |
| DeFiOrchestration | `src/components/DeFiOrchestration.tsx` | `src/features/crypto/ui` |

### Fachliche Authority-Referenz

Dieses Inventory definiert **keine** eigene Financial-Data-Consumer-Sequenz. Für Asset Catalog ↔ Market Evidence, Entitlement, Provider-/Evidence-Provenance, Verified Display und Canonical Scoring gelten ausschließlich die jeweils aktuellen Parent-Authorities:

- `ADR-0032` — Asset Catalog ↔ Market Evidence,
- `ADR-0034` — Buffett Access / Quota,
- `ADR-0038` — Landing/Enterprise Binance Quick-Analysis-Kontexttrennung,
- `ADR-0041` + `ESS-0016` — Provider Data Plane / Provenance / Freshness,
- `SC-MD-SPT-0001` — kanonische Screening-/Scoring-/Market-Data-Wertschöpfungskette,
- `ADR-0087` — Canonical Scoring.

Die physische Migration oder Presentation-Projektion einer Komponente darf diese Contracts nicht verändern. Für den Public-Enterprise-Scorer-Slice wurde eine ADR-/ESS-Supersession geprüft und verworfen, weil keine fachliche Authority geändert wird.

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

Die Auth-Gates selbst bleiben physisch unverändert; ihre globale Composition liegt unter `src/app/auth/SessionComposition.tsx`. Der Public-Scorer-Recovery-Slice verändert keine serverseitige Auth-/IAM-Entscheidung.

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

## Landing, Legal, Reporting, Social, Utils

| Komponente | Aktueller Pfad | Status / Ziel |
|---|---|---|
| LandingPage | `src/features/public/ui/LandingPage.tsx` | kanonische Public-Landing-Implementierung; `src/components/LandingPage.tsx` ist Compatibility-Bridge |
| LoginPage | `src/features/public/ui/LoginPage.tsx` | kanonische `/login`-Fläche |
| AssetLogo | `src/components/AssetLogo.tsx` | Shared nur nach Fachneutralitäts-/Dependency-Prüfung |
| Datenschutz | `src/components/Datenschutz.tsx` über Public-Fassade | `src/features/public/ui` physisch später konsolidieren |
| ImpressumAgb | `src/components/ImpressumAgb.tsx` über Public-Fassade | `src/features/public/ui` physisch später konsolidieren |
| PdfExportModal | `src/components/PdfExportModal.tsx` | `src/features/reporting/ui` |
| PriceAlert | `src/components/PriceAlert.tsx` | Screening/Portfolio nach Dependency-Audit |
| SocialAccountManager | `src/components/SocialAccountManager.tsx` | `src/features/social/ui` |
| SocialDirectPublisherModal | `src/components/SocialDirectPublisherModal.tsx` | `src/features/social/ui` |
| ErrorBoundary | `src/components/ErrorBoundary.tsx` | `src/app` oder `src/shared` nach Verantwortungsprüfung |

---

## Design-Tokens / Patterns

| Token / Pattern | Kanonische Quelle | Bemerkung |
|---|---|---|
| Canvas / Surface / Border | `docs/frontend/design-tokens.json` → `src/index.css` | `#08080C` / `#121215` / `#252529` |
| `brand-primary` / Gold | `docs/frontend/design-tokens.json` | Premium / Primär / Fokus; neue Landingpage nutzt semantische Rolle |
| `brand-accent` / Purple | `docs/frontend/design-tokens.json` | AI / Intelligence / Research |
| `brand-cyan` | `docs/frontend/design-tokens.json` | compatibility-only; neue/migrierte UI soll passende semantische Rolle verwenden |
| `asset-*`, `score-*`, `factor-*`, `status-*` | `docs/frontend/design-tokens.json` | semantische Visual-Rollen; lokale Branding-Hexwerte vermeiden |
| historische `aif-*`-Namen | Compatibility-Aliase | deprecated; keine neue Verwendung in der Public-Landing-Recovery |
| Brandmark geometry | `docs/frontend/brandmark.json` | Branding Manifest v6.2; `CapitalAiLogo` projiziert Geometrie |
| Presentation-/Dependency-Regeln | `docs/frontend/FRONTEND_ARCH.md` | normative Frontend-Authority |
| Focus Outline | `docs/frontend/design-tokens.json` → `src/index.css` | Gold, 2px, Offset 4px |
| Fonts | Inter, Poppins, JetBrains Mono | `display` / `sans` / `mono` gemäß Branding-Contract |
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
7. Application-Composition-Logik darf nicht in die Root-Compatibility-Fassade `src/App.tsx` zurückwandern.
8. Presentation-Authority-Labels dürfen Backend-/Platform-Authority nur projizieren und niemals neu definieren oder hochstufen.
9. Public-Presentation-Modi dürfen bestehende authentifizierte Sub-Surfaces ausblenden, aber keine serverseitige IAM-/Entitlement-Entscheidung umdeuten oder umgehen.
10. Eine neue Public-Fassade darf nur eine schmale Consumer-Grenze sein und keine parallele fachliche Implementierung etablieren.

---

*Erstellt am 16.08.2026. Am 20.08.2026 auf die `app/features/shared`-Architektur und BB-1 ausgerichtet. Am 23.08.2026 RankingBoard/CV-0 ergänzt. Am 07.09.2026 gegen `main@e7715f542db65e40cca6d39a6dacb0f30ef08b51` und den Public-Enterprise-Scorer-Recovery-Branch re-korreliert: LandingPage, schmale Public-Crypto-Fassade, PublicCryptoScoringPreview, Presentation-Context, aktuelle Crypto-Scorer-Namenskonvention und Auth-Boundary sind nun explizit inventarisiert.*