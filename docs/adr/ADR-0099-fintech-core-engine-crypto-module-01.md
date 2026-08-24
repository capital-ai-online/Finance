# ADR-0099 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.9.0
- **Date:** 2026-08-24
- **Lifecycle:** accepted
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **FT-6A predecessor:** PR #481 merged
- **FT-6B closure:** PR #483 merged
- **Supersession A+B:** merged on `main`
- **Meme/DeFi Research Scoring:** `0.3.0` on `main`, non-executable
- **P1 extension:** deterministic portfolio allocation / bounded FT-5 portfolio-risk projection
- **Protected authority:** ADR-0087 / Single Scoring Architecture
- **Related evidence authority:** ADR-0100 / DeFiLlama evidence-only

## Context

CAPITAL-AI besitzt eine produktive Single-Dispatcher-Scoring-Architektur und separate Research-Pfade. Der FinTech Core komponiert Finanz-Workflows, ohne eine parallele Scoring-, Investment-Strategy-, Suitability-, Evidence-, Governance-, Compliance-Policy-, IAM-, Queue-, Persistence-, Execution- oder Custody-Authority zu schaffen.

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

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. DeFiLlama bleibt Evidence Acquisition und besitzt keine Score-/Ranking-/Eligibility-Authority.

Der FinTech Core benoetigt zusaetzlich eine deterministische Portfolio-Composition-Stufe zwischen einem extern govern­ten Portfolio-Target und FT-5 Risk/Compliance. Ohne diese Stufe wuerden Position Sizing, Konzentrationsgrenzen und Ziel-vs.-Ist-Notional-Delta entweder in Strategy-/Scoring-Code oder im Risk Gate vermischt. P1 schliesst diese Luecke, ohne eine neue Investment-Strategy- oder Risk-Approval-Authority zu schaffen.

## Decision

`src/platform/FinTechCore/` mit `moduleId=fintech-core.crypto` bleibt **financial workflow composition authority**.

Der Core darf besitzen:

- Workflow-Lifecycle, Run-/Trace-/Correlation-Identitaet;
- versionierte Decision-, Domain-Event-, Portfolio-Allocation-, OrderIntent- und Reconciliation-Contracts;
- Operating-Mode-Enforcement;
- deterministische Paper-/Replay-Semantik;
- deterministische Evaluation externer Portfolio-Allocation- und Risk-/Compliance-Policy-Snapshots;
- deterministische Projektion portfolio-abgeleiteter Evidence in bestehende FT-5-Vertraege;
- OrderIntent-Idempotency-/Integrity-Vertraege;
- append-only durable Evidence, soweit ein expliziter bestehender Persistence-Contract dies autorisiert.

Der Core darf nicht besitzen:

- produktive Score-Berechnung ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`;
- Investmentziel-/Alpha-/Strategy-Generierung oder Score-to-Weight-Logik;
- Client Suitability, Risk Tolerance oder Loss-Bearing-Capacity Authority;
- IAM/AuthN/AuthZ-Policy;
- juristische Compliance-Policy-Definition;
- autonome Portfolio-/Risk-/Compliance-Freigabe durch LLM/Agenten;
- Exchange Credentials, Wallet Private Keys oder Custody Secrets;
- reale Kapitalbewegung oder autonome Execution in FT-0…FT-6/P1;
- Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.

## Operating Modes — fail-closed

```text
RESEARCH      real=false simulated=false newOrders=false
PAPER         real=false simulated=true  newOrders=true
GUARDED_LIVE  real=false simulated=false newOrders=false
PRODUCTION    real=false simulated=false newOrders=false
EMERGENCY     real=false simulated=false newOrders=false
```

Der Real-Execution-Eligibility-Helper bleibt fuer **alle** Modi `false`. Jede Freischaltung ist FT-7+ und benoetigt eine separate Architektur-/Security-Entscheidung.

## Persistence Authority

Kanonisch:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
public.outbox_jobs
```

Es werden keine zweite Queue, kein zweites Event Journal, kein zweites Order Ledger, keine zweite Reconciliation-Tabelle und durch P1 kein separates Portfolio-Allocation-Ledger eingefuehrt.

Private Persistence bleibt service-role-only hinter schmalen `SECURITY INVOKER` RPCs. `anon`/`authenticated` erhalten keine direkte private-schema Capability.

P1 besitzt aktuell keinen eigenstaendigen durable Consumer. Deshalb wird kein neuer Portfolio-Allocation-Persistence-Pfad oder spekulativer Event-Typ eingefuehrt. Eine spaetere Persistenz benoetigt einen expliziten versionierten Contract und muss die bestehende FinTechCore Persistence-/Domain-Event-Authority wiederverwenden.

## Canonical Financial Representation

Finanzielle Werte verwenden gemeinsam:

