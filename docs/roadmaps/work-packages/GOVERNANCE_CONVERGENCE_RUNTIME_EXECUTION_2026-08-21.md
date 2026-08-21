# Governance Convergence & Runtime Execution — 2026-08-21

**Work Package ID:** `WP-GOV-RUNTIME-CONVERGENCE-2026-08-21`  
**Status:** IMPLEMENTED IN STACKED BRANCH / EXTERNAL PRODUCTION GATES OPEN  
**Branch:** `agent/governance-convergence-runtime-execution-2026-08-21`  
**Upstream PR:** `#471` (`agent/hosted-validation-cost-s0-s3-2026-08-21`)  
**Initial main:** `6c90c04de8924b8783f23ab4789afa810e9ea3a8`  
**Primary authorities:** ADR-0096, ADR-0037, ADR-0044, ADR-0059, ADR-0018, AGENTS.md  
**Non-scope:** M10 reactivation, Render/Supabase/Stripe production mutation, new scoring authority, new Vocabulary/Transparency authority

## 1. Ziel

Dieses Paket konsolidiert die noch offenen Governance- und Runtime-Gaps aus den parallel geführten CAPITAL-AI-Governance-Arbeiten in **einer** umsetzbaren Kette. Es erzeugt keine neue Governance Control Plane und keine neue Master-Roadmap. Bestehende Authorities werden wiederverwendet und nur dort ergänzt, wo der aktuelle Code noch gegen diese Authorities driftet.

Die Wertschöpfungskette lautet:

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
                   |
                   X  keine Security-/Agent-Audit-Authority
                   |
                   +--> Supabase durable projection   [nach Production-Handoff]
```

## 2. Konsolidierter Abgleich der Governance-Chats

| Themenstrang | Aktuelle Authority / Evidence | Konsolidierte Entscheidung |
|---|---|---|
| Governance Control Plane / Supersession | ADR-0096 + Authority/Control/Document/ADR/ESS Registries | Wiederverwenden; keine zweite Registry/Policy-Ebene |
| Canonical Vocabulary Registry / UI Message Catalog | bestehende ADR-0096-Control-Plane-Validierung und Vocabulary-Authorities | Nicht in diesem Paket neu definieren; nur als abhängige Authority referenzieren |
| AI Content Transparency Contract | bestehende Architecture/Compliance/Roadmap-Referenzen | Keine Parallelarchitektur; Runtime-Persistenz-Evidence bleibt eigener fachlicher Follow-up-Gate |
| Documentary Hygiene / Versioning | ADR-0044 + Documentary Maintenance Control Loop | Production bleibt immutable/read-only; keine Runtime-Dokumentmutation |
| M10 / teure CI / Self-Heal | PR #471 + M10-Governance | PR #471 ist Upstream; M10 bleibt suspended/off |
| Agent Audit / OTEL | ADR-0059 + `agent_audit_events` + Telemetry | Unverändert; System Event Journal darf diese Authority nicht duplizieren |
| Event Mesh | ADR-0018 | Bleibt in-process Transport; kein Distributed Queue Claim |
| Render Stateless / Worker Separation | ADR-0037 + historischer Render-Audit | Providerneutralen Execution-Port implementieren; Render Workflows erst als späterer Adapter |
| System Events / Agent Dashboard | Legacy `server/systemEvents.ts` | Synthetic/File-State entfernen; nur runtime-derived Operational Projection |
| Agent Registration | Legacy Runtime-Route erzeugte Docs/ADRs | Runtime-Mutation stilllegen; Architekturänderung ausschließlich Branch/Registry/PR |

## 3. Upstream PR #471 und Stacking

PR #471 basierte ursprünglich auf `7d173d3239fdbe31216354fc848f948d517069f6`. Vor diesem Paket wurde er gegen den aktuellen `main` `6c90c04de8924b8783f23ab4789afa810e9ea3a8` geprüft.

Ergebnis:

- `main` war 69 Commits weiter;
- keiner der 15 durch PR #471 geänderten Pfade war in diesen Main-Änderungen erneut verändert worden;
- der PR-Branch wurde ohne Force-Update mit `main` zusammengeführt;
- synchronisierter PR-Head: `b8a78220c671df8cb3c35dfc5ba719b972e6ce69`;
- dieser Branch wurde direkt auf diesem Head angelegt.

Damit ist die Kette bewusst gestapelt:

```text
main
  -> PR #471: Hosted validation cost / shadow attestation / self-heal suspension
       -> dieses Work Package: Governance/runtime convergence
