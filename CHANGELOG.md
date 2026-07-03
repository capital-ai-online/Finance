# Changelog - AIF-CORE Plattform

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

---

## [0.5.4-Beta] - 2026-07-03

### Changed
- **Sicherheits- & Rollenbereinigung (Gast-Modus & Global Admin)**:
  - **Entfernung Gast-Modus**: Der Gast-Modus wurde vollständig aus der Benutzeroberfläche (LandingPage & Dashboard) entfernt. Es gibt keine sichtbaren Links, Knöpfe oder Verknüpfungen mehr.
  - **Programmweiter Schreibschutz**: Der Gast-Modus wurde programmweit über einen Secret Key (`AIF_CORE_SECRET_KEY_2026`) gesichert und schreibgeschützt. Unbefugte Versuche, eine Gastsitzung zu initialisieren, werden mit einer Sicherheitswarnung blockiert.
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

*End of Changelog. Version pinned to 0.5.4 Beta.*
