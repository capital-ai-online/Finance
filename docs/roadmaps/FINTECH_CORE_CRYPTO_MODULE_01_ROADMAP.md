# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.4.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-5 umgesetzt; FT-6 als naechster Roadmap-Block  
**Owner-Prioritaet:** Chat-Prioritaet 2026-08-20; Fortsetzung FT-3/FT-4/FT-5 2026-08-21  
**Execution Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`  
**FT-4/FT-5 Baseline:** `main@a0663563a6a01bbdf292db8796c1b291bdd8ee57`  
**Work Claims:** `FINTECH-CORE-FT4-RESEARCH-PAPER-TRADING-2026-08-21`, `FINTECH-CORE-FT5-DETERMINISTIC-RISK-COMPLIANCE-2026-08-21`  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087`, `SC-2`, `ScoringModelRegistry`, `ScoringDispatcher`

## 1. Ziel

Der Enterprise Crypto Orchestrator komponiert einen reproduzierbaren und auditierbaren Finanz-Workflow, ist aber weder Trading-Strategie noch zweite Scoring-Engine. Der Scope umfasst Category-/Pattern-Evidence, durable Workflow-/Decision-Evidence, simuliertes Paper Accounting, deterministische Risk-/Compliance-Entscheidungen und spaetere OrderIntent-/Execution-/Reconciliation-Gates.

## 2. Nicht verhandelbare Architektur-Invarianten

1. Produktive Scores entstehen ausschliesslich ueber `ScoringModelRegistry -> ScoringDispatcher -> CanonicalScoreResult`.
2. `CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.
3. Missing/stale Evidence wird nicht synthetisch zu `0`, `PASS` oder einer Erfolgswahrscheinlichkeit umgedeutet.
4. FinTech Core ersetzt keine IAM-, Compliance-Policy-, Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.
5. Side-effecting Actions benoetigen vor Retry end-to-end Idempotency.
6. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert, bis die spaeteren Gates explizit erfuellt sind.
7. `public.outbox_jobs` bleibt die Queue-/Lease-Authority; keine zweite Queue wird eingefuehrt.
8. Das private Schema `fintech_core` wird nicht fuer Browserrollen geoeffnet.
9. FT-4 Paper Trading verwendet ausschliesslich fiktives Kapital; Fees/Slippage/Funding sind explizite Evidence.
10. Paper State muss deterministisch aus append-only durable Events rekonstruierbar sein.
11. FT-5 Policy-Grenzwerte und erforderliche Controls kommen als versionierte externe Policy-Snapshots; der Core erfindet keine Rechts-/Business-Policy.
12. FT-5 akzeptiert keinen LLM-/Agent-Output als Risk-/Compliance-Freigabe.
13. PASS-Evidence muss an die erwartete Authority gebunden, provenance-faehig und frisch sein.
14. FT-5 produziert ausschließlich Decisions; `executionHandoffEligible=false` fuer **alle** Operating Modes.
15. Die Bindung von FT-5 Decisions an einen `OrderIntent` gehoert zu FT-6.
16. Crypto Module 01 unterstuetzt durch FT-5 weiterhin nur `RESEARCH` und `PAPER`.

## 3. Main-Korrelation 2026-08-21

PR #467 machte FT-0..FT-2C und ADR-0099 auf `main` kanonisch. PR #468 machte FT-3 Durable Workflow & Traceability kanonisch.

FT-4 und die vom Owner vor PR-Erstellung angeforderte FT-5-Fortsetzung wurden auf dem dedizierten Branch direkt von `main@a0663563a6a01bbdf292db8796c1b291bdd8ee57` umgesetzt. Vor FT-5 war der Branch `0 behind`; es existierte kein paralleler offener FinTech-/ADR-0099-PR.

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

FT-0 etabliert Contract-/Governance-/Authority-Baseline. FT-1 liefert `FinTechCoreEngine`, Module Registry, deterministic Workflow State Machine und die Modi `RESEARCH`/`PAPER`. FT-2A trennt kanonische Crypto-Taxonomie und provenance-aware Analysis Profiles. FT-2B liefert typed Category Feature/Evidence Contracts. FT-2C liefert detector-agnostische Pattern-Contracts, Exact-Key Reliability und Multi-Timeframe Research Resolution; Pattern bleibt `scoreEligible=false`, `executionEligible=false`, `RESEARCH_CONTEXT_ONLY`.

Offen aus FT-2C bleiben reliability-/conflict-gated 1h/4h-Promotion, Double-Counting-Schutz und ein spaeter separat gepruefter TA-Lib/Detector-PoC.

## 6. FT-3 — Durable Workflow & Traceability — DONE

Produktiv vorhanden:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Das Schema ist privat, RLS/Least Privilege bleibt aktiv, append-only Evidence und immutable Workflow-Identitaet werden erzwungen. `FinTechCorePersistencePort` bleibt storage-agnostisch; serverseitige RPCs sind `SECURITY INVOKER` und service-role-only. Bestehende `public.outbox_jobs`, `agent_audit_events`, `score_snapshots` und Traceability/EventMesh-Primitiven werden wiederverwendet.

## 7. FT-4 — Research & Paper Trading — DONE pending combined post-PR CI

FT-4 implementiert einen durable/replay-faehigen simulierten Workflow:

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange/custody side effects = false
```

