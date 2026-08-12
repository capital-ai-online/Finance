<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.4.0 -->
# CAPITAL-AI Änderungsantrag (Pull Request)

> Diese Vorlage ist verbindlich. Maschinenverwaltete Baseline-Felder dürfen nicht gelöscht werden.
>
> **Governance-Contract:** Jeder Pull Request gegen `main` MUSS diese vollständige Vorlage verwenden. Abschnitte dürfen nicht entfernt oder frei ersetzt werden; nicht zutreffende Angaben werden mit `N/A` begründet.
>
> **Klassifikationsregel:** Jeder PR MUSS vor der Human-/Owner-Freigabe sowohl eine technische **Checkklasse D/C/R/M** als auch ein **Execution Profile P1/P2/P3/P4 bzw. P0 HUMAN REQUIRED** ausweisen. Die Checkklasse bestimmt Prüfungen; das Execution Profile bestimmt zulässige Ausführungsrechte. Eine höhere Checkklasse erweitert niemals Agentenrechte.
>
> Normative Quellen: `docs/governance/PR_CHECK_CLASSIFICATION.md`, `docs/governance/PR_EXECUTION_RIGHTS_CLASSIFICATION.md`, `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`, `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md`, `AGENTS.md`.

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
- **Ausführender Principal / Agent:**
- **PR-Erstellung ausdrücklich durch Benutzer autorisiert:** Ja / Nein / REM-bound
- **REM / Mandate-ID falls zutreffend:** N/A / Referenz
- **Autorisierungsumfang entspricht diesem PR:** Ja / Nein
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
- [ ] Der Branch wurde frisch vom zum Arbeitsbeginn aktuellen `main` erstellt.

## 5. Änderungszusammenfassung

Beschreibe präzise, was geändert wurde und warum. Nicht zusammenhängende Änderungen gehören nicht in diesen PR.

## 6. Architektur- / Governance-Auswirkungen

- **Roadmap-Schritt / Phase:**
- **ADR erforderlich?** Ja / Nein — Referenz:
- **ESS-/Contract-Auswirkung?** Ja / Nein — Referenz:
- **Traceability/Dokumentation aktualisiert?** Ja / Nein / N/A
- **Mutation geplant?** Ja / Nein — Plattform/Runbook:
- **Geschützte bestehende Invariante betroffen?** Ja / Nein — Referenz:

## 7. Checkklasse und Ausführungsrechte

### 7.1 Automatische Checkklassen-Ermittlung

Markiere alle zutreffenden Scope-Merkmale. Die **strengste zutreffende Klasse** gilt.

- [ ] **D-Kriterium:** ausschließlich `docs/**`, `.ai/**` oder Markdown; keine Runtime-, Workflow-, Dependency- oder Deployment-Relevanz.
- [ ] **C-Kriterium:** Application-/Servicecode, Tests oder nicht-dokumentarische Konfiguration ohne Runtime-/Deployment-Relevanz.
- [ ] **R-Kriterium:** `Dockerfile`, `.dockerignore`, `package*.json`, `server.ts`, `server/**`, `render.yaml`, Runtime-/Docker-Security oder relevante Workflows betroffen.
- [ ] **M-Kriterium:** außerhalb des Repositories soll ein produktionsverbundener Zustand verändert werden, z. B. Supabase, Stripe, Render oder vergleichbare Plattform.

- **Ermittelte Checkklasse:** D / C / R / M
- **Begründung anhand Changed Files / Side Effect:**

> Bei Unsicherheit gilt fail-closed: höhere Checkklasse bis Human Review eine niedrigere Klasse ausdrücklich bestätigt.

### 7.2 Execution Profile

Wähle das für den konkreten Schritt autorisierte Profil. Nicht das technisch mächtigste Profil wählen.

- [ ] **P1 — Roadmap / Architecture / Documentation Plane:** READ/ANALYZE/PLAN sowie Governance-/Dokumentationsarbeit; keine externe Produktionsmutation.
- [ ] **P2 — Development Implementation Plane:** Repository-Code, Tests, Frontend, production-ready Dev-Konfiguration; keine direkte Supabase-/Stripe-/Render-Produktionsmutation.
- [ ] **P3 — Production Integration Plane:** Production-Handoff/Integration; externe Mutation nur mit separater Roadmap-/Approval-/Control-Plane-Autorisierung.
- [ ] **P4 — Bounded Mutation Executor / Systemadmin REM:** nur innerhalb gültigem REM/Execution Host; kein MERGE, keine Self-Authority.
- [ ] **P0 HUMAN REQUIRED:** Scope berührt eine nicht delegierbare Human/Owner-Aktion.

