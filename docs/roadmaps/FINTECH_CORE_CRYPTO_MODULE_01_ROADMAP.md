# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.3.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-4 umgesetzt; FT-5 als naechster Roadmap-Block  
**Owner-Prioritaet:** Chat-Prioritaet 2026-08-20; Fortsetzung FT-3/FT-4 2026-08-21  
**Execution Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`  
**Original Base:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`  
**FT-4 Baseline:** `main@a0663563a6a01bbdf292db8796c1b291bdd8ee57`  
**Work Claim:** `FINTECH-CORE-FT4-RESEARCH-PAPER-TRADING-2026-08-21`  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087`, `SC-2`, `ScoringModelRegistry`, `ScoringDispatcher`

## 1. Ziel

Der Enterprise Crypto Orchestrator ist das erste fachliche Modul der CAPITAL-AI FinTech Core Engine. Er komponiert einen reproduzierbaren und auditierbaren Finanz-Workflow, ist aber weder Trading-Strategie noch zweite Scoring-Engine.

Der Scope umfasst:

- kategoriespezifische Crypto-Analyseprofile,
- provenance-faehige Feature-/Evidence-Contracts,
- technische Pattern- und Multi-Timeframe-Analyse,
- asset-/timeframe-/regime-spezifische Pattern Reliability,
- durable Workflow-/Event-/Decision-Evidence,
- simuliertes Research/Paper Accounting,
- spaetere Risk-/Compliance-/Execution-/Reconciliation-Gates.

## 2. Nicht verhandelbare Architektur-Invarianten

1. Produktive Scores entstehen ausschliesslich ueber `ScoringModelRegistry -> ScoringDispatcher -> CanonicalScoreResult`.
2. `CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.
3. Category-/Pattern-Analyse liefert Evidence/Features, keine direkte Kapitalentscheidung.
4. Missing oder stale Evidence wird nicht synthetisch zu `0`, `PASS` oder einer Erfolgswahrscheinlichkeit umgedeutet.
5. Pattern Reliability ist exact-key gebunden an Asset, Profil, Timeframe, Regime, Pattern und Validation-Version.
6. FinTech Core ersetzt keine IAM-, Compliance-, Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.
7. Side-effecting Actions benoetigen vor Retry end-to-end Idempotency.
8. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert, bis die spaeteren Gates explizit erfuellt sind.
9. EventMesh ist kein alleiniger Financial Ledger.
10. `public.outbox_jobs` bleibt die bestehende Queue-/Lease-Authority; keine zweite Queue wird eingefuehrt.
11. Das private Schema `fintech_core` wird nicht fuer Browserrollen geoeffnet.
12. Service-seitige Persistenz bleibt fail-closed und fuehrt keine Execution-Side-Effects aus.
13. FT-4 Paper Trading verwendet ausschliesslich fiktives Kapital und darf keinen realen `OrderIntent`, Venue Call, Wallet Call oder Custody Call erzeugen.
14. Paper Fees, Slippage und Funding sind explizite Evidence und keine versteckten Defaults.
15. Paper State muss deterministisch aus append-only durable Events rekonstruierbar sein.

## 3. Main-Korrelation 2026-08-21

PR #467 machte FT-0..FT-2C und ADR-0099 auf `main` kanonisch. PR #468 machte FT-3 Durable Workflow & Traceability kanonisch.

FT-4 wurde danach auf einem neuen Branch direkt von:

`main@a0663563a6a01bbdf292db8796c1b291bdd8ee57`

begonnen. Es wurde kein alter FT-3-Branch fortgeschrieben und kein Force-Rebase auf `main` verwendet.

## 4. Aktueller Implementierungsstand

