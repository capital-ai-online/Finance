<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.3.4 -->
# CAPITAL-AI Änderungsantrag (Pull Request)

> Diese Vorlage ist verbindlich. Maschinenverwaltete Baseline-Felder dürfen nicht gelöscht werden.
>
> **Governance-Contract:** Jeder Pull Request gegen `main` MUSS diese vollständige Vorlage verwenden. Abschnitte dürfen nicht entfernt oder frei ersetzt werden; nicht zutreffende Angaben werden mit `N/A` begründet.
>
> **Wichtig:** Die teure technische CI startet für Pull Requests erst nach vollständiger Human-/Owner-Sichtprüfung.

## 1. Arbeitsauftrag

- **Zweck:** {{WORK_ITEM}}
- **Claim-ID:** `{{CLAIM_ID}}`
- **Claim-Datei:** `{{CLAIM_FILE}}`
- **Branch:** `{{HEAD_BRANCH}}`
- **Basis:** `main`

## 2. Agenten-/Principal-Identität und PR-Erstellungsfreigabe

- **Provider:** {{AGENT_PROVIDER}}
- **Modell:** {{AGENT_MODEL}}
- **Ausführungsoberfläche / MCP-Host:** {{AGENT_SURFACE}}
- **PR-Erstellung ausdrücklich durch Benutzer autorisiert:** Ja
- **Autorisierungsumfang entspricht diesem PR:** Ja
- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja

## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis

<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->
- **Produktions-URL:** `https://capital-ai.online/healthz`
- **Produktionsversion:** `{{PRODUCTION_VERSION}}`
- **Produktions-Commit:** `{{PRODUCTION_SHA}}`
- **Produktions-Branch:** `{{PRODUCTION_BRANCH}}`
- **Aktueller main-Commit:** `{{MAIN_SHA}}`
- **PR-Head-Commit:** `{{HEAD_SHA}}`
- **Abweichung Produktion → main:** `{{PROD_TO_MAIN_COMMITS}}` Commit(s)
- **Abweichung main → PR-Head:** `{{MAIN_TO_HEAD_COMMITS}}` Commit(s)
- **Baseline erzeugt am:** `{{BASELINE_GENERATED_AT}}`
<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->

## 4. Umfang / Multi-Agent-Koordination

- [ ] Der vorgesehene Umfang ist dokumentiert.
- [ ] Überschneidungen mit geänderten Dateien offener PRs wurden geprüft, sofern verfügbar.
- [ ] Erkannte Überschneidungen oder Konfliktrisiken wurden vor PR-Erstellung offengelegt.
- [ ] Metadaten oder Arbeiten anderer Agenten wurden nicht stillschweigend übernommen.

## 5. Änderungszusammenfassung

Beschreibe präzise, was geändert wurde und warum. Nicht zusammenhängende Änderungen gehören nicht in diesen PR.

## 6. Architektur- / Governance-Auswirkungen

- **Roadmap-Schritt / Phase:**
- **ADR erforderlich?** Ja / Nein — Referenz:
- **ESS-/Contract-Auswirkung?** Ja / Nein — Referenz:
- **Traceability/Dokumentation aktualisiert?** Ja / Nein / N/A
- **Mutation geplant?** Ja / Nein — Plattform/Runbook:
- **Geschützte bestehende Invariante betroffen?** Ja / Nein — Referenz:

## 7. Sicherheitsprüfung

- [ ] Prinzip der geringsten Berechtigung bleibt erhalten.
- [ ] Keine Zugangsdaten, Secrets oder Tokens wurden in Source, Logs, PR-Body oder Modellkontext aufgenommen.
- [ ] Authentifizierung/Autorisierung bleibt, wo erforderlich, fail-closed.
- [ ] Externe, Tool- und Retrieval-Inhalte werden als nicht vertrauenswürdige Eingaben behandelt.
- [ ] Hochriskante oder destruktive Aktionen behalten Human-Approval-Gates.
- [ ] Neue/geänderte Workflows verwenden unveränderliche Action-SHAs und explizite Minimalberechtigungen.

### Threat Model

