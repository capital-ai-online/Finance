<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->
`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`
# {{WORK_ITEM}}

> 🧭 **Entscheidungsstatus: {{DECISION_STATUS}}**  
> {{PRIORITY}} · PR-Klasse {{PR_CLASS}} · {{VERSION_IMPACT}}

## 1. 🧭 Entscheidung

### 📡 Live Dashboard

| Live-Signal | Zustand |
|---|---|
| Status | {{DECISION_STATUS}} |
| Synchronität | {{LIVE_SYNC_SUMMARY}} |
| Nächster Schritt | {{NEXT_VERIFIABLE_STEP}} |

### 🚀 Production & Cadence

| Production-Signal | Zustand |
|---|---|
| CURRENT_MAIN | `{{CURRENT_MAIN_SHA}}` |
| Live Production | `{{PRODUCTION_VERSION}}` · `{{PRODUCTION_SHA}}` |
| Deploy-Cadence | `{{DEPLOYMENT_STATE}}` · `{{DEPLOY_PROGRESS}}/5` · noch `{{DEPLOY_REMAINING}}` Merge(s) |
| Nächstes Deploy-Ziel | `{{NEXT_DEPLOY_TARGET_SHA}}` |
| Plattformversion | `{{CURRENT_PACKAGE_VERSION}}` |
| Version-Cadence | `{{VERSION_PROGRESS}}/10` · noch `{{VERSION_REMAINING}}` Merge(s) |
| Nächstes PATCH-Ziel | `{{NEXT_PATCH_VERSION}}` |

| Frage | Ergebnis |
|---|---|
| Was ändert sich? | {{IMPLEMENTATION_DECISION}} |
| Warum jetzt? | {{WHY_DECISION}} |
| Auswirkung / Risikoklasse | {{IMPACT_RISK}} |
| Evidence | {{EVIDENCE_SUMMARY}} |
| Blocker | {{BLOCKER_SUMMARY}} |
| Owner-Aktion | Human/CODEOWNER Merge erforderlich |

## 2. ✅ Evidence

| Gate | Status | Warum offen / blockiert | Nächster verifizierbarer Schritt |
|---|---|---|---|
| Current Main | {{DECISION_MAIN}} | {{DECISION_MAIN_REASON}} | {{DECISION_MAIN_NEXT}} |
| Scope / Ownership | {{DECISION_SCOPE}} | {{DECISION_SCOPE_REASON}} | {{DECISION_SCOPE_NEXT}} |
| Overlap | {{DECISION_OVERLAP}} | {{DECISION_OVERLAP_REASON}} | {{DECISION_OVERLAP_NEXT}} |
| Required Checks | {{DECISION_CHECKS}} | {{DECISION_CHECKS_REASON}} | {{DECISION_CHECKS_NEXT}} |
| Security / Compliance | {{DECISION_SECURITY}} | {{DECISION_SECURITY_REASON}} | {{DECISION_SECURITY_NEXT}} |
| Production / Deploy Cadence | {{DECISION_BASELINE}} | {{DECISION_BASELINE_REASON}} | {{DECISION_BASELINE_NEXT}} |

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
- **Umsetzung:** {{IMPLEMENTATION_DETAIL}}
- **Warum:** {{WHY_DETAIL}}
- **Roadmap / Work Package:** {{ROADMAP}}
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
- **Merge-Modus:** HUMAN_MERGE_REQUIRED
- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja
- **Agent-Self-Merge:** Nein
- **Auto-Merge:** Nein <!-- Fail-closed default; AUTO_MERGE_ELIGIBLE requires a separately validated implementation under /AGENTS.md@CURRENT_MAIN. -->

Symbol und Farbe sind nur Präsentationsmetadaten. Projekt-ID, Projektordner, Primary Owner und PVC bleiben die maßgeblichen Identitäten; Farbe ist nie alleiniger Bedeutungsträger. Current, Source und Target werden aus `docs/projects/README.md` aufgelöst.
</details>

<details>
<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>

{{PRODUCTION_BASELINE_BLOCK}}

</details>
