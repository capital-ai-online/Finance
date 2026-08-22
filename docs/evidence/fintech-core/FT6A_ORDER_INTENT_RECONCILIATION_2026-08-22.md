# FT-6A — OrderIntent Decision Binding & Reconciliation

**Roadmap:** `FT-CORE-CRYPTO-01`  
**ADR:** `ADR-0099`  
**Protected Scoring Authority:** `ADR-0087` / `ScoringModelRegistry` / `ScoringDispatcher`  
**Baseline:** `main@d04270726c56c89cb2b8cab25570662c5d4480f4`  
**Execution Branch:** `feature/crypto-orchestrator-finalization-ft6-2026-08-22`  
**Status:** IMPLEMENTED ON BRANCH — production migration not applied  
**Source input:** Google Drive — `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf`, file ID `15TtZwH1be6si8mEuo7Xc6inq_e21brfa`

## 1. Ziel

FT-6A schliesst die deterministische Kontrollkette zwischen FT-5 Risk-/Compliance-Decisions und dem bereits in FT-3 vorgesehenen `OrderIntent`-Persistenzmodell. Der Block erzeugt **keine** Exchange-, Custody-, Wallet-, Settlement- oder Live-Execution-Capability.

Kanonische Kette:

```text
FT-5 PRE_TRADE_RISK_GATE
  + FT-5 PRE_TRADE_COMPLIANCE_GATE
  + runId / traceId / correlationId / assetId / decisionVersion
  + Decision Output Hashes
       ↓
FT-6A deterministic OrderIntent binding
       ↓
immutable intentHash + idempotencyKey + clientOrderId + TTL/Bounds
       ↓
append-only private persistence
       ↓
Decision ↔ OrderIntent reconciliation
```

`executionHandoffEligible` bleibt im implementierten Domain Contract `false`. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert.

## 2. Abgleich mit der Drive-Quelle

Die externe Vorlage beschreibt den Orchestrator als kontrollierende Instanz und nicht als Trading-Strategie. Die folgenden Anforderungen werden auf bestehende CAPITAL-AI-Authorities abgebildet, statt neue Parallelarchitekturen einzufuehren:

| Drive-Anforderung | CAPITAL-AI Umsetzung |
|---|---|
| Workflow-Identitaet mit `runId`, `traceId`, `strategyId`, `portfolioId`, `decisionVersion` | bereits `FinTechCoreWorkflowContext`; FT-6 bindet dieselbe Identitaet erneut an Decision Records und OrderIntent |
| deterministische Risk-/Compliance-Freigabe vor Execution | FT-5 `PRE_TRADE_RISK_GATE` und `PRE_TRADE_COMPLIANCE_GATE`; FT-6 akzeptiert nur `APPROVED` aus append-only Decision Records |
| kontrollierter OrderIntent | FT-6 `FinTechCoreBoundOrderIntent`: Quantity, Type, Limit Price, Slippage, TTL, Idempotency, Client-Order-ID |
| Traceability / Reconciliation | `FinTechCoreReconciliationRecord` plus append-only `fintech_core.reconciliation_records` |
| KI darf analysieren, aber keine numerische/operative Freigabe erteilen | bestehende Agent-Research-Grenze bleibt; FT-6 importiert keine Agent-/LLM-Runtime |
| Datenqualitaet muss vor Entscheidungen beruecksichtigt werden | vorhandener `MarketEvidenceQualityRecord` und FT-5 Freshness-/Authority-Gates bleiben fuehrend |

### DQ-0.80 aus der Vorlage

Der in der Drive-Vorlage genannte beispielhafte Schwellenwert `DQ < 0.80` wird **nicht** als neue harte Repository-Policy uebernommen. CAPITAL-AI besitzt bereits explizite Evidence-Quality- und versionierte Risk-Policy-Vertraege. Ein universeller numerischer DQ-Schwellenwert ohne domänenspezifische Authority wuerde diese bestehende Architektur duplizieren bzw. ueberlagern.

Daher gilt weiterhin:

