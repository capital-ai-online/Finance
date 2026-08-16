# M9 — I2 Entry: Read-only Inventory & Gap Analysis (2026-08-16)

Status: INFORMATIONAL — NOT A DRILL, NOT AN EXIT-GATE CLAIM
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`, ADR-0063,
`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` §5 (I2)

## 0. Zweck und Abgrenzung

Dieses Dokument ist der von dieser Sitzung selbst identifizierte, sichere Einstiegsschritt in I2
(„Nächster sicherer Schritt wäre eine reine Bestandsaufnahme/Planungs-Evidence für I2 … nicht die
Ausführung eines echten Drills", `INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` §11).

**Explizit NICHT Teil dieses Dokuments:**

- keine Ausführung irgendeines M9-Drills (Injection, Authorization-Bypass, Replay, Exfiltration,
  Audit-Outage, Kill-Switch, Break-Glass, Rollback);
- kein Anspruch, dass irgendein M9-Exit-Gate-Punkt erfüllt ist;
- keine Mutation von IAM/Kill-Switch/Break-Glass/Produktionszustand.

Grund: `INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` §5 „Systemadmin-Rolle" für I2 erlaubt
Assurance-Evidence-Work-Packages und Kill-Switch-/Break-Glass-**Proposals**, hält aber fest:
„Ausführung der Drills bleibt Human/Owner-gesteuert." Jeder einzelne Drill benötigt eine separate,
explizite Owner-Freigabe (Reichweite: genau dieser Drill, nicht I2 pauschal).

Dieses Dokument tut, was auch der I1-Einstieg tat: den vorhandenen Bestand real bewerten, bevor
irgendetwas Riskantes beginnt.

## 1. Prerequisite Gate (Runbook „Prerequisite Gate") — Statusprüfung

| # | Bedingung | Status | Beleg |
|---|---|---|---|
| 1 | M8 `COMPLETE / VERIFIED PASS` | ✅ | `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`, 9/9 Exit-Gate-Punkte PASS (2026-08-16) |
| 2 | Provider-neutrale Control Plane für privilegierte Ausführung aktiv | ✅ (für den einzigen realen Aufrufer) | `src/platform/Security/providerProfile.ts` + SA3B-Verdrahtung (`systemadminAuditedExecution.ts`); `chatgpt-github-connector` READY, `claude-code-cli`/`grok-xai-connector` strukturell BLOCKED — kein produktiver Aufrufer über die Control Plane hinaus |
| 3 | M5-Audit-Persistenz gesund | ✅ unverändert | `docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md` |
| 4 | M6-Provenance-Kontrollen intakt | ✅ unverändert | `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`, M6-Zeile |
| 5 | M7-Deployment-Identity intakt | ✅ unverändert | `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` „Exit Gate Closure" |
| 6 | Kill-Switch- und Rollback-Mechanismen identifiziert | ✅ | siehe §2.6/§2.8 unten |
| 7 | Kein unresolved CRITICAL Finding aus vorangegangenen Phasen | ✅ | `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` — keine offene CRITICAL-Zeile gefunden |

Alle 7 Punkte erfüllt — I2-Bestandsaufnahme ist zulässig. Das Gate erlaubt den **Beginn** von
Drill-Planung; es autorisiert noch **keinen einzelnen Drill**.

## 2. Bestand je Assurance-Domain (Runbook §„Assurance Domains")

Für jede Domain: was bereits als **Kontrollmechanismus** existiert (aus M4–M8), vs. ob bereits ein
**M9-adversarieller Drill mit Evidence-Schema** dazu ausgeführt wurde.

### 2.1 Authorization Bypass
- Kontrollmechanismus vorhanden: `agentIam.ts`, REM-Kette (SA1→SA2→SA3→SA4), Provider-Profil-Scope
  (`providerProfile.ts`), negative Unit-Tests für falsche Capability/Principal existieren bereits
  verstreut (`tests/unit/agentAudit.test.ts`, `tests/unit/systemadminAuditedExecution.test.ts`,
  `tests/unit/roadmapExecutionMandate.test.ts`).
- M9-Drill ausgeführt: **Ja, 2026-08-16** (Owner-autorisiert via `AskUserQuestion`) — siehe
  `docs/evidence/m9/M9_AUTHORIZATION_BYPASS_LIVE_DRILL_2026-08-16.md`. Alle 9 Runbook-Vektoren
  (missing/wrong principal, unknown capability, risk above ceiling, wrong target, expired/revoked
  mandate, human-reserved action, self-authority mutation, direct connector bypass) jetzt über die
  reale SA3B-Kette bewiesen, nicht nur isoliert auf REM-Ebene. Trägt zu M9-Exit-Gate-Punkt 2 bei
  (Authorization-Bypass-Anteil vollständig).

### 2.2 Prompt / Tool Injection
- Kontrollmechanismus vorhanden: kein dediziertes Modul gefunden (`grep -rli injection tests/
  src/` → keine Treffer). Die Threat-Model-Dokumentation (`docs/architecture/ai-agent/
  AI_AGENT_THREAT_MODEL.md`) benennt die Bedrohung, aber ohne zugehörige Testsuite.
- M9-Drill ausgeführt: **Nein.** Größte offene Lücke dieser Domain — keine automatisierten
  Negative-Tests, dass untrusted Content (Repo/PR-Kommentare/Tool-Output) niemals als Autorität
  behandelt wird.

### 2.3 Replay / Idempotency
- Kontrollmechanismus vorhanden: substanziell — `tests/unit/eventMeshReplayReliability.test.ts`,
  `tests/unit/outbox.test.ts`, `tests/unit/developmentChainMutationHandoff.test.ts`,
  `tests/unit/providerCutoverSimulator.test.ts` decken Replay/Dedupe-Verhalten bereits ab.
- M9-Drill ausgeführt: **Ja, 2026-08-16** (Owner-autorisiert via `AskUserQuestion`) — siehe
  `docs/evidence/m9/M9_REPLAY_IDEMPOTENCY_LIVE_DRILL_2026-08-16.md`. Fand und schloss eine reale
  Integrationslücke: der Envelope-Replay-Schutz in `checkProviderProfileScope()` existierte bereits,
  war aber nicht über den realen SA3B-Aufrufer erreichbar — additiv nachverdrahtet (Präzedenzfall:
  `killSwitchActive`), jetzt end-to-end bewiesen (5 neue Tests). Trägt zu M9-Exit-Gate-Punkt 2 bei
  (Replay-Anteil vollständig).

### 2.4 Secret / Data Exfiltration
- Kontrollmechanismus vorhanden: `src/platform/Telemetry/redaction.ts`,
  `tests/unit/telemetryContract.test.ts`, Audit-Redaction in `systemadminAuditedExecution.ts`.
- M9-Drill ausgeführt: **Ja, 2026-08-16** (Owner-autorisiert via `AskUserQuestion`) — siehe
  `docs/evidence/m9/M9_SECRET_EXFILTRATION_LIVE_DRILL_2026-08-16.md`. Fand und schloss zwei reale
  Redaction-Lücken (camelCase-Präfix-Schlüssel wie `customerEmail` rutschten unredigiert durch;
  TOTP/Recovery/Backup-Code-Benennungen fehlten in `SECRET_KEY_PATTERN`), dann alle
  Runbook-Kategorien über die reale SA3B-Kette bewiesen (3 neue Tests). Trägt zu
  M9-Exit-Gate-Punkt 2 bei (Exfiltration-Anteil vollständig).

### 2.5 Audit Completeness / Outage
- Kontrollmechanismus vorhanden: stark — `docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md`,
  `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md`,
  `docs/evidence/sa3/SA3_SYSTEMADMIN_AUDIT_CORRELATION_EVIDENCE.md`.
- M9-Drill ausgeführt: **Ja, 2026-08-16** (Owner-autorisiert via `AskUserQuestion`) — siehe
  `docs/evidence/m9/M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md`. Terminal-Outage-Fehlerinjektion
  (nicht nur Autorisierungsphase), struktureller Append-only-Beweis, und end-to-end-Korrelation für
  eine echte mutierende Capability. „Read-only operator visibility" bewusst nicht abgedeckt (siehe
  Drill-Evidence §0). Trägt zu M9-Exit-Gate-Punkt 2 bei (teilweise — Audit-Anteil).

### 2.6 Kill Switch
- Kontrollmechanismus vorhanden: **zwei unabhängige, bereits getestete Mechanismen** —
  `agentIam.ts`s `killSwitchActive` (verweigert Mutation, erhält READ) und REM-Level
  `killSwitch.enabled`. Real end-to-end durch die SA3B-Kette verdrahtet und getestet, siehe
  `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.4 und §7.
