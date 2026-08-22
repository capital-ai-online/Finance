# ADR-0099 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.7.0
- **Date:** 2026-08-22
- **Lifecycle:** accepted
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **FT-6A predecessor:** PR #481 merged
- **FT-6B closure:** PR #483 merged into `main@571de76e4d5f1d33460bf129d2231885dfde9584`
- **Protected authority:** ADR-0087 / Single Scoring Architecture

## Context

CAPITAL-AI besitzt eine produktive Single-Dispatcher-Scoring-Architektur und einen separaten Crypto-Research-Pfad. Der FinTech Core komponiert Finanz-Workflows, ohne eine parallele Scoring-, Evidence-, Governance-, Compliance-Policy-, IAM-, Queue-, Persistence-, Execution- oder Custody-Authority zu schaffen.

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

`CryptoOrchestrator` bleibt Research/Enrichment und `scoreEligible=false`. DeFiLlama bleibt Evidence Acquisition.

## Decision

`src/platform/FinTechCore/` mit `moduleId=fintech-core.crypto` bleibt **financial workflow composition authority**.

Der Core darf besitzen:

- Workflow-Lifecycle, Run-/Trace-/Correlation-Identitaet;
- versionierte Decision-, Domain-Event-, OrderIntent- und Reconciliation-Contracts;
- Operating-Mode-Enforcement;
- deterministische Paper-/Replay-Semantik;
- deterministische Evaluation externer Risk-/Compliance-Policy-Snapshots;
- OrderIntent-Idempotency-/Integrity-Vertraege;
- append-only durable Evidence.

Der Core darf nicht besitzen:

- produktive Score-Berechnung ausserhalb `ScoringModelRegistry`/`ScoringDispatcher`;
- IAM/AuthN/AuthZ-Policy;
- juristische Compliance-Policy-Definition;
- autonome Risk-/Compliance-Freigabe durch LLM/Agenten;
- Exchange Credentials, Wallet Private Keys oder Custody Secrets;
- reale Kapitalbewegung oder autonome Execution in FT-0…FT-6;
- Quality-, Governance-, Supervisor-, Release- oder Deployment-Authority.

## Operating Modes

```text
RESEARCH      -> keine OrderIntent-Bindung fuer Execution
PAPER         -> simulierte OrderIntent-/Fill-/Reconciliation-Evidence
GUARDED_LIVE  -> blockiert
PRODUCTION    -> blockiert
EMERGENCY     -> keine neue Order
```

Der Real-Execution-Eligibility-Helper bleibt fuer FT-6 hard-blocked. Jede Freischaltung ist FT-7+ und benoetigt eine separate Architektur-/Security-Entscheidung.

> Post-Merge-Korrelationshinweis: `FINTECH_CORE_OPERATING_MODE_POLICY` enthaelt derzeit noch eine future-capability Projektion fuer `GUARDED_LIVE`/`PRODUCTION`. Diese Projektion besitzt keine Execution-Authority und wird in der Supersession `FINTECH-VALUE-CHAIN-SUPERSESSION-2026-08-22` als security-relevante, explizit freizugebende fail-closed Code-Normalisierung gefuehrt.

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

Es werden keine zweite Queue, kein zweites Event Journal, kein zweites Order Ledger und keine zweite Reconciliation-Tabelle eingefuehrt.

Private Persistence bleibt service-role-only hinter schmalen `SECURITY INVOKER` RPCs. `anon`/`authenticated` erhalten keine direkte private-schema Capability.

## Canonical Financial Representation

FT-6B hebt die bereits in FT-4 verwendete Representation zum gemeinsamen Vertrag an:

```text
FinTechCoreFixedPoint {
  atoms: string
  scale: number
}
```

`PaperFixedPoint` ist nur Typalias. JavaScript Binary Floating Point darf keine Financial Authority erhalten. PostgreSQL `numeric` bleibt nur Persistence-/Legacy-Projektion.

## FT-5 Approval Authority

FT-5 bleibt einzige Approval-Quelle fuer FT-6:

```text
PRE_TRADE_RISK_GATE
PRE_TRADE_COMPLIANCE_GATE
```

Missing, stale, wrong-authority, rejected oder review-required Evidence wird nie synthetisch zu `APPROVED`.

## FT-6 Single Canonical OrderIntent

FT-6 erweitert `FinTechCoreOrderIntent` in place. `FinTechCoreBoundOrderIntent` wird nicht als zweite Domain-Authority fortgefuehrt.

Contract Version:

```text
fintech-core/order-intent/0.2.0
```

Execution-relevante Bindings umfassen:

