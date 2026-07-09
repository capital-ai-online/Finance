# Changelog - CAPITAL-AI Plattform

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

---

## [0.6.0-Beta] - 2026-07-04

### Added
- **Kraken Pro Empfehlungs-Partner-Link**: Integration eines exklusiven Kraken Pro Partner-Bonus-Kartenmoduls unter dem Haftungsausschluss im Dashboard-Footer sowie im Impressum. Ermöglicht schnelle Empfehlungsanmeldungen (Code: `yc4ggk3f`) mit Prämienteilung.
- **Real-Time Push-Up Benachrichtigungen**: Aktivierung von interaktiven Push-Up-Meldungen für den Newsfeed und das persönliche Radar (Watchlist). Nachrichten, die zu einem neu berechneten Asset-Scoring von unter 3.0 (kritisch/bearish) oder über 7.0 (Breakout/bullish) führen, lösen sofort eine akustische Chime-Meldung (Web Audio API Synthesizer) und ein visuelles Pop-up aus.
- **Interaktives Watchlist-Modul (Persönliches Radar)**: Integration eines personalisierten Radars zur Überwachung beliebter Werte. Ermöglicht Echtzeit-Kursabfragen, Score-Anzeigen und beinhaltet Schnelltest-Simulatoren (▲ RLY / ▼ CRH) zur Verifizierung von Push-Up-Benachrichtigungen.

### Changed
- **Entfernung der "Modul 1" Bezeichnung**: Vollständige Bereinigung der Applikationsseiten, Dokumente, Slogans, Logos und Code-Kommentare von der veralteten Bezeichnung "Modul 1" bzw. "Module 1". Die primäre Systemkennzeichnung wurde stattdessen einheitlich auf "CORE" bzw. anwendungsspezifische Fachbezeichnungen (z. B. "Rohstoff-Analyse") überführt.
- **Kontakt E-Mail Korrektur & Globale Erreichbarkeit**: Aktualisierung aller Support-Kanäle auf die offizielle E-Mail-Adresse `support@capital-ai.online`. Zur Erhöhung der Sichtbarkeit wurde diese global im Header (Sticky Top-Navigation), im Retractable Sidebar-Drawer (Kategorie "Compliance & Support") sowie im Footer der Seite fest verankert.
- **Direktkontakt im Impressum**: Anpassung der Impressum-Kontaktdetails zur Ausweisung von `sven.kulessa@capital-ai.online` als geschäftlicher Direktkontakt für administrative Anfragen.
- **Unified Production Milestone Elevation (v0.6.0)**: Upgraded all system-wide version tags and configuration indicators (including `metadata.json`, `ComplianceExporter`, `AuditLogs`, `ProfilePage`, `DashboardSearchFilter`, `SentimentDashboard`, and `AssetUniverseDashboard`) from v0.5.4 to v0.6.0-Beta.
- **Orchestrator and Scoring Alignment**: Harmonized specialized scoring engines across both Express API endpoints and interactive client dashboards, ensuring fully deterministic evaluation parity.
- **Database Resilience & Cache Layering**: Implemented a local file-system/in-memory backup storage state that automatically catches and resolves connectivity exceptions, guaranteeing seamless operation for administrator accounts.

## [0.5.4-Beta] - 2026-07-03

### Changed
- **Sicherheits- & Rollenbereinigung (Gast-Modus & Global Admin)**:
  - **Entfernung Gast-Modus**: Der Gast-Modus wurde vollständig aus der Benutzeroberfläche (LandingPage & Dashboard) entfernt. Es gibt keine sichtbaren Links, Knöpfe oder Verknüpfungen mehr.
  - **Programmweiter Schreibschutz**: Der Gast-Modus wurde programmweit über einen Secret Key (`CAPITAL_AI_SECRET_KEY_2026`) gesichert und schreibgeschützt. Unbefugte Versuche, eine Gastsitzung zu initialisieren, werden mit einer Sicherheitswarnung blockiert.
  - **Zuweisung Global Administrator**: Die Administratorenrechte wurden exklusiv auf die E-Mail-Adressen `sven.kulessa@gmail.com` und `sven.kulessa@gmx.net` beschränkt. Jegliche Gast-Bypässe für das Administrations-Panel wurden entfernt.

## [0.5.4-Beta] - 2026-07-02

### Added
- **Modul 1: Rohstoff-Kategorisierung & AI-Scoring**:
  - Full-stack integration of multi-agent orchestration for physische and kritische Rohstoffe.
  - Implementation of **ClassificationAgent** to determine main class, subclass, market type, and valuation modes.
  - Implementation of **FundamentalsAgent** for geological and reserve evaluation (ore grade, tonnage, recycling).
  - Implementation of **RiskAgent** to map country bottlenecks, supply chain friction, ESG factors, and producer concentration.
  - Implementation of **ValuationAgent** to analyze industrial and military/defense importance.
  - **Master Orchestrator (`RawMaterialsOrchestrator`)**: Coordinates parallel execution of agents and routes data.
- **Centralized Scoring Engine (`RawMaterialsScoringService`)**:
  - Single Source of Truth for formula-based weighted scoring calculations.
  - Version-controlled configs (`v1.0-standard` and `v1.2-critical-focused`).
  - Handling of missing fields through dynamic penalty calculations on confidence and data quality ratings.
- **Interactive UI Panel (`RawMaterialsDashboard`)**:
  - Glassmorphic bento-grid dashboard in dark-mode style.
  - Dynamic autocomplete search bar with automatic rating score output on select.
  - Interactive "Tuning Sandbox" allowing real-time "What-If" parameter adjustments and manual score recalculation.
  - Fully traceable terminal-like logs showcasing agent step-by-step reasoning.
- **Backend API Routes (`/api/raw-materials/*`)**:
  - `/api/raw-materials/list`: Fetches predefined commodity registries and standard scores.
  - `/api/raw-materials/analyze`: Orchestrates and queries the Gemini-3.1-pro-preview models.
  - `/api/raw-materials/score`: Instantly calculates deterministic scores on manual tuning inputs.

### Changed
- **Dashboard Sidebar**: Integrated the "Rohstoff-Bewertung" nav option under the Analysetools accordion.
- **Server Entrypoint**: Mounted the new modular router on the main Express server with secure lazy-loading of GoogleGenAI SDK.
- **Type safety definitions**: Consolidated `src/types/rawMaterials.ts` and schema boundaries in `src/schemas/rawMaterialsValidation.ts`.

---

*End of Changelog. Version pinned to 0.6.0 Beta.*
