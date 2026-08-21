# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.4.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-5 umgesetzt; FT-6 als naechster Roadmap-Block  
**Owner-Prioritaet:** Chat-Prioritaet 2026-08-20; Fortsetzung FT-3/FT-4/FT-5 2026-08-21  
**Execution Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`  
**Original Base:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`  
**FT-4/FT-5 Baseline:** `main@a0663563a6a01bbdf292db8796c1b291bdd8ee57`  
**Work Claims:** `FINTECH-CORE-FT4-RESEARCH-PAPER-TRADING-2026-08-21`, `FINTECH-CORE-FT5-DETERMINISTIC-RISK-COMPLIANCE-2026-08-21`  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087`, `SC-2`, `ScoringModelRegistry`, `ScoringDispatcher`

## 1. Ziel

Der Enterprise Crypto Orchestrator ist das erste fachliche Modul der CAPITAL-AI FinTech Core Engine. Er komponiert einen reproduzierbaren und auditierbaren Finanz-Workflow, ist aber weder Trading-Strategie noch zweite Scoring-Engine.

Der Scope umfasst:

- kategoriespezifische Crypto-Analyseprofile;
- provenance-faehige Feature-/Evidence-Contracts;
- technische Pattern- und Multi-Timeframe-Analyse;
- asset-/timeframe-/regime-spezifische Pattern Reliability;
- durable Workflow-/Event-/Decision-Evidence;
- simuliertes Research/Paper Accounting;
- deterministische Risk-/Compliance-Gates;
- spaetere OrderIntent-/Execution-/Reconciliation-Gates.

## 2. Nicht verhandelbare Architektur-Invarianten

1. Produktive Scores entstehen ausschliesslich ueber `ScoringModelRegistry -> ScoringDispatcher -> CanonicalScoreResult`.
2. `CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.
3. Category-/Pattern-Analyse liefert Evidence/Features, keine direkte Kapitalentscheidung.
4. Missing oder stale Evidence wird nicht synthetisch zu `0`, `PASS` oder einer Erfolgswahrscheinlichkeit umgedeutet.
5. Pattern Reliability ist exact-key gebunden an Asset, Profil, Timeframe, Regime, Pattern und Validation-Version.
6. FinTech Core ersetzt keine IAM-, Compliance-Policy-, Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.
7. Side-effecting Actions benoetigen vor Retry end-to-end Idempotency.
8. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert, bis die spaeteren Gates explizit erfuellt sind.
9. EventMesh ist kein alleiniger Financial Ledger.
10. `public.outbox_jobs` bleibt die bestehende Queue-/Lease-Authority; keine zweite Queue wird eingefuehrt.
11. Das private Schema `fintech_core` wird nicht fuer Browserrollen geoeffnet.
12. Service-seitige Persistenz bleibt fail-closed und fuehrt keine Execution-Side-Effects aus.
13. FT-4 Paper Trading verwendet ausschliesslich fiktives Kapital und darf keinen realen Venue-/Wallet-/Custody-Side-Effect erzeugen.
14. Paper Fees, Slippage und Funding sind explizite Evidence und keine versteckten Defaults.
15. Paper State muss deterministisch aus append-only durable Events rekonstruierbar sein.
16. FT-5 Policy-Grenzwerte und regulatorisch erforderliche Controls kommen als versionierte externe Policy-Snapshots; der Core erfindet keine Rechts-/Business-Policy.
17. FT-5 akzeptiert keinen LLM-/Agent-Output als Risk-/Compliance-Freigabe.
18. PASS-Evidence muss an die in der Policy erwartete Authority gebunden, provenance-faehig und frisch sein.
19. `PAPER` darf FT-5 Risk/Compliance evaluieren, aber niemals einen execution-authorizing Handoff erzeugen.
20. Crypto Module 01 unterstuetzt durch FT-5 weiterhin nur `RESEARCH` und `PAPER`.

## 3. Main-Korrelation 2026-08-21

PR #467 machte FT-0..FT-2C und ADR-0099 auf `main` kanonisch. PR #468 machte FT-3 Durable Workflow & Traceability kanonisch.

FT-4 und die vom Owner vor PR-Erstellung angeforderte FT-5-Fortsetzung wurden auf dem dedizierten Branch direkt von:

`main@a0663563a6a01bbdf292db8796c1b291bdd8ee57`

