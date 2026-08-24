# CAPITAL-AI FinTech Core

Der `FinTechCore` ist die versionierte finanzielle Workflow-Composition-Schicht von CAPITAL-AI. Er komponiert Research-, Paper-, Portfolio-, Risk-/Compliance- und spaeter separat autorisierte Execution-Gates. Er besitzt keine produktive Scoring-, Investment-Strategy-, Suitability-, IAM-, Compliance-Policy-, Deployment-, Exchange- oder Custody-Authority.

## Aktueller Implementierungsstand

- Roadmap: `FT-CORE-CRYPTO-01`
- Architekturentscheidung: `ADR-0099` (`accepted`)
- Protected Scoring Authority: `ADR-0087`
- DeFi Evidence Authority: `ADR-0100` (`accepted`, evidence-only)
- erstes Modul: `fintech-core.crypto`
- FT-1: Core Engine, Module Registry, deterministic Workflow State Machine
- FT-2A: provenance-aware Primary-/Secondary-Analyseprofile
- FT-2B: kategoriespezifische Feature-/Evidence-Contracts
- FT-2C: detector-agnostische Pattern Detection Contracts und Research Resolver
- Supersession B: Meme/DeFi Research Models `0.3.0`, non-executable challengers, keine Promotion (FT-2D)
- FT-3: private durable Workflow-/Event-/Decision-/OrderIntent-/Reconciliation-Persistenz
- FT-4: deterministic, replay-faehiges Paper Trading
- FT-5: deterministic Pre-Trade Risk + Compliance Decisions
- FT-6A: Decision-/Hash-Binding Foundation, gemergt mit PR #481
- FT-6B: single canonical OrderIntent, gemeinsames Fixed Point, deterministic Approval Binding, typed Reconciliation und v2 Persistence Boundary, gemergt mit PR #483
- P1 Portfolio Allocation: deterministic long-only/unlevered RESEARCH/PAPER Proposal + bounded FT-5 Portfolio-Risk-Evidence-Projektion, gemergt mit PR #520 / auf `main`
- P1-A Honeypot Simulation Evidence: governed read-only EVM BUY/SELL pre-run evidence fuer die bestehenden Meme-Hard-Gates; keine Route-/Order-/Execution-Authority
- reale Exchange-/Custody-Ausfuehrung: **nicht freigeschaltet**
- FT-7 Guarded Live: **blockiert bis separate Architektur-/Security-Entscheidung**

## Authority Boundary

Kanonisches Scoring bleibt unveraendert:

```text
UAI
  -> Evidence / Data Quality
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
  -> Ranking / Eligibility
  -> EventMesh / Traceability / Supervisor
```

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. Der FinTech Core ersetzt keine Scoring-, Investment-Strategy-, Suitability-, IAM-, Compliance-Policy-, Quality-, Release-, Deployment- oder Supervisor-Authority.

Der kanonische Crypto Champion bleibt `crypto-technical-provenance@0.7.0`. Die Kategorie-Challenger `crypto-meme-integrity@0.3.0` und `crypto-defi-fundamental@0.3.0` sind `research-only:not-executable`, `scoreEligible=false` und besitzen keine produktive Ausfuehrungsautoritaet.

## Meme / DeFi Research Supersession

### Meme

`crypto-meme-research-features/0.3.0` ersetzt keine produktive Score-Formel. Die historische Meme-35/25/20/20-Formel bleibt Legacy/non-authorizing.

- Trend, Momentum und Volatility Quality sind als `meme-price-path` korrelationsgebunden.
- Liquiditaet darf nicht als Community-, Popularitaets- oder Manipulations-Evidence wiederverwendet werden.
- Contract-Integrity und Manipulation-Risk sind Promotion-Gates.
- Missing/Stale Evidence wird nie zu `0`, PASS oder neutralem Default.

### DeFi

`crypto-defi-research-features/0.3.0` ist ebenfalls ein non-executable Challenger-Contract.

- TVL, Fees und Revenue liegen in derselben Korrelationsgruppe `defi-scale-activity`.
- Eine spaetere additive Einzelgewichtung benoetigt validierte De-Korrelation oder einen Latent-Factor.
- `protocol.smartContractEvidenceVerified` und `risk.oracleRiskWithinPolicy` bleiben harte Promotion-/Evidence-Gates.
- DeFiLlama ist ausschliesslich Evidence-Provider und niemals Score-/Eligibility-Authority.

