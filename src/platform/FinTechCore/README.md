# CAPITAL-AI FinTech Core

Der `FinTechCore` ist die versionierte finanzielle Workflow-Composition-Schicht von CAPITAL-AI. Er komponiert Research-, Paper-, Risk-/Compliance- und spaeter Execution-Gates, besitzt aber keine produktive Scoring-, IAM-, Compliance-Policy- oder Deployment-Authority.

## Aktueller Implementierungsstand

- Roadmap: `FT-CORE-CRYPTO-01`
- Architekturentscheidung: `ADR-0099` (`proposed`)
- erstes Modul: `fintech-core.crypto`
- FT-1: Core Engine, Module Registry, deterministic Workflow State Machine; Runtime-Modi `RESEARCH` und `PAPER`
- FT-2A: provenance-aware Primary-/Secondary-Analyseprofile
- FT-2B: kategoriespezifische Feature-/Evidence-Contracts und Verified-Snapshot-Adapter
- FT-2C: detector-agnostische Pattern Detection Contracts, Reliability Registry und Multi-Timeframe Research Resolver
- FT-3: private durable Workflow-/Event-/Decision-/OrderIntent-Persistenz sowie service-role-only Application Boundary
- FT-4: deterministic, durable/replay-faehiges Paper Trading mit explizit simulierten Balances und Cost Evidence
- FT-5: deterministic Pre-Trade Risk + Compliance Decisions mit versionierter Policy-/Authority-Bindung
- FT-6A: PAPER-only Decision-Hash-Bindung an immutable OrderIntent, Idempotency/Client-Order-ID und typed Reconciliation
- DeFiLlama: read-only DeFi-Evidence-Vorarbeit; keine direkte Score-/Order-Authority
- keine reale Exchange-/Custody-Ausfuehrung

## Authority Boundary

Der FinTech Core besitzt **keine** produktive Scoring-Authority.

Kanonisches Scoring bleibt:

```text
UAI
  -> verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. Der Core ersetzt keine IAM-, Compliance-Policy-, Quality-, Release-, Deployment- oder Supervisor-Authority.

## FT-1 Core Engine

- `CoreContracts.ts` — Workflow-, Decision-, OrderIntent- und Operating-Mode-Vertraege.
- `CoreModuleRegistry.ts` — constructor-bound, immutable und fail-closed Module Resolution.
- `CoreEngine.ts` — side-effect-freie Workflow-Vorbereitung und -Initialisierung.
- `Runtime/WorkflowStateMachine.ts` — deterministische, replay-faehige State Transitions.
- `Modules/Crypto/CryptoCoreModule.ts` — Module 01 Descriptor; nur Research/Paper.
- `CryptoModuleContracts.ts` — Kategorieprofile, Pattern-Taxonomie und Reliability Contracts.

## FT-2A Category Profile Resolution

`Modules/Crypto/CryptoCategoryProfileResolver.ts` erweitert die kanonische `CryptoClassification` um einen nicht-scorenden Analyse-Layer. Agent-/LLM-Research kann kein Secondary Profile promoten. Conditional Categories benoetigen explizite Semantik-/Evidence-Qualifier.

## FT-2B Category Feature Contracts

`Modules/Crypto/CryptoCategoryFeatureContracts.ts` definiert typed Feature-Schemata fuer Layer 1, Layer 2/Rollup, DeFi, RWA, NFT, Stablecoin, Exchange Token, GameFi und AI/DePIN. Requirement-Klassen sind `REQUIRED`, `OPTIONAL` und `HARD_GATE`.

Feature Evidence traegt Provider, Evidence-Refs, Observed-/Retrieved-Timestamps und explizite Availability-/Freshness-Zustaende. Fehlende oder stale Werte werden nie zu `0` oder `PASS` umgedeutet.

Universal Market Evidence ist keine Category Evidence:

```text
volume        != liquidity quality
market cap    != network adoption
supply        != tokenomics quality
price change  != technical pattern quality
market data   != TVL / protocol revenue / reserve quality
```

## FT-2C Technical Pattern Engine Foundation

Die Pattern-Schicht trennt detector-agnostische OHLCV-/Pattern-Contracts, immutable Exact-Key Reliability, deterministische Multi-Timeframe-/Kontextaufloesung und `PatternResearchEngine` fuer Research/Paper.

Pattern-Resultate bleiben:

```text
scoreEligible     = false
executionEligible = false
authority         = RESEARCH_CONTEXT_ONLY
```

Fees/Slippage/Funding in Pattern Validation sind Research-Validation, keine produktive Trading-Policy. TA-Lib bleibt ein spaeterer separat zu pruefender Detector-/Indicator-PoC-Kandidat.

## FT-3 Durable Workflow & Traceability

FT-3 verwendet ein privates `fintech_core` Schema:

```text
workflow_runs
domain_events
decision_records
order_intents
reconciliation_records
```

Eigenschaften:

- `anon`/`authenticated` ohne Schema-Zugriff;
- `service_role` Least Privilege;
- RLS als Defense in Depth;
- append-only Event-/Decision-/Intent-/Reconciliation-Evidence;
- immutable Workflow-Identitaet/-Kontext;
- idempotente bzw. Compare-and-Set RPC-Boundaries;
- `FinTechCorePersistencePort` bleibt storage-agnostisch;
- `server/fintechCorePersistence.ts` ist die privilegierte Supabase-Bindung;
- `public.outbox_jobs` bleibt die Queue-/Lease-Authority.

Persistenz ist keine Execution.

## FT-4 Research & Paper Trading

FT-4 fuegt `PaperTrading/` als pure Domain-Schicht hinzu.

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange routing = false
```