### 7.1 Simulierte Balances und Kosten

Paper-Balances, Average Entry Price, Gross Realized PnL, Fees und Funding werden als JSON-safe Fixed-Point `atoms + scale` mit `BigInt` berechnet. Short Selling, Margin und Leverage sind nicht implementiert. Jeder Fill besitzt explizite Fee-/Slippage-/Funding-Evidence.

### 7.2 Deterministic Fill + Replay

`PaperTradingEngine.ts` simuliert BUY/SELL, blockiert unzureichenden Bestand, erzeugt `FinTechCoreDomainEvent`s und nutzt `paperSequence`/`causationId`. `PaperTradingWorkflowService.ts` rekonstruiert den aktuellen State vor jeder Simulation.

Es gibt keine zweite Paper-Ledger-Tabelle; Journal bleibt `fintech_core.domain_events`:

```text
PAPER_ACCOUNT_INITIALIZED   sequence 0
PAPER_FILL_SIMULATED        sequence 1..N
```

DB-Guards erzwingen kanonische Payload-/Sequence-Semantik, genau eine Initialisierung und Fill-Causation.

### 7.3 Replay Reader / Production Verification

Der read-only `FinTechCoreDomainEventReaderPort` nutzt `public.fintech_core_list_domain_events_v1(text)`, `SECURITY INVOKER`, service-role-only.

Produktionsmigration: `20260821071823 — fintech_core_paper_replay_reader`.

Verifiziert wurden RLS/Privileges, Guards/Unique Indizes, Replay-Reihenfolge, Duplicate-/Causation-Negativfaelle, 0 Testdaten nach Rollback und keine neuen FT-4 Security-/FK-Advisor-Findings.

### 7.4 Open Source

QuantConnect LEAN und NautilusTrader wurden bewertet, aber fuer den engen Paper-Scope wegen ueberbreiter Runtime-/Execution-/Dependency-Flaeche nicht integriert.

## 8. FT-5 — Deterministic Risk + Compliance — DONE pending combined post-PR CI

### 8.1 Risk Gates

`RiskCompliance/DeterministicPreTradeGate.ts` bewertet:

```text
ORDER_NOTIONAL
GROSS_EXPOSURE
DRAWDOWN
LIQUIDITY
STALENESS
COUNTERPARTY
```

Grenzwerte kommen aus einem extern versionierten `FinTechCoreRiskPolicySnapshot`. Monetaere Werte verwenden FT-4 Fixed-Point/`BigInt`. Order-, Portfolio-, Liquidity-, Market- und Counterparty-Evidence besitzt eigene Provenance-/Authority-Bindung.

### 8.2 Compliance Integration Points

Typed Integrationspunkte:

```text
KYC
KYB
AML
SANCTIONS
WALLET_SCREENING
JURISDICTION
TRAVEL_RULE
```

`FinTechCoreCompliancePolicySnapshot` legt explizit fest, welche Controls erforderlich sind, welche Evidence Authority je Control zulaessig ist und wie alt Evidence maximal sein darf. Der Core erfindet weder rechtliche Anwendbarkeit noch Provider-Ergebnisse.

Control-Zustaende: `PASS`, `FAIL`, `MISSING`, `STALE`, `REVIEW_REQUIRED`. Nur frische, provenance-faehige und authority-bound PASS-Evidence kann `APPROVED` werden.

### 8.3 Fail-Closed Semantik

```text
REJECTED > NOT_COMPUTABLE > REVIEW_REQUIRED > APPROVED
```

Limit-/Counterparty-/Sanctions-Fail wird `REJECTED`; missing/stale/mismatched-authority Evidence wird `NOT_COMPUTABLE`; Human/Provider Review bleibt `REVIEW_REQUIRED`. Es gibt keine synthetischen PASS-/Zero-/Probability-Fallbacks.

### 8.4 Keine LLM-/Parallel-Authority

`CryptoRiskAgent` und andere AI-/Research-Komponenten duerfen Kontext liefern, aber keine FT-5-Freigabe autorisieren. `src/platform/Compliance` bleibt Repository-/ISO-Compliance-Komponente; ADR-0058 bleibt Agent-/Tool-Risk-Authorization. Architecture Tests blockieren direkte AI-/Agent-/Provider-/Exchange-Imports in der FT-5 Gate-Schicht.

### 8.5 Durable Decision Evidence Reuse

FT-5 fuehrt keine neue Tabelle ein. `RiskComplianceDecisionRecords.ts` mappt Ergebnisse in bestehende FT-3 `FinTechCoreDecisionRecord`s:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Policy-ID/-Version, Run/Trace/Correlation/Asset/Decision-Version, Hashes, Evidence-Refs und Outcome bleiben auditierbar.

