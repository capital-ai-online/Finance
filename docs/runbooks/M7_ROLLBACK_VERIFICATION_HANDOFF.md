# M7 — Deployment Rollback Verification: Mutation Work Order

Status: Rollback **VERIFIED PASS** (durchgeführt und real verifiziert, siehe Nachtrag Abschnitt 9) — Roll-Forward ausstehend
Datum: 2026-08-14 (Nachtrag: 2026-08-14, selber Tag)
Roadmap phase: M7 (ADR-0061, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`, Exit-Gate-Punkt 7
„rollback is proven")
Authority: `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`,
`docs/runbooks/RENDER_PRODUCTION_EVIDENCE_HANDOFF.md`

## 0. Warum dies kein maschinenvalidierter Handoff ist / warum diese Sitzung nicht selbst ausführt

Wie bei der Deploy-Hook-Rotation (`docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md`): kein
verifizierter autonomer Execution Host für Render-Mutationen; `executorAgentId` im Handoff-Schema ist
fest auf SA3B (kein Render-Zugriff) gebunden.

**Zusätzlicher Grund, spezifisch für diese Mutation:** Das einzige in dieser Sitzung verfügbare
Render-Mutations-Tool (`trigger_deploy`) kann ausschließlich einen **neuen** Deploy des aktuellen
Branches/Images auslösen — es kann **keinen spezifischen früheren Deploy als Rollback-Ziel**
adressieren. Render's tatsächliche „Rollback zu einem bestimmten früheren Deploy"-Funktion ist
ausschließlich über das Render-Dashboard verfügbar, nicht über ein in dieser Sitzung nutzbares Tool.
Diese Mutation kann technisch gar nicht von dieser Sitzung ausgeführt werden, unabhängig von
CLAUDE.md's Grundsatz, keine Render-Produktion direkt von einem Entwicklungsschritt aus zu mutieren.

## 1. Ziel

Beweisen, dass ein echter Render-Rollback auf einen vorherigen, bereits verifizierten Deploy
funktioniert — das im M7-Runbook-Exit-Gate (Punkt 7) geforderte, bisher ungetestete
„rollback is proven". Danach: Roll-Forward auf den aktuellen `main`-Stand.

## 2. Strukturierte Feldbeschreibung (konzeptuell an den Handoff Contract angelehnt)

- **platform**: `RENDER`
- **mutationClass**: `DEPLOYMENT`
- **riskClass**: `LOW` — beide beteiligten Commits sind reine Dokumentationsänderungen
  (`docs/**`), es gibt **keinen** Anwendungs-/Laufzeitcode-Unterschied zwischen ihnen. Live-Traffic
  während des Tests erhält funktional identisches Verhalten, lediglich ein anderer
  `x-capital-ai-commit`-Identitäts-Header.
- **targetResource**: Render-Service `srv-d91o1o9o3t8c73edi55g` ("Finance").
- **allowedOperations**: `RENDER_ROLLBACK_TO_DEPLOY:dep-d9vp043m8hqs73dv238g`,
  anschließend `RENDER_REDEPLOY_LATEST_MAIN:srv-d91o1o9o3t8c73edi55g` (Roll-Forward).
- **forbiddenOperations**: jede andere Service-/Environment-/Secret-Änderung; Rollback auf einen
  anderen als den unten benannten exakten Deploy; `MERGE`; `SELF_AUTHORITY_EXPANSION`;
  `SECURITY_CONTROL_DISABLEMENT`.
- **expectedPostState**: unmittelbar nach Rollback läuft Deploy `dep-d9vp043m8hqs73dv238g`
  (Commit `8b4cab066c7c893c4525cd8e015e80919b145bde`) live; nach Roll-Forward läuft wieder der
  aktuelle `main`-Stand live.
- **idempotencyKey**: `m7-rollback-verification-2026-08-14`.
- **expiresAt**: verfällt nach 14 Tagen ab Erstellungsdatum — danach vor Ausführung erneut gegen
  aktuellen `main`/Produktionsstand prüfen (die genannte Deploy-ID könnte in Render's Historie
  ablaufen/nicht mehr rollback-fähig sein).

## 3. Pre-Mutation Baseline (read-only erfasst, 2026-08-14T22:31 UTC)

```yaml
renderProductionEvidence:
  capturedAt: 2026-08-14T22:31:00Z
  service:
    id: srv-d91o1o9o3t8c73edi55g
    name: Finance
  currentLiveDeploy:
    id: dep-d9vp6unmal7c73855dq0
    commitSha: 888112d483764ef8f5d8abb918ac0e1b855c9a9d
    commitMessage: "Merge pull request #270 (docs(m7): Deploy-Hook-Rotation Work Order)"
    status: live
  rollbackTargetDeploy:
    id: dep-d9vp043m8hqs73dv238g
    commitSha: 8b4cab066c7c893c4525cd8e015e80919b145bde
    commitMessage: "Merge pull request #269 (docs(m7): Repository-Controls-Paket VERIFIED PASS)"
    status: deactivated (war zuvor selbst `live` und `healthy`, siehe Nachtrag Abschnitt 0.2 in
      docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md)
  diffBetweenCurrentAndTarget: "ausschließlich docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md
    (neue Datei) — keine Anwendungs-/Laufzeitcode-Änderung"
```

Kein Secret-Wert wurde zu irgendeinem Zeitpunkt gelesen oder ausgegeben.

## 4. Durchführung (durch `SvenKulessa`, nicht durch diese Sitzung)

1. Render-Dashboard → Service `Finance` → Tab „Deploys".
2. Den Eintrag für Deploy `dep-d9vp043m8hqs73dv238g` (Commit `8b4cab066...`, „docs(m7):
   Repository-Controls-Paket auf VERIFIED PASS abschließen") suchen.
3. Render's „Rollback"-Aktion für genau diesen Deploy auslösen (Render redeployt exakt dieses
   bereits gebaute Image, ohne Neu-Build).
4. Mir Bescheid geben, sobald der Rollback abgeschlossen ist — **vor** dem Roll-Forward-Schritt.
5. Nach meiner Rollback-Verifikation (Abschnitt 5): entweder erneut über das Dashboard „Deploy
   latest commit" für `main` auslösen, oder einfach den nächsten reguränen Merge/Push abwarten
   (jeder künftige PR-Merge auf `main` löst über den Deploy-Hook automatisch einen frischen Deploy
   des dann aktuellen `main`-Standes aus und stellt damit den Soll-Zustand wieder her).

## 5. Post-Mutation Verification (durch diese Sitzung, read-only)

Nach Owner-Rückmeldung „Rollback durchgeführt":

1. per `list_deploys`/`get_service` (Render-MCP, read-only) bestätigen, dass Deploy
   `dep-d9vp043m8hqs73dv238g` (oder ein neuer, gleichwertiger Rollback-Deploy-Eintrag mit
   identischem Commit) jetzt `status: live` meldet;
2. Zeitstempel/Reihenfolge in der Deploy-Historie prüfen, dass der Rollback tatsächlich nach dem
   vorherigen Live-Deploy erfolgte;
3. Ergebnis dokumentieren — **kein** automatisierter `/healthz`-Check möglich (kein Netzwerkzugriff
   dieser Sandbox auf `capital-ai.online`, siehe an anderer Stelle in dieser Sitzung wiederholt
   dokumentiert); Render's eigene, unabhängige Deploy-Status-Meldung ist die primäre Evidence.
4. Nach Bestätigung: Owner um Roll-Forward bitten (Abschnitt 4, Schritt 5) und dessen Abschluss
   ebenfalls per `list_deploys` bestätigen — Produktion darf nicht dauerhaft auf dem älteren Commit
   verbleiben.

## 6. Rollback des Rollbacks (falls nötig)

Sollte der Rollback selbst fehlschlagen oder unerwartetes Verhalten zeigen: Owner löst im
Render-Dashboard erneut „Deploy latest commit" für `main` aus — stellt sofort den bekannten guten
Zustand wieder her. Kein Datenverlust möglich, da beide beteiligten Commits reine
Dokumentationsänderungen sind.

## 7. Evidence Output (nach Abschluss zu ergänzen)

Nach erfolgreichem Rollback + Roll-Forward: Nachtrag in diesem Dokument mit beiden
Verifikationsergebnissen (Deploy-IDs, Zeitstempel, kein Secret-Wert). Anschließend
`docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`, `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md`
und beide Traceability-Matrizen aktualisieren — M7-Exit-Gate-Punkt 7 („rollback is proven") als
erfüllt markieren; M7 als Ganzes bleibt weiterhin unterhalb `VERIFIED PASS`, bis auch die volle
„Required Negative Tests"-Liste geklärt ist (siehe `docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md`
Abschnitt 9 für die bereits dokumentierte Einschränkung).

## 9. Nachtrag — Rollback real durchgeführt und verifiziert (2026-08-14)

Der Owner hat im Render-Dashboard den Rollback auf den in Abschnitt 3 genannten Ziel-Deploy
ausgelöst und dieser Sitzung Bescheid gegeben. Read-only Verifikation per `list_deploys`
(Render-MCP, unabhängig von GitHub):

```yaml
rollbackDeploy:
  id: dep-d9vpuru1egvs73f7684g
  commitSha: 8b4cab066c7c893c4525cd8e015e80919b145bde
  status: live
  trigger: rollback   # Render's eigene Klassifizierung des Auslösers - nicht "deploy_hook"
  startedAt: 2026-08-14T23:06:28Z
  finishedAt: 2026-08-14T23:06:48Z
```

`trigger: "rollback"` ist Render's **eigene** Einordnung des Auslösers (nicht `deploy_hook`,
nicht `manual`) — ein unabhängiger, plattformseitiger Beweis, dass tatsächlich die
Rollback-Funktion verwendet wurde, nicht ein gewöhnlicher Neu-Deploy. Commit stimmt exakt mit dem
in Abschnitt 3 benannten Ziel überein.

**Nebenbefund** (kein Fehler, nur zur Vollständigkeit dokumentiert): Während des Rollback-Zeitfensters
löste ein regulärer `push` auf `main` (Merge von PR #275, Commit `3cc92df6...`) über den Deploy-Hook
einen weiteren, unabhängigen Deploy-Versuch aus (`dep-d9vpuq7mal7c7386r55g`). Dieser wurde von Render
selbst mit `status: canceled` markiert, da der Rollback-Vorgang Vorrang erhielt. Das bedeutet:
Produktion lief nach dem Rollback auf dem alten Commit `8b4cab06...`, während `main` bereits deutlich
weiter war (PR #274 Outbox-Migration, PR #275 Market-Data-Contracts/Alpaca-Adapter — beides echte
Code-Änderungen, kein reiner Dokumentations-Diff mehr). Der Roll-Forward (Abschnitt 4, Schritt 5) ist
daher **nicht optional/kosmetisch**, sondern erforderlich, um Produktion wieder mit aktuellem `main`
zu synchronisieren.

**Ergebnis:** M7-Exit-Gate-Punkt 7 („rollback is proven") ist real bewiesen — ein echter,
Render-seitig als solcher klassifizierter Rollback auf einen spezifischen vorherigen Deploy wurde
erfolgreich durchgeführt und unabhängig verifiziert.

**Roll-Forward-Plan:** Statt eines direkten Render-Dashboard-Klicks oder eines Aufrufs von
`mcp__render__trigger_deploy` aus dieser Sitzung (was den vollständigen CI-Gate — `build-and-test`,
M6-`supply-chain-attestation` — umgehen würde, da dieses Tool nicht über den GitHub-Actions-Pfad
läuft), erfolgt der Roll-Forward über den **regulären Merge dieses PRs**: der resultierende
`push`-Lauf auf `main` löst `deploy-production` über die normale, M6-attestation-gegatete Kette aus
und deployt automatisch den dann aktuellen `main`-Stand. Das ist der einzige Weg, Produktion wieder
auf `main` zu bringen, ohne die M6/M7-Gate-Kette für diesen einen Deploy zu umgehen. Nachtrag mit dem
Roll-Forward-Ergebnis folgt als separater PR, sobald dieser hier gemergt ist.

## 8. Freigabestatus

- [x] Human/Owner: Work Order geprüft und Umfang bestätigt (insbesondere: welcher Deploy exakt als
      Rollback-Ziel dient).
- [x] Human/Owner: Rollback durchgeführt (Schritt 1–4).
- [x] Diese Sitzung: Rollback-Verifikation durchgeführt und dokumentiert (Abschnitt 9).
- [ ] Human/Owner: Roll-Forward durchgeführt. — erfolgt automatisch beim Merge dieses PRs (siehe
      Abschnitt 9, „Roll-Forward-Plan").
- [ ] Diese Sitzung: Roll-Forward-Verifikation durchgeführt und dokumentiert. — folgt als separater
      Nachtrag/PR nach diesem Merge.

**Dieses Dokument autorisiert selbst keine weitere Ausführung.** Der Rollback ist bereits erfolgt
(siehe Abschnitt 9); der Roll-Forward ergibt sich automatisch aus dem regulären, CI-gegateten
Merge-Prozess dieses PRs.
