# CAPITAL-AI — Render Runtime & Async Execution Status Projection

**Projection date:** 2026-08-21  
**Document role:** non-authorizing status projection  
**Historical parent:** `docs/architecture/RENDER_STATELESS_WEB_TIER_AUDIT_2026-08-03.md`  
**Current authorities:** ADR-0037, ADR-0044, ADR-0052, ADR-0059, ADR-0096  
**Work package:** `WP-GOV-RUNTIME-CONVERGENCE-2026-08-21`

## Purpose

Der Audit vom 03.08.2026 bleibt unveränderte historische Evidence. Dieses Dokument projiziert die damaligen Findings auf den Repository-Stand des gestapelten Governance-Convergence-Branches vom 21.08.2026. Es ersetzt keine ADR und erzeugt keine neue Render-, Worker-, Audit- oder Governance-Authority.

## Statuslegende

- `REMEDIATED` — Repository-Architektur beseitigt den damaligen Befund.
- `REPO-REMEDIATED / PROD-GATE` — Repository ist vorbereitet, externe Produktionsmutation/-evidence steht aus.
- `PARTIAL` — Architekturgrenze umgesetzt, produktiver Cutover noch offen.
- `OPEN` — Befund bleibt technisch relevant.
- `BY DESIGN` — Verhalten bleibt bewusst begrenzt und darf nicht als stärkere Garantie interpretiert werden.

## Findings Projection

| ID | Historischer Befund | Status 2026-08-21 | Aktuelle Evidence / Konsequenz |
|---|---|---|---|
| RND2-F-001 | Subscription entitlement mit lokalem Production-Fallback | `REMEDIATED` | `server/db.ts` nutzt Local Subscription nur non-production; Production fällt bei fehlender privilegierter DB auf Free/fail-closed. |
| RND2-F-002 | PDF Credits local-only/non-atomic | `REMEDIATED` | ADR-0052 + `server/pdfCreditLedger.ts` + Supabase Ledger/RPC; Local JSON nur Development-Fallback. |
| RND2-F-003 | System-/Audit-Events ephemer + Synthetic Seeds | `REPO-REMEDIATED / PROD-GATE` | Synthetic/File-State aus `server/systemEvents.ts` entfernt; `system_event_journal` Migration vorbereitet. Diese Projektion ist operational-only und ersetzt ADR-0059 Audit nicht. Production-Migration/Evidence steht aus. |
| RND2-F-004 | Agent Registry instanzlokal | `REMEDIATED / BY DESIGN` | File Registry entfernt. Dashboard-State ist ausdrücklich process-local runtime telemetry und keine Registry-Authority; manuelle State-Fabrikation ist gesperrt. |
| RND2-F-005 | Documentary mutiert Production-Dateien | `REMEDIATED` | ADR-0044 Production Runtime Artifact Immutability blockiert `docs/**`/Version/Documentary Runtime Mutations. Documentary Maintenance arbeitet über kontrollierte Repository-Grenzen. |
| RND2-F-006 | Version Manager local/mutable/version drift | `REMEDIATED` | ADR-0044 + ADR-0096: `package.json#version`/immutable release evidence; legacy local Version Authority non-authorizing. |
| RND2-F-007 | Market Refresh ohne distributed ownership | `PARTIAL` | `AsyncExecutionPort` trennt Execution Mechanics vom Domain/Supervisor. Default bleibt inline; ein durable external adapter/ownership cutover ist noch nicht produktiv. |
| RND2-F-008 | Score snapshot idempotency | `CONTROL PRESENT` | Bestehende DB-Idempotency bleibt; dieses Paket ändert sie nicht. |
| RND2-F-009 | Alert Send nicht duplicate-safe | `OPEN` | Externalisierung allein löst keine Side-Effect-Idempotency. Atomic Claim/Outbox bleibt eigener P1-Befund vor Multi-Instance-/Workflow-Cutover. |
| RND2-F-010 | Event Mesh ist in-process | `BY DESIGN` | ADR-0018 bleibt in-process Transport. `AsyncExecutionPort` macht Event Mesh nicht zur Queue. |
| RND2-F-011 | kritische Rate Limits process-local | `OPEN / BY DESIGN` | RequestOrchestrator bleibt HTTP Admission Control; vor Scale-out ist replica-invariante Rate-Limit-Strategie erforderlich. |
| RND2-F-012 | kein generischer durable Background Execution Contract | `PARTIAL` | Providerneutraler serialisierbarer `AsyncExecutionPort` ist repositoryseitig vorhanden. Durable Adapter, provider execution IDs, Retry-/Cost-Evidence und Production Cutover stehen aus. |
| RND2-F-013 | ADR-Nummernkollision / parallele Writer | `REMEDIATED` | ADR-0096 + `docs/adr/registry.json` erzwingen stabile Authority IDs, Reservations und Open-PR-Namespace-Korrelation. Zusätzlich ist der Legacy Runtime-ADR-Generator stillgelegt. |

## Current execution boundary

```text
HTTP / API
   |
   +--> RequestOrchestrator
   |      HTTP admission / rate / bounded local queue only
   |
   +--> Supervisor / Domain Orchestrators
             fachliche Auswahl und Policy
             |
             v
        AsyncExecutionPort
             |
       +-----+------------------+
       |                        |
       v                        v
Inline adapter            external durable adapter
(current default)         (future production gate)
```

Wichtig: Der `AsyncExecutionPort` erhält keine Domain-Routing-Authority. Ein Render-Workflows-Adapter darf daher weder Assetklasse/Scoringmodell wählen noch IAM-/Policy-/Mutation-Gates umgehen.

## Render Workflows readiness

Der aktuelle Repository-Schritt ist absichtlich providerneutral:

- kein Render SDK im Domain-/Supervisor-Vertrag;
- keine zweite `workflows/`-Businessarchitektur;
- kein Render Workflow in `render.yaml` vorgetäuscht;
- bestehender Finance Web Service bleibt unverändert;
- Market Snapshot-/Alert-Folgejobs verwenden bereits stabile Task Types und Correlation IDs;
- Inline ist weiterhin Default und hält das heutige Verhalten stabil.

Ein späterer Render-Workflows-Pilot ist damit ein Adapter-/Production-Handoff, keine neue fachliche Orchestrator-Architektur.

## Production gates

Vor einem externen Durable-Execution-Cutover müssen mindestens erfüllt sein:

1. aktueller Main-/PR-Korrelationscheck;
2. Owner-freigegebener Render-Handoff mit Rollback;
3. definierte Provider-/Task-Idempotency;
4. Alert Delivery Atomic Claim/Outbox für externe Mail-Side-Effects;
5. Retry-/Timeout-/Dead-letter-Semantik;
6. Task-/Correlation-/Provider-Execution-Telemetrie;
7. Cost Evidence pro Taskklasse;
8. negative Tests für duplicate/replay/stale execution;
9. Pilot mit niedrigriskanter Aufgabe vor Market-/Alert-Cutover;
10. keine M10-, IAM-, Billing- oder Governance-Critical-Abhängigkeit von einer Beta-Execution-Engine ohne eigene Owner-Entscheidung.

## Conclusion

Der historische Audit ist nicht mehr als unveränderte aktuelle Finding-Liste geeignet. Durable Business State, Documentary/Version Authority und ADR Namespace Governance wurden seitdem wesentlich verbessert. Die verbleibende zentrale Render-Frage ist nicht mehr „Worker-Architektur fehlt vollständig“, sondern der kontrollierte Übergang vom **providerneutralen Execution Contract** zu einem nachweisbar idempotenten, beobachtbaren und kosteneffizienten externen Adapter.