`defi-protocol-evidence/1.1.0` ist fail-closed:

```text
READY              -> alle emittierten Features VERIFIED
PARTIAL            -> mindestens ein VERIFIED, aber Set nicht vollstaendig verified
STALE              -> kein VERIFIED, aber stale Evidence vorhanden
SOURCE_UNAVAILABLE -> keine verified/stale Evidence verfuegbar
```

`STALE`, `NOT_AVAILABLE` und `INVALID` erfuellen keine REQUIRED-/HARD_GATE-Semantik.

## Financial Representation

Finanzielle Quantity-/Price-/Money-Werte verwenden kanonisch:

```text
FinTechCoreFixedPoint {
  atoms: string
  scale: number
}
```

`PaperFixedPoint` ist nur noch ein Alias. JavaScript Binary Floating Point besitzt keine Financial Authority. PostgreSQL `numeric` bleibt ausschliesslich Compatibility Projection fuer bestehende Persistenzfelder.

## FT-3 Durable Persistence

Das private Schema bleibt kanonisch:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

`public.outbox_jobs` bleibt die einzige Queue-/Lease-Authority.

Eigenschaften:

- `anon`/`authenticated` ohne direkte private Finance-Capability;
- `service_role` Least Privilege;
- append-only Event-/Decision-/Intent-/Reconciliation-Evidence;
- immutable Workflow-Identitaet;
- idempotente bzw. Compare-and-Set RPC-Boundaries;
- `FinTechCorePersistencePort` bleibt storage-agnostisch;
- `server/fintechCorePersistence.ts` ist die privilegierte Supabase-Bindung.

Persistenz ist keine Execution.

## FT-4 Research & Paper Trading

```text
operatingMode = PAPER
accountingMode = CASH_LONG_ONLY
real capital = false
exchange routing = false
```

Paper State wird aus append-only Domain Events rekonstruiert. Fee-, Slippage- und Funding-Evidence bleibt explizit. Missing/Stale Evidence wird nicht zu `0` oder `PASS` umgedeutet.

## P1 Deterministic Portfolio Allocation / Position Sizing

Contract:

```text
fintech-core/portfolio-allocation/0.1.0
```

P1 schliesst die deterministische Composition-Luecke zwischen einem **extern govern­ten** Portfolio-Target und FT-5. FinTechCore erzeugt weder Investmentziele noch Score-to-Weight-, Suitability- oder LLM-basierte Zielgewichte.

Eingang:

```text
Workflow Context
+ versionierte Allocation Policy
+ vollstaendige Portfolio-Valuation-Evidence
+ explizite Target Weights
  + targetAuthorityId
  + targetAuthorityVersion
  + evidenceRefs
```

Ergebnis:

```text
PROPOSED
+ current/target weights
+ current/target/delta notionals
+ cash reserve
+ concentration/deployment constraints
+ replay hashes
+ executionHandoffEligible=false
```

P1 ist bewusst auf `RESEARCH` und `PAPER`, `longOnly=true` und `leverageAllowed=false` begrenzt. `GUARDED_LIVE`, `PRODUCTION` und `EMERGENCY` werden fail-closed blockiert.

Alle Financial Values verwenden `FinTechCoreFixedPoint`. Target Notional wird mit deterministischer Integer-BPS-Arithmetik berechnet; Rundungsresiduen verbleiben in der Cash Reserve.

### P1 -> FT-5 Portfolio-Risk-Evidence Projection

Contract:

```text
fintech-core/portfolio-risk-projection/0.1.0
```

Die Projektion erzeugt ausschliesslich die bereits von FT-5 erwarteten portfolio-abgeleiteten Felder:

```text
projectedGrossExposure
currentEquity
portfolioEvidenceAuthorityId
portfolioEvidenceRefs
```

Sie erzeugt **keine Risk Decision**. Order Notional, Peak Equity, Liquidity, Market Freshness und Counterparty Evidence bleiben separate FT-5-Evidence-Quellen. Eine versionierte Projection Authority bindet die abgeleiteten Portfolio-Werte; der zugrunde liegende Valuation-Provider bleibt separat tracebar.

FT-5 bleibt die einzige Risk-Approval-Authority. P1 besitzt keine Execution-Handoff-Berechtigung.

### P1 Persistence Decision

