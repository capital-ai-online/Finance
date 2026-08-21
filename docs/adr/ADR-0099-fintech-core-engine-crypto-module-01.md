# ADR-0099 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.3.0
- **Date:** 2026-08-21
- **Lifecycle:** proposed
- **Owner Priority:** Chat-Prioritaet 2026-08-20; FT-3/FT-4-Fortsetzung 2026-08-21
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Work Claim:** `FINTECH-CORE-FT4-RESEARCH-PAPER-TRADING-2026-08-21`
- **Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`
- **Current Main Baseline:** `a0663563a6a01bbdf292db8796c1b291bdd8ee57`
- **Supersedes:** none
- **Protected authority:** ADR-0087 / SC-2 Single Scoring Architecture

> Namespace history: Der FinTech-Draft verwendete vor Anwendung des aktuellen Reservation-Contracts vorlaeufig `ADR-0098`. `ADR-0098` ist fuer Media Project v2 belegt. Die stabile FinTech Authority ID blieb unveraendert; der kanonische Display-Identifier ist `ADR-0099`.

## Context

CAPITAL-AI besitzt bereits eine produktive Single-Dispatcher-Scoring-Architektur sowie einen Crypto-Research-Pfad. FinTech Core muss finanzielle Workflows komponieren, ohne eine parallele Scoring-, Governance-, IAM-, Compliance- oder Execution-Authority einzufuehren.

Geschuetzte Scoring-Kette:

```text
verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.

PR #467 machte FT-0..FT-2C und diese Authority auf `main` kanonisch. PR #468 machte FT-3 Durable Workflow & Traceability kanonisch. FT-4 fuegt darauf einen ausschliesslich simulierten, durable/replay-faehigen Paper-Workflow auf bestehenden Domain Events hinzu. Produktive Scoring-, Risk-, Compliance- und Execution-Authority bleibt unveraendert.

## Decision

CAPITAL-AI fuehrt die Plattformgrenze `src/platform/FinTechCore/` mit `moduleId = fintech-core.crypto` als **financial workflow composition authority** fort. Sie ist keine Trading-Strategie und kein Broker/Exchange Gateway.

### 1. Authority Boundaries

FinTech Core darf besitzen:

- Workflow-Lifecycle und Workflow-Korrelation;
- versionierte Decision-/Domain-Event-/OrderIntent-Contracts;
- Operating-Mode-Enforcement;
- Composition von Category-, Pattern-, Scoring-, Portfolio-, Risk-, Compliance- und spaeter Execution-Adaptern;
- Orchestration-Level-Idempotency und Reconciliation-Anforderungen;
- durable Workflow-/Event-/Decision-/Intent-Evidence im privaten `fintech_core` Schema;
- deterministische fiktive Paper-Accounting-/Replay-Semantik.

FinTech Core darf nicht besitzen:

- produktive Score-Berechnung oder Modellselektion ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`;
- IAM/AuthN/AuthZ-Policy;
- Compliance-Policy-Definitionen;
- Quality-/Governance-/Supervisor-Authority;
- Deployment-/Release-Authority;
- Exchange-Credentials, Wallet Private Keys oder Custody-Secrets;
- autonome Execution ohne spaetere Risk-/Compliance-/Human-Gates;
- reale Kapitalbewegung im FT-4 Paper Workflow.

### 2. CryptoOrchestrator bleibt Research-only

```text
mode = research-enrichment
scoreEligible = false
```

Agent-/LLM-Evidence darf nicht direkt zu `CanonicalScoreResult`, OrderIntent oder Execution promotet werden.

### 3. Category Analysis bleibt getrennt von Canonical Taxonomy

Die bestehende `CryptoCategory` bleibt kompatible Taxonomie. Ein separater Analysis-Profile-Layer kann Profile wie L1, L2, DeFi, RWA, NFT, Stablecoin, Exchange Token, GameFi, AI/DePIN und Meme abbilden.

Nicht belastbar belegte Spezialformeln bleiben `PENDING_EVIDENCE`; es werden keine Gewichte erfunden.

### 4. Feature Evidence ist provenance- und freshness-faehig

Category Feature Contracts muessen Availability, Observed/Retrieved Timestamps, Provider/Evidence-Referenzen und Requirement-Klassen ausdruecken. Missing oder stale Evidence darf nicht als `0`, `PASS` oder implizit gute Datenqualitaet interpretiert werden.

### 5. Pattern Analysis ist Research Evidence

Pattern Detection, Reliability und Multi-Timeframe Resolution bleiben nicht-authorizing:

```text
scoreEligible     = false
executionEligible = false
authority         = RESEARCH_CONTEXT_ONLY
```

Es gibt keinen separaten produktiven Pattern Score.

### 6. Pattern Reliability ist Exact-Key

Reliability wird mindestens gebunden an:

```text
assetId
+ analysisProfile
+ timeframe
+ marketRegime
+ patternId
+ validationVersion
```

Kein Cross-Asset-/Cross-Timeframe-/Cross-Regime-Fallback ist zulaessig. Research Validation umfasst Mindestbeobachtungen, Train-/Validation-Fenster, Walk-forward/OOS, Fees, Slippage, Funding und Validation-Version. Defaults sind Research-Parameter, keine produktive Risk Policy.

### 7. Multi-Timeframe-Konflikte bleiben explizit

Higher-Timeframe-/Structure-/Breakout-/Volume-/Context-/Regime-Prioritaeten koennen Evidence ordnen; gleichrangige Gegensignale bleiben `CONFLICTING_EVIDENCE`. Ein spaeteres 1h/4h Feature darf nur reliability-/conflict-gated, begrenzt und ohne Double Counting eingefuehrt werden.

### 8. Operating Modes

Vertraglich vorgesehen:

- `RESEARCH`
- `PAPER`
- `GUARDED_LIVE`
- `PRODUCTION`
- `EMERGENCY`

Crypto Module 01 unterstuetzt durch FT-4 nur `RESEARCH` und `PAPER`. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert. Ein LLM darf keinen permissiveren Modus aktivieren.

### 9. Retry und Side Effects

Aktionen werden als `RETRY_SAFE` oder `SIDE_EFFECTING` unterschieden. Live Orders, Withdrawals, Settlement und Custody benoetigen end-to-end Idempotency, Client-/Venue-Order-IDs und definierte Recovery-Semantik, bevor Retry erlaubt ist.

FT-3 `order_intents` sind durable Intent-/Evidence-Records und keine Execution. FT-4 Paper Fills sind Simulation Events und erzeugen keinen realen OrderIntent.

### 10. Durable Workflow State — FT-3

Das private Schema besitzt:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Eigenschaften:

- `workflow_runs` ist durable current state mit immutable identity/context und no-delete;
- Domain Events, Decisions, OrderIntents und Reconciliation Records sind append-only Evidence;
- Correlation/Trace/Decision-Version ist reconstructable;
- OrderIntent ist idempotency-/hash-bound Evidence;
- Reconciliation ist bis FT-6 nur Scaffold und behauptet keine Settlement-Finalitaet;
- RLS + Least Privilege bleiben Defense in Depth;
- `anon`/`authenticated` erhalten keinen Zugriff auf das private Schema;
- `service_role` besitzt nur die benoetigten Rechte.

Bestehende Plattformprimitiven werden wiederverwendet, insbesondere `public.outbox_jobs`, `public.agent_audit_events`, `public.score_snapshots` und bestehende Traceability/EventMesh-Vertraege. Keine zweite Queue-Authority wird eingefuehrt.

### 11. Application Persistence Boundary — FT-3

Der Domain-Port bleibt storage-agnostisch:

`src/platform/FinTechCore/Persistence/FinTechCorePersistencePort.ts`

Die konkrete Supabase-Bindung bleibt serverseitig:

`server/fintechCorePersistence.ts`

Der Core importiert keine Supabase-Library. Das private Schema wird nicht fuer Browser/Data API geoeffnet. Schmale `public` RPCs verwenden `SECURITY INVOKER`, entziehen EXECUTE fuer `PUBLIC`/`anon`/`authenticated`, erlauben nur `service_role`, greifen vollqualifiziert auf `fintech_core.*` zu und erzwingen Replay/CAS ohne neue Risk-/Execution-Authority.

### 12. FT-4 Paper Accounting Boundary

FT-4 ist eine Simulation Boundary:

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange routing = false
custody/wallet capability = false
```

Ein Paper Account modelliert ausschliesslich fiktive Quote-/Asset-Balances, Average Entry Price, Gross Realized PnL sowie kumulierte Fees/Funding.

Geld-/Mengenwerte werden als JSON-safe Fixed Point `atoms + scale` persistiert und im Domain-Layer mit `BigInt` berechnet. Damit wird binäre Floating-Point-Rundung nicht zur Accounting-Authority.

FT-4 implementiert absichtlich kein Short Selling, Margin oder Leverage. Ein SELL ueber den fiktiven Bestand wird fail-closed abgelehnt.

### 13. FT-4 Explicit Cost Evidence

Jeder simulierte Fill muss Kostenannahmen explizit tragen:

- Fee bps;
- Slippage bps;
- Funding Amount oder ausdrueckliches `NOT_APPLICABLE` mit Begruendung;
- Evidence-Refs fuer Markt-/Kostenannahmen.