- Evidence Status/Freshness/Provenance aus `src/platform/MarketData/evidenceQualityContracts.ts`;
- konkrete Risk-Grenzen aus versionierten `FinTechCoreRiskPolicySnapshot`s;
- fehlende/stale/conflicting Evidence wird fail-closed und nicht zu `0`, `PASS` oder einem Score umgedeutet.

## 3. Code-Implementierung

### 3.1 `OrderIntent/OrderIntentBinding.ts`

Neu implementiert:

- `FinTechCoreBoundOrderIntent`;
- `bindApprovedOrderIntent(...)`;
- deterministische Bindung von Risk-/Compliance-Decision-ID und `outputHash`;
- Approvals werden aus Decision Records **abgeleitet**, nicht vom Aufrufer gesetzt;
- exakter Context-Abgleich fuer `runId`, `traceId`, `correlationId`, `moduleId`, `assetId`, `decisionVersion`;
- `clientOrderId` + `idempotencyKey`;
- `quantity > 0`;
- `maxSlippageBps` im Bereich `0..10000`;
- positiver Limit Price wenn vorhanden; `LIMIT`/`POST_ONLY` benoetigen Limit Price;
- `expiresAt > createdAt`;
- Intent darf nicht vor den referenzierten Decisions entstehen;
- SHA-256 `intentHash` bindet Workflow-, Order-, Policy-, Decision- und Evidence-Identitaet;
- `PAPER` ist der einzige zulaessige Operating Mode in FT-6A;
- `executionHandoffEligible=false`.

### 3.2 `Reconciliation/ReconciliationContracts.ts`

Neu implementiert:

- `FinTechCoreReconciliationRecord`;
- `ORDER_INTENT_DECISION_BINDING`;
- `ORDER_INTENT_PAPER_FILL` als reservierter typed Folgepfad;
- Status `MATCHED`, `MISMATCH`, `PENDING`, `NOT_COMPUTABLE`;
- Replay-Pruefung Decision Type, Outcome, Context, IDs und Output Hashes;
- Reconciliation Input-/Output-Hashes;
- explizit `settlementFinalityAsserted=false`;
- explizit `realExecutionAsserted=false`.

### 3.3 Persistenz-Port und Server-Adapter

`FinTechCorePersistencePort` wurde erweitert um:

```text
appendBoundOrderIntent(...)
appendReconciliationRecord(...)
```

`server/fintechCorePersistence.ts` mappt diese auf zwei neue service-role-only RPC-Vertraege. Die Domain-Schicht importiert weiterhin keinen konkreten Datenbankclient.

## 4. Datenbank-Haertung — Branch only

Migration:

`supabase/migrations/20260822002500_fintech_core_ft6_order_intent_reconciliation.sql`

Die Migration ist **nicht produktiv ausgefuehrt**.

Sie erweitert die vorhandene FT-3-Tabelle `fintech_core.order_intents` um nullable/legacy-kompatible Binding-Felder:

- `binding_version`;
- `client_order_id`;
- `risk_decision_id`;
- `risk_decision_output_hash`;
- `compliance_decision_id`;
- `compliance_decision_output_hash`.

Defense-in-Depth:

- partielle Unique-Constraint fuer `client_order_id`;
- Foreign Keys auf append-only `decision_records`;
- service-role-only `SECURITY INVOKER` RPC;
- Workflow muss `PAPER` sein;
- Risk-/Compliance-Decisions muessen existieren, `APPROVED`, hash-identisch und context-identisch sein;
- Decision Time darf nicht nach Intent Creation liegen;
- Collision-Verhalten fuer Intent-ID, Idempotency-Key und Client-Order-ID ist fail-closed;
- Reconciliation referenziert vorhandenen OrderIntent und validiert Run/Trace/Correlation/Asset-Identitaet;
- keine neue Queue; `public.outbox_jobs` bleibt Queue-/Lease-Authority;
- kein Browser-/`anon`-/`authenticated`-Zugriff auf das private Finanzschema.

## 5. Tests

Neu:

- `tests/unit/fintechCoreOrderIntentBinding.test.ts`
  - Approval-Ableitung;
  - Hash-Bindung;
  - deterministischer/content-sensitiver Intent Hash;
  - Context Drift;
  - non-approved Decision;
  - Live-Mode-Deny;
  - TTL/Limit/Slippage Negative Tests;
  - Reconciliation MATCHED / Tamper MISMATCH.

