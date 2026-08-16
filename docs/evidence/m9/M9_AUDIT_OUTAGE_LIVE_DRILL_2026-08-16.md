# M9 — Audit-Completeness/Outage Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS (Assurance Domain 5; M9 overall remains NOT COMPLETE)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 5,
§„Evidence Schema"; Owner-Autorisierung: explizite Wahl „Audit-Outage-Drill (empfohlen)" via
`AskUserQuestion` in dieser Sitzung, 2026-08-16, im Anschluss an
`docs/evidence/m9/M9_ROLLBACK_RECOVERY_LIVE_DRILL_2026-08-16.md`.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt **Assurance Domain 5 (Audit Completeness / Outage)** und trägt zu
**M9-Exit-Gate-Punkt 2** bei. Er ist **nicht** M9-Closure.

**Bereits vor diesem Drill abgedeckt** (nicht dupliziert, nur zitiert):
- Korrelation über `auditCorrelationId` (Request/Trace/Session) war bereits durch bestehende Tests
  bewiesen (`docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md`,
  `docs/evidence/sa3/SA3_SYSTEMADMIN_AUDIT_CORRELATION_EVIDENCE.md`).
- „Audit-Persistenzausfall verhindert autonome Mutation" für die **Autorisierungsphase** war
  bereits durch einen bestehenden Test bewiesen: `tests/unit/systemadminAuditedExecution.test.ts`
  „fails closed before returning a permit when audit persistence is unavailable".

**Neu durch diesen Drill abgedeckt** (die drei Lücken aus
`M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md` §2.5 — „Audit-Persistenzausfall verhindert
autonome Mutation" war nur für die Autorisierungsphase bewiesen, nicht für die Terminalphase; kein
struktureller Append-only-Beweis; keine end-to-end-Korrelationsprobe für eine echte mutierende
Capability):

1. Persistenzausfall während des **terminalen** SUCCESS/ERROR-Schreibvorgangs (nach einer bereits
   erfolgten, erlaubten Autorisierung) muss ebenfalls fail-closed sein — kein Aufrufer darf einen
   fabrizierten Erfolg für ein Mutationsereignis beobachten, dessen Abschluss tatsächlich nicht
   durchhaltbar persistiert wurde.
2. Struktureller (nicht nur verhaltensbasierter) Beweis, dass die Audit-Senke ausschließlich
   `insert` unterstützt — kein `update`/`delete` ist am Mock-Kontrakt selbst überhaupt aufrufbar.
3. End-to-end-Korrelation (`humanActorId`/`agentId`/`sessionId`/`requestId`/`targetResource`/
   `capability`/`result`) über Autorisierungs- UND Terminalereignis hinweg, für eine echte
   mutierende Capability (`BRANCH`), nicht nur den generischen Default-Fall.

**„Read-only operator visibility can remain available"** (Runbook-Erwartung 6 dieser Domain) ist
kein Gegenstand dieses Code-Drills — dafür existiert bereits `src/components/AuditLogs.tsx` als
UI-Lesepfad; ein eigener Nachweis dafür würde eine UI-/E2E-Drill-Form erfordern, die außerhalb des
Scopes dieses Owner-autorisierten Drills liegt.