| Phase | Status | Evidenz |
|---|---|---|
| FT-0 Contract Freeze & Governance Baseline | DONE | `FT0_CRYPTO_MODULE_FOUNDATION_2026-08-20.md` |
| FT-1 FinTech Core Engine Foundation | DONE | `FT1_CORE_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-2A Crypto Category Profile Resolution | DONE | `FT2A_CRYPTO_CATEGORY_PROFILE_RESOLUTION_2026-08-20.md` |
| FT-2B Category-specific Feature Contracts | DONE | `FT2B_CRYPTO_CATEGORY_FEATURE_CONTRACTS_2026-08-20.md` |
| FT-2C Technical Pattern Engine Foundation | DONE | `FT2C_PATTERN_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-3 Durable Workflow & Traceability | DONE | `FT3_DURABLE_WORKFLOW_TRACEABILITY_2026-08-21.md` |
| FT-4 Research & Paper Trading | DONE pending post-PR CI | `FT4_RESEARCH_PAPER_TRADING_2026-08-21.md` |
| FT-5 Deterministic Risk + Compliance | PLANNED | nach FT-4 |
| FT-6 OrderIntent & Reconciliation | PLANNED | nach FT-5 |
| FT-7 Guarded Live / Single CEX | BLOCKED | FT-0..FT-6 muessen bestehen |
| FT-8 Enterprise Production Hardening | PLANNED | nach Guarded-Live-Gates |
| FT-9 DeFi / DEX / Cross-Chain | PLANNED | spaetere Expansion |

## 5. FT-0 bis FT-2C — DONE

### FT-0

Umgesetzt sind Contract-/Governance-Baseline, Operating-Mode-, Category-, Pattern-/Reliability- und Authority-Boundary-Vertraege sowie die ADR-Namespace-Korrelation auf `ADR-0099`.

### FT-1

Umgesetzt sind `FinTechCoreEngine`, `FinTechCoreModuleRegistry`, deterministic Workflow State Machine, Crypto Module Descriptor `fintech-core.crypto`, Foundation-Modi `RESEARCH`/`PAPER` und die Trennung `RETRY_SAFE`/`SIDE_EFFECTING`.

### FT-2A

Die kanonische `CryptoCategory` wird um einen separaten provenance-aware Analysis-Profile-Layer erweitert. Agent-/LLM-Research kann kein Secondary Profile eigenstaendig promoten.

### FT-2B

Typed Feature-/Evidence-Contracts existieren fuer Layer 1, Layer 2/Rollup, DeFi, RWA, NFT, Stablecoin, Exchange Token, GameFi und AI/DePIN. Der Verified-Crypto-Snapshot-Adapter ueberfuehrt nur universelle Markt-/Supply-Evidence. Meme bleibt ohne belastbare Spezialformel `PENDING_EVIDENCE`.

### FT-2C

Umgesetzt sind detector-agnostischer OHLCV-/Pattern-SPI, immutable Exact-Key Reliability Registry, deterministische Multi-Timeframe-/Kontextaufloesung, Research Validation mit Walk-forward/OOS/Costs und explizite `CONFLICTING_EVIDENCE`-Semantik. Pattern bleibt `scoreEligible=false`, `executionEligible=false`, `RESEARCH_CONTEXT_ONLY`.

Offen aus FT-2C bleiben 1h/4h-Promotion nur nach Reliability-/Conflict-Gate, Double-Counting-Schutz und ein spaeter separat gepruefter Detector-/TA-Lib-PoC.

## 6. FT-3 — Durable Workflow & Traceability — DONE

Produktiv vorhanden:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Eigenschaften:

- privates Schema und RLS Defense in Depth;
- `anon`/`authenticated` ohne Schema-Zugriff;
- `service_role` Least Privilege;
- append-only Event-/Decision-/OrderIntent-/Reconciliation-Evidence;
- immutable Workflow-Identitaet/-Kontext;
- Lifecycle-Updates nur fuer erlaubte Workflow-Spalten;
- Correlation-/Trace-/FK-Indexes;
- `FinTechCorePersistencePort` als storage-agnostische Domain-Grenze;
- serverseitige `SECURITY INVOKER` RPC-Boundaries;
- idempotente Replays/Compare-and-Set;
- keine Order Execution.

Wiederverwendet werden `public.outbox_jobs`, `public.agent_audit_events`, `public.score_snapshots` und bestehende Traceability/EventMesh-Vertraege. Keine zweite Queue-Authority wurde eingefuehrt.