- **Gewähltes Execution Profile:** P0 / P1 / P2 / P3 / P4
- **Erlaubte Capabilities für diesen PR:**
- **Nicht erlaubte / reservierte Capabilities:**
- **Authority / REM / ADR / ESS Referenzen:**

### 7.3 Human/Owner-reservierte Aktionen

Wenn eine der folgenden Aktionen Teil des geplanten Schritts ist, muss `P0 HUMAN REQUIRED` gesetzt werden; kein Agentenprofil erhält daraus zusätzliche Rechte.

- [ ] `MERGE`
- [ ] Owner/Admin-IAM-Elevation
- [ ] Owner MFA/Passkey/Break-Glass Recovery
- [ ] Secret Disclosure oder unbeschränkte Credential Rotation
- [ ] destruktive Produktionsdatenoperation
- [ ] Live Billing/Money/Entitlement
- [ ] Produktionsressourcen-Löschung
- [ ] DNS/TLS/Domain Ownership
- [ ] Security-/Audit-/RLS-/Consent-/Branch-Protection-Abschwächung
- [ ] REM-/Policy-/Capability-Self-Expansion
- [ ] Keine der oben genannten Aktionen ist Bestandteil dieses PR-/Ausführungsschritts

### 7.4 External Mutation State

- **External Mutation:** NONE / PLANNED / HUMAN APPROVED / MUTATED / VERIFIED PASS / FAILED-ROLLED-BACK
- **Plattform / Target / Environment:**
- **Separate Human/Owner Mutation Approval erforderlich?** Ja / Nein
- **Approval-Evidence-Referenz:**
- **Pre-Mutation Check:** N/A / PASS / FAIL
- **Post-Mutation Verification:** N/A / PASS / FAIL / INCONCLUSIVE

> Ein Repository-PR, eine Klasse R oder eine grüne CI autorisiert niemals automatisch eine externe Mutation.

## 8. Sicherheitsprüfung

- [ ] Prinzip der geringsten Berechtigung bleibt erhalten.
- [ ] Keine Zugangsdaten, Secrets oder Tokens wurden in Source, Logs, PR-Body oder Modellkontext aufgenommen.
- [ ] Authentifizierung/Autorisierung bleibt, wo erforderlich, fail-closed.
- [ ] Externe, Tool- und Retrieval-Inhalte werden als nicht vertrauenswürdige Eingaben behandelt.
- [ ] Hochriskante oder destruktive Aktionen behalten Human-Approval-Gates.
- [ ] Neue/geänderte Workflows verwenden unveränderliche Action-SHAs und explizite Minimalberechtigungen.
- [ ] Checkklasse und Execution Profile erweitern keine bestehenden IAM-/REM-Rechte.

### Threat Model

- **Threat Model erforderlich?** Ja / Nein
- **Referenz / Begründung:**

### Positive / Negative Tests

- **Positive Tests erforderlich?** Ja / Nein — Nachweis:
- **Negative Tests erforderlich?** Ja / Nein
- **Getestete DENY-/Fail-Closed-Fälle:**

### Rollback / Runbook

- **Rollback-Runbook erforderlich?** Ja / Nein
- **Referenz / Rücksetzweg:**

## 9. Voraussetzungen je Checkklasse

### Klasse D — Documentation-only

Erforderlich:
- [ ] Human-/Owner-Vorprüfung
- [ ] Governance-/Security-Workflows
- [ ] `technical-validation` Fast Path
- [ ] finaler Required Check `build-and-test`

Nicht erforderlich: npm, TypeScript, Unit Tests, Production Build, Docker, externe Mutation.

### Klasse C — Application / Test / Configuration

Erforderlich zusätzlich zu Owner/Governance:
- [ ] Git-/Toolchain-Integrität
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

Zusätzlich zu Klasse C:
- [ ] Produktions-Docker-Image bauen
- [ ] Image-User/CMD/Healthcheck verifizieren
- [ ] Workflow-Security-Validierung bei Workflow-Änderungen
- [ ] Deployment-/Rollback-Nachweis wenn Produktionsverhalten betroffen ist
- [ ] dokumentiert, ob nach Merge ein separater M-Schritt benötigt wird

