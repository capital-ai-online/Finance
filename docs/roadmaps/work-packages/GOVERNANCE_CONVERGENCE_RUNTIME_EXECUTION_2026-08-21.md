# Governance Convergence & Runtime Execution — 2026-08-21

**Work Package ID:** `WP-GOV-RUNTIME-CONVERGENCE-2026-08-21`  
**Status:** IMPLEMENTED IN STACKED DRAFT PR #474 / VALIDATION & EXTERNAL PRODUCTION GATES OPEN  
**Branch:** `agent/governance-convergence-runtime-execution-2026-08-21`  
**Upstream PR:** `#471` (`agent/hosted-validation-cost-s0-s3-2026-08-21`)  
**Parallel Scoring PR:** `#475` (`feature/fintech-orchestrator-p0-multiclass-integrity`)  
**Current main at continuation check:** `6c90c04de8924b8783f23ab4789afa810e9ea3a8`  
**Primary authorities:** ADR-0096, ADR-0037, ADR-0044, ADR-0054, ADR-0059, ADR-0018, ADR-0087, AGENTS.md  
**Non-scope:** M10 reactivation, Render/Supabase/Stripe production mutation, new scoring authority, new Vocabulary/Transparency authority

## 1. Ziel

Dieses Paket konsolidiert offene Governance- und Runtime-Gaps in **einer** Wertschöpfungskette. Es erzeugt weder eine zweite Governance Control Plane noch eine zweite Durable-Worker-/Retry-Architektur.

```text
AGENTS.md / ADR-0096 Governance Control Plane
        |
        +--> ADR-0087 Scoring Authority
        |        UAI -> Evidence -> Model Registry -> ScoringDispatcher
        |
        +--> ADR-0054 Durable Background Job Authority
        |        public.outbox_jobs
        |          -> server/outbox.ts
        |          -> server/outboxWorker.ts
        |          -> bounded drain seam
        |                 |
        |                 +--> current in-process polling host
        |                 +--> future external execution host (optional)
        |
        +--> Operational System Event Journal
        |          X  keine Security-/Agent-Audit-Authority
        |
        +--> ADR-0059 Agent Audit / OTEL
        |
        +--> SupervisorDashboard
                   read-only / observed-only projection
```

## 2. Aktueller Main-/PR-Korrelationscheck

Am Fortsetzungspunkt wurde der Zustand erneut geprüft:

- `main = 6c90c04de8924b8783f23ab4789afa810e9ea3a8`;
- PR #471: offen, Draft, mergefähig, Head `b8a78220c671df8cb3c35dfc5ba719b972e6ce69`;
- PR #474: offen, Draft, mergefähig, auf PR #471 gestapelt;
- PR #475: offen, Draft, mergefähig, Head `42691ac327e02645677e9b6cfb0fd3fb34572c42`;
- PR #474 ist gegenüber `main` **0 Commits behind**; Merge-Base ist exakt der aktuelle Main;
- PR #471 ist gegenüber `main` ebenfalls **0 Commits behind**;
- zwischen #471, #474 und #475 besteht kein direkter Changed-File-Overlap.

### Semantische Korrelation mit PR #475

PR #475 definiert `ScoringDispatcher` weiterhin als **einzige produktive Multi-Asset-Scoring-Execution-Authority**. PR #474 ändert keine Scoring-Registry, keinen Dispatcher, kein Ranking und keine Universe-SLA-Authority.

`server/marketData/canonicalCryptoScoreEnrichment.ts` ist auf PR #474 und PR #475 identisch und delegiert weiterhin ausschließlich an `dispatchCanonicalScore`. Damit bleibt die fachliche Kette eindeutig:

```text
Market Data
  -> Evidence / Canonical Enrichment
  -> ScoringDispatcher (ADR-0087)
  -> CanonicalScoreResult
```

## 3. Gefundene und behobene Restkorrelation: Durable Worker Authority

Der vertiefte Authority-Check hat einen wichtigen Drift in der ersten PR-474-Iteration identifiziert:

- ADR-0054 ist bereits **Accepted** und **VERIFIED PASS IN PRODUCTION**;
- `public.outbox_jobs` + `server/outbox.ts` besitzen die generische Queue-/Lease-/Retry-/Dead-Letter-Authority;
- `server/outboxWorker.ts` besitzt die generische `job_type -> handler` Dispatch-Authority;
- der provisorische `AsyncExecutionPort` hätte daneben einen zweiten generischen Durable-Execution-Pfad ermöglicht.

Das wäre eine Doppelarchitektur gewesen. Daher wird diese erste Implementierungsrichtung superseded **innerhalb desselben Branches**, bevor sie gemergt wird.