Ein **Threat Model** beschreibt vor der Umsetzung, *was geschützt werden muss, vor wem, über welche Angriffswege und mit welchen Kontrollen*. Ein separates Threat-Model-Artefakt ist erforderlich, wenn der PR neue Trust Boundaries, Authentisierung/Autorisierung, Agent-Capabilities, Secrets, externe Schreibzugriffe oder Produktionsmutationen einführt oder wesentlich verändert.

- **Threat Model erforderlich?** Ja / Nein
- **Referenz / Begründung:**

### Negative Tests

**Negative Tests** beweisen, dass verbotene oder fehlerhafte Zustände zuverlässig abgelehnt werden. Beispiele: falscher Actor, falscher Head-SHA, fehlende Capability, Replay, abgelaufene Approval-Evidence, falsche Origin/RP-ID, unerlaubter Produktionszugriff oder ungültige Konfiguration.

- **Negative Tests erforderlich?** Ja / Nein
- **Getestete DENY-/Fail-Closed-Fälle:**

### Rollback / Runbook

Ein **Rollback-Runbook** beschreibt vor einer Mutation den sicheren Weg zurück zum letzten verifizierten Zustand: Auslöser, Verantwortlicher, konkrete Rücksetzschritte, Daten-/Konfigurationsfolgen und Verifikationscheck. Bei reinen Code-/Dokumentationsänderungen ohne externe Mutation kann `git revert` ausreichen. Bei Supabase-, Stripe-, Render-, Credential-, Deployment- oder Schema-Mutationen ist ein explizites Runbook erforderlich.

- **Rollback-Runbook erforderlich?** Ja / Nein
- **Referenz / Rücksetzweg:**

## 8. Human / Owner Review VOR technischer CI

> Dieser Abschnitt ist das Start-Gate für die teure Build-/Test-Pipeline.
>
> Reihenfolge für den Owner: **Files changed prüfen und Viewed setzen → Review `💪`/`okay` für den aktuellen PR-Head absenden → beide Checkboxen zuletzt setzen.** Das letzte Bearbeiten des PR-Bodys löst die Owner-Vorprüfung aus.
>
**Wichtig:** Die unsichtbaren IDs direkt über den beiden Checkboxen sind maschinenlesbare Governance-Invarianten. Die sichtbaren Texte dürfen verständlich angepasst werden; IDs dürfen weder entfernt, dupliziert noch verschoben werden.

<!-- CAPITAL_AI_OWNER_DIFF_ATTESTATION -->
- [ ] Human/Owner: vollständigen PR-Diff geprüft.
<!-- CAPITAL_AI_OWNER_FILES_ATTESTATION -->
- [ ] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.

Danach muss für den **aktuellen PR-Head** ein Review von `SvenKulessa` mit **`💪`** oder **`okay`** vorhanden sein. Erst dann darf `technical-validation` starten. Ein neuer Commit invalidiert den bisherigen Review für den neuen Head. Merge und externe Produktionsmutationen benötigen weiterhin ihre jeweils separate ausdrückliche Human-/Owner-Freigabe.

## 9. PR-Checkklasse und auszuführende Checks

Wähle die strengste zutreffende Klasse. Sobald der Dateiscope in eine höhere Klasse fällt, gilt die höhere Klasse für den gesamten PR.

### Klasse D — Documentation-only
Scope: ausschließlich `docs/**`, `.ai/**` oder Markdown; keine Runtime-, Workflow-, Dependency- oder Deployment-Dateien.

Erforderlich:
- [ ] Human-/Owner-Vorprüfung
- [ ] Governance-/Security-Workflows
- [ ] `technical-validation` Fast Path
- [ ] finaler Required Check `build-and-test`

Bewusst übersprungen: Git-Source-Build, npm ci/audit, TypeScript, Unit Tests, Production Build, Docker.

### Klasse C — Application / Test / Konfiguration
Scope: Anwendungs-/Servicecode, Tests oder nicht-dokumentarische Konfiguration ohne Docker-/Deployment-Relevanz.

