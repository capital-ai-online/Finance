# ADR-0051 — Capability/Grant IAM, Approval-Artefakt & governter Admin-Agent (ESS-0018 Phase 2)

- **Status:** Accepted / Implemented (Foundation + eine Schreib-Capability)
- **Date:** 2026-08-10
- **Scope:** Neue Capability-/Grant-IAM-Schicht, echtes Approval-Artefakt, Compliance-Policy-Gate,
  Supervisor-Erweiterung, erster schreibender Admin/Support/Diagnose-Agent für Supabase.
- **Related:** ADR-0050 (Agent Tool & Capability IAM Foundation, Phase 1), ADR-0043 (Supabase
  Privilege Separation), ESS-0018 (Agentic Supabase Tool Governance), CLAUDE.md
  (Policy→IAM/Grant→Approval→Dry-run→Fingerprint→Apply→Verify→Audit-Kette)

## Context

ADR-0050 (ESS-0018 Phase 1) lieferte einen rein lesenden Agenten. ESS-0018 §4.2 spezifizierte
bereits vollständig, aber implementierte bewusst nicht, einen zweiten Agenten für
CAPITAL-AI-Systemadministratoren mit Lese- und kontrollierten Schreibrechten. Voraussetzung dafür
war laut ADR-0050: eine Capability-/Grant-IAM-Erweiterung, ein echtes Approval-Artefakt (statt nur
dokumentiert wie `AnalyticsApproval`), eine echte Compliance/Supervisor-Kopplung und ein eng
umrissenes Schreib-Capability-Register.

Erneute Verifikation am Implementierungstag (main `69d6315`) bestätigte: keiner dieser Bausteine
existierte als Code. `Compliance` ist architektonisch ausschließlich ein Ganz-App-Auditor ohne
Pro-Aktion-Hook (`src/platform/Compliance/store.ts:55`, `executeComplianceRun()`); der Router
disclaimt selbst, keine Berechtigungen vergeben zu dürfen. `Supervisor.executeSupervised()` hatte
zum Zeitpunkt der Implementierung nur einen einzigen echten Aufrufer im Repository
(`src/platform/Traceability/Services/runTraceability.ts`), also kein Pre-Execution-Gate und
niedriges Risiko für eine additive Erweiterung.

## Decision

### 1. Capability/Grant-IAM (`src/platform/Security/capabilities.ts`)

Additive Erweiterung des groben Rollenmodells (`owner|admin|supervisor|user`,
`authMiddleware.ts`), nicht dessen Ersatz. Neue Tabelle `capability_grants`
(Migration `20260810002100_capability_grants.sql`, Service-Role-only RLS wie
`score_snapshots`). `checkCapability()` ist fail-closed: jeder DB-/Verbindungsfehler liefert
`false`, nie stillschweigend `true`. Nur drei benannte Capabilities existieren
(`CAPABILITIES`-Konstante) — kein Wildcard, keine generische SQL-Capability. Ausstellung/Widerruf
(`grantCapability()`/`revokeCapability()`) ist ausschließlich hinter Owner-Rolle + frischem
TOTP-Step-up erreichbar (CLAUDE.md), durchgesetzt in `server/adminDiagnostics.ts`, nicht in der
Funktion selbst (dieselbe Trennung wie bei `server/stepUp.ts`).

### 2. Approval-Artefakt (`src/platform/Security/approvals.ts`)

Neue Tabelle `agent_action_approvals` (Migration `20260810002200_agent_action_approvals.sql`,
Service-Role-only RLS). Jede Genehmigung ist an `action` + `planHash` (deterministischer SHA-256
über die sortierten Plan-Parameter) gebunden und über denselben race-sicheren
Single-Use-Mechanismus wie `step_up_tokens` konsumierbar
(`UPDATE ... WHERE consumed_at IS NULL AND expires_at > now()`). 10 Minuten TTL. Eine Genehmigung
für Plan A kann niemals Plan B autorisieren (`consumeApproval()` prüft beides vor dem Verbrauch).

### 3. Compliance Policy-Gate (`src/platform/Compliance/PolicyGate.ts`)

Rein additiv — `store.ts`, `scanners.ts`, `router.ts` bleiben unverändert. Zwei Allowlists
(Lesen/Schreiben) gegen die exakten ESS-0018-§4.2-Capability-Namen. Jede Capability außerhalb der
Allowlist — inklusive jeder Raw-SQL-förmigen — erhält `DENY`. Es gibt keinen Default-Allow-Pfad.

### 4. Supervisor-Erweiterung (`src/platform/Supervisor/supervisor.ts`)

