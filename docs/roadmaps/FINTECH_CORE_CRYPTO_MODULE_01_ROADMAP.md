# CAPITAL-AI FinTech Core Engine — Module 01 Enterprise Crypto Orchestration

**Roadmap-ID:** `FT-CORE-CRYPTO-01`  
**Version:** 1.6.0  
**Status:** IN IMPLEMENTATION — FT-0 bis FT-6A auf `main`; FT-6B Fixed-Point/Persistence/Reconciliation Closure auf Branch  
**Execution Branch:** `feat/fintech-core-ft6-orderintent-reconciliation-2026-08-22`  
**Current Main Baseline:** `main@b180d56a37762c6a558a9b3488ce4f36c70fa2e9`  
**FT-6A Merge:** PR #481  
**Drive Source:** `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf` (`15TtZwH1be6si8mEuo7Xc6inq_e21brfa`) — Owner-Referenz, keine Runtime-Authority  
**Primary Architecture Decision:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087` → `ScoringModelRegistry` → `ScoringDispatcher` → `CanonicalScoreResult`

## 1. Ziel und Authority Boundary

Der FinTech Core komponiert einen reproduzierbaren, auditierbaren Crypto-Finanzworkflow. Er ist weder Trading-Strategie noch produktive Scoring-Engine, Compliance-Policy-Authority, IAM-Authority, Broker/Exchange-Gateway oder Custody-System.

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

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. DeFiLlama bleibt Evidence Acquisition. Missing/stale Evidence wird niemals zu `0`, `PASS` oder synthetischer Verfügbarkeit umgedeutet.

## 2. Nicht verhandelbare Invarianten

1. `ScoringDispatcher` bleibt einzige produktive Scoring-Execution-Authority.
2. Keine zweite Model Registry, Queue, Event-Journal-, Order-Ledger- oder Reconciliation-Architektur.
3. `public.outbox_jobs` bleibt Queue-/Lease-Authority.
4. Privates Schema bleibt `fintech_core`; `anon`/`authenticated` erhalten keine direkte Capability.
5. Financial Quantity/Price/Money verwendet deterministisches Fixed Point `atoms:string + scale:number`.
6. FT-5 Risk-/Compliance-Decisions sind die einzige Approval-Quelle für FT-6.
7. LLM-/Agent-Outputs dürfen keine Risk-/Compliance-Freigabe erzeugen oder überschreiben.
8. `RESEARCH` erzeugt keinen execution-fähigen OrderIntent.
9. `PAPER` bleibt simuliert; reale Kapitalbewegung ist ausgeschlossen.
10. `GUARDED_LIVE` und `PRODUCTION` bleiben bis FT-7 blockiert.
11. Idempotent Replay ist nur bei identischer Identity **und** identischem Payload zulässig.
12. Gleiche Identity mit abweichendem Payload ist ein Collision-/Tamper-Fall und wird abgelehnt.
13. Reconciliation-Mismatch bleibt unresolved Evidence; keine automatische Balance-/Settlement-Korrektur.
14. Event-Namen werden erst nach Abgleich gegen einen kanonischen Event Catalog eingeführt; kein semantisches Duplikat.

## 3. Main-/PR-Korrelation 2026-08-22

PR #481 wurde auf `main` gemergt. Der danach erneut geladene Main-Stand ist:

```text
b180d56a37762c6a558a9b3488ce4f36c70fa2e9
```

Der aktuelle FT-6B-Branch wurde exakt von diesem Commit erzeugt. Offener PR #482 (`Skill Engine`) wurde vor Branch-Erstellung dateibasiert korreliert; dessen Scope besitzt keinen direkten Datei-Overlap mit den FT-6B Domain-/Persistence-/Roadmap-Dateien. Semantisch darf die Skill Engine FinTechCore später nur read-only analysieren und keine Financial Authority übernehmen.

## 4. Phasenstatus

| Phase | Status | Kanonische Evidenz / Ergebnis |
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
| FT-6B OrderIntent & Reconciliation Closure | IMPLEMENTED ON BRANCH | single canonical intent, common Fixed Point, policy binding, deterministic replay IDs, typed reconciliation, v2 persistence |
| FT-7 Guarded Live / Single CEX | BLOCKED | separate explicit architecture/security decision required |
| FT-8 Production Hardening | PLANNED | W3C/OTel, SLO, BCP/DR, chaos/recovery |
| FT-9 DEX/Bridge/Cross-Chain | PLANNED | no implementation in FT-6 |

## 5. FT-4/FT-5 Reuse

FT-4 introduced JSON-safe fixed point:

```text
{ atoms: string, scale: number }
```

FT-6B promotes exactly this representation to the shared `FinTechCoreFixedPoint` contract. `PaperFixedPoint` remains a backward-compatible type alias; there is no second numeric representation.

FT-5 remains the deterministic Approval Authority:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Required decision binding includes exact:

- `runId`, `traceId`, `correlationId`, `moduleId`, `assetId`;
- `decisionVersion`;
- `decisionId` and `outputHash`;
- `policyId` and `policyVersion`;
- `outcome=APPROVED`;
- workflow-time-window validity.

`PENDING`, `REVIEW_REQUIRED`, `NOT_COMPUTABLE`, missing, stale/context-foreign or rejected decisions cannot be promoted.

## 6. FT-6B Canonical OrderIntent

FT-6B extends `FinTechCoreOrderIntent` in place. Der zuvor in FT-6A eingeführte zusätzliche `FinTechCoreBoundOrderIntent` wird nicht als zweite Domain-Authority fortgeführt.

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

### 6.1 Deterministische Integrität

Der Binder leitet `clientOrderId`, `idempotencyKey` und `intentHash` deterministisch aus immutable Workflow-/Order-/Decision-/Policy-Feldern ab.

Semantik:

```text
same orderIntentId + same payload -> identical replay identity
same orderIntentId + changed payload -> different hash/idempotency + persistence collision -> reject
```

Hashing verwendet canonical key ordering. Execution-relevante Financial Values werden vor Hashing normalisiert und nicht als JavaScript `number` autorisiert.

### 6.2 Operating Modes

```text
RESEARCH      -> OrderIntent binding DENY
PAPER         -> canonical BOUND intent allowed, executionHandoffEligible=false
GUARDED_LIVE  -> DENY
PRODUCTION    -> DENY
EMERGENCY     -> DENY
```

Der bestehende Real-Execution-Eligibility-Helper ist für FT-6 hard-blocked und liefert unabhängig vom manuellen Approval-Zustand `false`. Freischaltung ist ausschließlich FT-7+.

## 7. FT-6B Typed Reconciliation

`fintech_core.reconciliation_records` bleibt die einzige Persistence Authority. Domain Contract:

- `orderIntentId`, `clientOrderId`, optional zukünftige `venueOrderId`;
- Run/Trace/Correlation/Asset Identity;
- expected/observed Quantity als Fixed Point;
- expected Price Bounds und observed Execution Price;
- typed Fee Evidence;
- Settlement State;
- `PENDING`, `MATCHED`, `MISMATCH`, `NOT_COMPUTABLE`;
- Evidence Refs, `observedAt`, `reconciledAt`;
- `supervisorEscalationRequired`.

Hard rules:

```text
MISMATCH -> bleibt MISMATCH; supervisorEscalationRequired=true
missing observation/evidence -> NOT_COMPUTABLE
PAPER settlement -> NOT_APPLICABLE
kein Auto-Repair
keine synthetische Balance
keine Settlement-Finalität ohne Evidence
keine Real-Execution-Behauptung
```

`ORDER_INTENT_DECISION_BINDING` revalidiert zusätzlich Decision-/Policy-/Hash-/Idempotency-/Client-Order-/Intent-Hash-Bindings und Expiry.

`ORDER_INTENT_PAPER_FILL` vergleicht FT-4/Paper-Observations mit Quantity und Price Bounds, ohne Real Settlement zu behaupten.

## 8. Persistence

Bestehend und unverändert kanonisch:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
public.outbox_jobs
```

