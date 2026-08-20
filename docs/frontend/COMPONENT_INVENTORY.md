# CAPITAL-AI Frontend – Component Inventory

**Stand:** 20. August 2026  
**Quelle:** `src/components/` (Finance-Repo)  
**Namenskonvention:** PascalCase, Dateiname = Komponentenname

Dieses Inventory listet die aktuellen UI-/Feature-Komponenten und dient als Grundlage für die Frontend-Roadmap. ADR-0097 ergänzt die verbindliche Datenvertragsgrenze für finanzielle Anzeige-Consumer.

---

## Design-Primitives (Phase 0+)

| Komponente | Datei | Kurzbeschreibung |
|------------|-------|------------------|
| StatusBadge | `StatusBadge.tsx` | Kanonischer Status-Badge (READY / REJECT / DATA_UNAVAILABLE / LOADING / …) mit Icon + Text, WCAG-konform |

---

## Kern-Dashboard & Cockpit

| Komponente | Datei | Kurzbeschreibung |
|------------|-------|------------------|
| Dashboard | `Dashboard.tsx` | Haupt-Dashboard (Multi-Asset, Scores, Live-Intelligence) |
| AssetUniverseDashboard | `AssetUniverseDashboard.tsx` | Enterprise-Universum-Übersicht |
| UniverseBestWorst | `UniverseBestWorst.tsx` | Best/Worst-Ranking im Universum |
| Screener | `Screener.tsx` | Quantitativer Multi-Asset-Screener |
| MarketScreener | `MarketScreener.tsx` | Markt-Screener-Variante |
| Watchlist | `Watchlist.tsx` | Persönliche Watchlist |
| FavoriteAssetPatternSlots | `FavoriteAssetPatternSlots.tsx` | Favoriten-/Pattern-Slots |

---

## Scoring & Analyse

| Komponente | Datei | Kurzbeschreibung |
|------------|-------|------------------|
| CryptoScoringEnterprise | `CryptoScoringEnterprise.tsx` | Enterprise-Crypto-Scoring (nutzt StatusBadge) |
| BuffetValueCheck | `BuffetValueCheck.tsx` | **Stock-only** Graham/Buffett-/DCF-Bewertung; Such-/Auswahlliste enthält ausschließlich Aktien und lädt Marktpreis/Fundamentals progressiv über `verified-asset-display/1.0.0`. Keine Bootstrap-/synthetischen EPS-/Score-Fallbacks. |
| BacktestEngine | `BacktestEngine.tsx` | Backtesting-Engine |
| PortfolioBacktester | `PortfolioBacktester.tsx` | Portfolio-Backtester |
| PortfolioPerformance | `PortfolioPerformance.tsx` | Portfolio-Performance |
| MonteCarloDetailed | `MonteCarloDetailed.tsx` | Monte-Carlo-Detailansicht |
| RealTimeRiskAssessment | `RealTimeRiskAssessment.tsx` | Echtzeit-Risiko |
| EnterpriseAnalysisPanels | `EnterpriseAnalysisPanels.tsx` | Enterprise-Analyse-Panels |
| EnterpriseBinanceQuickAnalysis | `EnterpriseBinanceQuickAnalysis.tsx` | Schnellanalyse Binance |
| LandingBinanceQuickAnalysis | `LandingBinanceQuickAnalysis.tsx` | Landing-Schnellanalyse |
| HeatmapCreator | `HeatmapCreator.tsx` | Heatmap-Erstellung |
| QuantumGraph | `QuantumGraph.tsx` | Graph-Visualisierung |
| Charts | `Charts.tsx` | Chart-Komponenten (Recharts/D3) |
| PerformanceDashboard | `PerformanceDashboard.tsx` | Performance-Übersicht |
| RawMaterialsDashboard | `RawMaterialsDashboard.tsx` | Rohstoff-Dashboard |
| DeFiOrchestration | `DeFiOrchestration.tsx` | DeFi-Orchestrierung |

### Financial-data consumer rule (ADR-0097)

- `/api/registry/assets` wird im Frontend als Katalog-/Metadata-Quelle behandelt.
- Markt-/Fundamentalwerte werden über verifizierte Evidence-/Quote-/Display-Verträge nachgeladen.
- Ein fachlich spezialisierter Consumer darf seine Assetklassen enger begrenzen als der globale Multi-Asset-Katalog; `BuffetValueCheck` ist deshalb ausschließlich für `stock` sichtbar/auswählbar.
- Fehlende Evidence darf nicht in `0`, Default-Scores oder still bestandene Finanzkriterien umgewandelt werden.

---

## Sentiment, News & AI

| Komponente | Datei | Kurzbeschreibung |
|------------|-------|------------------|
| SentimentDashboard | `SentimentDashboard.tsx` | Sentiment-Dashboard |
| MarketSentiment | `MarketSentiment.tsx` | Markt-Sentiment |
| RealtimeAiNewsfeed | `RealtimeAiNewsfeed.tsx` | AI-Newsfeed |
| Newsticker | `Newsticker.tsx` | Newsticker; Katalogauswahl plus verifizierte Score-/Quote-Evidence |
| MarkdownOrchestrator | `MarkdownOrchestrator.tsx` | Markdown-/Dokumentations-Orchestrierung |
| OrchestratorPanel | `OrchestratorPanel.tsx` | Orchestrator-Panel |
| InteractModule | `InteractModule.tsx` | Interaktionsmodul |
| ImageAnalyzer | `ImageAnalyzer.tsx` | Bildanalyse |