P1 fuehrt keine neue Tabelle, Queue, Portfolio-Ledger- oder spekulative Event-Authority ein. Der Proposal-/Projection-Slice besitzt aktuell keinen eigenstaendigen durable Consumer. Falls spaeter Persistence erforderlich wird, muss sie die bestehende FinTechCore Persistence-/Domain-Event-Authority mit einem explizit reviewten Contract wiederverwenden.

## P1-A Governed Honeypot Buy/Sell Simulation Evidence

P1-A erweitert keine Scoring- oder Execution-Authority. Es nutzt den bestehenden `goplus`-Provider und `ResearchEvidenceProviderHttp` fuer read-only EVM Transaction-Simulation-Evidence.

```text
governed route/calldata evidence
  -> GoPlus transaction_simulation
  -> goplus-transaction-simulation-evidence/1.0.0
  -> crypto-meme-honeypot-simulation-evidence/0.1.0
  -> risk.buySimulationSuccess / risk.sellSimulationSuccess
  -> Meme research hard-gate input only
```

Hard Rules:

- der Provider konstruiert keine Route;
- keine Signatur, kein Broadcast und kein Order Routing;
- fehlender API-Key ist `NOT_CONFIGURED` und erzeugt keinen Netzwerkzugriff;
- fehlende oder nicht zuordenbare Target-Token-Balance-Evidence bleibt `NOT_COMPUTABLE`;
- Token-Security-Flags wie `is_honeypot`, `cannot_buy` oder `cannot_sell_all` duerfen keinen Simulation-PASS erzeugen;
- BUY und SELL muessen Chain, Token und Route-Authority/-Version exakt teilen;
- `scoreEligible=false`, `executionEligible=false`.

Die Contract-Foundation allein belegt noch keine reale Asset-/Chain-Coverage, Freshness-Policy oder Model-Promotion. Diese Evidence bleibt getrennt nachzuweisen.

## FT-5 Deterministic Risk + Compliance

FT-5 bleibt die einzige Approval-Quelle fuer FT-6.

Kanonische Decision Types:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Risk-/Compliance-Entscheidungen sind versioniert, policy-gebunden und provenance-faehig. LLM-/Agent-Ausgaben oder P1-Portfolio-Proposals koennen diese Freigaben weder erzeugen noch ueberschreiben.

## FT-6B Canonical OrderIntent

Es existiert genau ein kanonischer `FinTechCoreOrderIntent`; der zusaetzliche FT-6A-Typ `FinTechCoreBoundOrderIntent` wird nicht fortgefuehrt.

Wesentliche Bindings:

- `bindingState` / `bindingVersion`;
- `runId`, `traceId`, `correlationId`, `assetId`, `decisionVersion`;
- `quantity: FinTechCoreFixedPoint`;
- typed `priceBounds`;
- deterministic `clientOrderId`, `idempotencyKey`, `intentHash`;
- Risk Decision ID/Hash + Policy ID/Version;
- Compliance Decision ID/Hash + Policy ID/Version;
- `createdAt`, `expiresAt`;
- `effectClass=SIDE_EFFECTING`.

`bindApprovedOrderIntent(...)` akzeptiert nur `PAPER` und nur exakt passende, frische, `APPROVED` FT-5 Decisions. Identity-/Hash-/Policy-/Timestamp-/Fixed-Point-Drift wird fail-closed abgelehnt.

Real Execution bleibt hard-blocked:

```text
RESEARCH      -> DENY
PAPER         -> BOUND intent erlaubt, executionHandoffEligible=false
GUARDED_LIVE  -> DENY
PRODUCTION    -> DENY
EMERGENCY     -> DENY
```

## FT-6B Typed Reconciliation

`FinTechCoreReconciliationRecord` fuehrt typed Expected-/Observed-Evidence fuer Quantity, Price Bounds / Execution Price, Fee Evidence, Settlement State, `clientOrderId`, optional `venueOrderId`, `observedAt`, `reconciledAt` und `supervisorEscalationRequired`.

```text
MATCHED        -> Evidence stimmt ueberein
MISMATCH       -> sichtbar, supervisorEscalationRequired=true
NOT_COMPUTABLE -> Observation/Evidence fehlt
PENDING        -> noch nicht entscheidbar
```

PAPER behauptet keine Settlement-Finalitaet: `settlementState=NOT_APPLICABLE`. Es gibt kein Auto-Repair und keine synthetische Balance-Korrektur.

