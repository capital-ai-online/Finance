# ⊞ CAPITAL-AI — Enterprise Financial AI & Quantitative Intelligence Platform

[![Version](https://img.shields.io/badge/Version-0.5.4_Beta-00f0ff.svg?style=for-the-badge&logo=react)](https://capital-ai.online)
[![Build Status](https://img.shields.io/badge/Build-Passing-10b981.svg?style=for-the-badge)](#)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-68a063.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Proprietary-gold.svg?style=for-the-badge)](#)

> **CAPITAL-AI** ist eine hochmoderne, dezentrale Finanz- und KI-Analyseplattform für professionelle Investoren, Asset Manager und quantitative Analysten. Die Anwendung kombiniert neuronale KI-Agenten, quantitative Backtesting-Engines, Graham-Value-Analysen, Echtzeit-Sentiment-Dashboards und BaFin/DSGVO-konforme Enterprise-Reportings.

---

## 💎 Hauptmerkmale & Key Features

* 🧠 **Dezentrale Multi-Agenten-Architektur**: Autonome Spezial-Agenten (*Classification*, *Fundamentals*, *Risk*, *Valuation*, *Purger/Janitor*) gesteuert über einen zentralen Master Supervisor.
* 📈 **Enterprise Asset Screener**: Multi-Asset Analysen (Krypto, Aktien, Indizes, Rohstoffe) inklusive Benjamin Graham Fair Value Checks, DCF-Rechner & Pattern Recognition.
* 📰 **Realtime AI Newsfeed & Sentiment Cockpit**: Live-Marktsentiment-Aggregation, KI-Schock-Simulationen & Echtzeit-Impakt-Scores.
* 📊 **Quantitative Backtesting & Monte-Carlo Engine**: Performancetests, Volatilitätsmodelle und Stresstests für Portfolios.
* 🛡️ **BaFin & DSGVO Compliance Engine**: Offizielle Audit-Protokolle, DSGVO-konforme Datenverarbeitung und professioneller PDF/CSV-Export.
* 🔐 **Role-Based Access & Owner Privileges**: Supabase Auth-Integration mit strikter Owner-Restriktion für Steuerungs- und Aktivierungsdesks.
* 💳 **Monetarisierungs- & Stripe-Protokoll**: Dynamische Abo-Stufen (*Starter*, *Pro*, *Enterprise*) mit vorbereiteten Checkout-Sessions.

---

## 🏗️ Systemarchitektur

```
                                  ┌─────────────────────────────┐
                                  │      CAPITAL-AI Client      │
                                  │   (React + Tailwind + TS)   │
                                  └──────────────┬──────────────┘
                                                 │ REST / SSE
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │     Express Node.js Core    │
                                  │     (0.0.0.0:3000 Server)   │
                                  └──────────────┬──────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          ▼                                      ▼                                      ▼
┌──────────────────┐                   ┌──────────────────┐                   ┌──────────────────┐
│  Multi-Agenten   │                   │    Supabase      │                   │   Stripe & API   │
│   Orchestrator   │                   │  Auth & Storage  │                   │  Gateway & PDF   │
└─────────┬────────┘                   └──────────────────┘                   └──────────────────┘
          │
          ▼
┌──────────────────┐
│ Google Gemini    │
│ Multi-Model AI   │
└──────────────────┘
```

---

## 🛠️ Technologiestack

* **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons, Recharts, D3.js.
* **Backend**: Node.js (>=22.0.0), Express 4, Esbuild (CJS Production Bundling), TSX.
* **AI & Machine Learning**: Serverseitiges Google Gemini SDK (`@google/genai`).
* **Datenbank & Auth**: Supabase Client SDK (`@supabase/supabase-js`).
* **Payments & Billing**: Stripe Node SDK & Client SDK (`stripe`, `@stripe/stripe-js`).
* **Export & Document Hygiene**: jsPDF, Document Hygiene Engine, Version Manager.

---

## 🚀 Quick Start & Installation

### Voraussetzungen
* Node.js `>= 22.0.0`
* npm `>= 10.0.0`

### 1. Repository klonen & Abhängigkeiten installieren
```bash
git clone https://github.com/capital-ai/capital-ai-platform.git
cd capital-ai-platform
npm install
```

### 2. Umgebungsvariablen konfigurieren
Erstelle eine `.env` Datei im Root-Verzeichnis basierend auf `.env.example`:
```env
# Server Secrets (Niemals im Client exponieren)
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Supabase Auth & Storage
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Public Application Settings
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 3. Entwicklungs-Server starten
```bash
npm run dev
```
Die Anwendung ist im Browser unter `http://localhost:3000` erreichbar.

---

## 📦 Build & Produktion Deployment

Der Produktions-Build kompiliert den Express-Backend-Server mit `esbuild` in ein einzelnes CommonJS-Bundle (`dist/server.cjs`) und baut die statischen Frontend-Assets mit `vite build`:

```bash
# Production Build ausführen
npm run build

# Anwendung im Produktionsmodus starten
npm run start
```

---

## 📜 Skripte in `package.json`

| Befehl | Beschreibung |
| :--- | :--- |
| `npm run dev` | Startet den Entwicklungs-Server über `tsx server.ts` auf Port 3000 |
| `npm run build` | Kompiliert das Frontend (`vite build`) & bündelt das Backend (`esbuild server.ts`) |
| `npm run start` | Startet den produktionsreifen Node.js Server (`node dist/server.cjs`) |
| `npm run lint` | Führt die TypeScript-Typenprüfung aus (`tsc --noEmit`) |
| `npm run clean` | Entfernt Build-Artefakte (`dist/`) |

---

## 🔒 Datenintegrität & Security Policy

* **Zero Mock Data Directive**: Keine gefälschten oder simulierten Daten. Alle finanzmathematischen Berechnungen und KI-Insights basieren auf echten Datenströmen.
* **Server-Side API Proxying**: Sensible Schlüssel (Gemini, Stripe Secret) verbleiben strikt serverseitig.
* **GDPR & MiFID II Compliance**: Anonymisierte Datenverarbeitung, Audit-Logs und strikte Einhaltung europäischer Richtlinien.
* **Owner-Only Restrictions**: Systemkritische Kontrollräume (Agenten-Steuerung, Störungsdesk) sind für autorisierte Owner-Accounts reserviert.

---

## 👤 Governance & Inhaber

* **Gründer & Inhaber**: Sven Kulessa
* **Kontakt**: [sven.kulessa@capital-ai.online](mailto:sven.kulessa@capital-ai.online)
* **Plattform-Version**: `0.5.4 (Beta-Phase)` / Specification `v0.6.0`
