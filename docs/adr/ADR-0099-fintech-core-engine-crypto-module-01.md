# ADR-0099 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.2.0
- **Date:** 2026-08-21
- **Lifecycle:** proposed
- **Owner Priority:** Chat-Prioritaet 2026-08-20; Main-Sync/Projekt-Chat-Transfer und FT-3-Fortsetzung 2026-08-21
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Work Claim:** `FINTECH-CORE-FT3-DURABLE-TRACEABILITY-2026-08-21`
- **Branch:** `feat/fintech-core-ft3-durable-traceability-v2-2026-08-21`
- **Current Main Baseline:** `5595ec0abe1f1b6755620f3435badbf874d54aba`
- **Supersedes:** none
- **Protected authority:** ADR-0087 / SC-2 Single Scoring Architecture

> Namespace history: Der FinTech-Draft verwendete vor Anwendung des aktuellen Reservation-Contracts vorlaeufig `ADR-0098`. `ADR-0098` ist fuer Media Project v2 belegt. Die stabile FinTech Authority ID blieb unveraendert; der kanonische Display-Identifier ist `ADR-0099`.

## Context

CAPITAL-AI besitzt bereits eine produktive Single-Dispatcher-Scoring-Architektur sowie einen Crypto-Research-Pfad. FinTech Core muss deshalb finanzielle Workflows komponieren, ohne eine parallele Scoring-, Governance-, IAM-, Compliance- oder Execution-Authority einzufuehren.

Geschuetzte Scoring-Kette:

```text
verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.

Mit dem Merge von PR #467 sind die FT-0..FT-2C FinTechCore-Vertraege kanonisch auf `main`. FT-3 fuegt nun durable Workflow-/Event-/Decision-Evidence sowie einen serverseitigen Persistenzadapter hinzu, ohne die bestehenden Authority Boundaries zu verschieben.

## Decision

CAPITAL-AI fuehrt die Plattformgrenze

```text
src/platform/FinTechCore/
```

mit dem ersten Modul

```text
moduleId = fintech-core.crypto
```

fort. FinTech Core ist eine **financial workflow composition authority**, keine Scoring- oder Trading-Strategie.

### 1. Authority Boundaries

FinTech Core darf besitzen:

- Workflow-Lifecycle und Workflow-Korrelation,
- versionierte Decision-/Domain-Event-/OrderIntent-Contracts,
- Operating-Mode-Enforcement,
- geordnete Composition von Category-, Pattern-, Scoring-, Portfolio-, Risk-, Compliance- und spaeter Execution-Adaptern,
- Orchestration-Level-Idempotency und Reconciliation-Anforderungen,
- durable Workflow-/Event-/Decision-/Intent-Evidence innerhalb des privaten `fintech_core` Schemas.

FinTech Core darf nicht besitzen:

- produktive Score-Berechnung oder Modellselektion ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`,
- IAM/AuthN/AuthZ-Policy,
- Compliance-Policy-Definitionen,
- Quality-/Governance-/Supervisor-Authority,
- Deployment-/Release-Authority,
- Exchange-Credentials, Wallet Private Keys oder Custody-Secrets,
- autonome Execution ohne spaetere Risk-/Compliance-/Human-Gates.

### 2. CryptoOrchestrator bleibt Research-only

Die bestehende Research-Grenze bleibt erhalten:

```text
mode = research-enrichment
scoreEligible = false
```

Agent-/LLM-Evidence darf nicht direkt zu `CanonicalScoreResult`, OrderIntent oder Execution promotet werden.

### 3. Category Analysis bleibt getrennt von Canonical Taxonomy

Die bestehende `CryptoCategory` bleibt kompatible Taxonomie. Ein separater Analysis-Profile-Layer kann Profile wie L1, L2, DeFi, RWA, NFT, Stablecoin, Exchange Token, GameFi, AI/DePIN und Meme abbilden.

