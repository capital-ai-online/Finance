# M9 — Required Independent Review (2026-08-16)

Status: REVIEW COMPLETE — Verdict **YES, MIT VORBEHALTEN** (siehe §1); M9-Exit-Gate-Punkt 6
formal erfüllt durch dieses Dokument; **mehrere Folgepunkte identifiziert, keiner CRITICAL**
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Required Independent Review";
Owner-Autorisierung: explizite Anweisung „führe Independent evidence Review durch bevor ich den
pull request merge", 2026-08-16 (PR #404 wurde vom Owner bereits gemergt, bevor dieser Review
abgeschlossen war — der Review wird dennoch vollständig durchgeführt und dokumentiert, siehe §0).

## 0. Zweck, Methodik und Abgrenzung

Dieser Review erfüllt die im Runbook geforderte, **von der Ausführungsmechanik getrennte**
Prüfung vor M9-Closure. Durchgeführt von einem frischen, an keiner M9-Implementierung oder
keinem M9-Drill beteiligten Sub-Agenten (`general-purpose`, isolierter Kontext, keine
Vorkenntnis aus dieser Sitzung), mit dem expliziten Auftrag, skeptisch zu prüfen statt Prosa-
Behauptungen zu übernehmen: jede in `docs/evidence/m9/*.md` und
`.ai/evidence/break-glass/*.md` behauptete Testabdeckung wurde gegen die tatsächlichen
Testdateien verifiziert, `npm run lint`/`npx vitest run` wurden frisch selbst ausgeführt statt
den in den Evidence-Dokumenten zitierten Zahlen zu vertrauen, und es wurde repository-weit nach
`.skip(`/`xit(`/`describe.skip(`/`it.todo(` gesucht.

**Hinweis zur Reihenfolge:** Der Owner hat PR #404 (Break-Glass-Drill) bereits gemergt, bevor
dieser Review abgeschlossen war — vor Abschluss dieses Dokuments wurde das dem Owner transparent
mitgeteilt. Der Review selbst wurde unverändert vollständig durchgeführt; keine Rücknahme des
bereits erfolgten Merges wurde vorgenommen oder ist hier vorgesehen.

## 1. Gesamtverdikt

