# Governance Convergence & Runtime Execution — 2026-08-21

**Work Package ID:** `WP-GOV-RUNTIME-CONVERGENCE-2026-08-21`  
**Status:** IMPLEMENTED IN STACKED DRAFT PR #474 / FINAL CI PENDING  
**Branch:** `agent/governance-convergence-runtime-execution-2026-08-21`  
**Upstream PR:** `#471` (`agent/hosted-validation-cost-s0-s3-2026-08-21`)  
**Parallel Scoring PR:** `#475` (`feature/fintech-orchestrator-p0-multiclass-integrity`)  
**Current main at continuation check:** `6c90c04de8924b8783f23ab4789afa810e9ea3a8`  
**Primary authorities:** ADR-0096, ADR-0037, ADR-0044, ADR-0054, ADR-0059, ADR-0018, ADR-0087, ADR-0092, ESS-0021/ADR-0065/ADR-0079, AGENTS.md  
**External mutation scope:** NONE

## 1. Ziel

Dieses Paket konsolidiert offene Governance-/Runtime-Drifts in einer homogenen Wertschöpfungskette. Es erzeugt keine zweite Governance-, Scoring-, Worker-, Audit-, Security-, Privacy- oder Systemadmin-Authority.

```text
Governance Control Plane (ADR-0096 / AGENTS.md)
   |
   +--> Scoring: ADR-0087 -> ScoringDispatcher
   |
   +--> Durable background jobs: ADR-0054
   |       public.outbox_jobs -> server/outbox.ts -> server/outboxWorker.ts
   |
   +--> Security denial evidence: public.security_events
   |
   +--> Agent/action audit: ADR-0059 -> agent_audit_events / OTEL correlation
   |
   +--> Privacy retention: ADR-0092
   |
   +--> Systemadmin repository mutations: ESS-0021 / ADR-0065 / ADR-0079
   |
   +--> Event Mesh: ADR-0018, in-process transport only
   |
   +--> Operational UI projection: bounded + ephemeral + no PII persistence
```

## 2. Current-main / Open-PR correlation

Am Fortsetzungspunkt wurde erneut geprüft:

- `main = 6c90c04de8924b8783f23ab4789afa810e9ea3a8`;
- PR #471: offen, Draft, mergefähig, Head `b8a78220c671df8cb3c35dfc5ba719b972e6ce69`, `0 behind`;
- PR #474: offen, Draft, mergefähig und auf PR #471 gestapelt;
- PR #475: offen, Draft, mergefähig, Head `42691ac327e02645677e9b6cfb0fd3fb34572c42`;
- PR #474 war gegenüber aktuellem `main` `0 behind` und hatte exakt diesen Main als Merge-Base;
- zwischen #471, #474 und #475 bestand kein direkter Changed-File-Overlap.

### Scoring-Korrelation zu PR #475

PR #475 hält `ScoringDispatcher` als alleinige produktive Multi-Asset-Scoring-Execution-Authority. `canonicalCryptoScoreEnrichment.ts` war auf #474/#475 identisch und delegiert an `dispatchCanonicalScore`.

PR #474 ändert deshalb bewusst keine:

- Scoring Registry;
- ScoringDispatcher-Entscheidung;
- Ranking Authority;
- Universe SLA;
- Domain-Scoring-Gewichte.

## 3. Authority-Korrektur A — keine zweite Durable Worker Architecture

Der vertiefte Abgleich gegen ADR-0054 ergab, dass bereits eine produktionsverifizierte generische Durable-Worker-Authority existiert:

```text
public.outbox_jobs
  -> server/outbox.ts
     queue / lease / retry / backoff / dead-letter
  -> server/outboxWorker.ts
     job_type -> handler
```

Eine erste PR-474-Iteration enthielt einen zusätzlichen `AsyncExecutionPort`. Das hätte eine zweite generische Durable-Execution-/Handler-Dispatch-Schicht ermöglicht.

### Korrektur

- `AsyncExecutionPort` vollständig entfernt;
- Market-Data Runtime auf den bestehenden Callback-Vertrag zurückgeführt;
- `server/outboxWorker.ts` erhält nur `drainOutboxJobs()` als bounded Reuse-Seam;
- der vorhandene Poll-Loop verwendet denselben Drain;
- Queue, Lease, Retry, Backoff, Dead Letter und Handler Routing bleiben ausschließlich ADR-0054.

Ein späterer Render-Workflows-Pilot darf damit nur ein **Background-Job Execution Host** für den vorhandenen Drain sein. Er darf kein zweites Job Control Plane erzeugen.

