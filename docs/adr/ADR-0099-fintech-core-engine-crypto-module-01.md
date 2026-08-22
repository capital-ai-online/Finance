# ADR-0099 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.5.0
- **Date:** 2026-08-22
- **Lifecycle:** proposed
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Work Claims:** `FINTECH-CORE-FT4-RESEARCH-PAPER-TRADING-2026-08-21`, `FINTECH-CORE-FT5-DETERMINISTIC-RISK-COMPLIANCE-2026-08-21`, `FINTECH-CORE-FT6B-ORDERINTENT-RECONCILIATION-2026-08-22`
- **Execution Branch:** `feat/fintech-core-ft6-orderintent-reconciliation-2026-08-22`
- **Current Main Baseline at FT-6B start:** `b180d56a37762c6a558a9b3488ce4f36c70fa2e9`
- **FT-6A predecessor:** PR #481 merged
- **Supersedes:** previous revisions of ADR-0099 only
- **Protected authority:** ADR-0087 / Single Scoring Architecture

> Namespace history: Der FinTech-Draft verwendete vor Anwendung des Reservation-Contracts vorlaeufig `ADR-0098`. `ADR-0098` ist fuer Media Project v2 belegt. Die stabile FinTech Authority ID blieb unveraendert; der kanonische Display-Identifier ist `ADR-0099`.

## Context

CAPITAL-AI besitzt eine produktive Single-Dispatcher-Scoring-Architektur und einen separaten Crypto-Research-Pfad. Der FinTech Core soll Finanz-Workflows komponieren, ohne eine parallele Scoring-, Evidence-, Governance-, Compliance-Policy-, IAM-, Queue-, Persistence-, Execution- oder Custody-Authority zu schaffen.

Geschuetzte Scoring-Kette:

```text
UAI Identity
  -> Evidence Acquisition
  -> Evidence/Data Quality Gate
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor Adapter
  -> CanonicalScoreResult
  -> Ranking/Eligibility
  -> EventMesh/Traceability/Supervisor
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. DeFiLlama bleibt Evidence Acquisition und erhaelt keine direkte Score-, Ranking-, Eligibility- oder Order-Authority.

## Decision

`src/platform/FinTechCore/` mit `moduleId=fintech-core.crypto` bleibt **financial workflow composition authority**. Diese Authority besitzt keine produktive Score-Berechnung, keine juristische Policy-Definition und keine autonome Execution.

### 1. Authority Boundaries

FinTech Core darf besitzen:

- Workflow-Lifecycle, Run-/Trace-/Correlation-Identitaet;
- versionierte Decision-, Domain-Event-, OrderIntent- und Reconciliation-Contracts;
- Operating-Mode-Enforcement;
- Composition bestehender Evidence-, Scoring-, Portfolio-, Risk-/Compliance- und spaeter Execution-Adapter;
- deterministische Paper-Accounting-/Replay-Semantik;
- deterministische Evaluation externer versionierter Risk-/Compliance-Policy-Snapshots;
- OrderIntent-Idempotency-/Integrity-Vertraege;
- append-only durable Evidence.

FinTech Core darf nicht besitzen:

- produktive Score-Berechnung oder Model Selection ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`;
- IAM/AuthN/AuthZ-Policy;
- juristische/regulatorische Compliance-Policy-Definition;
- autonome Risk-/Compliance-Freigabe durch LLM/Agenten;
- Exchange Credentials, Wallet Private Keys oder Custody Secrets;
- autonome Execution oder reale Kapitalbewegung in FT-0…FT-6;
- Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.

### 2. Operating Modes

Vertraglich existieren:

```text
RESEARCH
PAPER
GUARDED_LIVE
PRODUCTION
EMERGENCY
```

Crypto Module 01 unterstuetzt bis einschliesslich FT-6 ausschliesslich Research/Paper-Semantik.

```text
RESEARCH      -> keine OrderIntent-Bindung fuer Execution
PAPER         -> simulierte OrderIntent-/Fill-/Reconciliation-Evidence
GUARDED_LIVE  -> blockiert
PRODUCTION    -> blockiert
EMERGENCY     -> keine neue Order
```

Der Real-Execution-Eligibility-Helper ist fuer FT-6 hard-blocked. Eine Freischaltung ist ein separater FT-7+-Entscheidungs- und Sicherheitsprozess.

### 3. Persistence Authority

Kanonisches privates Schema:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Kanonische Queue-/Lease-Authority:

```text
public.outbox_jobs
```