umgesetzt. Es wurde kein alter FT-3-Branch fortgeschrieben und kein Force-Rebase auf `main` verwendet. Vor der FT-5-Fortsetzung war der Branch `0 behind` und es existierte kein paralleler offener FinTech-/ADR-0099-PR.

## 4. Aktueller Implementierungsstand

| Phase | Status | Evidenz |
|---|---|---|
| FT-0 Contract Freeze & Governance Baseline | DONE | `FT0_CRYPTO_MODULE_FOUNDATION_2026-08-20.md` |
| FT-1 FinTech Core Engine Foundation | DONE | `FT1_CORE_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-2A Crypto Category Profile Resolution | DONE | `FT2A_CRYPTO_CATEGORY_PROFILE_RESOLUTION_2026-08-20.md` |
| FT-2B Category-specific Feature Contracts | DONE | `FT2B_CRYPTO_CATEGORY_FEATURE_CONTRACTS_2026-08-20.md` |
| FT-2C Technical Pattern Engine Foundation | DONE | `FT2C_PATTERN_ENGINE_FOUNDATION_2026-08-20.md` |
| FT-3 Durable Workflow & Traceability | DONE | `FT3_DURABLE_WORKFLOW_TRACEABILITY_2026-08-21.md` |
| FT-4 Research & Paper Trading | DONE pending combined post-PR CI | `FT4_RESEARCH_PAPER_TRADING_2026-08-21.md` |
| FT-5 Deterministic Risk + Compliance | DONE pending combined post-PR CI | `FT5_DETERMINISTIC_RISK_COMPLIANCE_2026-08-21.md` |
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
- Correlation-/Trace-/FK-Indexes;
- `FinTechCorePersistencePort` als storage-agnostische Domain-Grenze;
- serverseitige `SECURITY INVOKER` RPC-Boundaries;
- idempotente Replays/Compare-and-Set;
- keine Order Execution.

Wiederverwendet werden `public.outbox_jobs`, `public.agent_audit_events`, `public.score_snapshots` und bestehende Traceability/EventMesh-Vertraege. Keine zweite Queue-Authority wurde eingefuehrt.

## 7. FT-4 — Research & Paper Trading — DONE pending combined post-PR CI

### 7.1 Zielgrenze

FT-4 implementiert einen durable/replay-faehigen simulierten Workflow:

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange/custody side effects = false
```

FT-4 ist kein Broker-/Exchange-Adapter und keine produktive Trading Authority.

### 7.2 Simulierte Balances und Kosten

`PaperTradingContracts.ts` modelliert fiktive Quote-/Asset-Balance, Average Entry Price, Gross Realized PnL sowie kumulierte Fees/Funding. Geld-/Mengenwerte werden als JSON-safe Fixed-Point `atoms + scale` gespeichert und mit `BigInt` deterministisch berechnet.

FT-4 ist `CASH_LONG_ONLY`; Short Selling, Margin und Leverage werden nicht erfunden. Jeder simulierte Fill besitzt explizite Fee-/Slippage-/Funding-Evidence und Evidence-Refs; es gibt keine impliziten Nullkosten.

### 7.3 Deterministic Fill + Replay

`PaperTradingEngine.ts` simuliert BUY/SELL, belastet fiktive Costs, blockiert unzureichenden Bestand, erzeugt `FinTechCoreDomainEvent`s und nutzt `paperSequence`/`causationId`. Replay re-simuliert gespeicherte Fills und lehnt manipulierte oder nicht-kontinuierliche Journale ab.

`PaperTradingWorkflowService.ts` rekonstruiert den aktuellen State vor jeder neuen Simulation aus durable Events.

### 7.4 FT-3 Journal Reuse

Es wird keine zweite Paper-Ledger-Tabelle eingefuehrt. Das append-only Journal bleibt `fintech_core.domain_events`:

```text
PAPER_ACCOUNT_INITIALIZED   sequence 0
PAPER_FILL_SIMULATED        sequence 1..N
```

DB-seitig erzwingen Guard + Unique Indizes kanonische Payload-/Sequence-Semantik, genau eine Initialisierung, eindeutige `paperSequence` und Fill-Causation.

### 7.5 Replay Reader / Production Verification

Der read-only `FinTechCoreDomainEventReaderPort` wird serverseitig ueber `public.fintech_core_list_domain_events_v1(text)` angebunden. Der RPC ist `SECURITY INVOKER`, nur fuer `service_role` ausfuehrbar und oeffnet das private Schema nicht fuer Browserrollen.

