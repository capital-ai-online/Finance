# ESS-0018 — Agentic Supabase Tool Governance

## Enterprise Specification

**Version:** 1.0.0
**Status:** Enterprise Specification
**Implementation Status:** PHASE 1 IMPLEMENTED / PHASE 2 VOLLSTAENDIG UMGESETZT (Foundation + beide in §4.2 spezifizierten Schreib-Capabilities)
**Owner:** Platform Director
**Security Authority:** CAPITAL-AI IAM / Security & Compliance
**Related ADR:** ADR-0043 (Supabase Privilege Separation), ADR-0050 (Agent Tool & Capability IAM Foundation, Phase 1), ADR-0051 (Capability/Grant IAM & Approval Workflow, Phase 2)
**Related ESS:** ESS-0001-CONTRACTS, ESS-0014, ESS-0016

---

## 1. Zweck

ESS-0018 definiert die verbindliche Architektur dafür, wie CAPITAL-AI-KI-Agenten kontrolliert auf
die eigene Supabase-Datenbank zugreifen dürfen. Ziel ist eine auditierbare, least-privilege
Agent-Fähigkeits-Ebene, die niemals über den privilegierten Datenbankzugriff hinausgeht, den ein
menschlicher Administrator ohnehin schon hat, und die niemals Rohzugriff (raw SQL, Schema-Mutation,
Projekt-Verwaltung) an ein Sprachmodell delegiert.

Diese Spezifikation deckt zwei konkrete Agenten ab:

1. **Screening/Scoring-Erklärbarkeits-Agent** — lesend, erklärt bereits persistierte
   Scoring-Ergebnisse anhand zitierter Datenbank-Evidenz. **Phase 1, implementiert.**
2. **Admin/Support/Diagnose-Agent** — für CAPITAL-AI-Systemadministratoren, lesend plus eng
   umrissene, freigegebene Schreiboperationen, gekoppelt an Compliance (Policy-Oberfläche) und
   Supervisor (Ausführungs-Wrapper). **Phase 2, Foundation implementiert (ADR-0051); beide in
   §4.2 spezifizierten Schreib-Capabilities (`alert_subscription.disable`,
   `alert_subscription.resend_confirmation`) implementiert.**

## 2. Ausgangslage (Stand 2026-08-09, verifiziert im Code)