Paper-Mengen und Geldwerte werden JSON-sicher als Fixed-Point `atoms + scale` modelliert und intern mit `BigInt` berechnet. Ein Paper Account traegt nur fiktive Quote-/Asset-Balances, Average Entry Price, Gross Realized PnL, Fees und Funding. Short Selling, Margin und Leverage sind nicht implementiert.

Jeder simulierte Fill benoetigt explizite Fee-, Slippage- und Funding-Evidence. Paper State wird nicht als zweite Ledger-Tabelle eingefuehrt, sondern aus den append-only `fintech_core.domain_events` rekonstruiert:

```text
PAPER_ACCOUNT_INITIALIZED (sequence 0)
  -> PAPER_FILL_SIMULATED (sequence 1..N)
```

DB-seitig sichern Guard + Unique Indizes die kanonische Paper-Payload, genau eine Initialisierung, eindeutige `paperSequence` und Fill-Causation. Der read-only Replay-RPC `fintech_core_list_domain_events_v1` ist `SECURITY INVOKER` und nur fuer `service_role` ausfuehrbar.

## FT-5 Deterministic Risk + Compliance

FT-5 fuegt `RiskCompliance/` als pure, provider-neutrale Domain-Schicht hinzu.

### Deterministische Risk Gates

`DeterministicPreTradeGate.ts` bewertet:

```text
ORDER_NOTIONAL
GROSS_EXPOSURE
DRAWDOWN
LIQUIDITY
STALENESS
COUNTERPARTY
```

Grenzwerte werden **nicht** im Engine-Code als regulatorische Wahrheit definiert. Ein `FinTechCoreRiskPolicySnapshot` liefert Policy-ID/-Version, monetare Limits, Drawdown-/Liquidity-/Freshness-Grenzen und die erwarteten Evidence-Authorities.

Order-, Portfolio-, Liquidity-, Market- und Counterparty-Evidence muss provenance-faehig sein. Eine Authority-Abweichung, fehlende Evidence oder stale Evidence wird fail-closed zu `NOT_COMPUTABLE`; ein verifiziertes Limit-/Counterparty-Fail wird `REJECTED`.

### Compliance Integration Points

FT-5 definiert typed Integrationspunkte fuer:

```text
KYC
KYB
AML
SANCTIONS
WALLET_SCREENING
JURISDICTION
TRAVEL_RULE
```

Der `FinTechCoreCompliancePolicySnapshot` bestimmt explizit, welche Controls fuer einen konkreten Workflow erforderlich sind und welche Authority jedes Control belegen muss. Der Core leitet **nicht** selbst ab, ob beispielsweise KYB oder Travel Rule rechtlich erforderlich ist.

Ein Control kann `PASS`, `FAIL`, `MISSING`, `STALE` oder `REVIEW_REQUIRED` liefern. Nur frische, provenance-faehige und an die Policy-Authority gebundene `PASS`-Evidence kann `APPROVED` werden.

### Keine LLM-Autorisierung

Bestehende AI-/Research-Risk-Agents duerfen Kontext anreichern, aber niemals eine Risk- oder Compliance-Freigabe autorisieren. Die FT-5-Architekturtests verbieten direkte AI-/Agent-/Provider-/Exchange-Imports in der Gate-Schicht.

### Decision Evidence Reuse

FT-5 erzeugt keine neue Datenbanktabelle. `RiskComplianceDecisionRecords.ts` mappt die beiden Gate-Ergebnisse in bestehende FT-3 `FinTechCoreDecisionRecord`s:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Input-/Output-Hashes bleiben auditierbare, append-only Evidence.

## FT-6A OrderIntent Decision Binding & Reconciliation

FT-6A implementiert die Kontrollschicht zwischen FT-5 und einer spaeteren, separat autorisierten Execution-Schicht.

```text
approved FT-5 Risk Decision
  + approved FT-5 Compliance Decision
  + exact Run/Trace/Correlation/Asset/Decision identity
  + decision output hashes
      ↓
FinTechCoreBoundOrderIntent
      ↓
intentHash + idempotencyKey + clientOrderId + TTL + price/quantity/slippage bounds
      ↓
append-only private persistence
      ↓
Decision ↔ OrderIntent reconciliation
```