FT-6B fügt **keine Tabelle** hinzu. Die branchgebundene Migration `20260822011500_fintech_core_ft6b_fixed_point_reconciliation.sql` erweitert dieselben Tabellen additiv und führt service-role-only `SECURITY INVOKER` v2-RPCs ein.

Der bestehende v1 OrderIntent-RPC bleibt ausschließlich Legacy-`UNBOUND`-Evidence-kompatibel. Canonical `BOUND` FT-6 nutzt v2 mit JSON-Fixed-Point-Werten; PostgreSQL `numeric` bleibt nur Compatibility Projection, nicht Runtime Financial Authority.

**Produktionsmutation:** nicht ausgeführt. Eine spätere Anwendung benötigt separaten Mutation-Gate-, Least-Privilege-, Rollback- und Post-Verification-Schritt.

## 9. EventMesh / Traceability

FT-6B führt keine neuen Event-Namen auf Verdacht ein. Ein Repository-Abgleich fand keinen eindeutigen kanonischen FT-6 Event Catalog für `ORDER_INTENT_CREATED`/`RECONCILIATION_MISMATCH`. Bis ein solcher Catalog/Authority vorhanden ist, bleibt die durable typed Reconciliation Evidence führend; ein Mismatch trägt `supervisorEscalationRequired=true`.