Es gibt keine versteckten Nullkosten und keine Aussage, dass Paper-Fills reale Venue-Fills garantieren oder exakt replizieren.

Gross Realized PnL wird getrennt von Fees/Funding gehalten, damit Cost Attribution auditierbar bleibt.

### 14. FT-4 Event-Sourced Replay

FT-4 fuehrt keine zweite Paper-Ledger-Tabelle ein. Das bestehende append-only Journal `fintech_core.domain_events` ist die durable Source fuer Paper State:

```text
PAPER_ACCOUNT_INITIALIZED   paperSequence=0
PAPER_FILL_SIMULATED        paperSequence=1..N
```

`PaperTradingWorkflowService` rekonstruiert vor jeder neuen Simulation den State aus durable Events. `PaperTradingEngine` re-simuliert gespeicherte Fill-Berechnungen; manipulierte, korrelationsfremde, causation-falsche oder nicht-kontinuierliche Eventfolgen werden abgelehnt.

Die DB erzwingt zusaetzlich:

- kanonische Paper Contract-/Kind-/Sequence-Felder;
- genau eine Initialisierung pro Run;
- eindeutige `paperSequence` pro Run;
- Initialisierung ohne Causation;
- Fill mit positiver Sequence und Causation.

### 15. FT-4 Replay Reader

Der read-only Domain-Port `FinTechCoreDomainEventReaderPort` wird serverseitig ueber `public.fintech_core_list_domain_events_v1(text)` umgesetzt.

Der RPC:

- ist `SECURITY INVOKER`;
- hat kein EXECUTE fuer `PUBLIC`, `anon`, `authenticated`;
- ist nur fuer `service_role` ausfuehrbar;
- oeffnet das private Schema nicht fuer Browserrollen;
- verleiht keine Mutation-/Execution-Authority.

### 16. Reconciliation Contract bleibt FT-6

`fintech_core.reconciliation_records` bleibt Evidence-Scaffold. Ein typed Application-Reconciliation-/Settlement-Contract wird erst in FT-6 eingefuehrt, wenn die notwendige Settlement-/Custody-Semantik definiert ist.

### 17. External Platform Mutations

FT-3 und FT-4 verwenden produktive Supabase-Migrationen unter Migration-/Security-/Governance-Gates.

FT-4 mutiert nicht:

- Render;
- Stripe;
- IAM;
- Scoring Authority;
- Exchange/Custody.

### 18. Open Source / Dependency Decision

FT-3 verwendet bestehendes PostgreSQL/Supabase und `@supabase/supabase-js`; kein direkter `pg`-Client wurde eingefuehrt.

Fuer FT-4 wurden etablierte Trading Engines geprueft:

- **QuantConnect LEAN:** Apache-2.0, sehr umfangreiche Backtest/Paper-/Fill-/Fee-/Slippage-Funktionalitaet, aber grosser C#-Runtime- und Parallel-Execution-Footprint.
- **NautilusTrader:** aktiv gepflegte deterministische/event-driven Trading-Plattform, LGPL-3.0, aber zusaetzlicher Rust/Python-Stack und breitere Trading-Engine-Authority.

Beide werden in FT-4 nicht integriert. Die benoetigte fehlende Funktion ist eine kleine CAPITAL-AI-spezifische Domain Simulation; Workflow, UAI, Persistence, Event Journal und Audit existieren bereits. Die Integration eines kompletten externen Trading Runtimes waere funktional und architektonisch ueberdimensioniert.

TA-Lib bleibt ein spaeterer PoC-Kandidat fuer Standard-Indikatoren/Candlestick-Primitives und uebernimmt keine Reliability-, Context-, Scoring-, Risk- oder Governance-Authority.

## Implemented Scope

Als implementiert und durch Code/DB/Evidence belegt gelten:

- FT-0 Contract/Governance Foundation;
- FT-1 Core Engine Foundation;
- FT-2A Category Profile Resolution;
- FT-2B Category Feature Contracts;
- FT-2C Pattern Engine Research Foundation;
- FT-3 private durable persistence und least-privilege/append-only Guards;
- FT-3 storage-agnostic persistence port und service-role-only Supabase RPC Boundary;
- FT-4 deterministic Paper Trading Contracts/Engine;
- FT-4 fictional fixed-point balances;
- FT-4 explicit Fee/Slippage/Funding Evidence;
- FT-4 event-sourced durable Replay;
- FT-4 service-role-only domain-event reader;
- FT-4 DB-level Paper Payload/Sequence/Causation Guards.

Nicht umgesetzt bleiben FT-5+ sowie produktive Risk-/Compliance-/Execution-/Settlement-Integrationen.

