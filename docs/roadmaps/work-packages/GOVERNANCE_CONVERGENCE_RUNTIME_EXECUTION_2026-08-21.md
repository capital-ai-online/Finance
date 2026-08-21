# Governance Convergence & Runtime Execution — 2026-08-21

**Work Package ID:** `WP-GOV-RUNTIME-CONVERGENCE-2026-08-21`  
**Status:** IMPLEMENTED IN STACKED DRAFT PR #474 / VALIDATION & EXTERNAL PRODUCTION GATES OPEN  
**Branch:** `agent/governance-convergence-runtime-execution-2026-08-21`  
**Upstream PR:** `#471` (`agent/hosted-validation-cost-s0-s3-2026-08-21`)  
**Initial/Pre-PR main:** `6c90c04de8924b8783f23ab4789afa810e9ea3a8`  
**Primary authorities:** ADR-0096, ADR-0037, ADR-0044, ADR-0059, ADR-0018, AGENTS.md  
**Non-scope:** M10 reactivation, Render/Supabase/Stripe production mutation, new scoring authority, new Vocabulary/Transparency authority

## 1. Ziel

Dieses Paket konsolidiert die noch offenen Governance- und Runtime-Gaps aus den parallel geführten CAPITAL-AI-Governance-Arbeiten in **einer** umsetzbaren Kette. Es erzeugt keine neue Governance Control Plane und keine neue Master-Roadmap. Bestehende Authorities werden wiederverwendet und nur dort ergänzt, wo aktueller Code oder direkte UI-Consumer noch gegen diese Authorities driften.

```text
AGENTS.md / ADR-0096 Governance Control Plane
        |
        +--> bestehende ADR/ESS/Vocabulary/Transparency Authorities
        |
        +--> Supervisor + Domain Orchestrators        [fachliche Authority]
        |          |
        |          +--> AsyncExecutionPort            [nur Ausführungsmechanik]
        |                    |
        |                    +--> Inline Adapter       [heutiger Default]
        |                    +--> externer Adapter     [zukünftig, eigener Cutover]
        |
        +--> Operational System Event Journal          [UI/Observability Read Model]
        |          |
        |          X  keine Security-/Agent-Audit-Authority
        |          |
        |          +--> Supabase durable projection   [nach Production-Handoff]
        |
        +--> SupervisorDashboard                       [read-only Projektion]
                   X  keine simulierten Mutationen oder Betriebswerte
```

## 2. Konsolidierter Abgleich der Governance-Stränge

| Themenstrang | Aktuelle Authority / Evidence | Konsolidierte Entscheidung |
|---|---|---|
| Governance Control Plane / Supersession | ADR-0096 + Authority/Control/Document/ADR/ESS Registries | Wiederverwenden; keine zweite Registry/Policy-Ebene |
| Canonical Vocabulary Registry / UI Message Catalog | bestehende Vocabulary-Authorities + ADR-0096-Control-Plane-Validierung | Nicht neu definieren; nur abhängige Authority |
| AI Content Transparency Contract | bestehende Architecture/Compliance/Roadmap-Referenzen | Keine Parallelarchitektur; Runtime-Persistenz-Evidence bleibt eigener Follow-up-Gate |
| Documentary Hygiene / Versioning | ADR-0044 + Documentary Maintenance Control Loop | Production immutable/read-only; keine Runtime-Dokumentmutation |
| M10 / teure CI / Self-Heal | PR #471 + M10-Governance | PR #471 ist Upstream; M10 bleibt suspended/off |
| Agent Audit / OTEL | ADR-0059 + `agent_audit_events` + Telemetry | Unverändert; System Event Journal darf diese Authority nicht duplizieren |
| Event Mesh | ADR-0018 | Bleibt in-process Transport; kein Distributed Queue Claim |
| Render Stateless / Worker Separation | ADR-0037 + historischer Render-Audit | Providerneutralen Execution-Port implementieren; Render Workflows erst als späterer Adapter |
| System Events / Agent Dashboard | Legacy `server/systemEvents.ts` | Synthetic/File-State entfernen; nur operational read model/runtime-derived state |
| Agent Registration | Legacy Runtime-Route erzeugte Docs/ADRs | Runtime-Mutation stilllegen; Architekturänderung Branch/Registry/PR |
| Supervisor UI | Legacy simulierte Infrastruktur-/Backup-/Alert-/Circuit-Breaker-Daten und Mutationen | Direkten Consumer auf read-only, observed-only Projektion konsolidieren |

## 3. Upstream PR #471 und Stacking

PR #471 basierte ursprünglich auf `7d173d3239fdbe31216354fc848f948d517069f6`. Vor diesem Paket wurde er gegen `main` `6c90c04de8924b8783f23ab4789afa810e9ea3a8` geprüft.

Ergebnis:

- `main` war 69 Commits weiter;
- keiner der 15 durch PR #471 geänderten Pfade war in diesen Main-Änderungen erneut verändert worden;
- der PR-Branch wurde ohne Force-Update mit `main` zusammengeführt;
- synchronisierter PR-Head: `b8a78220c671df8cb3c35dfc5ba719b972e6ce69`;
- dieser Branch wurde direkt auf diesem Head angelegt;
- unmittelbar vor Draft PR #474 war `main` unverändert und PR #471 weiterhin offen/draft/mergefähig.

