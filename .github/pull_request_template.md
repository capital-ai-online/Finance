<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.4.0 -->
# CAPITAL-AI Änderungsantrag (Pull Request)

> Diese Vorlage ist verbindlich. Maschinenverwaltete Baseline-Felder dürfen nicht gelöscht werden.
> **Wichtig:** Die technische CI startet für Pull Requests erst nach vollständiger Human-/Owner-Sichtprüfung. Es gibt genau einen Required-Check-Kontext `build-and-test`.

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
- **Human-/Owner-Freigabe für Merge erforderlich:** Ja

## 3. Produktions-Baseline
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

## 4. Umfang / Koordination
- [ ] Umfang ist dokumentiert.
- [ ] Überschneidungen mit offenen PRs wurden geprüft.
- [ ] Konfliktrisiken wurden offengelegt.

## 5. Änderungszusammenfassung
Beschreibe präzise, was geändert wurde und warum. Nicht zusammenhängende Änderungen gehören nicht in diesen PR.

## 6. Architektur / Governance
- **Roadmap-Schritt / Phase:**
- **ADR erforderlich?** Ja / Nein — Referenz:
- **ESS-/Contract-Auswirkung?** Ja / Nein — Referenz:
- **Traceability aktualisiert?** Ja / Nein / N/A
- **Mutation geplant?** Ja / Nein — Plattform/Runbook:

## 7. Sicherheitsprüfung
- [ ] Least Privilege bleibt erhalten.
- [ ] Keine Secrets/Tokens in Source, Logs oder PR-Body.
- [ ] AuthN/AuthZ bleibt fail-closed.
- [ ] Hochriskante/destruktive Aktionen behalten Human-Approval.
- [ ] Geänderte Workflows verwenden gepinnte Action-SHAs und Minimalberechtigungen.

### Threat Model
Erforderlich bei neuen/geänderten Trust Boundaries, AuthN/AuthZ, Agent-Capabilities, Secrets, externen Schreibzugriffen oder Produktionsmutationen.
- **Erforderlich?** Ja / Nein
- **Referenz / Begründung:**

### Negative Tests
Beweisen DENY-/Fail-Closed-Fälle wie falscher Actor/Head-SHA, fehlende Capability, Replay, abgelaufene Evidence, falsche Origin/RP-ID oder unerlaubten Produktionszugriff.
- **Erforderlich?** Ja / Nein
- **DENY-Fälle:**

### Rollback / Runbook
Bei externer Mutation muss der sichere Rückweg vorab definiert sein; bei reinem Code/Docs kann `git revert` genügen.
- **Erforderlich?** Ja / Nein
- **Referenz / Rücksetzweg:**

## 8. Human / Owner Review VOR `build-and-test`
Reihenfolge: **Files changed prüfen + Viewed → Review `💪`/`okay` für aktuellen Head → beide Checkboxen zuletzt setzen/speichern.** Das Speichern des PR-Bodys löst die CI-Vorprüfung aus.

- [ ] Human/Owner: vollständigen PR-Diff geprüft.
- [ ] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.

Ein neuer Commit invalidiert den bisherigen aktuellen-Head-Review. Es gibt keinen zweiten technischen Build/Test-Job.

## 9. PR-Checkklasse
Wähle die strengste zutreffende Klasse.

### D — Documentation-only
Nur `docs/**`, `.ai/**`, Markdown.
Erforderlich: Owner-Gate, leichte Governance/Security, Repository-Integrität und **ein** `build-and-test` im Docs-Fast-Path.
Nicht erforderlich: npm, TypeScript, Unit Tests, Production Build, Docker.

### C — Application/Test/Config
Zusätzlich im selben `build-and-test`: `npm ci`, Production-Dependency-Audit, TypeScript/Lint, Unit Tests, Production Build, Produktionsconfig/Predeploy.

### R — Runtime/Dependency/Docker/Deployment
Klasse C plus – nur bei relevantem Scope – Docker-Hardening, Produktions-Image und User/CMD/Healthcheck. Workflow-Security nur bei Workflow-Änderungen.

### M — Externe Plattformmutation
Roadmap/ADR/ESS-Autorisierung + Owner Mutation Approval + Pre-Mutation PASS + ausführbares Rollback + Mutation + Post-Mutation PASS + Evidence. Nächste Phase bleibt bis `VERIFIED PASS` blockiert.

### Für diesen PR
- **Klasse:** D / C / R / M
- **Warum:**
- **Erwartete Checks:**
- **Bewusst N/A:**

## 10. Validierungsnachweise
Nur tatsächlich erforderliche Checks als PASS markieren; sonst `N/A — gemäß Klasse ...`.
- [ ] Owner-Gate PASS
- [ ] Governance/Security PASS oder N/A
- [ ] Dependency/Audit PASS oder N/A
- [ ] TypeScript/Lint PASS oder N/A
- [ ] Unit Tests PASS oder N/A
- [ ] Production Build PASS oder N/A
- [ ] Docker/Runtime PASS oder N/A
- [ ] Pre-/Post-Mutation PASS oder N/A
- [ ] **einziger Required Check `build-and-test` PASS**

## 11. Risiko / Rücksetzung
- **Auswirkungsradius:** Niedrig / Mittel / Hoch / Kritisch
- **Benutzerauswirkung:**
- **Daten/Billing/IAM:**
- **Rücksetzverfahren:**

## 12. Merge-Bereitschaft
- [ ] Human-/Owner-Review vollständig.
- [ ] Scope-erforderliche Checks PASS.
- [ ] Genau ein aktueller Required-Check-Kontext `build-and-test` ist erfolgreich.
- [ ] Branch ist konfliktfrei gegen aktuellen `main`.
- [ ] Merge-blockierende Funde sind gelöst.
- [ ] Keine Agenten-Selbstfreigabe.
- [ ] Merge nur nach separater ausdrücklicher menschlicher Anweisung.
