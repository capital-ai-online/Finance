# FT-6B Evidence — Canonical OrderIntent Fixed Point & Typed Reconciliation

- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Phase:** FT-6 OrderIntent & Reconciliation — Closure Block B
- **Branch:** `feat/fintech-core-ft6-orderintent-reconciliation-2026-08-22`
- **Base Main at branch start:** `b180d56a37762c6a558a9b3488ce4f36c70fa2e9`
- **FT-6A predecessor:** PR #481 merged
- **Primary ADR:** ADR-0099
- **Protected ADR:** ADR-0087
- **Supabase project:** `AIFINANCIAL` / `ryzywoktpmyhwzxmstyu`

## Pre-Check

| Pflichtfeld | Befund |
|---|---|
| Betroffener Bereich | FinTechCore Contracts, Fixed Point, OrderIntent Binding, Persistence, Reconciliation, Tests, ADR/Roadmap/README |
| Repository-Ist-Zustand | FT-6A auf `main`; zusaetzlicher Bound-Intent-Typ und `number`-basierte Financial Fields mussten konsolidiert werden |
| Best Practices | deterministic Fixed Point, immutable approval binding, exact identity/policy/hash correlation, idempotent replay, append-only reconciliation, least privilege, fail-closed |
| Wiederverwendung | FT-4 Fixed Point, FT-5 Decision Records, FT-3 private schema/tables, service-role-only `SECURITY INVOKER` RPC Pattern, `public.outbox_jobs` |
| Verbotene Parallelarchitektur | keine zweite Scoring Engine, Model Registry, Queue, Persistence, Order Ledger, Reconciliation-Tabelle oder Execution Runtime |
| Live Scope | `RESEARCH`/`PAPER`; `GUARDED_LIVE` und `PRODUCTION` bleiben FT-7+ blockiert |

## Implementierung

### Single Fixed-Point Authority

`FinTechCoreFixedPoint` ist kanonisch:

```text
atoms: string
scale: number
```

`PaperFixedPoint` ist nur noch Alias. JavaScript Binary Floating Point besitzt keine Financial Authority.

### Single Canonical OrderIntent

`FinTechCoreOrderIntent` wurde in place auf `fintech-core/order-intent/0.2.0` gehaertet. `FinTechCoreBoundOrderIntent` wird nicht als zweite Domain-Authority fortgefuehrt.

Wesentliche Felder:

- `bindingState` / `bindingVersion`;
- deterministic `clientOrderId`, `idempotencyKey`, `intentHash`;
- `quantity: FinTechCoreFixedPoint`;
- typed `priceBounds`;
- Risk/Compliance Decision ID + Hash + Policy ID/Version;
- `createdAt`, `expiresAt`;
- `effectClass=SIDE_EFFECTING`.

### Deterministic Approval Binding

`bindApprovedOrderIntent(...)` akzeptiert nur PAPER und exakt passende `APPROVED` FT-5 Decision Records. Missing, stale, rejected, review-required, policy-fremde, identity-fremde oder zeitlich ungueltige Evidence wird fail-closed abgelehnt.

### Real-Execution Hard Block

```text
RESEARCH      -> DENY
PAPER         -> BOUND intent erlaubt; executionHandoffEligible=false
GUARDED_LIVE  -> DENY
PRODUCTION    -> DENY
EMERGENCY     -> DENY
```

FT-6B erteilt keine reale Handels-, Exchange-, Wallet- oder Custody-Capability.

### Typed Reconciliation

`FinTechCoreReconciliationRecord` fuehrt expected/observed Quantity, Price Bounds/Execution Price, Fee Evidence, Settlement State, `clientOrderId`, optional `venueOrderId`, `reconciledAt` und `supervisorEscalationRequired`.

- `MATCHED`: Evidence stimmt ueberein.
- `MISMATCH`: Drift bleibt sichtbar; keine Auto-Reparatur; Supervisor-Eskalation erforderlich.
- `NOT_COMPUTABLE`: Observation/Evidence fehlt.
- PAPER: `settlementState=NOT_APPLICABLE`.

## Persistence Reuse