Neue, separate Funktion `executeApprovedSupervisedAction()` statt Änderung von
`executeSupervised()` selbst (dessen einziger bestehender Aufrufer bleibt unberührt). Erzwingt
Policy-Gate → Approval-Konsum → `executeSupervised()`-Apply → EventMesh-Audit-Event in dieser
Reihenfolge; ein `DENY` oder ein nicht konsumierbares Approval erreicht `fn` nie.
Fingerprint-Prüfung gegen den aktuellen DB-Zustand ist bewusst Aufgabe des jeweiligen
Schreib-Tools (Supervisor kennt keine Tabellenschemata) — ein Mismatch dort wirft einen Fehler,
der hier nicht als stiller Erfolg maskiert wird.

### 5. Admin/Support/Diagnose-Agent (`src/agents/adminDiagnosticsAgent.ts`,
   `src/services/agentTools/supabaseAdminDiagnosticsTool.ts`, `server/adminDiagnostics.ts`)

Kein LLM-Aufruf — anders als beim Score-Explainability-Agenten (Phase 1) gibt es hier keine
Freitext-Erklärung, die einen Modellaufruf rechtfertigt; der Wert liegt in der
Governance-Kette. Jede Methode prüft die konkrete Capability zusätzlich zur groben Rollenprüfung
der HTTP-Schicht (`checkAdminAccess`) — das ist die feingranulare Hälfte des
Zwei-Ebenen-Autorisierungsmodells.

**Erste und einzige real angebundene Schreib-Capability in diesem Schnitt:**
`supabase.admin.alert_subscription.disable` — Single-Row-Update `active=false` in
`alert_subscriptions`. Bewusst gewählt, weil reversibel, ohne Geld-/Score-/Identitätsbezug, ohne
Kaskadeneffekte. Weitere in ESS-0018 §4.2 genannte Schreib-Capabilities (z. B.
`resend_confirmation`) folgen als eigene, kleine Folge-PRs nach demselben Muster.

Endpunkt-Kontrakt:

```text
GET  /api/admin/diagnostics                              - lesend, Capability-Check
GET  /api/admin/diagnostics/alert-subscriptions/:id/preview - lesend, Capability-Check, kein Approval
POST /api/admin/capabilities/grant|revoke                - Owner + Step-up
POST /api/admin/approvals                                 - Owner + Step-up
POST /api/admin/alert-subscriptions/:id/disable           - Capability + konsumiertes Approval
```

## Consequences

### Positive

- Der schreibende Admin-Agent aus ESS-0018 existiert jetzt real, nicht nur spezifiziert.
- Die vollständige, in CLAUDE.md vorgeschriebene Kette
  (Policy→IAM/Grant→Approval→Dry-run/Fingerprint→Apply→Verify/Audit) ist erstmals als
  Laufzeit-Code vorhanden und über eine reale Schreib-Capability bewiesen.
- Kein bestehender, sicherheitskritischer Code (`authMiddleware.ts`, `Compliance/store.ts`,
  `Supervisor.executeSupervised()`, RLS auf `alert_subscriptions`) wurde verändert — alles ist
  additiv.

### Trade-offs

- Nur eine reale Schreib-Capability in diesem Schnitt; weitere folgen separat.
- Zwei neue Tabellen erfordern eine manuelle Produktions-Migration (`supabase db push` oder
  Dashboard) — CLAUDE.md untersagt automatische Produktions-DDL aus einem Entwicklungsschritt;
  dies bleibt ein offenes Handoff, bis ein Mensch die Migration gegen Production anwendet.
- Kein UI für Grant-/Approval-Verwaltung; reine API vorerst.

## Validation & Evidence

1. Unit-Tests beweisen: `checkCapability` fail-closed bei DB-Fehler/fehlender Konfiguration;
   `consumeApproval` verweigert fehlende/abgelaufene/bereits verbrauchte/plan-fremde
   Genehmigungen; `evaluateWritePolicy`/`evaluateReadPolicy` lassen ausschließlich die
   dokumentierte Allowlist zu; `executeApprovedSupervisedAction` ruft `fn` niemals ohne
   konsumiertes, passendes Approval auf; `disableAlertSubscription` verweigert Apply bei
   Fingerprint-Mismatch und ist bei bereits inaktiver Zeile idempotent ohne redundanten Write.
2. `npm run lint`, `npm test`, `npm run build`, `npm run predeploy:check` grün.
3. Migrationsdateien folgen der bestehenden Namens-/RLS-Konvention
   (`supabase/migrations/20260801143614_score_snapshots.sql` als Vorbild).

## Rollback

Entfernt ausschließlich neue Dateien/Router-Mount-Zeile/Migrationen; keine bestehende Invariante
(CLAUDE.md-Liste, ADR-0043-Privilegientrennung, bestehende RLS-Policies) wird berührt oder
geschwächt. Falls die Migrationen bereits gegen Production angewendet wurden, ist ein
DROP-TABLE-Rollback separat zu entscheiden (Datenverlust bei bereits erteilten Grants/Approvals),
nicht automatisch Teil dieses Rollbacks.
