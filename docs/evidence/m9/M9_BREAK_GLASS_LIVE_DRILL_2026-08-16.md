# M9 — Break-Glass Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS (Assurance Domain 7 only; M9 overall remains NOT COMPLETE), **Owner
Post-Event-Review SIGNIERT (siehe §8) — M9-Exit-Gate-Punkt 4 formal erfüllt**
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 7,
§„Evidence Schema"; `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md` (OWNER_ACCEPTED)
§2.8 („Verpflichtender Post-Event-Review"); Owner-Autorisierung: explizite Wahl
„Break-Glass-Drill durchführen (empfohlen)" via `AskUserQuestion`, 2026-08-16.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt **Assurance Domain 7 (Break-Glass)** und trägt zu **M9-Exit-Gate-Punkt 4**
bei — vorbehaltlich des in §8 beschriebenen, noch ausstehenden Owner-Post-Event-Reviews. Er ist
**nicht** M9-Closure — weitere Exit-Gate-Punkte (u. a. Independent Evidence Review) bleiben offen.

Ausgeführt wurde ausschließlich gegen die real live-wired Mechanik: den HTTP-Endpunkt
(`server/systemadmin/breakGlassRouter.ts`, aus PR #403) mit gemocktem `checkAdminAccess`/
`requireStepUp` (dieselbe Testmethodik wie `systemadminExecutionBroker.test.ts`) und die reale
Autorisierungskette (`authorizeSystemadminAuditedExecution`) mit gemocktem Supabase-Audit-Sink
(dieselbe Methodik wie jeder vorherige M9-Drill dieser Sitzung). Kein Produktionszustand, keine
echte GitHub-Mutation, kein Secret/Credential wurde berührt.

**Während der Drill-Vorbereitung gefundene und geschlossene reale Lücke:** Der Router persistierte
den `revoked`-Zustand bisher ausschließlich lokal (`activeMandates`-Map, nur vom `/status`-Endpunkt
gelesen) — die reale Autorisierungskette (`authorizeSystemadminAuditedExecution` →
`evaluateSystemadminRoadmapAuthorization` → `evaluateMandateScope`) hatte **keinen** Mechanismus,
um einen explizit widerrufenen, aber noch nicht abgelaufenen Break-Glass-Mandat tatsächlich
abzulehnen — ein Widerruf hätte also nur die `/status`-Anzeige geändert, nicht die tatsächliche
Durchsetzung. Da die OWNER-akzeptierte Proposal (§2.7) genau diesen Mechanismus bereits spezifiziert
(„ein dediziertes `breakGlassRevoked`-Flag, das denselben Denial-Pattern wie `killSwitchActive`
folgt"), wurde er additiv implementiert (siehe §2) und ist Teil dieses Drills — konsistent mit dem
in dieser Sitzung etablierten Muster (Replay/Idempotency-Drill fand und schloss ebenso eine reale
Integrationslücke additiv vor der eigentlichen Drill-Ausführung).

## 1. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-BREAKGLASS-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T21:03:41Z |
| Exakte Baseline | Commit `41ddf964679c70e84f0cd171eb58df57fdc48920` (main, nach Merge PR #403) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0058 (Agent IAM), ADR-0059/ADR-0065/SA3, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `READ`/`BRANCH` (LOW/MEDIUM), Ziel `github:SvenKulessa/Finance` |

## 2. Implementierung: `breakGlassRevoked`-Durchsetzungshebel

`src/platform/Security/roadmapExecutionMandate.ts`:

- Neue exportierte Konstante `BREAK_GLASS_MANDATE_ID_PREFIX = 'REM-BREAK-GLASS-'` — von
  `breakGlass.ts`s `freshMandateId()` wiederverwendet (vorher dort dupliziertes Literal), damit
  Aussteller und Durchsetzungs-Hebel garantiert denselben Namensraum verwenden.
- Neues optionales Feld `breakGlassRevoked?: boolean` auf
  `SystemadminRoadmapAuthorizationRequest` — caller-seitig übergeben, exakt wie `killSwitchActive`
  (nicht im Mandat selbst eingebettet, da `killSwitch.enabled` Teil der unveränderlichen, sich
  selbst validierenden Mandat-Struktur ist und nach Ausstellung nicht mehr geändert werden kann).
- Neue Prüfung in `evaluateMandateScope()`, direkt neben der bestehenden
  `mandate.killSwitch.enabled`-Prüfung: `breakGlassRevoked === true` **und** `mandateId` beginnt mit
  `BREAK_GLASS_MANDATE_ID_PREFIX` → `DENY`. Bewusst auf den Break-Glass-Namensraum beschränkt — das
  Flag wirkt nicht als sekundärer globaler Kill-Switch für andere Mandate.

**Verbleibende, dokumentierte Grenze:** Es existiert weiterhin **kein realer produktiver Aufrufer**,
der den Router-eigenen `revoked`-Zustand automatisch als `breakGlassRevoked` an die Kette
weiterreicht — der bestehende SA3B-GitHub-Actions-Broker (`systemadminExecutionBrokerRouter.ts`)
akzeptiert ausschließlich vorregistrierte `mandateId`-Muster (SA3B-Haupt-Mandat, SA4-Pilot,
`REM-WORKPACKAGE-*`) und würde ein `REM-BREAK-GLASS-*`-Mandat mit
`workflow-mandate-binding-mismatch` (403) ablehnen, bevor es überhaupt bis zu dieser Prüfung käme.
Das Schließen dieser Lücke (den Broker für Break-Glass-Mandate zu öffnen) wäre eine eigene, größere,
separat zu autorisierende Änderung an der produktiven SA3B-Bindungslogik — bewusst **nicht** Teil
dieses Drills. Der hier bewiesene Durchsetzungshebel ist real und vollständig getestet für jeden
zukünftigen Aufrufer, der `breakGlassRevoked` direkt setzt (wie es dieser Drill selbst tut) — er ist
nur (noch) nicht automatisch an den einzigen heute existierenden produktiven Aufrufer angebunden.

## 3. Angriffs-/Testaufbau

Erweitert zwei bestehende Testdateien um insgesamt 5 neue, drill-gekennzeichnete Testfälle:

**HTTP-Ebene** (`tests/unit/breakGlassRouter.test.ts`, +1 Test): automatischer Ablauf ohne
expliziten Widerruf — ein über den echten HTTP-Endpunkt aktiviertes Mandat ist unmittelbar nach
Aktivierung `active: true`, nach künstlichem Vorspulen der Systemzeit um
`MAX_BREAK_GLASS_DURATION_MS + 1s` (`vi.useFakeTimers()`/`vi.setSystemTime()`) über denselben
`/status`-Endpunkt `active: false, revoked: false` — beweist automatischen Ablauf ohne jede
explizite Aktion.

**Ketten-Ebene** (`tests/unit/breakGlass.test.ts`, +2 Tests, im bestehenden Describe-Block „Break-Glass
mandate through the real live-wired SA3B chain"):

1. Identische Anfrage (gleiche Capability, gleiches Ziel, vor Ablauf) einmal ohne
   (`breakGlassRevoked` unset) und einmal mit `breakGlassRevoked: true` — beweist differenziell,
   dass die Ablehnung ursächlich am Widerruf-Flag liegt, nicht an einer anderen Bedingung (exakt
   dasselbe differenzielle Muster wie der bereits gemergte Kill-Switch-Drill).
2. Ein vollständig unabhängiges, gültiges Nicht-Break-Glass-Mandat (`REM-SA1-PILOT-001`) mit
   `breakGlassRevoked: true` → bleibt `ALLOW` — beweist, dass das Flag strikt auf den
   `REM-BREAK-GLASS-*`-Namensraum beschränkt ist und kein sekundärer globaler Kill-Switch entsteht.

**Bereits vorhandene Abdeckung, hier als Teil des Drills erneut referenziert** (aus
`M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md` §2 und `M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md`
§4, nicht erneut implementiert): starker Owner-Identitäts-/Step-up-Zwang (428 ohne frischen
Step-up), explizite Begründung+Ziel (Aktivierung ohne diese Felder → `DENY`), begrenzte Capability
(andere Capability unter demselben Mandat → `DENY` durch die reale Kette, nicht nur den Aussteller),
30-Minuten-Hartlimit (Ablehnung nach Ablauf durch die reale Kette), keine stille Rollen-Elevation
(vollständige reservierte Denylist geerbt, kein bestehendes Mandat verändert), append-only Audit
(`writeAgentAuditEvent`-Aufrufe für ALLOW und DENY verifiziert).

## 4. Erwartetes vs. tatsächliches Ergebnis (Runbook Domain 7, alle 8 Anforderungen)

| Runbook-Anforderung | Tatsächliches Ergebnis |
|---|---|
| Starker Owner-Identitäts-/Step-up-Zwang | ✅ `requireOwnerWithStepUp()` (Owner-Rolle + frischer Step-up), 428 ohne Step-up, 403 ohne Owner-Rolle |
| Explizite Begründung und Ziel | ✅ `reason`/`targetResource` Pflichtfelder, `DENY` bei Fehlen |
| Begrenzte Capability | ✅ Allowlist von 7 Capabilities; andere Capability unter demselben Mandat wird von der realen Kette verweigert |
| Kurzer Ablauf | ✅ Hartlimit 30 Minuten, nicht caller-einstellbar; automatischer Ablauf via `/status` bewiesen |
| Keine stille Rollen-Elevation | ✅ Neues, eigenständiges Mandat; vollständige reservierte Mutationsklassen-Denylist geerbt; kein bestehendes Mandat/keine Policy-Datei verändert |
| Append-only Audit | ✅ Jede Aktivierung/Ablehnung/Widerruf schreibt ein Audit-Event über den bereits bewiesenen SA3B-Pfad |
| Automatischer/expliziter Widerruf | ✅ Automatisch: `/status` zeigt `active:false` nach Ablauf. **Explizit: jetzt real durchgesetzt** (neuer `breakGlassRevoked`-Hebel), nicht nur in der `/status`-Anzeige — siehe §2 für die während der Drill-Vorbereitung gefundene und geschlossene Lücke |
| Verpflichtender Post-Event-Review | ✅ Artefakt erstellt und **Owner-signiert** 2026-08-16 (`.ai/evidence/break-glass/BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`) — siehe §8 |
| Break-Glass mintet niemals `MERGE`, schwächt nie dauerhaft, Service-Account kann sich nie selbst gewähren | ✅ Strukturell unmöglich (`MERGE` kein bekannter `AgentCapability`); additiv, kein bestehendes Mandat verändert; Aktivierung erfordert zwingend `ownerActorId === SYSTEMADMIN_OWNER_ACTOR_ID` und `stepUpVerified` |

**Testlauf:** `npx vitest run` — **195 Dateien, 1204 Tests, alle PASS** (davon neu in diesem Drill:
5 — 1 in `breakGlassRouter.test.ts`, 2 in `breakGlass.test.ts`, plus die bereits vorher gezählten
10+27 aus den vorherigen Break-Glass-Schritten). `npm run lint` (`tsc --noEmit`) PASS.

## 5. Audit-/Outcome-Referenzen

Wie bei jedem vorherigen M9-Drill dieser Sitzung ist die Supabase-Senke in der Testumgebung gemockt
— die Audit-Referenzen sind synthetische Testwerte, keine echten Produktions-Audit-IDs. Die
tatsächlich geschriebenen Payload-Felder (`authorization_decision`, `result`) wurden jedoch gegen
die reale, unveränderte `writeAgentAuditEvent`-Funktion geprüft — dieselbe Funktion, die auch im
echten SA3B-Produktionspfad läuft.

## 6. Seiteneffekt-/Rollback-Zustand

Kein Seiteneffekt: keine echte Branch-/Commit-/PR-/CI-Aktion wurde ausgelöst. Kein Rollback
erforderlich — nichts an bestehendem Produktions- oder Repository-Zustand wurde verändert. Der neue
`breakGlassRevoked`-Hebel ist rein additiv (neues optionales Feld, neue Prüfung, die nur bei
gesetztem Flag UND `REM-BREAK-GLASS-*`-Namensraum greift) — kein bestehender Aufrufer, kein
bestehendes Mandat, keine bestehende Policy ist betroffen.

## 7. Residual Findings

1. **Kein realer Aufrufer bindet den Router-`revoked`-Zustand automatisch an
   `breakGlassRevoked`** (§2) — der neue Durchsetzungshebel ist bewiesen funktionsfähig, aber ohne
   Anbindung an den heute einzigen produktiven Aufrufer (SA3B-Broker), da dieser Break-Glass-Mandate
   strukturell noch gar nicht akzeptiert. Empfehlung: eigener, separat zu autorisierender
   Folgeschritt, falls Break-Glass jemals über den automatisierten Broker statt (wie aktuell
   implizit vorgesehen) über manuelle Owner-Aktion genutzt werden soll.
2. **Bereits dokumentiert, unverändert bestehend** (`M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md` §3):
   `requireStepUp()` filtert das `purpose`-Feld beim Konsum nicht — betrifft alle Step-up-gated
   Endpunkte, nicht nur Break-Glass.

**Keine neuen ungeklärten CRITICAL-Funde.** Beide Punkte sind bekannte, bewusst nicht in diesem
Schritt behobene Grenzen gemeinsam genutzter oder noch nicht angebundener Infrastruktur, kein neuer
Design-Fehler in Break-Glass selbst.

## 8. Verpflichtender Post-Event-Review (Proposal §2.8)

Gemäß der akzeptierten Proposal ist ein strukturiertes Post-Review-Artefakt verpflichtend, **bevor**
M9-Exit-Gate-Punkt 4 als erfüllt gelten kann — „Kein automatisches PASS ohne dieses Review."

Artefakt erstellt unter: `.ai/evidence/break-glass/BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`

Da es sich um einen **synthetischen Drill, keinen echten Notfall** handelt, sind die inhaltlichen
Pflichtfelder entsprechend als „N/A — synthetischer Drill" bzw. mit der Drill-spezifischen Analyse
beantwortet (siehe Artefakt). Die **Owner-Signatur wurde 2026-08-16 explizit erteilt** ("signing" /
"führe signature durch", in dieser Sitzung) — kein Agent hat sich selbst genehmigt; die offenen
Folgepunkte (Broker-Anbindung des Widerruf-Hebels, `requireStepUp()`-`purpose`-Filter) wurden dem
Owner vor der Signatur offengelegt (Post-Review §4) und bleiben als separat zu behandelnde,
nicht-blockierende Punkte bestehen.

## 9. Bezug zum M9-Exit-Gate

- Punkt 4 „break-glass drill PASS": **technisch vollständig ausgeführt und bewiesen, formal erfüllt**
  nach Owner-Signatur des Post-Event-Reviews (§8), 2026-08-16 — exakt wie von der akzeptierten
  Proposal selbst gefordert.
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf, bis auch die übrigen
  Exit-Gate-Punkte (insbesondere Punkt 6, Independent Evidence Review) erfüllt sind; dieser Drill
  allein schließt M9 nicht ab.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md`
- `docs/evidence/m9/M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md`
- `docs/evidence/m9/M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md`
- `.ai/evidence/break-glass/BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`
- `src/platform/Security/breakGlass.ts`
- `src/platform/Security/roadmapExecutionMandate.ts`
- `server/systemadmin/breakGlassRouter.ts`
- `tests/unit/breakGlass.test.ts`
- `tests/unit/breakGlassRouter.test.ts`