### 8.6 OrderIntent bleibt FT-6

FT-5 erzeugt **keinen** execution-authorizing OrderIntent-Handoff. Der Contract erzwingt fuer jedes FT-5-Ergebnis, unabhaengig vom Operating Mode:

```text
executionHandoffEligible = false
```

Die Bindung von FT-5 Risk-/Compliance-Decision-Hashes und Policy-Versionen an einen immutable `OrderIntent`, das Setzen der Approval-Felder, TTL/Price/Quantity/Slippage Bounds, Client-Order-ID und Reconciliation gehoeren zu FT-6.

Crypto Module 01 bleibt in FT-5 auf `RESEARCH` und `PAPER` beschraenkt.

### 8.7 Regulatory / Best-Practice Abgleich

Die Grenze wurde gegen MiCA Risk-/Record-Keeping, EBA ML/TF Risk Factor Guidelines fuer CASPs, EBA Travel Rule und FATF VA/VASP Targeted Update 2026 abgeglichen. Daraus werden keine jurisdictionsspezifischen Rechtsentscheidungen hardcodiert.

### 8.8 Open Source / Plugins

OPA und Cedar wurden als etablierte Apache-2.0 Policy Engines bewertet, aber nicht integriert: fuer den kleinen typed Evaluator waere eine neue Policy-Runtime/DSL eine unnoetige Authority-/Dependency-Oberflaeche. Die Plugin-Suche ergab keinen geeigneten spezialisierten AML/KYC/Sanctions-Connector.

## 9. FT-6 bis FT-9

### FT-6 OrderIntent & Reconciliation

Naechster Block:

- immutable/hash-bound OrderIntent;
- Bindung von FT-5 Risk-/Compliance-Decisions an Approval State;
- TTL sowie Price/Quantity/Slippage Bounds;
- Idempotency/Client-Order-ID;
- typed Reconciliation-/Settlement-Vertrag;
- Crash-/Duplicate-/Reconciliation-Tests.

### FT-7 Guarded Live

Blockiert bis FT-0..FT-6 bestanden sind. Genau ein CEX-Adapter, Human Approval, Kill Switch, Circuit Breakers und keine Agent-Key-Capability.

### FT-8 Enterprise Hardening

BCP/DR, Custody-Boundary, Multi-Venue, OpenTelemetry/W3C Trace Context, SLOs, Audit Retention, Chaos/Failover und regulatorische Exportfaehigkeit.

### FT-9 DeFi / DEX / Cross-Chain

DEX/Aggregator-, Smart-Contract-, Bridge-, Oracle- und Cross-Chain-Risk/Settlement-Gates. Bleibt weiterhin `PLANNED`/blockiert bis FT-0..FT-8 bestanden sind.

**Evidence-Vorarbeit (ADR-0100, 2026-08-21):** Ein DeFiLlama-Free-Tier-Provider liefert bereits Protokoll-TVL/Fees/Revenue als `CryptoFeatureEvidence` (`protocol.tvlUsd`/`feesUsd`/`revenueUsd`) im Rollout-Status *evidence_only* — ohne ScoringDispatcher-Anbindung, ohne zweiten Dispatcher/Orchestrator und ohne dieses Gate zu verschieben. Siehe `docs/evidence/sc-md/SC6_DEFILLAMA_DEFI_EVIDENCE_PROVIDER_2026-08-21.md`. Die eigentliche FT-9-Scoring-Aktivierung bleibt separate, Owner-freigegebene Folgearbeit.

## 10. Offene Projekt-Chat-Punkte

- externe/Drive-Quellpruefung, falls konkrete Category-/Risk-Formeln erforderlich werden;
- privater Storage-/Evidence-Bucket;
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
- Least Privilege und private financial persistence;
- simuliertes Paper Accounting strikt von realem Kapital trennen;
- Risk-/Compliance-Policy und Evidence Authorities versioniert/externalisieren;
- FT-5 Decisions strikt von FT-6 OrderIntent-Bindung trennen;
- Human/Governance-Gates fuer spaetere produktive Mutationen.

## 12. Open Source / Plugins

- bestehende Repository-Funktionen bleiben fuehrend;
- GitHub fuer Branch-/Registry-/PR-/CI-Governance;
- Supabase/PostgreSQL fuer FT-3/FT-4 Durability;
- keine neue Datenbank-/Queue-/Execution-Dependency fuer FT-5;
- QuantConnect LEAN/NautilusTrader fuer FT-4 bewertet, nicht integriert;
- OPA/Cedar fuer FT-5 bewertet, nicht integriert;
- TA-Lib bleibt spaeterer Detector-/Indicator-PoC-Kandidat.

## 13. Naechster fachlicher Schritt

Nach FT-5 ist **FT-6 OrderIntent & Reconciliation** der naechste Roadmap-Block. Guarded Live bleibt blockiert.