Erforderlich:
- [ ] Human-/Owner-Vorprüfung
- [ ] Governance-/Security-Workflows
- [ ] Git-2.55-Integritäts-/Toolchain-Prüfung
- [ ] `npm ci`
- [ ] `npm audit --omit=dev --audit-level=high`
- [ ] Produktionskonfigurations-Invarianten
- [ ] Docker-Hardening-Policy-Check
- [ ] TypeScript/Lint
- [ ] Unit Tests
- [ ] Production Build
- [ ] CSP-Produktionspfad-Test
- [ ] Predeploy-/Deployment-Readiness-Check
- [ ] `build-and-test`

Docker Image Build nur, wenn Klasse R zusätzlich zutrifft.

### Klasse R — Runtime / Dependency / Docker / Deployment
Scope enthält z. B. `Dockerfile`, `.dockerignore`, `package*.json`, `server.ts`, `server/**`, `render.yaml`, Runtime-/Docker-Security-Skripte oder relevante Workflows.

Zusätzlich zu Klasse C erforderlich:
- [ ] Produktions-Docker-Image bauen
- [ ] Image-User/CMD/Healthcheck verifizieren
- [ ] Workflow-Security-Validierung bei Workflow-Änderungen
- [ ] Deployment-/Rollback-Runbook prüfen, wenn Produktionsverhalten betroffen ist

Pull Requests deployen **nicht** produktiv. Produktionsdeployment erfolgt erst nach Merge auf `main` und erfolgreicher Main-CI.

### Klasse M — Externe Plattformmutation
Scope beinhaltet eine geplante Mutation an Supabase, Stripe, Render oder einer anderen produktionsverbundenen Plattform.

Zusätzlich erforderlich:
- [ ] Roadmap/ADR/ESS autorisieren die konkrete Mutation
- [ ] Human/Owner Mutation Approval liegt vor
- [ ] Pre-Mutation Baseline/Test PASS
- [ ] Rollback-Runbook ist ausführbar
- [ ] Mutation wird mit Actor/Target/Timestamp/Request-/Deployment-ID protokolliert
- [ ] Post-Mutation Verification PASS
- [ ] Evidence ist dokumentiert
- [ ] nächster Roadmap-Schritt bleibt bis `VERIFIED PASS` blockiert

### Für diesen PR

- **Gewählte Klasse:** D / C / R / M
- **Warum:**
- **Erwartete Checks:**
- **Bewusst nicht erforderliche Checks:**

## 10. Technische Validierungsnachweise

Trage nur Checks als erfolgreich ein, die für die gewählte Klasse tatsächlich erforderlich und ausgeführt wurden. Nicht erforderliche Checks mit `N/A — gemäß Klasse ...` kennzeichnen.

- [ ] Owner-Gate PASS
- [ ] Governance/Security PASS
- [ ] Dependency/Audit PASS oder N/A
- [ ] TypeScript/Lint PASS oder N/A
- [ ] Unit Tests PASS oder N/A
- [ ] Production Build PASS oder N/A
- [ ] Docker/Runtime PASS oder N/A
- [ ] Pre-/Post-Mutation Verification PASS oder N/A
- [ ] `build-and-test` PASS

## 11. Risiko und Rücksetzung

- **Auswirkungsradius:** Niedrig / Mittel / Hoch / Kritisch
- **Auswirkungen auf Benutzer:**
- **Auswirkungen auf Daten / Billing / IAM:**
- **Rücksetzverfahren:**
- **Rücksetzung benötigt Freigabe für geschützte Änderung?** Ja / Nein — Referenz:

## 12. Prüf- und Merge-Bereitschaft

- [ ] Human-/Owner-Review aus Abschnitt 8 ist vollständig.
- [ ] Alle für die gewählte Checkklasse erforderlichen Checks sind PASS.
- [ ] Pflichtprüfung `build-and-test` ist erfolgreich.
- [ ] Governance-Prüfungen sind erfolgreich.
- [ ] Der Branch ist konfliktfrei und gegen den aktuellen `main` geprüft.
- [ ] Alle merge-blockierenden Diskussionen/Funde sind gelöst.
- [ ] Keine Agenten-/Modell-Selbstfreigabe wird als Human-Freigabe behandelt.
- [ ] Merge erfolgt nur nach separater ausdrücklicher menschlicher Anweisung.