## 4. Authority-Korrektur B — kein zweites dauerhaftes Audit-/Logging-System

Die erste PR-474-Iteration sah `public.system_event_journal` als neue persistente Tabelle vor. Der erneute Governance-/Privacy-Abgleich zeigte:

- `public.security_events` besitzt bereits die dauerhafte Authority für Security-Denial-/Unauthorized-Access-Evidence;
- ADR-0059 / `agent_audit_events` besitzt die dauerhafte Agent-/Action-Audit-Authority;
- ADR-0092 besitzt die Retention-/Privacy-Lifecycle-Authority;
- ADR-0037 erlaubt bounded non-authoritative diagnostics im Web-Prozess.

Eine zusätzliche dauerhafte Operational-Event-Tabelle hätte Persistenz, PII und Retention dupliziert.

### Korrektur

- Supabase-Migration `system_event_journal` vollständig entfernt;
- `OperationalSystemEventJournal` ist bounded und **ephemeral-by-design**;
- keine Actor-E-Mail, User-ID oder IP wird darin gespeichert;
- Restart-Verlust ist zulässig, weil die Projektion ausdrücklich keine Evidence-Authority ist;
- langlebige Evidence muss vom jeweils kanonischen Security-/Audit-Owner geschrieben werden.

Damit existiert in diesem PR **keine Supabase-Production-Mutation mehr**.

## 5. P0 — System Event / UI Integrity

### Server

`server/systemEvents.ts` wurde konsolidiert:

- kein `uploads/system_events.json`;
- keine Synthetic Seed Events;
- keine Runtime-ADR-/Risk-/Change-Dokumentgenerierung;
- kein SSE-Kompatibilitätspfad mehr;
- `/system-events` ist read-only;
- manuelles `POST /system-events` wird mit `RUNTIME_DERIVED_OPERATIONAL_EVENT_REQUIRED` fail-closed abgewiesen;
- Runtime-Agent-Registrierung bleibt mit `REPOSITORY_CONTROL_PLANE_REQUIRED` gesperrt;
- Runtime-Agent-Toggle bleibt mit `RUNTIME_DERIVED_STATE_REQUIRED` gesperrt.

### `AuditLog.tsx`

Der Legacy-Komponentenname bleibt zur Import-Kompatibilität bestehen, aber die Semantik wurde korrigiert:

- ausdrücklich **kein Audit-Log**;
- read-only Operational Event Projection;
- keine manuelle Event-Erzeugung;
- keine Behauptung einer lückenlosen Compliance-/Security-Historie;
- keine Actor-/IP-Anzeige;
- Export kennzeichnet die Daten als `operational-read-model-only`.

### `ComplianceNotifications.tsx`

Der Legacy-Komponentenname bleibt ebenfalls nur aus Kompatibilitätsgründen bestehen:

- keine „Compliance Audit Entry“-Semantik;
- kein ADR-Mapping aus beliebigen Runtime Events;
- kein unauthenticated `EventSource`-/E-Mail-Query-Kompatibilitätspfad;
- authenticated polling über `authFetch`;
- keine Actor-/IP-Anzeige;
- UI kennzeichnet Events als non-authorizing / non-audit.

## 6. P0 — Event Mesh Supersession

`SystemAuditEvent` bleibt als Legacy-Katalogname erhalten, weil ADR-0018/Event-Mesh-Kompatibilität nicht unnötig gebrochen werden soll.

Die Authority-Aussage wurde jedoch korrigiert:

- Event Mesh ist nur in-process Transport;
- `SystemAuditEvent` ist ein operational signal, kein Audit Ledger;
- Payload enthält keine Actor-E-Mail/IP mehr;
- `SystemAuditBridge.ts` darf weder Autorisierung noch Audit-/Compliance-Evidence begründen;
- `StandardEventCatalog.ts` dokumentiert den Legacy-Namen entsprechend.

## 7. P0 — Agent / Documentary Governance

Stillgelegt bleiben:

- lokale Agent Registry als Runtime-Authority;
- Runtime-ADR-Nummernvergabe durch Dateiscan;
- Runtime-Erzeugung von Change-/Risk-/Governance-Dokumenten;
- manuelle Agent-State-Fabrikation.

Neue Agent-/Orchestrator-Architektur folgt ausschließlich:

```text
current main
 -> Work Claim / bestehende Registry-/ADR-/ESS-Gates
 -> Branch
 -> Code + Dokumentation
 -> PR
 -> Human Merge
```

## 8. P0 — Supervisor Dashboard

