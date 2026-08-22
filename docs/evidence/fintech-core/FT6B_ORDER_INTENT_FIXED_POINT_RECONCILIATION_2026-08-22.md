# FT-6B Evidence — Canonical OrderIntent Fixed Point & Typed Reconciliation

- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Phase:** FT-6 OrderIntent & Reconciliation — Closure Block B
- **Branch:** `feat/fintech-core-ft6-orderintent-reconciliation-2026-08-22`
- **Base Main:** `b180d56a37762c6a558a9b3488ce4f36c70fa2e9`
- **FT-6A predecessor:** PR #481 merged
- **Primary ADR:** ADR-0099
- **Protected ADR:** ADR-0087
- **Owner reference:** `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf` — requirement source only, not runtime authority

## Pre-Check

| Pflichtfeld | Befund |
|---|---|
| Betroffener Bereich | FinTechCore `CoreContracts`, shared financial Fixed Point, OrderIntent Binding, Persistence Port/Server Adapter, Reconciliation, FT-6 tests, roadmap/ADR/architecture docs |
| Repository-Ist-Zustand | FT-6A aus PR #481 ist auf `main@b180d56…`; initialer Binder nutzte `number` für Quantity/Price und einen zusätzlichen `FinTechCoreBoundOrderIntent`; Reconciliation war überwiegend Decision↔Intent-Scaffold |
| Relevante Best Practices | deterministische Fixed-Point-Finanzwerte; immutable approval binding; idempotent replay; exact identity/policy/hash correlation; append-only reconciliation; least privilege; fail-closed missing/stale evidence |
| State-of-the-Art-Features | content-addressed intent integrity; deterministic client/idempotency identity; typed expected/observed reconciliation; explicit mismatch escalation; versioned storage RPC boundary |
| Maßgebliche Quellen | ADR-0087, ADR-0099, FT-3/FT-4/FT-5 Evidence, MiCA, DORA, EU Transfer-of-Funds/Travel Rule, EBA Travel Rule Guidelines, FATF VA/VASP targeted updates, W3C Trace Context / OpenTelemetry as later trace hardening |
| Geeignete Open-Source-Lösungen | keine neue Runtime erforderlich; Kafka/NATS/Temporal/pgmq/Trading-Runtimes würden für FT-6 unnötige Authority-/Supply-Chain-Fläche erzeugen |
| Geeignete vorhandene Plugins | GitHub für Repository-/PR-Korrelation; Google Drive read-only für Owner-Referenz; Supabase nur für eine später separat autorisierte DB-Mutation |
| Zusätzlich sinnvolle Plugins | für FT-6 keine erforderlich |
| Wiederverwendung möglich | FT-4 `atoms:string + scale:number`, FT-5 Decision Records, FT-3 private schema/tables, `FinTechCorePersistencePort`, service-role-only SECURITY INVOKER RPC Pattern, `public.outbox_jobs`, EventMesh/Traceability |
| Wesentliche Risiken/Gaps | binary floating point im FT-6A Intent; zweiter Bound-Intent-Typ; caller-gesteuerte Client-/Idempotency-IDs; Policy-Metadaten nicht vollständig persistiert; Reconciliation ohne typed financial expected/observed fields |
| Quick Wins | Paper Fixed Point als gemeinsamer Core-Vertrag; Bound-Typ entfernen; deterministische Identity ableiten; v2 RPC additiv statt neue Tabelle; Mismatch-Eskalationsflag statt autonomer Reparatur |
| Empfohlener Umsetzungsweg | bestehenden `FinTechCoreOrderIntent` in place härten; FT-4 Fixed Point promoten; FT-5 exact binden; bestehende Tabellen erweitern; PAPER-only belassen; FT-7 separat |

## Main-/PR-Korrelation

Vor Branch-Erstellung wurde `main` erneut geladen und PR #481 als gemergt bestätigt. Neuer Baseline-Commit:

```text
b180d56a37762c6a558a9b3488ce4f36c70fa2e9
```

Offener PR #482 (`Skill Engine`) wurde dateibasiert geprüft. Es besteht kein direkter Datei-Overlap mit diesem FT-6B Scope. Semantisch bleibt #482 read-only Quality Control Plane und darf keine Financial Authority übernehmen.

## Implementierte Änderungen

### 1. Single Fixed-Point Authority

`src/platform/FinTechCore/Financial/FixedPoint.ts` formalisiert die bereits in FT-4 verwendete Representation:

```text
atoms: string
scale: number
```

`PaperFixedPoint` ist nur noch ein Alias auf `FinTechCoreFixedPoint`. Es existiert keine zweite numerische Representation. Exact decimal serialization ist für Legacy-PostgreSQL-`numeric` verfügbar, ohne JavaScript binary floating point einzuführen.

### 2. Single Canonical OrderIntent

`FinTechCoreOrderIntent` wurde in place auf `fintech-core/order-intent/0.2.0` erweitert. Der zusätzliche FT-6A Domain-Typ `FinTechCoreBoundOrderIntent` wird nicht fortgeführt.

Financial fields:

- `quantity: FinTechCoreFixedPoint`
- `priceBounds.limitPrice?`
- `priceBounds.minPrice?`
- `priceBounds.maxPrice?`

Binding fields:

- `bindingState`, `bindingVersion`
- `clientOrderId`, `idempotencyKey`
- Risk Decision ID/Hash + Policy ID/Version
- Compliance Decision ID/Hash + Policy ID/Version
- `createdAt`, `expiresAt`, `intentHash`

### 3. Deterministic Binder

`bindApprovedOrderIntent(...)` akzeptiert nur PAPER und ausschließlich authoritative FT-5 Decisions.

Fail-closed:

- Risk/Compliance fehlt;
- falscher Decision Type;
- Outcome != APPROVED;
- Run/Trace/Correlation/Module/Asset/DecisionVersion Drift;
- Decision Hash fehlt;
- Policy ID/Version fehlt;
- Decision vor Workflow-Start oder nach Intent Creation;
- ungültige Fixed-Point-Werte;
- ungültige Price Bounds;
- ungültige/abgelaufene TTL Relation;
- ungültige Slippage-Bounds.

`clientOrderId`, `idempotencyKey` und `intentHash` werden deterministisch aus immutable Feldern abgeleitet und können nicht durch Agent-/LLM-Approval-Flags ersetzt werden.

### 4. Real Execution Hard Block

FT-6 schaltet weder `GUARDED_LIVE` noch `PRODUCTION` frei. Der Real-Execution-Eligibility-Helper bleibt bis FT-7 hard-blocked und liefert `false`.

### 5. Typed Reconciliation

`FinTechCoreReconciliationRecord` enthält nun typed:

- `clientOrderId`, optional `venueOrderId`;
- expected/observed Quantity;
- expected Price Bounds / observed Execution Price;
- Fee Evidence;
- Settlement State;
- `reconciledAt`;
- `supervisorEscalationRequired`.

Decision Binding Reconciliation revalidiert Decision-/Policy-/Intent-/Idempotency-/Client-Order-Hashes und Expiry.

Paper-Fill Reconciliation erzeugt:

- `MATCHED` bei exact Quantity und erlaubtem Preis + computable Fee Evidence;
- `MISMATCH` bei Drift, ohne Auto-Repair;
- `NOT_COMPUTABLE` bei fehlender Observation/Evidence.

PAPER behauptet keine Settlement-Finalität; `settlementState=NOT_APPLICABLE`.

### 6. Persistence Reuse

Keine neue Tabelle, kein neues Schema, keine zweite Queue.