```text
FinTechCoreFixedPoint {
  atoms: string
  scale: number
}
```

`PaperFixedPoint` ist nur Typalias. JavaScript Binary Floating Point darf keine Financial Authority erhalten. PostgreSQL `numeric` bleibt nur Persistence-/Legacy-Projektion.

## P1 Deterministic Portfolio Allocation / Position Sizing

Contract:

```text
fintech-core/portfolio-allocation/0.1.0
```

P1 akzeptiert ausschliesslich explizite, extern governte Target Weights. Jedes Target bindet:

```text
assetId
targetWeightBps
targetAuthorityId
targetAuthorityVersion
evidenceRefs
```

FinTechCore leitet Target Weights niemals aus Caller Tier/Confidence, LLM-/Agent-Ausgabe, Raw Provider, Meme/DeFi Research Score oder `CanonicalScoreResult` ab. Ein kuenftiger Optimizer oder Strategy Layer muss upstream eine eigene reviewte Strategy-/Suitability-Authority besitzen und darf P1 nur ueber diesen Target-Contract beliefern.

P1 ist in dieser Version begrenzt auf:

```text
operatingMode in {RESEARCH, PAPER}
longOnly = true
leverageAllowed = false
```

Policy Gates:

- per-asset maximum weight;
- maximum portfolio deployment;
- minimum cash reserve;
- rebalance threshold;
- quote asset / quote scale;
- explicit policy identity/version/evidence.

Der Allocator verlangt eine vollstaendige Portfolio-Valuation, in der `cashBalance + positions == totalEquity` exakt gilt. Target Notional wird deterministisch mit Integer-BPS-Arithmetik berechnet; Rundungsresiduen verbleiben in der Cash Reserve.

Ergebnis ist ausschliesslich ein `PROPOSED` Allocation Proposal mit Replay-Hashes und `executionHandoffEligible=false` oder ein fail-closed `NOT_COMPUTABLE`/`BLOCKED`.

## P1 -> FT-5 Portfolio-Risk-Evidence Projection

Contract:

```text
fintech-core/portfolio-risk-projection/0.1.0
```

Die Projektion erzeugt nur die bereits von `FinTechCoreRiskEvidenceSnapshot` erwarteten portfolio-abgeleiteten Felder:

```text
projectedGrossExposure
currentEquity
portfolioEvidenceAuthorityId
portfolioEvidenceRefs
```

Sie erzeugt keine Risk Decision und keine Compliance Decision.

Explizit **nicht** von P1 erzeugt werden:

```text
orderNotional
peakEquity
availableLiquidity
marketDataObservedAt / market authority
counterparty evidence
```

Diese Daten muessen aus ihren bestehenden unabhaengigen Evidence-Authorities kommen, bevor der kanonische FT-5 Gate aufgerufen wird.

Die Projection bindet eine explizite `projectionAuthorityId`/Version/Evidence und haelt die zugrunde liegende Portfolio-Valuation-Authority separat tracebar. FT-5 `riskPolicy.portfolioEvidenceAuthorityId` muss exakt zu dieser govern­ten Projection Authority passen. Caller-Substitution auf eine andere Authority fuehrt im bestehenden `GROSS_EXPOSURE`-/`DRAWDOWN`-Gate fail-closed zu `NOT_COMPUTABLE`.

Die Allocation Input-/Output-Hashes werden als Replay-Lineage gebunden; sie sind keine digitale Signatur. Die Projection prueft zusaetzlich ihre relevanten Financial-/Identity-Invarianten selbst, insbesondere Target-Notionals + Cash = Current Equity.

## Suitability / Regulatory Boundary

P1 implementiert keine juristische Suitability-Entscheidung. Fuer einen spaeteren regulierten Portfolio-Management-Use-Case muessen Kenntnisse/Erfahrung, Anlageziele/Risikotoleranz und Verlusttragfaehigkeit durch eine separate governte Upstream-Authority behandelt werden. Die P1-Composition prueft nur den bereits autorisierten Target-Plan gegen technische Portfolio-Constraints.

MiCA Art. 81 und ESMA-Suitability-Guidance werden als Architektur-/Governance-Leitplanken verwendet; daraus werden in FinTechCore keine pauschalen juristischen Applicability- oder Kundeneignungsannahmen hardcodiert.

## FT-5 Approval Authority

FT-5 bleibt einzige Risk-/Compliance-Approval-Quelle fuer FT-6:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Missing, stale, wrong-authority, rejected oder review-required Evidence wird nie synthetisch zu `APPROVED`.

P1-Allocation oder P1-Risk-Projection kann keine Approval erzeugen oder bestehende FT-5 Decisions ueberschreiben.

## FT-6 Single Canonical OrderIntent

FT-6 erweitert `FinTechCoreOrderIntent` in place. `FinTechCoreBoundOrderIntent` wird nicht als zweite Domain-Authority fortgefuehrt.

