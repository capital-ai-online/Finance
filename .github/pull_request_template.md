<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.7.0 -->
`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.7.0`
# {{WORK_ITEM}}

> 🧭 **Entscheidungsstatus: {{DECISION_STATUS}}**  
> {{PRIORITY}} · PR-Klasse {{PR_CLASS}} · {{VERSION_IMPACT}}

## 1. 🧭 Entscheidung

| Frage | Ergebnis |
|---|---|
| Was ändert sich? | {{IMPLEMENTATION_DECISION}} |
| Warum jetzt? | {{WHY_DECISION}} |
| Auswirkung / Risikoklasse | {{IMPACT_RISK}} |
| Evidence | {{EVIDENCE_SUMMARY}} |
| Blocker | {{BLOCKER_SUMMARY}} |
| Owner-Aktion | Human/CODEOWNER Merge erforderlich |

## 2. ✅ Evidence

| Gate | Status |
|---|---|
| Current Main | {{DECISION_MAIN}} |
| Scope / Ownership | {{DECISION_SCOPE}} |
| Overlap | {{DECISION_OVERLAP}} |
| Required Checks | {{DECISION_CHECKS}} |
| Security / Compliance | {{DECISION_SECURITY}} |
| Production Baseline | {{DECISION_BASELINE}} |

## 3. 🔍 Technical Evidence

<details>
<summary>Technische Details & Traceability</summary>

- **Projekt:** {{PROJECT_SYMBOL}} {{PROJECT_ID}} · {{PROJECT_DISPLAY_NAME}}
- **Owner / PVC:** {{PRIMARY_OWNER}} · {{AFFECTED_PVC}}
- **Branch:** `{{HEAD_BRANCH}}` → `main`
- **Source → Target:** {{SOURCE_PROJECT_SYMBOL}} {{SOURCE_PROJECT_ID}} → {{TARGET_PROJECT_SYMBOL}} {{TARGET_PROJECT_ID}}
- **Erstellt durch:** {{AGENT_PROVIDER}} / {{AGENT_MODEL}} via {{AGENT_SURFACE}}
- **Claim:** `{{CLAIM_ID}}` · `{{CLAIM_FILE}}`
- **Projektordner:** `{{PROJECT_FOLDER}}`
- **Umsetzung:** {{IMPLEMENTATION_DETAIL}}\n- **Warum:** {{WHY_DETAIL}}\n- **Roadmap / Work Package:** {{ROADMAP}}
- **Ziel / Exit Gate:** {{EXIT_GATE}}
- **Priorität:** {{PRIORITY}}
- **Warum diese Priorität:** {{PRIORITY_REASON}}
- **Versionsimpact:** {{VERSION_IMPACT}}
- **Versionsbegründung:** {{VERSION_IMPACT_REASON}}
- **Version-Manager-Check:** {{VERSION_MANAGER_CHECK}}
- **PR-Klasse:** {{PR_CLASS}}
- **Klassenbegründung:** {{PR_CLASS_REASON}}
- **Erforderliche Checks:** {{EXPECTED_CHECKS}}
- **Main synchronisiert:** {{MAIN_SYNC_STATUS}}
- **Changed-File-/Semantic-Overlap:** {{OVERLAP_STATUS}}
- **Projektpräsentation:** {{PROJECT_SYMBOL}} {{PROJECT_DISPLAY_NAME}} · `{{PROJECT_COLOR}}`
- **Source Project:** {{SOURCE_PROJECT_SYMBOL}} {{SOURCE_PROJECT_DISPLAY_NAME}} · `{{SOURCE_PROJECT_ID}}` · `{{SOURCE_PROJECT_COLOR}}`
- **Source Projectfolder:** `{{SOURCE_PROJECT_FOLDER}}`
- **Target Project:** {{TARGET_PROJECT_SYMBOL}} {{TARGET_PROJECT_DISPLAY_NAME}} · `{{TARGET_PROJECT_ID}}` · `{{TARGET_PROJECT_COLOR}}`
- **Target Projectfolder:** `{{TARGET_PROJECT_FOLDER}}`
- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja
- **Agent-Self-Merge / Auto-Merge:** Nein

Symbol und Farbe sind nur Präsentationsmetadaten. Projekt-ID, Projektordner, Primary Owner und PVC bleiben die maßgeblichen Identitäten; Farbe ist nie alleiniger Bedeutungsträger.
</details>

<details>
<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>

{{PRODUCTION_BASELINE_BLOCK}}

</details>