- `bindingState` / `bindingVersion`;
- `runId`, `traceId`, `correlationId`, `assetId`, `decisionVersion`;
- `side`, `orderType`;
- `quantity: FinTechCoreFixedPoint`;
- typed `priceBounds`;
- `maxSlippageBps`;
- deterministic `clientOrderId`, `idempotencyKey`, `intentHash`;
- Risk Decision ID/Hash + Policy ID/Version;
- Compliance Decision ID/Hash + Policy ID/Version;
- `createdAt`, `expiresAt`;
- `effectClass=SIDE_EFFECTING`.

`bindingState=BOUND` darf nur durch den deterministischen Binder entstehen.

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

Typed Reconciliation umfasst:

- `orderIntentId`, `clientOrderId`, optional `venueOrderId`;
- expected/observed Quantity;
- expected Price Bounds / observed Execution Price;
- Fee Evidence;
- Settlement State;
- `PENDING`, `MATCHED`, `MISMATCH`, `NOT_COMPUTABLE`;
- Evidence Refs;
- `observedAt`, `reconciledAt`;
- `supervisorEscalationRequired`.

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

Sie erweitert die vorhandenen Tabellen additiv und erzeugt service-role-only `SECURITY INVOKER` Boundaries.

Die Migration wurde am **2026-08-22** nach expliziter Owner-Autorisierung auf dem Supabase-Projekt `AIFINANCIAL` angewendet. Remote registriert:

```text
20260822012200 fintech_core_ft6b_fixed_point_reconciliation
```

Post-Mutation verifiziert:

- `fintech_core.fixed_point_numeric_v1`: `SECURITY INVOKER`;
- `public.fintech_core_append_order_intent_v2`: `SECURITY INVOKER`;
- `public.fintech_core_append_reconciliation_record_v2`: `SECURITY INVOKER`;
- `anon` / `authenticated`: kein EXECUTE;
- `service_role`: EXECUTE;
- keine neue Tabelle, kein neues Schema, keine zweite Queue;
- keine Live-/FT-7-Capability.

## EventMesh / Traceability

FT-6B fuehrt keine Event-Namen auf Verdacht ein. Ohne eindeutigen kanonischen FT-6 Event Catalog bleibt durable typed Reconciliation Evidence fuehrend. W3C Trace Context / OpenTelemetry bleiben spaetere Trace-Haertung.

## Regulatory / Best-Practice Basis

Leitplanken:

- Regulation (EU) 2023/1114 MiCA;
- Regulation (EU) 2022/2554 DORA;
- Regulation (EU) 2023/1113 Transfer of Funds / Crypto Travel Rule;
- EBA Travel Rule Guidelines;
- FATF VA/VASP Targeted Updates;
- W3C Trace Context / OpenTelemetry.

Diese Quellen begruenden Governance, Nachvollziehbarkeit und robuste Kontrollen, aber keine hardcodierte Legal Applicability oder Provider-PASS-Werte.

## Dependency Decision

Keine neue Runtime-/Library-Abhaengigkeit fuer FT-6B. Nicht integriert werden Kafka, NATS, Temporal, pgmq, neue Trading-/Policy-Runtimes, CEX-/DEX-/Wallet-/Custody-SDKs oder TA-Lib.

## Consequences

Positiv:

- eine Scoring-, eine Financial-Value-, eine OrderIntent- und eine Persistence-Authority;
- deterministische Approval-/Replay-Identitaet;
- exakte Policy-/Decision-Traceability;
- typed Reconciliation ohne autonomes Repair;
- Least-Privilege-Supabase-Boundary;
- FT-7 bleibt klar getrennt.

Trade-offs:

- Legacy `numeric`-Felder und der v1-`UNBOUND`-Write bleiben vorerst Compatibility Projection;
- FT-6B schliesst keine reale Execution an;
- Event-Namen und Live-Settlement bleiben spaeteren expliziten Decisions vorbehalten.

## Post-Merge Closure

PR #483 ist Human-gemergt. FT-6B ist damit auf `main` abgeschlossen. Die nachgelagerte Supersession A normalisiert ausschliesslich Lifecycle-/Current-State-Projektionen und identifiziert verbleibende Legacy-/Security-Korrelationen.

Naechster produktiver Architekturabschnitt bleibt **FT-7 Guarded Live** und ist weiterhin blockiert, bis eine separate Architektur-/Security-Entscheidung einschliesslich Owner-Gate vorliegt.

Meme-Coin-/DeFi-Modellsemantik wird nicht in dieser Authority-Normalisierung veraendert; sie wird in einer separaten Supersession B gegen den dann aktuellen `main` neu modelliert.