Contract Version:

```text
fintech-core/order-intent/0.2.0
```

Execution-relevante Bindings umfassen `bindingState`/`bindingVersion`, Run-/Trace-/Correlation-/Asset-/Decision-Identitaet, Fixed-Point Quantity/Price Bounds, Slippage, deterministic `clientOrderId`, `idempotencyKey`, `intentHash`, Risk-/Compliance-Decision-/Policy-Bindings, Zeitfenster und `effectClass=SIDE_EFFECTING`.

`bindingState=BOUND` darf nur durch den deterministischen FT-6 Binder entstehen.

## Deterministic Approval Binding

`bindApprovedOrderIntent(...)` akzeptiert ausschliesslich authoritative FT-5 Decision Records.

Hard Gates:

- Risk und Compliance Decision vorhanden;
- beide `APPROVED`;
- korrekte Decision Types;
- exact Run/Trace/Correlation/Module/Asset/DecisionVersion;
- Output Hash vorhanden;
- Policy ID/Version vorhanden;
- Decision Timestamp im gueltigen Workflow-/Intent-Zeitfenster;
- gueltige Fixed-Point Quantity/Price Bounds;
- gueltige Slippage-/TTL-Bounds;
- `PAPER` Operating Mode.

Caller-gesteuerte Approval Flags besitzen keine Authority.

## Idempotency / Replay Identity

`clientOrderId`, `idempotencyKey` und `intentHash` werden deterministisch abgeleitet.

```text
same identity + same payload
  -> idempotenter Replay

same identity + changed payload
  -> Collision/Tamper
  -> reject
```

Blindes Retry einer SIDE_EFFECTING Operation bleibt verboten. FT-6 besitzt weiterhin keine reale Execution-Capability.

## Typed Reconciliation

Contract Version:

```text
fintech-core/reconciliation/0.2.0
```

Typed Reconciliation umfasst Order-/Client-/optional Venue-Identitaet, expected/observed Quantity, Price Bounds / Execution Price, Fee Evidence, Settlement State, `PENDING`/`MATCHED`/`MISMATCH`/`NOT_COMPUTABLE`, Evidence Refs, Timestamps und `supervisorEscalationRequired`.

Hard Rules:

- Mismatch wird nicht automatisch korrigiert;
- keine Balance wird synthetisiert;
- kein Settlement wird ohne Evidence als erfolgreich markiert;
- PAPER verwendet `settlementState=NOT_APPLICABLE`;
- `MISMATCH` setzt `supervisorEscalationRequired=true`;
- keine autonome Supervisor-Remediation.

## Persistence Evolution / Supabase Mutation

`FinTechCorePersistencePort` besitzt genau einen `appendOrderIntent`-Pfad. Der Serveradapter routet versionierte RPCs:

- v2 fuer canonical `BOUND` FT-6B Evidence;
- v1 nur als `UNBOUND` Legacy-/Research-Kompatibilitaet.

Der v1-Pfad ist keine zweite OrderIntent-Authority und darf keine FT-7-/Execution-Berechtigung begruenden. Seine physische Entfernung erfordert Consumer-/Replay-/Bestandsdaten-Evidence und, soweit die Persistence-/Security-Boundary betroffen ist, eine separate Owner-Freigabe.

Repository-Migration:

```text
supabase/migrations/20260822011500_fintech_core_ft6b_fixed_point_reconciliation.sql
```

Die Migration wurde am **2026-08-22** nach expliziter Owner-Autorisierung auf dem Supabase-Projekt `AIFINANCIAL` angewendet. Remote registriert:

```text
20260822012200 fintech_core_ft6b_fixed_point_reconciliation
```

Post-Mutation verifiziert: die FT-6B-Funktionen sind `SECURITY INVOKER`, `anon`/`authenticated` besitzen kein EXECUTE, `service_role` besitzt EXECUTE; keine neue Tabelle, kein neues Schema, keine zweite Queue und keine FT-7-Capability wurden eingefuehrt.

P1 fuehrt keine weitere Supabase-Mutation oder Migration aus.

## Meme / DeFi Research Models — Current State

`crypto-meme-integrity@0.3.0` und `crypto-defi-fundamental@0.3.0` sind auf `main` als `challenger`, `scoreEligible=false`, `research-only:not-executable` registriert.

### Meme

Die historische 35/25/20/20-Formel aus `MemeCoinScoringService` ist nicht kanonisch. Trend, Momentum und Volatility Quality sind als `meme-price-path`-Evidence gebunden. Contract-/Manipulationsrisiko bleibt Promotion-Voraussetzung.

### DeFi

