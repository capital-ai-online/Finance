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

CAPITAL-AI besitzt bereits eine produktive Single-Dispatcher-Scoring-Architektur sowie einen Crypto-Research-Pfad. FinTech Core muss finanzielle Workflows komponieren, ohne eine parallele Scoring-, Governance-, IAM-, Compliance-Policy- oder Execution-Authority einzufuehren.

Geschuetzte Scoring-Kette:

```text
verified Evidence / Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`.

PR #467 machte FT-0..FT-2C und diese Authority auf `main` kanonisch. PR #468 machte FT-3 Durable Workflow & Traceability kanonisch. FT-4 fuegt einen ausschliesslich simulierten, replay-faehigen Paper-Workflow hinzu. FT-5 fuegt deterministische Pre-Trade Risk-/Compliance-Gates hinzu, ohne Live Execution oder regulatorische Policy-Definition in den Core zu verlagern.

## Decision

CAPITAL-AI fuehrt `src/platform/FinTechCore/` mit `moduleId = fintech-core.crypto` als **financial workflow composition authority** fort. Sie ist keine Trading-Strategie, keine Scoring Engine, keine Compliance-Policy-Authority und kein Broker/Exchange Gateway.

### 1. Authority Boundaries

FinTech Core darf besitzen:

- Workflow-Lifecycle und Korrelation;
- versionierte Decision-/Domain-Event-/OrderIntent-Contracts;
- Operating-Mode-Enforcement;
- Composition von Category-, Pattern-, Scoring-, Portfolio-, Risk-, Compliance- und spaeter Execution-Adaptern;
- Orchestration-Level-Idempotency und Reconciliation-Anforderungen;
- durable Workflow-/Event-/Decision-/Intent-Evidence;
- deterministische Paper-Accounting-/Replay-Semantik;
- deterministische Evaluation externer versionierter Risk-/Compliance-Policy-Snapshots.

FinTech Core darf nicht besitzen:

- produktive Score-Berechnung oder Modellselektion ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`;
- IAM/AuthN/AuthZ-Policy;
- regulatorische oder fachliche Compliance-Policy-Definition;
- Quality-/Governance-/Supervisor-/Deployment-/Release-Authority;
- Exchange-Credentials, Wallet Private Keys oder Custody-Secrets;
- LLM-/Agent-Autorisierung von Risk-/Compliance-Freigaben;
- autonome Execution ohne spaetere Risk-/Compliance-/Human-Gates;
- reale Kapitalbewegung durch FT-4/FT-5.

### 2. Research / Category / Pattern Boundaries

`CryptoOrchestrator` bleibt Research-only. Category-Analyse bleibt getrennt von kanonischer Taxonomie. Missing/stale Evidence wird nicht als `0` oder `PASS` interpretiert. Pattern Detection/Reliability/Resolution bleibt:

```text
scoreEligible     = false
executionEligible = false
authority         = RESEARCH_CONTEXT_ONLY
```

Pattern Reliability ist exact-key gebunden an Asset, Analysis Profile, Timeframe, Market Regime, Pattern und Validation-Version. Gleichrangige Gegensignale bleiben `CONFLICTING_EVIDENCE`. Ein spaeteres 1h/4h Feature darf nur reliability-/conflict-gated und ohne Double Counting eingefuehrt werden.

### 3. Operating Modes

Vertraglich vorgesehen:

- `RESEARCH`
- `PAPER`
- `GUARDED_LIVE`
- `PRODUCTION`
- `EMERGENCY`

Crypto Module 01 unterstuetzt durch FT-5 weiterhin nur `RESEARCH` und `PAPER`. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert. Ein LLM darf keinen permissiveren Modus aktivieren.

### 4. Retry und Side Effects

Aktionen bleiben `RETRY_SAFE` oder `SIDE_EFFECTING`. Live Orders, Withdrawals, Settlement und Custody benoetigen end-to-end Idempotency, Client-/Venue-Order-IDs und definierte Recovery-Semantik, bevor Retry erlaubt ist.

FT-3 `order_intents` sind durable Intent-/Evidence-Records und keine Execution. FT-4 Paper Fills sind Simulation Events. FT-5 erzeugt nur Gate Decisions bzw. einen contract-level approval-bound Handoff und fuehrt keine externe Side Effect aus.

### 5. Durable Workflow State — FT-3

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
- RLS + Least Privilege bleiben Defense in Depth;
- `anon`/`authenticated` erhalten keinen Zugriff auf das private Schema;
- `service_role` besitzt nur die benoetigten Rechte;
- bestehende `public.outbox_jobs`, `agent_audit_events`, `score_snapshots` und Traceability/EventMesh-Vertraege werden wiederverwendet;
- keine zweite Queue-Authority.

Der Domain-Port bleibt storage-agnostisch. Die konkrete Supabase-Bindung bleibt serverseitig. Schmale `public` RPCs verwenden `SECURITY INVOKER`, sind nur fuer `service_role` ausfuehrbar und oeffnen das private Finanzschema nicht fuer Browserrollen.

### 6. FT-4 Paper Accounting Boundary

FT-4 ist reine Simulation:

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange routing = false
custody/wallet capability = false
```

