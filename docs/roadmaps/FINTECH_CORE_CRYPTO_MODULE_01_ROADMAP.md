# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.0.0  
**Status:** IN IMPLEMENTATION — FT-0/FT-1 foundation started  
**Owner-Prioritaet:** Chat-Prioritaet 2026-08-20  
**Execution Branch:** `feat/fintech-core-crypto-module-01`  
**Base:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`  
**Work Claim:** `FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`  
**Primary Architecture Decision:** `ADR-0098` (proposed; namespace must be revalidated immediately before PR creation)  
**Protected Scoring Authority:** `ADR-0087`, `SC-2`, `ScoringModelRegistry`, `ScoringDispatcher`

## 1. Ziel

Der Enterprise Crypto Orchestrator wird als **erstes fachliches Modul der CAPITAL-AI FinTech Core Engine** aufgebaut. Er ist keine Trading-Strategie und keine zweite Scoring-Engine. Er kontrolliert den reproduzierbaren, auditierbaren Workflow von Datenaufnahme und Research bis zu Risiko, Compliance, Portfolio, Execution und Reconciliation.

Die vom Owner bereitgestellte Quelle `FinTech Enterprise Orchestration Modell` erweitert diesen Scope um:

- kategoriespezifische Crypto-Analysemodelle,
- Unterklassen/Kategorien fuer L1, L2, DeFi, RWA, NFT, Stablecoin, Exchange Token, GameFi, AI/DePIN und Meme,
- eine priorisierte Pattern-Analyse,
- Multi-Timeframe- und Marktregime-Kontext,
- rollierende Pattern-Reliability statt statischer Erfolgsversprechen,
- deterministische Risk-/Compliance-Gates vor jeder kapitalwirksamen Aktion.

## 2. Nicht verhandelbare Architektur-Invarianten

1. **Keine zweite Scoring Authority.** Produktive Scores entstehen ausschliesslich ueber `ScoringModelRegistry -> ScoringDispatcher -> CanonicalScoreResult`.
2. **CryptoOrchestrator bleibt Research/Enrichment.** Agenten-Ausgaben bleiben `scoreEligible=false`, bis ein separat freigegebener Evidence-Promotion-Contract existiert.
3. **Category- und Pattern-Analyse liefern Evidence/Features, keine direkten Kapitalentscheidungen.**
4. **Risk und Compliance sind explizite Gates.** Kein `OrderIntent` ohne deterministische `APPROVED`-Entscheidungen beider Schichten.
5. **LLM/Agenten besitzen keine direkte Exchange-, Wallet-, Private-Key-, Risk-Limit- oder Compliance-Bypass-Capability.**
6. **EventMesh ist kein alleiniger Financial Ledger.** In-Memory-Events duerfen Telemetrie/Koordination liefern; autoritative Workflow-/Decision-Evidence wird spaeter durable persistiert.
7. **Idempotenz vor Retry.** Side-effecting Aktionen wie Orders/Withdrawals duerfen nicht mit einem generischen Retry-Wrapper wiederholt werden, wenn kein end-to-end Idempotency Contract besteht.
8. **Missing Evidence bleibt missing.** Keine synthetischen Finanzwerte, Pattern-Edges, Category-Metriken oder PASS-Zustaende.
9. **Research-, Paper-, Guarded-Live-, Production- und Emergency-Modi verwenden denselben fachlichen Workflow, aber unterschiedliche Execution-Policies.**
10. **Governance/Quality/Supervisor bleiben getrennte Authorities.** FinTech Core konsumiert deren Evidence/Entscheidungen, ersetzt sie aber nicht.

## 3. Main-Baseline und Korrelationen

### 3.1 Aktueller Main

Branchstart erfolgte von:

`f1dff495fe792a4d4a26a3513f0525b4974bd349`

Dieser Stand enthaelt insbesondere:

- PR #455: zentrales Quality Center als non-authorizing Evidence-/Orchestration-Schicht,
- PR #456: Compliance-PDF Null-Safety,
- SC-2 Single-Dispatcher-Architektur fuer produktive Multi-Asset-Scores.

### 3.2 Parallel offene PRs

- **PR #457** — Quality Center Completion. Kein FinTech-Core-Authority-Transfer vorgesehen; vor PR-Erstellung muss Dateioverlap erneut geprueft werden.
- **PR #458** — Verified Asset Display/Buffett Hydration. Belegt `ADR-0097`; deshalb verwendet dieser Workstream vorlaeufig `ADR-0098`.

### 3.3 Bestehende wiederzuverwendende Komponenten

- `src/orchestrator/cryptoOrchestrator.ts`
- `src/services/classification.service.ts`
- `src/services/classificationAdapter.ts`
- `src/types/crypto.types.ts`
- `src/platform/Scoring/ScoringModelRegistry.ts`
- `src/platform/Scoring/ScoringDispatcher.ts`
- `src/platform/Supervisor/**`
- `src/platform/EventMesh/**`
- `src/platform/Traceability/**`
- `src/platform/Quality/**`
- `src/platform/Compliance/**`
- `server/outbox.ts` / `server/outboxWorker.ts`
- Supabase `outbox_jobs`, `agent_audit_events`, `score_snapshots`, `ai_governance_evaluations`

## 4. Zielarchitektur

```text
User / API / Supervisor
        |
        v
CAPITAL-AI FinTech Core Engine
        |
        +--> Module 01: Crypto
                |
                +--> Asset Identity / Classification
                +--> Category Evidence Resolver
                +--> Category Analysis Profile
                +--> Market / On-Chain / Fundamental Evidence
                +--> Technical Pattern Engine
                +--> Multi-Timeframe Resolver
                +--> Market Regime Filter
                +--> Canonical Feature Contract
                +--> ScoringModelRegistry
                +--> ScoringDispatcher
                +--> CanonicalScoreResult
                +--> Portfolio Target
                +--> Deterministic Risk Gate
                +--> Compliance Gate
                +--> Signed / Hashed OrderIntent
                +--> Execution Gateway
                +--> Reconciliation
                +--> Audit / Traceability
```

## 5. Kategoriespezifische Analyse

Die bestehende kanonische CAPITAL-AI Crypto-Taxonomie wird **nicht ersetzt**. Sie wird um einen analytischen Profile-Layer ergaenzt.

### 5.1 Analyseprofile aus der Owner-Quelle

| Profil | Schwerpunkt | Initiale Quelle |
|---|---|---|
| L1 | Fundamentals, On-Chain, Security, Tokenomics, Technicals | Owner-Orchestration-Modell |
| L2/Rollup | Usage, Sequencer Economics, DA, Bridge/Liveness, Unlocks | Owner-Orchestration-Modell |
| DeFi | Revenue, TVL Quality, Protocol/Oracle/Smart-Contract Risk | Owner-Orchestration-Modell |
| RWA | Backing, Legal/Custody, Yield, Redemption, Liquidity | Owner-Orchestration-Modell |
| NFT | Collection Quality, Liquidity, Rarity, Community, Wash-Trade Penalty | Owner-Orchestration-Modell |
| Stablecoin | Peg, Reserves, Redemption, Liquidity | Owner-Orchestration-Modell |
| Exchange Token | Exchange Revenue, Utility, Burn, Reserves, Counterparty Risk | Owner-Orchestration-Modell |
| GameFi | DAU, DAU/MAU, Revenue, Retention, NFT Activity, Utility | Owner-Orchestration-Modell |
| AI/DePIN | Active Nodes, Useful Work, Revenue, Customer Growth, Utilization, Utility | Owner-Orchestration-Modell |
| Meme | eigener Profile-Slot; Formel bleibt bis belastbare Evidence vorliegt `PENDING_EVIDENCE` | keine belastbare Spezialformel in der bereitgestellten Quelle |

### 5.2 Multi-Label-Regel

Ein Asset darf mehrere fachliche Tags besitzen. Der bestehende `category_main` bleibt kompatibel; der neue Analyse-Layer kann spaeter `primaryProfile` und `secondaryProfiles` fuehren. Sekundaerprofile duerfen keine doppelten Gewichte oder mehrfaches Scoring erzeugen.

### 5.3 Normalisierung

Vergleiche erfolgen primaer innerhalb fachlich vergleichbarer Profile. Ein RWA-Token darf nicht allein ueber dieselben Merkmale wie ein Meme- oder L1-Asset gerankt werden.

## 6. Pattern-Analyse

### 6.1 Prioritaetsgruppen

| Rang | Gruppe | Startgewicht |
|---:|---|---:|
| 1 | Structure Reversal | 1.00 |
| 2 | Structure Continuation | 0.90 |
| 3 | Breakout Structure | 0.85 |
| 4 | Wedge | 0.80 |
| 5 | Candlestick Reversal | 0.65 |
| 6 | Candlestick Continuation | 0.60 |
| 7 | Single Candle | 0.40 |
| 8 | Micro Pattern | 0.25 |

Diese Werte sind **Research-Startgewichte**, keine Erfolgswahrscheinlichkeiten.

### 6.2 Pattern Evidence

Ein erkanntes Pattern muss mindestens folgende Dimensionen fuehren:

- geometrische Pattern-Qualitaet,
- Trend-/Support-/Resistance-Kontext,
- Volumenbestaetigung,
- Breakout-Qualitaet,
- Retest,
- Higher-Timeframe-Bestaetigung,
- Marktregime,
- asset-/timeframe-spezifischer historischer Edge,
- Data Quality,
- Evidence-Referenzen und Version.

### 6.3 Konfliktregeln

1. Higher Timeframe vor Lower Timeframe.
2. Strukturmuster vor Einzelkerzen.
3. Bestaetigter Breakout vor unbestaetigtem Muster.
4. Volumenbestaetigung vor reinem Preispattern.
5. relevantes Level vor Range-Mitte.
6. Regime-konformes Muster vor Regime-Konflikt.
7. Asset-/Timeframe-spezifische Statistik vor allgemeiner Literaturstatistik.

### 6.4 Pattern Reliability

Reliability wird nicht global hartkodiert. Zielschluessel:

```text
assetId x analysisProfile x timeframe x marketRegime x patternId x validationVersion
```

Bewertet werden mindestens:

- Anzahl Beobachtungen,
- Win Rate,
- Avg Win / Avg Loss,
- Expectancy,
- Profit Factor,
- Max Drawdown,
- Netto-PnL nach Fees/Spread/Slippage/Funding,
- Walk-forward-/Out-of-sample-Ergebnis.

## 7. Roadmap

### FT-0 — Contract Freeze & Governance Baseline

**Status:** IN IMPLEMENTATION

**Ziel:** Architecture Boundary festschreiben, bevor Runtime-Verhalten geaendert wird.

- [x] frischen Branch vom aktuellen `main` anlegen
- [x] Work Claim anlegen
- [x] komplette Implementierungsroadmap anlegen
- [ ] ADR-0098 als `proposed` anlegen und vor PR final in Registry/Document Registry registrieren
- [ ] FinTech-Core-/Crypto-Contract-Versionen einfuehren
- [ ] Category Analysis Profile Contract einfuehren
- [ ] Pattern Group / Pattern Evidence / Validation Contract einfuehren
- [ ] Operating-Mode-Contract definieren
- [ ] Authority-Boundary-Tests anlegen

**Exit:** keine produktive Score-/Execution-Aenderung; Contracts und Governance sind reviewbar und fail-closed.

### FT-1 — FinTech Core Engine Foundation

**Status:** PLANNED

- `FinTechCoreEngine`
- `CoreModuleRegistry`
- `CoreModule` Contract
- `WorkflowContext`
- `DomainEvent`
- `DecisionRecord`
- `OrderIntent`
- Crypto als `moduleId = fintech-core.crypto`
- explizite Trennung `RETRY_SAFE` vs. `SIDE_EFFECTING`
- Supervisor-Routing spaeter auf `FinTechCore -> CryptoModule`, ohne Supervisor zur Finanzentscheidungsinstanz zu machen

**Exit:** Crypto-Modul kann einen rein research/paper-faehigen Workflow deterministisch komponieren; keine Exchange-Side-Effects.

### FT-2A — Crypto Category Taxonomy & Profile Resolution

**Status:** PLANNED

- bestehende kanonische `CryptoCategory` weiterverwenden
- analytische Profile separat modellieren
- primary/secondary Profile mit Evidence-Provenance
- keine Kategorie aus LLM-Output ohne deterministic/evidence-backed Merge
- `Unknown`/nicht abgedeckte Klassen fail-closed auf `generic/PENDING_EVIDENCE`
- CoinGecko-Tags nur als externe Classification Evidence, nicht als alleinige Authority

### FT-2B — Category-specific Feature Contracts

**Status:** PLANNED

Implementierung und Validierung je Profil:

- L1 Security/Network/Tokenomics
- L2 Usage/DA/Bridge/Sequencer/Unlock
- DeFi Revenue/TVL Quality/Protocol Risk
- RWA Backing/Legal/Custody/Redemption
- NFT Liquidity/Rarity/Wash Trading
- Stablecoin Peg/Reserves/Redemption
- Exchange Token Revenue/Utility/Reserve Transparency/Counterparty Risk
- GameFi Product Usage/Retention/Economics
- AI/DePIN Network Usage/Useful Work/Economics
- Meme erst nach separater evidenzbasierter Formel

**Hard rule:** Missing category evidence -> `NOT_COMPUTABLE` bzw. reduzierte Coverage, niemals synthetischer Ersatz.

### FT-2C — Technical Pattern Engine

**Status:** PLANNED

- Pattern-Katalog + Gruppenprioritaet
- deterministische Detection
- Context/Volume/Breakout/Retest
- Multi-Timeframe Resolution
- Regime Filter
- Pattern Reliability Registry
- Walk-forward-/OOS-Backtesting
- Kosten-/Funding-/Slippage-Beruecksichtigung
- keine Pattern-Aussage als direkte Orderfreigabe

**Open-Source-Gate:** TA-Lib wird vor Integration separat auf Node/Docker-Build, License, Supply Chain, Pattern-Semantik und Maintenance getestet. Keine Dependency-Aufnahme in FT-0/FT-1.

### FT-3 — Durable Workflow & Traceability

**Status:** PLANNED

Ziel-Supabase-Schema, erst nach Migration-Review/Owner-Mutationsfreigabe:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Reuse:

- `public.agent_audit_events`
- `public.score_snapshots`
- `public.outbox_jobs`
- bestehende Traceability/EventMesh-Vertraege

Pflicht-IDs:

- `runId`
- `traceId`
- `correlationId`
- `causationId`
- `strategyId`
- `portfolioId`
- `decisionVersion`
- `idempotencyKey`

**Queue-Entscheidung:** bestehendes `outbox_jobs` zuerst wiederverwenden. `pgmq` ist bereits vorhanden, wird aber nicht parallel als zweite Queue-Authority eingefuehrt. Eine spaetere Konvergenz benoetigt eigenes ADR/Benchmark.

### FT-4 — Research & Paper Trading

**Status:** PLANNED

Workflow bis mindestens:

```text
MARKET_DATA_RECEIVED
DATA_VALIDATED
MARKET_REGIME_CLASSIFIED
SIGNAL_GENERATED
ASSET_SCORED
PORTFOLIO_TARGET_CALCULATED
PRE_TRADE_RISK_CHECK
COMPLIANCE_DECIDED
PAPER_ORDER_EXECUTED
POSITION_UPDATED
POST_TRADE_RISK_CHECK
RECONCILIATION_COMPLETED
AUDIT_RECORD_FINALIZED
```

- kein reales Kapital
- simulierte Balances explizit markiert
- Slippage/Fees/Funding in Paper Evidence
- deterministische Replay-Faehigkeit

### FT-5 — Deterministic Risk + Compliance by Design

**Status:** PLANNED

Risk Controls:

- max position / portfolio exposure
- max order size
- daily loss / drawdown
- spread / slippage / orderbook depth
- stale/contradictory data
- concentration/correlation
- venue health
- stablecoin/counterparty risk

Compliance Controls:

- KYC/KYB boundary
- AML / transaction monitoring
- sanctions
- wallet risk
- Travel Rule integration point
- asset/jurisdiction allow/deny
- RWA legal/custody gate
- market abuse/wash trading evidence
- regulatory exportability

**Exit:** `OrderIntent` ist ohne `Risk=APPROVED` und `Compliance=APPROVED` unmoeglich.

### FT-6 — OrderIntent, Paper Ledger & Reconciliation

**Status:** PLANNED

- immutable/hash-bound `OrderIntent`
- TTL/expiry
- approved price/quantity/slippage bounds
- idempotency/client-order-id
- double-entry paper ledger
- exchange/custody/ledger/blockchain reconciliation contract
- duplicate/retry/crash tests

### FT-7 — Guarded Live / Single CEX

**Status:** BLOCKED UNTIL FT-0..FT-6 PASS

- genau ein CEX-Adapter
- Human Approval fuer definierte Schwellen
- kill switch / emergency mode
- circuit breakers
- venue health
- signed OrderIntent-only Execution Gateway
- keine LLM-/Agent-Key-Capability
- kein generischer Supervisor-Retry fuer Side Effects

### FT-8 — Enterprise Production Hardening

**Status:** PLANNED

- Custody/MPC/Multisig integration boundary
- segregation client/proprietary assets
- BCP/DR
- multi-venue routing
- observability via OpenTelemetry/W3C trace context
- append-only/retention-faehige Audit Evidence
- capacity/latency/SLOs
- chaos/failover tests
- regulatorische Reporting-/Export-Schnittstellen

### FT-9 — DeFi / DEX / Cross-Chain Expansion

**Status:** PLANNED

- DEX/Aggregator Adapter
- smart-contract risk
- bridge risk
- oracle risk
- lending/yield constraints
- cross-chain reconciliation
- DeFi-spezifische Execution-/Settlement-Policies

## 8. Betriebsmodi

| Mode | Market/Research | Score | Portfolio | Real Execution |
|---|---|---|---|---|
| RESEARCH | ja | canonical/read-only | optional simulation | nein |
| PAPER | ja | canonical | simuliert | nein |
| GUARDED_LIVE | ja | canonical | real limits | nur approved |
| PRODUCTION | ja | canonical | real | policy-controlled |
| EMERGENCY | eingeschraenkt | read-only | reduce/cancel policy | keine neuen Orders |

Mode-Wechsel sind Governance-Entscheidungen und werden nicht von LLMs autonom vorgenommen.

## 9. Supabase-Plan

### Ist

- Projekt `AIFINANCIAL`, Region `eu-west-1`, healthy
- PostgreSQL 17
- `pgmq 1.5.1` vorhanden
- `outbox_jobs` vorhanden
- Agent-/Score-/Governance-Audit-Evidence vorhanden

### Umsetzung

- FT-0..FT-2: **keine produktive DB-Mutation**
- FT-3: Migration zuerst im Repository, Review + Security Advisor + Owner Mutation Approval, danach kontrollierte Anwendung
- private/non-browser-exposed `fintech_core`-Strukturen bevorzugen
- keine `anon`/`authenticated` Grants ohne expliziten Use Case
- RLS/Privileges defense-in-depth
- keine Service-Role-Secrets im Client

## 10. Render-Plan

### Ist

- Service `Finance`
- Docker Runtime
- Frankfurt
- `main`
- Auto Deploy off
- aktueller Live-Deploy: `f1dff495...`

### Umsetzung

- FT-0..FT-2: keine Render-Mutation
- keine Preview-Service-Neuanlage ohne klaren Kosten-/Security-Nutzen
- Guarded-Live erst nach Runbook, Kill Switch, Metrics und Owner Approval
- spaetere Performance-/Execution-SLOs gegen reale Render-Metriken pruefen

## 11. Open-Source-/Dependency-Entscheidungen

| Option | Fit | Maintenance | Lizenz | Integration | Entscheidung |
|---|---|---|---|---|---|
| TA-Lib Core | hoch fuer Indicators/Candlesticks | aktiv, Release 2026 | BSD-3-Clause | native C/Docker Binding erforderlich | spaeterer PoC-Kandidat |
| technicalindicators | guter TS-Fit | npm Release stark veraltet | MIT | einfach | nicht fuer Enterprise-Kern bevorzugt |
| Tulip Indicators | Indicators/Candles | geringer/unklarer aktueller Takt | LGPL | C/Binding + Copyleft-Bewertung | derzeit nicht bevorzugt |
| Eigenentwicklung aller Indicator-Funktionen | technisch moeglich | eigene Last | intern | hoch | vermeiden |
| Eigenentwicklung CAPITAL-AI Context/Reliability Layer | erforderlich | intern | intern | kompatibel | begruendet: projektspezifische Governance/Evidence-Semantik |

TA-Lib oder andere Bibliotheken duerfen Pattern-Erkennung unterstuetzen, aber niemals Scoring-/Risk-/Execution-Authority uebernehmen.

## 12. Security / Compliance / Data Integrity

### Threats

- doppelte Orders durch Retry nach unklarem Venue-Ergebnis
- Look-ahead-/Backtest-Leakage
- synthetische oder stale Evidence
- Category Misclassification
- Pattern Overfitting
- LLM Prompt/Tool Escalation
- Key/Secret Leakage
- Compliance Bypass
- Event loss bei Prozess-/Worker-Ausfall
- Cross-venue race conditions

### Controls

- deterministic gates
- evidence provenance + timestamps
- idempotency keys
- immutable decision versions
- no direct LLM side effects
- explicit operating mode
- fail-closed missing data
- durable workflow state
- append-only audit trail
- human approval fuer hochriskante Mutationen

## 13. Validierungsstrategie

Vor jedem PR:

1. Diff und Dateiscope pruefen.
2. Open-PR-Korrelationen pruefen.
3. lokalen/statischen TypeScript-/Contract-/Unit-Test-Pfad bevorzugen.
4. keine kostenverursachende GitHub-CI vor PR-Erstellung ausloesen.
5. direkt vor PR `main` erneut laden.
6. Branch gegen neuen `main` synchronisieren.
7. semantische Korrelationen zu Scoring, Quality, Governance, Supabase, Render und offenen ADRs pruefen.
8. lokale/kostenfreie Checks erneut ausfuehren.

Nach PR-Erstellung gelten die Repository-Gates inkl. M10-/CI-Autorisierungsprozess.

## 14. Definition of Done

Module 01 gilt erst als Enterprise-ready, wenn:

- [ ] keine zweite produktive Scoring-Authority existiert
- [ ] Category-/Pattern-Evidence versioniert und provenance-faehig ist
- [ ] Pattern Reliability walk-forward/OOS validiert wird
- [ ] Risk/Compliance vor OrderIntent fail-closed sind
- [ ] Side Effects idempotent und crash-safe sind
- [ ] Research/Paper/Guarded-Live/Production/Emergency eindeutig getrennt sind
- [ ] durable Workflow-/Decision-/Audit-Evidence existiert
- [ ] Reconciliation pruefbar ist
- [ ] Security/Compliance/Governance/Quality-Gates PASS sind
- [ ] aktueller Main-Sync unmittelbar vor Merge erneut bewertet wurde
- [ ] Dokumentation, ADR/ESS/Traceability und Runtime-Verhalten konsistent sind

## 15. Aktueller naechster Schritt

FT-0 wird im aktuellen Branch mit einem **non-authorizing Contract-Fundament** begonnen:

1. `ADR-0098` proposed,
2. `src/platform/FinTechCore/CryptoModuleContracts.ts`,
3. Unit Tests fuer Profile-/Pattern-Invarianten,
4. danach `CoreModule`/`WorkflowContext`/`OperatingMode` ohne Runtime-Wiring.

Supervisor-, Supabase- und Render-Mutationen bleiben bis zu den dafuer vorgesehenen Roadmap-Gates unberuehrt.
