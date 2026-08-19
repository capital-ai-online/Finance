# CAPITAL-AI — Financial Intelligence & Multi-Asset Analytics

[![Version](https://img.shields.io/badge/Version-0.6.0_Beta-00f0ff.svg?style=for-the-badge)](https://capital-ai.online)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24.18_%3C25-68a063.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Proprietary-gold.svg?style=for-the-badge)](#lizenz)

> CAPITAL-AI ist eine webbasierte FinTech-Plattform für Multi-Asset-Screening, quantitative Analysen, erklärbare Scorings und kontrollierte AI-gestützte Auswertungen. Version 0.6.0 befindet sich in der Beta-Phase und ist kein Ersatz für Anlage-, Rechts- oder Steuerberatung.

## Produktumfang

- Multi-Asset-Screening für Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe
- fundamentale Bewertungsverfahren einschließlich Graham- und DCF-Analysen
- quantitative Scorings, Backtesting, Monte-Carlo- und Stressszenarien
- Markt-, Nachrichten- und Sentiment-Auswertungen
- PDF- und CSV-Exporte für Analyse- und Compliance-Artefakte
- abonnementbasierte Funktionsstufen über Stripe
- Authentifizierung und Datenhaltung über Supabase
- providerneutrale AI-Orchestrierung mit OpenAI- und Anthropic-Anbindung
- nachvollziehbare Datenherkunft, Scoring-Lineage und Audit-Evidence

## Architektur

```mermaid
flowchart TD
    UI["React 19 Client"] --> API["Express Application"]
    API --> ORCH["Services & Orchestrator"]
    ORCH --> DATA["Market-data providers"]
    ORCH --> AI["OpenAI / Anthropic"]
    API --> AUTH["Supabase Auth & Data"]
    API --> BILLING["Stripe Billing"]
```

Der Prozesseinstieg `server.ts` bleibt bewusst dünn. Middleware, Routen, Provider, Hintergrundprozesse, Billing-Ingress und Shutdown-Logik werden durch die modulare Server-Anwendung und ihre Laufzeitkomponenten bereitgestellt.

## Technologiestack

| Bereich | Komponenten |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Motion, Recharts, D3 |
| Backend | Node.js 24, Express 4, TSX, Esbuild |
| AI | OpenAI SDK, Anthropic SDK |
| Authentifizierung und Daten | Supabase |
| Payments | Stripe |
| Tests und Qualität | Vitest, Node Test Runner, TypeScript, Repository- und Governance-Prüfungen |
| Dokumente | jsPDF 4.2.1 für Client-Reports; WeasyPrint 69.0 für gebrandete/tagged NotebookLM-PDFs; Poppler für Render-Smoke |
| Betrieb | Docker, Render, GitHub Actions |

Google Gemini und `@google/genai` gehören nicht mehr zur aktiven Anwendungsarchitektur.

## PDF-Renderer und Branding

PDF-Ausgaben verwenden einen gemeinsamen CAPITAL-AI Brand-/Metadaten-Contract und dieselben Design-Tokens wie das Produktdesign.

- **Client-Reports:** `src/platform/PdfReporting/pdfBrand.ts` + jsPDF. Das Accessibility-Profil `client-jsPDF` setzt Sprache und Metadaten, behauptet aber bewusst keine PDF/UA-/Tagged-PDF-Konformität.
- **Documentation-as-Code / NotebookLM:** `scripts/docs/export_notebooklm_pdfs.py` + WeasyPrint 69.0. Dieser Pfad erzeugt semantisches, tagged PDF/UA-1 und wird separat über `scripts/docs/verify_pdf_render.py` geprüft.
- **Branding:** Gold `#F5C453`, Cyan `#0DDDDD`, Purple `#B026FF` und Print-Neutralfarben stammen aus `docs/frontend/design-tokens.json`.
- **Evidence-Gate:** Accessibility- oder regulatorische Konformität wird nicht allein aus Branding oder Renderer-Konfiguration abgeleitet; entsprechende Aussagen benötigen eine eigene Verifikation/Evidence.

Reproduzierbarer Documentation-PDF-Smoke:

```bash
pip install -r scripts/docs/requirements-notebooklm-pdf.txt
python3 scripts/docs/export_notebooklm_pdfs.py --smoke --out-dir /tmp/capital-ai-pdf-smoke
python3 scripts/docs/verify_pdf_render.py \
  /tmp/capital-ai-pdf-smoke/CAPITAL_AI_NotebookLM_PDF_UA_Smoke.pdf \
  --expect-tagged yes
```

<!-- README_VERSION_MATRIX:START -->
### Automatisch synchronisierte Runtime-Versionen

> Dieser Block wird deterministisch aus den kanonischen Repository-Deklarationen erzeugt. Änderungen bitte nicht manuell pflegen; `npm run readme:sync` aktualisiert ihn und `npm run readme:check` blockiert Drift.

| Komponente | Repository-Version | Authority |
|---|---:|---|
| CAPITAL-AI Plattform | `0.6.0` | `package.json#version` |
| Node.js Runtime | `24.18.0` | `.nvmrc` |
| Node.js Engine | `>=24.18.0 <25` | `package.json#engines.node` |
| TypeScript | `~5.8.2` | `package.json#devDependencies` |
| React | `^19.0.1` | `package.json#dependencies` |
| Vite | `^6.2.3` | `package.json` |
| Tailwind CSS | `^4.1.14` | `package.json#devDependencies` |
| OpenAI SDK | `^7.3.0` | `package.json#dependencies` |
| Anthropic SDK | `^0.115.0` | `package.json#dependencies` |
| Supabase JS | `^2.108.2` | `package.json#dependencies` |
| Stripe Server SDK | `^22.3.0` | `package.json#dependencies` |
| Stripe Browser SDK | `^9.8.0` | `package.json#dependencies` |
| Express | `^4.21.2` | `package.json#dependencies` |
| Vitest | `^4.1.10` | `package.json#devDependencies` |
<!-- README_VERSION_MATRIX:END -->

## Voraussetzungen

- Node.js `>=24.18.0 <25`
- npm in einer mit Node.js 24 kompatiblen Version
- Zugriff auf die erforderlichen Entwicklungsvariablen gemäß `.env.example`
- optional für Documentation-PDFs: Python `>=3.10`, die gepinnten Abhängigkeiten aus `scripts/docs/requirements-notebooklm-pdf.txt` und Poppler-CLI-Tools für Render-Verifikation

Produktive Zugangsdaten gehören ausschließlich in die dafür vorgesehenen Secret Stores. Sie dürfen weder in die README noch in Commits, Logs, Client-Bundles oder Pull-Request-Beschreibungen aufgenommen werden.

## Lokale Entwicklung

```bash
git clone https://github.com/SvenKulessa/Finance.git
cd Finance
npm ci
npm run dev
```

Die Anwendung ist lokal standardmäßig unter `http://localhost:3000` erreichbar.

## Prüfung und Build

```bash
npm run lint
npm run readme:check
npm run docs:hygiene:check
npm test
npm run build
npm run predeploy:check
```

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver über `tsx server.ts` starten |
| `npm run lint` | TypeScript-Prüfung ohne Ausgabe von Build-Dateien |
| `npm run readme:sync` | README-Versionen und Runtime-Matrix deterministisch aus Repository-Authorities synchronisieren |
| `npm run readme:check` | Versions- und Dependency-Drift in der README fail-closed erkennen |
| `npm run docs:hygiene:check` | Root-Policy, Document Registry, Lifecycle-/Sprachwerte und Registry-Zielpfade fail-closed validieren |
| `npm test` | Vitest- und PR-Governance-Tests einschließlich PDF-Brand-/Renderer-Guards ausführen |
| `npm run build` | Sicherheitsinvarianten prüfen, Frontend bauen, öffentliche Routen vor-rendern, Server bündeln und Release-Manifest erzeugen |
| `npm run predeploy:check` | Deployment-Bereitschaft und Supply-Chain-Provenance prüfen |
| `npm run repository:validate` | Repository-Konventionen validieren |
| `npm run traceability:build` | Traceability-Artefakte erzeugen |
| `npm run rag:build-index` | internen RAG-Index aufbauen |

Produktionsstart nach erfolgreichem Build:

```bash
npm start
```

## Sicherheit und Datenintegrität

CAPITAL-AI verwendet mehrere technische und organisatorische Kontrollschichten:

- serverseitige Verarbeitung vertraulicher Provider- und Billing-Zugangsdaten
- Supabase-basierte Authentifizierung mit MFA-Onboarding und Login-Step-up
- ID-basierte Zuordnung von Benutzer- und Abonnementdaten
- Owner-Gates für geschützte Steuerungs- und Mutationspfade
- feldbezogene Finanzdaten-Provenance mit Provider, Abrufzeitpunkt und Evidence-ID
- versionierte Feature- und Scoring-Lineage
- fail-closed Governance- und Workflow-Prüfungen
- Supply-Chain-Provenance und Release-Manifeste
- Human-/Owner-Review vor geschützten Repository-Mutationen

Diese Kontrollen unterstützen Datenschutz, Nachvollziehbarkeit und regulatorische Governance. Aussagen über DSGVO-, MiFID-II-, BaFin-, BFSG-, PDF/UA- oder AI-Act-Konformität setzen jedoch eine jeweils aktuelle fachliche/technische und gegebenenfalls rechtliche Prüfung sowie belastbare Produktions-Evidence voraus.

## Entwicklungs- und Änderungsprozess

- Änderungen erfolgen auf einem eigenen Branch und über einen Pull Request.
- Pull Requests verwenden die deutsche CAPITAL-AI-Vorlage.
- Sicherheits-, Datenintegritäts- und Produktionsmutationen benötigen eine dokumentierte Risiko-, Rollback- und Owner-Prüfung.
- AI-Agenten dürfen Mutationen vorbereiten oder anfragen, aber geschützte Mutationen nicht selbst freigeben.
- Änderungen an Stripe, Supabase oder Render werden als gesonderte Produktionsaktionen behandelt.
- Nach erfolgreichem Merge wird der zugehörige Remote-Branch gelöscht.
- Architekturentscheidungen und Systemverträge werden über ADR-, ESS-, Evidence- und Traceability-Dokumente nachvollziehbar gehalten.

## Wichtige Hinweise

- Die Plattform befindet sich in aktiver Entwicklung.
- Analyse- und Scoring-Ergebnisse können unvollständig, verzögert oder fehlerhaft sein.
- Externe Daten- und AI-Provider können zeitweise nicht verfügbar sein.
- Finanzielle Entscheidungen dürfen nicht ausschließlich auf automatisierten Ergebnissen der Plattform beruhen.
- Mock- und Testdaten sind ausschließlich in klar abgegrenzten Testkontexten zulässig und dürfen nicht als produktive Marktdaten erscheinen.

## Governance und Inhaber

- Inhaber: Sven Kulessa
- Kontakt: [sven.kulessa@capital-ai.online](mailto:sven.kulessa@capital-ai.online)
- Plattformversion: `0.6.0 Beta`
- Repository: privat
- Lizenz: proprietär

## Lizenz

Dieses Repository und seine Inhalte sind proprietär. Nutzung, Vervielfältigung, Weitergabe oder Veränderung richten sich nach den vom Inhaber ausdrücklich eingeräumten Rechten.