Paper-Geld-/Mengenwerte werden JSON-safe als `atoms + scale` modelliert und mit `BigInt` berechnet. Short Selling, Margin und Leverage sind nicht implementiert. Jeder Fill traegt explizite Fee-/Slippage-/Funding-Evidence; es gibt keine versteckten Nullkosten.

### 7. FT-4 Event-Sourced Replay

FT-4 fuehrt keine zweite Paper-Ledger-Tabelle ein. Das append-only Journal bleibt `fintech_core.domain_events`:

```text
PAPER_ACCOUNT_INITIALIZED   paperSequence=0
PAPER_FILL_SIMULATED        paperSequence=1..N
```

Replay re-simuliert gespeicherte Fills und verwirft manipulierte, korrelationsfremde, causation-falsche oder nicht-kontinuierliche Eventfolgen. DB-Guards erzwingen kanonische Payload, genau eine Initialisierung, eindeutige Sequence und Fill-Causation.

Der read-only `FinTechCoreDomainEventReaderPort` wird ueber `public.fintech_core_list_domain_events_v1(text)` umgesetzt. Der RPC ist `SECURITY INVOKER`, nur fuer `service_role` ausfuehrbar und verleiht keine Mutation-/Execution-Authority.

Produktiv verifiziert ist Migration `20260821071823 / fintech_core_paper_replay_reader`; Testdaten wurden transaktional vollstaendig zurueckgerollt.

### 8. FT-5 Deterministic Risk Policy Evaluation

FT-5 fuehrt eine pure, provider-neutrale `RiskCompliance/` Domain-Schicht ein.

Risk Gates:

```text
ORDER_NOTIONAL
GROSS_EXPOSURE
DRAWDOWN
LIQUIDITY
STALENESS
COUNTERPARTY
```

Grenzwerte kommen aus einem extern versionierten `FinTechCoreRiskPolicySnapshot`. Dieser bindet Policy-ID/-Version, Fixed-Point Limits, Drawdown-/Liquidity-/Freshness-Grenzen und die erwarteten Evidence Authorities.

Der Core evaluiert die Policy deterministisch, besitzt aber **nicht** die Authority, die Grenzwerte festzulegen.

### 9. FT-5 Compliance Integration Boundary

Typed Integrationspunkte:

```text
KYC
KYB
AML
SANCTIONS
WALLET_SCREENING
JURISDICTION
TRAVEL_RULE
```

`FinTechCoreCompliancePolicySnapshot` legt explizit fest:

