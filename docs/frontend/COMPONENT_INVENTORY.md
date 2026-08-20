# CAPITAL-AI Frontend – Component Inventory

**Stand:** 20. August 2026  
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

## Kanonische Shared-Primitives

| Komponente | Kanonischer Pfad | Legacy-/Compatibility-Pfad | Status |
|---|---|---|---|
| StatusBadge | `src/shared/ui/StatusBadge.tsx` | `src/components/StatusBadge.tsx` | migriert; Legacy-Pfad ist Compatibility-Export |
| CapitalAiLogo | `src/shared/branding/CapitalAiLogo.tsx` | `src/components/CapitalAiLogo.tsx` | migriert; Legacy-Pfad ist Compatibility-Export |
| Button | `src/shared/ui/Button.tsx` | N/A | kanonisch |
| Card | `src/shared/ui/Card.tsx` | N/A | kanonisch |
| Input | `src/shared/ui/Input.tsx` | N/A | kanonisch |
| Modal | `src/shared/ui/Modal.tsx` | N/A | kanonisch |
| Tooltip | `src/shared/ui/Tooltip.tsx` | N/A | kanonisch |
| Skeleton | `src/shared/ui/Skeleton.tsx` | N/A | kanonisch |
| EmptyState | `src/shared/ui/EmptyState.tsx` | N/A | kanonisch |
| NeuralBackground | `src/shared/visuals/NeuralBackground.tsx` | N/A | kanonisch |

---

## Kern-Dashboard & Cockpit — derzeitige Legacy-Implementierungen

| Komponente | Datei unter `src/components/` | Ziel-/Ownership-Slice |
|---|---|---|
| Dashboard | `Dashboard.tsx` | `src/app` / Dashboard-Composition, schrittweise zu zerlegen |
| AssetUniverseDashboard | `AssetUniverseDashboard.tsx` | `src/features/screening/ui` |
| UniverseBestWorst | `UniverseBestWorst.tsx` | `src/features/screening/ui` |
| Screener | `Screener.tsx` | `src/features/screening/ui` |
| MarketScreener | `MarketScreener.tsx` | `src/features/screening/ui` |
| Watchlist | `Watchlist.tsx` | `src/features/portfolio/ui` |
| FavoriteAssetPatternSlots | `FavoriteAssetPatternSlots.tsx` | `src/features/portfolio/ui` |

---

## Scoring & Analyse — derzeitige Legacy-Implementierungen

| Komponente | Datei unter `src/components/` | Ziel-/Ownership-Slice |
|---|---|---|
| CryptoScoringEnterprise | `CryptoScoringEnterprise.tsx` | `src/features/crypto/ui` |
| BuffetValueCheck | `BuffetValueCheck.tsx` | `src/features/stocks/ui`; stock-only Research-/Presentation-Consumer gemäß zuständigen Parent-Authorities |
| BacktestEngine | `BacktestEngine.tsx` | `src/features/portfolio/ui` |
| PortfolioBacktester | `PortfolioBacktester.tsx` | `src/features/portfolio/ui` |
| PortfolioPerformance | `PortfolioPerformance.tsx` | `src/features/portfolio/ui` |
| MonteCarloDetailed | `MonteCarloDetailed.tsx` | `src/features/portfolio/ui` |
| RealTimeRiskAssessment | `RealTimeRiskAssessment.tsx` | `src/features/analytics/ui` |
| EnterpriseAnalysisPanels | `EnterpriseAnalysisPanels.tsx` | `src/features/analytics/ui` |
| EnterpriseBinanceQuickAnalysis | `EnterpriseBinanceQuickAnalysis.tsx` | `src/features/crypto/ui` |
| LandingBinanceQuickAnalysis | `LandingBinanceQuickAnalysis.tsx` | `src/features/crypto/ui` / Public-Consumer zu prüfen |
| HeatmapCreator | `HeatmapCreator.tsx` | `src/features/analytics/ui` |
| QuantumGraph | `QuantumGraph.tsx` | `src/features/analytics/ui` |
| Charts | `Charts.tsx` | `src/features/analytics/ui`; generische Chart-Primitives später auf `src/shared` prüfen |
| PerformanceDashboard | `PerformanceDashboard.tsx` | `src/features/analytics/ui` |
| RawMaterialsDashboard | `RawMaterialsDashboard.tsx` | `src/features/screening/ui` bzw. Domain-Slice nach Dependency-Audit |
| DeFiOrchestration | `DeFiOrchestration.tsx` | `src/features/crypto/ui` |

### Fachliche Authority-Referenz

Dieses Inventory definiert **keine** eigene Financial-Data-Consumer-Sequenz. Für Asset Catalog ↔ Market Evidence, Entitlement, Provider-/Evidence-Provenance, Verified Display und Canonical Scoring gelten ausschließlich die jeweils aktuellen Parent-Authorities:

- `ADR-0032` — Asset Catalog ↔ Market Evidence,
- `ADR-0034` — Buffett Access / Quota,
- `ADR-0041` + `ESS-0016` — Provider Data Plane / Provenance / Freshness,
- `SC-MD-SPT-0001` — kanonische Screening-/Scoring-/Market-Data-Wertschöpfungskette,
- `ADR-0087` — Canonical Scoring.

Die physische Migration einer Komponente darf diese Contracts nicht verändern.

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
| `--color-background` / `#18181b` | `src/index.css` | Canvas |
| `--color-aif-gold-*` | `src/index.css` | Premium-Highlight |
| `--color-aif-neon-cyan` / `neon-purple` | `src/index.css` | Neural / Accent |
| Presentation-/Dependency-Regeln | `docs/frontend/FRONTEND_ARCH.md` | normative Frontend-Authority |
| Focus Outline | `src/index.css` | `*:focus-visible` gold |
| Fonts | Poppins, Montserrat, JetBrains Mono | `--font-sans` / `display` / `mono` |
| StatusBadge tones | `src/shared/ui/StatusBadge.tsx` | kanonische Shared-Implementierung |

---

## Regeln zur Pflege dieses Inventars

1. **Keine neue UI-Komponente wird aufgrund dieses Inventars unter `src/components/` angelegt.** Zielpfade bestimmt ausschließlich `FRONTEND_ARCH.md`.
2. Neue fachliche UI gehört grundsätzlich in `src/features/<domain>/ui`; Application Composition in `src/app`; fachneutrale wiederverwendbare Basisbausteine in `src/shared`.
3. `src/components/` ist ausschließlich Legacy-/Compatibility-Zone während der Strangler-Migration.
4. Dieses Inventory dokumentiert nach jeder Migrationswelle den realen physischen Pfad, Ziel-/Ownership-Slice und Compatibility-Status.
5. Fachliche Runtime-/Data-/Scoring-Regeln werden nur referenziert und nicht hier erneut normiert.
6. Ein Legacy-Eintrag darf erst entfernt werden, wenn keine produktive Implementierung bzw. kein erforderlicher Compatibility-Export mehr vorhanden ist.

---

*Erstellt am 16.08.2026 im Rahmen der Frontend-Roadmap. Am 20.08.2026 auf die `app/features/shared`-Architektur und das Projection-not-Redefinition-Prinzip ausgerichtet.*