Nicht belastbar belegte Spezialformeln bleiben `PENDING_EVIDENCE`; es werden keine Gewichte erfunden.

### 4. Feature Evidence ist provenance- und freshness-faehig

Category Feature Contracts muessen Availability, Observed/Retrieved Timestamps, Provider/Evidence-Referenzen und Requirement-Klassen ausdruecken.

Missing oder stale Evidence darf nicht als `0`, `PASS` oder implizit gute Datenqualitaet interpretiert werden.

### 5. Pattern Analysis ist Research Evidence

Pattern Detection, Reliability und Multi-Timeframe Resolution bleiben nicht-authorizing.

Ein Pattern-Ergebnis ist:

```text
scoreEligible     = false
executionEligible = false
authority         = RESEARCH_CONTEXT_ONLY
```

Es gibt keinen separaten produktiven Pattern Score.

### 6. Pattern Reliability ist Exact-Key

Reliability wird mindestens ueber folgende Identitaet gebunden:

```text
assetId
+ analysisProfile
+ timeframe
+ marketRegime
+ patternId
+ validationVersion
```

Kein globaler Cross-Asset-, Cross-Timeframe- oder Cross-Regime-Fallback ist zulaessig.

Research-Validation umfasst mindestens:

- Mindestanzahl Beobachtungen,
- Train-/Validation-Fenster,
- Walk-forward/OOS,
- Fees,
- Slippage,
- Funding,
- nachvollziehbare Validation-Version.

Startwerte aus Quellen sind Research-Defaults und keine produktive Risk Policy.

### 7. Multi-Timeframe-Konflikte bleiben explizit

Der Resolver darf widerspruechliche Evidence nicht synthetisch glattziehen. Higher-Timeframe-/Structure-/Breakout-/Volume-/Context-/Regime-Prioritaeten koennen Evidence ordnen; gleichrangige Gegensignale bleiben `CONFLICTING_EVIDENCE`.

Ein spaeteres 1h/4h Feature darf nur reliability-/conflict-gated, begrenzt und ohne Double Counting eingefuehrt werden.

### 8. Operating Modes

Vertraglich vorgesehen:

- `RESEARCH`
- `PAPER`
- `GUARDED_LIVE`
- `PRODUCTION`
- `EMERGENCY`

FT-1/FT-2 implementieren nur Research/Paper-Faehigkeit. FT-3 persistiert den Operating Mode als Workflow-Kontext, aktiviert aber keine zusaetzliche Execution-Faehigkeit. Ein LLM darf keinen autonomeren/permissiveren Modus aktivieren.

### 9. Retry und Side Effects

Aktionen werden als `RETRY_SAFE` oder `SIDE_EFFECTING` unterschieden.

Live Orders, Withdrawals, Settlement und Custody benoetigen end-to-end Idempotency, Client-/Venue-Order-IDs und definierte Recovery-Semantik, bevor Retry erlaubt ist.

FT-3 `order_intents` sind ausschließlich durable Intent-/Evidence-Records. Persistenz ist keine Execution.

### 10. Durable Workflow State — FT-3

FT-3 implementiert das private Schema:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Eigenschaften:

- `workflow_runs` ist current-state durable persistence mit immutable identity/context und no-delete;
- `domain_events`, `decision_records`, `order_intents`, `reconciliation_records` sind append-only Evidence;
- Correlation/Trace/Decision-Version bleibt ueber die Tabellen hinweg nachvollziehbar;
- OrderIntent besitzt DB-seitige Idempotency-Identitaet und Hash-Bindung;
- Reconciliation ist in FT-3 nur ein Evidence-Scaffold; Settlement-/Custody-Finalitaet wird nicht behauptet;
- RLS und Least Privilege bleiben Defense in Depth;
- `anon` und `authenticated` erhalten keinen Zugriff auf das private Schema;
- `service_role` erhaelt nur die fuer FT-3 erforderlichen Rechte.

