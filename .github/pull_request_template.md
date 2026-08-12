<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 2.1.0 -->
# CAPITAL-AI Pull Request — {{WORK_ITEM}}

<!-- CAPITAL_AI_EXTERNAL_MUTATION: NONE -->
<!-- CAPITAL_AI_EXECUTION_PROFILE: AUTO -->

> Dieser Pull Request ist gleichzeitig **Änderungsnachweis und Lernmaterial**. Die technische Checkklasse wird aus den geänderten Dateien automatisch ermittelt. Ein geplanter externer Produktionsschritt muss ausdrücklich deklariert werden und hebt die Prüfung auf Klasse M an. Der Mensch muss keine Klasse erraten.

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

> **Reihenfolge:** `Files changed` lesen → jede Datei als `Viewed` markieren → Review `💪` oder `okay` für den aktuellen Head absenden → **danach** die beiden Kästchen setzen. Ein neuer Commit macht die Head-gebundene Review-Evidence ungültig.

- [ ] Human/Owner: vollständigen PR-Diff geprüft.
- [ ] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.

## 6. Technische Nachweise

- [ ] Automatische Klassifikation stimmt mit dem tatsächlichen Diff überein.
- [ ] Live-PR-Body und Produktionsbaseline sind gegen den aktuellen Head validiert.
- [ ] Governance-/Security-Prüfungen PASS.
- [ ] Falls Klasse C/R: Repository-Konventionen im blocking-Modus PASS.
- [ ] Alle für `{{AUTO_CHECK_CLASS}}` erforderlichen Checks PASS.
- [ ] Falls Klasse R: Produktions-Docker-Container real gestartet und `/healthz` mit HTTP 200 geprüft.
- [ ] `build-and-test` für den aktuellen `(PR, Head-SHA)` PASS bzw. gültige One-Shot-Evidence kryptografisch/head-genau wiederverwendet.
- [ ] Falls Klasse M: separate Human/Owner-Mutationsfreigabe und Pre-/Post-Verification dokumentiert.

**CI-Evidence verständlich lesen:**
- **Volltest ausgeführt:** dieser Head wurde in diesem Lauf vollständig getestet.
- **Volltest-Evidence wiederverwendet:** derselbe `(PR, Head-SHA)` wurde bereits erfolgreich vollständig getestet; die Evidence wird über GitHub Actions erneut verifiziert, ohne den teuren Build zu duplizieren.
- **Nicht erforderlich:** die automatische Klasse verlangt diesen Check für den Diff nicht.
- **Ausstehend/fehlgeschlagen:** Merge-Bereitschaft ist nicht erreicht.

## 7. Was kann man aus diesem PR lernen?

{{AUTO_LEARNING_NOTE}}

> Ziel: Nach dem Lesen dieses Abschnitts soll auch ohne tiefes Repository-Wissen verständlich sein, **welches Feature oder welche Schutzfunktion geändert wird, warum die gewählten Tests nötig sind und welche Grenzen weiterhin gelten**.

## 8. Merge-Bereitschaft

- [ ] Human-/Owner-Review für den aktuellen Head vollständig.
- [ ] Erforderliche Checks erfolgreich.
- [ ] Keine offene merge-blockierende Diskussion.
- [ ] Keine Agenten-/Modell-Selbstfreigabe wird als Human-Freigabe behandelt.
- [ ] Merge erfolgt nur nach separater ausdrücklicher menschlicher Anweisung.
- [ ] Nach erfolgreichem Merge wird der Work-Branch gemäß Branch-Lifecycle-Policy gelöscht.
