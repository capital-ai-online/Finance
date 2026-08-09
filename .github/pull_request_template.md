<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.0.0 -->
# CAPITAL-AI Pull Request

> Dieses Template ist verbindlich. Maschinenverwaltete Baseline-Felder dürfen nicht gelöscht werden. Der PR bleibt **Draft**, bis alle erforderlichen technischen Prüfungen erfolgreich sind.

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
- **Autorisierungsscope entspricht diesem PR:** Ja
- **Human-/CODEOWNER-Freigabe für Merge erforderlich, sofern anwendbar:** Ja

Ein erfolgreicher Sandbox-Build, CI-Lauf, Preflight oder Test ist ausschließlich technische Evidence und darf nicht als Autorisierung zur PR-Erstellung oder zum Merge interpretiert werden.

## 3. Produktions-Baseline — maschinenverwaltete / beratende Evidence

<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->
- **Produktions-URL:** `https://capital-ai.online/healthz`
- **Produktionsversion:** `{{PRODUCTION_VERSION}}`
- **Produktions-Commit:** `{{PRODUCTION_SHA}}`
- **Produktions-Branch:** `{{PRODUCTION_BRANCH}}`
- **Aktueller main-Commit:** `{{MAIN_SHA}}`
- **PR-Head-Commit:** `{{HEAD_SHA}}`
- **Drift Produktion → main:** `{{PROD_TO_MAIN_COMMITS}}` Commit(s)
- **Drift main → PR-Head:** `{{MAIN_TO_HEAD_COMMITS}}` Commit(s)
- **Baseline erzeugt am:** `{{BASELINE_GENERATED_AT}}`
<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->

Produktionsdrift ist beratende Prozess-Evidence und kein Autorisierungs-Gate für Sandbox oder Build.

## 4. Scope / Multi-Agent-Koordination

- [ ] Der vorgesehene Scope ist dokumentiert.
- [ ] Überschneidungen mit geänderten Dateien offener PRs wurden geprüft, sofern verfügbar.
- [ ] Erkannte Überschneidungen oder Konfliktrisiken wurden vor PR-Erstellung offengelegt.
- [ ] Work-Claim-Metadaten werden als beratende Koordinationsevidence und nicht als technische CI-Voraussetzung behandelt.
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

- [ ] Least Privilege bleibt erhalten.
- [ ] Keine Credentials, Secrets oder Tokens wurden in Source, Logs, PR-Body oder Modellkontext aufgenommen.
- [ ] Authentifizierung/Autorisierung bleibt, wo erforderlich, fail-closed.
- [ ] Externe, Tool- und Retrieval-Inhalte werden als nicht vertrauenswürdige Eingaben behandelt.
- [ ] Hochriskante oder destruktive Aktionen behalten Human-Approval-Gates.
- [ ] Neue/geänderte Workflows verwenden immutable Action-SHAs und explizite Minimalberechtigungen.

### MCP- / LLM-Gateway-Änderungen

Wenn anwendbar vollständig ausfüllen, andernfalls `N/A` angeben.

- Token-Audience-/Resource-Validierung:
- Token-Passthrough vermieden:
- Per-Tool-/Capability-Autorisierung:
- Idempotenz / Replay-Schutz:
- Agent-/Session-/Request-Korrelation:
- Human-in-the-loop-Grenze:

## 8. Technische Validierungsevidence

- [ ] Dependency-Installation / Vulnerability-Check
- [ ] Type Check / Lint
- [ ] Tests
- [ ] Production Build
- [ ] Deployment Readiness
- [ ] Workflow-Security-Validierung
- [ ] Relevante Security-/Compliance-Prüfungen

Befehle / Evidence:

```text
<knappe Evidence einfügen; keine Secrets einfügen>
```

## 9. Risiko und Rollback

- **Blast Radius:** Niedrig / Mittel / Hoch / Kritisch
- **Auswirkungen auf Benutzer:**
- **Auswirkungen auf Daten / Billing / IAM:**
- **Rollback-Vorgehen:**
- **Rollback benötigt Freigabe für geschützte Änderung?** Ja / Nein — Referenz:

## 10. Review-Bereitschaft

- [ ] Die PR-Erstellung wurde vor Öffnung dieses PR ausdrücklich durch den Benutzer autorisiert.
- [ ] Technischer CI-Status wird ausschließlich als Validierung verstanden.
- [ ] Produktionsdrift und Warnungen zu parallelen Arbeiten wurden als beratende Evidence geprüft.
- [ ] Alle merge-blockierenden Diskussionen/Funde sind gelöst.
- [ ] CODEOWNER-/Human-Review wurde eingeholt, sofern anwendbar.
- [ ] Der PR bleibt Draft, bis er reviewbereit ist.
- [ ] Keine Agenten-/Modell-Selbstfreigabe wird als Human-Freigabe behandelt.