```text
main
  -> PR #471: Hosted validation cost / shadow attestation / self-heal suspension
       -> PR #474: Governance/runtime/UI convergence
```

Die Scopes bleiben getrennt. PR #474 ändert keine PR-471-Workflow-/Shadow-Attestation-Datei.

## 4. P0 — Operational System Event Integrity

### Ausgangslage

`server/systemEvents.ts` verwendete `uploads/system_events.json` als instanzlokalen State und erzeugte beim Fehlen der Datei synthetische Ereignisse. Damit konnten UI-Einträge wie echte Produktionshistorie erscheinen, obwohl sie nicht beobachtet worden waren.

### Umsetzung

- `uploads/system_events.json` vollständig entfernt;
- keine Synthetic/Seed Events mehr;
- `OperationalSystemEventJournal` eingeführt;
- non-production: bounded memory projection;
- Production mit konfiguriertem Supabase: `system_event_journal` als durable Operational Projection;
- Production ohne durable Store: explizit `degraded`, **kein** Local-FS-Fallback;
- API liefert `authority=operational-read-model` und `auditAuthority=false`;
- SSE und ADR-0018 Event Mesh bleiben additive Projektionen.

`system_event_journal` ist ausdrücklich **kein** Security-/Compliance-/Agent-Audit-Store. ADR-0059 und `agent_audit_events` bleiben für AI-assisted command audit/correlation allein zuständig.

Die Supabase-Migration ist nur repositoryseitige Deployment-Vorbereitung und wurde in diesem Paket **nicht** gegen Production angewendet.

## 5. P0 — Legacy Agent Registration / ADR Generation

Der alte `/agents/register`-Endpoint konnte lokale Agent-State-Dateien, Change-/Risk-Dokumente und selbst vergebene ADR-Nummern erzeugen. Das widersprach ADR-0044 und ADR-0096 inklusive Namespace Reservation und Branch/PR-Governance.

Umsetzung:

- Dateisystem-Agent-Registry entfernt;
- Agentenanzeige nur process-local Operational Telemetry;
- Aktivität ausschließlich aus echten `updateAgentActivity()`-Aufrufen;
- manuelles Status-Toggling -> `RUNTIME_DERIVED_STATE_REQUIRED`;
- Runtime-Agent-Registrierung -> `REPOSITORY_CONTROL_PLANE_REQUIRED`;
- keine Runtime-ADR-/Risk-/Change-Dokumentgenerierung mehr.

Neue Agent-/Orchestrator-Architektur bleibt eine normale Repository-Änderung: aktuelles Main -> Work Claim/ADR-Reservation falls erforderlich -> Code/Docs -> PR -> Human Merge.

## 6. P0 — Supervisor UI Consumer Convergence

Der bisherige `SupervisorDashboard.tsx` enthielt trotz bereits dokumentierter No-Demo-Data-Bereinigungen noch mehrere synthetische oder nur lokal simulierte Betriebsbehauptungen, unter anderem:

- Cloud-Run-/Firestore-/GCP-Angaben trotz Render/Supabase-Architektur;
- feste Health-/Latency-/Cost-Werte;
- erfundene Circuit-Breaker-Zustände und lokale Toggle-Mutationen;
- simulierte Alarmtrigger, die als System Events protokolliert wurden;
- ein „Backup“-Button, der kein Backup ausführte, aber einen festen SHA-/Erfolgsclaim erzeugte;
- Runtime-Agent-Register/Toggle-UI gegen inzwischen stillgelegte Backend-Grenzen;
- harte Gemini-/Version-/Infrastrukturwerte ohne aktuelle Evidence.

Umsetzung:

- Dashboard als **read-only Operational Projection** neu gefasst;
- ausschließlich echte Antworten von RequestOrchestrator, Supervisor, Agent- und Orchestrator-Projektionen werden angezeigt;
- fehlende Evidence erscheint als `nicht instrumentiert`;
- keine Circuit-Breaker-, Alert-, Backup- oder Agent-Architecture-Mutation im Dashboard;
- keine Synthetic Terminal-/Infrastructure-/Cost-History;
- VersionManager und M10-Passkey bleiben in ihren bestehenden separaten Authority-Komponenten eingebettet;
- Backend- und Frontend-Semantik sind damit konsistent.

## 7. P1 — Provider-neutral Async Execution Boundary

ADR-0037 §3.3 hat die Trennung von Request Plane und Background Execution bereits entschieden. Deshalb wird **keine neue ADR und keine zweite Orchestrator-Authority** erzeugt.

Implementiert wurde `src/platform/Supervisor/Execution/AsyncExecutionPort.ts`:

- serialisierbarer Task-Envelope;
- stabile `taskType`, `taskId`, `correlationId`;
- Execution Policy als Retry-/Timeout-Hinweis;
- providerneutraler `AsyncExecutionPort`;
- `InlineAsyncExecutionPort` als kompatibler Default;
- explizites Verbot, Domain-Orchestrator, Scoring-Modell, Policy-Outcome oder Mutation Authority zu wählen.

`createApplicationMarketDataRuntime()` führt Snapshot-Persistierung und Alert-Auswertung bereits über diese Grenze. Der Default bleibt inline und erhält das heutige Verhalten. Ein späterer Render-Workflows-Adapter kann dieselben Envelopes durable ausführen, ohne Domain-Routing zu übernehmen.

**Bewusst nicht umgesetzt:**

- kein Render SDK;
- keine zweite `workflows/`-Businessarchitektur;
- keine `render.yaml`-Pseudo-Konfiguration für Workflows;
- keine Production-Aktivierung;
- keine Änderung an `requestOrchestrator`;
- keine Änderung an ScoringDispatcher/Domain-Orchestratoren.

## 8. Dokumenten-State-Konvergenz

Der historische `RENDER_STATELESS_WEB_TIER_AUDIT_2026-08-03.md` wird nicht gelöscht oder rückwirkend umgeschrieben, weil er Audit-Evidence zum damaligen Zustand enthält.

`RENDER_RUNTIME_ASYNC_EXECUTION_STATUS_2026-08-21.md` ist stattdessen eine aktuelle, nicht konkurrierende Statusprojektion und ordnet alte Findings in `REMEDIATED`, `PARTIAL`, `OPEN` und `PRODUCTION-GATE` ein.

## 9. Offene externe Gates

Absichtlich nicht durch Repository-Code als erledigt deklariert:

1. Supabase-Migration `system_event_journal` nach Owner-Precheck in Production anwenden und Postcheck/Evidence erzeugen.
2. Danach Production-Durability des System-Event-Read-Models verifizieren.
3. Render Workflows nur als `AsyncExecutionPort`-Adapter pilotieren; kein direkter Domain-Orchestrator.
4. Pilot zunächst niedrigriskant; Market Refresh/Alerts erst nach Retry-/Idempotency-/Cost-Evidence extern umstellen.
5. Alert Delivery Outbox / Atomic Claim bleibt gesonderter P1-Datenintegritätsbefund.
6. Replica-invariante kritische Rate Limits bleiben Voraussetzung vor Scale-out.
7. M10 bleibt suspended/off bis zur eigenen Owner-Entscheidungskette.
8. AI Content Transparency Runtime-Persistenz muss gegen die bestehende Contract-Authority separat nachgewiesen werden; dieses Paket definiert sie nicht neu.

## 10. Tests / Negative Assurance

Neue Tests sichern:

- keine synthetische System-Event-Historie;
- kein `uploads/system_events.json` / `uploads/agents_registry.json`;
- keine Runtime-ADR-/Dokumentgenerierung;
- fehlende Production-Durability wird als degraded sichtbar;
- durable Operational Projection bleibt `auditAuthority=false`;
- Async Execution Envelope fail-closed bei ungültigen Metadaten / unbekannten Task Types;
- kanonischer Async Port enthält keine Render-Abhängigkeit und keine Domain-Orchestrator-Authority;
- Supervisor UI enthält keine bekannten Synthetic-Infra-/Backup-/Alert-Claims und keine retired Agent-Mutation-Endpunkte.

## 11. Definition of Done

- [x] PR #471 gegen aktuellen Main geprüft und konfliktfrei synchronisiert.
- [x] neuer Branch direkt auf synchronisiertem PR-471-Head erstellt.
- [x] exklusiver Work Claim mit Authority-/Pfadgrenzen angelegt.
- [x] Synthetic System Event Seeds entfernt.
- [x] Production Local-FS-System-Event-Authority entfernt.
- [x] Runtime Agent Registry File Authority entfernt.
- [x] Runtime ADR-/Dokument-Generator stillgelegt.
- [x] operative Agent-State-Manipulation stillgelegt; Status runtime-derived.
- [x] direkter Supervisor-UI-Consumer auf observed-only/read-only Semantik konsolidiert.
- [x] providerneutraler AsyncExecutionPort implementiert.
- [x] Market Snapshot-/Alert-Folgejobs über Execution Boundary geführt, Default weiterhin inline.
- [x] Supabase-Migration als nicht angewandter Production-Handoff vorbereitet.
- [x] historische Render-Findings als aktuelle Statusprojektion neu bewertet.
- [x] keine neue Vocabulary-, Transparency-, Audit-, Documentary-, Scoring- oder Orchestrator-Authority angelegt.
- [x] Draft PR #474 auf PR #471 gestapelt.
- [ ] finaler Abgleich gegen den dann aktuellen `main` vor Retarget auf `main`.
- [ ] finaler Abgleich gegen den dann aktuellen PR-471-Head vor Retarget.
- [ ] kanonische Production-Baseline nach Retarget auf `main` maschinell rendern.
- [ ] Repository-/CI-Validierung auf finalem gestapeltem/retargeted Head.
- [ ] separate Owner-Freigabe für jede Supabase-/Render-Production-Mutation.