Produktionsmigration:

`20260821071823 — fintech_core_paper_replay_reader`

Verifiziert wurden Security-Invoker-Grenzen, RLS, Guard/Unique Indizes, Replay-Reihenfolge `[0,1]`, Duplicate-/Causation-Negativfaelle, 0 Testdaten nach Rollback und keine neuen FT-4 Security-/FK-Advisor-Findings.

### 7.6 Open-Source-Entscheidung

QuantConnect LEAN und NautilusTrader wurden bewertet, aber nicht integriert. Beide sind fuer den engen Paper-Scope deutlich groesser als die fehlende Domain-Funktion und wuerden parallele Runtime-/Execution-Schichten einfuehren.

## 8. FT-5 — Deterministic Risk + Compliance — DONE pending combined post-PR CI

### 8.1 Risk Gates

`RiskCompliance/DeterministicPreTradeGate.ts` bewertet deterministisch:

```text
ORDER_NOTIONAL
GROSS_EXPOSURE
DRAWDOWN
LIQUIDITY
STALENESS
COUNTERPARTY
```

Die Grenzwerte kommen aus einem extern versionierten `FinTechCoreRiskPolicySnapshot`. Der Core besitzt die Evaluationslogik, nicht die Policy-Authority.

Monetaere Werte verwenden die aus FT-4 wiederverwendete Fixed-Point-Repraesentation und `BigInt`-Arithmetik. Order-, Portfolio-, Liquidity-, Market- und Counterparty-Evidence besitzt eigene Provenance/Authority-Bindung.

### 8.2 Compliance Integration Points

Typed Integrationspunkte existieren fuer:

```text
KYC
KYB
AML
SANCTIONS
WALLET_SCREENING
JURISDICTION
TRAVEL_RULE
```

Ein `FinTechCoreCompliancePolicySnapshot` legt explizit fest, welche Controls erforderlich sind, welche Evidence Authority je Control zulaessig ist und wie alt Evidence maximal sein darf. Der Core erfindet weder rechtliche Anwendbarkeit noch Provider-Ergebnisse.

Control-Zustaende:

```text
PASS
FAIL
MISSING
STALE
REVIEW_REQUIRED
```

Nur frische, provenance-faehige und authority-bound `PASS`-Evidence kann zu `APPROVED` fuehren.

### 8.3 Fail-Closed Outcome Semantik

Konservative Outcome-Prioritaet:

```text
REJECTED > NOT_COMPUTABLE > REVIEW_REQUIRED > APPROVED
```

- Limit-/Counterparty-/Sanctions-Fail -> `REJECTED`;
- missing/stale/mismatched-authority Evidence -> `NOT_COMPUTABLE`;
- Human/Provider Review -> `REVIEW_REQUIRED`;
- keine synthetischen PASS-/Zero-/Probability-Fallbacks.

### 8.4 Keine LLM-/Agent-Autorisierung

Der bestehende `CryptoRiskAgent` und andere AI-/Research-Komponenten koennen Kontext liefern, aber keine FT-5-Freigabe autorisieren. Architecture Tests blockieren direkte AI-/Agent-/Provider-/Exchange-Imports in der Gate-Schicht.

Die bestehende `src/platform/Compliance` SecurityComplianceAuditor-Komponente bleibt Repository-/ISO-Compliance-Authority und wird nicht zur Transaktions-AML-Authority umdefiniert. ADR-0058 Agent IAM bleibt Agent-/Tool-Risk-Authorization und ist ebenfalls keine finanzielle Pre-Trade-Policy.

### 8.5 Durable Decision Evidence Reuse

FT-5 fuehrt keine neue Tabelle ein. `RiskComplianceDecisionRecords.ts` mappt Ergebnisse in bestehende FT-3 `FinTechCoreDecisionRecord`s:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Run/Trace/Correlation/Asset/Decision-Version, Policy-ID/-Version, Hashes, Evidence-Refs und Outcome bleiben auditierbar.

### 8.6 OrderIntent Handoff Boundary

Ein approval-bound Handoff ist nur moeglich, wenn Risk und Compliance beide `APPROVED` sind, Workflow-Identitaet exakt passt und der Operating Mode `GUARDED_LIVE` oder `PRODUCTION` ist.

Crypto Module 01 aktiviert diese Modi durch FT-5 nicht. In `PAPER` gilt selbst bei zwei APPROVED-Ergebnissen:

```text
executionHandoffEligible = false
```

