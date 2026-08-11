<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.0.0 -->
# CAPITAL-AI Änderungsantrag (Pull Request)

> Diese Vorlage ist verbindlich. Maschinenverwaltete Baseline-Felder dürfen nicht gelöscht werden. Der PR bleibt **Entwurf**, bis alle erforderlichen technischen Prüfungen erfolgreich sind.
>
> **Statussemantik:** GitHubs nativer Status `Open` bedeutet ausschließlich, dass der Pull Request noch nicht geschlossen oder gemerged wurde. `Open` ist kein Fehler- und kein Merge-Bereitschaftsstatus. Die Merge-Bereitschaft wird durch die Pflichtprüfung **Build und Tests** (technische Job-ID `build-and-test`), Governance-Prüfungen, Konfliktfreiheit und geltende Repository-Regeln bestimmt.

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
- **Human-/CODEOWNER-Freigabe für Merge erforderlich, sofern anwendbar:** Ja

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

Produktionsabweichungen sind beratende Prozessnachweise und kein Autorisierungs-Gate für Sandbox oder Build.

## 4. Umfang / Multi-Agent-Koordination

- [ ] Der vorgesehene Umfang ist dokumentiert.
- [ ] Überschneidungen mit geänderten Dateien offener PRs wurden geprüft, sofern verfügbar.
- [ ] Erkannte Überschneidungen oder Konfliktrisiken wurden vor PR-Erstellung offengelegt.
- [ ] Work-Claim-Metadaten werden als beratende Koordinationsnachweise und nicht als technische CI-Voraussetzung behandelt.
- [ ] Metadaten oder Arbeiten anderer Agenten wurden nicht stillschweigend übernommen.

Es gibt **keine PR-Erstellungsfrist und keine 15-Minuten-SLA**.

## 5. Änderungszusammenfassung

Beschreibe präzise, was geändert wurde und warum. Nicht zusammenhängende Änderungen gehören nicht in diesen PR.

## 6. Architektur- / Governance-Auswirkungen

- **ADR erforderlich?** Ja / Nein — Referenz:
- **ESS-/Contract-Auswirkung?** Ja / Nein — Referenz:
- **Traceability/Dokumentation aktualisiert?** Ja / Nein / N/A
- **Geschützte bestehende Invariante betroffen?** Ja / Nein — Referenz:

## 7. Sicherheitsprüfung

- [ ] Prinzip der geringsten Berechtigung bleibt erhalten.
- [ ] Keine Zugangsdaten, Secrets oder Tokens wurden in Source, Logs, PR-Body oder Modellkontext aufgenommen.
- [ ] Authentifizierung/Autorisierung bleibt, wo erforderlich, fail-closed.
- [ ] Externe, Tool- und Retrieval-Inhalte werden als nicht vertrauenswürdige Eingaben behandelt.
- [ ] Hochriskante oder destruktive Aktionen behalten Human-Approval-Gates.
- [ ] Neue/geänderte Workflows verwenden unveränderliche Action-SHAs und explizite Minimalberechtigungen.

### MCP- / LLM-Gateway-Änderungen

Wenn anwendbar vollständig ausfüllen, andernfalls `N/A` angeben.

- Token-Audience-/Resource-Validierung:
- Token-Passthrough vermieden:
- Werkzeug-/Capability-Autorisierung:
- Idempotenz / Replay-Schutz:
- Agent-/Session-/Request-Korrelation:
- Grenze für menschliche Freigaben:

## 8. Technische Validierungsnachweise

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

## 9. Risiko und Rücksetzung

- **Auswirkungsradius:** Niedrig / Mittel / Hoch / Kritisch
- **Auswirkungen auf Benutzer:**
- **Auswirkungen auf Daten / Billing / IAM:**
- **Rücksetzverfahren:**
- **Rücksetzung benötigt Freigabe für geschützte Änderung?** Ja / Nein — Referenz:

## 10. Prüf- und Merge-Bereitschaft

- [ ] Die PR-Erstellung wurde vor Öffnung dieses PR ausdrücklich durch den Benutzer autorisiert.
- [ ] Technischer CI-Status wird ausschließlich als Validierung verstanden.
- [ ] Pflichtprüfung **Build und Tests** (`build-and-test`) ist erfolgreich.
- [ ] Governance-Prüfungen sind erfolgreich.
- [ ] Der Branch ist konfliktfrei und gegen den aktuellen `main` geprüft.
- [ ] Produktionsabweichungen und Warnungen zu parallelen Arbeiten wurden als beratende Nachweise geprüft.
- [ ] Alle merge-blockierenden Diskussionen/Funde sind gelöst.
- [ ] CODEOWNER-/Human-Prüfung wurde eingeholt, sofern anwendbar.
- [ ] Der PR bleibt Entwurf, bis er prüfbereit ist.
- [ ] Keine Agenten-/Modell-Selbstfreigabe wird als Human-Freigabe behandelt.