- welche Controls erforderlich sind;
- welche Authority Evidence je Control liefern darf;
- wie alt Evidence maximal sein darf;
- welche Policy-Evidence den Snapshot belegt.

Der Core inferiert nicht, ob KYC, KYB, Travel Rule oder andere Controls in einer Jurisdiktion rechtlich erforderlich sind. Diese Entscheidung bleibt externe Compliance-/Policy-Authority.

### 10. FT-5 Evidence Integrity / Fail Closed

Ein `PASS` allein reicht nicht. Evidence muss:

- zum angeforderten Control passen;
- exakt an die erwartete `authorityId` gebunden sein;
- einen Provider ausweisen;
- Evidence-Refs besitzen;
- einen gueltigen Observed Timestamp besitzen;
- das Policy-Freshness-Limit einhalten.

Risk-spezifisch werden Order-, Portfolio-/Equity-, Liquidity-, Market- und Counterparty-Evidence getrennt provenance-/authority-bound bewertet.

Outcome-Prioritaet:

```text
REJECTED > NOT_COMPUTABLE > REVIEW_REQUIRED > APPROVED
```

Limit-/Counterparty-/Sanctions-Fail wird `REJECTED`. Missing/stale/mismatched-authority Evidence wird `NOT_COMPUTABLE`. Manuelle Pruefung bleibt `REVIEW_REQUIRED`. Es gibt keine synthetischen PASS-/Zero-/Probability-Fallbacks.

### 11. Keine LLM-/Agent-Autorisierung

Bestehende AI-/Research-Risk-Agents koennen Kontext anreichern, aber keine FT-5-Freigabe erteilen. Insbesondere wird der LLM-/Fallback-basierte `CryptoRiskAgent` nicht als Risk Authority verwendet.

Architecture Tests verbieten direkte AI-/Agent-/Provider-/Exchange-/Supabase-Imports in der FT-5 Gate-Schicht.

`src/platform/Compliance` bleibt SecurityComplianceAuditor-/Repository-Compliance-Komponente nach ADR-0012 und wird nicht zur Transaktions-AML-Authority umdefiniert. ADR-0058 Agent IAM bleibt Agent-/Tool-Authorization und ist keine Financial Pre-Trade Risk Policy.

### 12. FT-5 Durable Decision Evidence Reuse

FT-5 fuehrt keine neue Tabelle ein. `RiskComplianceDecisionRecords.ts` mappt Gate-Ergebnisse in bestehende FT-3 `FinTechCoreDecisionRecord`s:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Policy-ID/-Version, Run/Trace/Correlation/Asset/Decision-Version, Input-/Output-Hashes, Evidence-Refs und Outcome bleiben append-only auditierbar. Hash-Berechnung bleibt Infrastrukturverantwortung; der Domain-Layer fuehrt keine zweite Hashing-Authority ein.

### 13. FT-5 OrderIntent Handoff Boundary

Ein approval-bound OrderIntent-Handoff ist nur moeglich, wenn:

- Risk = `APPROVED`;
- Compliance = `APPROVED`;
- Run/Trace/Correlation/Asset/Decision-Version exakt passen;
- Operating Mode `GUARDED_LIVE` oder `PRODUCTION` ist.

Da Crypto Module 01 durch FT-5 weiterhin nur `RESEARCH` und `PAPER` unterstuetzt, ist kein Live-Handoff erreichbar. `PAPER` darf Gate Decisions erzeugen, aber:

```text
executionHandoffEligible = false
```

FT-5 signiert, persistiert, routet oder exekutiert keine Order. FT-6/FT-7 bleiben dafuer verantwortlich.

### 14. Regulatory / Best-Practice Basis

Die FT-5-Grenze wurde gegen aktuelle Primaerquellen abgeglichen, insbesondere:

- MiCA Risk-Assessment-/Record-Keeping-Anforderungen;
- EBA ML/TF Risk Factor Guidelines fuer CASPs;
- EBA Travel Rule Guidelines unter Regulation (EU) 2023/1113;
- FATF VA/VASP Targeted Update 2026.

