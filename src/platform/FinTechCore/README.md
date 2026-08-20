# CAPITAL-AI FinTech Core

Der `FinTechCore` ist die versionierte finanzielle Workflow-Composition-Schicht von CAPITAL-AI.

## Aktueller Implementierungsstand

- Roadmap: `FT-CORE-CRYPTO-01`
- Architekturentscheidung: `ADR-0098` (`proposed`)
- erstes Modul: `fintech-core.crypto`
- FT-1 Runtime-Modi: ausschließlich `RESEARCH` und `PAPER`
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
- `GUARDED_LIVE` und `PRODUCTION` werden vom Crypto-Modul in FT-1 nicht unterstützt.
- Missing Evidence wird nicht synthetisch ergänzt.
- Side-effecting Actions bleiben bis zu späteren Roadmap-Gates unverdrahtet.
- Generische Retry-Mechanismen dürfen später keine Live-Order ohne proven end-to-end Idempotency wiederholen.

## Persistenz

FT-1 besitzt absichtlich keine eigene Persistenz. FT-3 entscheidet nach Migration-/Security-Review über durable Workflow-/Decision-/OrderIntent-Strukturen und die Wiederverwendung von `outbox_jobs` bzw. eine begründete Queue-Konvergenz.