FT-5 signiert, persistiert, routet oder exekutiert keine Order.

### 8.7 Best-Practice-/Regulatory-Abgleich

Die Architektur wurde gegen MiCA Risk-/Record-Keeping-Anforderungen, EBA ML/TF Risk Factor Guidelines fuer CASPs, EBA Travel-Rule-Guidelines und den FATF VA/VASP Targeted Update 2026 abgeglichen. Daraus werden keine Rechtsentscheidungen hardcodiert; sie stuetzen die risikobasierte, provenance-/freshness-faehige und fail-closed Integrationsgrenze.

### 8.8 Open-Source-/Plugin-Entscheidung

OPA und Cedar wurden als etablierte Apache-2.0 Policy Engines bewertet. Beide sind enterprise-faehig, wuerden fuer den derzeit kleinen typed FT-5-Evaluator jedoch eine zusaetzliche Policy-Runtime/DSL-/Governance-Authority einfuehren. Deshalb werden sie nicht integriert.

Der bestehende GitHub Connector reicht fuer Repository/Governance. Die Plugin-Suche ergab keinen geeigneten spezialisierten AML/KYC/Sanctions-Connector. Es wurde kein neues Plugin eingefuehrt.

## 9. FT-6 bis FT-9

### FT-6 OrderIntent & Reconciliation

Naechster Block:

- immutable/hash-bound OrderIntent;
- TTL sowie Price/Quantity/Slippage Bounds;
- Idempotency/Client-Order-ID;
- typed Reconciliation-/Settlement-Vertrag;
- Crash-/Duplicate-/Reconciliation-Tests.

### FT-7 Guarded Live

Blockiert bis FT-0..FT-6 bestanden sind. Genau ein CEX-Adapter, Human Approval, Kill Switch, Circuit Breakers und keine Agent-Key-Capability.

### FT-8 Enterprise Hardening

BCP/DR, Custody-Boundary, Multi-Venue, OpenTelemetry/W3C Trace Context, SLOs, Audit Retention, Chaos/Failover und regulatorische Exportfaehigkeit.

### FT-9 DeFi / DEX / Cross-Chain

DEX/Aggregator-, Smart-Contract-, Bridge-, Oracle- und Cross-Chain-Risk/Settlement-Gates.

## 10. Offene Projekt-Chat-Punkte

Noch offen:

- externe/Drive-Quellpruefung, falls konkrete Category-/Risk-Formeln erforderlich werden;
- private Storage-/Evidence-Bucket;
- Pattern-Badge-/UI-Integration;
- 1h/4h Pattern-Promotion;
- konkrete produktive KYC/KYB-/AML-/Sanctions-/Wallet-/Jurisdiction-Provider;
- typed Reconciliation/Settlement;
- Guarded Live/Production;
- FT-6 bis FT-9.

## 11. Security / Compliance / Data Integrity

Weiterhin verpflichtend:

- fail-closed bei fehlender/staler/mismatched-authority Evidence oder Persistenz-/Replayfehlern;
- keine zweite Scoring Authority;
- keine direkte LLM-/Agent-Side-Effect- oder Approval-Capability;
- Idempotency vor Side-Effect-Retry;
- provenance-faehige Evidence;
- klare Runtime-Modi;
- Least Privilege und private financial persistence;
- simuliertes Paper Accounting strikt von realem Kapital trennen;
- Risk-/Compliance-Policy und Evidence Authorities versioniert/externalisieren;
- Human/Governance-Gates fuer spaetere produktive Mutationen.

## 12. Open Source / Plugins

- bestehende Repository-Funktionen bleiben fuehrend;
- GitHub fuer Branch-/Registry-/PR-/CI-Governance;
- Supabase/PostgreSQL fuer FT-3/FT-4 Durability;
- keine neue Datenbank-/Queue-/Execution-Dependency fuer FT-5;
- QuantConnect LEAN/NautilusTrader wurden fuer FT-4 bewertet, nicht integriert;
- OPA/Cedar wurden fuer FT-5 bewertet, nicht integriert;
- TA-Lib bleibt spaeterer Detector-/Indicator-PoC-Kandidat.

## 13. Naechster fachlicher Schritt

Nach FT-5 ist **FT-6 OrderIntent & Reconciliation** der naechste Roadmap-Block. Vor dessen Umsetzung/PR ist der aktuelle `main` erneut zu korrelieren. Guarded Live bleibt blockiert.