```

Die beiden Scopes bleiben getrennt. Dieses Paket ändert keine PR-471-Workflow-/Shadow-Attestation-Dateien.

## 4. P0 — Operational System Event Integrity

### Ausgangslage

`server/systemEvents.ts` verwendete `uploads/system_events.json` als instanzlokalen State und erzeugte beim Fehlen der Datei mehrere synthetische Ereignisse. Damit konnten UI-Einträge wie echte Produktionshistorie erscheinen, obwohl sie nicht beobachtet worden waren.

### Umsetzung

- `uploads/system_events.json` vollständig aus der System-Event-Kette entfernt;
- keine Synthetic/Seed Events mehr;
- `OperationalSystemEventJournal` eingeführt;
- nicht-produktive Umgebung: bounded memory projection;
- Production mit konfiguriertem Supabase: `system_event_journal` als durable Operational Projection;
- Production ohne durable Store: expliziter `degraded`-Status, **kein** Dateisystem-Fallback;
- API liefert `authority=operational-read-model` und `auditAuthority=false`;
- SSE und ADR-0018 Event Mesh bleiben additive Projektionen.

### Authority-Grenze

`system_event_journal` ist ausdrücklich **kein** Security-/Compliance-/Agent-Audit-Store. ADR-0059 und `agent_audit_events` bleiben für AI-assisted command audit/correlation allein zuständig.

Die neue Supabase-Migration ist repositoryseitige Deployment-Vorbereitung. Sie wurde in diesem Work Package **nicht** gegen Production angewendet.

## 5. P0 — Legacy Agent Registration / ADR Generation

Der alte `/agents/register`-Endpoint konnte:

- eine lokale Agent Registry schreiben;
- Change- und Risk-Dokumente erzeugen;
- ADR-Nummern per Dateiscan selbst vergeben;
- `docs/**` direkt verändern;
- Documentary-Verarbeitung per Timer auslösen.

Das widerspricht ADR-0044 und ADR-0096 inklusive Namespace Reservation / Branch-PR-Governance.

Umsetzung:

- Dateisystem-Agent-Registry entfernt;
- Agentenanzeige ist nur noch process-local Operational Telemetry;
- Aktivität wird ausschließlich aus echten `updateAgentActivity()`-Aufrufen abgeleitet;
- manuelles Status-Toggling wird mit `RUNTIME_DERIVED_STATE_REQUIRED` abgewiesen;
- Runtime-Agent-Registrierung wird mit `REPOSITORY_CONTROL_PLANE_REQUIRED` abgewiesen;
- keine Runtime-ADR-/Risk-/Change-Dokumentgenerierung mehr.

Neue Agent-/Orchestrator-Architektur bleibt damit eine normale Repository-Änderung: aktuelles Main -> Work Claim/ADR-Reservation falls erforderlich -> Code/Docs -> PR -> Human Merge.

## 6. P1 — Provider-neutral Async Execution Boundary

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
- keine neue `workflows/`-Domainarchitektur;
- keine `render.yaml`-Pseudo-Konfiguration für Workflows;
- keine Production-Aktivierung;
- keine Änderung an `requestOrchestrator` (HTTP Admission Control bleibt separat);
- keine Änderung an ScoringDispatcher/Domain-Orchestratoren.

## 7. Dokumenten-State-Konvergenz

Der historische `RENDER_STATELESS_WEB_TIER_AUDIT_2026-08-03.md` wird nicht gelöscht oder rückwirkend umgeschrieben, weil er Audit-Evidence zum damaligen Zustand enthält.

Stattdessen wird mit `RENDER_RUNTIME_ASYNC_EXECUTION_STATUS_2026-08-21.md` eine aktuelle, nicht konkurrierende Statusprojektion erzeugt. Sie ordnet alte Findings in `REMEDIATED`, `PARTIAL`, `OPEN` und `PRODUCTION-GATE` ein und verweist auf die heutigen Authorities.

## 8. Offene externe Gates nach diesem Paket

Diese Punkte sind absichtlich **nicht** durch Repository-Code allein als erledigt zu deklarieren:

1. Supabase-Migration `system_event_journal` nach Owner-Precheck in Production anwenden und Postcheck/Evidence erzeugen.
2. Erst danach Production-Durability des System-Event-Read-Models verifizieren.
3. Render Workflows nur als `AsyncExecutionPort`-Adapter pilotieren; kein direkter Domain-Orchestrator.
4. Pilot zunächst für niedrigriskante asynchrone Arbeit; Market Refresh/Alerts erst nach Retry-/Idempotency-/Cost-Evidence extern umstellen.
5. Alert Delivery Outbox / Atomic Claim bleibt gesonderter P1-Datenintegritätsbefund.
6. Replica-invariante kritische Rate Limits bleiben Voraussetzung vor Scale-out.
7. M10 bleibt suspended/off bis die eigene Owner-Entscheidungskette erfüllt ist.
8. AI Content Transparency Runtime-Persistenz muss gegen die bestehende Contract-Authority separat nachgewiesen werden; dieses Paket definiert sie nicht neu.

## 9. Tests / Negative Assurance

Neue Tests sichern:

- keine synthetische System-Event-Historie;
- kein `uploads/system_events.json` oder `uploads/agents_registry.json`;
- kein Runtime-`fs.writeFileSync` in `systemEvents.ts`;
- kein Runtime-ADR-Dateiscan/-Generator;
- fehlende Production-Durability wird als degraded sichtbar;
- durable Operational Projection bleibt `auditAuthority=false`;
- Async Execution Envelope validiert erforderliche Metadaten fail-closed;
- unbekannte Inline Task Types werden abgelehnt;
- kanonischer Async Port enthält keine Render-Abhängigkeit und keine Domain-Orchestrator-Authority.

## 10. Definition of Done

- [x] PR #471 gegen aktuellen Main geprüft und konfliktfrei synchronisiert.
- [x] neuer Branch direkt auf synchronisiertem PR-471-Head erstellt.
- [x] exklusiver Work Claim mit Authority-/Pfadgrenzen angelegt.
- [x] Synthetic System Event Seeds entfernt.
- [x] Production Local-FS-System-Event-Authority entfernt.
- [x] Runtime Agent Registry File Authority entfernt.
- [x] Runtime ADR-/Dokument-Generator aus Agent Registration entfernt/stillgelegt.
- [x] operative Agent-State-Manipulation stillgelegt; Status runtime-derived.
- [x] providerneutraler AsyncExecutionPort implementiert.
- [x] Market Snapshot-/Alert-Folgejobs über Execution Boundary geführt, Default weiterhin inline.
- [x] Supabase-Migration als nicht angewandter Production-Handoff vorbereitet.
- [x] historische Render-Findings als aktuelle Statusprojektion neu bewertet.
- [x] keine neue Vocabulary-, Transparency-, Audit-, Documentary-, Scoring- oder Orchestrator-Authority angelegt.
- [ ] finaler Abgleich gegen den dann aktuellen `main` vor Draft PR.
- [ ] finaler Abgleich gegen den dann aktuellen PR-471-Head vor Draft PR.
- [ ] Repository-/CI-Validierung auf finalem gestapeltem Head.
- [ ] separate Owner-Freigabe für jede Supabase-/Render-Production-Mutation.