Es werden keine zweite Queue, kein zweites Event Journal, kein zweites Order Ledger und keine zweite Reconciliation-Tabelle eingefuehrt. Kafka, NATS, Temporal und pgmq bleiben ohne neue explizite Architekturentscheidung ausserhalb dieses Scopes.

Private Persistence bleibt service-role-only hinter schmalen `SECURITY INVOKER` RPCs. `anon`/`authenticated` erhalten keine direkte private-schema Capability. RLS bleibt Defense in Depth.

### 4. FT-4 Canonical Financial Representation

FT-4 etablierte JSON-safe Fixed Point:

```text
atoms: string
scale: number
```

FT-6B hebt exakt diese Representation zum gemeinsamen `FinTechCoreFixedPoint` an. `PaperFixedPoint` bleibt ein Typalias darauf. Dadurch existiert **eine** FinTech-Core-Finanzrepresentation.

Execution-relevante Quantity-/Price-/Money-Werte duerfen nicht ueber JavaScript binary floating point Financial Authority zurueckgewinnen. PostgreSQL `numeric` darf als exakte Persistence-/Legacy-Projektion genutzt werden, ist aber nicht die konkurrierende Runtime-Representation.

### 5. FT-5 Deterministic Risk + Compliance

FT-5 bleibt Approval Authority fuer FT-6 und erzeugt append-only `FinTechCoreDecisionRecord`s:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Risk-/Compliance-Policy-Grenzen kommen aus extern versionierten Policy Snapshots. Der Core evaluiert deterministisch, definiert aber keine rechtliche oder fachliche Policy-Wahrheit.

Outcome-Prioritaet:

```text
REJECTED > NOT_COMPUTABLE > REVIEW_REQUIRED > APPROVED
```

Missing/stale/wrong-authority Evidence wird niemals synthetisch zu PASS. Research Agents duerfen Kontext liefern, aber keine Freigabe autorisieren.

### 6. FT-6 Single Canonical OrderIntent

FT-6 erweitert **`FinTechCoreOrderIntent` in place**. Der in FT-6A temporaer eingefuehrte `FinTechCoreBoundOrderIntent` wird nicht als zweite Domain-Authority fortgefuehrt.

Contract Version:

```text
fintech-core/order-intent/0.2.0
```

Execution-relevante Felder umfassen:

- immutable `orderIntentId`;
- `runId`, `traceId`, `correlationId`, `assetId`;
- optional `strategyId`, `portfolioId`;
- `decisionVersion`;
- `side`, `orderType`;
- `quantity: FinTechCoreFixedPoint`;
- `priceBounds` mit optional `limitPrice`, `minPrice`, `maxPrice` als Fixed Point;
- `maxSlippageBps`;
- `createdAt`, `expiresAt`;
- deterministische `clientOrderId`, `idempotencyKey`, `intentHash`;
- Risk Decision ID/Hash + Policy ID/Version;
- Compliance Decision ID/Hash + Policy ID/Version.

`bindingState=UNBOUND` ist nur Legacy-/Research-Persistence-Evidence. `bindingState=BOUND` darf nur durch den deterministischen Binder entstehen.

### 7. FT-6 Approval Binding

`bindApprovedOrderIntent(...)` akzeptiert ausschliesslich authoritative FT-5 Decision Records.

Hard Gates:

- Risk Decision vorhanden und `APPROVED`;
- Compliance Decision vorhanden und `APPROVED`;
- korrekter Decision Type;
- exact `runId`, `traceId`, `correlationId`, `moduleId`, `assetId`, `decisionVersion`;
- Decision Hash vorhanden;
- Policy ID und Policy Version vorhanden;
- Decision Timestamp innerhalb des aktiven Workflow-Zeitfensters und nicht nach Intent Creation;
- gueltige Fixed-Point Quantity/Price Bounds;
- Slippage-Bounds valide;
- `expiresAt > createdAt`;
- `PAPER` Operating Mode.

Explizit verboten:

- `PENDING`, `REVIEW_REQUIRED` oder `NOT_COMPUTABLE` automatisch auf APPROVED setzen;
- fehlende Decision synthetisieren;
- stale/context-fremde Decision weiterverwenden;
- Research Agent als Approval behandeln;
- caller-gesteuerte Approval Flags als Authority akzeptieren.

### 8. Deterministic Idempotency / Replay Identity

`clientOrderId`, `idempotencyKey` und `intentHash` werden deterministisch abgeleitet.

Semantik:

```text
same identity + same payload
  -> gleiche Replay-Identitaet / idempotenter Persistence Replay

same orderIntent identity + changed payload
  -> andere Payload-/Idempotency-Hashes
  -> DB collision via orderIntentId/clientOrderId
  -> reject
```

