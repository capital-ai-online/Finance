# ADR-0099 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.4.0
- **Date:** 2026-08-21
- **Lifecycle:** proposed
- **Owner Priority:** Chat-Prioritaet 2026-08-20; FT-3/FT-4/FT-5-Fortsetzung 2026-08-21
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Work Claims:** `FINTECH-CORE-FT4-RESEARCH-PAPER-TRADING-2026-08-21`, `FINTECH-CORE-FT5-DETERMINISTIC-RISK-COMPLIANCE-2026-08-21`
- **Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`
- **Current Main Baseline:** `a0663563a6a01bbdf292db8796c1b291bdd8ee57`
- **Supersedes:** none
- **Protected authority:** ADR-0087 / SC-2 Single Scoring Architecture

> Namespace history: Der FinTech-Draft verwendete vor Anwendung des aktuellen Reservation-Contracts vorlaeufig `ADR-0098`. `ADR-0098` ist fuer Media Project v2 belegt. Die stabile FinTech Authority ID blieb unveraendert; der kanonische Display-Identifier ist `ADR-0099`.

## Context

CAPITAL-AI besitzt bereits eine produktive Single-Dispatcher-Scoring-Architektur sowie einen Crypto-Research-Pfad. FinTech Core muss Finanz-Workflows komponieren, ohne parallele Scoring-, Governance-, IAM-, Compliance-Policy- oder Execution-Authorities einzufuehren.

Geschuetzte Scoring-Kette:

```text
verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.

PR #467 machte FT-0..FT-2C auf `main` kanonisch. PR #468 machte FT-3 Durable Workflow & Traceability kanonisch. FT-4 ergaenzt simuliertes event-sourced Paper Trading. FT-5 ergaenzt deterministische Risk-/Compliance-Entscheidungen, ohne OrderIntent-Approval-Bindung oder Live Execution vorzuziehen.

## Decision

`src/platform/FinTechCore/` mit `moduleId = fintech-core.crypto` bleibt **financial workflow composition authority**. Die Schicht ist keine Trading-Strategie, Scoring Engine, Compliance-Policy-Authority oder Broker/Exchange Gateway.

### 1. Authority Boundaries

FinTech Core darf besitzen:

- Workflow-Lifecycle/Korrelation;
- versionierte Decision-/Domain-Event-/OrderIntent-Contracts;
- Operating-Mode-Enforcement;
- Composition von Category-, Pattern-, Scoring-, Portfolio-, Risk-, Compliance- und spaeter Execution-Adaptern;
- Orchestration-Level-Idempotency/Reconciliation-Anforderungen;
- durable Workflow-/Event-/Decision-/Intent-Evidence;
- deterministische Paper-Accounting-/Replay-Semantik;
- deterministische Evaluation externer versionierter Risk-/Compliance-Policy-Snapshots.

FinTech Core darf nicht besitzen:

- produktive Score-Berechnung oder Modellselektion ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`;
- IAM/AuthN/AuthZ-Policy;
- regulatorische/fachliche Compliance-Policy-Definition;
- Quality-/Governance-/Supervisor-/Deployment-/Release-Authority;
- Exchange-Credentials, Wallet Private Keys oder Custody-Secrets;
- LLM-/Agent-Autorisierung von Risk-/Compliance-Freigaben;
- autonome Execution;
- reale Kapitalbewegung durch FT-4/FT-5;
- Bindung von Risk-/Compliance-Decisions an execution-eligible OrderIntents vor FT-6.

### 2. Research / Pattern Boundary

Category-/Pattern-Analyse bleibt Evidence. Pattern Results bleiben:

```text
scoreEligible     = false
executionEligible = false
authority         = RESEARCH_CONTEXT_ONLY
```

Pattern Reliability bleibt exact-key auf Asset, Analysis Profile, Timeframe, Market Regime, Pattern und Validation-Version. Gleichrangige Konflikte bleiben `CONFLICTING_EVIDENCE`; kein Cross-Key-Fallback oder synthetischer Pattern Score.

### 3. Operating Modes

Vertraglich existieren `RESEARCH`, `PAPER`, `GUARDED_LIVE`, `PRODUCTION`, `EMERGENCY`. Crypto Module 01 unterstuetzt durch FT-5 weiterhin nur:

```text
RESEARCH
PAPER
```

`GUARDED_LIVE` und `PRODUCTION` bleiben blockiert. Ein LLM darf keinen permissiveren Modus aktivieren.

### 4. Retry / Side Effects

Aktionen bleiben `RETRY_SAFE` oder `SIDE_EFFECTING`. Live Orders, Withdrawals, Settlement und Custody benoetigen end-to-end Idempotency, Client-/Venue-Order-IDs und Recovery-Semantik vor Retry.

FT-3 `order_intents` sind durable Evidence, keine Execution. FT-4 Paper Fills sind Simulation Events. FT-5 produziert nur Risk-/Compliance-Decisions und keine OrderIntent-Approval-Bindung.

### 5. FT-3 Durable Workflow / Persistence

Privates Schema:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

Es gelten immutable identity/context, append-only Evidence, RLS/Least Privilege und service-role-only `SECURITY INVOKER` RPCs. `anon`/`authenticated` erhalten keinen privaten Schema-Zugriff. `FinTechCorePersistencePort` bleibt storage-agnostisch; Supabase bleibt Server-Adapter. `public.outbox_jobs` bleibt Queue-/Lease-Authority.

### 6. FT-4 Paper Accounting

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange routing = false
custody/wallet capability = false
```

