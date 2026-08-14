# M7 — Render Deploy-Hook-Rotation: Mutation Work Order

Status: PROPOSED (nicht ausgeführt)
Datum: 2026-08-14
Roadmap phase: M7 (ADR-0061, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`)
Authority: `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`,
`docs/runbooks/RENDER_PRODUCTION_EVIDENCE_HANDOFF.md`

## 0. Warum dies kein maschinenvalidierter Handoff ist

`.ai/contracts/development-chain-mutation-handoff.schema.json` erzwingt
`executorAgentId: "capital-ai-systemadmin-roadmap-executor"` (SA3B) als einzig gültigen Executor.
SA3B ist ein GitHub-Actions/OIDC-Host mit ausschließlich GitHub-seitigem Mandat (kein
Render-API-Zugriff) — es existiert derzeit kein verifizierter, autonomer Execution Host für
Render-Mutationen. Diese Mutation wird daher **direkt vom Human Owner** durchgeführt, exakt nach
dem in `RENDER_PRODUCTION_EVIDENCE_HANDOFF.md` etablierten Muster (wie bereits bei den M5A-
Faktor-Registrierungen). Dieses Dokument folgt der konzeptuellen Struktur des Mutation Handoff
Contract (Ziel, erlaubte/verbotene Operationen, Pre-/Post-Checks, Rollback), ist aber **keine**
`.json`-Instanz gegen das Schema und autorisiert nichts von selbst.

Gemäß `CLAUDE.md` mutiert diese Claude-Code-Sitzung **nicht direkt** Render-Produktionskonfiguration
von einem Entwicklungsschritt aus. Diese Sitzung bereitet den Work Order vor, führt die
Pre-/Post-Mutation-Verifikation read-only durch und dokumentiert das Ergebnis — die eigentliche
Änderung im Render-Dashboard und in den GitHub-Secrets erfolgt durch `SvenKulessa` selbst.

## 1. Ziel

Den bestehenden Render-Deploy-Hook (referenziert als GitHub-Actions-Secret
`RENDER_DEPLOY_HOOK_URL`, verwendet in `.github/workflows/ci.yml`, Job `deploy-production`)
rotieren: neuen Hook erzeugen, GitHub-Secret aktualisieren, alten Hook widerrufen. Beweist die im
M7-Runbook geforderte „rotation/revocation"-Fähigkeit für die Deployment-Credential-Bridge — bisher
ungetestet.

## 2. Strukturierte Feldbeschreibung (konzeptuell an den Handoff Contract angelehnt)

- **platform**: `RENDER` (Hook-Erzeugung/-Widerruf) + `GITHUB` (Secret-Update)
- **mutationClass**: `PLATFORM_CONFIG`
- **riskClass**: `LOW` — betrifft ausschließlich den CI→Render-Deploy-Trigger, nicht die laufende
  Produktionsinstanz; ein Fehler führt bestenfalls dazu, dass ein Deploy-Trigger fehlschlägt, nicht
  zu einem Ausfall des laufenden Service.
- **targetResource**: Render-Service `srv-d91o1o9o3t8c73edi55g` ("Finance", `SvenKulessa/Finance`,
  Environment `evm-d90oshpkh4rs739l1fm0`); GitHub-Repository-Secret `RENDER_DEPLOY_HOOK_URL`
  (`SvenKulessa/Finance` → Settings → Secrets and variables → Actions).
- **allowedOperations**: `RENDER_ROTATE_DEPLOY_HOOK:srv-d91o1o9o3t8c73edi55g`,
  `GITHUB_UPDATE_SECRET:RENDER_DEPLOY_HOOK_URL`.
- **forbiddenOperations**: jede andere Render-Service-/Environment-/Secret-Änderung; `MERGE`;
  `SELF_AUTHORITY_EXPANSION`; `SECURITY_CONTROL_DISABLEMENT`; jede Änderung an anderen Secrets/Keys.
- **expectedPostState**: neuer Deploy-Hook aktiv, GitHub-Secret auf neuen Wert aktualisiert, alter
  Hook nicht mehr funktionsfähig, laufende Produktionsinstanz unverändert (kein Neustart durch die
  Rotation selbst ausgelöst).
- **idempotencyKey**: `m7-deploy-hook-rotation-2026-08-14` (einmalige Aktion; bei Wiederholung neuer
  Key mit neuem Datum).
- **expiresAt**: dieser Work Order verfällt, wenn nicht innerhalb von 14 Tagen ab Erstellungsdatum
  durchgeführt — danach vor Ausführung erneut gegen aktuellen `main`/Produktionsstand prüfen.

## 3. Pre-Mutation Baseline (read-only erfasst, 2026-08-14T21:55 UTC)

```yaml
renderProductionEvidence:
  capturedAt: 2026-08-14T21:55:00Z
  service:
    id: srv-d91o1o9o3t8c73edi55g
    name: Finance
    runtime: docker
    repo: SvenKulessa/Finance
    branch: main
    region: frankfurt
    plan: starter
    instances: 1
    healthCheckPath: /healthz
    autoDeployTrigger: "off"
  deploy:
    liveDeployId: dep-d9vomis9v7es73bc29e0
    liveCommitSha: fd52af95449ef4ee13114dba0649976126d0db8d
    liveStatus: live
  githubSecretReferenced: RENDER_DEPLOY_HOOK_URL (Wert nicht gelesen/eingesehen)
```

Kein Secret-Wert wurde zu irgendeinem Zeitpunkt gelesen oder in dieser Sitzung ausgegeben — nur
Service-/Deploy-Metadaten über die read-only Render-MCP-Tools (`get_service`, `list_deploys`).

## 4. Durchführung (durch `SvenKulessa`, nicht durch diese Sitzung)

1. Render-Dashboard → Service `Finance` → Settings → Deploy Hook → neuen Hook erzeugen (Render
   erzeugt eine neue URL; je nach Render-UI-Version alten Hook explizit widerrufen/löschen, falls er
   nicht automatisch invalidiert wird — bitte im Dashboard prüfen).
2. Neue Hook-URL **niemals** in Chat, PR, Issue, Screenshot oder Dokumentation einfügen.
3. GitHub → `SvenKulessa/Finance` → Settings → Secrets and variables → Actions → `RENDER_DEPLOY_HOOK_URL`
   → Wert auf die neue URL aktualisieren.
4. Alten Hook im Render-Dashboard als widerrufen/gelöscht bestätigen.
5. Mir (dieser Sitzung) Bescheid geben, sobald Schritt 1–4 abgeschlossen sind.

## 5. Post-Mutation Verification (durch diese Sitzung, read-only)

Nach Rückmeldung des Owners:

1. auf den nächsten realen `push`-Lauf auf `main` warten (oder einen bewusst ausgelösten leeren
   Commit anfragen, falls kein natürlicher Push ansteht);
2. `deploy-production`-Job-Log prüfen: Schritt „Render-Deployment für verifizierten main-Commit
   auslösen" muss weiterhin PASS liefern (beweist: neuer Hook funktioniert, GitHub-Secret korrekt
   aktualisiert);
3. per `list_deploys` (Render-MCP, read-only) bestätigen, dass für den ausgelösten Commit ein neuer
   Deploy-Eintrag mit `status: live` erscheint;
4. `verify-deployment-identity`-Job weiterhin PASS (bestätigt: Ende-zu-Ende-Kette weiterhin intakt);
5. optional, falls vom Owner bestätigbar: manueller Test, dass der **alte** Hook-URL-Aufruf jetzt
   fehlschlägt (Beweis des Widerrufs) — nur wenn der Owner die alte URL noch zur Hand hat, sonst
   entfällt dieser Schritt ersatzlos (kein Secret-Wert wird dafür angefragt oder gespeichert).

## 6. Rollback

Bei Fehlschlag (neuer Hook funktioniert nicht): Owner erzeugt im Render-Dashboard erneut einen
neuen Hook und aktualisiert das GitHub-Secret erneut — keine Datenverlust-, Ausfall- oder
Sicherheitsfolge, da die laufende Produktionsinstanz von diesem Vorgang nicht betroffen ist. Kein
Rollback auf den alten (potenziell kompromittierten/beendeten) Hook — neue Rotation statt Rückfall
auf den alten Wert, konsistent mit `RENDER_PRODUCTION_EVIDENCE_HANDOFF.md` Abschnitt 15
(„Secret regression").

## 7. Evidence Output (nach Abschluss zu ergänzen)

Nach erfolgreicher Durchführung: Nachtrag in diesem Dokument mit Post-Mutation-Verifikationsergebnis
(Job-Run-Link, Deploy-ID, Commit-SHA) — kein Secret-Wert. Anschließend `docs/evidence/m7/*`
entsprechend ergänzen und M7-Traceability für dieses Element aktualisieren.

## 8. Freigabestatus

- [ ] Human/Owner: Work Order geprüft und Umfang bestätigt.
- [ ] Human/Owner: Schritte 1–4 durchgeführt.
- [ ] Diese Sitzung: Post-Mutation Verification durchgeführt und dokumentiert.

**Dieses Dokument autorisiert selbst keine Ausführung.** Es liegt ausschließlich am Owner, ob und
wann die in Abschnitt 4 beschriebenen Schritte durchgeführt werden.