Blindes Retry einer SIDE_EFFECTING Operation bleibt verboten. FT-6 besitzt weiterhin keine reale Side-Effecting Execution-Capability.

### 9. Typed Reconciliation

`fintech_core.reconciliation_records` bleibt einzige Persistence Authority. Contract Version:

```text
fintech-core/reconciliation/0.2.0
```

Typed Felder:

- `orderIntentId`, `clientOrderId`, optional spaetere `venueOrderId`;
- Run/Trace/Correlation/Asset Identity;
- expected/observed Quantity als Fixed Point;
- expected Price Bounds / observed Execution Price;
- Fee Evidence;
- Settlement State;
- `PENDING`, `MATCHED`, `MISMATCH`, `NOT_COMPUTABLE`;
- Evidence Refs;
- `observedAt`, `reconciledAt`;
- `supervisorEscalationRequired`.

Hard Rules:

- Mismatch wird nicht automatisch korrigiert;
- keine Balance wird interpoliert oder synthetisiert;
- kein Settlement wird ohne Evidence als erfolgreich markiert;
- PAPER verwendet `settlementState=NOT_APPLICABLE`;
- `MISMATCH` setzt `supervisorEscalationRequired=true`;
- keine autonome Supervisor-Remediation.

`ORDER_INTENT_DECISION_BINDING` revalidiert Decision-/Policy-/Idempotency-/Client-Order-/Intent-Hash-/Expiry-Bindings.

`ORDER_INTENT_PAPER_FILL` vergleicht simulierte Quantity/Price/Fee Evidence gegen den genehmigten Intent und behauptet keine reale Execution.

### 10. Persistence Evolution

`FinTechCorePersistencePort` besitzt genau einen `appendOrderIntent`-Pfad. Der serverseitige Adapter darf intern versionierte Persistence RPCs routen:

- v1 fuer bestehende `UNBOUND` Legacy Evidence;
- v2 fuer canonical FT-6 `BOUND` OrderIntent Evidence.

Die Migration `20260822011500_fintech_core_ft6b_fixed_point_reconciliation.sql` erweitert bestehende Tabellen additiv. Sie fuehrt keine neue Tabelle oder Queue ein und bleibt `SECURITY INVOKER`/service-role-only.

**Diese Migration wird durch den Repository-Commit nicht produktiv angewendet.** Eine Production Application benoetigt einen separaten Owner Mutation Gate, Rollback und Post-Verification.

### 11. EventMesh / Traceability

FT-6B fuehrt keine Event-Namen auf Verdacht ein. Vor Kandidaten wie `ORDER_INTENT_CREATED` oder `RECONCILIATION_MISMATCH` muss ein kanonischer Event Catalog einen eindeutigen Namen/Contract liefern. Bis dahin bleibt typed durable Reconciliation Evidence die Authority und traegt bei Drift das Supervisor-Eskalationssignal.

W3C Trace Context / OpenTelemetry bleiben kompatible Zielstandards fuer FT-8, sofern nicht zuvor als vorhandene Infrastruktur wiederverwendet.

### 12. Regulatory / Best-Practice Basis

Die Architektur wird gegen folgende Leitplanken gepflegt:

- Regulation (EU) 2023/1114 MiCA — Governance/Organisation/Record Keeping fuer Crypto-Asset-Services;
- Regulation (EU) 2022/2554 DORA — ICT/Operational Resilience;
- Regulation (EU) 2023/1113 Transfer of Funds / Crypto Travel Rule;
- EBA Travel Rule Guidelines, anwendbar seit 2024-12-30;
- FATF VA/VASP Targeted Updates;
- W3C Trace Context / OpenTelemetry fuer spaetere interoperable Traceability.

Diese Quellen begruenden nachvollziehbare, provenance-faehige, robuste Kontrollen. Der Core hardcodiert daraus **keine** jurisdictionsspezifische Legal Applicability, keine globale DQ-Schwelle und keinen Provider-PASS.

### 13. Open Source / Dependency Decision

Keine neue Runtime-/Library-Abhaengigkeit fuer FT-6B. Bestehende TypeScript-/Node-/PostgreSQL-/Supabase-Primitiven genuegen.

Nicht integriert:

- OPA/Cedar als zusaetzliche Policy Runtime;
- LEAN/Nautilus als Trading Runtime;
- Kafka/NATS/Temporal/pgmq;
- CEX-/DEX-/Wallet-/Custody-SDK;
- TA-Lib.