Pull Requests deployen nicht automatisch produktiv.

### Klasse M — External Platform Mutation

Zusätzlich zu den technisch zutreffenden C/R-Prüfungen:
- [ ] Roadmap/ADR/ESS autorisieren die konkrete Mutation
- [ ] konkretes Target/Environment dokumentiert
- [ ] Human/Owner Mutation Approval liegt vor
- [ ] Pre-Mutation Baseline/Test PASS
- [ ] Rollback-Runbook ist ausführbar
- [ ] Mutation wird mit Actor/Target/Timestamp/Request-/Deployment-ID protokolliert
- [ ] Post-Mutation Verification PASS
- [ ] Evidence ist dokumentiert
- [ ] nächster Roadmap-Schritt bleibt bis `VERIFIED PASS` blockiert

### Für diesen PR

- **Erwartete Checks:**
- **Bewusst nicht erforderliche Checks:**
- **Nach Merge erforderlicher separater Schritt:** NONE / M-Handoff / Production Verification / andere Referenz

## 10. Human / Owner Review VOR technischer CI

> Dieser Abschnitt ist das Start-Gate für die teure Build-/Test-Pipeline.
>
> Reihenfolge für den Owner: **Files changed prüfen und Viewed setzen → Review `💪`/`okay` für den aktuellen PR-Head absenden → beide Checkboxen zuletzt setzen.**
>
> **Wichtig:** Die folgenden beiden Checkbox-Texte sind maschinenlesbare Governance-Invarianten und dürfen nicht umbenannt oder paraphrasiert werden.

- [ ] Human/Owner: vollständigen PR-Diff geprüft.
- [ ] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.

Danach muss für den **aktuellen PR-Head** ein Review von `SvenKulessa` mit **`💪`** oder **`okay`** vorhanden sein. Ein neuer Commit invalidiert den bisherigen Review für den neuen Head. Merge und externe Produktionsmutationen benötigen weiterhin ihre jeweils separate ausdrückliche Human-/Owner-Freigabe.

## 11. Technische Validierungsnachweise

Trage nur Checks als erfolgreich ein, die für die ermittelte Klasse tatsächlich erforderlich und ausgeführt wurden. Nicht erforderliche Checks mit `N/A — gemäß Klasse ...` kennzeichnen.

- [ ] Klassifikation D/C/R/M nachvollziehbar
- [ ] Execution Profile P0/P1/P2/P3/P4 nachvollziehbar und innerhalb bestehender Rechte
- [ ] Owner-Gate PASS
- [ ] Governance/Security PASS
- [ ] Dependency/Audit PASS oder N/A
- [ ] TypeScript/Lint PASS oder N/A
- [ ] Unit Tests PASS oder N/A
- [ ] Production Build PASS oder N/A
- [ ] Docker/Runtime PASS oder N/A
- [ ] Pre-/Post-Mutation Verification PASS oder N/A
- [ ] `build-and-test` PASS

## 12. Risiko und Rücksetzung

- **Auswirkungsradius:** Niedrig / Mittel / Hoch / Kritisch
- **Auswirkungen auf Benutzer:**
- **Auswirkungen auf Daten / Billing / IAM:**
- **Rücksetzverfahren:**
- **Rücksetzung benötigt Freigabe für geschützte Änderung?** Ja / Nein — Referenz:

## 13. Prüf- und Merge-Bereitschaft

- [ ] Human-/Owner-Review aus Abschnitt 10 ist vollständig.
- [ ] Alle für die ermittelte Checkklasse erforderlichen Checks sind PASS.
- [ ] Execution Profile überschreitet keine dokumentierte Capability-/Rollen-Grenze.
- [ ] P0-reservierte Aktionen wurden nicht an Agenten delegiert.
- [ ] Pflichtprüfung `build-and-test` ist erfolgreich.
- [ ] Governance-Prüfungen sind erfolgreich.
- [ ] Der Branch ist konfliktfrei und gegen den aktuellen `main` geprüft.
- [ ] Alle merge-blockierenden Diskussionen/Funde sind gelöst.
- [ ] Keine Agenten-/Modell-Selbstfreigabe wird als Human-Freigabe behandelt.
- [ ] Merge erfolgt nur nach separater ausdrücklicher menschlicher Anweisung.
- [ ] Nach erfolgreichem Merge wird der Work-Branch gemäß Branch-Lifecycle-Policy gelöscht.