Diese Quellen stuetzen risikobasierte, nachvollziehbare, provenance-/freshness-faehige Kontrollen. FT-5 codiert daraus keine Rechtsberatung oder jurisdictionsspezifische Rechtsentscheidung.

### 15. Open Source / Dependency Decision

FT-3 verwendet bestehendes PostgreSQL/Supabase und `@supabase/supabase-js`; kein direkter `pg`-Client wurde eingefuehrt.

Fuer FT-4 wurden QuantConnect LEAN und NautilusTrader bewertet, aber wegen ueberbreiter Trading-Runtime-/Dependency-/Governance-Flaeche nicht integriert.

Fuer FT-5 wurden **Open Policy Agent (OPA)** und **Cedar** als etablierte Apache-2.0 Policy Engines bewertet. Beide sind enterprise-faehig, wuerden fuer den derzeit kleinen typed Evaluator jedoch eine zusaetzliche Policy-Runtime/DSL und damit eine neue Governance-/Dependency-Oberflaeche einfuehren. Deshalb werden sie in FT-5 nicht integriert. Eine spaetere Zentralisierung vieler Policy-Domaenen kann diese Entscheidung neu bewerten.

Die Plugin-Suche ergab keinen geeigneten spezialisierten AML/KYC/Sanctions-Connector. Es wird kein neues Plugin eingefuehrt.

### 16. Reconciliation Contract bleibt FT-6

`fintech_core.reconciliation_records` bleibt Evidence-Scaffold. Typed OrderIntent-Hardening, TTL/Bounds, Client-Order-ID sowie Application-Reconciliation-/Settlement-Semantik gehoeren zu FT-6.

### 17. External Platform Mutations

FT-3/FT-4 verwendeten produktive Supabase-Migrationen unter den vorgesehenen Gates.

FT-5 benoetigt **keine** neue Supabase-, Render-, Stripe-, IAM-, Scoring-, Exchange- oder Custody-Mutation. Es verwendet bestehende FT-3 Decision Persistence.

## Implemented Scope

Als implementiert und durch Code/DB/Evidence belegt gelten:

- FT-0 Contract/Governance Foundation;
- FT-1 Core Engine Foundation;
- FT-2A Category Profile Resolution;
- FT-2B Category Feature Contracts;
- FT-2C Pattern Engine Research Foundation;
- FT-3 private durable Persistence und least-privilege/append-only Guards;
- FT-3 storage-agnostic Persistence Port und service-role-only Supabase RPC Boundary;
- FT-4 deterministic Paper Trading / Fixed-Point Balances / explicit Costs / durable Replay;
- FT-4 service-role-only Event Reader und DB-Level Paper Guards;
- FT-5 typed external Policy-/Evidence Contracts;
- FT-5 deterministic Risk Gates;
- FT-5 typed Compliance Integration Points und exact Authority Binding;
- FT-5 fail-closed Missing/Stale/Review/Reject Semantik;
- FT-5 DecisionRecord-Reuse;
- FT-5 PAPER-vs-Live Handoff Boundary;
- FT-5 Architecture-/Negative Tests.

Nicht umgesetzt bleiben FT-6+ sowie konkrete produktive KYC/KYB/AML/Sanctions/Wallet/Jurisdiction Provider, Execution-/Settlement-Integrationen und Guarded Live.

## Alternatives Considered

### Promote CryptoOrchestrator or CryptoRiskAgent to productive authority

**Rejected.** Wuerde Research/LLM-Ausgaben mit produktiver Scoring-/Risk-/Execution-Authority vermischen.

### Category/Pattern formulas directly in ScoringDispatcher

**Rejected.** Der Dispatcher bleibt kanonische Scoring Execution Boundary, nicht Evidence-Acquisition-/Technical-Analysis-/Compliance-Engine.