TVL, Fees und Revenue bleiben Raw Evidence und sind als `defi-scale-activity` correlation-bound. DeFiLlama bleibt ADR-0100 Evidence-only. Eine spaetere produktive Promotion benoetigt weiterhin validierte Provider Coverage, Backtesting/Stress/Correlation Evidence, Fingerprints und explizite Owner-Freigabe.

## EventMesh / Traceability

FT-6B und P1 fuehren keine Event-Namen auf Verdacht ein. Ohne eindeutigen kanonischen Event Catalog bzw. durable P1-Consumer bleiben typed Contracts/Evidence fuehrend. W3C Trace Context / OpenTelemetry bleiben spaetere Trace-Haertung.

## Regulatory / Best-Practice Basis

Leitplanken:

- Regulation (EU) 2023/1114 MiCA, einschliesslich Portfolio-Management-/Suitability-Anforderungen soweit anwendbar;
- ESMA Guidelines on suitability requirements and format of the periodic statement for portfolio management activities under MiCA;
- Regulation (EU) 2022/2554 DORA;
- Regulation (EU) 2023/1113 Transfer of Funds / Crypto Travel Rule;
- EBA Travel Rule Guidelines;
- FATF VA/VASP Targeted Updates;
- W3C Trace Context / OpenTelemetry.

Diese Quellen begruenden Governance, Nachvollziehbarkeit und robuste Kontrollen, aber keine hardcodierte Legal Applicability, Kundeneignung oder Provider-PASS-Werte.

## Dependency Decision

Keine neue Runtime-/Library-Abhaengigkeit fuer P1. Gepruefte Portfolio-Optimizer wie PyPortfolioOpt, Riskfolio-Lib und cvxportfolio werden nicht in den produktiven TypeScript-Core eingebettet: P1 benoetigt keinen Optimizer, sondern eine deterministische Evaluation bereits governter Target Weights. Ein spaeterer Optimizer bleibt ein separater Strategy-/Suitability-Scope hinter demselben Contract.

Nicht integriert werden ausserdem Kafka, NATS, Temporal, pgmq, neue Trading-/Policy-Runtimes, CEX-/DEX-/Wallet-/Custody-SDKs oder TA-Lib.

## Consequences

Positiv:

- eine Scoring-, eine Financial-Value-, eine Risk-Approval-, eine OrderIntent- und eine Persistence-Authority;
- explizite Trennung Strategy/Target -> Portfolio Composition -> FT-5 Risk -> FT-6 OrderIntent;
- deterministic Position Sizing ohne Binary-Float Financial Authority;
- Target-/Policy-/Evidence-Lineage ist replay-bindbar;
- FT-5 Portfolio-Evidence kann an eine explizite Projection Authority gebunden werden;
- keine automatische Score-to-Weight- oder LLM-Portfolioentscheidung;
- keine neue Portfolio-Persistence ohne konkreten Consumer;
- fail-closed Operating Modes;
- Meme-/DeFi-Korrelationen und Promotion-Gates bleiben erhalten;
- FT-7 bleibt klar getrennt.

Trade-offs:

- P1 besitzt keinen Optimizer; Zielgewichte muessen upstream govern­t geliefert werden;
- P1 deckt zunaechst nur long-only/unlevered RESEARCH/PAPER ab;
- Peak Equity, Liquidity, Market Freshness und Counterparty Evidence muessen separat fuer FT-5 geliefert werden;
- Legacy `numeric`-Felder und der v1-`UNBOUND`-Write bleiben vorerst Compatibility Projection;
- FT-6B/P1 schliessen keine reale Execution an;
- Meme/DeFi bleiben nicht produktiv scorefaehig;
- Event-Namen und Live-Settlement bleiben spaeteren expliziten Decisions vorbehalten.

## Current State / P1 Revalidation 2026-08-24

Der fruehere P1-Branch war bei Wiederaufnahme 81 Commits hinter aktuellem `main` und wurde deshalb nicht als Integrationsbasis fortgeschrieben. Der P1-Scope wurde selektiv auf einen frischen Branch von `main@14e4f3c8a309faae63fb336a432aac38ab08ceda` portiert und gegen den aktuellen FT-5-/FT-6B-/ProviderMatrix-Stand revalidiert.

Zielzustand:

```text
FT-0 ... FT-6B = DONE on main
Supersession A+B = DONE on main
Meme/DeFi Research Scoring 0.3.0 = on main / non-executable
P1 deterministic portfolio allocation = implemented on main-sync branch
P1 bounded FT-5 portfolio-risk projection = implemented on main-sync branch
crypto champion = crypto-technical-provenance@0.7.0 unchanged
Meme/DeFi productive promotion = BLOCKED
FT-7 = BLOCKED
```

Naechster produktiver Execution-Architekturabschnitt bleibt **FT-7 Guarded Live** und ist weiterhin blockiert, bis eine separate Architektur-/Security-Entscheidung einschliesslich Owner-Gate vorliegt.