---

## Auth, Profile, Billing

| Komponente | Datei | Kurzbeschreibung |
|------------|-------|------------------|
| LoginStepUpGate | `LoginStepUpGate.tsx` | Step-up Login-Gate |
| StepUpModal | `StepUpModal.tsx` | Step-up Modal |
| RegistrationCompletionGate | `RegistrationCompletionGate.tsx` | Registrierungs-Abschluss |
| ProfilePage | `ProfilePage.tsx` | Profilseite |
| PasskeySettings | `PasskeySettings.tsx` | Passkey-Einstellungen |
| TotpSettings | `TotpSettings.tsx` | TOTP-Einstellungen |
| Abonnements | `Abonnements.tsx` | Abonnement-Übersicht |
| SubscriptionModal | `SubscriptionModal.tsx` | Abo-Modal |
| Checkout | `Checkout.tsx` | Checkout |
| GuestCliffhangerModal | `GuestCliffhangerModal.tsx` | Guest-Cliffhanger |

---

## Compliance, Admin, Governance

| Komponente | Datei | Kurzbeschreibung |
|------------|-------|------------------|
| ComplianceBadge | `ComplianceBadge.tsx` | Compliance-Badge |
| ComplianceConsentModal | `ComplianceConsentModal.tsx` | Consent-Modal |
| ComplianceExporter | `ComplianceExporter.tsx` | Compliance-Export; nullable/fail-closed Registry-Werte werden defensiv dargestellt |
| ComplianceNotifications | `ComplianceNotifications.tsx` | Compliance-Benachrichtigungen |
| SecurityComplianceAuditor | `SecurityComplianceAuditor.tsx` | Security/Compliance-Auditor |
| SecurityRadarBadge | `SecurityRadarBadge.tsx` | Security-Radar-Badge |
| AuditLog | `AuditLog.tsx` | Audit-Log |
| AuditLogs | `AuditLogs.tsx` | Audit-Logs-Übersicht |
| AuditLogManager | `AuditLogManager.tsx` | Audit-Log-Manager |
| AdminPanel | `AdminPanel.tsx` | Admin-Panel |
| AdminPortal | `AdminPortal.tsx` | Admin-Portal |
| SupervisorDashboard | `SupervisorDashboard.tsx` | Supervisor-Dashboard |
| DocumentHygienePanel | `DocumentHygienePanel.tsx` | Dokumenten-Hygiene |
| VersionManagerPanel | `VersionManagerPanel.tsx` | Version-Manager |
| AdrForm | `AdrForm.tsx` | ADR-Formular |
| AuthStateDebugger | `AuthStateDebugger.tsx` | Auth-State-Debugger |
| SystemLatencyMonitor | `SystemLatencyMonitor.tsx` | Latenz-Monitor |
| SeoDashboard | `SeoDashboard.tsx` | SEO-Dashboard |

---

## Landing, Legal, Branding, Utils

| Komponente | Datei | Kurzbeschreibung |
|------------|-------|------------------|
| LandingPage | `LandingPage.tsx` | Landing Page |
| CapitalAiLogo | `CapitalAiLogo.tsx` | Logo |
| AssetLogo | `AssetLogo.tsx` | Asset-Logos |
| Datenschutz | `Datenschutz.tsx` | Datenschutz |
| ImpressumAgb | `ImpressumAgb.tsx` | Impressum / AGB |
| PdfExportModal | `PdfExportModal.tsx` | PDF-Export-Modal |
| PriceAlert | `PriceAlert.tsx` | Preis-Alerts; Katalog zur Auswahl, alert-fähige verifizierte Quote separat |
| SocialAccountManager | `SocialAccountManager.tsx` | Social-Account-Verwaltung |
| SocialDirectPublisherModal | `SocialDirectPublisherModal.tsx` | Social-Publisher-Modal |
| ErrorBoundary | `ErrorBoundary.tsx` | Error Boundary |

---

## Design-Tokens / Patterns (aus `src/index.css` / Architektur)

| Token / Pattern | Quelle | Bemerkung |
|-----------------|--------|-----------|
| `--color-background` / `#18181b` | `index.css` | Canvas |
| `--color-aif-gold-*` | `index.css` | Premium-Highlight |
| `--color-aif-neon-cyan` / `neon-purple` | `index.css` | Neural / Accent |
| Glassmorphism Card | `FRONTEND_ARCH.md` | `bg-neutral-950/40 border-white/10 backdrop-blur-md` |
| Focus Outline | `index.css` | `*:focus-visible` gold |
| Fonts | Poppins, Montserrat, JetBrains Mono | `--font-sans` / `display` / `mono` |
| StatusBadge tones | `StatusBadge.tsx` | emerald / rose / amber / gold / muted |

---

## Hinweise zur Weiterentwicklung

1. Neue UI-Komponenten in `src/components/` anlegen und hier dokumentieren.
2. Wiederverwendbare Primitives (Button, Badge, Card, Gauge, Chip) schrittweise extrahieren.
3. Finanzdaten-Consumer müssen die Katalog-/Evidence-Trennung aus ADR-0097 einhalten.
4. Multi-Asset-Verfügbarkeit des globalen Katalogs verpflichtet fachlich spezialisierte Module nicht zur Unterstützung fachfremder Assetklassen.

---

*Erstellt am 16.08.2026 im Rahmen der Frontend-Roadmap; ADR-0097-Korrelation am 20.08.2026 konsolidiert.*
