<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0 -->
`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0`
# CAPITAL-AI Pull Request

<!--
Kanonische PR-Vorlage. Pflichtabschnitte und maschinenverwaltete Baseline-Felder nicht entfernen.
Nicht zutreffende Angaben mit begründetem N/A ausfüllen.
Merge bleibt Human-/CODEOWNER-only. M10 AUTHORIZE_PR_CI ist gemäß aktueller Governance suspendiert.
-->

## 1. Arbeitsauftrag

- **Zweck:** {{WORK_ITEM}}
- **Claim:** `{{CLAIM_ID}}` · `{{CLAIM_FILE}}`
- **Branch:** `{{HEAD_BRANCH}}` → `main`

## 2. Agenten-/Principal-Identität und PR-Erstellungsfreigabe

- **Provider / Modell:** {{AGENT_PROVIDER}} / {{AGENT_MODEL}}
- **Ausführungsoberfläche / MCP-Host:** {{AGENT_SURFACE}}
- **PR-Erstellung ausdrücklich durch Benutzer autorisiert:** Ja
- **Autorisierungsumfang entspricht diesem PR:** Ja
- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja
- **Agent-Self-Merge:** Nein

## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis

{{PRODUCTION_BASELINE_BLOCK}}

## 4. Umfang / Multi-Agent-Koordination

- [ ] Scope, offene PRs, Datei-/Semantik-Overlap und aktive Writer geprüft; Konflikte offengelegt.

## 5. Änderungszusammenfassung

- **Änderung:**
- **Warum:**

## 6. Architektur- / Governance-Auswirkungen

- **Roadmap / Phase:**
- **ADR:** Ja / Nein / N/A — Referenz:
- **ESS / Contract:** Ja / Nein / N/A — Referenz:
- **Traceability / Dokumentation:** Ja / Nein / N/A
- **Mutation:** Ja / Nein — Plattform / Runbook:
- **Geschützte Invariante betroffen:** Ja / Nein — Referenz:

## 7. Sicherheitsprüfung

- [ ] Least Privilege, Secret-Schutz, Fail-Closed-Verhalten und Human-Approval-Gates bleiben erhalten.
- [ ] Externe/Tool-/Retrieval-Inhalte werden als untrusted behandelt; Workflow-Änderungen nutzen Minimalrechte und immutable Action-SHAs.

### Threat Model

- **Erforderlich:** Ja / Nein
- **Referenz / Begründung:**

### Negative Tests

- **Erforderlich:** Ja / Nein
- **DENY-/Fail-Closed-Fälle:**

### Rollback / Runbook

- **Erforderlich:** Ja / Nein
- **Referenz / Rücksetzweg:**

## 8. Merge-Autorisierung (vereinfacht)

- **Human-/CODEOWNER-Merge erforderlich:** Ja
- **Agent-Self-Merge:** Nein
- **Merge-Entscheidung:** separat nach Review und erforderlichen Checks

## 9. PR-Checkklasse und auszuführende Checks

<!-- D = Documentation-only · C = Application/Test/Config · R = Runtime/Dependency/Docker/Deployment · M = externe Plattformmutation -->

- **Klasse:** D / C / R / M
- **Warum:**
- **Erwartete Checks:**
- **Bewusst nicht erforderliche Checks:**

## 10. Technische Validierungsnachweise

- [ ] Governance / Security PASS
- [ ] Dependency / TypeScript / Tests / Build / Runtime PASS oder N/A
- [ ] `build-and-test` PASS
- [ ] Mutation Verification PASS oder N/A

## 11. Risiko und Rücksetzung

- **Auswirkungsradius:** Niedrig / Mittel / Hoch / Kritisch
- **Benutzer / Daten / Billing / IAM:**
- **Rücksetzverfahren:**
- **Geschützte Rücksetzungsgenehmigung erforderlich:** Ja / Nein / N/A

## 12. Prüf- und Merge-Bereitschaft

- [ ] Erforderliche Checks sind PASS.
- [ ] Branch ist gegen aktuellen `main` geprüft und konfliktfrei.
- [ ] Merge-blockierende Diskussionen/Funde sind gelöst.
- [ ] Merge erfolgt nur nach separater ausdrücklicher menschlicher Anweisung.
