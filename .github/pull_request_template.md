<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 2.2.0 -->
# CAPITAL-AI Pull Request — {{WORK_ITEM}}

<!-- CAPITAL_AI_EXTERNAL_MUTATION: NONE -->
<!-- CAPITAL_AI_EXECUTION_PROFILE: AUTO -->
<!-- CAPITAL_AI_SYNC_HEAD_SHA: {{HEAD_SHA}} -->

> Dieser Pull Request ist gleichzeitig **Änderungsnachweis und Lernmaterial**. Die technische Checkklasse wird aus den geänderten Dateien automatisch ermittelt. Ein geplanter externer Produktionsschritt muss ausdrücklich deklariert werden und hebt die Prüfung auf Klasse M an. Der Mensch muss keine Klasse oder technische PASS-Häkchen erraten.

## 1. Kurz erklärt

**Was wird geändert?**  
{{CHANGE_SUMMARY}}

**Welche Bereiche/Features sind betroffen?**  
{{AUTO_FEATURE_AREAS}}

**Warum ist das relevant?**  
{{LEARNING_GOAL}}

## 2. Automatisch erkannte Prüfungen

<!-- CAPITAL_AI_AUTO_CLASSIFICATION_START -->
- **Repository-Scope:** {{AUTO_REPOSITORY_CLASS}}
- **Wirksame Checkklasse:** {{AUTO_CHECK_CLASS}}
- **Execution Profile:** {{AUTO_EXECUTION_PROFILE}}
- **Externe Produktionsmutation:** {{AUTO_EXTERNAL_MUTATION}}
- **Risiko:** {{AUTO_RISK}}
- **Begründung:** {{AUTO_CLASS_REASON}}

**Erforderliche Checks**
{{AUTO_REQUIRED_CHECKS}}

**Bewusst nicht erforderliche Checks**
{{AUTO_NOT_REQUIRED_CHECKS}}
<!-- CAPITAL_AI_AUTO_CLASSIFICATION_END -->

### Was bedeuten die Klassen in einfacher Sprache?

- **D — Dokumentation:** Texte, Roadmaps oder Evidence; kein Software-Build nötig.
- **C — Anwendung:** Code, Tests oder Konfiguration; normale Softwaretests und Build sind nötig.
- **R — Runtime/CI/Deployment:** Server, Dependencies, Docker oder Workflows; zusätzlich werden Runtime-/Workflow-/Docker-Schutzregeln und ein echter Container-Health-Smoke-Test geprüft.
- **M — externe Produktionsänderung:** Außerhalb des Repositories soll ein produktiver Zustand verändert werden. Dafür ist immer eine **separate Human/Owner-Mutationsfreigabe** nötig.

Die Klasse gibt nur vor, **was geprüft werden muss**. Sie erteilt keinem Agenten zusätzliche Rechte. `MERGE` bleibt Human/Owner-only.

## 3. Nachvollziehbarkeit

- **Claim-ID:** `{{CLAIM_ID}}`
- **Claim-Datei:** `{{CLAIM_FILE}}`
- **Branch:** `{{HEAD_BRANCH}}`
- **Provider / Modell:** {{AGENT_PROVIDER}} / {{AGENT_MODEL}}
- **Ausführungsoberfläche:** {{AGENT_SURFACE}}
- **PR-Erstellung autorisiert:** {{PR_CREATION_AUTH}}
- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja

<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->
- **Produktionsversion:** `{{PRODUCTION_VERSION}}`
- **Produktions-Commit:** `{{PRODUCTION_SHA}}`
- **Produktions-Branch:** `{{PRODUCTION_BRANCH}}`
- **Aktueller main-Commit:** `{{MAIN_SHA}}`
- **PR-Head-Commit:** `{{HEAD_SHA}}`
- **Abweichung Produktion → main:** `{{PROD_TO_MAIN_COMMITS}}` Commit(s)
- **Abweichung main → PR-Head:** `{{MAIN_TO_HEAD_COMMITS}}` Commit(s)
- **Baseline erzeugt am:** `{{BASELINE_GENERATED_AT}}`
<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->

## 4. Sicherheit und Rückweg