Paper-Geld-/Mengenwerte nutzen JSON-safe Fixed Point `atoms + scale` und `BigInt`. Short/Margin/Leverage sind nicht implementiert. Jeder Fill benoetigt explizite Fee-/Slippage-/Funding-Evidence; keine versteckten Nullkosten.

### 7. FT-4 Event-Sourced Replay

Keine zweite Paper-Ledger-Tabelle. Journal bleibt `fintech_core.domain_events`:

```text
PAPER_ACCOUNT_INITIALIZED   paperSequence=0
PAPER_FILL_SIMULATED        paperSequence=1..N
```

Replay re-simuliert Fills und verwirft manipulierte/korrelationsfremde/causation-falsche/non-contiguous Events. DB-Guards sichern Payload, genau eine Initialisierung, eindeutige Sequence und Causation.

`public.fintech_core_list_domain_events_v1(text)` ist read-only, `SECURITY INVOKER`, service-role-only. Produktionsmigration `20260821071823 / fintech_core_paper_replay_reader` wurde transaktional verifiziert; 0 Testdaten verblieben.

### 8. FT-5 Deterministic Risk Evaluation

Risk Gates:

```text
ORDER_NOTIONAL
GROSS_EXPOSURE
DRAWDOWN
LIQUIDITY
STALENESS
COUNTERPARTY
```

`FinTechCoreRiskPolicySnapshot` liefert Policy-ID/-Version, Fixed-Point Limits, Drawdown-/Liquidity-/Freshness-Grenzen und erwartete Evidence Authorities. Der Core besitzt nur deterministische Evaluation, nicht die Authority, die Policy zu definieren.

Order-, Portfolio-/Equity-, Liquidity-, Market- und Counterparty-Evidence wird separat provenance-/authority-bound geprueft.

### 9. FT-5 Compliance Integration Boundary

Typed Controls:

```text
KYC
KYB
AML
SANCTIONS
WALLET_SCREENING
JURISDICTION
TRAVEL_RULE
```

`FinTechCoreCompliancePolicySnapshot` bestimmt explizit erforderliche Controls, erwartete Authority je Control, Freshness-Limit und Policy-Evidence. Der Core inferiert **nicht**, welche Controls rechtlich anwendbar sind.

Control States:

```text
PASS
FAIL
MISSING
STALE
REVIEW_REQUIRED
```

### 10. Evidence Integrity / Fail Closed

PASS reicht nicht. Evidence muss zum Control passen, exakt an die erwartete `authorityId` gebunden sein, Provider/Evidence-Refs besitzen, einen gueltigen Observed Timestamp haben und Freshness-Gates bestehen.

Outcome-Prioritaet:

```text
REJECTED > NOT_COMPUTABLE > REVIEW_REQUIRED > APPROVED
```

Limit-/Counterparty-/Sanctions-Fail -> `REJECTED`; missing/stale/mismatched-authority -> `NOT_COMPUTABLE`; Review bleibt `REVIEW_REQUIRED`. Keine synthetischen PASS-/Zero-/Probability-Fallbacks.