Damit bleibt die Supply-Chain-/Operations-/Authority-Flaeche minimal.

### 14. Documentation Supersession

`docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md` darf keine Specialized-first-/Universal-Fallback-/Gemini- oder direkte Scoring-Engine-Topologie mehr als aktuelle Authority darstellen. Die aktuelle Dokumentation muss ADR-0087 und diese ADR-0099 spiegeln.

## Implemented Scope

Auf `main` vor FT-6B vorhanden:

- FT-0 Contract/Governance Foundation;
- FT-1 Core Engine;
- FT-2A/B/C Category/Pattern Research;
- FT-3 durable private Persistence;
- FT-4 deterministic Paper Trading / Replay;
- FT-5 deterministic Risk + Compliance;
- FT-6A initial Decision-bound OrderIntent/Reconciliation aus PR #481.

Auf dem FT-6B Branch implementiert:

- shared `FinTechCoreFixedPoint`;
- `PaperFixedPoint` als Alias statt zweite Representation;
- Single canonical `FinTechCoreOrderIntent`;
- keine zweite `FinTechCoreBoundOrderIntent` Domain-Authority;
- deterministic client/idempotency/intent integrity;
- exact Decision-/Policy-Binding;
- PAPER-only + real-execution hard block;
- typed reconciliation inkl. Paper Fill;
- unresolved Mismatch Supervisor-Eskalationssignal;
- single `appendOrderIntent` persistence port;
- additive v2 Persistence Migration als Repository-Artefakt;
- Negative-/Architecture-Tests;
- Governance-/Roadmap-/Architecture-Synchronisierung.

## Alternatives Considered

- **Bound OrderIntent als separater Domain-Typ:** rejected; erzeugt Contract-Drift und parallele Semantik.
- **JavaScript `number` fuer Quantity/Price:** rejected; keine binary-floating-point Financial Authority.
- **LLM/Agent als Approval:** rejected; Approval bleibt FT-5 deterministic Decision Record.
- **Neue Reconciliation-/Ledger-Tabelle:** rejected; bestehende `reconciliation_records` bleibt Authority.
- **Neue Queue/Workflow Runtime:** rejected; `public.outbox_jobs` und bestehende Orchestration bleiben fuehrend.
- **Auto-Reconciliation/Auto-Repair:** rejected; Mismatch bleibt Evidence und eskaliert.
- **FT-6 Guarded Live:** rejected; separater FT-7 Scope.

## Consequences

Positiv:

- eine Scoring-, eine Financial-Value-, eine OrderIntent- und eine Persistence-Authority;
- deterministische, reproduzierbare Approval-/Replay-Identitaet;
- keine binary-floating-point Execution Authority;
- exakte Policy-/Decision-Traceability;
- typed Reconciliation ohne autonomes Repair;
- FT-7 bleibt klar getrennt.

Kosten/Risiken:

- Contract-/Migration-Versionierung wird strenger;
- v1/v2 Persistence Compatibility muss bis zur kontrollierten Migration gepflegt werden;
- Production Verification der FT-6B Migration steht separat aus;
- ein kanonischer FT-6 Event Catalog fehlt weiterhin;
- Paper-Reconciliation beweist keine reale Venue-/Settlement-Qualitaet.

## Validation Obligations

Vor jedem Draft/PR:

1. aktuellen `main` neu laden;
2. offene PRs/Branches und Dateioverlap pruefen;
3. Merge-Base/ahead/behind verifizieren;
4. Scope gegen ADR-0087/ADR-0099 korrelieren;
5. keine kostenverursachende GitHub Hosted CI vor PR-Erstellung manuell starten.

Nach Draft PR:

- TypeScript/Lint;
- fokussierte Unit Tests;
- Architecture Tests;
- Governance Control Plane / Docs Hygiene;
- Security/Least-Privilege statische Checks;
- finaler Required Check `build-and-test` gemaess PR-Klasse.

Keine PASS-Aussage ohne tatsaechlichen Nachweis.

Vor einer spaeteren Supabase-Mutation zusaetzlich:

- Owner Mutation Approval;
- RLS/Privileges/SECURITY INVOKER Preflight;
- transaktionale Migration;
- positive/negative Persistence Probes;
- Testdaten-Reset;
- Post-Mutation Verification und Rollback-Nachweis.

## FT-7 Boundary

FT-7 Guarded Live / Single CEX darf erst bewertet werden, wenn FT-6 code-/CI-/governance-seitig geschlossen und die benoetigte Persistence-Mutation separat verifiziert ist. FT-6 selbst erteilt keine Live-Execution-Freigabe.