- Es existiert **kein** MCP-Server-Code in `src/` oder `server/`. MCP ist bislang ausschließlich
  Spezifikation (ADR-0041: „SPECIFIED / NOT YET IMPLEMENTED"). Der einzige real laufende MCP-Server
  (`ga4-analytics`, `.mcp.json`) ist Entwickler-Tooling für Claude-Code-Sitzungen — kein Muster für
  In-App-Agenten-Fähigkeiten.
- Agenten (`src/agents/*.ts`) erzeugen bislang ausschließlich strukturiertes JSON/Freitext über
  `src/services/agentModelRouting.ts` (Anthropic → OpenAI → Gemini-Fallback). Es gab vor Phase 1
  **kein** Tool-/Function-Calling im Agentensystem.
- IAM (`src/platform/Security/authMiddleware.ts`) kennt ausschließlich grobe Rollen
  (`'owner'|'admin'|'supervisor'|'user'`), **kein** Capability-/Grant-System.
- `Supervisor` (`src/platform/Supervisor/supervisor.ts`) ist real, aber Retry-/Observability-Wrapper
  — kein Approval-Gate. `Compliance` (`src/platform/Compliance/`) ist real, aber ein statischer
  Security-Scanner ohne Laufzeit-Autorität (eigener Code-Kommentar: „darf keine Berechtigungen
  vergeben, keine IAM-Regeln verändern, keine Sicherheitsmechanismen umgehen").
- Das in CLAUDE.md geforderte Kettenmodell `Policy -> IAM/Grant -> Approval -> Dry-run ->
  Fingerprint -> Apply -> Verify -> Audit` existiert für Provider-Mutationen bislang nirgends als
  Laufzeit-Code.
- ADR-0043 trennt `getPrivilegedServerSupabase()` (Secret/Service-Role, umgeht RLS,
  backend-only) strikt von `getRlsServerSupabase()` (Publishable/Anon, kein privilegierter
  Fallback). `score_snapshots` und `alert_subscriptions` haben keine `user_id`-Spalte und eine
  RLS-Policy, die ausschließlich `service_role`-Zugriff erlaubt — das ist gewollt (globale
  Symbol-/Betriebsdaten, keine personenbezogenen Datensätze).

**Konsequenz:** Phase 1 baute die kleinstmögliche echte, sichere Scheibe (ein lesendes Tool, ein
Agent, ein Endpunkt). Phase 2 (ADR-0051) hat die Capability-IAM, das Approval-Artefakt und die
Compliance/Supervisor-Gates additiv nachgezogen und an einer real angebundenen, bewusst
risikoarmen Schreib-Capability bewiesen — ohne einen der oben genannten, damals als
sicherheitskritisch identifizierten Bestandteile zu verändern.

## 3. Systemgrenzen

```text
Screening/Scoring-Engines (deterministisch)
        |
        v
score_snapshots (Supabase, service-role-only RLS)
        |
        v
SupabaseScoreEvidenceTool  [READ-ONLY, allowlisted parametrisierte Query]
        |
        v
Row-Evidence-Bundle (Zitat, Qualitätsverdikt HIGH/MEDIUM/LOW/NO_EVIDENCE, fail-closed)
        |
        v
ScoreExplainabilityAgent  ->  generateTextWithFallback (unverändert)
        |
        v
GET /api/scoring/explain/:symbol  (Admin/Supervisor-Rolle erforderlich, kein Browser-anonymer Zugriff)
```

Kein Netzwerkpfad, kein MCP-Protokoll-Server, kein Schreibpfad in Phase 1. Die Agent-Plane bleibt
strikt vom deterministischen Scoring-Runtime-Pfad (`server/scoreValidation.ts`,
`recordDailySnapshots`) getrennt — der Agent liest nur, er beeinflusst niemals den persistierten
Score.

## 4. Capability Policy

### 4.1 Phase 1 — Screening/Scoring-Erklärbarkeits-Agent (implementiert)

Erlaubt:

```text
supabase.score_snapshots.read
```

Konkret: eine einzige, allowlisted parametrisierte Lesefunktion
(`getScoreSnapshotEvidence(symbol, fromDate?, toDate?)`), ausschließlich über den
Supabase-JS-Query-Builder (`.eq/.gte/.lte/.order/.limit`), niemals String-Konkatenation, niemals
freie SQL-Eingabe vom Modell. Symbol und Datumsangaben werden vor jeder Abfrage validiert
(Regex-Whitelist), nicht erst nach Rückgabe gefiltert.

Nicht erlaubt (Phase 1):

```text
supabase.*.write
supabase.sql.execute
supabase.schema.*
supabase.project.*
supabase.alert_subscriptions.*   (kein Anwendungsfall in Phase 1)
```

### 4.2 Phase 2 — Admin/Support/Diagnose-Agent (Foundation + eine Schreib-Capability implementiert, ADR-0051)

Implementierte Capability-Namen (`src/platform/Security/capabilities.ts`, `CAPABILITIES`):

```text
supabase.admin.diagnostics.read                          (Lesen, implementiert — inkl. Quota-Auswertung
                                                            fuer eine E-Mail; eine gesonderte
                                                            supabase.admin.quota.read-Capability wurde
                                                            NICHT angelegt, siehe Anmerkung unten)
supabase.admin.subscription_status.read                  (Lesen, implementiert)
supabase.admin.alert_subscription.disable                (Schreiben, implementiert — erste reale Schreib-Capability, ADR-0051)
supabase.admin.alert_subscription.resend_confirmation    (Schreiben, implementiert — zweite Schreib-Capability, demselben Muster folgend)
```

**Anmerkung zu `quota.read`:** §4.2 hatte urspruenglich eine eigene `supabase.admin.quota.read`-Capability
vorgesehen. In der tatsaechlichen Implementierung (`getAdminDiagnostics()`,
`src/services/agentTools/supabaseAdminDiagnosticsTool.ts`) liefert der bereits bestehende
`ADMIN_DIAGNOSTICS_READ`-Aufruf Subscription-Tier UND Quota in einem Aufruf zurueck — eine separate
Capability haette hier nur denselben, bereits gelesenen Datensatz nochmal gated, ohne einen
zusaetzlichen Angriffsflaechen- oder Autorisierungsgewinn. Diese Spezifikation wird daher als durch
`ADMIN_DIAGNOSTICS_READ` erfuellt betrachtet, nicht als separat offener Punkt.

Keine weiteren offenen Schreib-Capabilities aus §4.2.

Explizit **nicht** Bestandteil dieser ESS und in keiner Phase vorgesehen:

```text
supabase.sql.execute            (kein Raw-SQL-Tool für ein Modell, niemals)
supabase.admin.migration.apply
supabase.admin.project.pause
supabase.admin.project.delete
supabase.admin.branch.*
supabase.admin.user.role.grant  (IAM-Rollenvergabe bleibt menschliche Owner-Aktion, siehe CLAUDE.md)
```

Jede Phase-2-Schreib-Capability MUSS an die vollständige, in CLAUDE.md verbindlich vorgeschriebene
Kette gebunden sein:

```text
Policy -> IAM/Grant -> Approval -> Dry-run -> Fingerprint -> Apply -> Verify -> Audit
```

mit `Compliance` (`src/platform/Compliance/PolicyGate.ts`, additiv neben dem unveränderten
Ganz-App-Auditor) als Policy-Oberfläche und `Supervisor`
(`executeApprovedSupervisedAction()`, additiv neben dem unveränderten `executeSupervised()`) als
Ausführungs-Wrapper, der Approval-Konsum vor jedem Apply erzwingt. Fingerprint-Prüfung ist Aufgabe
des jeweiligen Schreib-Tools (siehe ADR-0051). Für `supabase.admin.alert_subscription.disable` UND
`supabase.admin.alert_subscription.resend_confirmation` ist diese Kette jetzt real implementiert,
jeweils mit eigenem, auf die konkrete Mutation zugeschnittenem Fingerprint (Zeilen-Zustand bei
`disable`, `confirmed`-Flag bei `resend_confirmation` — ein erneuter Versand ist ein realer
Seiteneffekt, auch wenn er im Regelfall keine Zeile mutiert).

## 5. MCP-Ebene

Phase 1 baut **keinen** MCP-Protokoll-Server (kein stdio, kein Streamable HTTP). Begründung: das
einzige reale MCP-Muster im Repo (`ga4-analytics`) ist externes Dev-Tooling für Claude-Code, kein
In-App-Agenten-Muster; In-App-Fähigkeiten sind bislang immer einfache interne TypeScript-Services.
Mit genau einem internen Aufrufer (`ScoreExplainabilityAgent`) würde MCP-Protokoll-Maschinerie
(Transport, Tool-Schema, eigene Prozessgrenze) Komplexität ohne Nutzen hinzufügen.

**Auslöser für eine spätere MCP-Protokoll-Ebene:** sobald ein zweiter echter, unabhängiger
Konsument entsteht — z. B. eine externe Ops-Oberfläche, oder der Phase-2-Admin-Agent, der aus
Isolationsgründen (Schreibrechte!) eine eigene Prozess-/Vertrauensgrenze braucht. Erst dann wird
geprüft, ob ein echter MCP-Server (analog zur in ADR-0041 spezifizierten, aber nie gebauten
Provisioner-Architektur) den Aufwand rechtfertigt.

## 6. Secrets und Zugriff

- Kein neues Secret in Phase 1. `getPrivilegedServerSupabase()` (`server/db.ts`) wird
  unverändert wiederverwendet — score_snapshots ist bewusst service-role-only, ein Zugriff über den
  RLS-gebundenen Client würde grundsätzlich null Zeilen liefern.
- `SupabaseScoreEvidenceTool` und `ScoreExplainabilityAgent` sind **backend-only**. Kein Import aus
  Vite-/Browser-erreichbarem `src/`-Code außerhalb von Server-Routern erlaubt.
- Der HTTP-Endpunkt (`server/scoreExplainability.ts`) erfordert `checkAdminAccess` mit
  `SUPERVISOR_ZONE_ROLES` (owner/admin/supervisor) — kein anonymer, kein reiner `user`-Zugriff.
- Jeder Tool-Aufruf wird über `logSystemEvent('ORCHESTRATOR', ...)` protokolliert: Symbol,
  Datumsbereich, Zeilenanzahl, Qualitätsverdikt — niemals der Datensatzinhalt selbst.

## 7. Acceptance Criteria

**Phase 1 (diese ESS gilt für Phase 1 als umgesetzt, wenn:)**

- `getScoreSnapshotEvidence` existiert, exportiert keine Write/Upsert/Delete-Funktion, nutzt
  ausschließlich den Supabase-JS-Query-Builder mit validierten Eingaben.
- Der Ergebnis-Bundle-Typ liefert ein fail-closed `NO_EVIDENCE`-Verdikt bei leeren Ergebnissen statt
  eine erfundene Erklärung.
- `ScoreExplainabilityAgent` erfindet keine Erklärung ohne Evidenz und zitiert die tatsächlich
  gelesenen Snapshots.
- `GET /api/scoring/explain/:symbol` verlangt `checkAdminAccess` und ist ohne gültigen
  Admin/Supervisor-Token nicht erreichbar.
- Unit-Tests decken Qualitätsverdikt-Schwellenwerte, Eingabevalidierung und die exakte
  Query-Builder-Aufrufform ab.
- `npm run lint`, `npm test`, `npm run build`, `npm run predeploy:check` sind grün.

**Phase 2 — Foundation + erste Schreib-Capability (ADR-0051, umgesetzt, wenn:)**

- `checkCapability()` fail-closed bei jedem DB-/Verbindungsfehler, keine Wildcard-Capability
  erreichbar.
- `consumeApproval()` verweigert fehlende, abgelaufene, bereits verbrauchte und
  plan-/aktions-fremde Genehmigungen; Konsum ist atomar/race-sicher (Single-Use).
- `evaluateWritePolicy()`/`evaluateReadPolicy()` lassen ausschließlich die dokumentierte Allowlist
  zu, jede Raw-SQL-förmige Capability erhält `DENY`.
- `executeApprovedSupervisedAction()` ruft die eigentliche Aktion niemals ohne konsumiertes,
  passendes Approval auf; ein `DENY` an der Policy-Stufe erreicht die Approval-Stufe gar nicht
  erst.
- `disableAlertSubscription()` verweigert Apply bei Fingerprint-Mismatch (fail-closed statt
  stillem Überschreiben) und ist bei bereits inaktiver Zeile idempotent.
- `resendAlertSubscriptionConfirmation()` verweigert Apply bei Fingerprint-Mismatch, ist bei
  bereits bestätigtem Abo idempotent (kein Mailversand) und wirft statt still zu "erfolgreich"
  zu werden, wenn der Mailversand selbst fehlschlägt.
- Grant-/Approval-Ausstellung ist ausschließlich hinter Owner-Rolle + frischem TOTP-Step-up
  erreichbar (`428` ohne Step-up, analog `VersionManager`).
- `npm run lint`, `npm test`, `npm run build`, `npm run predeploy:check` sind grün.

**Weiterhin offen:** ein UI für Grant-/Approval-Verwaltung, und die produktive Anwendung der
beiden Phase-2-Migrationen gegen die echte Supabase-Instanz (bleibt kontrolliertes Handoff,
CLAUDE.md). Keine offenen Schreib-Capabilities aus §4.2 mehr.

## 8. Externe Referenzen

Keine externen Provider-Abhängigkeiten in Phase 1 (rein interne Supabase-Datenbank). Phase-2-Design
orientiert sich an der in CLAUDE.md verbindlich vorgeschriebenen Governance-Kette sowie am
Struktur-Vorbild ESS-0016 (Allowed/Not-Allowed-Listen, Phasenmodell, Acceptance Criteria).