## Supabase FT-6B Persistence

Repository-Migration:

```text
supabase/migrations/20260822011500_fintech_core_ft6b_fixed_point_reconciliation.sql
```

Die Migration erweitert die bestehenden Tabellen additiv und erzeugt:

```text
fintech_core.fixed_point_numeric_v1
public.fintech_core_append_order_intent_v2
public.fintech_core_append_reconciliation_record_v2
```

Die Supabase-Mutation wurde am **2026-08-22** nach Owner-Freigabe auf dem Projekt `AIFINANCIAL` angewendet und als Migration `20260822012200 fintech_core_ft6b_fixed_point_reconciliation` registriert.

Post-Mutation-Verifikation:

- alle drei Funktionen sind `SECURITY INVOKER`;
- `anon` EXECUTE: `false`;
- `authenticated` EXECUTE: `false`;
- `service_role` EXECUTE: `true`;
- keine neue Tabelle, kein neues Schema, keine zweite Queue;
- keine Live-Execution-Capability freigeschaltet.

## Legacy Compatibility

`server/fintechCorePersistence.ts` besitzt weiterhin einen v1-RPC-Pfad fuer `bindingState=UNBOUND`. Dieser Pfad ist **Legacy-/Research-Kompatibilitaet**, nicht die kanonische FT-6B-Persistenz fuer BOUND Intents.

```text
BOUND   -> fintech_core_append_order_intent_v2
UNBOUND -> fintech_core_append_order_intent_v1  (legacy/research only)
```

Eine physische Entfernung des v1-Pfads erfolgt erst nach Consumer-/Replay-/Bestandsdaten-Nachweis und gegebenenfalls separater Owner-Freigabe fuer die Persistence-/Security-Boundary.

## EventMesh

FT-6B, P1 und P1-A fuehren keine spekulativen Event-Namen ein. Solange kein eindeutiger kanonischer Event Catalog bzw. durable Consumer vorliegt, bleiben die vorhandenen typed Evidence-/Reconciliation-Contracts fuehrend.

## Security / Data Integrity

- Missing/Stale/Mismatched Evidence wird nie synthetisch ergaenzt.
- Pattern Evidence bleibt non-authorizing.
- Paper Trading verwendet kein reales Kapital.
- P1 erzeugt nur Allocation Proposal / Portfolio-Risk-Evidence, keine Risk-/Compliance-Approval.
- P1-A erzeugt nur Research-Hard-Gate-Evidence, keine Scoring-/Risk-/Execution-Approval.
- Risk-/Compliance-Approval wird ausschliesslich aus FT-5 Decision Records abgeleitet.
- Intent-/Idempotency-/Client-Order-ID-Kollisionen sind fail-closed.
- Service-role RPCs oeffnen das private Finanzschema nicht fuer Browserrollen.
- `public.outbox_jobs` bleibt einzige Queue-/Lease-Authority.
- Exchange-/Custody-/Wallet-Adapter, reales Settlement und Live-Routing bleiben FT-7+.

### Owner-approved Operating-Mode Hardening

Fuer FT-6 und den P1-Slice gilt weiterhin:

```text
RESEARCH      real=false simulated=false newOrders=false
PAPER         real=false simulated=true  newOrders=true
GUARDED_LIVE  real=false simulated=false newOrders=false
PRODUCTION    real=false simulated=false newOrders=false
EMERGENCY     real=false simulated=false newOrders=false
```

`isOrderIntentEligibleForRealExecution(...)` bleibt fuer jeden Modus `false`. FT-7+ benoetigt eine neue Architektur-/Security-Entscheidung.

## Current-State Closure

```text
FT-0 ... FT-6B = DONE on main
Supersession A+B = DONE on main
Meme/DeFi Research Scoring 0.3.0 = DONE on main / non-executable
P1 Portfolio Allocation + bounded FT-5 risk projection = DONE ON MAIN / MERGED #520
P1-A Honeypot buy/sell transaction-simulation evidence = IN IMPLEMENTATION / research-only
Meme/DeFi productive promotion = BLOCKED
FT-7 = BLOCKED
FT-8 = PLANNED
FT-9 = PLANNED
```

Die verbleibenden Meme-/DeFi-Arbeiten sind Provider-/Evidence-/Validation-/Promotion-Arbeiten innerhalb der bestehenden Architektur, keine neue Architektur oder separater Dispatcher.