**Ja, mit Vorbehalten.** Der M9-Evidence-Korpus ist für ein Agenten-Assurance-Paket
ungewöhnlich belastbar: jede geprüfte „Drill PASS"-Behauptung führt zu realen Testdateien, die
die tatsächliche Autorisierungskette (`authorizeSystemadminAuditedExecution`,
`evaluateProviderScopedAuthorization`) mit ausschließlich gemocktem Supabase-Client ausführen —
keine tautologischen Assertions, keine synthetischen PASS-Einträge für nicht existierende
Kontrollen. Kein `.skip`/`xit`/`describe.skip`/`it.todo` existiert irgendwo im Repository — nichts
wurde still deaktiviert. Kein CRITICAL-Fund bleibt unzugeordnet, und es wurden keine echten
Secrets/Credentials in Evidence-Dateien gefunden. Uneingeschränktes PASS ist dennoch nicht
gerechtfertigt, weil: (a) der Mocked-Supabase-/Nur-SA3B-Aufrufer-Vorbehalt in 5 von 8
Domain-Dokumenten explizit offengelegt wird, in 3 weiteren (Authorization-Bypass,
Prompt-Injection, Rollback/Recovery) jedoch fehlt, obwohl dieselbe Mocking-Methodik zugrunde
liegt (Finding F3); (b) der Runbook-Status-Header und die Traceability-Matrix veraltet sind
(„BLOCKED BY M8", obwohl M8 abgeschlossen und alle 8 Domains gedrillt sind) — eine direkte
Verletzung von Exit-Gate-Punkt 9 (Finding F4); (c) die beiden offenen Break-Glass-Restbefunde
(Broker-Anbindung, Step-up-`purpose`-Filter) zwar offengelegt, aber nie formal mit einer
Schweregrad-Einstufung oder einer nachverfolgbaren Ticket-ID versehen wurden.

## 2. M9-Exit-Gate — Unabhängige Verdikte

| # | Exit-Gate-Punkt | Verdikt | Begründung |
|---|---|---|---|
| 1 | M8-Prerequisite verifiziert | **Erfüllt** (vertrauensbasiert) | `M8_CLOSURE_EVIDENCE.md` = `COMPLETE / VERIFIED PASS`; erneute M8-Prüfung war außerhalb des Scopes dieses Reviews. |
| 2 | Alle Authz/Injection/Replay/Exfiltration/Audit-Drills PASS | **Teilweise erfüllt** | Echte, bestehende Negativtests je Domain; Audit-Domain schließt explizit „Read-only Operator Visibility" aus; alle Drills nutzen gemockten Supabase-Sink; mehrere sind SA3B-only. |
| 3 | Kill-Switch-Drill PASS | **Teilweise erfüllt** (deckt sich mit Evidence-Eigenbewertung) | Beide Hebel real bewiesen, aber nur für den einzigen realen Aufrufer SA3B. |
| 4 | Break-Glass-Drill PASS | **Teilweise erfüllt** | Echte HTTP-/Ketten-Tests, Owner-signierter Post-Review vorhanden; `checkAdminAccess`/`requireStepUp` im Drill gemockt; `breakGlassRevoked`-Hebel hat aktuell keinen realen produktiven Aufrufer (bestätigt in Quellcode, siehe F1). |
| 5 | Rollback/Recovery-Drill PASS | **Teilweise erfüllt** (deckt sich mit Evidence-Eigenbewertung) | Provider-Profil-Hebel für alle 3 Provider real bewiesen; Repository-Revert und Deployment-Rollback bewusst nicht als synthetischer Test gedrillt. |
| 6 | Independent Evidence Review PASS | **Erfüllt** — durch dieses Dokument. | — |
| 7 | Kein unowned CRITICAL Control | **Erfüllt** | Kein Evidence-Dokument verzeichnet einen ungelösten CRITICAL-Fund; eigener Skip-Test-Scan und Quellcode-Check bestätigen dies unabhängig. |
| 8 | Residualrisiko dokumentiert/akzeptiert wie gefordert | **Teilweise erfüllt** | Residuen sind ausführlich dokumentiert, aber nie formal mit HIGH/MEDIUM/LOW gekennzeichnet — der Runbook-Trigger „HIGH-Residuum → explizite Owner-Akzeptanz" wurde nie formal ausgelöst, obwohl er für F2 vertretbar wäre. Faktische Akzeptanz besteht (Owner hat den Break-Glass-Post-Review signiert, der beide offenen Punkte offenlegt), aber ohne explizite Schweregrad-Kennzeichnung. |
| 9 | Evidence und Roadmap/Traceability synchronisiert | **Nicht erfüllt** | `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md:3` und `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md:20` lauten weiterhin „BLOCKED BY M8" — veraltet gegenüber M8-Abschluss und allen 8 gedrillten Domains. Die Roadmap selbst (§11) ist aktuell und korrekt; Runbook und Traceability-Matrix sind es nicht. |
| 10 | Arbeitsbranches gelöscht | **Nicht verifizierbar / vermutlich nicht erfüllt** | Mehrere Nicht-`main`-Branches existieren im Repository; Evidence-Dokumente benennen ihre eigenen Arbeitsbranches nie, daher keine eindeutige Zuordnung zu M9 möglich — der Gate-Punkt verlangt jedoch null Nicht-main-Branches, und mehrere existieren. |

## 3. Konkrete Funde

| # | Fund | Fundort | Schweregrad |
|---|---|---|---|
| F1 | **Bestätigt aktuell:** Kein realer produktiver Aufrufer bindet `breakGlassRevoked`. Der SA3B-GitHub-Actions-Broker akzeptiert ausschließlich `REM-SA3B-PROBE-001`, `REM-SA4-PILOT-001` oder das `REM-WORKPACKAGE-`-Präfix — ein `REM-BREAK-GLASS-*`-Mandat wird mit `workflow-mandate-binding-mismatch` (403) abgelehnt, bevor die Widerruf-Prüfung überhaupt erreicht wird. | `server/systemadmin/systemadminExecutionBrokerRouter.ts:32-34,60-75,112-115` | MEDIUM (aktuell nicht ausnutzbar, da der Broker Break-Glass-Mandate grundsätzlich nie akzeptiert; relevant erst, falls Break-Glass je für automatisierte Nutzung geöffnet wird). Bereits offengelegt, aber ohne Ticket/Owner über Prosa hinaus. |
| F2 | **Bestätigt aktuell:** `requireStepUp()` filtert `purpose` beim Konsum nicht — die Supabase-Query matched auf `user_id`/`token_hash`/`used_at IS NULL`/`expires_at > now`, nie auf `purpose`. Ein frisch für einen anderen Zweck ausgestelltes Step-up-Token könnte aktuell auch für Break-Glass-Aktivierung (oder jeden anderen Step-up-gated Endpunkt) innerhalb seines 5-Minuten-Fensters wiederverwendet werden. | `src/platform/Security/authMiddleware.ts:358-378`; Ausstellung mit `purpose` in `server/stepUp.ts:270-302` | MEDIUM–HIGH. Setzt bereits eine frische AAL2-Owner-Session voraus (kein Unauthorized-Access-Bypass), verletzt aber real die dokumentierte Zweckbindungs-Garantie für **alle** Step-up-gated Endpunkte, nicht nur Break-Glass. Offengelegt, aber nie formal schweregrad-eingestuft, kein Roadmap-Ticket. |
| F3 | Offenlegungs-Inkonsistenz: der „gemockter Supabase / nur Test-Harness"-Vorbehalt steht explizit in 5 von 8 Domain-Dokumenten, fehlt aber in `M9_AUTHORIZATION_BYPASS_LIVE_DRILL_2026-08-16.md`, `M9_PROMPT_TOOL_INJECTION_LIVE_DRILL_2026-08-16.md` und `M9_ROLLBACK_RECOVERY_LIVE_DRILL_2026-08-16.md`, obwohl dieselbe Mocking-Methodik zugrunde liegt. Die zugrunde liegenden Fakten sind korrekt, nur die Prosa-Offenlegung ist nicht einheitlich über alle 8 Domains. | drei o. g. Dateien | LOW (Dokumentations-Konsistenzproblem, keine Kontroll-Lücke). |
| F4 | Veralteter Status: Runbook-Kopf und Traceability-Matrix zeigen weiterhin „BLOCKED BY M8", obwohl M8 `COMPLETE / VERIFIED PASS` ist und alle 8 Domains gedrillt wurden. | `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md:3`; `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md:20` | MEDIUM (Prozess-/Traceability-Lücke, keine Sicherheits-Kontroll-Lücke). Direkt relevant für Exit-Gate-Punkt 9. |
| F5 | „Read-only Operator Visibility bleibt verfügbar" (eine von 6 Runbook-Teilanforderungen der Audit-Domain) wurde nie gedrillt — ehrlich als N/A/Out-of-Scope markiert statt fälschlich als PASS behauptet, unter Verweis auf die bestehende `AuditLogs.tsx`-UI als ungeprüfte Annahme. | `docs/evidence/m9/M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md:38-41,87` | LOW–INFORMATIONAL (ehrlich offengelegte Lücke, keine Falschdarstellung). |
| F6 | Keine secret-förmigen Strings gefunden. Alle platzierten Testwerte des Secret/Exfiltration-Drills sind eindeutig nicht-funktionale Platzhalter (öffentlich bekannte RFC-Demo-TOTP-Secrets, Stripes öffentliche Test-Kartennummer, trunkiertes Fake-PEM). Repository-weite Prüfung auf AWS/GitHub/Slack/JWT-förmige Muster ohne Treffer. | `tests/unit/systemadminAuditedExecution.test.ts:816-829` | INFORMATIONAL — als sicher verifiziert. |
| F7 | Null Treffer für `.skip(`/`xit(`/`xdescribe(`/`it.todo(`/`describe.skip(`/`test.skip(` repository-weit (`tests/`, `server/`, `src/`, `scripts/`). Kein still deaktivierter Negativtest existiert. | repository-weit | INFORMATIONAL — bestätigt Review-Kriterium 1. |
| F8 | Jeder in Evidence-Dokumenten benannte Describe-Block existiert wortgleich in `tests/unit/systemadminAuditedExecution.test.ts`; stichprobenartig geprüfte Tests rufen tatsächlich die reale, ungemockte `authorizeSystemadminAuditedExecution()`-Kette auf und prüfen echtes `DENY`, fehlendes `executionPermit` und ein real auditiertes `DENIED`-Event — keine Tautologien. | `tests/unit/systemadminAuditedExecution.test.ts:404,535,641,728,814,891` | INFORMATIONAL — bestätigt Review-Kriterium 2 (kein synthetisches PASS). |
| F9 | Bereits bekannter, unabhängig reproduzierter, umgebungsabhängiger Testfehlschlag: `scripts/pr/runtimeArtifactImmutability.test.mjs` erwartet eine hartcodierte Platzhalter-SHA, erhält aber die reale `git rev-parse HEAD` dieser Sandbox. Nicht durch M9-Arbeit verursacht, nicht Teil von `npx vitest run`/`npm run lint`. | `scripts/pr/runtimeArtifactImmutability.test.mjs:225` | LOW (vorbestehend, sandbox-spezifisch, bereits offengelegt). |
| F10 | 30-Minuten-Break-Glass-Hartlimit und Mandat-Präfix-Bindung exakt wie von der Evidence behauptet im Quellcode bestätigt. | `src/platform/Security/breakGlass.ts:20,32,91` | INFORMATIONAL — bestätigt Evidence-Behauptung. |

## 4. Aktuelle Test-/Lint-Ergebnisse (frisch ausgeführt für diesen Review)

- `npm run lint` (`tsc --noEmit`): **PASS**, keine Fehler.
- `npx vitest run`: **195 Testdateien, 1204 Tests, alle PASS.** Deckt sich exakt mit der zuletzt
  von `M9_BREAK_GLASS_LIVE_DRILL_2026-08-16.md` behaupteten Zahl — keine Abweichung, da keine
  Commits zwischen jenem Drill und diesem Review gelandet sind.
- `node --test scripts/pr/*.test.mjs scripts/systemadmin/*.test.mjs`: 66 Tests, 65 PASS, 1 FAIL —
  reproduziert exakt den bereits offengelegten, vorbestehenden `runtimeArtifactImmutability`-
  Fehlschlag (F9). Nichts neu Zerbrochenes.

## 5. Nicht verifizierbar / auf dokumentiertes Vertrauen gestützt

- **M8 selbst** (Audit-Persistenz-Gesundheit, Provenance-Kontrollen, Deployment-Identität) — außerhalb des Scopes dieses M9-fokussierten Reviews; verlassen auf `M8_CLOSURE_EVIDENCE.md`s Eigenbewertung ohne erneute M8-Prüfung.
- **Reales Produktions-Supabase-/AAL2-/TOTP-Verhalten** — jeder M9-Drill (inkl. Break-Glass) läuft gegen einen gemockten Supabase-Client und gemockte `checkAdminAccess`/`requireStepUp`-Funktionen; kein Drill nutzt eine echte Supabase-gestützte IAM-Session, echte TOTP-Verifikation oder einen echten GitHub-Actions-Lauf.
- **Owner-Autorisierung via `AskUserQuestion`** — jede Drill-„Owner-Autorisierung" ist eine Sitzungs-interne Tool-Antwort, keine kryptographisch verifizierte Identität/TOTP-Step-up-Bestätigung im Sinne von CLAUDE.mds „Authorized Principals" (die sich explizit auf geschützte Rollbacks bezieht, nicht auf additive/reversible M9-Drills). Als dokumentierte Vertrauenslücke festgehalten, nicht als Fund, da M9s eigene Review-Kriterien keinen kryptographischen Nachweis für Drill-Autorisierung verlangen.
- **Branch-Bereinigung (Exit-Gate-Punkt 10)** — keine eindeutige Zuordnung der bestehenden Nicht-main-Branches zu M9 möglich, da Evidence-Dokumente ihre Arbeitsbranches nie namentlich referenzieren.
- **ADR-0063** — bleibt `PROPOSED`, konsistent und korrekt in jedem Break-Glass-Dokument offengelegt, kein verstecktes Governance-Problem.

## 6. Empfehlung an den Owner (keine Owner-Entscheidung vorweggenommen)

Keiner der Funde ist CRITICAL oder blockiert eine sichere Weiternutzung der bereits gemergten
Änderungen. Empfohlene, jeweils eigene Owner-Entscheidungen:

1. **F4 (veralteter Status)** — reine Dokumentations-Aktualisierung (Runbook-Header,
   Traceability-Matrix), technisch risikolos; könnte als eigener kleiner Folge-PR erledigt werden.
2. **F2 (`requireStepUp`-`purpose`-Filter)** — der am ehesten sicherheitsrelevante Fund
   (MEDIUM–HIGH); beträfe eine Änderung an gemeinsam genutzter Auth-Infrastruktur, daher als
   eigener, separat zu autorisierender Schritt empfohlen.
3. **F1 (Broker-Anbindung des Widerruf-Hebels)** — nur relevant, falls Break-Glass je für
   automatisierte/Broker-Nutzung geöffnet werden soll; aktuell kein Risiko, da strukturell
   unerreichbar.
4. **F3 (Offenlegungs-Inkonsistenz)** — optionale Nachtrags-Ergänzung der drei genannten
   Evidence-Dokumente zur Konsistenz, kein Sicherheitsrisiko.
5. **Exit-Gate-Punkt 10 (Branch-Bereinigung)** — eigene Owner-Entscheidung, welche Branches
   gelöscht werden dürfen.

Dieses Dokument trifft selbst keine dieser Entscheidungen — das bleibt Owner-Sache.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `docs/evidence/m9/M9_BREAK_GLASS_LIVE_DRILL_2026-08-16.md`
- `.ai/evidence/break-glass/BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`
- `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`
- `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`
- Alle acht Domain-Evidence-Dokumente unter `docs/evidence/m9/*_LIVE_DRILL_2026-08-16.md`
