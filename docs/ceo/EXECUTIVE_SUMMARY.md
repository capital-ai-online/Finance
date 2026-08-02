# 👔 Executive Summary & Strategic Vision (CEO Perspective)
**Project: CAPITAL-AI**  
**Version:** 0.6.0 (Beta-Phase)  
**Classification:** Confidential / Board Approved  

---

## 🏛️ Strategic Vision & Core Objectives
CAPITAL-AI is the underlying neural core of the platform, engineered to democratize quantitative financial modeling, stock analysis, and high-performance algorithmic simulation. By providing a zero-code, fully responsive interface powered by an intelligent model-router, the system enables immediate decision-making under strict DSGVO compliance.

### Strategic Key Milestones:
1. **Model Independence & Auto-Routing**: Elimination of single-vendor locks. The system intelligently switches between Claude (deep audits), Gemini (high-speed parallel streams), and local models (compliance filtering) to optimize cost and latency.
2. **Standardized Integrations**: Implementation of the Model Context Protocol (MCP) to guarantee plug-and-play scaling for third-party workspace, financial, and repository APIs.
3. **No-Demo-Data Mandat**: All backtests, intrinsic calculators, and scoring models leverage live historical data streams with high-fidelity fallbacks to guarantee reliability.

---

## ⚡ AIFINANCIAL v3 Enterprise Architecture

The enterprise software stack is designed for extreme scalability, data integrity, and low-latency execution:

```
┌────────────────────────────────────────────────────────┐
│                      React 19 SPA                      │
│        (Vite 6, Tailwind CSS 4, ShadCN, Recharts)      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / WebSockets
                           ▼
┌────────────────────────────────────────────────────────┐
│                     Express REST API                   │
│         (Node.js, Supabase Integration, Redis)         │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│     Supabase / Postgres     │ │   Intelligent Router   │
│ (Row-Level Security, JWT)   │ │  (Gemini, Claude, GPT) │
└─────────────────────────────┘ └────────────────────────┘
```

### Core Technology Stack:
- **Frontend Framework**: React 19 with Vite 6. Built as an Event-Driven Single Page Application (SPA) with glassmorphism aesthetics, fluid motion transitions, and strict performance metrics.
- **Styling & Components**: Tailwind CSS 4 and ShadCN UI for desktop-first precision with mobile-first responsiveness.
- **Backend API Server**: Node.js Express API server utilizing Supabase Client for persistence, with Redis background workers for high-frequency data ingestion and backtest queuing.
- **Database Layer**: Supabase PostgreSQL with strict Row-Level Security (RLS) and JWT authorization.
- **Zahlungsabwicklung**: Stripe Checkout with direct Raw-Body webhook verification to secure premium subscriptions.
- **Monitoring & Observability**: Sentry and Winston/logging pipelines for real-time error tracking and diagnostic analytics.

---

## 💳 Pricing & Subscription Model (Zentrales SaaS-Modul)

Our pricing model utilizes the unified CAPITAL-AI database representation to dynamically unlock functionality based on the authenticated user's tier.

### 1. Free Tariff (Kostenlos)
* **Limitierungen**: Max 1 Gerät, max 3 Screenings. Kontingent wird alle 5 Tage zurückgesetzt.
* **Leistungen**: Basis-Marktdaten, Intelligent Score, Pattern Recognition, Watchlist & Dashboard.
* **Einschränkungen**: Keine Backtests, keine Monte-Carlo-Simulationen. KI-Analysen und KI-Erklärungen werden nur als Vorschau (Teaser) gerendert, verknüpft mit einer Tarifs-Upgrade-Anweisung.

### 2. Starter Tariff (7 € / Monat)
* **Limitierungen**: Max 1 Gerät, max 5 Screenings pro Tag.
* **Leistungen**: Alle Free-Leistungen, unbegrenzte Backtests, eine vollständige KI-Analyse pro Tag.
* **SaaS-Logik**: Nach Verbrauch des täglichen Kontingents werden weitere KI-Analysen als Vorschau gerendert mit einem Upgrade-Link auf den Pro-Tarif.

### 3. Pro Tariff (29 € / Monat)
* **Limitierungen**: Bis zu 2 Geräte, max 20 Screenings pro Tag.
* **Leistungen**: Alle Starter-Leistungen, unbegrenzte Backtests, 1 Monte-Carlo-Simulation pro Tag, unbegrenzte vollständige KI-Analysen und -Erklärungen, erweiterte PDF-Reports, Portfolio-Analysen und priorisierte Verarbeitung.

### 4. Enterprise Tariff (109 € / Monat)
* **Limitierungen**: Bis zu 5 Geräte, unbegrenzte Screenings, unbegrenzte Monte-Carlo-Simulationen.
* **Leistungen**: Alle Pro-Leistungen, Zugriff auf alle autonomen KI-Agenten, **Warren Buffett-Style AI Engine**, vollständige Portfolio-Analysen, API-Zugang (optional) sowie dedizierte Rollen- und Rechteverwaltung.

---

## 🏢 Enterprise SaaS & Cloud-Infrastructure
We enforce standard SaaS design criteria:
- **Clean Architecture & DDD**: Clear boundary separation between frontend presentation, service layers, and data-access repositories.
- **Multi-Tenant Capability**: Secure tenant partitioning on Postgres level using secure row-level filters.
- **SLA Requirements**: Target server uptime of **99.9%** achieved through request coalescing, server-side caching (60s TTL), and robust API fallbacks.
- **NIS2 & DSGVO Compliance**: Real-time auditing of security-critical actions with anonymized logging.
