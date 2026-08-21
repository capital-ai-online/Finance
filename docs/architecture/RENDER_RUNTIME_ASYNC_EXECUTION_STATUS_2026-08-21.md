# CAPITAL-AI — Render Runtime & Background Execution Status Projection

**Projection date:** 2026-08-21  
**Document role:** non-authorizing status projection  
**Historical parent:** `docs/architecture/RENDER_STATELESS_WEB_TIER_AUDIT_2026-08-03.md`  
**Current authorities:** ADR-0037, ADR-0044, ADR-0052, ADR-0054, ADR-0059, ADR-0092, ADR-0096  
**Work package:** `WP-GOV-RUNTIME-CONVERGENCE-2026-08-21`

## Purpose

Der Audit vom 03.08.2026 bleibt historische Evidence. Diese Projektion ordnet die damaligen Findings gegen den heutigen Repository-Stand ein und verhindert zwei Parallelarchitekturen:

1. kein zweites Durable-Worker-/Retry-Control-Plane neben ADR-0054;
2. kein zweites persistentes Audit-/Security-/Retention-System für reine Operational-Telemetrie.

## Findings Projection

| ID | Historischer Befund | Status 2026-08-21 | Aktuelle Evidence / Konsequenz |
|---|---|---|---|
| RND2-F-001 | Subscription entitlement mit lokalem Production-Fallback | `REMEDIATED` | Production ist für authoritative Entitlements DB-/fail-closed; lokale Daten nur non-authoritative/non-production. |
| RND2-F-002 | PDF Credits local-only/non-atomic | `REMEDIATED` | ADR-0052 + Supabase Ledger/RPC. |
| RND2-F-003 | System-/Audit-Events ephemer + Synthetic Seeds | `REMEDIATED BY AUTHORITY SPLIT` | Synthetic/File-State entfernt. Operational Events sind bewusst bounded+ephemeral; Security Evidence bleibt `security_events`, Agent/Action Audit bleibt ADR-0059. Keine zweite durable Tabelle. |
| RND2-F-004 | Agent Registry instanzlokal | `REMEDIATED / BY DESIGN` | File Registry entfernt; Dashboard-State runtime-derived und keine Registry-Authority. |
| RND2-F-005 | Documentary mutiert Production-Dateien | `REMEDIATED` | ADR-0044 blockiert Production-Runtime-Dokumentmutationen. |
| RND2-F-006 | Version Manager local/mutable/version drift | `REMEDIATED` | Repository-/Release-Authority gemäß ADR-0044/ADR-0096. |
| RND2-F-007 | Market Refresh ohne distributed ownership | `OPEN / PARTIAL` | ADR-0054 besitzt Durable Jobs; periodisches Refresh Scheduling/Leader Ownership ist noch nicht aus dem Web-Prozess gelöst. |
| RND2-F-008 | Score snapshot idempotency | `CONTROL PRESENT` | Bestehende Scoring-/Persistence-Invarianten bleiben; keine neue Scoring-Authority. |
| RND2-F-009 | Alert Send nicht duplicate-safe | `OPEN` | Vor Externalisierung muss Alert Delivery als idempotenter ADR-0054-Job-/Atomic-Claim-Vertrag modelliert werden. |
| RND2-F-010 | Event Mesh ist in-process | `BY DESIGN` | ADR-0018 bleibt In-Process Transport; Legacy `SystemAuditEvent` ist operational signal, kein Audit Ledger. |
| RND2-F-011 | kritische Rate Limits process-local | `OPEN / BY DESIGN` | RequestOrchestrator bleibt HTTP Admission Control; replica-invariante Rate Limits vor Scale-out erforderlich. |
| RND2-F-012 | kein generischer durable Background Execution Contract | `REMEDIATED` | ADR-0054 `outbox_jobs` + `server/outbox.ts` + `server/outboxWorker.ts` sind Accepted und production-verified. |
| RND2-F-013 | ADR-Nummernkollision / parallele Writer | `REMEDIATED` | ADR-0096 Registry/Reservations; Legacy Runtime-ADR-Generator stillgelegt. |

## Canonical execution and evidence boundaries

```text
HTTP/API
  -> RequestOrchestrator                       [request admission only]

Financial decision path
  -> Evidence / UAI / Registry
  -> ScoringDispatcher                         [single scoring authority]

Durable background jobs
  -> public.outbox_jobs
  -> server/outbox.ts                          [lease/retry/backoff/dead-letter]
  -> server/outboxWorker.ts                    [job_type -> handler]
  -> drainOutboxJobs(...)                      [bounded host seam]

Security denial evidence
  -> public.security_events

Agent / privileged action audit
  -> ADR-0059 / agent_audit_events / OTEL

Operational UI events
  -> bounded in-memory projection              [ephemeral, no PII persistence]
  -> AuditLog / Notifications                  [read-only, non-audit]

Systemadmin repository mutations
  -> ESS-0021 / ADR-0065 / ADR-0079            [separate Owner-authorized host]
```

## Why Operational Events remain ephemeral

ADR-0037 allows non-authoritative diagnostics in the web process. Persisting the UI projection in a new Supabase table would introduce:

- a second log lifecycle;
- duplicate actor/IP PII;
- a second retention surface beside ADR-0092;
- ambiguous overlap with `security_events` and ADR-0059.

Therefore the correct architecture is not “make every log durable”, but “send durable evidence to its canonical owner and keep the dashboard projection explicitly disposable”.

## Render Workflows readiness

Render Workflows may not become another job control plane. The only permitted architectural role is a future **background-job execution host** for the existing ADR-0054 drain.

A compliant adapter/host must satisfy:

- `outbox_jobs` remains durable source of truth;
- lease/retry/backoff/dead-letter stays in ADR-0054;
- handler routing stays in `server/outboxWorker.ts`;
- provider retries do not duplicate job retries;
- host may invoke bounded `drainOutboxJobs(leaseOwner, maxJobs)`;
- no ScoringDispatcher/domain/IAM/governance decisions occur in the host;
- the host is distinct from the Systemadmin GitHub Actions execution host and cannot perform repository mutations;
- host failure leaves durable jobs reclaimable through the existing Outbox semantics.

## Systemadmin boundary

ESS-0021 / ADR-0065 / ADR-0079 govern Owner-approved repository mutations. That execution path has OIDC, policy, durable audit and exact mutation capability binding.

The ADR-0054 outbox drain must never be used as a shortcut for:

- GitHub branch/commit/PR actions;
- approval/passkey/REM gates;
- arbitrary tools or shell commands;
- privileged governance/IAM mutations.

Likewise the Systemadmin host is not a general background-job queue.

## Remaining production gates for a future Render host

1. fresh current-main/open-PR correlation;
2. separate Owner-approved Render production handoff;
3. idempotent ADR-0054 job types for every workload being moved;
4. bounded drain / unique lease-owner telemetry;
5. no duplicated provider-level retry/dead-letter semantics;
6. cost evidence per workload;
7. negative tests for duplicate wake-up, stale lease, crash-after-handler and host outage;
8. separate solution for periodic Market Refresh scheduling/leader ownership;
9. replica-invariant critical rate limits before horizontal web scaling.

## Conclusion

The durable worker architecture already exists and remains ADR-0054. Operational UI telemetry does not need a second durable database. The remaining Render opportunity is therefore limited to changing **where the existing outbox drain executes**, while the queue, retry, audit, security, scoring, privacy and Systemadmin authorities remain unchanged.
