# CAPITAL-AI FinTech Core

Der `FinTechCore` ist die versionierte finanzielle Workflow-Composition-Schicht von CAPITAL-AI. Er komponiert Research-, Paper-, Risk-/Compliance- und spaeter separat autorisierte Execution-Gates. Er besitzt keine produktive Scoring-, IAM-, Compliance-Policy-, Deployment-, Exchange- oder Custody-Authority.

## Aktueller Implementierungsstand

- Roadmap: `FT-CORE-CRYPTO-01`
- Architekturentscheidung: `ADR-0099` (`accepted`)
- Protected Scoring Authority: `ADR-0087`
- erstes Modul: `fintech-core.crypto`
- FT-1: Core Engine, Module Registry, deterministic Workflow State Machine
- FT-2A: provenance-aware Primary-/Secondary-Analyseprofile
- FT-2B: kategoriespezifische Feature-/Evidence-Contracts
- FT-2C: detector-agnostische Pattern Detection Contracts und Research Resolver
- FT-3: private durable Workflow-/Event-/Decision-/OrderIntent-/Reconciliation-Persistenz
- FT-4: deterministic, replay-faehiges Paper Trading
- FT-5: deterministic Pre-Trade Risk + Compliance Decisions
- FT-6A: Decision-/Hash-Binding Foundation, gemergt mit PR #481
- FT-6B: single canonical OrderIntent, gemeinsames Fixed Point, deterministic Approval Binding, typed Reconciliation und v2 Persistence Boundary, gemergt mit PR #483
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

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. Der FinTech Core ersetzt keine Scoring-, IAM-, Compliance-Policy-, Quality-, Release-, Deployment- oder Supervisor-Authority.

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

## FT-5 Deterministic Risk + Compliance

FT-5 bleibt die einzige Approval-Quelle fuer FT-6.

Kanonische Decision Types:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Risk-/Compliance-Entscheidungen sind versioniert, policy-gebunden und provenance-faehig. LLM-/Agent-Ausgaben koennen diese Freigaben weder erzeugen noch ueberschreiben.

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

`FinTechCoreReconciliationRecord` fuehrt typed Expected-/Observed-Evidence fuer:

- Quantity;
- Price Bounds / Execution Price;
- Fee Evidence;
- Settlement State;
- `clientOrderId` und optional `venueOrderId`;
- `observedAt` / `reconciledAt`;
- `supervisorEscalationRequired`.

Semantik:

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

Die Supabase-Mutation wurde am **2026-08-22** nach Owner-Freigabe auf dem Projekt `AIFINANCIAL` angewendet und in Supabase als Migration
`20260822012200_fintech_core_ft6b_fixed_point_reconciliation` registriert.

Post-Mutation-Verifikation:

- alle drei Funktionen sind `SECURITY INVOKER`;
- `anon` EXECUTE: `false`;
- `authenticated` EXECUTE: `false`;
- `service_role` EXECUTE: `true`;
- keine neue Tabelle, kein neues Schema, keine zweite Queue;
- keine Live-Execution-Capability freigeschaltet.

Der Security Advisor meldete nach der Mutation keine FT-6B-spezifische neue Schwachstelle. Bereits bestehende Advisor-Hinweise ausserhalb des FT-6B-Scopes bleiben separat zu behandeln.

## Legacy Compatibility

`server/fintechCorePersistence.ts` besitzt weiterhin einen v1-RPC-Pfad fuer `bindingState=UNBOUND`. Dieser Pfad ist **Legacy-/Research-Kompatibilitaet**, nicht die kanonische FT-6B-Persistenz fuer BOUND Intents.

Kanonisch:

```text
BOUND -> fintech_core_append_order_intent_v2
```

Legacy:

```text
UNBOUND -> fintech_core_append_order_intent_v1
```

Eine physische Entfernung des v1-Pfads erfolgt erst nach Consumer-/Replay-/Bestandsdaten-Nachweis und gegebenenfalls separater Owner-Freigabe fuer die Persistence-/Security-Boundary.

## EventMesh

FT-6B fuehrt keine spekulativen Event-Namen ein. Solange kein eindeutiger kanonischer FT-6 Event Catalog vorliegt, bleibt typed durable Reconciliation Evidence fuehrend. Ein Mismatch wird ueber `supervisorEscalationRequired=true` sichtbar gemacht.

## Security / Data Integrity

- Missing/Stale/Mismatched Evidence wird nie synthetisch ergaenzt.
- Pattern Evidence bleibt nicht-authorizing.
- Paper Trading verwendet kein reales Kapital.
- Risk-/Compliance-Approval wird ausschliesslich aus FT-5 Decision Records abgeleitet.
- Intent-/Idempotency-/Client-Order-ID-Kollisionen sind fail-closed.
- Service-role RPCs oeffnen das private Finanzschema nicht fuer Browserrollen.
- `public.outbox_jobs` bleibt einzige Queue-/Lease-Authority.
- Exchange-/Custody-/Wallet-Adapter, reales Settlement und Live-Routing bleiben FT-7+.

### Offener korrelierter Security-Befund

Die Supersession `FINTECH-VALUE-CHAIN-SUPERSESSION-2026-08-22` hat eine stale future-capability Projektion in `FINTECH_CORE_OPERATING_MODE_POLICY` identifiziert. Der effektive FT-6B-Helper blockiert reale Execution bereits fail-closed. Eine Code-Normalisierung der Policy wird wegen der Security-/Execution-Relevanz erst nach expliziter Owner-Freigabe vorbereitet.

## Current-State Closure

FT-6B ist mit PR #483 auf `main` gemergt. Fruehere Angaben wie „PR pending“, „Branch implementiert“ oder „vor Merge erforderlich“ sind fuer den aktuellen Zustand superseded.

Aktuell gilt:

```text
FT-0 ... FT-6B = DONE on main
FT-7 = BLOCKED
FT-8 = PLANNED
FT-9 = PLANNED
```

Die separate Meme-Coin-/DeFi-Modell-Supersession beginnt erst nach Abschluss dieser Authority-/Legacy-Bereinigung gegen den dann aktuellen `main`.
