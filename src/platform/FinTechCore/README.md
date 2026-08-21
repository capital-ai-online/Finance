# CAPITAL-AI FinTech Core

Der `FinTechCore` ist die versionierte finanzielle Workflow-Composition-Schicht von CAPITAL-AI. Er komponiert Research-, Paper-, spaeter Risk-/Compliance- und Execution-Gates, besitzt aber keine produktive Scoring-, IAM-, Compliance-Policy- oder Deployment-Authority.

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

`Modules/Crypto/CryptoCategoryProfileResolver.ts` erweitert die kanonische `CryptoClassification` um einen nicht-scorenden Analyse-Layer:

```text
canonical primary category
        +
verified/deterministic secondary taxonomy evidence
        ↓
primary analysis profile + deduplicated secondary profiles
```

Agent-/LLM-Research kann kein Secondary Profile promoten. Conditional Categories benoetigen explizite Semantik-/Evidence-Qualifier.

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

Der Verified-Crypto-Snapshot-Adapter fuehrt selbst keinen Provider-I/O aus und erzeugt keinen Score.

## FT-2C Technical Pattern Engine Foundation

Die Pattern-Schicht trennt:

1. detector-agnostische OHLCV-/Pattern-Contracts;
2. immutable Exact-Key Reliability Registry;
3. deterministische Multi-Timeframe-/Kontextaufloesung;
4. `PatternResearchEngine` fuer Research/Paper.

Reliability gilt nur fuer den exakten Key aus Asset, Analysis Profile, Timeframe, Market Regime, Pattern und Validation-Version. Pattern-Resultate bleiben:

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

### Simulierte Accounting-Grenze

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange routing = false
```

Paper-Mengen und Geldwerte werden JSON-sicher als Fixed-Point `atoms + scale` modelliert und intern mit `BigInt` berechnet. Dadurch haengt Replay nicht von binaerer Floating-Point-Rundung ab.

Ein Paper Account traegt nur fiktive:

- Quote Balance,
- Asset Balance,
- Average Entry Price,
- Gross Realized PnL,
- kumulierte Fees,
- kumuliertes Funding.

Short Selling ist in FT-4 absichtlich nicht implementiert. Ein SELL ueber den simulierten Asset-Bestand wird fail-closed abgelehnt.

### Explicit Cost Evidence

Jeder simulierte Fill benoetigt explizite Kostenannahmen:

- Fee bps,
- Slippage bps,
- Funding Amount oder ausdrueckliches `NOT_APPLICABLE` mit Begruendung,
- Evidence-Refs fuer Markt-/Kostenannahmen.

Es gibt keine versteckten Default-Kosten und keine Behauptung, dass Paper-Fills reale Venue-Fills reproduzieren.

### Durable Replay

Paper State wird nicht als zweite Ledger-Tabelle eingefuehrt. Stattdessen werden die vorhandenen append-only `fintech_core.domain_events` genutzt:

```text
PAPER_ACCOUNT_INITIALIZED (sequence 0)
  -> PAPER_FILL_SIMULATED (sequence 1)
  -> PAPER_FILL_SIMULATED (sequence 2)
  -> ...
```

`PaperTradingWorkflowService` rekonstruiert den State vor jeder neuen Simulation aus dem Journal. Der Replay berechnet gespeicherte Fills erneut und verwirft manipulierte, korrelationsfremde oder nicht-kontinuierliche Eventfolgen.

DB-seitig sichern Guard + Unique Indizes:

- genau eine Paper-Initialisierung pro Run;
- eindeutige `paperSequence` pro Run;
- kanonische Paper Contract-/Kind-/Sequence-Felder;
- Fill-Causation.

Der read-only Replay-RPC `fintech_core_list_domain_events_v1` ist `SECURITY INVOKER` und nur fuer `service_role` ausfuehrbar.

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
- Crypto Module 01 unterstuetzt auch nach FT-4 nur `RESEARCH` und `PAPER`.
- Missing/Stale Evidence wird nicht synthetisch ergaenzt.
- Pattern Evidence bleibt nicht-authorizing.
- Paper Trading erzeugt keinen echten `OrderIntent` und importiert keine Exchange-/Wallet-/Custody-Clients.
- Paper State ist deterministisch aus durable Events rekonstruierbar.
- Service-role RPCs oeffnen das private Finanzschema nicht fuer Browserrollen.
- Side-effecting Live-Aktionen bleiben bis zu den spaeteren FT-5/FT-6/FT-7-Gates unverdrahtet.

## Naechster Roadmap-Block

Nach FT-4 folgt **FT-5 Deterministic Risk + Compliance**. Guarded Live und Production bleiben weiterhin blockiert.