- M9-Drill ausgeführt: **Ja, 2026-08-16** (Owner-autorisiert via `AskUserQuestion`) — siehe
  `docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`. Alle vier realen mutierenden
  Capabilities (`BRANCH`/`COMMIT`/`PR`/`CI_REQUEST`) einzeln gegen die live-wired SA3B-Kette
  angegriffen und verweigert; `READ`/`ANALYZE`/`PLAN` bleiben erhalten; differenzieller Beweis und
  Nicht-Sticky-Beweis erbracht. Trägt zu M9-Exit-Gate-Punkt 3 bei (teilweise — nur für den einzigen
  produktiven Aufrufer SA3B, siehe Drill-Evidence §7).

### 2.7 Break-Glass
- Kontrollmechanismus vorhanden: **nicht implementiert.** ADR-0063 (die normative Grundlage für
  M9 selbst) steht weiterhin auf `Status: PROPOSED`, nicht `ACCEPTED`. Kein Break-Glass-Modul, kein
  Runbook-Verfahren über die Zieltextbeschreibung in `M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` selbst
  hinaus gefunden.
- M9-Drill ausgeführt: **Nein — nicht ausführbar, bevor ein Break-Glass-Mechanismus überhaupt
  existiert.** Dies ist der klarste Fall, in dem I2 zunächst einen **Proposal** (Systemadmin-Rolle
  laut Roadmap §5) statt eines Drills braucht.