`SupervisorDashboard.tsx` ist observed-only/read-only:

- keine simulierten Cloud-Run-/Firestore-/GCP-Daten;
- keine erfundenen Latency-/Cost-/Backup-/Alert-/Circuit-Breaker-Werte;
- keine Runtime-Agent-Architekturmutation;
- fehlende Messwerte = `nicht instrumentiert`.

## 9. Systemadmin Execution Host — explizit getrennte Authority

ESS-0021, ADR-0065 und ADR-0079 regeln den Systemadmin Execution Host für Owner-autorisierte Repository-/GitHub-Mutationen.

Dieser Host ist **nicht** identisch mit ADR-0054 Background Job Execution.

`drainOutboxJobs()` darf daher niemals genutzt werden für:

- Branch-/Commit-/PR-Erstellung;
- GitHub-/Repository-Mutationen;
- Owner Approval / Passkey / REM-Umgehung;
- IAM-/Governance-Mutationen;
- beliebige Shell-/Tool-Ausführung.

Umgekehrt ist der Systemadmin Host keine Job Queue und darf ADR-0054 nicht ersetzen.

## 10. Render Workflows — zulässige spätere Integration

Ein Render-Workflows-Pilot ist nur zulässig als alternativer Background-Job Host:

1. `outbox_jobs` bleibt Durable Source of Truth;
2. Lease/Retry/Backoff/Dead-Letter bleiben ADR-0054;
3. Handler Registry bleibt `server/outboxWorker.ts`;
4. Render-Retries dürfen Outbox-Retry nicht duplizieren;
5. Render darf kein Scoring-/Domain-/IAM-/Governance-Routing entscheiden;
6. Render darf den Systemadmin Execution Host nicht ersetzen;
7. Pilot ruft bounded `drainOutboxJobs(leaseOwner, maxJobs)` auf;
8. neue Jobtypen müssen vor Externalisierung idempotent sein;
9. Production-Aktivierung benötigt separaten Owner-Handoff, Rollback und Cost Evidence.

## 11. Offene Restpunkte außerhalb dieses PRs

- Market Refresh Scheduling/Leader Ownership gemäß ADR-0037 aus dem Web-Prozess herauslösen;
- Alerts vor Externalisierung mit idempotentem Side-Effect-/Outbox-Vertrag versehen;
- replica-invariante kritische Rate Limits vor Scale-out;
- M10 bleibt in seiner eigenen Governance-Kette;
- AI Content Transparency Runtime-Persistenz bleibt bei ihrer bestehenden Contract-Authority.

## 12. Negative Assurance

Neue/erweiterte Tests sichern:

- keine Synthetic System Events;
- kein Local-FS-System-/Agent-Registry-State als Authority;
- kein neues `system_event_journal`-Schema;
- Operational Event Projection ist bounded, ephemeral und PII-frei;
- keine manuelle System-Event-Erzeugung;
- AuditLog/Notifications sind read-only/non-audit;
- Event-Mesh-Bridge ist PII-minimiert und non-authorizing;
- ADR-0054 `processOneOutboxJob()` bleibt unverändert gültig;
- `drainOutboxJobs()` verwendet ausschließlich denselben Outbox-/Handler-Pfad;
- keine zweite Async-/Render-Queue bleibt im PR.

## 13. Definition of Done

- [x] aktuellen Main erneut geprüft.
- [x] PR #471 weiterhin `0 behind` / mergefähig.
- [x] PR #474 korrekt auf #471 gestapelt.
- [x] PR #475 direkt und semantisch korreliert.
- [x] kein direkter Dateioverlap #471/#474/#475.
- [x] ScoringDispatcher als Single Scoring Authority erhalten.
- [x] ADR-0054 als Single Durable Background Job Authority erhalten.
- [x] zusätzliche AsyncExecutionPort-Architektur entfernt.
- [x] zusätzliche dauerhafte System-Event-/Retention-Authority entfernt.
- [x] `security_events`, ADR-0059 und ADR-0092 respektiert.
- [x] Systemadmin Execution Host als separate Mutation Authority geschützt.
- [x] AuditLog/Notifications/EventMesh-Semantik konsolidiert.
- [x] keine externe Plattformmutation mehr Bestandteil des PRs.
- [ ] finalen PR-474-Head vollständig in CI validieren.
- [ ] unmittelbar vor späterem Retarget erneut `main` und offene PRs korrelieren.
- [ ] PR #471 zuerst abschließen oder Scope explizit auflösen.
- [ ] danach #474 auf `main` retargeten und kanonische Production-Baseline maschinell erzeugen.