Bestehende Repository-/Plattformprimitiven werden weiterverwendet, insbesondere `public.outbox_jobs`, `public.agent_audit_events`, `public.score_snapshots` und bestehende Traceability/EventMesh-Vertraege.

Keine zweite Queue-Authority wird parallel eingefuehrt.

### 11. Application Persistence Boundary

Der Domain-Layer erhaelt einen storage-agnostischen Port:

```text
src/platform/FinTechCore/Persistence/FinTechCorePersistencePort.ts
```

Die konkrete Supabase-Bindung bleibt serverseitig:

```text
server/fintechCorePersistence.ts
```

Der Core importiert keine Supabase-Library und behaelt seine deterministische/domain-orientierte Grenze.

Da `fintech_core` bewusst nicht als Browser/Data-API-Schema geoeffnet wird und das Repository bereits einen gehaerteten privilegierten Supabase-Client besitzt, wird **kein neuer direkter PostgreSQL-Client** eingefuehrt. Stattdessen verwendet der Server fuenf schmale `public` RPC Entry-Points.

Die RPCs muessen:

- `SECURITY INVOKER` verwenden;
- `PUBLIC`, `anon` und `authenticated` EXECUTE entziehen;
- EXECUTE nur `service_role` geben;
- vollqualifiziert auf `fintech_core.*` zugreifen;
- Idempotent Replay bzw. Compare-and-Set fuer Workflow-Zustand durchsetzen;
- keine Risk-/Compliance-/Execution-Authority hinzufuegen.

Dies vermeidet sowohl eine Data-API-Oeffnung des privaten Finanzschemas als auch `SECURITY DEFINER`-Privilege-Elevation.

### 12. Reconciliation Contract bleibt FT-6

Die Tabelle `fintech_core.reconciliation_records` ist durable Evidence-Vorbereitung. Ein typed Application-Reconciliation-Port wird in FT-3 **nicht erfunden**, weil die kanonischen FinTechCore-Vertraege noch keine Settlement-/Custody-Statussemantik definieren.

Die Semantik und der typed Adapter gehoeren zu FT-6 `OrderIntent & Reconciliation`.

### 13. External Platform Mutations

FT-3 verwendet produktive Supabase-Migrationen unter dem dafuer vorgesehenen Migration-/Security-/Governance-Gate.

Keine FT-3-Mutation erfolgt an:

- Render,
- Stripe,
- IAM,
- Scoring-Authority,
- Exchange/Custody.

### 14. Open Source / Dependency Decision

PostgreSQL/Supabase und die vorhandene `@supabase/supabase-js` Serverintegration reichen fuer FT-3 aus.

Ein zusaetzlicher `pg`-Client wurde geprueft, aber nicht aufgenommen: funktionaler Mehrwert ist fuer diesen Scope geringer als zusaetzliche Dependency-/Secret-/Connection-Pool-/Wartungsoberflaeche.

TA-Lib bleibt ein bevorzugter spaeterer PoC-Kandidat fuer Standard-Indikatoren/Candlestick-Primitives. Es uebernimmt weder Reliability-, Context-, Scoring-, Risk- noch Governance-Authority.

## Implemented Scope

Als implementiert und durch Code/DB/Evidence belegt gelten:

- FT-0 Contract/Governance Foundation,
- FT-1 Core Engine Foundation,
- FT-2A Category Profile Resolution,
- FT-2B Category Feature Contracts,
- FT-2C Pattern Engine Research Foundation,
- FT-3 private durable persistence,
- FT-3 least-privilege/append-only database guards,
- FT-3 storage-agnostic persistence port,
- FT-3 service-role-only Supabase RPC adapter boundary,
- FT-3 idempotency/compare-and-set production verification.

Nicht umgesetzt bleiben FT-4+ sowie produktive Risk-/Compliance-/Execution-/Settlement-Integrationen.