### Separate productive scoring engines per crypto category

**Rejected.** Wuerde ADR-0087/SC-2 verletzen.

### New Kafka/NATS/Temporal/pgmq or second queue

**Rejected through FT-5.** `public.outbox_jobs` ist die etablierte Queue-/Lease-Primitive.

### Separate Paper Ledger table

**Rejected for FT-4.** Durable Domain Events rekonstruieren Paper State deterministisch; eine weitere Ledger-Authority waere dupliziert.

### QuantConnect LEAN / NautilusTrader runtime integration

**Rejected for FT-4.** Fuer den engen Paper-Scope architektonisch ueberdimensioniert.

### OPA / Cedar runtime integration

**Rejected for FT-5.** Gute Enterprise-Policy-Engines, aber zusaetzliche Runtime/DSL/Authority fuer einen derzeit kleinen typed deterministischen Evaluator. Externe versionierte Policy-Snapshots reichen aus.

### Expose `fintech_core` through Supabase Data API / SECURITY DEFINER shortcuts

**Rejected.** Financial workflow/evidence persistence bleibt private und least-privilege.

## Consequences

Positiv:

- Erhalt der Single-Scoring-Authority;
- durable/auditierbare Workflow-/Paper-/Decision-Evidence;
- deterministische Fixed-Point Paper Accounting Semantik;
- deterministische, versionierte Pre-Trade Risk-/Compliance-Gates;
- klare Trennung zwischen Policy Authority und Evaluation Engine;
- exact Authority Binding verhindert beliebige PASS-Evidence;
- Missing/Stale/Review bleibt fail-closed;
- keine LLM-Risk-/Compliance-Autorisierung;
- keine neue DB, Queue, Policy Runtime oder Trading Runtime fuer FT-5;
- reales Kapital und Side Effects bleiben blockiert.

Kosten/Risiken:

- Contract-/Versionierungsdisziplin nimmt weiter zu;
- konkrete produktive Provider-/Policy-Snapshots muessen spaeter governance-seitig betrieben werden;
- Paper Simulation ist kein Beweis fuer reale Fill-/Liquidity-Qualitaet;
- FT-5 entscheidet nicht selbst ueber jurisdictionsspezifische Legal Applicability;
- Reconciliation/Execution fehlt bis FT-6/FT-7;
- Guarded Live bleibt absichtlich blockiert.

## Validation Obligations

Vor jedem PR:

- aktuellen `main` erneut laden und semantische Korrelationen pruefen;
- Governance-/Registry-Konsistenz und Diff/Scope pruefen;
- lokale/statische/kostenguenstige Tests bevorzugen;
- keine kostenverursachende GitHub CI vor PR manuell starten;
- Post-PR-CI vor Merge ausfuehren.

FT-4 wurde produktiv hinsichtlich Replay-RPC/DB-Guards verifiziert. FT-5 benoetigt keine Produktionsmutation; die erforderliche Validierung ist Code-/Contract-/Negative-Test-/Governance-basiert und muss nach PR-Erstellung durch die Repository-CI bestaetigt werden.

Vor Guarded Live zusaetzlich mindestens:

- FT-6 typed OrderIntent/Reconciliation und Crash/Duplicate Recovery;
- konkrete produktive Risk-/Compliance-Policy und Provider Governance;
- Data-Quality/Staleness-Failure-Tests;
- Audit Reconstruction;
- Kill Switch/Emergency Runbook;
- Human Approval Policy;
- Security-/Compliance-Review.

## Status

`PROPOSED` — FT-0 bis FT-5 sind implementiert; FT-4/FT-5 bleiben bis zur kombinierten Post-PR-CI merge-pending. Produktive Scoring-, IAM-, Compliance-Policy- oder Execution-Authority wird nicht veraendert. **FT-6 OrderIntent & Reconciliation** ist der naechste Roadmap-Block.
