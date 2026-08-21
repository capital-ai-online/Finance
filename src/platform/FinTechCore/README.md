# CAPITAL-AI FinTech Core

Der `FinTechCore` ist die versionierte finanzielle Workflow-Composition-Schicht von CAPITAL-AI.

## Aktueller Implementierungsstand

- Roadmap: `FT-CORE-CRYPTO-01`
- Architekturentscheidung: `ADR-0099` (`proposed`)
- erstes Modul: `fintech-core.crypto`
- FT-1 Runtime-Modi: ausschließlich `RESEARCH` und `PAPER`
- FT-2A: provenance-aware Primary-/Secondary-Analyseprofile
- FT-2B: kategoriespezifische Feature-/Evidence-Contracts und Verified-Snapshot-Adapter
- FT-2C: detector-agnostische Pattern Detection Contracts, Reliability Registry und Multi-Timeframe Research Resolver
- keine externe Plattformmutation
- keine Exchange-/Custody-Side-Effects

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

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.

Der Core darf außerdem keine IAM-, Compliance-Policy-, Quality-, Release-, Deployment- oder Supervisor-Authority ersetzen.

## FT-1 Komponenten

- `CoreContracts.ts` — Workflow-, Decision-, OrderIntent- und Operating-Mode-Verträge.
- `CoreModuleRegistry.ts` — constructor-bound, immutable und fail-closed Module Resolution.
- `CoreEngine.ts` — side-effect-freie Workflow-Vorbereitung und -Initialisierung.
- `Runtime/WorkflowStateMachine.ts` — deterministische, replay-fähige State Transitions.
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

Agent-/LLM-Research kann kein Secondary Profile promoten. Conditional Categories wie `AI / Data` oder `NFT / Creator` benötigen explizite Semantik-/Evidence-Qualifier.

## FT-2B Category Feature Contracts

`Modules/Crypto/CryptoCategoryFeatureContracts.ts` definiert typed Feature-Schemata für:

- Layer 1,
- Layer 2 / Rollup,
- DeFi,
- RWA,
- NFT,
- Stablecoin,
- Exchange Token,
- GameFi,
- AI/DePIN.

Jede Feature-Definition besitzt eine Requirement-Klasse:

- `REQUIRED`
- `OPTIONAL`
- `HARD_GATE`

Feature Evidence trägt Provider, Evidence-Refs, Observed-/Retrieved-Timestamps und explizite Availability-/Freshness-Zustände. Fehlende oder stale Werte werden nie zu `0` oder `PASS` umgedeutet.

### Universal market evidence != category evidence

Der aus PR #458 stammende `VerifiedCryptoSnapshot` wird nur über einen **pure adapter** in universelle Markt-/Supply-Evidence überführt:

- Price,
- 24h Change,
- Market Cap,
- 24h Volume,
- Circulating / Max / Total Supply.

Diese Werte erfüllen keine kategoriespezifische Anforderung automatisch. Insbesondere gelten folgende implizite Ableitungen als verboten:

```text
volume        != liquidity quality
market cap    != network adoption
supply        != tokenomics quality
price change  != technical pattern quality
market data   != TVL / protocol revenue / reserve quality
```

Der Adapter führt selbst keinen Provider-I/O aus und erzeugt keinen Score. Degraded/last-known-good Providerdaten werden als `STALE` markiert.

## FT-2C Technical Pattern Engine Foundation

Die Pattern-Schicht ist in vier Authorities getrennt:

1. `PatternDetectionContracts.ts` — detector-agnostischer OHLCV-/Detector-SPI.
2. `PatternReliabilityRegistry.ts` — immutable Exact-Key Reliability Registry.
3. `PatternSignalResolver.ts` — deterministische Multi-Timeframe-/Kontextauflösung.
4. `PatternResearchEngine.ts` — Composition der drei Schichten für Research/Paper.

### Exact-key Reliability

Ein Reliability Record gilt ausschließlich für:

```text
assetId
+ analysis profile
+ timeframe
+ market regime
+ patternId
+ validationVersion
```

Es gibt keinen globalen Cross-Asset-/Cross-Timeframe-/Cross-Regime-Fallback.

Die Owner-Defaults für mindestens 100 Beobachtungen, 730/180 Tage Train/Validation, Walk-forward sowie Fees/Slippage/Funding werden als **Research-Validation**, nicht als Produktions-/Trading-Policy behandelt. Ein Registry Record kann seinen Status nicht selbst auf `VALIDATED` setzen; der Registry lädt ihn nur, wenn die deterministische Reevaluation denselben Status ergibt.

### Pattern-Konfliktauflösung

Der Resolver erzeugt keinen neuen gewichteten Pattern Score. Die Source-Priorität wird lexikographisch angewendet:

```text
higher timeframe
  > pattern group / structure priority
  > breakout evidence
  > volume confirmation
  > context / relevant level
  > market-regime fit
```

Gegenläufige Pattern mit identischer Priorität bleiben `CONFLICTING_EVIDENCE`. Niedriger priorisierte Gegensignale werden als `suppressed` erhalten, nicht gelöscht.

Jedes Ergebnis bleibt:

```text
scoreEligible     = false
executionEligible = false
authority         = RESEARCH_CONTEXT_ONLY
```

TA-Lib oder eine andere technische Analysebibliothek ist in FT-2C noch nicht gebunden. Der Detector-SPI erlaubt einen späteren separat geprüften PoC, ohne Reliability, Kontext oder Governance an eine externe Library zu delegieren.

## Workflow-State-Machine

```text
CREATED
  -> RUNNING
  -> WAITING_FOR_APPROVAL
  -> RUNNING
  -> COMPLETED
```

Fail-/Stop-Zustände sind terminal:

```text
REJECTED
FAILED
EMERGENCY_STOPPED
```

Ein terminaler Run wird nicht implizit wieder geöffnet. Retry/Replay benötigt einen neuen `runId` und später einen durable Audit-/Causation-Nachweis.

## Security / Data Integrity

- Module Topology ist zur Laufzeit nicht mutierbar.
- `GUARDED_LIVE` und `PRODUCTION` werden vom Crypto-Modul in FT-1/FT-2 nicht unterstützt.
- Missing Evidence wird nicht synthetisch ergänzt.
- Unknown Feature Evidence wird nicht implizit promotet.
- Fehlende Hard Gates führen fail-closed zu `NOT_COMPUTABLE`; ein verifiziertes `false` blockiert den Feature Contract.
- Pattern ohne exakte validierte Reliability wird nicht als Research-Kontext ausgewählt.
- Gleichrangige Richtungswidersprüche werden nicht künstlich aufgelöst.
- Side-effecting Actions bleiben bis zu späteren Roadmap-Gates unverdrahtet.
- Generische Retry-Mechanismen dürfen später keine Live-Order ohne proven end-to-end Idempotency wiederholen.

## Persistenz

FT-1/FT-2 besitzen absichtlich keine eigene Persistenz. FT-3 entscheidet nach Migration-/Security-Review über durable Workflow-/Decision-/OrderIntent-Strukturen und die Wiederverwendung von `outbox_jobs` bzw. eine begründete Queue-Konvergenz.
