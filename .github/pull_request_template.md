<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.2.0 -->
# CAPITAL-AI Änderungsantrag (Pull Request)

> Diese Vorlage ist verbindlich. Maschinenverwaltete Baseline-Felder dürfen nicht gelöscht werden.
>
> **Wichtig:** Die teure technische CI startet für Pull Requests erst nach vollständiger Human-/Owner-Sichtprüfung. Bis dahin darf nur die leichte Owner-/Governance-Prüfung laufen.

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

Ein erfolgreicher Sandbox-Build, CI-Lauf, Vorabtest oder Test ist ausschließlich ein technischer Nachweis und darf nicht als Autorisierung zur PR-Erstellung oder zum Merge interpretiert werden.

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

## 8. Human / Owner Review VOR technischer CI

> Dieser Abschnitt ist das Start-Gate für die teure Build-/Test-Pipeline.
>
> Vor dem Abhaken müssen im Tab **Files changed** alle geänderten Dateien durch Owner `SvenKulessa` geprüft und als **Viewed** markiert worden sein.
>
> GitHub Actions kann den persönlichen `Viewed`-Status nicht zuverlässig auslesen; die zweite Checkbox ist deshalb die verbindliche Owner-Attestation dafür.

- [ ] Human/Owner: vollständigen PR-Diff geprüft.
- [ ] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.

Danach gibt Owner `SvenKulessa` im GitHub-Review für den **aktuellen PR-Head** einen kurzen Review-Kommentar ab: **`💪`** oder **`okay`**.

Erst wenn beide Kästchen gesetzt und der aktuelle Review vorhanden sind, darf `technical-validation` starten. Ein neuer Commit invalidiert den bisherigen Review für den neuen Head.

## 9. Technische Validierungsnachweise — erst nach Abschnitt 8

- [ ] Abhängigkeiten installieren / Schwachstellenprüfung
- [ ] Typprüfung / Lint
- [ ] Tests
- [ ] Produktions-Build
- [ ] Deployment-Bereitschaft
- [ ] Workflow-Sicherheitsvalidierung
- [ ] Relevante Sicherheits-/Compliance-Prüfungen

Befehle / Nachweise:

```text
<knappe Nachweise einfügen; keine Secrets einfügen>
```

## 10. Risiko und Rücksetzung

- **Auswirkungsradius:** Niedrig / Mittel / Hoch / Kritisch
- **Auswirkungen auf Benutzer:**
- **Auswirkungen auf Daten / Billing / IAM:**
- **Rücksetzverfahren:**
- **Rücksetzung benötigt Freigabe für geschützte Änderung?** Ja / Nein — Referenz:

## 11. Prüf- und Merge-Bereitschaft

- [ ] Human-/Owner-Review aus Abschnitt 8 ist vollständig.
- [ ] Pflichtprüfung `build-and-test` ist erfolgreich.
- [ ] Governance-Prüfungen sind erfolgreich.
- [ ] Der Branch ist konfliktfrei und gegen den aktuellen `main` geprüft.
- [ ] Alle merge-blockierenden Diskussionen/Funde sind gelöst.
- [ ] Keine Agenten-/Modell-Selbstfreigabe wird als Human-Freigabe behandelt.
- [ ] Merge erfolgt nur nach separater ausdrücklicher menschlicher Anweisung.