## 1. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-AUDIT-OUTAGE-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T10:16:47Z |
| Exakte Baseline | Commit `3fd86ea2f3d85f2331d545c8673e100036fd30e5` (main, nach Merge PR #385) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0059 (Audit), ADR-0065/SA3, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `BRANCH` (MEDIUM), Ziel `github:SvenKulessa/Finance`, Audit-Tabelle `agent_audit_events` |

## 2. Angriffs-/Testaufbau

Erweitert `tests/unit/systemadminAuditedExecution.test.ts` um den Describe-Block „M9
Audit-Completeness/Outage Live-Drill (I2 Assurance, 2026-08-16)" mit 3 neuen Tests gegen die reale
live-wired SA3B-Kette und den realen, unveränderten `writeAgentAuditEvent()`
(`server/agentAudit/agentAuditWriter.ts`):

1. **Terminal-Outage-Fehlerinjektion:** eine reale `ALLOW`-Autorisierung wird erfolgreich
   abgeschlossen (Autorisierungs-Audit-Write erfolgreich); erst der darauffolgende
   `recordSystemadminAuditedOutcome`-Aufruf schlägt bei der Persistenz fehl (simulierter
   Supabase-Fehler). Erwartung: `recordSystemadminAuditedOutcome` wirft
   `durable audit persistence failed`, gibt keinen fabrizierten Erfolg zurück.
2. **Struktureller Append-only-Beweis:** der gemockte Tabellen-Handle
   (`getPrivilegedServerSupabase().from('agent_audit_events')`) wird direkt inspiziert — er besitzt
   ausschließlich eine `insert`-Methode; `'update' in handle` und `'delete' in handle` sind
   `false`. Ein realer `.update()`/`.delete()`-Aufruf im Produktionscode würde am Mock-Kontrakt
   sofort mit „is not a function" scheitern, nicht nur an dieser einen Prüfung.
3. **End-to-end-Korrelationsprobe:** für `BRANCH` (echte mutierende Capability) werden sowohl der
   Autorisierungs- als auch der Terminal-Audit-Write-Payload direkt inspiziert (`mocks.insert.mock.
   calls[0]`/`[1]`) und gegen `agent_id`, `app_id`, `capability`, `authorization_decision`,
   `scope.targetResource` und `scope.auditCorrelationId` geprüft — identisch über beide Ereignisse
   hinweg, abgeleitet aus `requestId:traceId:sessionId`.

## 3. Erwartetes vs. tatsächliches Ergebnis

| Runbook-Erwartung (Domain 5) | Tatsächliches Ergebnis |
|---|---|
| Authorization event before mutation | ✅ bereits bewiesen (Autorisierungs-Write erfolgt vor Permit-Rückgabe, unverändert seit M8) |
| Terminal SUCCESS/ERROR event after attempt | ✅ neu bewiesen: Persistenzausfall bei diesem Schritt ist fail-closed, kein fabrizierter Erfolg |
| Correlation across actor/agent/session/request/target/capability/result | ✅ neu bewiesen end-to-end für eine echte mutierende Capability (zuvor nur generischer Default-Fall) |
| No UPDATE of append-only authorization evidence | ✅ neu strukturell bewiesen (nicht nur Verhaltens-, sondern Kontraktebene) |
| Audit persistence failure prevents autonomous mutation | ✅ Autorisierungsphase bereits bewiesen (M8); Terminalphase jetzt ebenfalls bewiesen (dieser Drill) |
| Read-only operator visibility can remain available | N/A für diesen Code-Drill (siehe §0) |

**Testlauf:** `npx vitest run` — **1095 Tests, 189 Dateien, alle PASS** (davon neu: 3, in
`tests/unit/systemadminAuditedExecution.test.ts`). `npm run lint` (`tsc --noEmit`) PASS.

## 4. Seiteneffekt-/Rollback-Zustand

Kein Seiteneffekt: die simulierten Persistenzausfälle sind gemockte Supabase-Antworten in der
Testumgebung, keine reale Infrastrukturänderung. Kein Rollback erforderlich.

## 5. Residual Findings

Kein neuer ungeklärter CRITICAL-Fund. „Read-only operator visibility" (§0) bleibt als bewusst
nicht in diesem Drill abgedeckter Punkt dokumentiert — `AuditLogs.tsx` existiert bereits als
UI-Lesepfad, ein dedizierter Nachweis dafür ist ein möglicher zukünftiger Schritt, kein Blocker.

## 6. Bezug zum M9-Exit-Gate

- Punkt 2 „all required authorization/injection/replay/exfiltration/audit drills PASS": trägt den
  Audit-Anteil bei (teilweise — Injection/Replay/Exfiltration-Drills bleiben offen).
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf, bis auch die übrigen
  Exit-Gate-Punkte erfüllt sind; dieser Drill allein schließt M9 nicht ab.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`
- `docs/evidence/m9/M9_ROLLBACK_RECOVERY_LIVE_DRILL_2026-08-16.md`
- `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md`
- `tests/unit/systemadminAuditedExecution.test.ts`
- `server/agentAudit/agentAuditWriter.ts`
- `server/agentAudit/systemadminAuditedExecution.ts`