- **Security-/Governance-Auswirkung:** {{AUTO_SECURITY_NOTE}}
- **Rollback:** {{AUTO_ROLLBACK}}
- **Separate Produktionsfreigabe nötig:** {{AUTO_MUTATION_APPROVAL}}
- **Nicht delegierbar:** Merge, Owner-IAM/MFA/Break-Glass, Secret-Offenlegung, destruktive Produktionsdatenoperationen, Live-Billing/Money/Entitlement, Produktionsressourcen-Löschung, DNS/TLS/Domain-Ownership und Abschwächung von Security-/Audit-/RLS-/Consent-/Protection-Kontrollen.

## 5. Human / Owner Review VOR technischer CI

> **Nur diese zwei Häkchen werden vom Menschen gesetzt.** Reihenfolge: `Files changed` lesen → jede Datei als `Viewed` markieren → Review `💪` oder `okay` für den aktuellen Head absenden → **danach** die beiden Kästchen setzen. Ein neuer Commit setzt sie automatisch zurück und macht die Head-gebundene Review-Evidence ungültig.

- [ ] Human/Owner: vollständigen PR-Diff geprüft.
- [ ] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.

## 6. Automatisch synchronisierte Nachweise

> **Nicht manuell bearbeiten.** Alle folgenden Häkchen werden ausschließlich vom trusted-main PR-Status-Workflow aus GitHub-/Actions-Evidence für den aktuellen Head gesetzt. `☐` bedeutet ausstehend oder fehlgeschlagen; `☑` bedeutet maschinell verifiziert oder für die erkannte Klasse nachweislich nicht erforderlich.

<!-- CAPITAL_AI_MACHINE_EVIDENCE_START -->
- [ ] 🤖 Automatische Klassifikation und aktueller Head sind synchronisiert.
- [ ] 🤖 Governance-/Workflow-Security für den aktuellen Head ist erfolgreich.
- [ ] 🤖 Live-PR-Body und Produktionsbaseline sind gegen den aktuellen Head validiert.
- [ ] 🤖 Repository-Konventionen sind im für die Klasse erforderlichen Modus erfüllt.
- [ ] 🤖 Erforderliche Software-/Build-Prüfungen sind erfolgreich oder für die Klasse nicht erforderlich.
- [ ] 🤖 Docker-/Runtime-Prüfungen sind erfolgreich oder für die Klasse nicht erforderlich.
- [ ] 🤖 `build-and-test` besitzt gültige current-head Primär- oder One-Shot-Evidence.
- [ ] 🤖 Externe Produktionsmutation ist verifiziert oder für diesen PR nicht erforderlich.
<!-- CAPITAL_AI_MACHINE_EVIDENCE_END -->

**CI-Evidence verständlich lesen:**
- **Volltest ausgeführt:** dieser Head wurde in einem Primärlauf vollständig getestet.
- **Volltest-Evidence wiederverwendet:** derselbe `(PR, Head-SHA)` wurde bereits erfolgreich vollständig getestet; die Primär-Evidence wird über GitHub Actions erneut verifiziert, ohne den teuren Build zu duplizieren.
- **Nicht erforderlich:** die automatische Klasse verlangt den Check für diesen Diff nicht; der Workflow darf das zugehörige Häkchen deshalb als erfüllt markieren.
- **Ausstehend/fehlgeschlagen:** das Häkchen bleibt offen; der Mensch setzt es nicht von Hand.

## 7. Was kann man aus diesem PR lernen?

{{AUTO_LEARNING_NOTE}}

> Ziel: Nach dem Lesen dieses Abschnitts soll auch ohne tiefes Repository-Wissen verständlich sein, **welches Feature oder welche Schutzfunktion geändert wird, warum die gewählten Tests nötig sind und welche Grenzen weiterhin gelten**.

## 8. Merge-Bereitschaft

<!-- CAPITAL_AI_MACHINE_MERGE_START -->
- [ ] 🤖 Human-/Owner-Gate ist für den aktuellen Head technisch verifiziert.
- [ ] 🤖 Alle automatisch erforderlichen Checks der erkannten Klasse sind erfüllt.
<!-- CAPITAL_AI_MACHINE_MERGE_END -->

**Nicht automatisierbare Grenzen – bewusst ohne Checkbox:**
- Merge erfolgt nur nach einer **separaten ausdrücklichen menschlichen Anweisung** für genau diesen PR.
- Keine Agenten-/Modell-Selbstfreigabe gilt als Human-Freigabe.
- Offene fachliche/reviewbezogene Einwände müssen vor Merge geklärt sein.
- Nach erfolgreichem Merge wird der Work-Branch gemäß Branch-Lifecycle-Policy gelöscht.