## 7. FT-4 — Research & Paper Trading — DONE pending post-PR CI

### 7.1 Zielgrenze

FT-4 implementiert einen durable/replay-faehigen **simulierten** Workflow:

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange/custody side effects = false
```

FT-4 ist kein Broker-/Exchange-Adapter und keine produktive Trading Authority.

### 7.2 Simulierte Balances

`PaperTradingContracts.ts` modelliert fiktive:

- Quote Balance,
- Asset Balance,
- Average Entry Price,
- Gross Realized PnL,
- kumulierte Fees,
- kumuliertes Funding.

Geld-/Mengenwerte werden als JSON-safe Fixed-Point `atoms + scale` gespeichert und mit `BigInt` deterministisch berechnet. Binary-Floating-Point wird fuer Paper Accounting nicht als Geldzustand verwendet.

FT-4 ist `CASH_LONG_ONLY`; Short Selling, Margin und Leverage werden nicht vor spaeteren Risk-/Execution-Vertraegen erfunden.

### 7.3 Explicit Cost Evidence

Jeder simulierte Fill besitzt explizite:

- Fee bps,
- Slippage bps,
- Funding Amount oder `NOT_APPLICABLE` mit Begruendung,
- Evidence-Refs.

Es existieren keine impliziten Nullkosten oder nicht dokumentierten Venue-Annahmen.

### 7.4 Deterministic Fill + Replay

`PaperTradingEngine.ts`:

- verlangt `PAPER` Mode;
- simuliert BUY/SELL mit expliziter Slippage;
- belastet fiktive Fees/Funding;
- blockiert unzureichenden Cash-/Asset-Bestand;
- erzeugt pro Fill einen kanonischen `FinTechCoreDomainEvent`;
- nutzt `paperSequence` und `causationId`;
- re-simuliert bei Replay jeden gespeicherten Fill;
- lehnt manipulierte oder nicht-kontinuierliche Journale ab.

`PaperTradingWorkflowService.ts` rekonstruiert vor jedem neuen Fill den aktuellen State aus durable Events und persistiert nur erfolgreiche Simulationen.

### 7.5 FT-3 Journal Reuse

Es wird **keine zweite Paper-Ledger-Tabelle** eingefuehrt. Das append-only Journal bleibt:

`fintech_core.domain_events`

Paper Events:

```text
PAPER_ACCOUNT_INITIALIZED   sequence 0
PAPER_FILL_SIMULATED        sequence 1..N
```

DB-seitig erzwingen Guard + Unique Indizes:

- kanonische Paper Payload-Version/Kind/Sequence;
- genau eine Initialisierung pro Run;
- eindeutige `paperSequence` pro Run;
- Init ohne Causation;
- Fill mit positiver Sequence und Causation.

### 7.6 Replay Reader

Der read-only Port `FinTechCoreDomainEventReaderPort` wird serverseitig ueber:

`public.fintech_core_list_domain_events_v1(text)`

angebunden.

Der RPC ist:

- `SECURITY INVOKER`;
- ohne EXECUTE fuer `PUBLIC`, `anon`, `authenticated`;
- nur fuer `service_role` ausfuehrbar;
- keine Browser-/Data-API-Oeffnung des privaten Schemas.

### 7.7 Production Verification

Produktionsmigration:

`20260821071823 — fintech_core_paper_replay_reader`

Verifiziert:

- Reader und Guard nicht `SECURITY DEFINER`;
- service-role-only Reader EXECUTE;
- RLS bleibt aktiv;
- Guard/Unique Indizes vorhanden;
- service-role Reader liefert Init/Fill in korrekter Reihenfolge `[0,1]`;
- doppelte Sequence blockiert;
- zweite Initialisierung blockiert;
- Fill ohne Causation blockiert;
- nach Transaction Rollback 0 Verifikationszeilen;
- keine neuen FT-4 Security-/FK-Advisor-Findings.

### 7.8 Open-Source-Entscheidung

Geprueft wurden u. a. QuantConnect LEAN und NautilusTrader. Beide liefern etablierte Paper-/Backtest-Architekturen, sind fuer FT-4 aber deutlich groesser als die fehlende Domain-Funktion und wuerden parallele Runtime-/Execution-Schichten einfuehren. Deshalb wird fuer FT-4 nur die kleine CAPITAL-AI-spezifische Paper-Domain-Funktion implementiert; Infrastruktur, Persistenz, Identity und Audit werden wiederverwendet.

## 8. FT-5 — Deterministic Risk + Compliance — NEXT

Geplanter Scope:

- Exposure-/Order-/Drawdown-/Liquidity-/Staleness-/Counterparty-Gates;
- KYC/KYB-/AML-/Sanctions-/Wallet-/Jurisdiction-Integrationspunkte;
- deterministische Policy-/Version-Bindung;
- negative/fail-closed Tests;
- noch **keine** Live-Order-Execution.

Ein `OrderIntent` darf spaeter ohne `Risk=APPROVED` und `Compliance=APPROVED` nicht execution-eligible werden.

## 9. FT-6 bis FT-9

### FT-6 OrderIntent & Reconciliation

Immutable/hash-bound OrderIntent, TTL, Price/Quantity/Slippage Bounds, Idempotency/Client-Order-ID, typed Reconciliation-/Settlement-Vertrag und Crash-/Duplicate-Tests.

### FT-7 Guarded Live

Blockiert bis FT-0..FT-6 bestanden sind. Genau ein CEX-Adapter, Human Approval, Kill Switch, Circuit Breakers und keine Agent-Key-Capability.

### FT-8 Enterprise Hardening

BCP/DR, Custody-Boundary, Multi-Venue, OpenTelemetry/W3C Trace Context, SLOs, Audit Retention, Chaos/Failover und regulatorische Exportfaehigkeit.

### FT-9 DeFi / DEX / Cross-Chain

DEX/Aggregator-, Smart-Contract-, Bridge-, Oracle- und Cross-Chain-Risk/Settlement-Gates.

## 10. Offene Projekt-Chat-Punkte

Noch offen und nicht als FT-4 erledigt markiert:

- externe/Drive-Quellpruefung, falls konkrete Category-/Risk-Formeln erforderlich werden;
- privater Storage-/Evidence-Bucket;
- Pattern-Badge-/UI-Integration;
- 1h/4h Pattern-Promotion;
- produktive Risk-/Compliance-/Execution-Adapter;
- typed Reconciliation/Settlement;
- Guarded Live/Production;
- FT-5 bis FT-9.

## 11. Security / Compliance / Data Integrity

Weiterhin verpflichtend:

- fail-closed bei fehlender/staler Evidence oder Persistenz-/Replayfehlern;
- keine zweite Scoring Authority;
- keine direkte LLM-/Agent-Side-Effect-Capability;
- Idempotency vor Side-Effect-Retry;
- provenance-faehige Evidence;
- klare Runtime-Modi;
- Least Privilege und private financial persistence;
- simuliertes Paper Accounting strikt von realem Kapital trennen;
- Human/Governance-Gates fuer spaetere produktive Mutationen.

## 12. Open Source / Plugins

- bestehende Repository-Funktionen bleiben fuehrend;
- GitHub fuer Branch-/Registry-/PR-/CI-Governance;
- Supabase/PostgreSQL fuer FT-3/FT-4 Durability;
- keine neue Postgres-, Queue- oder Trading-Runtime-Dependency in FT-4;
- QuantConnect LEAN/NautilusTrader wurden als Referenz-/Alternativloesungen bewertet, nicht integriert;
- TA-Lib bleibt spaeterer Detector-/Indicator-PoC-Kandidat, nicht Bestandteil von FT-4.

## 13. Naechster fachlicher Schritt

Nach FT-4 ist **FT-5 Deterministic Risk + Compliance** der naechste Roadmap-Block. Vor Umsetzung ist der dann aktuelle `main` erneut zu korrelieren; Guarded Live bleibt blockiert.
