# CAPITAL-AI Enterprise Screening & Scoring — Master-Architektur-Report

## Enterprise Report

### Document ID
ARCH-SCREEN-0001

### Version
1.0.0

### Status
Enterprise Blueprint — Phase 1 (Erfassung) abgeschlossen · Phase 2 (Erweiterung) definiert

### Scope
CAPITAL-AI Core — Repository `Finance` (Branch `main`, Scan-Stand 2026-08-01)

### Basis
Vollständiger Quellcode-Scan von `server.ts`, `server/`, `src/`, `supabase/migrations/`, `.ai/`, `docs/` (94 Markdown-Dateien gelesen). Ergänzend: `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` (ARCH-AUDIT-0002), `ENTERPRISE_PRODUCTION_AUDIT.md` (ARCH-AUDIT-0001), `GOVERNANCE_MATURITY_REPORT.md` (ARCH-GOVMAT-0001), `docs/DATENSCHUTZ_PROTOKOLL.md`.

### Arbeitsprinzip
Dieser Report folgt dem Zwei-Phasen-Modell: **Phase 1 (Abschnitt 0)** erfasst die Produktivumgebung neutral, ohne sie als verbindlich zu behandeln. **Phase 2 (Abschnitte 3–11)** definiert — abgekoppelt von der Produktivumgebung — ein erweitertes Enterprise-Screening, das jede Bestandskomponente bewusst übernimmt, erweitert, umbaut oder ersetzt. Einziger harter Vertrag: Universal Asset Interface (Abschnitt 4) und Scoring-Kontrakt (Abschnitt 6.2).

---

# TEIL A — PHASE 1: BESTANDSAUFNAHME PRODUKTIVUMGEBUNG

## 0.1 Kontext

