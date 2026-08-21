# CAPITAL-AI — Render Runtime & Async Execution Status Projection

**Projection date:** 2026-08-21  
**Document role:** non-authorizing status projection  
**Historical parent:** `docs/architecture/RENDER_STATELESS_WEB_TIER_AUDIT_2026-08-03.md`  
**Current authorities:** ADR-0037, ADR-0044, ADR-0052, ADR-0054, ADR-0059, ADR-0096  
**Work package:** `WP-GOV-RUNTIME-CONVERGENCE-2026-08-21`

## Purpose

Der Audit vom 03.08.2026 bleibt unveränderte historische Evidence. Dieses Dokument projiziert die damaligen Findings auf den aktuellen Repository-Stand und korrigiert insbesondere die Background-Execution-Authority: ADR-0054 hat bereits eine produktionsverifizierte generische durable Outbox-/Worker-Schicht geschaffen. Eine zweite Queue-/Retry-/Handler-Dispatch-Architektur ist daher nicht zulässig.

## Findings Projection

| ID | Historischer Befund | Status 2026-08-21 | Aktuelle Evidence / Konsequenz |
|---|---|---|---|
| RND2-F-001 | Subscription entitlement mit lokalem Production-Fallback | `REMEDIATED` | Production fällt bei fehlender privilegierter DB fail-closed; lokale Subscription nur non-production. |
| RND2-F-002 | PDF Credits local-only/non-atomic | `REMEDIATED` | ADR-0052 + Supabase Ledger/RPC; Local JSON nur Development-Fallback. |
| RND2-F-003 | System-/Audit-Events ephemer + Synthetic Seeds | `REPO-REMEDIATED / PROD-GATE` | Synthetic/File-State entfernt; `system_event_journal` vorbereitet. Operational-only, ersetzt ADR-0059 Audit nicht. |
| RND2-F-004 | Agent Registry instanzlokal | `REMEDIATED / BY DESIGN` | File Registry entfernt. Dashboard-State ist runtime-derived Telemetrie, keine Registry-Authority. |
| RND2-F-005 | Documentary mutiert Production-Dateien | `REMEDIATED` | ADR-0044 blockiert Production-Runtime-Dokumentmutationen. |
| RND2-F-006 | Version Manager local/mutable/version drift | `REMEDIATED` | ADR-0044 + ADR-0096; immutable Release-/Repository-Authority. |
| RND2-F-007 | Market Refresh ohne distributed ownership | `OPEN / PARTIAL` | Durable Job Authority existiert via ADR-0054; periodisches Refresh Scheduling/Leader Ownership ist noch nicht aus dem Web-Prozess herausgelöst. |
| RND2-F-008 | Score snapshot idempotency | `CONTROL PRESENT` | Bestehende DB-Idempotency bleibt; keine Parallelarchitektur eingeführt. |
| RND2-F-009 | Alert Send nicht duplicate-safe | `OPEN` | Vor Externalisierung muss Alert Delivery als idempotenter ADR-0054-Job/Atomic-Claim-Vertrag modelliert werden. |
| RND2-F-010 | Event Mesh ist in-process | `BY DESIGN` | ADR-0018 bleibt In-Process Transport und wird nicht zur Queue umgedeutet. |
| RND2-F-011 | kritische Rate Limits process-local | `OPEN / BY DESIGN` | RequestOrchestrator bleibt HTTP Admission Control; replica-invariante Rate Limits vor Scale-out erforderlich. |
| RND2-F-012 | kein generischer durable Background Execution Contract | `REMEDIATED` | ADR-0054 `public.outbox_jobs` + `server/outbox.ts` + `server/outboxWorker.ts` sind bereits Accepted und VERIFIED PASS IN PRODUCTION. |
| RND2-F-013 | ADR-Nummernkollision / parallele Writer | `REMEDIATED` | ADR-0096 Registry/Reservations; Legacy Runtime-ADR-Generator stillgelegt. |