Kanonisch bleiben:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
public.outbox_jobs
```

Keine neue Tabelle, kein neues Schema, keine zweite Queue.

Repository-Migration:

```text
supabase/migrations/20260822011500_fintech_core_ft6b_fixed_point_reconciliation.sql
```

Sie erweitert bestehende Tabellen additiv und definiert:

```text
fintech_core.fixed_point_numeric_v1
public.fintech_core_append_order_intent_v2
public.fintech_core_append_reconciliation_record_v2
```

## Owner-autorisierte Supabase-Mutation

Am **2026-08-22** wurde die bereits branchgebundene FT-6B-Migration nach expliziter Owner-Freigabe auf `AIFINANCIAL` angewendet.

Supabase registrierte:

```text
20260822012200 fintech_core_ft6b_fixed_point_reconciliation
```

Der abweichende Zeitstempel gegenueber dem Repository-Dateinamen ist die Remote-Migrationshistorie des ausgefuehrten Supabase-Apply-Vorgangs; Inhalt/Name der FT-6B-Migration bleiben korreliert.

### Post-Mutation Verification

Verifiziert:

- Migration in Remote-History vorhanden;
- `fintech_core.fixed_point_numeric_v1`: `SECURITY INVOKER`;
- `public.fintech_core_append_order_intent_v2`: `SECURITY INVOKER`;
- `public.fintech_core_append_reconciliation_record_v2`: `SECURITY INVOKER`;
- `anon EXECUTE=false` fuer alle drei Funktionen;
- `authenticated EXECUTE=false` fuer alle drei Funktionen;
- `service_role EXECUTE=true` fuer alle drei Funktionen;
- keine Live-Execution-Freischaltung;
- keine zweite Persistence-/Queue-Authority.

Der Security Advisor meldete danach keine neue FT-6B-spezifische Schwachstelle. Vorhandene Advisor-Hinweise zu aelteren `public`-Tabellen bzw. Auth-Leaked-Password-Protection sind nicht durch FT-6B entstanden und werden nicht in diesem Scope veraendert.

## Supabase Best-Practice-Abgleich

Aktuelle Supabase-Dokumentation bestaetigt fuer Database Functions:

- `SECURITY INVOKER` ist der bevorzugte Default;
- Function `EXECUTE` ist standardmaessig breit und muss fuer geschuetzte RPCs explizit revoked werden;
- gezieltes Re-Grant an die benoetigte Rolle entspricht Least Privilege.

Der August-2026-Changelog enthaelt keine Breaking Change, die diese FT-6B-DDL betrifft.

## EventMesh-Entscheidung

FT-6B fuehrt keine spekulativen Event-Namen ein. Ohne eindeutigen kanonischen Event Catalog bleibt durable typed Reconciliation die Evidence Authority; Mismatch wird ueber `supervisorEscalationRequired=true` signalisiert.

## Negative-Test-Abdeckung im Branch

Abgedeckt sind u. a.:

- fehlende Risk-/Compliance Decision;
- REJECTED / REVIEW_REQUIRED;
- Run/Trace/Correlation/Asset/Decision-Version Drift;
- fehlende Policy Binding;
- ungueltige Decision Time Window;
- invalid Fixed Point;
- JavaScript-number path als Financial Authority abgelehnt;
- abgelaufener Intent;
- Policy-/Hash-Tampering -> `MISMATCH`;
- Paper Quantity/Price Drift -> `MISMATCH`;
- unresolved mismatch -> Supervisor-Eskalation;
- private persistence denial;
- BOUND Persistence ohne vollstaendige Decision/Policy-Bindung -> reject;
- Guarded-Live/Production hard block.

## PR-/CI-Gates

Vor Draft/PR:

1. aktuellen `main` erneut laden;
2. offene PRs und Dateioverlap erneut pruefen;
3. Branch ahead/behind und Merge-Base pruefen;
4. Governance-/Dokumenten-Korrelation pruefen.

Kostenverursachende GitHub Hosted CI wird nicht vor PR-Erstellung manuell gestartet.

Nach PR:

- TypeScript/Lint;
- Unit-/Architecture-Tests;
- Governance/Docs Hygiene;
- Security/Advisory Review;
- `build-and-test` gemaess PR-Klasse.

## Closure

FT-6B ist code-, dokumenten- und datenbankseitig implementiert. Vollstaendige Closure setzt noch PR-/CI-Evidence und den finalen Authority-/Correlation-Review voraus. `GUARDED_LIVE` und `PRODUCTION` bleiben blockiert.