### 2.8 Rollback / Recovery
- Kontrollmechanismus vorhanden: **zwei unabhängige, real bewiesene Hebel** für den einzigen realen
  Aufrufer (SA3B) — IAM-Kill-Switch und Provider-Profil-Registry-Rollback, siehe
  `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7. Für `claude-code-cli`/
  `grok-xai-connector` mangels echtem Aufrufer nicht anwendbar (siehe `M8_CLOSURE_EVIDENCE.md` §2).
- M9-Drill ausgeführt: **Ja, 2026-08-16** (Owner-autorisiert via `AskUserQuestion`) — siehe
  `docs/evidence/m9/M9_ROLLBACK_RECOVERY_LIVE_DRILL_2026-08-16.md`. Provider-Profil-Registry-Hebel
  jetzt für alle 3 kanonischen Provider als Baseline→Rollback→Recovery-Sequenz bewiesen, inkl.
  vollständigem Vorher/Nachher-Registry-Snapshot als Unveränderlichkeitsnachweis. Repository-Revert
  und Deployment-Rollback bewusst nicht als künstliche Testmutation ausgeführt (siehe Drill-Evidence
  §0) — durch bestehende operative Praxis bzw. M7-Evidence bereits belegt. Trägt zu
  M9-Exit-Gate-Punkt 5 bei (teilweise).

## 3. Governance-Lücke: ADR-0063 Status

ADR-0063 („Agent Assurance, Incident Response and Break-Glass") — die normative ADR-Grundlage, auf
die sowohl das M9-Runbook als auch dieser Roadmap-Abschnitt verweisen — steht auf `Status:
PROPOSED`. Das Runbook-Exit-Gate verlangt selbst keine ADR-`ACCEPTED`-Bedingung als eigenen
Punkt, aber ein `PROPOSED`-ADR als Autorität für einen Phase-Exit ist ein Hygiene-Risiko, das vor
M9-Closure (nicht notwendigerweise vor Drill-Beginn) aufgelöst werden sollte. Dies ist eine
Beobachtung, keine Blockade — wird hier dokumentiert, damit sie nicht verloren geht.

## 4. Was dieses Dokument NICHT bedeutet

- Kein M9-Exit-Gate-Punkt gilt als erfüllt.
- Kein Drill wurde ausgeführt; keine Kill-Switch-/Break-Glass-Aktion wurde in dieser Sitzung
  betätigt.
- Die oben aufgeführten „Kontrollmechanismus vorhanden"-Befunde sind Bausteine, keine
  Drill-Nachweise im Runbook-Evidence-Schema (Drill-ID, Baseline, erwartetes/tatsächliches
  Ergebnis, Rollback-Zustand, Owner-Zuordnung).

## 5. Empfohlene nächste Schritte (jeweils eigene, separate Owner-Freigabe erforderlich)

Priorisierungsvorschlag nach Reifegrad der Grundlage (am weitesten fortgeschritten zuerst):

1. ~~**Kill-Switch-Live-Drill** (§2.6)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`.
2. ~~**Rollback/Recovery-Drill** (§2.8)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_ROLLBACK_RECOVERY_LIVE_DRILL_2026-08-16.md`.
3. ~~**Audit-Outage-Drill** (§2.5)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md`.
4. ~~**Replay/Idempotency-Drill** (§2.3)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_REPLAY_IDEMPOTENCY_LIVE_DRILL_2026-08-16.md`.
5. ~~**Authorization-Bypass-Negativtests** (§2.1)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_AUTHORIZATION_BYPASS_LIVE_DRILL_2026-08-16.md`.
6. ~~**Secret/Exfiltration-Drill** (§2.4)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_SECRET_EXFILTRATION_LIVE_DRILL_2026-08-16.md`.
7. **Prompt/Tool-Injection-Tests** (§2.2) — größte Lücke, braucht Testsuite von Grund auf.
8. **Break-Glass** (§2.7) — braucht zuerst einen Owner-genehmigten Proposal/Implementierung, bevor
   überhaupt ein Drill möglich ist; realistisch der letzte Punkt in der Sequenz.

Dieses Dokument trifft selbst keine Auswahl unter diesen Optionen — das ist Owner-Entscheidung.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/adr/ADR-0063-agent-assurance-incident-break-glass.md`
- `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` §5
- `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.4, §7