W3C Trace Context / OpenTelemetry bleiben FT-8-Härtung, sofern sie nicht vorher als bestehende Infrastruktur-Primitive wiederverwendet werden können.

## 10. Regulierung / Best Practices

FT-6 bleibt technische Architektur, keine Rechtsberatung und keine Legal-Policy-Engine. Revalidierte Leitplanken:

- MiCA: Governance, Organisation und belastbare Aufzeichnungen für Crypto-Asset-Services;
- DORA: robuste ICT-/Operational-Resilience- und Kontrollprozesse;
- Transfer-of-Funds/Travel Rule + EBA Guidelines: nachvollziehbare, attributable Compliance-Evidence;
- FATF VA/VASP Updates: fortbestehender Bedarf an Travel-Rule- und VASP-Kontrollreife;
- W3C Trace Context / OpenTelemetry: zukünftige interoperable Trace Propagation.

Es werden keine jurisdiktionsspezifischen Rechtsentscheidungen, globale DQ-Schwellwerte oder providerabhängigen Compliance-PASS-Werte hardcodiert.

## 11. Open Source / Dependency Decision

Für FT-6B wird keine neue Runtime-/Library-Abhängigkeit eingeführt. Die vorhandenen TypeScript-/Node-/PostgreSQL/Supabase-Verträge reichen aus.

Nicht eingeführt:

- Kafka / NATS / Temporal / pgmq;
- neue Policy Runtime;
- neue Trading Runtime;
- CEX-/DEX-/Wallet-/Custody-SDK;
- TA-Lib.

Dies minimiert Supply-Chain-, Operations- und Authority-Surface.

## 12. Validation / Closure Gates

Vor Draft PR:

1. aktuellen `main` erneut laden;
2. offene PRs und Dateioverlap erneut prüfen;
3. Branch `ahead/behind` und Merge-Base verifizieren;
4. Diff/Scope Review;
5. statische Contract-/Architecture-Prüfung;
6. keine kostenverursachende GitHub Hosted CI vor PR-Erstellung manuell starten.

Nach Draft PR:

- TypeScript/Lint;
- fokussierte Unit-/Architecture-Tests;
- Governance Control Plane / Docs Hygiene;
- Repository Advisory/Security Checks;
- finaler `build-and-test` gemäß PR-Klasse.

FT-6 ist erst closure-ready, wenn die Checks tatsächlich PASS sind. FT-7 bleibt davon getrennt und blockiert.

## 13. Nächste Schritte

1. FT-6B Branch validieren und Draft PR erstellen.
2. Hosted CI erst nach PR gemäß Kosten-/Governance-Policy ausführen.
3. Falls die DB-Migration produktiv angewendet werden soll: separater Owner-Mutation-Gate mit Rollback/Post-Verification.
4. Erst nach vollständigem FT-6 Closure: FT-7 Guarded-Live-Architektur als separaten Scope bewerten.
5. Pattern 1h/4h Promotion, Double-Counting Guard und TA-Lib-PoC bleiben separate spätere Arbeitspakete.
