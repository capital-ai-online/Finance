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
- M9-Drill ausgeführt: **Ja, 2026-08-16** (Owner-autorisiert via `AskUserQuestion`) — siehe
  `docs/evidence/m9/M9_PROMPT_TOOL_INJECTION_LIVE_DRILL_2026-08-16.md`. Beweist, dass alle
  typisierten Autorisierungsfelder (targetResource/roadmapItem/capability/metadata) gegen
  adversariell geformte Payloads immun sind (18 neue Tests). Der zunächst offene Fund
  (`credentialExposureDetected`/`untrustedScopeElevationDetected` hartkodiert `false`) wurde im
  Anschluss durch `docs/evidence/m9/M9_UNTRUSTED_CONTENT_DETECTOR_WORK_PACKAGE_2026-08-16.md`
  aufgelöst (architekturell bewiesen, kein Detektor nötig; 38 neue Tests der drei Issue-Validatoren).
  Trägt zu M9-Exit-Gate-Punkt 2 bei (Injection-Anteil vollständig).

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
- Kontrollmechanismus vorhanden: **Policy-/Logik-Ebene implementiert, 2026-08-16** —
  `src/platform/Security/breakGlass.ts`, siehe
  `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md` (OWNER_ACCEPTED) und
  `docs/evidence/m9/M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md`. ADR-0063 bleibt weiterhin
  `PROPOSED`. **Kein live erreichbarer Endpunkt** — bewusst nicht verdrahtet, eigener nächster
  Schritt.
- M9-Drill ausgeführt: **Nein — weiterhin nicht möglich**, da kein live erreichbarer Aktivierungspfad
  existiert. Die Logikebene ist jedoch jetzt 27-fach getestet, inkl. end-to-end über die reale
  SA3B-Kette. Trägt zu M9-Exit-Gate-Punkt 4 **nicht** bei (Punkt 4 verlangt „drill PASS", kein
  Drill wurde ausgeführt) — reduziert aber das Risiko für den kommenden Live-Verdrahtungsschritt.

**Nachtrag 2026-08-16 (Live-Wiring):** HTTP-Endpunkt jetzt live-verdrahtet (Owner-Wahl
"Break-Glass live verdrahten (empfohlen)") — `server/systemadmin/breakGlassRouter.ts`, gemountet
unter `/api/systemadmin/break-glass` in `registerApplicationRoutes.ts`, mit echtem
`requireStepUp()`-Owner-Guard und In-Memory-Widerruf-Persistenz. 10 neue HTTP-Level-Tests, siehe
`docs/evidence/m9/M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md`. Der eigentliche M9-Drill (Punkt 4)
bleibt weiterhin **nicht ausgeführt** — jetzt aber technisch möglich, da ein echter Endpunkt
existiert. ADR-0063 weiterhin `PROPOSED`. Ein dokumentierter, unbehobener Nebenbefund
(`requireStepUp()` filtert `purpose` beim Konsum nicht) betrifft alle Step-up-gated Endpunkte, siehe
Live-Wiring-Evidence §3.

**Nachtrag 2026-08-16 (Live-Drill):** M9-Drill jetzt technisch ausgeführt — Owner-Wahl „Break-Glass-
Drill durchführen (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/
M9_BREAK_GLASS_LIVE_DRILL_2026-08-16.md`. Alle 8 Runbook-Anforderungen an Domain 7 geprüft und
bestanden, darunter eine während der Drill-Vorbereitung gefundene und additiv geschlossene reale
Lücke (explizite Widerruf-Durchsetzung fehlte bisher in der realen Autorisierungskette — neues
`breakGlassRevoked`-Flag in `roadmapExecutionMandate.ts`, dem OWNER-akzeptierten Proposal §2.7
folgend). 5 neue Tests. **M9-Exit-Gate-Punkt 4 gilt als erfüllt** — der laut Proposal §2.8
verpflichtende Post-Event-Review (`.ai/evidence/break-glass/
BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`) wurde am 2026-08-16 vom Owner explizit
signiert. Zwei nicht-blockierende Folgepunkte bleiben dokumentiert offen (Broker-Anbindung des
Widerruf-Hebels; `requireStepUp()`-`purpose`-Filter). ADR-0063 weiterhin `PROPOSED`.

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
7. ~~**Prompt/Tool-Injection-Tests** (§2.2)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_PROMPT_TOOL_INJECTION_LIVE_DRILL_2026-08-16.md`. Mit wichtigem offenem
   Fund: kein realer Content-Scanning-Detektor für die bereits vorhandenen Checkpoint-Gates —
   empfohlen als eigenes Arbeitspaket vor M9-Closure.
8. ~~**Break-Glass Live-Wiring** (§2.7)~~ — **erledigt 2026-08-16**, siehe
   `docs/evidence/m9/M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md`. Proposal Owner-`ACCEPT`ed,
   Policy-/Logik-Ebene implementiert und jetzt hinter einem echten, Owner+Step-up-gated
   HTTP-Endpunkt (`/api/systemadmin/break-glass`) live erreichbar.
9. ~~**Break-Glass-Drill** (§2.7)~~ — **erledigt 2026-08-16, M9-Exit-Gate-Punkt 4 formal erfüllt**,
   siehe `docs/evidence/m9/M9_BREAK_GLASS_LIVE_DRILL_2026-08-16.md`. Alle 8 Runbook-Anforderungen
   geprüft und bestanden, inkl. einer während der Vorbereitung gefundenen und additiv geschlossenen
   realen Lücke (Widerruf-Durchsetzung). Der laut Proposal §2.8 verpflichtende Post-Event-Review
   (`.ai/evidence/break-glass/BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`) ist Owner-signiert.
   Kein weiterer Break-Glass-spezifischer Punkt offen — verbleibende M9-Punkte betreffen andere
   Domains (v. a. Punkt 6, Independent Evidence Review).
10. ~~**Independent Evidence Review** (Exit-Gate-Punkt 6)~~ — **erledigt 2026-08-16**, siehe
    `docs/evidence/m9/M9_INDEPENDENT_EVIDENCE_REVIEW_2026-08-16.md`. Durchgeführt von einem frischen,
    an keiner M9-Implementierung beteiligten Sub-Agenten (keine Selbstprüfung). Gesamtverdikt:
    „Ja, mit Vorbehalten" — kein CRITICAL-Fund, aber 4 dokumentierte Folgepunkte (F1/F2/F3/F4,
    Details im Review), darunter ein veralteter Runbook-/Traceability-Matrix-Status (Exit-Gate-Punkt
    9 dadurch **nicht erfüllt**) und der bereits bekannte `requireStepUp()`-`purpose`-Filter-Fund
    (jetzt als MEDIUM–HIGH eingestuft). Exit-Gate-Punkt 6 gilt als erfüllt; M9 als Ganzes bleibt
    wegen Punkt 9 (Traceability-Sync) und Punkt 10 (Branch-Bereinigung) weiterhin nicht formal
    `COMPLETE / VERIFIED PASS`.

Dieses Dokument trifft selbst keine Auswahl unter diesen Optionen — das ist Owner-Entscheidung.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/adr/ADR-0063-agent-assurance-incident-break-glass.md`
- `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` §5
- `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.4, §7
