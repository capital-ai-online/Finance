# ADR-0099 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.1.0
- **Date:** 2026-08-21
- **Lifecycle:** proposed
- **Owner Priority:** Chat-Prioritaet 2026-08-20; Main-Sync/Projekt-Chat-Transfer 2026-08-21
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Work Claim:** `FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Branch:** `feat/fintech-core-crypto-module-01`
- **Current Main Baseline:** `95dea79cb6c67d7925af2b4c6df59c53baf2b46f`
- **Supersedes:** none
- **Protected authority:** ADR-0087 / SC-2 Single Scoring Architecture

> Namespace migration: Der FinTech-Draft verwendete vor Einfuehrung/Anwendung des aktuellen Reservation-Contracts vorlaeufig `ADR-0098`. `ADR-0098` ist auf aktuellem Main inzwischen fuer Media Project v2 belegt. Die stabile FinTech Authority ID bleibt unveraendert; der kanonische Display-Identifier dieses Entscheids ist ab dem 2026-08-21-Sync `ADR-0099`.

## Context

CAPITAL-AI besitzt bereits eine produktive Single-Dispatcher-Scoring-Architektur sowie einen Crypto-Research-Pfad. FinTech Core muss deshalb finanzielle Workflows komponieren, ohne eine parallele Scoring-, Governance-, IAM-, Compliance- oder Execution-Authority einzufuehren.

Aktuelle geschuetzte Scoring-Kette:

```text
verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.

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
- Orchestration-Level-Idempotency und Reconciliation-Anforderungen.

FinTech Core darf nicht besitzen:

- produktive Score-Berechnung oder Modellselektion ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`,
- IAM/AuthN/AuthZ-Policy,
- Compliance-Policy-Definitionen,
- Quality-/Governance-/Supervisor-Authority,
- Deployment-/Release-Authority,
- Exchange-Credentials, Wallet Private Keys oder Custody-Secrets.

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

Ein Pattern-Ergebnis ist in FT-2C:

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

FT-1/FT-2 implementieren nur Research/Paper-Faehigkeit. Ein LLM darf keinen autonomeren/permissiveren Modus aktivieren.

### 9. Retry und Side Effects

Aktionen werden als `RETRY_SAFE` oder `SIDE_EFFECTING` unterschieden.

Live Orders, Withdrawals, Settlement und Custody benoetigen end-to-end Idempotency, Client-/Venue-Order-IDs und definierte Recovery-Semantik, bevor Retry erlaubt ist.

### 10. Durable Workflow State ab FT-3

FT-1/FT-2 besitzen absichtlich keine eigene durable Persistenz. Zielbild fuer FT-3 nach separatem Migration-/Security-Review:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Bestehende Repository-/Plattformprimitiven werden zuerst wiederverwendet, insbesondere `outbox_jobs`, Audit-/Score-Evidence sowie bestehende Traceability-Vertraege.

Keine zweite Queue-Authority wird parallel eingefuehrt.

### 11. External Platform Mutations

FT-0 bis FT-2C benoetigen keine produktive Supabase-, Render-, Stripe-, Exchange- oder Custody-Mutation.

FT-3-Persistenz und spaetere Produktionsmutationen erhalten eigene Migration-/Security-/Governance-Gates.

### 12. Open Source

TA-Lib bleibt ein bevorzugter spaeterer PoC-Kandidat fuer Standard-Indikatoren/Candlestick-Primitives. Es uebernimmt weder Reliability-, Context-, Scoring-, Risk- noch Governance-Authority.

Keine neue TA-Lib-Dependency wird durch diesen Sync eingefuehrt.

## Implemented Scope at Sync

Als umgesetzt und durch Branch-Code/Tests/Evidence belegt gelten:

- FT-0 Contract/Governance Foundation,
- FT-1 Core Engine Foundation,
- FT-2A Category Profile Resolution,
- FT-2B Category Feature Contracts,
- FT-2C Pattern Engine Research Foundation.

Nicht umgesetzt bleiben FT-3+ sowie produktive Storage/UI/Execution-Integrationen.

## Alternatives Considered

### Promote CryptoOrchestrator to productive master orchestrator

**Rejected.** Wuerde Research und produktive Scoring-/Execution-Authority vermischen.

### Category/Pattern formulas directly in ScoringDispatcher

**Rejected.** Der Dispatcher bleibt Execution Boundary fuer kanonisches Scoring, nicht Evidence-Acquisition-/Technical-Analysis-Engine.

### Separate productive scoring engines per crypto category

**Rejected.** Wuerde ADR-0087/SC-2 verletzen.

### New Kafka/NATS/Temporal or second queue now

**Rejected for current phases.** Erst Domain Contracts, Idempotency und durable state begruenden eine neue Runtime-Komponente.

## Consequences

Positiv:

- klare FinTech-Workflow-Grenze,
- Erhalt der Single-Scoring-Authority,
- provenance- und fail-closed Category-/Pattern-Evidence,
- testbare Pattern Reliability,
- produktive Side Effects bleiben durch spaetere Gates blockiert.

Kosten/Risiken:

- zusaetzliche Contract-/Versionierungsdisziplin,
- Pattern Reliability benoetigt historische Daten und belastbare Backtests,
- FT-3 fuehrt spaeter Schema-/Privilege-/RLS-/Migration-Governance ein,
- Guarded Live bleibt absichtlich weit hinter Foundation-Phasen.

## Validation Obligations

Vor PR/Merge-Readiness:

- aktuellen Main erneut laden,
- ADR-Namespace und offene PRs korrelieren,
- direkten und semantischen Dateioverlap pruefen,
- Governance-/Registry-Konsistenz pruefen,
- lokale/statische/kostenguenstige Tests bevorzugen,
- keine kostenverursachende CI vor PR manuell starten,
- keine produktive Supabase-/Render-Mutation fuer FT-0..FT-2C.

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

`PROPOSED` — FT-0 bis FT-2C sind als nicht-produktive Foundation implementiert. Produktive Scoring-/Execution-Authority wird durch diesen Entscheid nicht veraendert.