### 11. Keine LLM-/Parallel-Compliance-Authority

`CryptoRiskAgent` und andere AI-/Research-Komponenten koennen Kontext liefern, aber keine FT-5-Freigabe erteilen. Architecture Tests verbieten direkte AI-/Agent-/Provider-/Exchange-/Supabase-Imports in der Gate-Schicht.

`src/platform/Compliance` bleibt SecurityComplianceAuditor-/Repository-Compliance-Komponente nach ADR-0012. ADR-0058 bleibt Agent-/Tool-Risk-Authorization. Keine dieser Authorities wird fuer Financial Pre-Trade Policy umdefiniert.

### 12. FT-5 Durable Decision Evidence

Keine neue Tabelle. `RiskComplianceDecisionRecords.ts` mappt auf FT-3 `FinTechCoreDecisionRecord`:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Run/Trace/Correlation/Asset/Decision-Version, Policy-ID/-Version, Input-/Output-Hashes, Evidence-Refs und Outcome bleiben auditierbar. Hash-Berechnung bleibt Infrastrukturverantwortung.

### 13. OrderIntent Approval Binding bleibt FT-6

FT-5 macht **kein** `OrderIntent` execution-handoff eligible. Der Contract erzwingt fuer jedes FT-5-Ergebnis:

```text
executionHandoffEligible = false
```

Dies gilt unabhaengig vom Operating Mode, also auch fuer manuell konstruierte `GUARDED_LIVE`-/`PRODUCTION`-Kontexte. FT-5 besitzt keinen Helper, der `riskApproval` oder `complianceApproval` im `OrderIntent` auf `APPROVED` setzt.

FT-6 muss Risk-/Compliance-Decision-Hashes/Policy-Versionen an den immutable OrderIntent binden und zusaetzlich TTL, Price/Quantity/Slippage Bounds, Client-Order-ID, Idempotency und Reconciliation definieren.

### 14. Regulatory / Best-Practice Basis

FT-5 wurde gegen aktuelle Primaerquellen abgeglichen: MiCA Risk-/Record-Keeping, EBA ML/TF Risk Factor Guidelines fuer CASPs, EBA Travel Rule Guidelines und FATF VA/VASP Targeted Update 2026. Diese Quellen stuetzen risikobasierte, nachvollziehbare, provenance-/freshness-faehige Kontrollen. Daraus werden keine jurisdictionsspezifischen Rechtsentscheidungen hardcodiert.

### 15. Open Source / Dependency Decision

- FT-4: QuantConnect LEAN/NautilusTrader bewertet, nicht integriert — fuer den engen Paper-Scope ueberbreite Runtime-/Execution-Flaeche.
- FT-5: Open Policy Agent und Cedar bewertet, nicht integriert — gute Apache-2.0 Enterprise Policy Engines, aber fuer den kleinen typed Evaluator unnoetige Policy-Runtime/DSL-/Governance-Oberflaeche.
- Plugin-Suche: kein geeigneter spezialisierter AML/KYC/Sanctions-Connector gefunden.
- TA-Lib bleibt spaeterer Pattern-PoC-Kandidat.

### 16. Reconciliation bleibt FT-6

`fintech_core.reconciliation_records` bleibt Evidence-Scaffold. Typed OrderIntent-Hardening, Approval-Bindung, TTL/Bounds, Client-Order-ID sowie Application-Reconciliation-/Settlement-Semantik gehoeren zu FT-6.

### 17. External Platform Mutations

FT-3/FT-4 verwendeten produktive Supabase-Migrationen unter den vorgesehenen Gates. FT-5 benoetigt **keine** neue Supabase-, Render-, Stripe-, IAM-, Scoring-, Exchange- oder Custody-Mutation und verwendet bestehende FT-3 Decision Persistence.

## Implemented Scope

Implementiert und belegt:

- FT-0 Contract/Governance Foundation;
- FT-1 Core Engine Foundation;
- FT-2A Category Profile Resolution;
- FT-2B Category Feature Contracts;
- FT-2C Pattern Research Foundation;
- FT-3 durable private Persistence / least privilege / append-only / service-role RPC Boundary;
- FT-4 deterministic Paper Trading / Fixed-Point Balances / explicit Costs / durable Replay / Paper DB Guards;
- FT-5 external Policy-/Evidence Contracts;
- FT-5 deterministic Risk Gates;
- FT-5 typed Compliance Integration Points und exact Authority/Freshness/Provenance Binding;
- FT-5 fail-closed Missing/Stale/Review/Reject Semantik;
- FT-5 DecisionRecord-Reuse;
- FT-5 compile-time `executionHandoffEligible=false`;
- FT-5 Architecture-/Negative Tests.

Nicht umgesetzt bleiben FT-6+, konkrete produktive Compliance Provider, OrderIntent Approval-Bindung, Execution-/Settlement-Integrationen und Guarded Live.

## Alternatives Considered

- **CryptoOrchestrator/CryptoRiskAgent als produktive Authority:** rejected; vermischt Research/LLM und produktive Authority.
- **Category/Pattern Formeln direkt im ScoringDispatcher:** rejected; verletzt dessen klare Scoring-Boundary.
- **Separate Scoring Engines:** rejected; verletzt ADR-0087/SC-2.
- **Neue Kafka/NATS/Temporal/pgmq Queue:** rejected; `public.outbox_jobs` ist kanonisch.
- **Separate Paper Ledger Table:** rejected; Domain Events rekonstruieren Paper State.
- **LEAN/Nautilus Runtime:** rejected fuer FT-4 wegen ueberbreitem Footprint.
- **OPA/Cedar Runtime:** rejected fuer FT-5 wegen unnoetiger DSL-/Runtime-/Authority-Flaeche.
- **OrderIntent Approval-Bindung in FT-5:** rejected; explizit FT-6-Scope.
- **Data-API-Oeffnung / SECURITY DEFINER Shortcuts:** rejected; private least-privilege financial persistence bleibt fuehrend.

## Consequences

Positiv:

- Single-Scoring-Authority bleibt erhalten;
- durable/auditierbare Workflow-/Paper-/Decision-Evidence;
- deterministische Fixed-Point Paper Semantik;
- deterministische versionierte Pre-Trade Risk-/Compliance-Entscheidungen;
- klare Policy-Authority/Evaluator-Trennung;
- exact Evidence Authority Binding;
- keine LLM-Autorisierung;
- keine neue DB, Queue, Policy Runtime oder Trading Runtime fuer FT-5;
- FT-5 kann keinen Live-Handoff erzeugen.

Kosten/Risiken:

- Contract-/Versionierungsdisziplin steigt;
- konkrete produktive Provider-/Policy-Snapshots muessen spaeter governance-seitig betrieben werden;
- Paper Simulation beweist keine reale Fill-/Liquidity-Qualitaet;
- FT-5 entscheidet keine jurisdictionsspezifische Legal Applicability;
- OrderIntent/Reconciliation fehlt bis FT-6;
- Guarded Live bleibt blockiert.

## Validation Obligations

Vor PR:

- aktuellen `main` erneut laden und semantische Korrelationen pruefen;
- Governance-/Registry-Konsistenz und Diff/Scope pruefen;
- lokale/statische/kostenguenstige Tests bevorzugen;
- keine kostenverursachende GitHub CI vor PR manuell starten;
- Post-PR-CI vor Merge ausfuehren.

FT-4 wurde produktiv hinsichtlich Replay-RPC/DB-Guards verifiziert. FT-5 benoetigt keine Produktionsmutation; die Validierung ist Code-/Contract-/Negative-Test-/Governance-basiert und muss nach PR-Erstellung durch Repository-CI bestaetigt werden.

Vor Guarded Live zusaetzlich mindestens FT-6 OrderIntent/Reconciliation, konkrete produktive Risk-/Compliance Provider Governance, Data-Quality-Negativtests, Audit Reconstruction, Kill Switch/Emergency Runbook, Human Approval Policy und Security-/Compliance-Review.

## Status

`PROPOSED` — FT-0 bis FT-5 sind implementiert; FT-4/FT-5 bleiben bis zur kombinierten Post-PR-CI merge-pending. Produktive Scoring-, IAM-, Compliance-Policy- oder Execution-Authority wird nicht veraendert. **FT-6 OrderIntent & Reconciliation** ist der naechste Roadmap-Block.