## Alternatives Considered

### Promote CryptoOrchestrator to productive master orchestrator

**Rejected.** Wuerde Research und produktive Scoring-/Execution-Authority vermischen.

### Category/Pattern formulas directly in ScoringDispatcher

**Rejected.** Der Dispatcher bleibt Execution Boundary fuer kanonisches Scoring, nicht Evidence-Acquisition-/Technical-Analysis-Engine.

### Separate productive scoring engines per crypto category

**Rejected.** Wuerde ADR-0087/SC-2 verletzen.

### New Kafka/NATS/Temporal/pgmq or second queue

**Rejected for FT-3.** `public.outbox_jobs` ist bereits die etablierte durable Queue-/Lease-Primitive.

### Expose `fintech_core` directly through Supabase Data API

**Rejected.** Financial workflow/evidence persistence bleibt private. Browserrollen benoetigen keinen direkten Zugriff.

### Add a direct Node PostgreSQL client

**Rejected for FT-3.** Der vorhandene privilegierte Supabase-Serverpfad plus eingeschraenkte RPCs hat geringeren Integrations-/Security-/Wartungsaufwand.

### SECURITY DEFINER RPCs

**Rejected.** Der `service_role` besitzt bereits die erforderlichen eingeschraenkten Tabellenrechte; `SECURITY INVOKER` vermeidet unnoetige Rechteerhoehung.

## Consequences

Positiv:

- klare FinTech-Workflow-Grenze,
- Erhalt der Single-Scoring-Authority,
- durable/auditierbare Workflow-/Event-/Decision-/Intent-Evidence,
- private financial persistence,
- explizite idempotente Replay-Semantik,
- compare-and-set Workflow-Transitions,
- kein neuer DB-Client oder Queue-Stack,
- produktive Side Effects bleiben durch spaetere Gates blockiert.

Kosten/Risiken:

- zusaetzliche Contract-/Versionierungsdisziplin,
- RPC- und DB-Schema muessen gemeinsam migriert/versioniert werden,
- Pattern Reliability benoetigt weiterhin historische Daten und belastbare Backtests,
- Guarded Live bleibt absichtlich weit hinter Foundation-/Persistence-Phasen.

## Validation Obligations

Vor FT-3 PR/Merge-Readiness:

- aktuellen `main` erneut laden,
- neue Main-Aenderungen und semantische Korrelationen pruefen,
- Governance-/Registry-Konsistenz pruefen,
- Diff/Scope pruefen,
- lokale/statische/kostenguenstige Tests vorziehen,
- keine kostenverursachende CI vor PR manuell starten,
- Post-PR-CI vor Merge ausfuehren.

Produktiv fuer FT-3 verifiziert:

- `SECURITY INVOKER` auf allen fuenf RPCs,
- kein EXECUTE fuer `anon`/`authenticated`,
- EXECUTE fuer `service_role`,
- idempotente Workflow-/Event-/Decision-/OrderIntent-Replays,
- compare-and-set Workflow-Transition,
- conflicting Event-ID/Payload wird abgelehnt,
- keine persistierten Verifikationsdaten nach Rollback,
- keine neuen `fintech_core` Security-Advisor-Findings,
- keine unindexierten `fintech_core` Foreign Keys.

Vor Guarded Live zusaetzlich mindestens:

- deterministic replay,
- idempotency/crash recovery,
- negative Risk-/Compliance-Tests,
- Data-Quality/Staleness-Failure-Tests,
- Audit-Reconstruction,
- Reconciliation,
- Kill-Switch/Emergency-Runbook,
- Human Approval Policy,
- Security-/Compliance-Review.

## Status

`PROPOSED` — FT-0 bis FT-3 sind implementiert. Produktive Scoring-, Risk-, Compliance- oder Execution-Authority wird durch diesen Entscheid nicht veraendert. FT-4 Research & Paper Trading ist der naechste Roadmap-Block.
