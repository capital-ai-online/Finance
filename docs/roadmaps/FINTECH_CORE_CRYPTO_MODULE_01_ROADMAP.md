# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.8.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-6B auf `main`; FT-7 weiterhin blockiert  
**Current baseline:** `main@571de76e4d5f1d33460bf129d2231885dfde9584`  
**FT-6A Merge:** PR #481  
**FT-6B Merge:** PR #483  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087`

## 1. Authority Boundary

Der FinTech Core ist `financial_workflow_composition_authority`. Er ist keine Trading-Strategie, keine produktive Scoring Engine, keine Compliance-Policy-Authority, keine IAM-Authority, kein Exchange-/Broker-Gateway und kein Custody-System.

Kanonische Scoring-Kette:

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

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. DeFiLlama bleibt Evidence Acquisition. Missing/Stale Evidence wird niemals zu `0`, `PASS` oder synthetischer Verfuegbarkeit umgedeutet.

## 2. Nicht verhandelbare Invarianten

1. `ScoringDispatcher` bleibt einzige produktive Scoring-Execution-Authority.
2. Keine zweite Model Registry, Queue, Event-Journal-, Order-Ledger-, Reconciliation- oder Persistence-Architektur.
3. `public.outbox_jobs` bleibt Queue-/Lease-Authority.
4. Privates Schema bleibt `fintech_core`.
5. `anon`/`authenticated` erhalten keine direkte Finance-Capability.
6. Financial Quantity/Price/Money verwendet `atoms:string + scale:number`.
7. FT-5 Risk-/Compliance-Decisions sind die einzige Approval-Quelle fuer FT-6.
8. LLM-/Agent-Outputs duerfen keine Freigabe erzeugen oder ueberschreiben.
9. `RESEARCH` erzeugt keinen execution-faehigen OrderIntent.
10. `PAPER` bleibt simuliert; reale Kapitalbewegung ist ausgeschlossen.
11. `GUARDED_LIVE` und `PRODUCTION` bleiben bis FT-7 blockiert.
12. Idempotent Replay ist nur bei identischer Identity und identischem Payload zulaessig.
13. Gleiche Identity mit abweichendem Payload ist Collision/Tamper und wird abgelehnt.
14. Reconciliation-Mismatch bleibt unresolved Evidence; keine automatische Korrektur.
15. Event-Namen werden nur aus einem kanonischen Event Catalog uebernommen.

## 3. Phasenstatus

| Phase | Status | Ergebnis |
|---|---|---|
| FT-0 Contract/Governance Foundation | DONE | Contracts + ADR-0099 |
| FT-1 Core Engine Foundation | DONE | Engine/Module Registry/Workflow State |
| FT-2A Category Profile Resolution | DONE | Crypto Category Profiles |
| FT-2B Category Feature Contracts | DONE | Typed category evidence |
| FT-2C Pattern Research Foundation | DONE | Research-only pattern contracts |
| FT-3 Durable Workflow & Traceability | DONE | private schema + append-only persistence |
| FT-4 Research & Paper Trading | DONE | deterministic Fixed Point + replay |
| FT-5 Deterministic Risk + Compliance | DONE | versioned policy/evidence decisions |
| FT-6A Decision Binding Foundation | DONE / MERGED #481 | initial decision/hash-bound PAPER intent + reconciliation scaffold |
| FT-6B OrderIntent & Reconciliation Closure | DONE / MERGED #483 | single canonical intent, shared Fixed Point, exact policy binding, deterministic replay IDs, typed reconciliation, v2 persistence |
| FT-7 Guarded Live / Single CEX | BLOCKED | separate explicit architecture/security decision required |
| FT-8 Production Hardening | PLANNED | trace, SLO, BCP/DR, chaos/recovery |
| FT-9 DEX/Bridge/Cross-Chain | PLANNED | no implementation in FT-6 |

## 4. FT-6B Canonical OrderIntent

`FinTechCoreOrderIntent` ist die einzige Domain-Authority. `FinTechCoreBoundOrderIntent` wird nicht fortgefuehrt.

Canonical fields include:

```text
orderIntentId
orderIntentContractVersion
bindingState / bindingVersion
runId / traceId / correlationId
assetId
strategyId? / portfolioId?
decisionVersion
side / orderType
quantity: FinTechCoreFixedPoint
priceBounds: limitPrice? / minPrice? / maxPrice?
maxSlippageBps
clientOrderId
idempotencyKey
riskDecisionId / riskDecisionHash / riskPolicyId / riskPolicyVersion
complianceDecisionId / complianceDecisionHash / compliancePolicyId / compliancePolicyVersion
createdAt / expiresAt
intentHash
effectClass=SIDE_EFFECTING
```

`clientOrderId`, `idempotencyKey` und `intentHash` werden deterministisch aus immutable Feldern abgeleitet. Financial Values werden vor Hashing normalisiert und nicht als JavaScript `number` autorisiert.

## 5. Operating Modes