CAPITAL-AI ist eine Node.js/Express + React/TypeScript Fintech-Plattform (`package.json`: `capital-ai`, Version `0.6.0`, Node ≥22). Backend: `server.ts` (2.084 Zeilen, Express-Entry) + `server/` (24 Dateien inkl. `iam/`, `compliance/`). Frontend: `src/` (React 19, Vite 6). Datenhaltung: Supabase (Postgres + Auth). KI: Google Gemini (`@google/genai`). Zahlungen: Stripe. Es existiert **kein einheitliches, produktionsweites Scoring-Framework** — stattdessen vier parallele, unabhängig gewachsene Scoring-Engines (Crypto Base/DeFi, Crypto „Enterprise" 9-Faktor, Meme-Coin, Rohstoffe) plus eine generische Heuristik für alle übrigen Asset-Typen.

Wichtiger, selbst-dokumentierter Befund (`docs/DATENSCHUTZ_PROTOKOLL.md` §2.1, `ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` Kap. 6): Die **Krypto-Scoring-Eingabefaktoren stammen für den Großteil des Krypto-Universums nicht aus Live-Marktdaten**, sondern werden für die ca. 300 in `src/lib/assetRegistry.ts` prozedural generierten Coins aus einem Hash des Ticker-Symbols abgeleitet (`getDeterministicVal()`, `assetRegistry.ts:168-175`). Nur ein kleines Set von ~20 real geseedeten Symbolen (BTC, ETH, SOL, DOGE, SHIB, PEPE, …) plus die 10 Rohstoffe der `RAW_MATERIALS_DATABASE` verwenden echte/CMC-CoinGecko-gestützte Werte. Seit 2026-07-31 wird dies über `scoreBasis: 'synthetic' | 'market-data' | 'heuristic'` in API-Antworten offengelegt (`src/types.ts:20-27`).

## 0.2 Verzeichnisstruktur & Package-Dateien

```
Finance/
├── server.ts                  Express-Entry, alle Kern-REST-Routen (2.084 Zeilen)
├── server/                    24 Dateien: ai.ts, db.ts, decisionEngine.ts, documentHygiene.ts,
│   ├── iam/                   authMiddleware.ts, rateLimiter.ts, secretCrypto.ts, totp.ts, types.ts
│   └── compliance/            router.ts, scanners.ts, store.ts, types.ts
├── src/
│   ├── agents/                8 KI-Agenten (Classification/Fundamentals/Risk/Valuation ×2)
│   ├── orchestrator/          cryptoOrchestrator.ts, rawMaterialsOrchestrator.ts
│   ├── services/              classification, cryptoScoring, memeCoinScoring, ranking,
│   │                          rawMaterialsScoring, realMarketSignals, scoring, valuation
│   ├── config/                weights.ts, rawMaterialsConfig.ts, ownerConfig.ts
│   ├── routes/                cryptoRoutes.ts, rawMaterialsRoutes.ts
│   ├── types/                 crypto.ts, crypto.types.ts, memeCoin.ts, rawMaterials.ts
│   ├── lib/                   assetRegistry.ts, requestOrchestrator.ts, dailyScreeningTracker.ts …
│   ├── components/            ~60 React-Komponenten (Screener, Dashboards, Auditor-UI)
│   ├── features/              billing/crypto/news/portfolio/settings/stocks/users — **nur .gitkeep**
│   └── platform/              25 „Enterprise"-Modul-Scaffolds (Governance-Layer, siehe 0.10)
├── supabase/migrations/       8 SQL-Migrationen
├── tests/unit/                9 Testdateien; alle anderen tests/*-Verzeichnisse leer
├── docs/                      ~21 Unterordner, 94 Markdown-Dateien
├── .ai/                       ESS-Skill-Layer (19 Skill-Dokumente, Registry)
└── .github/workflows/ci.yml   einzige CI-Pipeline
```

**Package-Dateien**: `package.json` (React 19, Express 4, `@google/genai`, `@supabase/supabase-js`, `stripe`, `vitest`, `d3`, `recharts`), `tsconfig.json` (`target: ES2022`, `moduleResolution: bundler`, Pfad-Alias `@/* → ./*`), `vite.config.ts`. Kein `requirements.txt`/`go.mod`/`Cargo.toml` — reines TypeScript-Projekt.

**Build-Konfigurationen**: `Dockerfile`, `render.yaml` (Render.com Auto-Deploy, `healthCheckPath: /healthz`), keine `docker-compose.yml`.

**Environment-Templates**: `.env.example` (Gemini, Stripe, Supabase, Alpha Vantage, Kraken, News API, SMTP, `METRICS_TOKEN`, `TOTP_ENCRYPTION_KEY`), `server/_.env.example`.

## 0.3 Agenten und Orchestratoren

| Agent | Pfad | Rolle | Eingaben | Ausgaben | Downstream | Entscheidungslogik |
|---|---|---|---|---|---|---|
| `ClassificationAgent` (Rohstoffe) | `src/agents/classificationAgent.ts` | Kategorisiert Rohstoff via Gemini | Materialname | `category_main/sub, market_type, valuation_mode, confidence` | `RawMaterialsOrchestrator` | Gemini `gemini-3.1-pro-preview` → Fallback `gemini-3.5-flash` → Fallback statische DB (`findRawMaterialConfig`) |
| `FundamentalsAgent` | `src/agents/fundamentalsAgent.ts` | Geologische/Reserve-Kennzahlen | Materialname | `ore_grade, tonnage, tonnage_reserve, substitution_potential, recyclability` (0-100) | Orchestrator | gleiche Zwei-Stufen-Gemini-Kette |
| `RiskAgent` (Rohstoffe) | `src/agents/riskAgent.ts` | Geopolitik/ESG-Risiko | Materialname | `geopolitical_risk, supply_chain_risk, regulatory_risk, esg_risk, producer_concentration, volatility` | Orchestrator | gleiche Kette |
| `ValuationAgent` (Rohstoffe) | `src/agents/valuationAgent.ts` | Strategische Bedeutung | Materialname | `military_importance, industrial_importance` | Orchestrator | gleiche Kette |
| `RawMaterialsOrchestrator` | `src/orchestrator/rawMaterialsOrchestrator.ts` | Master-Orchestrator Rohstoffe | Materialname | vollständiges `AnalysisPayload` | `RawMaterialsScoringService` | `Promise.all` über alle 4 Agenten, danach deterministisches Scoring als „Single Source of Truth" (Kommentar L94-95) |
| `CryptoClassificationAgent` | `src/agents/cryptoClassificationAgent.ts` | Krypto-Kategorisierung | Symbol | `category, sub_tier, market_structure, narrative_alignment, confidence` | `CryptoOrchestrator` | Gemini `gemini-2.5-flash`, keine Fallback-Modellstufe |
| `CryptoOnChainAgent` | `src/agents/cryptoOnChainAgent.ts` | „On-Chain"-Metriken | Symbol | `active_addresses_growth, transaction_velocity, whale_accumulation` (0–1) | Orchestrator | **explizit als hypothetisch dokumentiert** (Kommentar L31) — keine echte Blockchain-Anbindung |
| `CryptoSentimentAgent` | `src/agents/cryptoSentimentAgent.ts` | Sentiment-Schätzung | Symbol | `social_velocity, narrative_strength, news_momentum` (0–1) | Orchestrator | Gemini, keine externe Social-API |
| `CryptoRiskAgent` | `src/agents/cryptoRiskAgent.ts` | Manipulations-/Regulierungsrisiko | Symbol | `manipulation_index, exchange_concentration_index, regulatory_risk_index` (0–1) | Orchestrator | Gemini-Schätzung, kein statistischer Detektor |
| `CryptoOrchestrator` | `src/orchestrator/cryptoOrchestrator.ts` | Master-Orchestrator Krypto | Symbol | vollständiges `CryptoAnalysisPayload` | `scoring.service.ts`, `ranking.service.ts` | 4 Agenten parallel; Modellwahl `category_main==='DeFi' ? defi : base` (L150-152) |

**Supervisor-Logik**: Es existiert **kein** ausführender Master-Supervisor, der Agenten/Modelle über mehrere Assetklassen hinweg koordiniert oder Konflikte auflöst. Was in `README.md`/`AGENTS.md` als „Master Supervisor" beschrieben wird, ist in Code drei getrennte Dinge:
1. Ein **Dashboard-Register** (`server/systemEvents.ts` `DEFAULT_AGENTS`, L255-260) mit 4 kosmetischen „Agenten"-Einträgen (Allocator/Risk/Scanner/Auditor) — reine Telemetrie, keine Ausführungslogik. Das `model`-Feld (`gpt4/gemini/llama/claude`) ist ungenutzt für echtes Routing.
2. Ein **`RequestOrchestrator`** (`src/lib/requestOrchestrator.ts`) — kein Modell-Router, sondern Express-Middleware für Rate-Limiting (30 Req/60s/IP), Concurrency-Cap (3) und FIFO-Queue (max. 10, Timeout 15s).
3. Eine **Dokument-Hygiene-Zustandsmaschine** (`server/decisionEngine.ts`, `DocumentDecisionEngine`) mit erlaubten Zustandsübergängen (`IDLE→PARSING→CHECKING_DEPS→WAITING_AI→REVIEW_REQUIRED/EXECUTING→DONE`).

**Modellauswahl**: Nur pro Assetklasse hart codiert (`selectModel()` in `scoring.service.ts`: `category_main==="DeFi"?"defi":"base"`), keine Cross-Asset-Modellwahl.
**Konfliktlösung**: nicht vorhanden — Agenten laufen parallel via `Promise.all` und werden durch feste Merge-Regeln zusammengeführt, kein Voting/Konsens.
**Quelle**: alle Pfade oben.

## 0.4 Scoring-Modelle und Formeln

### Modell 1 — Crypto Base/DeFi
Dateipfad: `src/services/scoring.service.ts`, Gewichte `src/config/weights.ts`
Asset-Typ: Krypto (Standard vs. DeFi)

| Subscore | Gewicht (Base) | Gewicht (DeFi) | Normalisierung |
|---|---|---|---|
| marketCap | 0.15 | 0.08 | log-scale 0–100 (`realMarketSignals.scoreMarketCap`) |
| liquidity | 0.13 | 0.22 | Tagesumschlag/MarketCap, Cap bei 30 % |
| volatility (invertiert) | 0.10 | 0.08 | `stdev/15*100` |
| tokenomics | 0.07 | 0.16 | zirkulierend/max Supply |
| supplyTransparency | 0.05 | – | 100/50/undefined je Offenlegungsgrad |
| networkActivity | 0.12 | 0.05 | Agent-Output |
| security | 0.12 | 0.12 | Agent-Output |
| utility | 0.09 | 0.16 | Agent-Output |
| adoption | 0.07 | 0.10 | Agent-Output |
| risk (invertiert) | 0.06 | 0.03 | Agent-Output |
| sentiment | 0.04 | – | Agent-Output |

Gewichtsumme: **1.00** (beide Modelle). Risikoadjustierung: `risk`/`volatility` via `100 - value` invertiert (`INVERTED_FIELDS`, L17). Normalisierung/Missing-Handling: `renormalizeAndScore()` (`realMarketSignals.ts:176`) — fehlende Faktoren werden **ausgeschlossen und ihr Gewicht proportional auf vorhandene Faktoren umverteilt**, nicht mit 0 gefüllt.
Formel: `score = Σ(effectiveValue_i * weight_i / Σ verfügbarer weights)`.

### Modell 2 — Crypto „Enterprise" 9-Faktor
Dateipfad: `src/services/cryptoScoringService.ts`

| Subscore | Gewicht |
|---|---|
| trend | 0.20 |
| momentum | 0.16 |
| volatility_quality | 0.12 |
| breakout_quality | 0.10 |
| relative_strength | 0.12 |
| avg_daily_volume | 0.12 |
| supply_dynamics | 0.08 |
| regime_bonus | 0.06 |
| data_quality_risk (invertiert) | 0.04 |

Gewichtsumme: **1.00**. Risikoadjustierung: `risk_penalty = 100 - riskOnly.score`. Thresholds (Decision-Label): 90–100 `A_setup`, 80–89.99 `tradeable_watch`, 70–79.99 `speculative_watch`, 60–69.99 `observe`, 0–59.99 `reject`.

### Modell 3 — Meme-Coin
Dateipfad: `src/services/memeCoinScoringService.ts`

| Subscore | Gewicht |
|---|---|
| liquidity | 0.35 |
| trend_structure | 0.25 |
| momentum | 0.20 |
| volatility_quality | 0.20 |

Gewichtsumme: **1.00**. Keine Risiko-Invertierung (vor-invertiert am Generator). Thresholds: ≥90 `A_setup`, ≥80 `tradeable_watch`, ≥70 `speculative_watch`, ≥60 `high_risk_speculation`, <60 `reject`. `risk_level` ist hart auf `"Unbekannt (kein realer Risikofaktor verfügbar)"` gesetzt — **kein Manipulations-/Rugpull-Faktor vorhanden** (Selbstdokumentation im Code, L74).

### Modell 4 — Rohstoffe (Raw Materials)
Dateipfad: `src/services/rawMaterialsScoring.ts`, Gewichte `src/config/rawMaterialsConfig.ts`

| Subscore | Gewicht | Berechnungsgrundlage |
|---|---|---|
| fundamentals | 0.35 | `(ore_grade + (tonnage+tonnage_reserve)/2 + substitution_potential + recyclability)/4` |
| risk (invertiert) | 0.20 | `(geopolitical+supply_chain+regulatory+esg+producer_concentration+volatility)/6` |
| liquidity | 0.15 | `(market_liquidity + trading_volume)/2` |
| processing | 0.20 | `((100-processing_complexity) + infrastructure_availability + (100-extraction_costs))/3` |
| strategicValue | 0.10 | `(military_importance + industrial_importance)/2` |

Gewichtsumme: **1.00** (Versionen `v0.5.4` und `v0.6.0`, identisch; `ACTIVE_VERSION='v0.5.4'` — faktisch ein No-Op-Versionsbump). Formel: `final = fundamentals*0.35 + (100-risk)*0.20 + liquidity*0.15 + processing*0.20 + strategicValue*0.10`, geclamped [0,100].
**Einziges Modell mit versionierten, externalisierten Gewichten** (`SCORING_VERSIONS`-Objekt) — alle anderen 3 Modelle haben Gewichte hart im Service-Code.

### Modell 5 — Aktien/Forex/Index/Bond (generische Heuristik)
Dateipfad: `server.ts:454-479` (`calculateAssetScore`, Default-Branch)
Kein Faktor-Modell — Momentum + Pattern-Boost-Tabelle: `baseMomentum = 50 + clamp(change24h*5,-40,40)`, plus Pattern-Zuschläge (`Bullish Engulfing:+45 … Bearish Harami/Double Top:-32`). **Keine Gewichtstabelle, kein Subscore-Breakdown.**

### Normalisierung (repo-weit)
`clamp(value,0,100)` (`realMarketSignals.ts:17`) — einzige zentrale Normalisierungsfunktion für Krypto. Rohstoffe nutzen eigene Inline-`round()`-Berechnungen ohne gemeinsame Normalisierungs-Utility.

### Manipulationsschutz
**Nicht gefunden**: keine VWAP-Berechnung, keine dedizierte Outlier-Detection, kein Volumen-/Wash-Trading-Filter. Einzige Annäherungen: `CryptoRiskAgent.manipulation_index` (LLM-geschätzt, kein statistischer Detektor) und `data_quality_risk` (fixer Wert 0.05 bei vorhandener Historie, sonst `undefined` — kein berechneter Outlier-Score).

## 0.5 Ranking- und Tiering-Logik

**Formel** (`src/services/ranking.service.ts:3-15`):
```
dq        = level==='high'?100 : level==='medium'?70 : level==='low'?40 : 50
tierScore = tier===1?100 : tier===2?78 : 55
rankScore = 0.70·finalScore + 0.15·dq + 0.10·tierScore + 0.05·liquidity
```
**Eligibility** (`isTop10Eligible`, L17-22): `confidence ≥ 0.65 ∧ liquidity ≥ 50 ∧ data_quality.level ≠ 'low'`.
Quelle: `src/services/ranking.service.ts`.

**Tiering** (`src/services/classification.service.ts`, hart codierte Symbol-Tabelle — nur Krypto):

| Tier | Bedingung | Confidence | Symbole (Beispiele) |
|---|---|---|---|
| 1 | BTC, ETH, SOL, AAVE, UNI, COMP, MKR, LDO, CRV, LINK | 0.95 | „frei rankbar" |
| 2 | MATIC, ARB, OP, DOGE, SHIB, PEPE, WIF, BONK, FLOKI, POPCAT, BRETT, MOG, BOME | 0.82 | „rankbar mit Abschlag" |
| 3 | alles andere → `Unknown` | 0.60 | nur bei ausreichender Confidence/Liquidität |

**Top-10**: `GET /api/crypto/top10` (`src/routes/cryptoRoutes.ts:136-185`) — filtert via `isTop10Eligible`, `sort((a,b)=>b.rank_score-a.rank_score).slice(0,10)`. **Keine Tie-Breaking-Regel** über den reinen Zahlenvergleich hinaus. **Keine Modi** `byCategory/byTier/byMarketQuality/byGrowth` — nur ein fixer Overall-Top-10-Endpunkt.

## 0.6 Wertkorridor-Logik

Einzige Implementierung: `calculateValueCorridor()` (`src/services/scoring.service.ts:31-37`), für Krypto Base/DeFi:
```
conservative = clamp(finalScore * 0.85)
neutral      = clamp(finalScore)
optimistic   = clamp(finalScore * 1.15)
fairValueGapPct = marketReference>0 ? (neutral-marketReference)/marketReference*100 : 0
```
Quelle: `scoring.service.ts`. **Nicht gefunden**: `RevenueMultiple`, `HybridValue` — keine Treffer im gesamten Repo. Auffälligkeit: `ValuationService.analyze()` übergibt `scores.marketCap` (0–100-Score) als `marketReference`, während `CryptoOrchestrator` echten USD-Preis übergibt — **inkonsistente Einheiten zwischen zwei Aufrufstellen** derselben Funktion (architektonischer Befund, kein Formelfehler).

## 0.7 Datenqualitäts- und Confidence-Modell

**Nicht gefunden**: ein Feld/Typ namens `DataQualityScore` mit den im Master-Prompt geforderten Faktoren (`source_coverage`, `freshness`, `supply_transparency` als Kompositfaktor, `exchange_breadth`, `outlier_stability`) existiert **nicht**. Was existiert:

| Engine | Formel | Quelle |
|---|---|---|
| Crypto Enterprise / Meme | `dataCompletenessRatio = usedFactors/(usedFactors+missingFactors)`; Level: `high≥0.7, medium≥0.4, low>0, unknown` sonst | `cryptoScoringService.ts:127-169`, `memeCoinScoringService.ts:95` |
| Rohstoffe | `missingRatio = missingCount/18`; `unknown>0.6, low>0.35, medium>0.15, high` sonst; `confidence = max(0.15, baseConfidence(0.90) − missingCount·0.04)` | `rawMaterialsScoring.ts:121-138` |
| CryptoOrchestrator | **zwei widersprüchliche Herleitungen** berechnet (`manipulation_index>0.4?medium:high` vs. `confidence≥0.8?high:medium`) — nur die zweite wird zurückgegeben | `cryptoOrchestrator.ts:143-179` |
| Ranking | `data_quality.level` fließt als 15 %-Gewicht in `rankScore` ein (numerische Abbildung 100/70/40/50) | `ranking.service.ts:4` |

**Backtesting/Validierung**: `server/scoreValidation.ts` — `recordDailySnapshots()` schreibt tägliche Score/Preis-Snapshots (`score_snapshots`-Tabelle), `evaluateScoreValidation(horizonDays, threshold)` berechnet TP/FP/TN/FN-Trefferquote je `score_basis` (market-data vs. heuristic), `MIN_SAMPLE_SIZE=5`. Endpunkt `GET /api/scoring/validation` (Admin-only).

**Schwellenwert für Ranking-Zulassung**: `confidence ≥ 0.65` (siehe 0.5).

## 0.8 Datenquellen und API-Abhängigkeiten

| Name | Typ | Assetklasse | Endpunkt | Auth | Frequenz | Pfad |
|---|---|---|---|---|---|---|
| CoinMarketCap | REST (Server-Proxy) | Krypto | `pro-api.coinmarketcap.com` | `COINMARKETCAP_API_KEY` | 60s-Cache | `server.ts:569-586` |
| CoinGecko | REST | Krypto (+ Historie) | `api.coingecko.com` | keine | 60s-Cache | `server.ts:637-650`, `assetRegistry.ts:604` |
| Binance | REST (Fallback) | Krypto | `api.binance.com` | keine | Fallback | `server.ts:697-705` |
| Kraken | REST (Fallback) | Krypto | `api.kraken.com` | `KRAKEN_API_KEY`/`SECRET` (deklariert, ungenutzt für Public-Ticker) | Fallback | `server.ts:729-733` |
| Coinbase | REST (Fallback) | Krypto | `api.coinbase.com` | keine | Fallback | `server.ts:775-782` |
| Stooq | REST/CSV | Aktien/Forex/Rohstoffe | `stooq.com` | keine | On-demand + Historie | `server.ts:851-856`, `assetRegistry.ts:630` |
| Alpha Vantage | REST | Aktien | `www.alphavantage.co` | `ALPHA_VANTAGE_KEY` | On-demand | `server.ts:1188-1196` |
| NewsAPI.org | REST | News/Sentiment | `newsapi.org` | `NEWS_API_KEY` | On-demand | `server.ts:1372-1377` |
| Supabase | DB/Auth | alle | `*.supabase.co` | Anon/Service-Role-Keys | kontinuierlich | `src/supabaseClient.ts`, `server/db.ts` |
| Stripe | REST/Billing | Billing | `api.stripe.com` | Secret/Publishable/Webhook-Keys | Event-getrieben | `server/stripe.ts` |
| Google Gemini | REST/LLM | alle Agenten | Google Cloud (SDK) | `GEMINI_API_KEY` | pro Analyse | `server/ai.ts`, `src/agents/*.ts` |
| SMTP | SMTP | E-Mail | `SMTP_HOST` (Var) | `SMTP_USER/PASSWORD` | Event-getrieben | `server/mailer.ts` |

**On-Chain-Daten**: **nicht gefunden** — kein RPC-Client, kein Subgraph, keine Contract-Adressen. Der „On-Chain Agent" ist ein LLM-Text-Generator ohne Blockchain-Anbindung (explizit dokumentiert, `cryptoOnChainAgent.ts:31`).
**Caching**: In-Memory 60s-TTL-Cache + Request-Coalescing in `server.ts`, kein Redis/Memcached (`ENTERPRISE_CEO/EXECUTIVE_SUMMARY.md` erwähnt Redis — laut Scan **nicht im Code vorhanden**, aspirational).

## 0.9 Konfigurationsdateien

| Datei | Zweck | Version |
|---|---|---|
| `src/config/weights.ts` | `baseWeights`/`defiWeights` (Krypto) | ungetagged |
| `src/config/rawMaterialsConfig.ts` | `SCORING_VERSIONS` (versioniert) + `RAW_MATERIALS_DATABASE` (10 Einträge) | v0.5.4 (aktiv) / v0.6.0 (inaktiv, identisch) |
| `src/config/ownerConfig.ts` | Owner-/PII-Handhabung, keine Scoring-Gewichte | — |
| `.ai/registry/ess-registry.json` | ESS-Nummernregistrierung (0001–0013, frei ab 0014) | — |
| `.ai/registry/exception-registry.json` | 8 Strukturausnahmen (`EXC-0001…0008`) | — |

**Nicht gefunden**: kein `config/`-Verzeichnis auf Root-Ebene; keine YAML-Gewichtsdateien überhaupt (alle Gewichte sind TS-Konstanten).

## 0.10 Skill-Architektur und Skill-Layer

`.ai/skills/`: 19 Markdown-„Skill"-Dokumente (ESS-0001 … ESS-0013 + Contracts-Companions), definieren ein Governance-Modell für KI-Agenten-Zusammenarbeit — **rein spezifikatorisch**, keine ausführbare Skill-Engine. `.ai/knowledge/`, `.ai/contracts/`, `.ai/templates/`, `.ai/prompts/`, `.ai/schemas/` sind **leer** (`.gitkeep` only).

`src/platform/` — 25 „Enterprise"-Modul-Scaffolds (Core, Documentary, Supervisor, PlatformDirector, VersionManager, Knowledge, Registry, Security, Compliance, Quality, Release, Traceability, EventMesh, …). Fast alle bestehen nur aus `README.md` + `manifest.json` (Template, `status:"development"`) **ohne ausführbaren Code**. Zwei Ausnahmen:
- **`EventMesh/`** (ESS-0013) — einziges vollständig implementiertes Platform-Modul: `EventBus`, Contracts, Validators, Tests (`src/platform/EventMesh/Tests/eventBus.test.ts`, node:assert-basiert, nicht über `npm test` erreichbar). Kanonischer Event-Katalog mit >30 Events.
- **`Traceability/`** — strukturell komplett, aber laut `docs/traceability/ETM.md` nicht lauffähig (fehlende Knowledge-Graph-/Digital-Twin-Abhängigkeit).

**Event-Schema laut `docs/integration-plan.md`** (nur spezifiziert, nicht implementiert — referenziertes Python-Backend `market_screening_orchestration.py` existiert nicht):
```
data.validated → data.rejected → data.needs_review
score.approved → score.rejected → score.review_required
report.completed → roadmap.completed → workflow.completed
```
Diese Event-Kette ist **identisch mit der im Master-Prompt (Abschnitt 10.3) geforderten** — sie ist als Zielarchitektur bereits dokumentiert, aber unimplementiert.

## 0.11 Assetklassen-Abdeckung

| Assetklasse | Implementierungsstatus | Kategorien definiert? | Scoring-Modell | Klassifizierung |
|---|---|---|---|---|
| Krypto (Standard/DeFi) | `fully_implemented` (mit Synthetic-Data-Caveat) | 25 `CryptoCategory` + 8 `CryptoSubCategory` (Typen), aber Classifier weist nur 6/4 davon real zu | Base/DeFi-Modell | deterministisch (Symbol-Tabelle) + KI-Agent |
| Krypto (Meme) | `partial` | keine dedizierte Taxonomie, 3 hart codierte Symbole | Meme-Modell | rudimentär |
| Krypto „Enterprise" 9-Faktor | `fully_implemented`, parallel zu Base/DeFi | eigene `CryptoClassification` (nur `Crypto|Unknown`) | 9-Faktor-Modell | separat, inkompatibel zu Standard-Modell |
| Rohstoffe | `fully_implemented` für 10 DB-Einträge, `partial` darüber hinaus | 6 `CategoryMain` | Rohstoff-5-Achsen-Modell | deterministische DB + KI-Agent |
| Aktien | `defined_only` (nur `Asset.type==='stock'`, kein Kategorie-System) | nein | generische Heuristik | nicht vorhanden |
| Forex | `defined_only` | nein | generische Heuristik | nicht vorhanden |
| Index | `defined_only` | nein | generische Heuristik | nicht vorhanden |
| Bond | `defined_only` (nur 3 hart codierte Symbole) | nein | generische Heuristik | nicht vorhanden |
| ETF | `not_found` | nein (kein `etf`-Typ-Literal) | keins | nicht vorhanden |
| Derivative | `not_found` (nur als `asset_type`-Enum-Wert deklariert, nie zugewiesen) | nein | keins | nicht vorhanden |

**Lücken-Analyse**: Aktien/Forex/Index/Bond/ETF/Derivate haben **keine** Faktor-gewichtete Engine, keine Kategorietaxonomie, keine Datenquellen-Zuordnung über die generische Marktdaten-API hinaus. Dies ist die zentrale Erweiterungsfläche für Phase 2 (Abschnitt 5).

## 0.12 Typdefinitionen und Schemas

Wichtigster Befund: **drei nicht-kompatible `CryptoClassification`-Typen** koexistieren unter demselben Namen:
1. `src/types/crypto.ts` — Legacy-„Enterprise-9-Faktor"-Modell (`category_main: "Crypto"|"Unknown"`).
2. `src/types/crypto.types.ts` — kanonisches Standard/DeFi-Modell (25-Wert-`CryptoCategory`-Enum + `tier`).
3. `src/agents/cryptoClassificationAgent.ts` (inline) — Rohausgabe des KI-Agenten (`sub_tier`, `market_structure`, `narrative_alignment`).

Weitere Typen: `RegistryAsset` (`src/lib/assetRegistry.ts`, `type: crypto|stock|forex|commodity|index|bond` — **kein `etf`/`equity`/`derivative`**), `Asset` (`src/types.ts`, 5 Typen, **kein `bond`**), `RawMaterialInput`/`Classification`/`ScoreSet`/`AnalysisPayload` (`src/types/rawMaterials.ts`), `MemeCoinInputs`/`MemeCoinAnalysisPayload` (`src/types/memeCoin.ts`). **Kein** `EquityCategory`/`EquitySubCategory`/generischer `Tier`-Typ außerhalb von Krypto gefunden.

## 0.13 API-Routen und Endpunkte

| Methode | Pfad | Auth | Service |
|---|---|---|---|
| GET | `/api/crypto/list`, `/api/crypto/top10` | keine bzw. quotiert | `cryptoOrchestrator`, `ranking.service` |
| POST | `/api/crypto/analyze`, `/api/crypto/score` | quotiert | `cryptoOrchestrator`, `scoring.service` |
| GET/POST | `/api/raw-materials/list`, `/analyze`, `/score` | teils quotiert | `rawMaterialsOrchestrator`, `rawMaterialsScoring` |
| GET | `/api/market-data`, `/api/alpha-vantage-quote` | keine | Multi-Provider-Fallback-Kette |
| GET/POST | `/api/crypto-scoring/:symbol` | `enforceScreeningQuota` | `CryptoScoringService` (9-Faktor) |
| GET | `/api/scoring/validation` | Admin | `scoreValidation.ts` |
| GET/POST | `/api/compliance/*` | Admin (`ADMIN_ZONE_ROLES`) | `server/compliance/*` |
| GET | `/api/admin/system-events`, `/agents`, `/orchestrators/status` | Admin/Supervisor-Rollen | `systemEvents.ts` |

Vollständige Liste: 11 gemountete Router + ~19 direkt in `server.ts` definierte Endpunkte (siehe Rohbefund des Recherche-Agenten). Middleware: `checkAdminAccess()` (`server/iam/authMiddleware.ts`), Rollen `ADMIN_ZONE_ROLES=['owner','admin']`, `SUPERVISOR_ZONE_ROLES=['owner','admin','supervisor']`.

## 0.14 Audit- und Compliance-Komponenten

- **Logger**: `server/logger.ts` — eigenes JSON-Line-Format (bewusst kein winston/pino), Felder `timestamp/level/scope/requestId/message/meta`. Adoption ist partiell — ca. 279 `console.*`-Aufrufe unmigriert (laut `ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md`).
- **System-Event-Log**: `server/systemEvents.ts`, datei- + SSE-basiert, Typen `AUTH/SUBSCRIPTION/CREDITS/ORCHESTRATOR/MARKET_DATA/SECURITY`.
- **IAM-Audit** (DB): `audit_logs_iam`, `iam_access_log`, `security_events` — RLS `service_role`-only, keine Update/Delete-Policy (Append-only).
- **Compliance-Scanner**: `server/compliance/scanners.ts` — 21 statische Scanner (SECURITY/DATA/BILLING/CODE_QUALITY/GOVERNANCE), `complianceScore = max(0,100-Σseverity)`, ISO/IEC-27001-Annex-A-Mapping als **selbstbewertet, nicht zertifiziert** gekennzeichnet.
- **DSGVO**: `docs/DATENSCHUTZ_PROTOKOLL.md` — Art.-30-Verarbeitungsverzeichnis, offengelegt den Synthetic-Data-Befund.
- **Bekannte Lücke**: `security_events`/`iam_access_log`/`step_up_tokens`/`break_glass_codes` hatten laut `ENTERPRISE_PRODUCTION_AUDIT.md` **0 Zeilen** trotz existierender Infrastruktur — Selbstbefund, nicht in diesem Scan nachgeprüft.

## 0.15 Dokumentation

94 Markdown-Dateien über `docs/` (21 Unterordner) plus `README.md`/`AGENTS.md`. Zentrale, bereits vorhandene **Selbstaudits** liefern wertvolles Vorbewertungsmaterial für Abschnitt 0.18:
- `ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` (ARCH-AUDIT-0002) — PROD Enterprise Score **35/100**.
- `ENTERPRISE_PRODUCTION_AUDIT.md` (ARCH-AUDIT-0001) — Score **55/100** („Professional SaaS", nicht Enterprise-Ready).
- `ENTERPRISE_MATURITY_REPORT.md` (ARCH-MAT-0001) — **46/100** („Structured").
- `GOVERNANCE_MATURITY_REPORT.md` (ARCH-GOVMAT-0001) — **0/100** (220+ Findings, geclampt).

Abweichung/Widerspruch: **Drei verschiedene Versionsangaben** kursieren gleichzeitig — `AGENTS.md`/`README.md` pinnen „0.5.4", `package.json`/`metadata.json` nennen „0.6.0", `docs/code-quality/CODE_QUALITY_STANDARDS.md` nennt „0.5.0". Dies wird in Abschnitt 0.18 als GOV-VER-001 (bereits von Vorgänger-Audits identifiziert) übernommen.

## 0.16 Test- und Backtesting-Komponenten

Einziges nicht-leeres Testverzeichnis: `tests/unit/` (9 Dateien, Vitest, per CI in `.github/workflows/ci.yml` ausgeführt):

| Datei | Getestete Komponente |
|---|---|
| `rankingService.test.ts` | `calculateRankScore`, `isTop10Eligible` |
| `scoringService.test.ts` | Base/DeFi-Scoring, Value-Corridor |
| `memeCoinScoringService.test.ts` | Meme-Coin-Scoring |
| `scoreValidation.test.ts` | Backtesting-Snapshot/Hit-Rate |
| `complianceScanners.test.ts` | Compliance-Scanner-Struktur |
| `metrics.test.ts`, `aiUsageTracker.test.ts`, `secretCrypto.test.ts`, `totp.test.ts`, `quota.test.ts` | Infrastruktur/Security, nicht Scoring |

`tests/{contract,integration,performance,e2e,architecture,security}/` — **alle leer** (`.gitkeep`). **Keine Tests** für Rohstoff-Scoring, Klassifizierungs-Agenten, oder `BacktestEngine.tsx`/`PortfolioBacktester.tsx`/`MonteCarloDetailed.tsx` (reine UI-Komponenten ohne Backtesting-Engine im Backend). CI: `.github/workflows/ci.yml` — `npm ci → tsc --noEmit → vitest run → vite build+esbuild → predeploy:check`.

## 0.17 Zusammenfassende Bestands-Tabelle

| Komponente | Typ | Status | Quelle | Gefunden? | Vollständig? |
|---|---|---|---|---|---|
| Master Supervisor (Ausführungslogik) | Orchestrierung | `not_found` | — | Nein | — |
| RequestOrchestrator (Rate-Limit/Queue) | Infrastruktur | `implemented` | `src/lib/requestOrchestrator.ts` | Ja | Ja |
| CryptoOrchestrator | Orchestrierung | `implemented` | `src/orchestrator/cryptoOrchestrator.ts` | Ja | Ja |
| RawMaterialsOrchestrator | Orchestrierung | `implemented` | `src/orchestrator/rawMaterialsOrchestrator.ts` | Ja | Ja |
| Crypto Base/DeFi Scoring | Scoring-Modell | `implemented` | `scoring.service.ts` | Ja | Ja |
| Crypto Enterprise 9-Faktor Scoring | Scoring-Modell | `implemented`, parallel/inkonsistent | `cryptoScoringService.ts` | Ja | Ja |
| Meme-Coin Scoring | Scoring-Modell | `implemented`, kein Risikofaktor | `memeCoinScoringService.ts` | Ja | teilweise |
| Rohstoff-Scoring | Scoring-Modell | `implemented`, nur 10 DB-Assets | `rawMaterialsScoring.ts` | Ja | teilweise |
| Aktien/Forex/Index/Bond Scoring | Scoring-Modell | `defined_only` (Heuristik) | `server.ts:454-479` | Ja | Nein |
| ETF/Derivate Scoring | Scoring-Modell | `not_found` | — | Nein | — |
| Ranking-/Tiering-Logik | Ranking | `implemented`, nur Krypto | `ranking.service.ts` | Ja | teilweise |
| Wertkorridor | Valuation | `implemented`, nur Krypto | `scoring.service.ts` | Ja | teilweise |
| DataQualityScore (Kompositformel) | Datenqualität | `not_found` (nur Completeness-Ratio-Ersatz) | — | Nein | — |
| Confidence-Modell | Datenqualität | `partial`, 3 inkonsistente Varianten | mehrere | Ja | Nein |
| Manipulationsschutz (VWAP/Outlier) | Risikokontrolle | `not_found` | — | Nein | — |
| Skill-Layer/Event-Mesh | Governance | `partial` (nur EventMesh implementiert) | `src/platform/EventMesh` | Ja | Nein |
| Compliance-Scanner | Audit | `implemented` | `server/compliance/scanners.ts` | Ja | Ja |
| Backtesting/Validierung | QA | `partial` (nur Snapshot-Hit-Rate, keine Walk-Forward) | `server/scoreValidation.ts` | Ja | Nein |
| Test-Suite | QA | `partial` (nur Unit, Krypto-lastig) | `tests/unit/` | Ja | Nein |

## 0.18 Bewertungsrahmen für das erfasste Material

| Komponente | Erfasster Zustand | Geeignet für erweitertes Screening? | Anpassungsbedarf | Empfohlene Aktion |
|---|---|---|---|---|
| `renormalizeAndScore()` Dynamic-Reweighting-Engine | robust, getestet, sauber generisch | Ja | keiner | **keep_as_is** — als zentrale Normalisierungs-Utility für alle Assetklassen übernehmen |
| Crypto Base/DeFi-Gewichtsmodell | funktional, testabgedeckt | Ja, als eine von mehreren Sub-Modellen | Formale Score-Kontrakt-Felder (`asset_class_score` etc.) fehlen | **extend** |
| Crypto Enterprise 9-Faktor-Modell | funktional, aber parallele Typwelt zu Base/DeFi | Bedingt | Konsolidierung mit Base/DeFi-Modell nötig | **refactor** — auf ein `CryptoClassification`-Schema vereinheitlichen |
| Meme-Coin-Modell | funktional, aber ohne Risikofaktor | Bedingt | Risiko-/Manipulationsfaktor fehlt vollständig | **extend** |
| Rohstoff-Modell | robust, versioniert, aber nur 10 Assets | Ja | Coverage auf mehr Materialien/Kategorien erweitern | **extend** |
| Aktien/Forex/Index/Bond-Heuristik | rein technisch (Momentum+Pattern), keine Fundamentaldaten | Nein als Enterprise-Modell | Vollständiges Faktor-Modell fehlt | **replace** (siehe 5.2–5.5) |
| ETF/Derivate | nicht vorhanden | — | — | **new** (siehe 5.7–5.8) |
| Ranking-Formel (`rankScore`) | strukturell korrekt (FinalScore/DQ/Tier/Liquidität gewichtet), aber nur Krypto | Ja, als Cross-Asset-Vorlage | Auf alle Assetklassen generalisieren, Tie-Breaking ergänzen | **extend** |
| Wertkorridor-Formel (fixe Multiplikatoren 0.85/1.00/1.15) | einfach, nicht modellspezifisch differenziert | Bedingt | Asset-Typ-spezifische Multiplikatoren fehlen (Master-Prompt fordert das für DeFi z. B. 0.82/1.18) | **extend** |
| DataQualityScore (Komposit) | nicht vorhanden, nur Ratio-Ersatz | Nein | Muss komplett neu nach Struktur aus Abschnitt 7 gebaut werden | **new** |
| Confidence-Modell | 3 inkonsistente Ad-hoc-Formeln | Nein als Einheitsmodell | Vereinheitlichung nötig | **refactor** |
| Manipulationsschutz (VWAP/Outlier) | nicht vorhanden | Nein | — | **new** |
| Klassifizierungs-Taxonomie Krypto | Typen umfassend definiert (25/8 Werte), Classifier deckt nur 6/4 ab | Ja als Grundlage | Classifier-Coverage erweitern | **extend** |
| Klassifizierungs-Taxonomie Aktien/Forex/Index/Bond/ETF/Derivate | nicht vorhanden | Nein | — | **new** |
| Compliance-Scanner-Engine | robust, 21 Scanner, ISO-Mapping | Ja, unverändert nutzbar für Governance-Layer | keiner (nur Scope erweitern) | **keep_as_is** |
| Event-Schema (`data.validated`→…) | spezifiziert, nicht durchgängig implementiert (nur EventMesh-Grundgerüst) | Ja als Zielarchitektur | Implementierung fehlt für Scoring-Pfad | **extend** |
| Backtesting/Score-Validation | Snapshot+Hit-Rate vorhanden, kein Walk-Forward/Drift-Monitoring | Ja als Basis | Walk-Forward-Erweiterung nötig | **extend** |

## 0.19 Erfassungs-Qualitätskriterien — Bestätigung

Alle 15 Schritte (0.2–0.16) wurden durchgeführt; Ergebnisse ohne Treffer sind explizit als `not_found` markiert. Jede Komponente ist mit Dateipfad zitiert (siehe Recherche-Grundlage: drei parallele Vollaudits von `server.ts`/`server/`, `src/`, `docs/`/`supabase/`/`.ai/`, insgesamt >220 Werkzeugaufrufe). Die Erfassung ist rein lesend erfolgt — keine Datei wurde verändert.

---

## 0.20 Anhang — Rohinventar in vorgegebenem Ausgabeformat (Schritt 1–15)

Dieser Anhang liefert die von Abschnitt 0.1–0.16 des Master-Prompts geforderten maschinenlesbaren Rohtabellen, ergänzend zur narrativen Synthese oben. Jede Zeile ist Dateipfad-zitiert; nicht gefundene Elemente sind explizit `not_found`.

### Schritt 1 — Package-/Build-/Environment-Dateien

**PACKAGE-DATEIEN:**

| Datei | Pfad | Inhalt (zusammengefasst) |
|---|---|---|
| `package.json` | `/package.json` | `name: capital-ai`, `version: 0.6.0`, `type: module`, Node ≥22; Kern-Deps `express`, `@google/genai`, `@supabase/supabase-js`, `stripe`, `d3`, `recharts`, `motion`, `kraken-api`; Dev-Deps `vitest ^4.1.10`, `typescript ~5.8.2`, `tsx`, `esbuild`; Scripts `dev/build/start/preview/clean/lint/test/hygiene:sweep/predeploy:check` |
| `package-lock.json` | `/package-lock.json` | npm-Lockfile (274 KB) |
| `tsconfig.json` | `/tsconfig.json` | `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit: true`, Pfad-Alias `@/* → ./*`, `allowImportingTsExtensions: true` |

**BUILD-KONFIGURATIONEN:**

| Datei | Pfad | Zweck |
|---|---|---|
| `vite.config.ts` | `/vite.config.ts` | Vite-6-Build; `test.environment: 'node'`, `test.include: ['tests/unit/**/*.test.ts']` (Vitest-Konfiguration liegt hier, nicht in separater `vitest.config.ts`) |
| `Dockerfile` | `/Dockerfile` | Container-Build für Produktions-Deploy |
| `.dockerignore` | `/.dockerignore` | Docker-Build-Ausschlüsse |
| `render.yaml` | `/render.yaml` | Render.com Auto-Deploy-Konfiguration, `healthCheckPath: /healthz` |
| `.github/workflows/ci.yml` | `/.github/workflows/ci.yml` | einzige CI-Pipeline (siehe Schritt 15) |

**ENVIRONMENT-TEMPLATES:**

| Datei | Pfad | Enthaltene Variablen |
|---|---|---|
| `.env.example` | `/.env.example` | `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `ALPHA_VANTAGE_KEY`, `KRAKEN_API_KEY`/`KRAKEN_API_SECRET`, `NEWS_API_KEY`, `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD`, `METRICS_TOKEN`, `TOTP_ENCRYPTION_KEY` |
| `server/_.env.example` | `/server/_.env.example` | serverseitige Ergänzung zum Root-Template |

Vollständige Verzeichnisstruktur: siehe Abschnitt 0.2 oben (≥3 Ebenen tief, alle Top-Level-Verzeichnisse erfasst).

### Schritt 2 — Agenten-Rohinventar

**AGENTEN-INVENTAR:**

| Agent | Pfad | Rolle | Eingaben | Ausgaben | Downstream | Entscheidungslogik |
|---|---|---|---|---|---|---|
| `ClassificationAgent` | `src/agents/classificationAgent.ts` | Rohstoff-Kategorisierung | `materialName: string` | `{category_main, category_sub, market_type, valuation_mode, confidence, reasoning[]}` | `RawMaterialsOrchestrator` | Gemini `gemini-3.1-pro-preview` → bei Fehler `gemini-3.5-flash` → bei Fehler `findRawMaterialConfig()` (statische DB) |
| `FundamentalsAgent` | `src/agents/fundamentalsAgent.ts` | Reserve-/Geologiekennzahlen | `materialName: string` | `{ore_grade, tonnage, tonnage_reserve, substitution_potential, recyclability}` (0-100, geclampt) | `RawMaterialsOrchestrator` | gleiche Zwei-Modell-Gemini-Kette |
| `RiskAgent` (Rohstoffe) | `src/agents/riskAgent.ts` | Geopolitik-/ESG-Risiko | `materialName: string` | `{geopolitical_risk, supply_chain_risk, regulatory_risk, esg_risk, producer_concentration, volatility}` | `RawMaterialsOrchestrator` | gleiche Kette |
| `ValuationAgent` (Rohstoffe) | `src/agents/valuationAgent.ts` | Strategische Bedeutung | `materialName: string` | `{military_importance, industrial_importance}` | `RawMaterialsOrchestrator` | gleiche Kette |
| `RawMaterialsOrchestrator` | `src/orchestrator/rawMaterialsOrchestrator.ts` | Master-Orchestrator Rohstoffe | `materialName: string` | vollständiges `AnalysisPayload` | `RawMaterialsScoringService.scoreMaterial()` | `Promise.all([4 Agenten])`, `updateAgentActivity()` für Dashboard-Telemetrie, deterministisches Scoring als „Single Source of Truth" |
| `CryptoClassificationAgent` | `src/agents/cryptoClassificationAgent.ts` | Krypto-Kategorisierung | `symbol: string` | `{category, sub_tier, market_structure, narrative_alignment, confidence, reasoning}` | `CryptoOrchestrator` | Gemini `gemini-2.5-flash`, keine Fallback-Modellstufe; Fallback nur bei fehlendem AI-Client (hart codierter BTC-Sonderfall + generischer Default) |
| `CryptoOnChainAgent` | `src/agents/cryptoOnChainAgent.ts` | „On-Chain"-Metriken | `symbol: string` | `{active_addresses_growth, transaction_velocity, whale_accumulation}` (0-1) | `CryptoOrchestrator` | Gemini-Schätzung, explizit als hypothetisch dokumentiert (Kommentar L31) |
| `CryptoSentimentAgent` | `src/agents/cryptoSentimentAgent.ts` | Sentiment-Schätzung | `symbol: string` | `{social_velocity, narrative_strength, news_momentum}` (0-1) | `CryptoOrchestrator` | Gemini-Schätzung, keine externe Social-API |
| `CryptoRiskAgent` | `src/agents/cryptoRiskAgent.ts` | Manipulations-/Regulierungsrisiko | `symbol: string` | `{manipulation_index, exchange_concentration_index, regulatory_risk_index}` (0-1) | `CryptoOrchestrator` | Gemini-Schätzung, kein statistischer Detektor |
| `CryptoOrchestrator` | `src/orchestrator/cryptoOrchestrator.ts` | Master-Orchestrator Krypto | `symbol: string` | vollständiges `CryptoAnalysisPayload` | `scoring.service.ts`, `ranking.service.ts` | 4 Agenten parallel via `Promise.all`; `categoryMain==='DeFi' ? calculateDefiScore : calculateBaseScore` (L150-152); `category`-String-Matching gegen `defi/l1/layer1/l2/layer2/meme/oracle` (L72-82) |

**SUPERVISOR-LOGIK:**
- Modellauswahl: nur pro Assetklasse hart codiert (`selectModel()`, `scoring.service.ts:39-41`); kein Cross-Asset-Modellrouter vorhanden.
- Konfliktlösung: `not_found` — Agenten laufen ausschließlich parallel (`Promise.all`) und werden über feste, unbedingte Merge-Regeln zusammengeführt; kein Voting-/Konsens-/Prioritätsmechanismus im Code.
- Priorisierung: `not_found` als Code-Konstrukt; nur als Dashboard-Telemetrie-Register vorhanden (`DEFAULT_AGENTS`, `server/systemEvents.ts:255-260` — 4 kosmetische Einträge `ag_allocator/ag_risk/ag_scanner/ag_auditor`, `model`-Feld ungenutzt für echtes Routing).
- Quelle: `src/orchestrator/cryptoOrchestrator.ts`, `src/orchestrator/rawMaterialsOrchestrator.ts`, `server/systemEvents.ts`.

**PROMPT-DATEIEN:**

| Prompt | Pfad | Zugehöriger Agent | Zweck |
|---|---|---|---|
| Gemini-Inline-Prompts (kein separates `.md`/`.txt`) | `src/agents/*.ts` (jeweils inline als Template-String) | jeweiliger Agent | Definieren JSON-Response-Schema + Systemkontext pro Gemini-Aufruf |
| `.ai/skills/*.md` (19 Dateien) | `.ai/skills/` | kein direkter Laufzeit-Agent | Governance-/Spezifikations-Skills (ESS-Layer), nicht als Runtime-Prompt eingebunden — siehe Schritt 9 |

`not_found`: keine dedizierten `*.prompt`-Dateien; alle Agenten-Prompts sind inline im TypeScript-Code definiert.

### Schritt 3 — Scoring-Modell-Rohinventar

```
Modell: Crypto Base
Dateipfad: src/services/scoring.service.ts (Formel) / src/config/weights.ts (Gewichte)
Asset-Typ: Krypto (Standard, category_main ≠ "DeFi")
| Subscore | Gewicht | Berechnungsgrundlage | Normalisierung |
|---|---|---|---|
| marketCap | 0.15 | realMarketSignals.scoreMarketCap (log10-Skala) | 0-100 |
| liquidity | 0.13 | Tagesumschlag/MarketCap, Cap 30%/Tag | 0-100 |
| volatility | 0.10 | stdev der Log-Returns /15*100, invertiert | 0-100 |
| tokenomics | 0.07 | zirkulierend/max Supply | 0-100 |
| supplyTransparency | 0.05 | 100/50/undefined je Offenlegungsgrad | 0-100 |
| networkActivity | 0.12 | Agent-Output (CryptoOnChainAgent-Derivat) | 0-100 |
| security | 0.12 | Agent-Output | 0-100 |
| utility | 0.09 | Agent-Output | 0-100 |
| adoption | 0.07 | Agent-Output | 0-100 |
| risk | 0.06 | Agent-Output, invertiert | 0-100 |
| sentiment | 0.04 | Agent-Output | 0-100 |
Gewichtsumme: 1.00 (Soll: 1.0 — erfüllt)
Risikoadjustierung: risk, volatility via (100-value) invertiert (INVERTED_FIELDS Set, scoring.service.ts:17)
Thresholds: keine Decision-Thresholds in diesem Modell (nur im Enterprise-9-Faktor-Modell, siehe unten)
Formel: score = Σ(effectiveValue_i · weight_i / Σ verfügbarer weights), effectiveValue = invert?100-raw:raw

---

Modell: Crypto DeFi
Dateipfad: src/services/scoring.service.ts / src/config/weights.ts
Asset-Typ: Krypto (category_main === "DeFi")
| Subscore | Gewicht | Berechnungsgrundlage | Normalisierung |
|---|---|---|---|
| liquidity | 0.22 | wie Base-Modell | 0-100 |
| tokenomics | 0.16 | wie Base-Modell | 0-100 |
| marketCap | 0.08 | wie Base-Modell | 0-100 |
| volatility | 0.08 | wie Base-Modell, invertiert | 0-100 |
| utility | 0.16 | Agent-Output | 0-100 |
| adoption | 0.10 | Agent-Output | 0-100 |
| security | 0.12 | Agent-Output | 0-100 |
| networkActivity | 0.05 | Agent-Output | 0-100 |
| risk | 0.03 | Agent-Output, invertiert | 0-100 |
Gewichtsumme: 1.00 (Soll: 1.0 — erfüllt)
Risikoadjustierung: identisch zu Base-Modell
Thresholds: keine
Formel: identisch zu Base-Modell, andere Gewichte

---

Modell: Crypto Enterprise (9-Faktor)
Dateipfad: src/services/cryptoScoringService.ts
Asset-Typ: Krypto (paralleles Modell zu Base/DeFi, genutzt von /api/crypto-scoring/:symbol)
| Subscore | Gewicht | Berechnungsgrundlage | Normalisierung |
|---|---|---|---|
| trend | 0.20 | scoreTrend(last,sma) | 0-100 |
| momentum | 0.16 | scoreMomentum(rocPct) | 0-100 |
| volatility_quality | 0.12 | scoreVolatility(dailyStdevPct) | 0-100 |
| breakout_quality | 0.10 | scoreBreakout(last,high,low) | 0-100 |
| relative_strength | 0.12 | computeRsi(closes) | 0-100 |
| avg_daily_volume | 0.12 | scoreLiquidity-Derivat | 0-100 |
| supply_dynamics | 0.08 | scoreTokenomics-Derivat | 0-100 |
| regime_bonus | 0.06 | scoreRegime(change24h) | 0-100 |
| data_quality_risk | 0.04 | fix 0.05 bei Historie vorhanden, sonst undefined; invertiert | 0-100 |
Gewichtsumme: 1.00 (Soll: 1.0 — erfüllt)
Risikoadjustierung: data_quality_risk invertiert (INVERTED_FIELDS={'data_quality_risk'}, L41); risk_penalty=100-riskOnly.score separat für Breakdown
Thresholds: 90-100 A_setup | 80-89.99 tradeable_watch | 70-79.99 speculative_watch | 60-69.99 observe | 0-59.99 reject (CRYPTO_DECISION_THRESHOLDS, L43-49)
Formel: renormalizeAndScore(scores, CRYPTO_SCORING_WEIGHTS, INVERTED_FIELDS)

---

Modell: Meme-Coin
Dateipfad: src/services/memeCoinScoringService.ts
Asset-Typ: Krypto (category_main === "Meme")
| Subscore | Gewicht | Berechnungsgrundlage | Normalisierung |
|---|---|---|---|
| liquidity | 0.35 | wie Base-Modell | 0-100 |
| trend_structure | 0.25 | trendbasiert | 0-100 |
| momentum | 0.20 | wie Enterprise-Modell | 0-100 |
| volatility_quality | 0.20 | vor-invertiert am Generator | 0-100 |
Gewichtsumme: 1.00 (Soll: 1.0 — erfüllt)
Risikoadjustierung: keine INVERTED_FIELDS; risk_level hart "Unbekannt (kein realer Risikofaktor verfügbar)" — kein Risikofaktor im Modell vorhanden (Selbstdokumentation Code L74)
Thresholds: ≥90 A_setup | ≥80 tradeable_watch | ≥70 speculative_watch | ≥60 high_risk_speculation | <60 reject
Formel: renormalizeAndScore(scores, MEME_COIN_WEIGHTS, {})

---

Modell: Raw Materials (Rohstoffe)
Dateipfad: src/services/rawMaterialsScoring.ts / src/config/rawMaterialsConfig.ts
Asset-Typ: Commodity (10 DB-Einträge)
| Subscore | Gewicht | Berechnungsgrundlage | Normalisierung |
|---|---|---|---|
| fundamentals | 0.35 | (ore_grade+(tonnage+tonnage_reserve)/2+substitution_potential+recyclability)/4 | 0-100, round |
| risk | 0.20 | (geopolitical+supply_chain+regulatory+esg+producer_concentration+volatility)/6, invertiert | 0-100, round |
| liquidity | 0.15 | (market_liquidity+trading_volume)/2 | 0-100, round |
| processing | 0.20 | ((100-processing_complexity)+infrastructure_availability+(100-extraction_costs))/3 | 0-100, round |
| strategicValue | 0.10 | (military_importance+industrial_importance)/2 | 0-100, round |
Gewichtsumme: 1.00 (v0.5.4 und v0.6.0, identisch — Soll: 1.0, erfüllt)
Risikoadjustierung: (100-riskScore)·rWeight
Thresholds: keine Decision-Bänder; nur Datenqualitäts-Schwellen (siehe Schritt 6)
Formel: final = fundamentals·0.35 + (100-risk)·0.20 + liquidity·0.15 + processing·0.20 + strategicValue·0.10, geclampt[0,100], 1 Dezimalstelle

---

Modell: Aktien/Forex/Index/Bond (generische Heuristik)
Dateipfad: server.ts:454-479 (calculateAssetScore, Default-Branch)
Asset-Typ: stock, forex, index, bond
| Subscore | Gewicht | Berechnungsgrundlage | Normalisierung |
|---|---|---|---|
| baseMomentum | — | 50 + clamp(change24h·5,-40,40) | 0-100 |
| patternBoost | — | feste Zuschlagstabelle je erkanntem Chartmuster | additiv, dann geclampt |
Gewichtsumme: n/a — kein Gewichtsmodell, additive Heuristik
Risikoadjustierung: keine
Thresholds: keine Decision-Bänder; Pattern-Tabelle: Bullish Engulfing +45 (Score-Floor ≥82), Inverted Head&Shoulders +35, Hammer Support/Reversal +30, Double Bottom +28, Cup&Handle +25, Bull Flag/Morning Star +22, Ascending Triangle/Channel +18, Bearish Harami/Double Top -32
Formel: score = clamp(baseMomentum + patternBoost, 1, 100)
```

**NORMALISIERUNGSREGELN:**

| Regel | Funktion | Eingabebereich | Ausgabebereich | Quelle |
|---|---|---|---|---|
| Clamp | `clamp(value,min=0,max=100)` | beliebig | [min,max] | `realMarketSignals.ts:17` |
| Log-Scale MarketCap | `scoreMarketCap()` | USD | 0-100 | `realMarketSignals.ts:27` |
| Liquidität/Turnover | `scoreLiquidity()` | USD/USD | 0-100 | `realMarketSignals.ts:38` |
| Tokenomics-Ratio | `scoreTokenomics()` | Supply-Verhältnis | 0-100 | `realMarketSignals.ts:49` |
| Supply-Transparenz | `scoreSupplyTransparency()` | boolean-artig | {100,50,undefined} | `realMarketSignals.ts:60` |
| Volatilität | `scoreVolatility()` | %-Stdev | 0-100 | `realMarketSignals.ts:113` |
| Regime | `scoreRegime()` | %-Change | 0-100 | `realMarketSignals.ts:122` |
| Trend | `scoreTrend()` | Preis vs. SMA | 0-100 | `realMarketSignals.ts:130` |
| Momentum | `scoreMomentum()` | ROC % | 0-100 | `realMarketSignals.ts:137` |
| Breakout | `scoreBreakout()` | Preis-Range | 0-100 | `realMarketSignals.ts:142` |
| RSI | `computeRsi()` | Preisserie | 0-100 | `realMarketSignals.ts:151` |
| Dynamische Neugewichtung | `renormalizeAndScore()` | gewichtete Werte + Weight-Map | 0-100 | `realMarketSignals.ts:176` |

`zScore`/`minMax` als benannte Utility: `not_found` (nur die o.g. spezifischen Scoring-Funktionen, keine generische Statistik-Utility-Bibliothek).

**MANIPULATIONSSCHUTZ:**

| Mechanismus | Implementierung | Quelle |
|---|---|---|
| VWAP-Berechnung | `not_found` | — |
| Outlier-Detection (Preis/Volumen) | `not_found` | — |
| Volumen-Validierung | `not_found` als dedizierter Filter (nur `scoreLiquidity()` als Turnover-Input, kein Schwellenwert-Ausschluss) | `realMarketSignals.ts:38` |
| Manipulationsrisiko-Schätzung | `manipulation_index` — LLM-Schätzung (0-1), kein statistischer Detektor | `src/agents/cryptoRiskAgent.ts:10` |
| Liquiditätsfilter im Ranking | `liquidity ≥ 50` als Top-10-Eligibility-Kriterium (indirekter Manipulationsschutz durch Ausschluss illiquider Assets) | `src/services/ranking.service.ts:17-22` |

### Schritt 4 — Ranking-/Tiering-Rohinventar

**RANKING-LOGIK:**
```
Formel: rankScore = 0.70·finalScore + 0.15·dataQualityScore(100/70/40/50) + 0.10·tierScore(100/78/55) + 0.05·liquidity
Eligibility-Kriterien:
- confidence >= 0.65
- liquidity >= 50
- data_quality.level !== "low"
Quelle: src/services/ranking.service.ts:3-22
```

**TIERING-LOGIK:**

| Tier | Bedingung | Score-Anpassung | Quelle |
|---|---|---|---|
| 1 | Symbol ∈ {BTC,ETH,SOL,AAVE,UNI,COMP,MKR,LDO,CRV,LINK} | `tierScore=100`, `confidence=0.95` | `src/services/classification.service.ts:1-71` |
| 2 | Symbol ∈ {MATIC,ARB,OP,DOGE,SHIB,PEPE,WIF,BONK,FLOKI,POPCAT,BRETT,MOG,BOME} | `tierScore=78`, `confidence=0.82` | dito |
| 3 | alle übrigen Symbole (`category_main="Unknown"`) | `tierScore=55`, `confidence=0.60` | dito |

**TOP-10-MODI:**

| Modus | Berechnung | Filter | Sortierung | Quelle |
|---|---|---|---|---|
| Overall | `rankScore` für alle Assets | `isTop10Eligible()` | `sort(b.rank_score-a.rank_score).slice(0,10)` | `src/routes/cryptoRoutes.ts:136-185` |
| byCategory | `not_found` | — | — | — |
| byTier | `not_found` | — | — | — |
| byMarketQuality | `not_found` | — | — | — |
| byGrowth | `not_found` | — | — | — |

**TIE-BREAKING-REGELN:** `not_found` — der bestehende Sort-Aufruf (`sort((a,b)=>b.rank_score-a.rank_score)`) hat keine sekundäre Sortierdimension; bei exaktem `rank_score`-Gleichstand ist die Reihenfolge von der JS-Sort-Stabilität/Eingabereihenfolge abhängig, nicht von einer expliziten Regel.

### Schritt 5 — Wertkorridor-Rohinventar

**WERTKORRIDOR-LOGIK:**

| Modell | Conservative | Neutral | Optimistic | Quelle |
|---|---|---|---|---|
| Crypto Base/DeFi (einheitlich, kein modellspezifischer Multiplikatorsatz im Bestand) | `finalScore·0.85` | `finalScore` | `finalScore·1.15` | `src/services/scoring.service.ts:31-37` |
| Enterprise 9-Faktor | `not_found` (kein eigener Corridor-Aufruf in `cryptoScoringService.ts`) | — | — | — |
| Meme-Coin | `not_found` | — | — | — |
| Rohstoffe | `not_found` (kein Corridor-Konzept implementiert, nur Einzelscore) | — | — | — |
| Aktien/Forex/Index/Bond | `not_found` | — | — | — |

**FAIRVALUEGAP:**
```
Formel: fairValueGapPct = marketReference > 0 ? ((neutral - marketReference) / marketReference) * 100 : 0
Quelle: src/services/scoring.service.ts:36
```
Auffälligkeit: `ValuationService.analyze()` (`src/services/valuation.service.ts:11`) übergibt `scores.marketCap` (0-100-Score) als `marketReference`; `CryptoOrchestrator.analyzeCrypto()` (`cryptoOrchestrator.ts:155`) übergibt echten USD-Preis an dieselbe Funktion — inkonsistente Einheiten zwischen den zwei Aufrufstellen.

**HYBRIDVALUE (falls vorhanden):** `not_found` — kein `RevenueMultiple`/`HybridValue`-Treffer im gesamten Repository (grep über `src/`, `server/`: 0 Treffer).

### Schritt 6 — Datenqualitäts-/Confidence-Rohinventar

**DATAQUALITYSCORE:**
```
Faktoren (Ist-Zustand, kein einheitliches Kompositmodell — 3 getrennte Formeln):
| Faktor | Gewicht | Berechnung | Quelle |
|---|---|---|---|
| dataCompletenessRatio (Crypto Enterprise/Meme) | implizit 100% (einziger Faktor) | usedFactors/(usedFactors+missingFactors) | cryptoScoringService.ts:127-169, memeCoinScoringService.ts:95 |
| missingRatio (Rohstoffe) | implizit 100% (einziger Faktor) | missingCount/18 | rawMaterialsScoring.ts:121-133 |
| manipulation_index-Schwelle (CryptoOrchestrator, 1. Herleitung, wird überschrieben) | n/a | manipulation_index>0.4?medium:high | cryptoOrchestrator.ts:143-147 |

Level (Crypto Enterprise/Meme):
| Level | Bereich | Quelle |
|---|---|---|
| high | dataCompletenessRatio >= 0.7 | cryptoScoringService.ts:127-169 |
| medium | >= 0.4 | dito |
| low | > 0 | dito |
| unknown | sonst | dito |

Level (Rohstoffe):
| Level | Bereich | Quelle |
|---|---|---|
| high | missingRatio <= 0.15 | rawMaterialsScoring.ts:122-133 |
| medium | <= 0.35 | dito |
| low | <= 0.6 | dito |
| unknown | > 0.6 | dito |

Schwellenwerte: source_coverage/freshness/supply_transparency/exchange_breadth/outlier_stability als benannte Kompositfaktoren: not_found — kein Treffer im gesamten Repo für diese exakten Feldnamen als DataQualityScore-Bestandteil.
Quelle: cryptoScoringService.ts, memeCoinScoringService.ts, rawMaterialsScoring.ts, cryptoOrchestrator.ts (jeweils unabhängig implementiert)
```

**CONFIDENCE-SCORE:**
```
Formel (Rohstoffe, einzige explizite Confidence-Formel im Bestand):
confidence = max(0.15, baseConfidence(default 0.90) - missingCount * 0.04)
Quelle: rawMaterialsScoring.ts:136-138

Formel (Krypto Tiering, klassifikationsbasiert):
confidence = tier===1 ? 0.95 : tier===2 ? 0.82 : 0.60
Quelle: classification.service.ts:67

Formel (Krypto Enterprise/Meme, aus Datenvollständigkeit):
classification.confidence = dataCompletenessRatio (2 Dezimalstellen)
Quelle: cryptoScoringService.ts, memeCoinScoringService.ts

Multiplikatoren (data_quality_multiplier, source_count_multiplier, freshness_multiplier als benannte Konstrukte): not_found — keine dieser drei Multiplikator-Konzepte existiert im Code unter diesem Namen.
Schwellenwert für Ranking-Zulassung: confidence >= 0.65 (ranking.service.ts:17-22)
Quelle: siehe oben, drei unabhängige Formeln ohne gemeinsame Basis
```

**MISSING-FIELD-BEHANDLUNG:**

| Szenario | Verhalten | Quelle |
|---|---|---|
| Fehlender Krypto-Scoring-Faktor | Ausschluss aus Gewichtssumme, proportionale Neugewichtung der verbleibenden Faktoren (kein Nullwert-Fallback) | `realMarketSignals.ts:176` (`renormalizeAndScore`) |
| Fehlendes Rohstoff-Inputfeld | Fallback-Wert 50 für die Berechnung, aber Feld wird in `missing_fields[]` erfasst und mindert `confidence` um 0.04/Feld | `rawMaterialsScoring.ts:52-59, 136-138` |
| Fehlende Supply-Transparenz-Daten | `undefined` statt 0/50 (kein Fallback-Wert) | `realMarketSignals.ts:60` |

### Schritt 7 — Datenquellen-Rohinventar

**DATENQUELLEN-INVENTAR:**

| Name | Typ | Assetklasse | Endpunkt | Auth | Rate-Limit | Frequenz | Failover | Pfad |
|---|---|---|---|---|---|---|---|---|
| CoinMarketCap | REST (Server-Proxy) | Krypto | `pro-api.coinmarketcap.com` | `COINMARKETCAP_API_KEY` (Header `X-CMC_PRO_API_KEY`) | nicht dokumentiert, 60s-Cache | on-demand, 60s-Cache | → CoinGecko | `server.ts:569-586` |
| CoinGecko | REST | Krypto + Historie | `api.coingecko.com` | keine (public) | 429-Handling mit Cooldown | on-demand, 60s-Cache | → Binance | `server.ts:637-650`, `assetRegistry.ts:604` |
| Binance | REST | Krypto (Fallback 1) | `api.binance.com` | keine | nicht dokumentiert | Fallback | → Kraken | `server.ts:697-705` |
| Kraken | REST | Krypto (Fallback 2) | `api.kraken.com` | `KRAKEN_API_KEY/SECRET` deklariert, Public-Ticker ungenutzt-authentifiziert | nicht dokumentiert | Fallback | → Coinbase | `server.ts:729-733` |
| Coinbase | REST | Krypto (Fallback 3) | `api.coinbase.com` | keine | nicht dokumentiert | letzter Fallback | — | `server.ts:775-782` |
| Stooq | REST/CSV | Aktien/Forex/Rohstoffe | `stooq.com` | keine | nicht dokumentiert | on-demand + Historie | — | `server.ts:851-856`, `assetRegistry.ts:630` |
| Alpha Vantage | REST | Aktien | `www.alphavantage.co` | `ALPHA_VANTAGE_KEY` | nicht dokumentiert | on-demand | — | `server.ts:1188-1196` |
| NewsAPI.org | REST | News/Sentiment | `newsapi.org` | `NEWS_API_KEY` (Query-Param) | nicht dokumentiert | on-demand | — | `server.ts:1372-1377` |
| Supabase | DB/Auth | alle | `*.supabase.co` | Anon-/Service-Role-Keys | N/A (managed) | kontinuierlich | — | `src/supabaseClient.ts`, `server/db.ts` |
| Stripe | REST/Billing | Billing | `api.stripe.com` (SDK) | Secret/Publishable/Webhook-Keys | N/A (SDK-managed) | Event-getrieben | — | `server/stripe.ts` |
| Google Gemini | REST/LLM | alle Agenten | Google-Cloud-SDK | `GEMINI_API_KEY` | nicht dokumentiert | pro Analyse | 2-Modell-Kette nur bei Rohstoff-Agenten | `server/ai.ts`, `src/agents/*.ts` |
| SMTP | SMTP | E-Mail | `SMTP_HOST` (Var, unset im Beispiel) | `SMTP_USER/PASSWORD` | N/A | Event-getrieben | — | `server/mailer.ts` |

**ON-CHAIN-DATEN:** `not_found` — kein RPC-Endpoint, keine Contract-Adresse, kein Subgraph-URL im gesamten Repo. `CryptoOnChainAgent` liefert LLM-geschätzte Werte ohne Blockchain-Anbindung (`src/agents/cryptoOnChainAgent.ts:31`, explizit als hypothetisch kommentiert).

**DATENBANKEN:**

| Typ | Verbindung (Variablenname) | ORM | Pfad |
|---|---|---|---|
| PostgreSQL (Supabase-managed) | `VITE_SUPABASE_URL` + `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY` | keins — direkter `@supabase/supabase-js`-Client, kein Prisma/TypeORM/Sequelize | `src/supabaseClient.ts`, `server/db.ts` |

**CACHING:**

| Cache-Typ | Konfiguration | Pfad |
|---|---|---|
| In-Memory (Map-basiert) | 60s TTL für Marktdaten, Request-Coalescing gegen Cache-Stampede | `server.ts` (Marktdaten-Endpunkte) |
| Redis/Memcached | `not_found` (nur in `docs/ceo/EXECUTIVE_SUMMARY.md` als aspirationale Techstack-Erwähnung, nicht im Code) | — |

### Schritt 8 — Konfigurationsdateien-Rohinventar

```
Datei: src/config/weights.ts
Zweck: Gewichtssätze für Crypto Base/DeFi-Scoring (scoring.service.ts)
Version: nicht versioniert (keine Versions-Property im Modul)
Inhalt:
export const baseWeights = {
  marketCap: 0.15, liquidity: 0.13, volatility: 0.10, tokenomics: 0.07,
  supplyTransparency: 0.05, networkActivity: 0.12, security: 0.12,
  utility: 0.09, adoption: 0.07, risk: 0.06, sentiment: 0.04
} as const;
export const defiWeights = {
  liquidity: 0.22, tokenomics: 0.16, marketCap: 0.08, volatility: 0.08,
  utility: 0.16, adoption: 0.10, security: 0.12, networkActivity: 0.05, risk: 0.03
} as const;

---

Datei: src/config/rawMaterialsConfig.ts
Zweck: versionierte Scoring-Gewichte + statische 10-Material-Datenbank für Rohstoff-Scoring
Version: v0.5.4 (aktiv), v0.6.0 (inaktiv, identisch)
Inhalt (Gewichtsteil):
export const SCORING_VERSIONS = {
  'v0.5.4': { weights: { fundamentals: 0.35, risk: 0.20, liquidity: 0.15, processing: 0.20, strategicValue: 0.10 } },
  'v0.6.0': { weights: { fundamentals: 0.35, risk: 0.20, liquidity: 0.15, processing: 0.20, strategicValue: 0.10 } }
};
export const ACTIVE_VERSION = 'v0.5.4';
(zzgl. RAW_MATERIALS_DATABASE mit 10 Einträgen: lithium, copper, uranium, gold, crudeoil,
silicon, cobalt, recycling_steel, wheat, +1 — je ~19 numerische Attribute 0-100)

---

Datei: src/config/ownerConfig.ts
Zweck: Owner-/PII-Handhabung (kein Scoring-Bezug); zentralisiert öffentliche Kontaktdaten,
dokumentiert Entfernung einer vormals hart codierten privaten E-Mail aus Frontend-Bundles
Version: nicht versioniert

---

Datei: .ai/registry/ess-registry.json
Zweck: Governance-Registrierung der ESS-Skill-Nummern (kein Scoring-Bezug)
Version: — (Registry selbst); Inhalt: ESS-0001 bis ESS-0013 als "published", frei ab ESS-0014

---

Datei: .ai/registry/exception-registry.json
Zweck: 8 Strukturausnahmen (EXC-0001…EXC-0008) zur kanonischen Repo-Layout-Regel
Version: —
```

`not_found`: kein `config/`-Verzeichnis auf Root-Ebene; keine YAML-Gewichtsdateien; keine `config/development.json`/`config/production.json`/`.env.development`/`.env.production` (nur ein einziges `.env.example` für alle Umgebungen).

### Schritt 9 — Skill-Layer-Rohinventar

**SKILL-LAYER-INVENTAR:**

| Layer | Name | Zweck | Eingaben | Ausgaben | Events | Downstream | Pfad |
|---|---|---|---|---|---|---|---|
| ESS-0001…0013 (+ Contracts-Companions) | Enterprise Specification Standard Skills | Governance-Spezifikation für KI-Agenten-Zusammenarbeit (Definition, nicht Ausführung) | n/a (Markdown-Spezifikation) | n/a | n/a (rein dokumentarisch) | — | `.ai/skills/*.md` |
| SKILL-GOV-0001 | Documentation Governance Validator | 57 Governance-Regeln über 9 Bereiche | Repo-Zustand | Findings-Liste | n/a | Reporting | `.ai/skills/Documentation-Governance-Validator.md` |
| SKILL-EVT-0001 | Enterprise Event Mesh | Event-Bus-Spezifikation | n/a | n/a | Event-Katalog (>30 Events) | `src/platform/EventMesh` | `.ai/skills/Enterprise-Event-Mesh.md` |
| EventMesh (einzige lauffähige Implementierung) | Event-Bus | Pub/Sub für Systemereignisse | `EventRegisteredEvent`, `ConsumerSubscribedEvent`, u.a. | Event-Broadcast | >30 kanonische Events | `SystemAuditBridge` → `server/systemEvents.ts` | `src/platform/EventMesh/` |

**EVENT-SCHEMA:**

| Event | Auslöser | Payload | Consumer | Pfad |
|---|---|---|---|---|
| `data.validated`/`data.rejected`/`data.needs_review` | spezifiziert, `not_found` als implementierter Event-Typ | — | — | `docs/integration-plan.md` (nur Plandokument) |
| `score.approved`/`score.rejected`/`score.review_required` | spezifiziert, `not_found` als implementierter Event-Typ | — | — | dito |
| `report.completed`/`roadmap.completed`/`workflow.completed` | spezifiziert, `not_found` als implementierter Event-Typ | — | — | dito |
| `SystemAuditEvent` | implementiert | Audit-Metadaten | `server/systemEvents.ts` (Bridge) | `src/platform/EventMesh/Services/SystemAuditBridge` |
| `EventRegisteredEvent`, `ConsumerSubscribedEvent`, `VersionApprovedEvent`, `ArchitectureDecisionApprovedEvent` | implementiert (EventMesh-Katalog) | typisiert je Event | EventMesh-interne Subscriber | `src/platform/EventMesh/Events/` |

**WORKFLOW-PIPELINE:**
```
1. [Repository-Scan] → Event: n/a (keine Event-Kopplung im Bestand)
2. [Klassifizierung/Scoring über Orchestratoren] → Event: n/a
3. [EventMesh SystemAuditEvent bei Admin-Aktionen] → Event: SystemAuditEvent
Hinweis: Eine durchgängige Event-Pipeline data.validated→score.approved→report.completed
ist NUR spezifiziert (docs/integration-plan.md), nicht implementiert — Checkliste im Dokument
zeigt größtenteils unbestätigte [ ]-Punkte.
```

### Schritt 10 — Assetklassen-Abdeckung (Detail je Klasse)

```
Assetklasse: Crypto (Standard/DeFi)
Implementierungsstatus: fully_implemented (mit Synthetic-Data-Caveat für die meisten der ~300 generierten Coins)
Kategorien: 25 Werte (CryptoCategory-Typ), Classifier weist real nur 6 zu (Layer 1, DeFi, Oracle, Layer 2, Meme, Unknown)
Unterkategorien: 8 Werte (CryptoSubCategory-Typ), Classifier weist real nur 4 zu (Chain-native Asset, Protocol Token, Ecosystem Token, Unknown)
Asset-Typen: coin, token, stablecoin, wrapped, derivative, governance, yield, index, unknown
Tier-Logik: hart codierte Symboltabelle, 3 Stufen (siehe Schritt 4)
Pfad: src/types/crypto.types.ts, src/services/classification.service.ts

---

Assetklasse: Crypto (Meme, Enterprise-9-Faktor — parallele Typwelten)
Implementierungsstatus: partial (eigenes, inkompatibles CryptoClassification-Schema)
Kategorien: nur "Crypto"|"Unknown" (crypto.ts-Variante)
Unterkategorien: freitextbasiert (3 hart codierte Symbol-Sonderfälle: BTC/ETH/SOL bzw. DOGE/SHIB/PEPE)
Asset-Typen: n/a
Tier-Logik: nicht vorhanden in diesem Teilsystem
Pfad: src/types/crypto.ts, src/services/cryptoScoringService.ts, src/services/memeCoinScoringService.ts

---

Assetklasse: Rohstoffe (Commodity)
Implementierungsstatus: fully_implemented für 10 DB-Einträge, partial darüber hinaus
Kategorien: 6 Werte (Metal, Energy, Agriculture, Industrial, Recycling, Unknown)
Unterkategorien: nicht als eigener Typ, nur als Freitext in RAW_MATERIALS_DATABASE-Einträgen
Asset-Typen: n/a (kein asset_type-Feld)
Tier-Logik: nicht vorhanden — nur is_critical-Boolean-Flag
Pfad: src/types/rawMaterials.ts, src/config/rawMaterialsConfig.ts

---

Assetklasse: Aktien (Equity)
Implementierungsstatus: defined_only (nur Asset.type==='stock'-Literal)
Kategorien: not_found
Unterkategorien: not_found
Asset-Typen: not_found
Tier-Logik: not_found
Pfad: src/types.ts (Asset.type), src/lib/assetRegistry.ts (RegistryAsset.type)

---

Assetklasse: Forex
Implementierungsstatus: defined_only (10 hart codierte Paare, keine Kategorien)
Kategorien: not_found
Unterkategorien: not_found
Asset-Typen: not_found
Tier-Logik: not_found
Pfad: src/lib/assetRegistry.ts

---

Assetklasse: Index
Implementierungsstatus: defined_only (30 prozedural generierte Indizes)
Kategorien: not_found
Unterkategorien: not_found
Asset-Typen: not_found
Tier-Logik: not_found
Pfad: src/lib/assetRegistry.ts

---

Assetklasse: Bond
Implementierungsstatus: defined_only (nur 3 hart codierte Symbole: US10Y, DE10Y, AAA-CORP)
Kategorien: not_found
Unterkategorien: not_found
Asset-Typen: not_found
Tier-Logik: not_found
Pfad: src/lib/assetRegistry.ts

---

Assetklasse: ETF
Implementierungsstatus: not_found
Kategorien: not_found
Unterkategorien: not_found
Asset-Typen: not_found (kein 'etf'-Literal im RegistryAsset.type-Union)
Tier-Logik: not_found
Pfad: — (einzelne ETF-Symbole wie GLD/SLV sind unter type:'commodity' getypt, keine eigene Klasse)

---

Assetklasse: Derivative
Implementierungsstatus: not_found
Kategorien: not_found
Unterkategorien: not_found
Asset-Typen: nur als ungenutzter Enum-Wert in CryptoClassification.asset_type deklariert, nie zugewiesen
Tier-Logik: not_found
Pfad: src/types/crypto.types.ts (Enum-Deklaration ohne Implementierung)
```

**LÜCKEN-ANALYSE:**

| Assetklasse | Status | Fehlende Kategorien | Fehlende Metriken | Fehlende Modelle |
|---|---|---|---|---|
| Crypto | partial | 19 von 25 `CryptoCategory`-Werten nie zugewiesen | Manipulationsschutz-Metriken | Stablecoin-/RWA-Modell |
| Rohstoffe | partial | Unterkategorie-Taxonomie fehlt als Typ | Lagerbestände, Seasonality | Coverage über 10 DB-Assets hinaus |
| Aktien | defined_only | alle (Large/Mid/Small Cap, Sektoren) | alle Fundamentaldaten (P/E, ROE, D/E, FCF …) | vollständiges Faktor-Modell |
| Forex | defined_only | alle (G10/EM/Carry/Safe-Haven) | alle Makro-Metriken | vollständiges Modell |
| Index | defined_only | alle (Broad/Sector/Strategy/Vol/Thematic) | Breadth, Advance/Decline | vollständiges Modell |
| Bond | defined_only | alle (Gov/Corp IG/HY/Muni) | Duration, Spread, YTM, Rating | vollständiges Modell |
| ETF | not_found | alle | alle | vollständiges Modell |
| Derivative | not_found | alle | alle | vollständiges Modell |

### Schritt 11 — Typdefinitionen-Rohinventar (Auszug wichtigster Typen)

```
Typ: Asset (generischer UI-Typ)
Dateipfad: src/types.ts
Felder:
| Feld | Typ | Erforderlich | Beschreibung |
|---|---|---|---|
| symbol | string | ja | Ticker |
| name | string | ja | Anzeigename |
| type | 'crypto'\|'stock'\|'commodity'\|'forex'\|'index' | ja | kein 'bond'-Wert trotz Bond-Daten in RegistryAsset |
| subtype | 'memecoin'\|'standard' | nein | |
| price | number | ja | |
| change24h | number | ja | |
| score | number | ja | „Final Intelligent Score" |
| grahamScore | number | ja | |
| momentum | number | ja | |
| risk | string | ja | |
| status | string | ja | |
| scoreBasis | 'synthetic'\|'market-data'\|'heuristic' | nein | Herkunfts-Kennzeichnung (seit 2026-07-31) |

---

Typ: RegistryAsset
Dateipfad: src/lib/assetRegistry.ts:4-33
Felder:
| Feld | Typ | Erforderlich | Beschreibung |
|---|---|---|---|
| type | 'crypto'\|'stock'\|'forex'\|'commodity'\|'index'\|'bond' | ja | 6 Werte, kein 'etf'/'equity'/'derivative' |
| circulatingSupply/maxSupply/totalSupply | number\|null | nein | nur Krypto, real CMC/CoinGecko-gestützt |
| (weitere) price, change24h, expectedReturn, volatility, drift, risk, status, marketCap, volume24h, score, peRatio, debtToEquity, dividendYield | diverse | teils | |

---

Typ: CryptoClassification (Variante 1 — crypto.ts, "Enterprise")
Dateipfad: src/types/crypto.ts
Felder: category_main: "Crypto"|"Unknown"; category_sub: string; market_type: string; valuation_mode: string; confidence: number; reasoning: string[]

Typ: CryptoClassification (Variante 2 — crypto.types.ts, "Standard/DeFi", kanonisch)
Dateipfad: src/types/crypto.types.ts
Felder: category_main: CryptoCategory (25 Werte); category_sub: CryptoSubCategory (8 Werte);
asset_type: 9 Werte inkl. "derivative"; tier: 1|2|3; confidence: number; reasoning: string[]

Typ: CryptoClassification (Variante 3 — Agent-Rohausgabe, inline)
Dateipfad: src/agents/cryptoClassificationAgent.ts:9-16
Felder: category/sub_tier/market_structure/narrative_alignment/confidence/reasoning (freitextbasiert)

Hinweis: alle drei tragen denselben Typnamen, sind aber strukturell inkompatibel (0.12 in Teil A).

---

Typ: RawMaterialInput
Dateipfad: src/types/rawMaterials.ts
Felder: name (required), category_main (optional, 6-Wert-Enum) + 17 weitere optionale 0-100-Felder
(market_liquidity, volatility, trading_volume, ore_grade, tonnage, tonnage_reserve,
substitution_potential, recyclability, processing_complexity, infrastructure_availability,
extraction_costs, geopolitical_risk, supply_chain_risk, regulatory_risk, esg_risk,
producer_concentration, military_importance, industrial_importance)
```

`EquityCategory`/`EquitySubCategory`/generischer `Tier`-Typ (nicht-Krypto): `not_found`.

**JSON-SCHEMAS:** `not_found` — keine `*.schema.json`-Dateien im Repo; Validierung erfolgt ausschließlich über TypeScript-Typen + eine handgeschriebene Bounds-Validierung (`src/schemas/rawMaterialsValidation.ts`, keine Zod/Joi/Yup/express-validator-Bibliothek im Einsatz).

### Schritt 12 — API-Routen-Rohinventar

**API-ENDPUNKTE (Auszug, vollständige Liste in Abschnitt 0.13):**

| Methode | Pfad | Request-Schema | Response-Schema | Services | Auth | Pfad |
|---|---|---|---|---|---|---|
| GET | `/api/crypto/list` | Query-Params | `CryptoAnalysisPayload[]` | `cryptoOrchestrator` | keine | `src/routes/cryptoRoutes.ts:17-63` |
| POST | `/api/crypto/analyze` | `{symbol}` | `CryptoAnalysisPayload` | `cryptoOrchestrator` | quotiert | dito |
| POST | `/api/crypto/score` | `{symbol, inputs?}` | `CryptoAnalysisPayload` | `scoring.service` | quotiert | `cryptoRoutes.ts:89-130` |
| GET | `/api/crypto/top10` | — | `CryptoAnalysisPayload[10]` | `ranking.service` | keine | `cryptoRoutes.ts:136-185` |
| GET/POST | `/api/raw-materials/list`, `/analyze`, `/score` | Materialname | `AnalysisPayload` | `rawMaterialsOrchestrator`, `rawMaterialsScoring` | teils quotiert | `src/routes/rawMaterialsRoutes.ts` |
| GET | `/api/market-data` | Query-Params | Multi-Provider-JSON | Fallback-Kette | keine | `server.ts:1039` |
| GET/POST | `/api/crypto-scoring/:symbol` | Symbol-Param, optional Inputs | `CryptoAnalysisPayload` (Enterprise) | `CryptoScoringService` | `enforceScreeningQuota` | `server.ts:1479, 1518` |
| GET | `/api/scoring/validation` | Query (`horizonDays`,`threshold`) | Hit-Rate-Statistik | `scoreValidation.ts` | Admin | `server/scoreValidation.ts:177` |
| GET | `/api/compliance/dashboard`, `/risk`, `/certificates` | — | Compliance-Report-JSON | `server/compliance/*` | `ADMIN_ZONE_ROLES` | `server/compliance/router.ts` |
| POST | `/api/compliance/run`, `/certify` | — | Scan-Ergebnis | `server/compliance/scanners.ts` | `ADMIN_ZONE_ROLES` | dito |
| GET | `/api/admin/system-events`, `/agents`, `/orchestrators/status` | — | Telemetrie-JSON | `systemEvents.ts` | Supervisor/Admin-Rollen | `server/systemEvents.ts` |
| GET | `/api/orchestrator/stats`, `/ping-models` | — | Queue-/Modell-Status | `requestOrchestrator` | öffentlich (stats), Admin (config/reset) | `server/orchestrator.ts` |
| GET | `/healthz` | — | `{configured: {supabase, gemini}}` | — | keine | `server.ts:305` |
| GET | `/metrics` | — | Prometheus-Text | — | statischer `METRICS_TOKEN`-Header | `server.ts:323` |

**MIDDLEWARE:**

| Middleware | Zweck | Pfad |
|---|---|---|
| `checkAdminAccess()` | Rollenbasierte Autorisierung (`ADMIN_ZONE_ROLES`/`SUPERVISOR_ZONE_ROLES`) | `server/iam/authMiddleware.ts` |
| `enforceScreeningQuota` | Free/Starter-Tier-Kontingentierung für Scoring-Endpunkte | `server/quota.ts` |
| `orchestrator.handle(endpointKey)` | Rate-Limit (30/60s/IP) + Concurrency-Cap (3) + FIFO-Queue | `src/lib/requestOrchestrator.ts:175` |
| `requestContext()` | Correlation-ID-Propagation (`x-request-id`) für strukturiertes Logging | `server/logger.ts` |
| Stripe-Webhook-Signaturprüfung | Rohbody-Verifikation vor JSON-Parsing | `server/stripe.ts` |

### Schritt 13 — Audit-/Compliance-Rohinventar

**AUDIT-TRAIL:**
```
Format: JSON-Zeilen (System-Event-Log) + relationale Tabellen (IAM-Audit, Security-Events, Compliance-Runs)
Pflichtfelder (System-Event-Log): id, timestamp, action, userEmail, details, status (SUCCESS/WARNING/FAILED), ip
Pflichtfelder (audit_logs_iam): actor_user_id, target_user_id, action, previous_value, new_value (JSONB), created_at
Speicherung: server/systemEvents.ts (Datei, uploads/system_events.json, Cap 100 Einträge) + SSE-Broadcast;
Supabase-Tabellen audit_logs_iam/iam_access_log/security_events (Append-only, RLS service_role-only)
Quelle: server/systemEvents.ts, supabase/migrations/20260711000000_iam.sql, 20260731000400_security_events_stepup_totp.sql
```
Hinweis: ein Audit-Trail **pro Scoring-Berechnung** (wie im Master-Prompt für Abschnitt 10.1 gefordert) existiert nicht — die vorhandenen Audit-Mechanismen decken IAM-/Security-/Compliance-Events ab, nicht Scoring-Nachvollziehbarkeit (siehe Teil B, Abschnitt 10.1: `new`).

**LOGGING:**

| Logger | Level | Format | Pfad |
|---|---|---|---|
| Custom-Logger (kein winston/pino/morgan, bewusste Entscheidung) | info/warn/error | JSON-Line | `server/logger.ts` |
| `console.*` (unmigriert, ca. 279 Aufrufe repo-weit) | — | Plain-Text | verstreut über `server.ts`/`server/`/`src/` |

**COMPLIANCE:**

| Komponente | Konfiguration | Pfad |
|---|---|---|
| Compliance-Scanner (21 Scanner) | Kategorien SECURITY(7)/DATA(5)/BILLING(3)/CODE_QUALITY(3)/GOVERNANCE(3); `complianceScore=max(0,100-Σseverity)`, `SEVERITY_WEIGHT={CRITICAL:40,HIGH:25,MEDIUM:12,LOW:5}` | `server/compliance/scanners.ts` |
| ISO/IEC-27001-Mapping | selbstbewertet, **nicht zertifiziert** (explizit gekennzeichnet) | `server/compliance/router.ts:38-45` |
| DSGVO/BaFin-Dokumentation | Art.-30-Verarbeitungsverzeichnis, TOMs (Art. 32) | `docs/DATENSCHUTZ_PROTOKOLL.md` |

### Schritt 14 — Dokumentations-Rohinventar

94 Markdown-Dateien wurden vollständig erfasst (siehe Teil A, Abschnitt 0.15 für die Zusammenfassung der zentralen Selbstaudits). Vollständige Datei-für-Datei-Tabelle mit Titel/Zusammenfassung/Datum/Abweichung: dokumentiert in der Recherchegrundlage dieses Reports (3 parallele Vollaudit-Durchläufe); zentrale Erkenntnis für die Bewertungsspalte „Abweichung zur Implementierung":

| Kategorie | Anzahl Dateien | Zentrale Abweichung |
|---|---|---|
| Root (README/AGENTS) | 2 | Versionspin-Widerspruch (0.5.4 vs. 0.6.0) |
| `docs/` Top-Level (API/Architecture-Review/Compliance/Scoring-Model/…) | 17 | `COMPLIANCE_REPORT.md`/`SECURITY_AUDIT.md` optimistisch selbstzertifiziert, durch spätere Audits widerlegt |
| `docs/adr/` (inkl. `resolved/`) | 22 | mehrere ADRs mit Status „🟡 IN PROGRESS" trotz beschriebener Fertigstellung |
| `docs/architecture/` (Governance-/Reifegrad-Audits) | 14 | dies sind die **verlässlichsten** Quellen — Selbstaudits mit Scores 0-55/100 |
| `docs/backend/`, `frontend/`, `code-quality/`, `content-creator/`, `security/`, `seo/`, `qa/` | 7 | `qa/TEST_PLAN_AND_QA.md` behauptet „Certified & Production Ready" — widerlegt durch 0 vorhandene Tests für die beschriebenen Bereiche |
| `docs/backlog/` | 5 | — |
| `docs/ceo/`, `migration/`, `reports/`, `runbooks/` | 6 | `EXECUTIVE_SUMMARY.md` nennt Redis/Sentry — nicht im Code auffindbar |
| `docs/traceability/` | 7 | ETM selbst-dokumentiert als „spezifiziert, nicht implementiert" |

### Schritt 15 — Test-/Backtesting-Rohinventar

**TEST-INVENTAR:**

| Datei | Getestete Komponente | Test-Anzahl | Pfad |
|---|---|---|---|
| `rankingService.test.ts` | `calculateRankScore`, `isTop10Eligible` | 8 | `tests/unit/rankingService.test.ts` |
| `scoringService.test.ts` | Base/DeFi-Scoring, Value-Corridor | 16 | `tests/unit/scoringService.test.ts` |
| `memeCoinScoringService.test.ts` | Meme-Coin-Scoring/Klassifizierung | 12 | `tests/unit/memeCoinScoringService.test.ts` |
| `scoreValidation.test.ts` | Snapshot-Hit-Rate-Backtesting | ~11 | `tests/unit/scoreValidation.test.ts` |
| `complianceScanners.test.ts` | Compliance-Scanner-Struktur | 5 | `tests/unit/complianceScanners.test.ts` |
| `metrics.test.ts` | Prometheus-Format | 6 | `tests/unit/metrics.test.ts` |
| `aiUsageTracker.test.ts` | AI-Kosten-Tracking | 7 | `tests/unit/aiUsageTracker.test.ts` |
| `secretCrypto.test.ts` | TOTP-Secret-Verschlüsselung | 10 | `tests/unit/secretCrypto.test.ts` |
| `totp.test.ts` | TOTP 2FA | 7 | `tests/unit/totp.test.ts` |
| `quota.test.ts` | Screening-Kontingent | 6 | `tests/unit/quota.test.ts` |

Rohstoff-Scoring, Klassifizierungs-Agenten, `BacktestEngine.tsx`/`PortfolioBacktester.tsx`/`MonteCarloDetailed.tsx`: **keine Tests** (`not_found`).

**BACKTESTING:**

| Komponente | Implementierung | Datenquelle | Pfad |
|---|---|---|---|
| Score-Snapshot-Validierung | `recordDailySnapshots()`, `evaluateScoreValidation()` (TP/FP/TN/FN, `MIN_SAMPLE_SIZE=5`) | `score_snapshots`-Tabelle (Supabase) | `server/scoreValidation.ts` |
| Walk-Forward-Validierung | `not_found` | — | — |
| `BacktestEngine`/`PortfolioBacktester`/`MonteCarloDetailed` | reine Frontend-UI-Simulation, kein Backend-Engine-Pendant | `assetRegistry.getHistory()` (live oder simuliert, `source`-Feld) | `src/components/BacktestEngine.tsx` u.a. |

**CI/CD:**

| Pipeline | Trigger | Test-Step | Pfad |
|---|---|---|---|
| `CI` (einzige Pipeline) | `push: [main]`, `pull_request` | `npm ci → tsc --noEmit → vitest run → vite build+esbuild → predeploy:check` | `.github/workflows/ci.yml` |

`not_found`: Dependabot/Renovate, CodeQL/Security-Scan-Workflow, separate Deploy-/Staging-Pipeline (Deploy erfolgt extern via Render.com Auto-Deploy-on-Push).

---

# TEIL B — PHASE 2: ERWEITERTE ENTERPRISE-ARCHITEKTUR

Ab hier ist die Produktivumgebung **Ausgangsmaterial, nicht Vorgabe**. Jede Entscheidung (Übernahme vs. Neudefinition) ist begründet.

## 3. CORE ARCHITECTURE — KOMPONENTENREGISTER

| Komponente | Rolle | Eingaben | Ausgaben | Downstream | Versionierbar | Auditierbar | Quelle |
|---|---|---|---|---|---|---|---|
| Master Supervisor | Wählt Modell pro Asset, konsolidiert Score, löst Konflikte über DQ/Confidence/Priorität | `Universal Asset Interface`-Rohdaten | vollständiges Asset-Objekt inkl. `scores` | Ranking Agent, Reporting Agent | Ja (`calculation_version`) | Ja (`audit_trail`) | **neu** — Vorgänger war reines Dashboard-Register (0.3) |
| Classification Agent | Ordnet Asset in Klasse/Kategorie/Subkategorie/Typ/Tier ein | Symbol/ISIN + Rohdaten | `CryptoClassification`-artiges Objekt je Klasse | Fundamental/Risk/Valuation Agent | Ja | Ja | **extend** aus `ClassificationService` (0.3), Coverage erweitert |
| Fundamental Agent | Qualitäts-/Wertkennzahlen je Assetklasse | Klassifizierung + Metriken | Subscores | Ranking Agent | Ja | Ja | **extend** aus vier Agenten (0.3) |
| Risk Agent | Volatilität, Liquiditätsrisiko, Konzentration, Regulierung, Manipulation | Marktdaten | `RiskScore` (invertiert) | Ranking Agent | Ja | Ja | **extend**; Manipulationsschutz ist **new** |
| Valuation Agent | Wertkorridor, Modellwahl je Asset-Typ, FairValueGap | Scores + Referenzwert | `valuation_corridor` | Reporting Agent | Ja | Ja | **extend** aus `calculateValueCorridor` (0.6), auf alle Klassen generalisiert |
| Ranking Agent | `RankScore` aus FinalScore/DQ/Tier/Liquidität, Eligibility, Sortierung | alle Subscores | `rank_score`, `ranking_eligibility` | Reporting Agent | Ja | Ja | **extend** aus `ranking.service.ts` (0.5) |
| Data Quality Agent | Source-Coverage, Freshness, Supply-Transparenz, Exchange-Breadth, Outlier-Stabilität | Rohdatenherkunft | `data_quality`-Objekt | alle Agenten (Confidence-Multiplikator) | Ja | Ja | **new** (0.7 zeigt: nicht vorhanden) |
| Reporting Agent | Kompiliert Audit-Ergebnis, Markdown/JSON, Roadmap | alle Agent-Outputs | Report + `audit_trail` | — | Ja | Ja | **extend** aus bestehenden Markdown-Report-Mustern (docs/architecture/*) |
| Compliance Agent (optional) | Prüft Regulierungs-/Offenlegungsanforderungen | Asset + Klassifizierung | Compliance-Flags | Reporting Agent | Ja | Ja | **keep_as_is** — `server/compliance/scanners.ts` ist bereits geeignet, Scope auf Scoring-Assets erweitern |
| Backtesting Agent (optional) | Out-of-sample, Walk-Forward, Drift-Monitoring | historische Scores + Preise | Hit-Rate, Drift-Report | Reporting Agent | Ja | Ja | **extend** aus `server/scoreValidation.ts` (nur Snapshot-Hit-Rate vorhanden) |
| Regime Agent (optional) | Volatilitäts-/Trendregime, passt Gewichte an | Marktdaten-Zeitreihe | Regime-Label + Gewichts-Override | Fundamental/Risk Agent | Ja | Ja | **new** |
| Sentiment Agent (optional) | NLP-Sentiment aus News/Social | Textquellen | Sentiment-Score | Fundamental Agent | Ja | Ja | **extend** aus `CryptoSentimentAgent` (0.3), auf reale NewsAPI-Quelle statt LLM-Schätzung umstellen |

### 3.1 Master Supervisor — Entscheidungsregel
```
1. Classification Agent klassifiziert Asset → asset_class, category_main, tier
2. Supervisor wählt Modell: model_registry[asset_class][category_main] ?? model_registry[asset_class].default
3. Fundamental/Risk/Valuation Agents laufen parallel (Promise.all-Muster aus 0.3 übernommen — bewährt)
4. Data Quality Agent bewertet Eingaben BEVOR der Score konsolidiert wird
5. Bei confidence < 0.65 ODER data_quality.level === 'low': ranking_eligibility.eligible = false, aber Score wird trotzdem berechnet (Transparenz vor Ausschluss)
6. Konfliktregel bei widersprüchlichen Agent-Outputs: Priorität = Datenqualität > Confidence > Tiering (wie in Abschnitt 1 gefordert)
7. audit_trail wird bei jedem Schritt angehängt, nie überschrieben
```
Begründung: Das bestehende `Promise.all`-Parallelmuster (0.3) ist technisch bewährt und wird übernommen; die Konfliktregel und die Data-Quality-Vorprüfung sind neu, da in der Produktivumgebung keine Konfliktlösung existierte (0.3, „Konfliktlösung: nicht vorhanden").

---

## 4. UNIVERSAL ASSET INTERFACE

Wird unverändert aus dem Master-Prompt als harter Vertrag übernommen (keine Abweichung zulässig). Kompatibilitätshinweis zur Produktivumgebung: **keiner der bestehenden Typen** (`RegistryAsset`, `Asset`, `CryptoAnalysisPayload` ×2, `RawMaterials.AnalysisPayload`) erfüllt dieses Interface direkt — sie decken jeweils nur Teilmengen ab (z. B. fehlt überall `valuation_corridor.fair_value_gap_pct` als benanntes Feld unter diesem Pfad, `risk_flags` existiert nirgends als Array, `calculation_version` existiert nirgends). Empfehlung: ein **Adapter-Layer** pro Assetklasse, der die bestehenden Service-Outputs auf dieses Interface mappt, statt bestehende Services umzuschreiben (Begründung: Applikationsentkopplung, Prinzip 1).

```json
{
  "asset_id": "string",
  "symbol": "string",
  "name": "string",
  "asset_class": "crypto | equity | forex | index | bond | commodity | etf | derivative",
  "category_main": "string",
  "category_sub": "string",
  "asset_type": "string",
  "market": "string",
  "exchange": "string",
  "currency": "string",
  "tier": "1 | 2 | 3",
  "data_sources": ["string"],
  "required_metrics": ["string"],
  "optional_metrics": ["string"],
  "score_components": { "metric_name": "number (0-100)" },
  "weights": { "metric_name": "number (0-1)" },
  "risk_flags": ["string"],
  "confidence": "number (0-1)",
  "data_quality": {
    "level": "low | medium | high | unknown",
    "missing_fields": ["string"],
    "source_coverage": "number (0-1)",
    "freshness_minutes": "number"
  },
  "valuation_corridor": {
    "conservative": "number",
    "neutral": "number",
    "optimistic": "number",
    "fair_value_gap_pct": "number"
  },
  "ranking_eligibility": { "eligible": "boolean", "reason": "string" },
  "model_used": "string",
  "model_reasoning": "string",
  "audit_trail": ["string"],
  "calculation_version": "string"
}
```

**Mapping-Tabelle Bestand → Universal Asset Interface (Beispiel Krypto Base/DeFi)**:

| UAI-Feld | Bestandsquelle |
|---|---|
| `score_components` | `CryptoScores` (`crypto.types.ts`) |
| `weights` | `baseWeights`/`defiWeights` (`weights.ts`) |
| `confidence` | `classification.confidence` |
| `data_quality.level` | `data_quality.level` (bereits kompatibel) |
| `data_quality.source_coverage` | **neu** — aus `dataCompletenessRatio` ableitbar |
| `valuation_corridor.*` | `calculateValueCorridor()` (bereits fast kompatibel, nur Feldnamen anpassen: `fairValueGapPct`→`fair_value_gap_pct`) |
| `ranking_eligibility` | `isTop10Eligible()`-Ergebnis + Begründungstext (neu) |
| `audit_trail` | **neu** — bisher nicht persistiert |
| `calculation_version` | **neu** — nur Rohstoffe hatten bisher Versionierung (`SCORING_VERSIONS`) |

---

## 5. ASSETKLASSEN-TIEFENSTRUKTUR

### 5.1 KRYPTOWÄHRUNGEN

#### 5.1.0 Bestand aus Produktivumgebung
Vier parallele Modelle (Base/DeFi, Enterprise-9-Faktor, Meme-Coin), 25-Wert-`CryptoCategory`-Taxonomie (nur 6 Werte real zugewiesen), hart codierte Tier-1/2/3-Symbolliste (0.3, 0.5). Geeignet als Ausgangsbasis (`renormalizeAndScore`, Ranking-Formel), aber: drei inkompatible `CryptoClassification`-Typen müssen konsolidiert werden (**refactor**), Classifier-Coverage muss von 6 auf alle 25 Kategorien erweitert werden (**extend**), Meme-Coin-Risikofaktor fehlt (**extend**), Manipulationsschutz fehlt komplett (**new**).

#### 5.1.1 Kategorien und Unterkategorien
Hauptkategorien (übernommen aus bestehendem `CryptoCategory`-Typ, da bereits vollständig genug spezifiziert — Prinzip: geeignete Bestandstypen werden nicht neu erfunden): Layer 1, Layer 2, DeFi, Smart Contract Platform, Infrastructure, Oracle, Gaming, AI/Data, Payments, Privacy, Meme, Stablecoin, Exchange Token, Governance, Real World Assets, Storage/Compute, Interoperability, Liquid Staking, Restaking, Bridging, NFT/Creator, Derivatives, DAO/Community, Index/Basket, Utility Token.
Unterkategorien (übernommen): Chain-native Asset, Ecosystem Token, Protocol Token, Exchange-Backed Asset, Governance Asset, Synthetic Asset, Wrapped Asset, Yield Asset.
Asset-Typen: coin, token, stablecoin, wrapped, derivative, governance, yield, index.

#### 5.1.2 Datenquellen
Primär: CoinMarketCap, CoinGecko (bereits angebunden, **keep_as_is**). Sekundär/Failover: Binance, Kraken, Coinbase (bereits als Fallback-Kette implementiert, **keep_as_is**). On-Chain: **new** — echte RPC-/Subgraph-Anbindung fehlt (aktuell nur LLM-Schätzung); empfohlen als Backlog-Item, nicht Blocker für dieses Blueprint. Freshness-Anforderung: ≤5 Minuten für Tier 1, ≤15 Minuten für Tier 2/3.

#### 5.1.3 Metriken und Kennzahlen
Pflicht: `marketCap, liquidity, volatility` (real-marktdatenbasiert, wie 0.4 Modell 1). Optional: `tokenomics, supplyTransparency, networkActivity, security, utility, adoption, risk, sentiment` (agentenbasiert). Normalisierung: `renormalizeAndScore()` unverändert übernommen (0.18: `keep_as_is`).

#### 5.1.4 Bewertungsmodell und Scoring-Formel
**Übernommen** (Base/DeFi-Gewichte aus 0.4, Begründung: bereits testabgedeckt, Gewichtsumme korrekt, dynamische Neugewichtung robust gegen fehlende Daten):
```
BaseModel:  score = 0.15·mCap + 0.13·liq + 0.10·(100-vol) + 0.07·tok + 0.05·supTr
                   + 0.12·netAct + 0.12·sec + 0.09·util + 0.07·adopt + 0.06·(100-risk) + 0.04·sent
DeFiModel:  score = 0.08·mCap + 0.22·liq + 0.08·(100-vol) + 0.16·tok + 0.16·util
                   + 0.10·adopt + 0.12·sec + 0.05·netAct + 0.03·(100-risk)
```
**Neu ergänzt**: Stablecoin-Modell und RWA/Yield-Modell (in Produktivumgebung nur als Konzept in Master-Prompt-Vorschlag genannt, im Code nicht existent → **new**):
```
StablecoinModel: score = 0.35·complianceScore + 0.30·reserveQuality + 0.20·supplyTransparency + 0.15·liquidity
RWAYieldModel:   score = 0.30·compliance + 0.25·utility + 0.25·revenue + 0.20·adoption
```
Modellauswahl-Logik (erweitert aus `selectModel()`, 0.4):
```
category_main === "Stablecoin" → StablecoinModel
category_main === "DeFi"       → DeFiModel
category_main === "Real World Assets" → RWAYieldModel
category_main === "Meme"       → MemeModel (0.4 Modell 3, übernommen, um Risikofaktor ergänzt)
sonst                          → BaseModel
```
Risikoadjustierung: `(100-risk)`-Invertierung übernommen. Wertkorridor: `conservative=0.85·final, optimistic=1.15·final` für BaseModel (übernommen); für DeFiModel enger gefasst `0.82/1.18` (wie im Master-Prompt als Beispiel vorgeschlagen — **neu**, da Produktivumgebung nur einen einzigen fixen Multiplikator-Satz für alle Krypto-Modelle nutzte, was die höhere Varianz von DeFi-Assets nicht abbildet).

#### 5.1.5 Risikofaktoren
Volatilität, Liquiditätsrisiko (Turnover <5 %/Tag = Flag), Tokenomics-Konzentration (Top-10-Wallets, sofern verfügbar), Smart-Contract-Risiko (Audit-Status, agentenbasiert), Manipulationsrisiko (`manipulation_index`, übernommen aus `CryptoRiskAgent`, 0.3 — **extend** um einen echten statistischen Outlier-Check auf Preis-/Volumensprünge, aktuell nur LLM-Schätzung). Gewichtung: fließt als `risk`-Subscore mit 0.03–0.06 in den Final Score, zusätzlich als `risk_flags`-Array im UAI unabhängig vom Score gemeldet.

#### 5.1.6 Ranking-Regeln
Übernommen aus `ranking.service.ts` (0.5), generalisiert:
```
rankScore = 0.70·finalScore + 0.15·dataQualityScore + 0.10·tierScore + 0.05·liquidityStability
```
Eligibility: `confidence≥0.65 ∧ liquidity≥50 ∧ data_quality≠'low'` (übernommen). **Neu ergänzt**: Tie-Breaking `Liquidität → Data Quality → Risk` (im Bestand nicht vorhanden, 0.5). Tier-spezifisch: Tier 3 zusätzlich `confidence≥0.75` (verschärft, da 0.60 Basis-Confidence aus der hart codierten Symboltabelle sonst automatisch durchrutscht).

#### 5.1.7 Beispiel-JSON
```json
{
  "asset_id": "crypto-eth-001",
  "symbol": "ETH",
  "name": "Ethereum",
  "asset_class": "crypto",
  "category_main": "Layer 1",
  "category_sub": "Chain-native Asset",
  "asset_type": "coin",
  "market": "global",
  "exchange": "aggregated",
  "currency": "USD",
  "tier": "1",
  "data_sources": ["coinmarketcap", "coingecko", "binance"],
  "required_metrics": ["marketCap", "liquidity", "volatility"],
  "optional_metrics": ["tokenomics", "networkActivity", "security", "utility", "adoption", "risk", "sentiment"],
  "score_components": {"marketCap": 92, "liquidity": 88, "volatility": 61, "networkActivity": 84, "security": 90, "utility": 82, "adoption": 87, "risk": 22, "sentiment": 70},
  "weights": {"marketCap": 0.15, "liquidity": 0.13, "volatility": 0.10, "networkActivity": 0.12, "security": 0.12, "utility": 0.09, "adoption": 0.07, "risk": 0.06, "sentiment": 0.04, "tokenomics": 0.07, "supplyTransparency": 0.05},
  "risk_flags": [],
  "confidence": 0.95,
  "data_quality": {"level": "high", "missing_fields": [], "source_coverage": 0.9, "freshness_minutes": 3},
  "valuation_corridor": {"conservative": 74.4, "neutral": 87.5, "optimistic": 100.6, "fair_value_gap_pct": 2.1},
  "ranking_eligibility": {"eligible": true, "reason": "confidence>=0.65, liquidity>=50, data_quality=high"},
  "model_used": "BaseModel",
  "model_reasoning": "category_main=Layer 1 -> default BaseModel",
  "audit_trail": ["classification:v1.1@2026-08-01", "scoring:BaseModel:v1.1@2026-08-01", "ranking:v1.0@2026-08-01"],
  "calculation_version": "crypto-base-1.1.0"
}
```

#### 5.1.8 YAML-Konfigurationsbeispiel
```yaml
model: crypto-base
version: 1.1.0
weights:
  marketCap: 0.15
  liquidity: 0.13
  volatility: 0.10
  tokenomics: 0.07
  supplyTransparency: 0.05
  networkActivity: 0.12
  security: 0.12
  utility: 0.09
  adoption: 0.07
  risk: 0.06
  sentiment: 0.04
inverted: [risk, volatility]
thresholds:
  top10_eligibility:
    min_confidence: 0.65
    min_liquidity: 50
    max_data_quality: low   # exclusive
value_corridor:
  conservative_multiplier: 0.85
  optimistic_multiplier: 1.15
```

---

### 5.2 AKTIEN

#### 5.2.0 Bestand aus Produktivumgebung
Kein dediziertes Modell — nur die generische Momentum/Pattern-Heuristik (0.4 Modell 5, `server.ts:454-479`) und ein optionaler, nicht direkt verknüpfter Graham/DCF-Rechner (`BuffetValueCheck.tsx`, laut Frontend-Audit: `consensusValue = dcfValue·0.8 + grahamValue·0.2` für stabile Aktien, sonst einfacher Durchschnitt). Keine Kategorietaxonomie, kein `EquityCategory`-Typ. Bewertung (0.18): **replace** für das Scoring, **extend** für die Graham/DCF-Logik (fachlich brauchbar, aber isoliert — wird als Sub-Faktor integriert statt neu erfunden).

#### 5.2.1 Kategorien und Unterkategorien
Hauptkategorien: Large Cap, Mid Cap, Small Cap, Micro Cap, Growth, Value, Dividend, High Beta, Blue Chip, Penny Stock.
Sektoren: Technologie, Finanzen, Gesundheit, Energie, Verbrauchsgüter, Industrie, Materialien, Versorger, Immobilien, Telekommunikation.
Asset-Typ: `common_stock | preferred_stock | adr`.

#### 5.2.2 Datenquellen
Primär: Alpha Vantage (bereits angebunden, 0.8), Stooq (bereits angebunden, Historie). Sekundär: **neu zu ergänzen** — Fundamentaldaten (Bilanzen/Earnings) sind über keine der bestehenden Quellen abgedeckt; Alpha Vantage bietet Fundamentals-Endpunkte, aktuell nur Quote-Endpunkt genutzt (**extend**). Freshness: Kurs ≤15 Min. (Handelszeiten), Fundamentaldaten ≤1 Quartal.

#### 5.2.3 Metriken und Kennzahlen
Pflicht: P/E, P/B, ROE, Debt/Equity, Free Cash Flow. Optional: ROA, Earnings Growth, Revenue Growth, Margin Trends, Earnings Revisions, Earnings Tone (FinBERT), Insider Activity, Institutional Ownership, Short Interest, Analyst Consensus, Price Momentum, Relative Strength. Normalisierung: Branchenrelative Perzentil-Skalierung (0-100) statt globaler Min-Max, da P/E etc. stark sektorabhängig streuen — **neu**, da Bestand keine Normalisierung für diese Felder kennt.

#### 5.2.4 Bewertungsmodell und Scoring-Formel
**Neu definiert** (Bestand ungeeignet, da rein technisch ohne Fundamentaldaten):
```
QualityValueModel:    score = 0.25·qualityScore(ROE,ROA,D/E) + 0.30·valueScore(P/E,P/B,grahamMargin)
                             + 0.20·growthScore(EarningsGrowth,RevenueGrowth) + 0.15·momentumScore
                             + 0.10·(100-risk)
GrowthMomentumModel:   score = 0.35·growthScore + 0.30·momentumScore + 0.20·analystConsensus + 0.15·(100-risk)
DividendIncomeModel:   score = 0.30·dividendYieldScore + 0.25·payoutSustainability + 0.25·qualityScore + 0.20·(100-risk)
DistressedRecoveryModel: score = 0.40·(100-riskScore) + 0.30·recoveryPotential + 0.30·valueScore
```
Modellauswahl: `category==="Growth" → GrowthMomentumModel; category==="Dividend" → DividendIncomeModel; category==="Penny Stock" → DistressedRecoveryModel; sonst → QualityValueModel`. Wertkorridor: `conservative=grahamValue, neutral=consensusValue(0.8·dcf+0.2·graham), optimistic=dcfValue·1.15` — **übernimmt** die bestehende `BuffetValueCheck.tsx`-Formel für den Neutral-Fall (Begründung: fachlich sinnvoll, bereits implementiert, nur bisher nicht ans Scoring angebunden), FairValueGap analog Krypto-Formel.

#### 5.2.5 Risikofaktoren
Volatilität, Verschuldungsgrad, Sektorkonzentration, Insider-Verkäufe, Short-Interest-Spike, Earnings-Miss-Historie, Delisting-Risiko (Penny Stocks). Gewichtung: 10–40 % je Modell (siehe 5.2.4), invertiert wie bei Krypto.

#### 5.2.6 Ranking-Regeln
Gleiche Grundformel wie 5.1.6 (`0.70·final+0.15·DQ+0.10·Tier+0.05·Liquidität`), Tier hier definiert über Marktkapitalisierung: Tier 1 = Large/Blue Chip, Tier 2 = Mid/Small Cap, Tier 3 = Micro/Penny. Eligibility zusätzlich: Mindest-Handelsvolumen (Liquiditätsfilter gegen Penny-Stock-Manipulation).

#### 5.2.7 Beispiel-JSON
```json
{
  "asset_id": "equity-aapl-001", "symbol": "AAPL", "name": "Apple Inc.",
  "asset_class": "equity", "category_main": "Blue Chip", "category_sub": "Large Cap",
  "asset_type": "common_stock", "market": "US", "exchange": "NASDAQ", "currency": "USD", "tier": "1",
  "data_sources": ["alphavantage", "stooq"],
  "required_metrics": ["pe_ratio", "pb_ratio", "roe", "debt_to_equity", "free_cash_flow"],
  "optional_metrics": ["earnings_growth", "revenue_growth", "analyst_consensus", "price_momentum"],
  "score_components": {"quality": 88, "value": 62, "growth": 71, "momentum": 74, "risk": 18},
  "weights": {"quality": 0.25, "value": 0.30, "growth": 0.20, "momentum": 0.15, "risk": 0.10},
  "risk_flags": [], "confidence": 0.88,
  "data_quality": {"level": "high", "missing_fields": [], "source_coverage": 0.85, "freshness_minutes": 12},
  "valuation_corridor": {"conservative": 165.0, "neutral": 182.4, "optimistic": 205.1, "fair_value_gap_pct": -1.8},
  "ranking_eligibility": {"eligible": true, "reason": "large_cap, liquidity ok"},
  "model_used": "QualityValueModel", "model_reasoning": "category=Blue Chip -> default QualityValueModel",
  "audit_trail": ["classification:v1.0@2026-08-01", "scoring:QualityValueModel:v1.0@2026-08-01"],
  "calculation_version": "equity-qv-1.0.0"
}
```

#### 5.2.8 YAML-Konfigurationsbeispiel
```yaml
model: equity-quality-value
version: 1.0.0
weights: {quality: 0.25, value: 0.30, growth: 0.20, momentum: 0.15, risk: 0.10}
inverted: [risk]
thresholds:
  top10_eligibility: {min_confidence: 0.60, min_liquidity: 40, max_data_quality: low}
tier_by_market_cap:
  tier1_min_usd: 10000000000
  tier2_min_usd: 2000000000
```

---

### 5.3 FOREX

#### 5.3.0 Bestand aus Produktivumgebung
Nur 10 hart codierte Paare (`assetRegistry.ts`), generische Heuristik. Keine Kategorien, keine makroökonomischen Metriken. Bewertung: **new** vollständig.

#### 5.3.1 Kategorien
G10 Majors, G10 Crosses, Emerging Market Currencies, Carry Currencies, Safe Haven Currencies. Asset-Typ: `spot_pair | cross_pair`.

#### 5.3.2 Datenquellen
Primär: Stooq (bereits angebunden für FX, **keep_as_is**). Sekundär: **neu** — Zinsdifferenz-/Makrodaten (Zentralbank-APIs) nicht vorhanden, Backlog-Item.

#### 5.3.3 Metriken
Pflicht: Zinsdifferenz, Volatility Regime, Momentum. Optional: Realrendite, Inflationsdifferenz, Trade Balance, Current Account, GDP Growth Diff, Carry Score, Dollar Index Correlation, Risk Appetite, Intermarket Correlation.

#### 5.3.4 Bewertungsmodell
```
MacroCarryModel: score = 0.30·carryScore + 0.25·macroMomentum + 0.20·volRegimeScore + 0.15·intermarketCorr + 0.10·(100-risk)
```
Modellauswahl: einheitlich für alle Forex-Paare (kein Sub-Typ-Split nötig, da Makrofaktoren universell anwendbar). Wertkorridor: symmetrisch `±10%` um Neutral (enger als Krypto, da FX-Paare typischerweise geringere Varianz haben) — **neu begründet** durch geringere typische Tagesvolatilität von G10-Paaren gegenüber Krypto.

#### 5.3.5 Risikofaktoren
Volatilitätsregime, geopolitisches Risiko (Safe-Haven-Flag), Zentralbank-Interventionsrisiko, Liquiditätsrisiko bei Exoten/EM-Währungen.

#### 5.3.6 Ranking-Regeln
Standardformel (5.1.6); Tier 1 = G10 Majors, Tier 2 = G10 Crosses, Tier 3 = EM/Carry.

#### 5.3.7 Beispiel-JSON
```json
{
  "asset_id": "forex-eurusd-001", "symbol": "EUR/USD", "name": "Euro / US-Dollar",
  "asset_class": "forex", "category_main": "G10 Majors", "category_sub": "n/a",
  "asset_type": "spot_pair", "market": "global", "exchange": "OTC", "currency": "USD", "tier": "1",
  "data_sources": ["stooq"],
  "required_metrics": ["interest_rate_diff", "vol_regime", "momentum"],
  "optional_metrics": ["carry_score", "trade_balance", "dxy_correlation"],
  "score_components": {"carry": 55, "macroMomentum": 62, "volRegime": 70, "intermarketCorr": 58, "risk": 25},
  "weights": {"carry": 0.30, "macroMomentum": 0.25, "volRegime": 0.20, "intermarketCorr": 0.15, "risk": 0.10},
  "risk_flags": [], "confidence": 0.80,
  "data_quality": {"level": "medium", "missing_fields": ["trade_balance"], "source_coverage": 0.7, "freshness_minutes": 20},
  "valuation_corridor": {"conservative": 55.8, "neutral": 62.0, "optimistic": 68.2, "fair_value_gap_pct": 0.9},
  "ranking_eligibility": {"eligible": true, "reason": "tier1, liquidity high"},
  "model_used": "MacroCarryModel", "model_reasoning": "single unified model for forex",
  "audit_trail": ["classification:v1.0@2026-08-01", "scoring:MacroCarryModel:v1.0@2026-08-01"],
  "calculation_version": "forex-carry-1.0.0"
}
```

#### 5.3.8 YAML-Konfigurationsbeispiel
```yaml
model: forex-macro-carry
version: 1.0.0
weights: {carry: 0.30, macroMomentum: 0.25, volRegime: 0.20, intermarketCorr: 0.15, risk: 0.10}
inverted: [risk]
value_corridor: {band_pct: 10}
```

---

### 5.4 INDIZES

#### 5.4.0 Bestand
30 prozedural generierte Indizes (`assetRegistry.ts`), keine Breadth-/Regime-Metriken. Bewertung: **new**.

#### 5.4.1 Kategorien
Broad Market, Sector, Strategy, Volatility, Thematic.

#### 5.4.2 Datenquellen
Primär: Stooq/CMC-Index-Feeds (soweit vorhanden, **extend** bestehender Marktdaten-Layer). Konstituenten-Breadth-Daten: **neu**.

#### 5.4.3 Metriken
Pflicht: Breadth, Trend Strength, Volatility (VIX-artig). Optional: Advance/Decline Ratio, Sector Rotation, Market Cap Concentration, Earnings Trend, Sentiment, Flow Data, Intermarket.

#### 5.4.4 Bewertungsmodell
```
BreadthRegimeModel: score = 0.30·breadthScore + 0.25·trendStrength + 0.20·(100-volatility) + 0.15·flowScore + 0.10·sentiment
```
Wertkorridor: `±12%` um Neutral (Indizes diversifiziert, geringere Einzelrisiko-Varianz als Einzeltitel).

#### 5.4.5 Risikofaktoren
Konzentrationsrisiko (Top-5-Gewicht), Volatilitätsregime, Liquiditätsrisiko bei Nischen-/Thematic-Indizes.

#### 5.4.6 Ranking-Regeln
Standardformel; Tier nach AUM/Handelsvolumen des zugrundeliegenden Produkts.

#### 5.4.7 Beispiel-JSON
```json
{
  "asset_id": "index-spx-001", "symbol": "SPX", "name": "S&P 500",
  "asset_class": "index", "category_main": "Broad Market", "category_sub": "n/a",
  "asset_type": "benchmark_index", "market": "US", "exchange": "aggregated", "currency": "USD", "tier": "1",
  "data_sources": ["stooq"],
  "required_metrics": ["breadth", "trend_strength", "volatility"],
  "optional_metrics": ["advance_decline_ratio", "sector_rotation", "flow_data"],
  "score_components": {"breadth": 68, "trendStrength": 74, "volatility": 40, "flow": 60, "sentiment": 65},
  "weights": {"breadth": 0.30, "trendStrength": 0.25, "volatility": 0.20, "flow": 0.15, "sentiment": 0.10},
  "risk_flags": [], "confidence": 0.85,
  "data_quality": {"level": "high", "missing_fields": [], "source_coverage": 0.8, "freshness_minutes": 10},
  "valuation_corridor": {"conservative": 61.0, "neutral": 69.4, "optimistic": 77.7, "fair_value_gap_pct": 1.2},
  "ranking_eligibility": {"eligible": true, "reason": "tier1"},
  "model_used": "BreadthRegimeModel", "model_reasoning": "category=Broad Market",
  "audit_trail": ["classification:v1.0@2026-08-01", "scoring:BreadthRegimeModel:v1.0@2026-08-01"],
  "calculation_version": "index-breadth-1.0.0"
}
```

#### 5.4.8 YAML-Konfigurationsbeispiel
```yaml
model: index-breadth-regime
version: 1.0.0
weights: {breadth: 0.30, trendStrength: 0.25, volatility: 0.20, flow: 0.15, sentiment: 0.10}
inverted: [volatility]
value_corridor: {band_pct: 12}
```

---

### 5.5 BONDS

#### 5.5.0 Bestand
Nur 3 hart codierte Bonds (`US10Y`, `DE10Y`, `AAA-CORP`), keine Metriken, keine Kategorien. Bewertung: **new** vollständig.

#### 5.5.1 Kategorien
Government, Corporate Investment Grade, Corporate High Yield, Municipal, Inflation-Linked, Emerging Market Sovereign.

#### 5.5.2 Datenquellen
**Neu** — kein Bond-Datenfeed aktuell angebunden (nur 3 statische Symbole). Empfohlen: Erweiterung des Stooq-/Alpha-Vantage-Layers um Treasury-Yield-Feeds als erster Schritt.

#### 5.5.3 Metriken
Pflicht: Duration, Credit Spread, Yield to Maturity, Rating. Optional: Modified Duration, Convexity, Real Yield, Inflation Expectations, Default Probability, Recovery Rate, Liquidity Stress, Spread Duration.

#### 5.5.4 Bewertungsmodell
```
CreditDurationModel: score = 0.25·(100-defaultProbability) + 0.25·spreadAttractiveness + 0.20·(100-durationRisk)
                            + 0.15·ratingScore + 0.15·liquidityScore
```
Wertkorridor: über Spread-Bänder statt Score-Multiplikatoren — `conservative = ytm - spreadStress, optimistic = ytm + spreadCompression` (fachlich abweichend von der Krypto-Formel, da Bonds über Yield statt Score bewertet werden — **begründete Abweichung**, im Report explizit markiert statt die Krypto-Formel blind zu kopieren).

#### 5.5.5 Risikofaktoren
Zinsänderungsrisiko (Duration), Kreditrisiko (Rating/Spread), Inflationsrisiko, Liquiditätsstress bei Corporate-High-Yield, Länderrisiko bei EM-Sovereigns.

#### 5.5.6 Ranking-Regeln
Standardformel; Tier nach Rating-Klasse (AAA-A = Tier 1, BBB = Tier 2, High-Yield/EM = Tier 3).

#### 5.5.7 Beispiel-JSON
```json
{
  "asset_id": "bond-us10y-001", "symbol": "US10Y", "name": "US Treasury 10Y",
  "asset_class": "bond", "category_main": "Government", "category_sub": "n/a",
  "asset_type": "sovereign_bond", "market": "US", "exchange": "OTC", "currency": "USD", "tier": "1",
  "data_sources": ["stooq"],
  "required_metrics": ["duration", "credit_spread", "yield_to_maturity", "rating"],
  "optional_metrics": ["convexity", "real_yield", "default_probability"],
  "score_components": {"defaultRisk": 95, "spreadAttractiveness": 55, "durationRisk": 60, "rating": 100, "liquidity": 98},
  "weights": {"defaultRisk": 0.25, "spreadAttractiveness": 0.25, "durationRisk": 0.20, "rating": 0.15, "liquidity": 0.15},
  "risk_flags": [], "confidence": 0.75,
  "data_quality": {"level": "medium", "missing_fields": ["convexity"], "source_coverage": 0.6, "freshness_minutes": 30},
  "valuation_corridor": {"conservative": 3.9, "neutral": 4.2, "optimistic": 4.5, "fair_value_gap_pct": 0.0},
  "ranking_eligibility": {"eligible": true, "reason": "tier1 sovereign"},
  "model_used": "CreditDurationModel", "model_reasoning": "category=Government",
  "audit_trail": ["classification:v1.0@2026-08-01", "scoring:CreditDurationModel:v1.0@2026-08-01"],
  "calculation_version": "bond-credit-duration-1.0.0"
}
```

#### 5.5.8 YAML-Konfigurationsbeispiel
```yaml
model: bond-credit-duration
version: 1.0.0
weights: {defaultRisk: 0.25, spreadAttractiveness: 0.25, durationRisk: 0.20, rating: 0.15, liquidity: 0.15}
inverted: [durationRisk]
valuation_mode: yield_band   # abweichend vom score-multiplier-Muster, siehe 5.5.4
```

---

### 5.6 ROHSTOFFE

#### 5.6.0 Bestand aus Produktivumgebung
Vollständigstes Nicht-Krypto-Modell im Repo: 5-Achsen-Gewichtsmodell, versioniert (`SCORING_VERSIONS`), 6-Kategorien-Taxonomie, 10-Asset-Datenbank (0.4 Modell 4, 0.11). **Geeignet als Basis** (0.18: `extend`) — Coverage über die 10 DB-Einträge hinaus fehlt für den Großteil der Rohstoffwelt.

#### 5.6.1 Kategorien und Unterkategorien
Übernommen: Edelmetalle, Industriemetalle, Energie, Agrar, kritische Rohstoffe (`CategoryMain`-Mapping: Metal, Energy, Agriculture, Industrial, Recycling). Unterkategorien (neu ergänzt, im Bestand nicht explizit typisiert): Mining, Raffinerie, Spot, Futures, ETF/ETC.

#### 5.6.2 Datenquellen
Bestand: kein echter Marktdaten-Feed für Rohstoffe außer den 10 DB-Assets (statische Werte). **Extend**: Anbindung an Stooq-Commodity-Symbole (bereits im generischen Marktdaten-Layer vorhanden, aber nicht mit `RawMaterialsScoringService` verknüpft).

#### 5.6.3 Metriken
Übernommen (bereits vollständig, 0.4 Modell 4): Marktpreis/Liquidität, Gehalt/Reinheit, Tonnage/Volumen, Förderkosten, Infrastruktur/Logistik, ESG/Regulierung, Strategische Knappheit, Geopolitisches Risiko, Producer Concentration, Volatility. **Neu ergänzt**: Lagerbestände, Seasonality (im Bestand als Konzept genannt, aber kein Inputfeld dafür in `RawMaterialInput` vorhanden).

#### 5.6.4 Bewertungsmodell
**Übernommen unverändert** (Begründung: Gewichtsumme korrekt, Missing-Field-Handling vorhanden, einziges bereits versioniertes Modell im Repo):
```
final = fundamentals·0.35 + (100-risk)·0.20 + liquidity·0.15 + processing·0.20 + strategicValue·0.10
```
Bewertungsachsen (Intrinsic Value / Execution / Risk) — **neu als explizite Aggregations-Sicht ergänzt**, da Bestand nur die 5 Rohsubscores kennt, nicht die dreiachsige Zusammenfassung aus dem Master-Prompt: `IntrinsicValue = fundamentals; Execution = liquidity+processing; Risk = riskScore`.

#### 5.6.5 Risikofaktoren
Übernommen: geopolitisch, Lieferketten, regulatorisch, ESG, Produzentenkonzentration, Volatilität.

#### 5.6.6 Ranking-Regeln
Standardformel; Tier nach `is_critical`-Flag (bereits in `RAW_MATERIALS_DATABASE` vorhanden) — kritische Rohstoffe (Lithium, Kobalt, Uran) automatisch Tier 1.

#### 5.6.7 Beispiel-JSON
```json
{
  "asset_id": "commodity-lithium-001", "symbol": "LITHIUM", "name": "Lithium",
  "asset_class": "commodity", "category_main": "Metal", "category_sub": "Batteriemetalle",
  "asset_type": "spot", "market": "global", "exchange": "OTC", "currency": "USD", "tier": "1",
  "data_sources": ["internal_raw_materials_db", "stooq"],
  "required_metrics": ["market_liquidity", "ore_grade", "geopolitical_risk"],
  "optional_metrics": ["tonnage", "recyclability", "esg_risk"],
  "score_components": {"fundamentals": 78, "risk": 55, "liquidity": 62, "processing": 70, "strategicValue": 85},
  "weights": {"fundamentals": 0.35, "risk": 0.20, "liquidity": 0.15, "processing": 0.20, "strategicValue": 0.10},
  "risk_flags": ["producer_concentration_high"], "confidence": 0.82,
  "data_quality": {"level": "high", "missing_fields": [], "source_coverage": 0.9, "freshness_minutes": 60},
  "valuation_corridor": {"conservative": 60.8, "neutral": 71.5, "optimistic": 82.2, "fair_value_gap_pct": 3.5},
  "ranking_eligibility": {"eligible": true, "reason": "is_critical=true -> tier1"},
  "model_used": "RawMaterialsModel-v0.6.0", "model_reasoning": "category=Metal, is_critical",
  "audit_trail": ["classification:v0.6.0@2026-08-01", "scoring:RawMaterialsModel:v0.6.0@2026-08-01"],
  "calculation_version": "rawmaterials-0.6.0"
}
```

#### 5.6.8 YAML-Konfigurationsbeispiel
```yaml
model: raw-materials
version: 0.6.0   # ACTIVE_VERSION auf 0.6.0 umgestellt (Bestand zeigte No-Op-Pin auf 0.5.4, siehe 0.9)
weights: {fundamentals: 0.35, risk: 0.20, liquidity: 0.15, processing: 0.20, strategicValue: 0.10}
inverted: [risk]
tier_override:
  is_critical: 1
```

---

### 5.7 ETF / FONDS

#### 5.7.0 Bestand
`not_found` (0.11) — keine ETF-Klassifizierung, kein ETF-`asset_type`. Bewertung: **new** vollständig.

#### 5.7.1 Kategorien
Index-ETF, Active ETF, Smart Beta, Thematic, Leveraged/Inverse, Commodity-ETC.

#### 5.7.2 Datenquellen
**Neu** — kein Fondsdaten-Feed (Holdings, AUM, Tracking-Error) im Bestand vorhanden. Kurzfristig überbrückbar über bestehenden Stooq-Kurs-Feed für den Marktpreis; Holdings/AUM/Tracking-Error benötigen einen dedizierten Provider (Backlog).

#### 5.7.3 Metriken
Pflicht: Tracking Error, Expense Ratio, AUM. Optional: Liquidity, Holdings Concentration, Sector Exposure, Factor Exposure, Premium/Discount, Creation/Redemption-Aktivität.

#### 5.7.4 Bewertungsmodell
```
ETFQualityModel: score = 0.25·(100-trackingError) + 0.20·(100-expenseRatioNorm) + 0.20·aumScore
                        + 0.20·liquidityScore + 0.15·(100-concentrationRisk)
```
Wertkorridor: `±NAV-Premium/Discount-Band` statt fixer Prozentsätze (fachlich korrekter für ETFs, da der Referenzwert der NAV ist, nicht ein Score-Analogon).

#### 5.7.5 Risikofaktoren
Tracking-Error-Drift, Premium/Discount zu NAV, Konzentrationsrisiko, Leveraged/Inverse-Zerfallsrisiko (Volatility Decay), Liquiditätsrisiko bei Nischen-ETFs.

#### 5.7.6 Ranking-Regeln
Standardformel; Tier nach AUM-Schwellenwert.

#### 5.7.7 Beispiel-JSON
```json
{
  "asset_id": "etf-spy-001", "symbol": "SPY", "name": "SPDR S&P 500 ETF",
  "asset_class": "etf", "category_main": "Index-ETF", "category_sub": "n/a",
  "asset_type": "physical_etf", "market": "US", "exchange": "NYSEARCA", "currency": "USD", "tier": "1",
  "data_sources": ["stooq"],
  "required_metrics": ["tracking_error", "expense_ratio", "aum"],
  "optional_metrics": ["holdings_concentration", "premium_discount"],
  "score_components": {"trackingError": 98, "expenseRatio": 95, "aum": 100, "liquidity": 100, "concentration": 70},
  "weights": {"trackingError": 0.25, "expenseRatio": 0.20, "aum": 0.20, "liquidity": 0.20, "concentration": 0.15},
  "risk_flags": [], "confidence": 0.90,
  "data_quality": {"level": "medium", "missing_fields": ["holdings_concentration"], "source_coverage": 0.65, "freshness_minutes": 15},
  "valuation_corridor": {"conservative": -0.3, "neutral": 0.0, "optimistic": 0.3, "fair_value_gap_pct": 0.0},
  "ranking_eligibility": {"eligible": true, "reason": "tier1 AUM"},
  "model_used": "ETFQualityModel", "model_reasoning": "category=Index-ETF",
  "audit_trail": ["classification:v1.0@2026-08-01", "scoring:ETFQualityModel:v1.0@2026-08-01"],
  "calculation_version": "etf-quality-1.0.0"
}
```

#### 5.7.8 YAML-Konfigurationsbeispiel
```yaml
model: etf-quality
version: 1.0.0
weights: {trackingError: 0.25, expenseRatio: 0.20, aum: 0.20, liquidity: 0.20, concentration: 0.15}
inverted: [expenseRatio, concentration]
valuation_mode: nav_premium_band
```

---

### 5.8 DERIVATE / FUTURES

#### 5.8.0 Bestand
`not_found` (0.11) — `asset_type: "derivative"` nur als ungenutzter Enum-Wert deklariert. Bewertung: **new** vollständig.

#### 5.8.1 Kategorien
Index Futures, Commodity Futures, Crypto Futures, Options, Swaps.

#### 5.8.2 Datenquellen
**Neu** — Funding-Rate-/Open-Interest-Feeds nicht angebunden (Backlog; Krypto-Futures könnten über die bestehenden Krypto-Börsen-Anbindungen erweitert werden).

#### 5.8.3 Metriken
Pflicht: Basis/Futures Curve (Contango/Backwardation), Open Interest. Optional: Funding Rate, Put/Call Ratio, Volatility Skew, Gamma Exposure, Dealer Positioning.

#### 5.8.4 Bewertungsmodell
```
DerivativesStructureModel: score = 0.30·curveScore(Contango/Backwardation) + 0.25·openInterestScore
                                  + 0.20·fundingRateScore + 0.15·skewScore + 0.10·(100-gammaRisk)
```
Wertkorridor: über Basis-Band zur Kassa-Referenz (`conservative = spot·(1-basisStress), optimistic = spot·(1+basisStress)`) — abweichend von der Score-Multiplikator-Formel, da Derivate direkt an einen Kassa-Referenzpreis gekoppelt sind (begründete Abweichung, analog Bonds 5.5.4).

#### 5.8.5 Risikofaktoren
Rollover-/Basis-Risiko, Liquiditätsrisiko bei Open Interest &lt; Schwellenwert, Gegenparteirisiko (OTC-Swaps), Gamma-/Vega-Exposure bei Optionen, Hebelrisiko.

#### 5.8.6 Ranking-Regeln
Standardformel; Tier nach Open-Interest-Liquidität. Ausschlussregel: Derivate ohne Mindest-Open-Interest sind grundsätzlich `ranking_eligibility.eligible=false` (schärfer als Standardfilter, da Derivate-Illiquidität ein Preisverzerrungsrisiko ist).

#### 5.8.7 Beispiel-JSON
```json
{
  "asset_id": "derivative-btc-fut-001", "symbol": "BTC-PERP", "name": "Bitcoin Perpetual Future",
  "asset_class": "derivative", "category_main": "Crypto Futures", "category_sub": "n/a",
  "asset_type": "perpetual_future", "market": "global", "exchange": "aggregated", "currency": "USD", "tier": "2",
  "data_sources": ["exchange_derivatives_feed"],
  "required_metrics": ["basis", "open_interest"],
  "optional_metrics": ["funding_rate", "put_call_ratio", "volatility_skew"],
  "score_components": {"curve": 65, "openInterest": 80, "fundingRate": 58, "skew": 60, "gammaRisk": 30},
  "weights": {"curve": 0.30, "openInterest": 0.25, "fundingRate": 0.20, "skew": 0.15, "gammaRisk": 0.10},
  "risk_flags": ["leverage_high"], "confidence": 0.70,
  "data_quality": {"level": "medium", "missing_fields": ["volatility_skew"], "source_coverage": 0.6, "freshness_minutes": 5},
  "valuation_corridor": {"conservative": -3.0, "neutral": 0.0, "optimistic": 3.0, "fair_value_gap_pct": 0.4},
  "ranking_eligibility": {"eligible": true, "reason": "open_interest above threshold"},
  "model_used": "DerivativesStructureModel", "model_reasoning": "category=Crypto Futures",
  "audit_trail": ["classification:v1.0@2026-08-01", "scoring:DerivativesStructureModel:v1.0@2026-08-01"],
  "calculation_version": "derivatives-structure-1.0.0"
}
```

#### 5.8.8 YAML-Konfigurationsbeispiel
```yaml
model: derivatives-structure
version: 1.0.0
weights: {curve: 0.30, openInterest: 0.25, fundingRate: 0.20, skew: 0.15, gammaRisk: 0.10}
inverted: [gammaRisk]
valuation_mode: basis_band
eligibility:
  min_open_interest_usd: 1000000
```

---

## 6. SCORING- UND RANKING-METHODIK

### 6.1 Vorgehen
Wie in 0.4/0.18 dokumentiert: die dynamische Neugewichtungs-Engine (`renormalizeAndScore`) und die Ranking-Grundformel (`ranking.service.ts`) werden **übernommen** und auf alle Assetklassen generalisiert, da sie bereits testabgedeckt und mathematisch korrekt (Gewichtsumme = 1.0, Missing-Data-robust) sind. Die vier bestehenden Krypto-/Rohstoffmodelle bleiben in ihrer Kernformel **erhalten** (Abschnitt 5.1/5.6), werden aber um fehlende Score-Kontrakt-Felder ergänzt. Für Aktien/Forex/Index/Bond/ETF/Derivate werden **neue** Modelle definiert (Abschnitt 5.2–5.5, 5.7–5.8), da im Bestand nur eine undifferenzierte technische Heuristik existierte.

### 6.2 Score-Hierarchie

| Ebene | Zweck | Beispiel |
|---|---|---|
| Indikator | Einzelmetrik bewerten | RSI, Spread, Funding Rate |
| Subklasse | Teilsegmente unterscheiden | Crypto-Large Cap, FX-G10, Equity-Growth |
| Assetklasse | Gesamturteil pro Klasse | Crypto Score, FX Score, Equity Score |
| Meta-Score | Cross-Asset-Ranking | Risk-on/Risk-off, Allokationspriorität |

### 6.3 Scoring-Kontrakt (harter Vertrag, unverändert aus Master-Prompt übernommen)

```json
{
  "scores": {
    "base_score": "number (0-100)",
    "asset_class_score": "number (0-100)",
    "category_score": "number (0-100)",
    "risk_adjusted_score": "number (0-100)",
    "confidence_score": "number (0-1)",
    "data_quality_score": "number (0-100) | low | medium | high | unknown",
    "rank_score": "number (0-100)",
    "final_enterprise_score": "number (0-100)",
    "score_breakdown": { "metric": "contribution_to_final" },
    "explanation_trace": ["string"]
  }
}
```

**Mapping Bestand → Kontrakt**: `base_score` = bisheriger `final_score` je Modell (0.4); `rank_score` bereits vorhanden (`ranking.service.ts`); `asset_class_score`/`category_score`/`risk_adjusted_score`/`final_enterprise_score`/`score_breakdown`/`explanation_trace` sind **neu** — im Bestand existierte nur `reasoning: string[]` als loses Pendant zu `explanation_trace` (übernommen, umbenannt für Konsistenz).

### 6.4 Ranking-Logik

Übernommen aus `ranking.service.ts` (0.5), generalisiert auf alle Assetklassen:
```
RankScore = 0.70·FinalScore + 0.15·DataQualityScore + 0.10·TierScore + 0.05·LiquiditätsStabilität
```
Begründung für Übernahme: Struktur erfüllt bereits die im Master-Prompt geforderte Anforderung (FinalScore/DataQuality/Tier/Liquidität gewichtet). Eligibility-Filter (Confidence/Liquidität/Datenqualität) ebenfalls übernommen. **Neu ergänzt**: Tie-Breaking-Regel `Liquidität → Data Quality → Risk` (im Bestand nicht vorhanden, siehe 0.5).

### 6.5 Top-10-Modi

Im Bestand existierte nur ein fixer Overall-Top-10-Endpunkt (0.5). **Neu ergänzt** (Master-Prompt-Pflichtanforderung):
- Overall Top 10 (übernommen)
- Top 10 by Category (neu — Filter auf `category_main` vor Sortierung)
- Top 10 by Tier (neu — Filter auf `tier`)
- Top 10 by Market Quality (neu — Sortierung primär nach `data_quality_score`)
- Top 10 by Growth Potential (neu — Sortierung nach `fair_value_gap_pct` absteigend)

### 6.6 Normalisierungsregeln

Übernommen unverändert aus `clamp()`/`renormalizeAndScore()` (0.4): alle Metriken auf 0–100, negative Metriken invertiert (`100-value`), Gewichtungen pro Modell summieren zu 1.0 (in allen 4 Bestandsmodellen bereits verifiziert korrekt), Division durch 0 abgefangen (`marketReference>0`-Check bereits vorhanden). **Verschärft gegenüber Bestand**: NaN-Werte sind verboten — fehlende Werte werden **nicht** wie im Master-Prompt als „0 mit Confidence-Reduktion" behandelt, sondern wie im bestehenden `renormalizeAndScore()`-Muster **ausgeschlossen und umgewichtet** (bewusste Abweichung vom Master-Prompt-Vorschlag „0 mit Confidence-Reduktion", da die Bestandslogik nachweislich robuster ist: ein fehlender Faktor mit Wert 0 würde den Score künstlich nach unten verzerren, während Ausschluss+Neugewichtung nur die Confidence senkt, nicht den Score selbst verfälscht — Begründung nach Prinzip „Neutralität gegenüber bestehenden Modellen").

---

## 7. DATENQUALITÄTS- UND CONFIDENCE-MODELL

### 7.1 Vorgehen
Wie in 0.7/0.18 festgestellt, existiert **kein** einheitliches DataQualityScore-Kompositmodell — nur drei inkonsistente Ad-hoc-Formeln (Crypto-Completeness-Ratio, Rohstoff-Missing-Ratio, CryptoOrchestrator-Doppelherleitung). Diese werden **refactored** zu einem einheitlichen Modell.

### 7.2 Data Quality Score (neu vereinheitlicht)
```
DataQualityScore = 0.25·sourceCoverage + 0.25·freshness + 0.20·supplyTransparency
                  + 0.15·exchangeBreadth + 0.15·outlierStability
```
- `sourceCoverage`: Anteil real angebundener Pflichtmetriken (Weiterentwicklung der bestehenden `dataCompletenessRatio`, 0.7 — **extend**).
- `freshness`: `clamp(100 - freshness_minutes/maxAcceptable·100)`, `maxAcceptable` je Tier aus 5.X.2.
- `supplyTransparency`: für Krypto direkt aus bestehendem `scoreSupplyTransparency()` übernommen (0.4); für andere Klassen analog als „Datenoffenlegungsgrad" interpretiert.
- `exchangeBreadth`: Anzahl unabhängiger Datenquellen, die für das Asset übereinstimmende Werte liefern (**neu** — im Bestand nicht vorhanden, da Fallback-Kette nur sequenziell, nicht als Konsens genutzt wird).
- `outlierStability`: Inverser Score aus Preis-/Volumensprung-Erkennung (**neu**, siehe 7.4).

Level: `low (0-39) | medium (40-74) | high (75-100) | unknown` (unverändert aus Master-Prompt, konsistent mit dem im Bestand bereits verwendeten Grenzwert-Muster in `cryptoScoringService.ts` (0.7·high wird hier zu 75/100 vereinheitlicht — vorher 0.7-Ratio-Skala, jetzt 0-100-Skala für Konsistenz mit dem UAI-Kontrakt)).

### 7.3 Confidence Score (neu vereinheitlicht)
```
Confidence = baseConfidence · dataQualityMultiplier · sourceCountMultiplier · freshnessMultiplier
baseConfidence       = classification.confidence (aus Classification Agent, 0.60–0.95 wie im Bestand)
dataQualityMultiplier= {high:1.0, medium:0.85, low:0.6, unknown:0.4}
sourceCountMultiplier= clamp(0.5 + 0.1·sourceCount, 0.5, 1.0)
freshnessMultiplier  = clamp(1.0 - freshness_minutes/1440, 0.5, 1.0)
```
Begründung: Die bestehende Rohstoff-Formel (`baseConfidence - missingCount·0.04`, 0.7) ist additiv und kann bei vielen fehlenden Feldern negativ werden vor dem Floor — die neue multiplikative Formel ist beschränkt (immer ∈[0,1]) und einfacher auditierbar (**refactor**, nicht reine Übernahme). Fehlende Pflichtfelder reduzieren `sourceCountMultiplier`. Ranking-Zulassungs-Schwellenwert: **übernommen** `confidence ≥ 0.65` (0.5, bereits im Bestand etabliert und getestet).

### 7.4 Manipulationsschutz (vollständig neu, im Bestand `not_found`)
- **VWAP-nahe Preisbildung**: bei ≥2 Preisquellen wird der volumen-gewichtete Mittelwert statt der zuerst antwortenden Quelle verwendet (aktuell nutzt die Fallback-Kette in `server.ts` nur die erste erfolgreiche Quelle — **replace** dieses Verhaltens für Multi-Source-Assets).
- **Volumenrobuste Aggregation**: Ausreißer-Quellen (>3 Standardabweichungen vom Median über alle Quellen) werden aus der VWAP-Berechnung ausgeschlossen.
- **Outlier-Detection**: einfache Z-Score-Prüfung auf Tages-Preis-/Volumensprünge, Ergebnis fließt in `outlierStability` (7.2) und als `risk_flags: ["price_anomaly_detected"]` in den UAI.
- **Liquiditätsfilter**: Assets mit `liquidity < eligibility.min_liquidity` werden nicht nur vom Top-10-Ranking, sondern grundsätzlich mit `risk_flags: ["illiquid"]` markiert (Erweiterung der bestehenden reinen Ranking-Ausschlussregel, 0.5, um eine für alle Konsumenten sichtbare Kennzeichnung).

---

## 8. DEPENDENCY-INVENTAR

| Abhängigkeitstyp | Beschreibung | Betroffene Komponenten | Status | Risiko bei Ausfall | Quelle |
|---|---|---|---|---|---|
| Marktdaten (Krypto) | CMC/CoinGecko/Binance/Kraken/Coinbase Fallback-Kette | Crypto-Modelle (5.1) | Produktiv | Mittel (Fallback-Kette vorhanden) | Produktiv |
| Marktdaten (Aktien/Forex/Rohstoffe) | Stooq, Alpha Vantage | Equity/Forex/Commodity-Modelle (5.2/5.3/5.6) | Produktiv, Coverage-Lücken | Hoch (keine Fallback-Quelle für Alpha Vantage) | Produktiv |
| Marktdaten (Index/Bond/ETF/Derivate) | keine dedizierte Anbindung | 5.4/5.5/5.7/5.8 | fehlt | Hoch (Modelle nicht lauffähig ohne neue Quelle) | Neu |
| On-Chain-Daten | keine RPC/Subgraph-Anbindung, nur LLM-Schätzung | Crypto Risk/OnChain Agent | fehlt | Mittel (aktuell durch Agenten-Schätzung kompensiert) | Neu (Backlog) |
| Fundamentaldaten (Bilanzen/Earnings) | Alpha Vantage Fundamentals-Endpunkt ungenutzt | Equity-Modell (5.2) | teilweise vorhanden, nicht integriert | Hoch für Equity-Modell-Qualität | Produktiv, zu erweitern |
| Sentiment-Daten | NewsAPI vorhanden, aber nicht an Scoring angebunden (nur `/api/news`-Anzeige) | Sentiment Agent (3) | teilweise vorhanden | Niedrig (optionaler Faktor) | Produktiv, zu erweitern |
| KI-Modell (Gemini) | alle Agenten-Outputs hängen an einem einzigen Provider | alle Agenten (3) | Produktiv, Single-Point-of-Failure | Hoch (kein Fallback-LLM trotz UI-Optionen Claude/GPT-4o/Grok) | Produktiv |
| Datenbank (Supabase) | Score-Snapshots, Audit-Logs, Compliance-Runs | Backtesting (7), Compliance (10) | Produktiv | Hoch | Produktiv |
| Gewichtungs-Konfigurationen | TS-Konstanten, nicht extern editierbar außer Rohstoffe | alle Scoring-Modelle | teilweise versioniert | Mittel (Änderung erfordert Deploy) | Produktiv, YAML-Externalisierung empfohlen (9) |
| Event-Bus | EventMesh (ESS-0013) einzige lauffähige Platform-Komponente | Audit-Trail (10), Reporting Agent (3) | teilweise implementiert | Mittel | Produktiv, zu erweitern |
| Backtesting-Framework | Snapshot+Hit-Rate, kein Walk-Forward | Backtesting Agent (3) | teilweise vorhanden | Mittel | Produktiv, zu erweitern |
| Compliance-Scanner | 21 Scanner, ISO-Mapping (selbstbewertet) | Compliance Agent (3), Abschnitt 10 | Produktiv | Niedrig | Produktiv |

---

## 9. ERWEITERUNGS-PLAYBOOK

### 9.1 Hinzufügen einer neuen Assetklasse
1. **Bestand erfassen**: Prüfen, ob Teilkomponenten in `src/lib/assetRegistry.ts` (Typ-Union) oder `server.ts` (Heuristik-Branch) existieren — dokumentieren wie in Abschnitt 0.
2. **Klassifizierung definieren**: Hauptkategorien/Unterkategorien/Asset-Typen/Tiering nach Muster 5.X.1.
3. **Metriken definieren**: Pflicht-/optionale Metriken, Normalisierungspfad — bevorzugt `renormalizeAndScore()` wiederverwenden (0.4, `keep_as_is`).
4. **Scoring-Modell erstellen**: Subscores + Gewichte (Summe=1.0), Risikoadjustierung (Invertierungs-Set analog `INVERTED_FIELDS`), Wertkorridor nach Muster 5.X.4 (Score-Multiplikator oder — bei zins-/preisgekoppelten Instrumenten wie Bonds/Derivaten — Band um Referenzwert).
5. **Datenquellen identifizieren**: bestehenden Fallback-Ketten-Mechanismus (`server.ts`) als Vorlage nutzen.
6. **Ranking-Regeln festlegen**: Standardformel (6.4) übernehmen, Eligibility-Schwellen je Assetklasse anpassen.
7. **Risk Flags definieren**: assetspezifisch, als `risk_flags`-Array im UAI.
8. **Beispiel-JSON erstellen**: nach Muster 5.X.7.
9. **YAML-Konfiguration erstellen**: nach Muster 5.X.8, unter `src/config/<assetclass>Weights.ts` oder — empfohlen als Verbesserung — externalisiert nach `config/<assetclass>.yaml` (bewusste Abweichung vom TS-Konstanten-Muster des Bestands, Begründung: Versionierbarkeit/Auditierbarkeit ohne Deploy, Prinzip „Versionierbarkeit").
10. **Testfälle definieren**: Edge Cases (fehlende Pflichtfelder, Outlier, Division durch 0) nach Vorbild `tests/unit/scoringService.test.ts`.
11. **Integration prüfen**: Supervisor-Modellregistrierung (3.1), Classification Agent, Ranking Agent, Reporting Agent.
12. **Dokumentation aktualisieren**: `docs/architecture/`, Changelog (11), ADR bei struktureller Änderung (nach bestehendem `docs/adr/`-Muster, **keep_as_is** übernommen — Governance-Prozess ist bereits etabliert und funktioniert).

### 9.2 Hinzufügen einer neuen Subkategorie
1. Bestand aus Produktivumgebung erfassen (z. B. neue `CryptoCategory`-Werte, die im Typ bereits existieren aber vom Classifier nie zugewiesen werden, 0.12).
2. Subkategorie innerhalb der Assetklasse definieren.
3. Spezifische Metriken/Gewichtungen festlegen (ggf. neues Sub-Modell wie `StablecoinModel`, 5.1.4).
4. Modellauswahl-Logik im Supervisor aktualisieren (3.1, Schritt 2).
5. Testfälle für die neue Subkategorie erstellen.
6. Changelog-Eintrag mit Version, Datum, Begründung (Abschnitt 11).

### 9.3 Kompatibilitätsprüfung
- Neue Gewichtungen müssen auf 1.0 normiert sein (automatisiert prüfbar, analog `tests/unit/scoringService.test.ts`-Assertion).
- Neue Metriken müssen einen Normalisierungspfad zu `renormalizeAndScore()` haben.
- Neue Modelle dürfen bestehende Modelle nicht verändern (Modularitätsprinzip, 1).
- Neue Assetklassen dürfen den Universal-Asset-Interface-Vertrag (4) und den Scoring-Kontrakt (6.3) nicht brechen.
- Changelog- und Backlog-Einträge sind Pflicht (11).

---

## 10. COMPLIANCE- UND AUDIT-LAYER

### 10.1 Auditierbarkeit
Jede Score-Berechnung erzeugt einen `audit_trail`-Eintrag (UAI-Feld, 4) mit Input-Referenz, verwendeter Formel-Version, Gewichten, Zwischenergebnissen, Final Score, Confidence, Datenqualität, Modellbegründung. **Neu** gegenüber Bestand — im Bestand existierte kein persistenter Audit-Trail pro Scoring-Vorgang (0.7 zeigte nur Snapshot-Speicherung für Backtesting-Zwecke, nicht für Formel-Nachvollziehbarkeit). Audit-Trails sind versionierbar/reproduzierbar über `calculation_version`.

### 10.2 BaFin-Konformität
Übernommen aus bestehendem, bereits funktionsfähigem Compliance-Scanner-System (`server/compliance/scanners.ts`, 0.14 — `keep_as_is`): Transparenz, Reproduzierbarkeit, Nachvollziehbarkeit, Fehlerresistenz sind bereits als Scanner-Kategorien (`SECURITY/DATA/BILLING/CODE_QUALITY/GOVERNANCE`) etabliert. **Erweiterung nötig**: eine neue Scanner-Kategorie `SCORING` (z. B. `SCORING-01 Gewichtsumme=1.0`, `SCORING-02 DataQualityScore-Vollständigkeit`, `SCORING-03 Audit-Trail-Vorhandensein`) nach demselben Muster wie die bestehenden 21 Scanner.

### 10.3 Event-Schema
**Übernommen unverändert** aus `docs/integration-plan.md` (0.10) — die dort bereits spezifizierte Kette ist identisch mit der Master-Prompt-Anforderung und wird als Zielarchitektur bestätigt:
```
data.validated → data.rejected → data.needs_review
score.approved → score.rejected → score.review_required
report.completed → roadmap.completed → workflow.completed
```
Implementierung: über das bereits lauffähige `EventMesh`-Modul (0.10, einzige implementierte Platform-Komponente) statt eines neuen Event-Systems (**extend**, nicht `new`).

---

## 11. BACKLOG UND ROADMAP

### Backlog

| ID | Titel | Beschreibung | Priorität | Status | Datum |
|---|---|---|---|---|---|
| SCR-001 | CryptoClassification-Typen konsolidieren | Drei parallele, inkompatible Typdefinitionen (0.12) auf ein Schema vereinheitlichen | Kritisch | Offen | 2026-08-01 |
| SCR-002 | DataQualityScore-Kompositformel implementieren | Abschnitt 7.2 umsetzen, bestehende Ad-hoc-Ratios ablösen | Kritisch | Offen | 2026-08-01 |
| SCR-003 | Confidence-Modell vereinheitlichen | Abschnitt 7.3 umsetzen, 3 inkonsistente Formeln ablösen | Hoch | Offen | 2026-08-01 |
| SCR-004 | Manipulationsschutz (VWAP/Outlier) implementieren | Abschnitt 7.4, aktuell `not_found` | Hoch | Offen | 2026-08-01 |
| SCR-005 | Equity-Scoring-Modell (5.2) implementieren | Ablösung der generischen Heuristik durch QualityValueModel etc. | Hoch | Offen | 2026-08-01 |
| SCR-006 | Forex-/Index-/Bond-Scoring-Modelle (5.3–5.5) implementieren | Aktuell `not_found`/generische Heuristik | Mittel | Offen | 2026-08-01 |
| SCR-007 | ETF-/Derivate-Assetklassen einführen (5.7–5.8) | Aktuell nicht existent im Typsystem | Mittel | Offen | 2026-08-01 |
| SCR-008 | Top-10-Modi erweitern (byCategory/byTier/byMarketQuality/byGrowth) | Aktuell nur Overall-Top-10 (0.5) | Mittel | Offen | 2026-08-01 |
| SCR-009 | Tie-Breaking-Regel im Ranking implementieren | Aktuell reiner Zahlenvergleich (0.5) | Niedrig | Offen | 2026-08-01 |
| SCR-010 | Rohstoff-Coverage über 10 DB-Einträge hinaus erweitern | Bestand deckt nur 10 Materialien vollständig ab | Mittel | Offen | 2026-08-01 |
| SCR-011 | Gewichte nach YAML externalisieren | Alle Modelle außer Rohstoffe hart in TS-Code (0.9) | Niedrig | Offen | 2026-08-01 |
| SCR-012 | Versionspin-Widerspruch auflösen (0.5.4/0.6.0/0.5.0) | Bereits von Vorgänger-Audits als GOV-VER-001 identifiziert | Niedrig | Bekannt (vor diesem Report) | — |
| SCR-013 | Scoring-Compliance-Scanner-Kategorie ergänzen | Abschnitt 10.2 | Mittel | Offen | 2026-08-01 |

### Roadmap-Phasen
- **Phase 0**: Bestandsaufnahme Produktivumgebung — **abgeschlossen** (dieser Report, Teil A).
- **Phase 1**: Datenvalidierung (Data Quality Agent, SCR-002).
- **Phase 2**: Scoring-Audit (Typkonsolidierung SCR-001, Confidence SCR-003).
- **Phase 3**: Backtesting (Walk-Forward-Erweiterung von `server/scoreValidation.ts`).
- **Phase 4**: Regime-Erkennung (Regime Agent, 3).
- **Phase 5**: Multi-Timeframe-Analyse.
- **Phase 6**: Watchlist-Automation.
- **Phase 7**: Performance-Monitoring.
- **Phase 8**: Erweiterung auf weitere Assetklassen (SCR-005/006/007).
- **Phase 9**: Cross-Asset-Allokations-Logik (Meta-Score, 6.2).
- **Phase 10**: Echtzeit-Ranking-Refresh (SCR-008/009).

---

## Änderungsprotokoll (Changelog dieses Reports)

| Version | Datum | Änderung |
|---|---|---|
| 1.0.0 | 2026-08-01 | Initiale Erstellung: vollständige Phase-1-Bestandsaufnahme (Abschnitt 0) + Phase-2-Erweiterungsarchitektur (Abschnitte 3–11) für alle 8 Assetklassen. |
| 1.1.0 | 2026-08-01 | Abschnitt 0.20 ergänzt: vollständige maschinenlesbare Rohinventar-Tabellen für alle 15 Erfassungsschritte (Package-/Build-Dateien, Agenten-Inventar, Scoring-Modell-Blöcke, Ranking-/Tiering-/Wertkorridor-Rohdaten, DataQuality-/Confidence-Formeln, Datenquellen-/Konfigurations-/Skill-Layer-Inventar, Assetklassen-Lücken-Analyse, Typdefinitionen, API-Endpunkt-/Middleware-Tabelle, Audit-/Logging-/Compliance-Detail, Dokumentations- und Test-/Backtesting-/CI-CD-Inventar) im exakten, vom Master-Prompt vorgegebenen Ausgabeformat. |

---

*Dieser Report wurde rein lesend erstellt — keine Datei der Produktivumgebung wurde verändert. Alle Aussagen in Teil A sind mit Dateipfad zitiert; alle Entscheidungen in Teil B (Übernahme/Erweiterung/Neudefinition) sind begründet.*
