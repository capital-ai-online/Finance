<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0 -->
`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0`
# CAPITAL-AI Änderungsantrag (Pull Request)

> Diese Vorlage ist verbindlich. Maschinenverwaltete Baseline-Felder dürfen nicht gelöscht werden.
>
> **Governance-Contract:** Jeder Pull Request gegen `main` MUSS diese vollständige Vorlage verwenden. Abschnitte dürfen nicht entfernt oder frei ersetzt werden; nicht zutreffende Angaben werden mit `N/A` begründet.
>
> **Merge-Vereinfachung (2026-08-16):** Pre-CI-Owner-Checkboxen, Files-Viewed als Maschinen-Gate und Review `💪`/`okay` sind **retired**. Sie autorisieren weder CI noch Merge. Merge bleibt Human/Owner-only.
>
> **M10:** Nach verifiziertem Controlled Cutover autorisiert ausschließlich eine PR-state-gebundene Owner-Passkey/WebAuthn-Transaktion `AUTHORIZE_PR_CI` für teure PR-CI. Vor dem verifizierten Cutover bleibt der dokumentierte Pre-M10-Pfad aktiv. CI-Autorisierung und Merge bleiben getrennte Human-Gates.
>
> **Baseline-Hinweis:** Abschnitt 3 wird durch `scripts/pr/productionPreflight.mjs` berechnet und ausschließlich über die kanonische `renderProductionBaselineBlock`-Authority projiziert. Bei der initialen PR-Erzeugung erfolgt dies über `scripts/pr/renderPullRequestBody.mjs`; bei einem bereits offenen PR aktualisiert der trusted Workflow `.github/workflows/pr-production-baseline-refresh.yml` ausschließlich den Baseline-Block über `scripts/pr/updatePrProductionBaseline.mjs` → `scripts/pr/productionBaselineBody.mjs`. Nach einem neuen Head kann der erste Governance-Lauf fail-closed mit **Automatic Production Baseline Reconciliation pending** enden; der trusted Writer bindet den anschließenden einmaligen Governance-Re-Run an exakt denselben PR-Head und `main`-Base. Einzelwerte dürfen nicht manuell geschätzt, ersetzt oder mit `nicht-verfügbar` befüllt werden. Die `Baseline-ID` bindet Produktions-, `main`- und PR-Head-Identität content-addressed zusammen.

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

{{PRODUCTION_BASELINE_BLOCK}}

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
- [ ] Hochriskante oder destruktive Aktionen behalten Human-Approval-Gates (Merge; nach M10-Cutover Passkey für teure PR-CI; externe Mutation).
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

## 8. Merge-Autorisierung (vereinfacht)

> **Retired (2026-08-16):** PR-Body-Owner-Checkboxen, Files-Viewed als Maschinen-Gate und Current-Head-Review `💪`/`okay` sind keine CI- oder Merge-Voraussetzung mehr.
>
> **Vor verifiziertem M10-Cutover:** Technische PR-CI verwendet den dokumentierten Pre-M10-Pfad. Der Owner entscheidet separat über den Merge; Agenten mergen nicht.
>
> **Nach verifiziertem M10-Cutover:** Eine Owner-Passkey/WebAuthn-Transaktion für `AUTHORIZE_PR_CI` ist die einzige normale Autorisierung für teure PR-CI gemäß `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`. Human Merge bleibt separat.

- **Human-/CODEOWNER-Merge erforderlich:** Ja
- **Agent-Self-Merge:** Nein
- **Empfohlen vor Merge:** Diff unter *Files changed* lesen (nicht selbst CI-autorisierend)

## 9. PR-Checkklasse und auszuführende Checks

Wähle die strengste zutreffende Klasse. Sobald der Dateiscope in eine höhere Klasse fällt, gilt die höhere Klasse für den gesamten PR.

### Klasse D — Documentation-only
Scope: ausschließlich `docs/**`, `.ai/**` oder Markdown; keine Runtime-, Workflow-, Dependency- oder Deployment-Dateien.

Erforderlich:
- [ ] Governance-/Security-Workflows
- [ ] `technical-validation` Fast Path
- [ ] finaler Required Check `build-and-test`

Bewusst übersprungen: Git-Source-Build, npm ci/audit, TypeScript, Unit Tests, Production Build, Docker.

### Klasse C — Application / Test / Konfiguration
Scope: Anwendungs-/Servicecode, Tests oder nicht-dokumentarische Konfiguration ohne Docker-/Deployment-Relevanz.

Erforderlich:
- [ ] Governance-/Security-Workflows
- [ ] Git-Integritäts-/Toolchain-Prüfung
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

### Klasse R — Runtime / Dependency / Docker / Deployment
Zusätzlich zu Klasse C: Produktions-Docker-Image, Image-User/CMD/Healthcheck, Workflow-Security bei Workflow-Änderungen, Deployment-/Rollback-Runbook wenn Produktionsverhalten betroffen.

### Klasse M — Externe Plattformmutation
Zusätzlich: Roadmap/ADR/ESS, Owner Mutation Approval, Pre-/Post-Mutation Verification, Rollback-Runbook, Evidence.

### Für diesen PR

- **Gewählte Klasse:** D / C / R / M
- **Warum:**
- **Erwartete Checks:**
- **Bewusst nicht erforderliche Checks:**

## 10. Technische Validierungsnachweise

- [ ] Governance/Security PASS
- [ ] Dependency/Audit PASS oder N/A
- [ ] TypeScript/Lint PASS oder N/A
- [ ] Unit Tests PASS oder N/A
- [ ] Production Build PASS oder N/A
- [ ] Docker/Runtime PASS oder N/A
- [ ] Pre-/Post-Mutation Verification PASS oder N/A
- [ ] `build-and-test` PASS
- [ ] Checkbox/Viewed/Emoji/Text/Label/Reaction als CI-Gate — N/A (retired; darf nicht autorisieren)

## 11. Risiko und Rücksetzung

- **Auswirkungsradius:** Niedrig / Mittel / Hoch / Kritisch
- **Auswirkungen auf Benutzer:**
- **Auswirkungen auf Daten / Billing / IAM:**
- **Rücksetzverfahren:**
- **Rücksetzung benötigt Freigabe für geschützte Änderung?** Ja / Nein — Referenz:

## 12. Prüf- und Merge-Bereitschaft

- [ ] Alle für die gewählte Checkklasse erforderlichen Checks sind PASS.
- [ ] Pflichtprüfung `build-and-test` ist erfolgreich.
- [ ] Governance-Prüfungen sind erfolgreich.
- [ ] Der Branch ist konfliktfrei und gegen den aktuellen `main` geprüft.
- [ ] Alle merge-blockierenden Diskussionen/Funde sind gelöst.
- [ ] Keine Agenten-/Modell-Selbstfreigabe wird als Human-Freigabe behandelt.
- [ ] Merge erfolgt nur nach separater ausdrücklicher menschlicher Anweisung.
