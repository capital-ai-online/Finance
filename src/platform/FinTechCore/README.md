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
- FT-5: deterministic Pre-Trade Risk + Compliance Gates mit versionierter Policy-/Authority-Bindung
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

`DeterministicPreTradeGate.ts` bewertet sechs versionierte Gates:

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

Bestehende AI-/Research-Risk-Agents duerfen FT-5-Evidence anreichern, aber niemals eine Risk- oder Compliance-Freigabe autorisieren. Die FT-5-Architekturtests verbieten direkte AI-/Agent-/Provider-/Exchange-Imports in der Gate-Schicht.

### Decision Evidence Reuse

FT-5 erzeugt keine neue Datenbanktabelle. `RiskComplianceDecisionRecords.ts` mappt die beiden Gate-Ergebnisse in bestehende FT-3 `FinTechCoreDecisionRecord`s:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Input-/Output-Hashes bleiben Infrastrukturverantwortung; der Domain-Layer erzeugt keine zweite Hashing-Authority.

### OrderIntent Handoff

Ein approval-bound OrderIntent-Handoff ist nur moeglich, wenn:

- Risk = `APPROVED`,
- Compliance = `APPROVED`,
- Run/Trace/Correlation/Asset/Decision-Version exakt passen,
- der Operating Mode `GUARDED_LIVE` oder `PRODUCTION` ist.

Crypto Module 01 aktiviert diese Modi in FT-5 **nicht**. `PAPER` darf Risk/Compliance evaluieren, aber `executionHandoffEligible` bleibt dort immer `false`. FT-5 signiert, routet, persistiert oder exekutiert keine Order.

### OSS-/Policy-Engine-Entscheidung

OPA und Cedar wurden als etablierte Apache-2.0 Policy-Engines bewertet. Beide sind fuer komplexe zentrale Policy-as-Code-Szenarien geeignet. FT-5 integriert sie noch nicht, weil der aktuelle Scope nur eine kleine typed Evaluation bestehender extern versionierter Policy-Snapshots benoetigt und eine zusaetzliche Policy-Runtime/DSL eine neue Authority-/Dependency-Oberflaeche erzeugen wuerde.

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
- Crypto Module 01 unterstuetzt auch nach FT-5 nur `RESEARCH` und `PAPER`.
- Missing/Stale/Mismatched-Authority Evidence wird nicht synthetisch ergaenzt.
- Pattern Evidence bleibt nicht-authorizing.
- Paper Trading erzeugt keinen echten execution-authorizing OrderIntent-Handoff.
- Risk-/Compliance-Freigaben sind deterministisch; LLM-/Agent-Output kann sie nicht erteilen.
- Compliance Requirements und Authority-Bindings kommen aus versionierten externen Policy-Snapshots.
- Service-role RPCs oeffnen das private Finanzschema nicht fuer Browserrollen.
- Side-effecting Live-Aktionen bleiben bis FT-6/FT-7 unverdrahtet.

## Naechster Roadmap-Block

Nach FT-5 folgt **FT-6 OrderIntent & Reconciliation**. Guarded Live und Production bleiben weiterhin blockiert.