### Bindungsregeln

`OrderIntent/OrderIntentBinding.ts` akzeptiert nur:

- `PAPER` Operating Mode;
- `PRE_TRADE_RISK_GATE = APPROVED`;
- `PRE_TRADE_COMPLIANCE_GATE = APPROVED`;
- identische `runId`, `traceId`, `correlationId`, `moduleId`, `assetId`, `decisionVersion`;
- vorhandene Decision Output Hashes;
- positive Quantity;
- gueltige Price-/Slippage-Bounds;
- `expiresAt > createdAt`;
- Intent Creation nach den referenzierten Decisions.

`riskApproval` und `complianceApproval` werden **nicht vom Aufrufer gesetzt**, sondern aus den Decision Records abgeleitet. Risk-/Compliance-Decision-ID, Output Hash, Policy-Version, Workflow-Identitaet, Bounds und Evidence werden in den deterministischen SHA-256 `intentHash` gebunden.

Der Contract liefert weiterhin:

```text
executionHandoffEligible = false
```

Damit kann FT-6A keinen realen Trade autorisieren.

### Reconciliation

`Reconciliation/ReconciliationContracts.ts` validiert bei Replay erneut:

- Decision Types und Outcomes;
- Workflow-/Asset-Identitaet;
- Decision IDs;
- Decision Output Hashes;
- abgeleitete Approval States.

Ein Drift oder Tampering wird `MISMATCH` und nie automatisch repariert/promoviert. Die implementierte Reconciliation behauptet weder Settlement-Finality noch reale Execution.

### Private Persistenz

Die Branch-Migration `20260822002500_fintech_core_ft6_order_intent_reconciliation.sql` erweitert die vorhandene FT-3-Struktur um Decision-Binding-Felder, `client_order_id`, Foreign Keys zu append-only Decision Records sowie service-role-only `SECURITY INVOKER` RPCs.

**Die Migration ist in diesem Branch vorbereitet, aber nicht produktiv angewendet.**

## Drive-Quelle und Data Quality

Die Drive-Referenz `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf` wird als Architektur-/Best-Practice-Input verwendet, nicht als neue Runtime-Authority. Insbesondere der dort beispielhaft genannte DQ-Schwellenwert `0.80` wird nicht global hardcodiert. Fuehrend bleiben die bestehenden `MarketEvidenceQualityRecord`-Semantiken und extern versionierten Risk-/Feature-Policies.

## Workflow-State-Machine

```text
CREATED
  -> RUNNING
  -> WAITING_FOR_APPROVAL
  -> RUNNING
  -> COMPLETED
```

`REJECTED`, `FAILED` und `EMERGENCY_STOPPED` sind terminal. Ein terminaler Run wird nicht implizit wieder geoeffnet.

## Security / Data Integrity

- Module Topology ist zur Laufzeit nicht mutierbar.
- Crypto Module 01 unterstuetzt in FT-6A weiterhin nur `RESEARCH` und `PAPER`; OrderIntent Binding selbst ist PAPER-only.
- Missing/Stale/Mismatched-Authority Evidence wird nicht synthetisch ergaenzt.
- Pattern Evidence bleibt nicht-authorizing.
- Paper Trading verwendet kein reales Kapital.
- FT-5 Freigaben sind deterministisch; LLM-/Agent-Output kann sie nicht erteilen.
- FT-6 Approval States werden aus append-only Decision Records abgeleitet und hash-gebunden.
- Intent-/Idempotency-/Client-Order-ID-Kollisionen sind fail-closed.
- Reconciliation-Mismatch bleibt sichtbare Evidence.
- Service-role RPCs oeffnen das private Finanzschema nicht fuer Browserrollen.
- `public.outbox_jobs` bleibt die einzige Queue-/Lease-Authority.
- Side-effecting Live-Aktionen, Exchange-/Custody-/Wallet-Adapter und Settlement-Finality bleiben unverdrahtet.

## Naechste Roadmap-Schritte

FT-6A ist auf dem Branch implementiert. Vor Abschluss von FT-6 bleiben:

1. Hosted CI/Governance fuer den finalen Branch-Snapshot;
2. separat autorisierte Anwendung/Verification der FT-6 SQL-Migration;
3. `ORDER_INTENT_PAPER_FILL` Reconciliation gegen Paper-Replay;
4. Crash-/Duplicate-/Replay-Verifikation der DB-RPCs;
5. 24-Asset Crypto Universe Availability-/Evidence-Admittance-Nachweis auf der bestehenden SC-2/Universe-SLA-Kette.

`GUARDED_LIVE` und `PRODUCTION` bleiben FT-7+ und sind nicht durch FT-6A freigeschaltet.