Bestehend:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
public.outbox_jobs
```

`FinTechCorePersistencePort` besitzt wieder genau einen `appendOrderIntent`-Pfad. Der Serveradapter routet:

- `UNBOUND` Legacy Evidence -> v1 RPC;
- canonical `BOUND` FT-6 -> v2 RPC.

Migration `20260822011500_fintech_core_ft6b_fixed_point_reconciliation.sql` erweitert bestehende Tabellen additiv und definiert service-role-only `SECURITY INVOKER` v2 RPCs.

**Die Migration wurde nicht produktiv angewendet.**

## Security / Least Privilege

- keine Secrets hinzugefügt;
- keine Exchange-/Wallet-/Custody-Imports im FT-6 Domain Layer;
- keine LLM-/Agent-Imports im Approval Path;
- private Tabellen bleiben hinter service-role-only RPCs;
- `anon`/`authenticated` erhalten keine neue Capability;
- `SECURITY INVOKER` bleibt bevorzugt;
- Mismatch erzwingt Evidence/Eskalation, keine autonome Remediation.

## EventMesh-Entscheidung

Vor Einführung der Kandidaten `ORDER_INTENT_CREATED`, `ORDER_INTENT_REJECTED`, `RECONCILIATION_COMPLETED`, `RECONCILIATION_MISMATCH` wurde nach einem kanonischen FT-6 Event Catalog gesucht. Kein eindeutiger kanonischer Name wurde gefunden.

Daher werden in FT-6B **keine spekulativen Event-Namen** eingeführt. Typed durable reconciliation bleibt führend; `supervisorEscalationRequired=true` signalisiert Mismatch. Event-Namen benötigen eine spätere eindeutige Catalog-/Authority-Entscheidung.

## Negative-Test-Abdeckung im Branch

Implementiert bzw. erweitert:

- Risk Decision fehlt;
- Compliance Decision fehlt;
- Risk REJECTED;
- Compliance REVIEW_REQUIRED;
- Run/Trace/Correlation/Asset/Decision-Version mismatch;
- Policy Binding fehlt;
- Decision Time Window invalid;
- Intent expiry;
- invalid Fixed Point;
- JavaScript-number path als Financial Authority abgelehnt;
- live modes blockiert;
- Policy-/Intent-Tampering -> `MISMATCH`;
- Paper Quantity/Price mismatch -> `MISMATCH`;
- unresolved mismatch -> Supervisor-Eskalation;
- private persistence rejection -> fail-closed;
- BOUND persistence ohne vollständige Decision/Policy-Bindung -> reject.

## Offene Validierung

Vor Draft PR wird `main` erneut geladen und der Dateioverlap offener PRs erneut geprüft. Kostenverursachende GitHub Hosted CI wird nicht manuell vor PR-Erstellung gestartet.

Nach Draft PR auszuführen:

- TypeScript/Lint;
- fokussierte Unit Tests;
- Architecture Tests;
- Governance Control Plane / Docs Hygiene;
- Repository Advisory/Security Validation;
- `build-and-test` entsprechend der ermittelten PR-Klasse.

Bis zu tatsächlichen PASS-Ergebnissen wird keine PASS-Aussage für Hosted CI getroffen.

## Production Mutation / Rollback

Aktueller Scope ist Repository-Code/-Dokumentation. Keine Supabase-Migration wurde angewendet.

Falls die FT-6B Migration später autorisiert wird:

1. aktuellen Production-/Main-/Migration-Stand vorab prüfen;
2. Least-Privilege/RLS/Function Grants verifizieren;
3. Migration transaktional anwenden;
4. positive + negative Persistence-Probes durchführen;
5. Testdaten vollständig entfernen;
6. Post-Mutation Privileges/RLS/Schema Drift prüfen;
7. bei Fehlern Migration/RPC-Erweiterung kontrolliert rücksetzen, bevor FT-7 bewertet wird.

## Closure

FT-6B ist code-/dokumentenbasiert implementiert, aber erst nach PR-/CI-Evidence und gegebenenfalls separat autorisierter DB-Verification vollständig geschlossen. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert.