## Alternatives Considered

### Promote CryptoOrchestrator to productive master orchestrator

**Rejected.** Wuerde Research und produktive Scoring-/Execution-Authority vermischen.

### Category/Pattern formulas directly in ScoringDispatcher

**Rejected.** Der Dispatcher bleibt Execution Boundary fuer kanonisches Scoring, nicht Evidence-Acquisition-/Technical-Analysis-Engine.

### Separate productive scoring engines per crypto category

**Rejected.** Wuerde ADR-0087/SC-2 verletzen.

### New Kafka/NATS/Temporal/pgmq or second queue

**Rejected through FT-4.** `public.outbox_jobs` ist bereits die etablierte durable Queue-/Lease-Primitive; Paper State benoetigt keine zweite Queue.

### Separate Paper Ledger table

**Rejected for FT-4.** Durable Domain Events koennen den Paper State deterministisch rekonstruieren. Eine weitere Current-State-/Ledger-Authority waere dupliziert und muesste separat synchronisiert werden.

### QuantConnect LEAN or NautilusTrader runtime integration

**Rejected for FT-4.** Beide sind etablierte und geeignete Referenzarchitekturen, aber fuer den engen Paper-Scope deutlich groesser als die fehlende Domain-Funktion und erzeugen zusaetzliche Runtime-/Dependency-/Governance-/Lock-in-Flaechen.

### Expose `fintech_core` directly through Supabase Data API

**Rejected.** Financial workflow/evidence persistence bleibt private.

### Direct Node PostgreSQL client / SECURITY DEFINER reader

**Rejected.** Der vorhandene privilegierte Supabase-Serverpfad plus `SECURITY INVOKER` RPC hat geringere Integrations-/Privilege-Oberflaeche.

## Consequences

Positiv:

- klare FinTech-Workflow-Grenze und Erhalt der Single-Scoring-Authority;
- durable/auditierbare Workflow-/Paper-Evidence;
- private financial persistence;
- deterministische Fixed-Point Paper Accounting Semantik;
- explizite Kostenannahmen statt versteckter Backtest-Optimismus;
- tamper-detecting Replay;
- keine neue Queue, Ledger-Tabelle oder Trading Runtime;
- reales Kapital und Side Effects bleiben blockiert.

Kosten/Risiken:

- Contract-/Versionierungsdisziplin nimmt zu;
- Paper Simulation ist kein Beweis fuer reale Fill-/Liquidity-Qualitaet;
- CASH_LONG_ONLY deckt Margin/Short/Derivatives bewusst noch nicht ab;
- produktive Risk/Compliance und Reconciliation fehlen bis FT-5/FT-6;
- Guarded Live bleibt absichtlich blockiert.

## Validation Obligations

Vor jedem PR:

- aktuellen `main` erneut laden und semantische Korrelationen pruefen;
- Governance-/Registry-Konsistenz und Diff/Scope pruefen;
- lokale/statische/kostenguenstige Tests bevorzugen;
- keine kostenverursachende GitHub CI vor PR manuell starten;
- Post-PR-CI vor Merge ausfuehren.

Produktiv fuer FT-3 verifiziert sind service-role-only SECURITY-INVOKER RPCs, append-only/least-privilege Persistence, idempotente Replays/CAS und Advisor Checks.

Produktiv fuer FT-4 verifiziert:

- Migration `20260821071823 / fintech_core_paper_replay_reader`;
- Reader und Guard `SECURITY DEFINER=false`;
- Reader EXECUTE nur `service_role`;
- RLS bleibt aktiv;
- Paper Guard + Unique Indizes vorhanden;
- service-role Reader rekonstruiert Init/Fill Sequence `[0,1]`;
- Duplicate Sequence und zweite Initialisierung werden abgelehnt;
- Fill ohne Causation wird abgelehnt;
- Transaktions-Rollback hinterlaesst 0 Testdaten;
- keine neuen FT-4 Security-/unindexed-FK Advisor Findings.

Vor Guarded Live zusaetzlich mindestens:

- deterministic Risk + Compliance Gates (FT-5);
- typed OrderIntent/Reconciliation und Crash/Duplicate Recovery (FT-6);
- Data-Quality/Staleness-Failure-Tests;
- Audit-Reconstruction;
- Kill-Switch/Emergency-Runbook;
- Human Approval Policy;
- Security-/Compliance-Review.

## Status

`PROPOSED` — FT-0 bis FT-4 sind implementiert; FT-4 ist bis zur Post-PR-CI noch merge-pending. Produktive Scoring-, Risk-, Compliance- oder Execution-Authority wird nicht veraendert. **FT-5 Deterministic Risk + Compliance** ist der naechste Roadmap-Block.