## Canonical execution boundary

```text
HTTP / API
   |
   +--> RequestOrchestrator
   |      HTTP admission / bounded request queue only
   |
   +--> Domain / Scoring Authorities
   |      UAI -> Evidence -> ScoringModelRegistry -> ScoringDispatcher
   |
   +--> durable background side effect required?
           |
           v
      ADR-0054 Outbox Authority
      public.outbox_jobs
           |
           v
      server/outbox.ts
      lease / retry / backoff / dead-letter
           |
           v
      server/outboxWorker.ts
      job_type -> handler
           |
           v
      drainOutboxJobs(...)
           |
      +----+---------------------+
      |                          |
      v                          v
current in-process poll    future external host
                          (e.g. Render Workflows)
```

## Authority correction made in PR #474

Eine erste Iteration von PR #474 enthielt einen providerneutralen `AsyncExecutionPort`. Der erneute Current-Main-/Authority-Abgleich zeigte jedoch, dass ADR-0054 bereits dieselbe generische durable Retry-/Handler-Dispatch-Verantwortung besitzt. Dieser Port wird deshalb entfernt, bevor der PR gemergt wird.

`createApplicationMarketDataRuntime()` bleibt bei seinen bestehenden direkten Snapshot-/Alert-Callbacks. Eine spätere Externalisierung darf diese Callbacks nicht einfach in eine neue Queue verschieben, sondern muss passende idempotente ADR-0054-Jobtypen definieren.

## Render Workflows readiness

Render Workflows darf in der Zielarchitektur **kein zweites Job Control Plane** werden. Ein zulässiger Pilot ist nur ein alternativer Execution Host für den bestehenden Outbox-Drain:

- `outbox_jobs` bleibt durable Source of Truth;
- Lease, Attempts, Backoff und Dead-Letter bleiben ausschließlich in ADR-0054;
- Handler-Registry bleibt ausschließlich `server/outboxWorker.ts`;
- Render darf weder Scoring- noch Domain-Routing entscheiden;
- Provider-Retry darf die Outbox-Retry-Semantik nicht duplizieren;
- ein Workflow-Aufruf darf bounded `drainOutboxJobs(leaseOwner, maxJobs)` ausführen;
- bei Workflow-/Host-Ausfall bleiben Jobs in Supabase pending/processing/reclaimable.

Damit entsteht ein Hosting-Wechsel, keine neue Wertschöpfungs- oder Governance-Authority.

## Production gates

Vor einem Render-Workflows-Cutover müssen mindestens erfüllt sein:

1. aktueller Main-/Open-PR-Korrelationscheck;
2. Owner-freigegebener Render-Handoff mit Rollback;
3. alle zu externalisierenden Jobtypen ADR-0054-konform und idempotent;
4. keine doppelte Retry-/Dead-Letter-Semantik im Render-Layer;
5. bounded Drain und Lease Owner eindeutig instrumentiert;
6. Task-/Correlation-/Cost-Evidence pro Execution Host;
7. negative Tests für Replay, stale lease, host failure und duplicate wake-up;
8. Market Refresh Scheduling/Leader Ownership separat lösen;
9. replica-invariante kritische Rate Limits vor Scale-out;
10. keine M10-/IAM-/Billing-/Governance-Critical-Abhängigkeit von einem neuen Host ohne eigene Owner-Entscheidung.

## Conclusion

Die Durable-Worker-Frage ist repositoryseitig nicht mehr offen: ADR-0054 ist die Single Authority für generische durable Background Jobs. Der verbleibende Render-Schritt ist ausschließlich die optionale Verlagerung des **Execution Hosts** für denselben Outbox-Drain sowie die noch offene Scheduler-/Leader-Trennung aus ADR-0037. Dadurch bleibt die Wertschöpfungskette homogen und verhindert eine zweite Queue-, Retry- oder Orchestrator-Architektur.