- `tests/unit/fintechCoreFt6Persistence.test.ts`
  - dedizierte FT-6 RPC-Bindung;
  - Decision Hash-/Client-Order-ID-Persistenz;
  - typed Reconciliation;
  - DB-Fehler bleibt fail-closed.

- `tests/architecture/fintechCoreFt6AuthorityBoundary.test.ts`
  - keine direkte Agent-/Provider-/Exchange-/Custody-/ScoringDispatcher-/Supabase-Abkuerzung im FT-6 Domain Layer;
  - PAPER-only;
  - keine Execution-/Settlement-Behauptung.

## 6. Authority- und Korrelationspruefung

FT-6A fuehrt **keine** neue Authority ein.

| Bereich | Fuehrende Authority |
|---|---|
| Asset Identity | UAI / Scoring Contracts |
| produktives Scoring | ADR-0087 → `ScoringModelRegistry` → `ScoringDispatcher` |
| Evidence Quality | MarketData Evidence/DQ Contracts |
| Risk/Compliance Decision | FT-5 versionierte Policy-Snapshots + deterministic gates |
| Workflow Composition | ADR-0099 / FinTechCore |
| durable private Evidence | bestehendes `fintech_core` Schema |
| Queue/Lease | `public.outbox_jobs` |
| Agent-/AI-Research | nicht autorisierende Research-Grenze |
| reale Execution | **nicht implementiert / blockiert** |

DeFiLlama aus dem konsolidierten Vorgängerstand bleibt ein read-only Evidence Provider. Die neuen FT-6-Vertraege importieren oder referenzieren DeFiLlama nicht direkt; dadurch entsteht keine Provider→OrderIntent-Abkuerzung.

## 7. Security / Failure Semantics

Fail-closed bei:

- nicht `APPROVED` Risk/Compliance;
- falschem Decision Type;
- Run-/Trace-/Correlation-/Asset-/DecisionVersion-Drift;
- fehlendem oder abweichendem Decision Output Hash;
- ungueltiger Quantity/Price/Slippage/TTL;
- Non-PAPER Operating Mode;
- Intent-/Idempotency-/Client-Order-ID Collision;
- Persistenzfehler;
- Reconciliation-Mismatch.

Ein `MISMATCH` wird als Evidence erhalten und niemals automatisch zu `MATCHED` oder Execution Eligibility promoviert.

## 8. Rollback

Code-/Dokumentenrollback: normaler Git-Revert des spaeteren Merge-Commits.

Da die FT-6-Migration in diesem Arbeitsschritt **nicht** auf Supabase angewendet wurde, existiert kein produktiver Datenbank-Rollback. Eine spaetere Anwendung der Migration benoetigt weiterhin die separate geschuetzte Supabase-Mutationsfreigabe und anschliessende Production Verification.

## 9. Restarbeiten zur Crypto-Orchestrator-Finalisierung

FT-6A ist der erste Finalisierungsblock. Vor Abschluss von Crypto Module 01 bleiben mindestens:

1. kombinierte Hosted CI/Governance-Pruefung des finalen Branch-Snapshots;
2. separate autorisierte Anwendung + Verification der FT-6 SQL-Migration;
3. `ORDER_INTENT_PAPER_FILL` Reconciliation gegen den bestehenden Paper-Replay-Vertrag;
4. Crash-/Duplicate-/Replay-Test der DB-seitigen FT-6-RPCs;
5. finaler 24-Asset Crypto Universe Availability-/Evidence-Admittance-Nachweis auf der bestehenden SC-2/Universe-SLA-Kette;
6. DeFiLlama nur dort als Evidence promoten, wo der bestehende Feature-/Scoring-Contract dies explizit zulaesst;
7. Guarded Live bleibt ein spaeteres, separat autorisiertes FT-7-Gate.

Damit kann der Crypto-Orchestrator nach FT-6 auf derselben UAI-/Evidence-/Registry-/Dispatcher-/Universe-SLA-Baseline finalisiert werden, ohne eine zweite Scoring- oder Execution-Architektur zu erzeugen.
