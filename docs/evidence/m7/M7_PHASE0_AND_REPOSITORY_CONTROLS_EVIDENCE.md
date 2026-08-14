# M7 — Deployment Identity: Phase-0-Preflight und Repository-Controls Evidence

Status: PHASE 0 COMPLETE, REPOSITORY CONTROLS CODE COMPLETE / CI-VERIFIKATION PENDING FIRST MAIN PUSH
Datum: 2026-08-14
Roadmap phase: M7
Authority: ADR-0061, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`,
`docs/architecture/ai-agent/AI_AGENT_DEPLOYMENT_IDENTITY.md`
Executor: direkte Owner-instruierte Claude-Code-Sitzung (kein SA4/neuer autonomer Host — dieselbe
Vorgehensweise wie M5A/M6, vom Owner nach Rückfrage bestätigt)

## 0. Explizit NICHT Teil dieser Sitzung

Diese Sitzung führt **keine** echte Render-, Stripe- oder Supabase-Mutation durch. Kein Deploy
wurde manuell ausgelöst, keine Umgebungsvariable/kein Secret geändert, kein Service erstellt oder
gelöscht. Alle Render-Zugriffe in Abschnitt 1 sind ausschließlich lesend
(`list_workspaces`, `select_workspace`, `list_services`, `list_deploys`) über die Render-MCP-Tools
dieser Sitzung. Der M7-Runbook-Owner-Mutation-Gate (Abschnitt „Owner Mutation Gate") wurde nicht
durchlaufen und ist für diese Sitzung nicht relevant, da keine externe Mutation stattfindet.

## 1. Phase 0 — Read-only Preflight (Runbook-Abschnitt „Phase 0")

| Runbook-Schritt | Befund |
|---|---|
| M6 `COMPLETE / VERIFIED PASS` bestätigen | Bestätigt — `docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md`, realer signierter+verifizierter `push`-Lauf [`31834114193`](https://github.com/SvenKulessa/Finance/actions/runs/31834114193). |
| aktuellen `main` + M6-Evidence auflösen | `main@6d611ddda387bfe620e826d110f9a5623dce4378` (Merge PR #263) zum Zeitpunkt dieser Preflight. |
| exakte(n) Render-Service(s)/Environment(s)/Deploy-Pfad/aktuell deployten Commit identifizieren | Genau ein Service: `srv-d91o1o9o3t8c73edi55g` ("Finance", `web_service`, Docker-Runtime, Region Frankfurt, Plan starter, 1 Instanz, `https://finance-7clq.onrender.com`). Aktueller live Deploy zum Preflight-Zeitpunkt: `dep-d9vnagpt0dsc73e2gnhg`, Status `live`, Commit `6d611ddda387bfe620e826d110f9a5623dce4378` — identisch mit `main` zu diesem Zeitpunkt, keine Drift. |
| Credential-/Hook-Ownership, Rotation, Revocation ohne Wertexposition inspizieren | Bestehender Mechanismus: `RENDER_DEPLOY_HOOK_URL` als GitHub-Actions-Secret, referenziert in `.github/workflows/ci.yml` (`deploy-production`-Job), Wert nie gelesen/ausgegeben. Render selbst zeigt zusätzlich einen GitHub-Container-Registry-Credential-Eintrag (`rgc-d9saj5c9v7es73ei60mg`, Name „capital-ai-container-registr", Username `SvenKulessa`) — nur Metadaten eingesehen, kein Secret-Wert. Rotation/Revocation-Pfad dieser beiden Credentials liegt weiterhin ausschließlich im Render-Dashboard/GitHub-Secrets, nicht in dieser Sitzung geändert. |
| GitHub OIDC direkt nutzbar? | Render bietet keine direkte GitHub-OIDC-Föderation für Deploy-Trigger (Stand dieser Prüfung) — der bestehende Secret-Bridge-Mechanismus (Deploy-Hook-URL als Secret) bleibt der einzige verfügbare Weg; dokumentiert hier, nicht geändert. |
| Health-/Readiness-/Rollback-Mechanismus inspizieren | `render.yaml`: `healthCheckPath: /healthz`; Laufzeit-Endpoint `server/routes/health.ts` liefert u. a. ADR-0036-Deployment-Identität (`server/deploymentIdentity.ts`: `version`, `commitSha`, `branch`, `repoSlug`, `provider`) — bereits vor M7 vorhanden, von `scripts/pr/productionPreflight.mjs` bereits für PR-Baselines genutzt. Automatisierte **Post-Deploy**-Prüfung existierte vor dieser Sitzung **nicht** — `deploy-production` löste den Deploy-Hook aus und endete sofort, ohne je zu prüfen, ob der erwartete Commit tatsächlich live ging. Das ist die konkrete Lücke, die Abschnitt 2 schließt. |
| jede vorgeschlagene Plattform-Mutation einzeln klassifizieren | Für diesen Schritt vorgeschlagene Mutation: **keine**. Die einzige bereits *bestehende* Mutation (Render-Deploy-Hook-Aufruf) bleibt unverändert in ihrer Wirkung; diese Sitzung ändert nur, *wann* sie ausgelöst wird (fail-closed hinter M6-Attestation) und ergänzt eine *rein lesende* Nachverifikation. |
| DevelopmentChain Mutation Handoff je extern mutierendem Ziel vorbereiten | Nicht erforderlich für diesen Schritt — keine neue externe Mutation eingeführt. |
| Last-known-good Deploy + Rollback-Trigger definieren | Letzter bekannter guter Deploy zum Preflight-Zeitpunkt: `dep-d9vnagpt0dsc73e2gnhg` (Commit `6d611ddd...`, `live`). Rollback-Trigger bleibt der bestehende Render-Mechanismus (vorheriger Deploy in der Render-Historie); kein neuer Rollback-Automatismus in diesem Schritt eingeführt. |
| aktive Deploy-/Config-Writer prüfen | Kein Hinweis auf einen aktiven, parallelen Deploy-/Config-Writer zum Preflight-Zeitpunkt; `list_deploys` zeigte eine konsistente, monoton fortschreitende Deploy-Historie ohne konkurrierende Läufe. |

**Zusätzlicher Befund (nicht Teil des Runbook-Checklisten-Items, aber sicherheitsrelevant genug für
Aufnahme hier):** `render.yaml` deklariert `autoDeployTrigger: checksPass`, der live Service meldet
laut `list_services` jedoch `"autoDeployTrigger":"off"`. Diese Sitzung hat das **nicht** geändert und
keine Ursache angenommen — laut Owner-Rückfrage bleibt dies offen für spätere Klärung (könnte eine
bewusste manuelle Owner-Einstellung im Render-Dashboard sein). Der bestehende explizite
Deploy-Hook-Aufruf in `deploy-production` funktioniert unabhängig von diesem Auto-Deploy-Setting.

## 2. Repository Implementation (Runbook-Abschnitt „Repository Implementation")

Vom Owner bestätigter Scope: **Provenance-Gate + Post-Deploy-Verifikation** (empfohlene Option).

### 2.1 Provenance-Gate

`deploy-production` hängt jetzt zusätzlich von `supply-chain-attestation` (M6) ab:
`needs: [build-and-test, supply-chain-attestation]`, `if:` prüft zusätzlich
`needs.supply-chain-attestation.result == 'success'`. Schließt die Lücke im Required Trust Chain
(„M6 verified artifact/provenance → protected deployment request"): vorher konnte ein Deploy
ausgelöst werden, auch wenn die Attestation fehlschlug, da beide Jobs nur parallel von
`build-and-test` abhingen.

### 2.2 Post-Deploy-Verifikation

Neuer Job `verify-deployment-identity` (`needs: [deploy-production]`, nur `push`+`main`, eigene
minimale Berechtigung `contents: read`): pollt `https://capital-ai.online/healthz` (per
`scripts/deployment/verifyDeploymentIdentity.ts`), bis der ausgelöste Commit als `live`+`healthy`
gemeldet wird, oder schlägt nach Timeout (Standard 5 Minuten, 10s-Intervall) fail-closed fehl.
Prüft: HTTP 2xx, `status: "ok"`, exakter Commit-Match (case-insensitive), Repository-Match,
Branch `== main`. Redigierte Evidence (kein Secret-Wert) wird sowohl bei PASS als auch bei
FAIL/Timeout nach `artifacts/deployment/deployment-identity-evidence.json` geschrieben und per
`actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` (Tag `v7.0.1`, bereits in M6
gegen den Ursprungs-Repository verifiziert) 90 Tage aufbewahrt.

### Neue/geänderte Dateien

| Datei | Zweck |
|---|---|
| `scripts/deployment/verifyDeploymentIdentity.ts` (neu) | Exportiert reine `verifyDeploymentIdentity()`-Prüf-Funktion + CLI mit Poll-Loop, fail-closed bei Timeout/Mismatch. |
| `tests/unit/verifyDeploymentIdentity.test.ts` (neu) | 10 Tests: 1 Positiv-Fall (exakter Match), 1 Positiv-Fall (kein Repository-Constraint), 1 Case-Insensitivitäts-Fall, 7 Negativ-Fälle. |
| `.github/workflows/ci.yml` (geändert) | `deploy-production` jetzt zusätzlich von `supply-chain-attestation` abhängig; neuer Job `verify-deployment-identity`. |
| `docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md` (dieses Dokument, neu) | Phase-0- und Repository-Controls-Evidence. |

## 3. Required Positive/Negative Tests (Runbook-relevant, für dieses Skript)

Die Runbook-Liste „Required Negative Tests" enthält mehrere Fälle außerhalb des Scopes dieses
reinen Post-Verifikations-Skripts (z. B. Handoff-Target-Mismatch, abgelaufene Owner-Approval,
Replay-Dedupe — diese betreffen die noch nicht implementierte externe Mutationsausführung, siehe
Abschnitt 4). Die für `verifyDeploymentIdentity.ts` tatsächlich relevanten Fälle sind alle in
`tests/unit/verifyDeploymentIdentity.test.ts` abgedeckt:

- PASS: exakter Commit-/Repository-/Branch-Match auf gesunder Antwort;
- PASS: `expectedRepository: null` überspringt die Repository-Prüfung (für lokale/Test-Läufe ohne `GITHUB_REPOSITORY`);
- PASS: Groß-/Kleinschreibung des erwarteten SHA wird case-insensitive behandelt;
- DENY: HTTP-Antwort nicht 2xx → „health/readiness failure" aus der Runbook-Liste;
- DENY: `status != "ok"`;
- DENY: fehlender/ungültiger Commit im Deployment-Payload;
- DENY: deployter Commit ≠ erwarteter Commit → „source/provenance/artifact mismatch" aus der Runbook-Liste;
- DENY: Repository-Mismatch;
- DENY: Branch ≠ `main` → „deploy request from non-main or unverified source" aus der Runbook-Liste;
- DENY: erwarteter Commit selbst kein gültiger 40-Zeichen-SHA.

Zusätzlich lokal bestätigt (siehe Abschnitt 5): CLI schlägt korrekt fehl, wenn `VERIFIED_COMMIT_SHA`
fehlt, und schreibt bei Timeout gegen eine unerreichbare URL korrekt eine `FAILED / TIMEOUT`-Evidence
nach 3 Versuchen (Poll-Intervall 1s, Timeout 3s im Test).

## 4. Warum dieses Dokument (noch) nicht „VERIFIED PASS" meldet

Der neue Job `verify-deployment-identity` läuft — wie `supply-chain-attestation` zuvor — ausschließlich
auf `push`+`main` und hat zum Zeitpunkt dieses PRs noch nie gegen einen echten Render-Deploy
ausgeführt. Der reale Nachweis (Poll konvergiert auf den tatsächlich deployten Commit, Evidence-Artefakt
mit `result: "VERIFIED PASS"`) folgt als Nachtrag nach Merge, analog zum bei M6 etablierten Muster
(siehe `docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md` Abschnitte 0/0.1).

Darüber hinaus ist dies **nur der erste** von mehreren möglichen M7-Repository-Implementation-Paketen.
Der M7-Exit-Gate selbst (`docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`, Abschnitt „Exit Gate")
verlangt zusätzlich: jede erforderliche externe Mutation separat Human-genehmigt und
`VERIFIED PASS`/sicher `FAILED / ROLLED BACK`, bewiesenes Rollback, vollständige Negativtests über
den gesamten Scope. Keines davon ist Teil dieses Pakets — M7 als Ganzes bleibt **PLANNED**, nicht
`VERIFIED PASS`.

## 5. Lokaler Nachweis dieser Sitzung

```text
npm run lint                                -> PASS (tsc --noEmit)
npx vitest run tests/unit/verifyDeploymentIdentity.test.ts
                                             -> 10/10 PASS
npx vitest run                              -> 151 Testdateien, 864 Tests PASS
npm run build                               -> PASS
npm run predeploy:check                     -> PASS (0 violations)
npm audit --omit=dev --audit-level=high     -> 0 Vulnerabilities

npx tsx scripts/deployment/verifyDeploymentIdentity.ts (ohne VERIFIED_COMMIT_SHA)
                                             -> FAIL-CLOSED wie erwartet, Exit 1

CAPITAL_AI_PRODUCTION_HEALTH_URL=https://127.0.0.1:1/healthz \
VERIFIED_COMMIT_SHA=aaaa...aaaa (40 Zeichen) \
DEPLOYMENT_VERIFY_TIMEOUT_MS=3000 DEPLOYMENT_VERIFY_POLL_INTERVAL_MS=1000 \
npx tsx scripts/deployment/verifyDeploymentIdentity.ts
                                             -> FAIL-CLOSED nach 3 Versuchen/3045ms wie erwartet,
                                                Evidence-Datei mit result: "FAILED / TIMEOUT" korrekt
                                                geschrieben, Exit 1
```

## 6. Nicht Teil dieser Implementierung

- keine echte Render-/Stripe-/Supabase-Mutation (siehe Abschnitt 0);
- keine Änderung an `render.yaml`, an Render-Dashboard-Einstellungen oder an bestehenden Secrets;
- keine Klärung/Korrektur des in Abschnitt 1 dokumentierten `autoDeployTrigger`-Drifts — bewusst dem
  Owner überlassen;
- kein Rollback-Automatismus über den bestehenden Render-Mechanismus hinaus;
- keine GitHub-OIDC-Föderation zu Render (laut Preflight nicht verfügbar).

## 7. Nächster Schritt

Nach Merge: nächster `push`-Lauf auf `main` löst `verify-deployment-identity` real gegen den
tatsächlichen Render-Deploy aus. Danach: Nachtrag mit realem Poll-Ergebnis/Evidence-Artefakt-Link
ergänzen. Weitere M7-Repository-Implementation-Pakete (z. B. Rollback-Tooling, explizite
Mutation-Handoff-Vorlage für einen konkreten zukünftigen Render-Mutationsbedarf) bleiben eigene,
separat zu beauftragende Schritte — keine externe Mutation ohne die im Runbook beschriebene
separate Owner-Mutation-Approval.