### Korrektur

- `AsyncExecutionPort` wird vollständig entfernt;
- `createApplicationMarketDataRuntime()` wird auf den bestehenden direkten Callback-Vertrag zurückgeführt;
- Snapshot-/Alert-Folgearbeit wird nicht über eine neue Parallel-Queue geroutet;
- ADR-0054 bleibt die einzige durable Background-Job-Authority;
- `server/outboxWorker.ts` erhält lediglich `drainOutboxJobs()` als bounded reuse seam;
- der bestehende Poll-Loop verwendet denselben Drain;
- ein späterer Render-Workflows-Host dürfte ausschließlich diesen bestehenden Outbox-Drain ausführen.

### Harte Authority-Grenze für externe Execution Hosts

Ein externer Host darf **nicht** besitzen:

- Queue Persistence;
- Retry Budget;
- Lease Ownership Semantics;
- Dead-Letter State;
- `job_type -> handler` Business Routing;
- Scoring-/Domain-Routing;
- IAM-/Mutation-Entscheidungen.

Diese bleiben bei ADR-0054 bzw. den bestehenden Domain-/Governance-Authorities.

## 4. P0 — Operational System Event Integrity

### Ausgangslage

`server/systemEvents.ts` verwendete `uploads/system_events.json` als instanzlokalen State und erzeugte beim Fehlen der Datei synthetische Ereignisse.

### Umsetzung

- Local-FS-System-Event-Authority entfernt;
- Synthetic/Seed Events entfernt;
- `OperationalSystemEventJournal` eingeführt;
- non-production: bounded memory projection;
- Production mit konfiguriertem Supabase: `system_event_journal` als durable Operational Projection;
- Production ohne durable Store: explizit `degraded`, kein Local-FS-Fallback;
- API kennzeichnet `authority=operational-read-model` und `auditAuthority=false`.

ADR-0059 und `agent_audit_events` bleiben alleinige Audit-/Correlation-Authority für AI-assisted Commands.

## 5. P0 — Legacy Agent Registration / Dokumentmutation

Stillgelegt wurden:

- lokale Agent Registry als Runtime-Authority;
- manuelle Runtime-State-Fabrikation;
- Runtime-ADR-Nummernvergabe per Dateiscan;
- Runtime-Erzeugung von Change-/Risk-/Governance-Dokumenten.

Neue Agent-/Orchestrator-Architektur läuft ausschließlich über Repository Control Plane, Current-Main-Abgleich, bestehende Registry-/ADR-/ESS-Gates und PR.

## 6. P0 — Supervisor UI Consumer Convergence

`SupervisorDashboard.tsx` wurde auf eine **read-only, observed-only Projektion** reduziert.

Entfernt wurden unter anderem:

- synthetische Cloud-/Firestore-/GCP-Angaben;
- feste Health-/Latency-/Cost-Werte ohne Evidence;
- simulierte Backup-/Alert-/Circuit-Breaker-Erfolgsmeldungen;
- Runtime-Agent-Register/Toggle-UI;
- harte Provider-/Version-/Infrastrukturbehauptungen ohne aktuelle Evidence.

Fehlende Messwerte werden als `nicht instrumentiert` dargestellt.

## 7. P1 — Bestehende Durable Execution Authority für externe Hosts öffnen

ADR-0037 verlangt weiterhin die Trennung von Request Plane und Background Execution Plane. ADR-0054 hat zwischenzeitlich bereits die kanonische durable Job-Schicht geschaffen.

Daraus ergibt sich jetzt die homogene Zielarchitektur:

```text
Render Web Service
  -> HTTP/API/Auth
  -> enqueue_outbox_job(...) für idempotente durable Side-Effect-/Background-Jobs

Supabase
  -> outbox_jobs
  -> lease/retry/backoff/dead-letter

Execution Host
  -> drainOutboxJobs(leaseOwner, maxJobs)
  -> processOneOutboxJob(...)
  -> bestehende ADR-0054 Handler Registry
```

Der aktuelle Host bleibt der bestehende In-Process-Poll-Loop. Ein späterer Render-Workflows-Pilot wäre **nur ein alternativer Host dieses Drains**, keine neue Queue- oder Orchestrator-Architektur.

## 8. Render Workflows — zulässiger Integrationspfad

Ein Render-Workflows-Pilot ist erst zulässig, wenn er folgende Regeln einhält:

1. `outbox_jobs` bleibt durable Source of Truth;
2. Render Workflow speichert keinen konkurrierenden Job-Lifecycle als fachliche Authority;
3. Render-Retries dürfen Outbox-Retry nicht duplizieren; Provider-Retry maximal für Wake-up/Transport, nicht für Jobsemantik;
4. Workflow ruft bounded `drainOutboxJobs()` auf;
5. Handler bleiben ausschließlich in `server/outboxWorker.ts` registriert;
6. Domain-/Scoring-Routing bleibt außerhalb des Workflow-Hosts;
7. neue Market-/Snapshot-/Alert-Jobtypen müssen vor Externalisierung idempotent und ADR-0054-konform sein;
8. Production-Aktivierung benötigt eigenen Owner-Handoff, Rollback und Cost Evidence.

## 9. Dokumenten-State-Konvergenz

Der historische `RENDER_STATELESS_WEB_TIER_AUDIT_2026-08-03.md` bleibt unveränderte historische Evidence.

`RENDER_RUNTIME_ASYNC_EXECUTION_STATUS_2026-08-21.md` projiziert den aktuellen Stand und verweist nun explizit auf ADR-0054 als bereits vorhandene Durable-Worker-Authority.

## 10. Offene externe Gates

1. `system_event_journal` nach Owner-Precheck in Production anwenden und Postcheck/Evidence erzeugen.
2. Production-Durability der Operational Event Projection verifizieren.
3. Neue Background-Jobtypen nur über ADR-0054-Outbox integrieren.
4. Alert Delivery benötigt vor Externalisierung einen idempotenten/atomic Side-Effect-Vertrag.
5. Market Refresh Scheduling/Leader Ownership bleibt eigener ADR-0037-Restpunkt.
6. Replica-invariante kritische Rate Limits bleiben Voraussetzung vor Scale-out.
7. M10 bleibt suspended/off bis zur separaten Owner-Entscheidungskette.
8. AI Content Transparency Runtime-Persistenz bleibt eigene bestehende Contract-Authority.

## 11. Tests / Negative Assurance

Gesichert werden:

- keine synthetische System-Event-Historie;
- kein Local-FS-System-/Agent-Registry-State als Production-Authority;
- keine Runtime-ADR-/Dokumentgenerierung;
- Operational Journal bleibt `auditAuthority=false`;
- Supervisor UI bleibt frei von bekannten Synthetic-Infra-/Mutation-Claims;
- `processOneOutboxJob()` behält ADR-0054-Semantik;
- `drainOutboxJobs()` verarbeitet ausschließlich über dieselbe Outbox-/Handler-Authority;
- kein zweiter Async-/Render-Task-Port bleibt im produktiven Architekturpfad.

## 12. CI-Historie dieser Iteration

Der erste PR-474-CI-Lauf erreichte:

- Repository Integrity PASS;
- `npm ci` PASS;
- `npm audit` PASS mit 0 Vulnerabilities;
- TypeScript PASS;
- 1705 Unit Tests PASS und genau 1 Failure.

Der einzelne Failure war ein Test, der noch Callback-Identität statt Boundary-Verhalten erwartete. Bei der anschließenden Authority-Prüfung wurde jedoch zusätzlich der ADR-0054-Doppelungsdrift gefunden. Deshalb wird nicht nur der Test angepasst, sondern die überflüssige AsyncExecutionPort-Architektur vollständig entfernt und die vorhandene Outbox-Authority wiederverwendet.

## 13. Definition of Done

- [x] aktueller Main erneut geprüft: `6c90c04d…`.
- [x] PR #471 weiterhin 0 behind / mergefähig.
- [x] PR #474 weiterhin korrekt auf #471 gestapelt.
- [x] PR #475 auf direkte und semantische Korrelation geprüft.
- [x] kein direkter Dateioverlap #471/#474/#475.
- [x] ScoringDispatcher bleibt alleinige Scoring-Authority.
- [x] ADR-0054 als bereits vorhandene Durable-Worker-Authority erkannt.
- [x] provisorische doppelte AsyncExecutionPort-Authority zur Entfernung vorgesehen.
- [x] bounded Outbox-Drain als Reuse-Seam umgesetzt.
- [x] System Event / Agent / Supervisor Governance-Konvergenz umgesetzt.
- [ ] finalen PR-474-Head nach Authority-Korrektur vollständig in CI validieren.
- [ ] vor Retarget/Merge erneut aktuellen Main und offene PRs korrelieren.
- [ ] PR #471 zuerst abschließen oder Scope explizit auflösen.
- [ ] danach PR #474 auf `main` retargeten und kanonische Production-Baseline maschinell erzeugen.
- [ ] separate Owner-Freigabe für jede Supabase-/Render-Production-Mutation.