```text
RESEARCH      -> OrderIntent Binding DENY
PAPER         -> canonical BOUND intent erlaubt, executionHandoffEligible=false
GUARDED_LIVE  -> DENY
PRODUCTION    -> DENY
EMERGENCY     -> DENY
```

Der Real-Execution-Eligibility-Helper bleibt fuer FT-6 hard-blocked.

Die Supersession `FINTECH-VALUE-CHAIN-SUPERSESSION-2026-08-22` hat eine verbleibende Code-Projektion identifiziert, in der `FINTECH_CORE_OPERATING_MODE_POLICY` zukuenftige Live-Capabilities noch als erlaubt markiert. Diese Projektion besitzt keine Execution-Authority; ihre fail-closed Normalisierung ist security-relevant und bleibt bis zur expliziten Owner-Freigabe unmutiert.

## 6. Typed Reconciliation

`fintech_core.reconciliation_records` bleibt einzige Persistence Authority.

Hard rules:

```text
MISMATCH -> supervisorEscalationRequired=true
missing observation/evidence -> NOT_COMPUTABLE
PAPER settlement -> NOT_APPLICABLE
kein Auto-Repair
keine synthetische Balance
keine Settlement-Finalitaet ohne Evidence
keine Real-Execution-Behauptung
```

`ORDER_INTENT_DECISION_BINDING` revalidiert Decision-/Policy-/Hash-/Idempotency-/Client-Order-/Intent-Hash-/Expiry-Bindings.

`ORDER_INTENT_PAPER_FILL` vergleicht simulierte Quantity/Price/Fee Evidence gegen den genehmigten Intent.

## 7. Persistence

Kanonisch bleiben:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
public.outbox_jobs
```

FT-6B fuegt keine Tabelle, kein neues Schema und keine zweite Queue hinzu.

Repository-Migration:

```text
supabase/migrations/20260822011500_fintech_core_ft6b_fixed_point_reconciliation.sql
```

Remote angewendet am 2026-08-22 auf `AIFINANCIAL`; Supabase-Migrationshistorie:

```text
20260822012200 fintech_core_ft6b_fixed_point_reconciliation
```

Post-Mutation verifiziert:

- `fintech_core.fixed_point_numeric_v1` = `SECURITY INVOKER`;
- `public.fintech_core_append_order_intent_v2` = `SECURITY INVOKER`;
- `public.fintech_core_append_reconciliation_record_v2` = `SECURITY INVOKER`;
- `anon`/`authenticated`: kein EXECUTE;
- `service_role`: EXECUTE;
- keine FT-7-/Live-Capability freigeschaltet.

Der bestehende v1 OrderIntent-RPC bleibt ausschliesslich Legacy-/Research-`UNBOUND`-Kompatibilitaet. Canonical `BOUND` FT-6B nutzt v2. Die physische v1-Entfernung ist ein separates Cleanup-Gate mit Consumer-/Replay-/Bestandsdaten-Nachweis.

## 8. EventMesh / Traceability

FT-6B fuehrt keine Event-Namen auf Verdacht ein. Bis ein kanonischer FT-6 Event Catalog vorhanden ist, bleibt durable typed Reconciliation Evidence fuehrend.

## 9. Regulatory / Best-Practice Basis

Leitplanken:

- MiCA — Governance/Organisation/Record Keeping;
- DORA — ICT/Operational Resilience;
- EU Transfer-of-Funds / Crypto Travel Rule;
- EBA Travel Rule Guidelines;
- FATF VA/VASP Targeted Updates;
- W3C Trace Context / OpenTelemetry fuer spaetere Traceability.

Der Core hardcodiert daraus keine jurisdictionsspezifische Legal Applicability, keine globale DQ-Schwelle und keinen Provider-PASS.

## 10. Dependency Decision

Keine neue Runtime-/Library-Abhaengigkeit fuer FT-6B.

Nicht eingefuehrt:

- Kafka / NATS / Temporal / pgmq;
- neue Policy Runtime;
- neue Trading Runtime;
- CEX-/DEX-/Wallet-/Custody-SDK;
- TA-Lib.

## 11. Post-Merge Supersession / Current State

Nach Merge von PR #483 gelten die frueheren FT-6B-Branch-/PR-Pending-Angaben als superseded Projektionen. Der aktuelle Status ist:

```text
FT-0 ... FT-6B = DONE on main
FT-7 = BLOCKED
FT-8 = PLANNED
FT-9 = PLANNED
```

Historische FT-6A-/FT-6B-Evidence bleibt erhalten und nicht-authorizing.

## 12. Naechste Schritte

1. Supersession A abschliessen: Authority-/Roadmap-/README-/Manifest-Korrelationen beseitigen.
2. Security-relevante Operating-Mode-Codeprojektion nur nach expliziter Owner-Freigabe fail-closed normalisieren und regressionssichern.
3. Legacy v1 `UNBOUND`-Persistence-Consumer/Replay/Bestandsdaten inventarisieren; erst danach Removal bewerten.
4. Separate Supersession B fuer Meme Coin und DeFi gegen den dann aktuellen `main` starten.
5. FT-7 Guarded Live weiterhin separat und human-gated bewerten.
