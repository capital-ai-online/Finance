<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0 -->
`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0`
# CAPITAL-AI Pull Request

> **{{PRIORITY}} · {{VERSION_IMPACT}} · PR-Klasse {{PR_CLASS}}**  
> {{WORK_ITEM}}

## 1. 🎯 Kurzüberblick

- **Warum:** {{WHY}}
- **Ziel / Exit Gate:** {{EXIT_GATE}}

## 2. 📦 Projekt & Scope

- **Projekt:** {{PROJECT_SYMBOL}} {{PROJECT_ID}} · {{PROJECT_DISPLAY_NAME}}
- **Owner / PVC:** {{PRIMARY_OWNER}} · {{AFFECTED_PVC}}
- **Branch:** `{{HEAD_BRANCH}}` → `main`
- **Source → Target:** {{SOURCE_PROJECT_SYMBOL}} {{SOURCE_PROJECT_ID}} → {{TARGET_PROJECT_SYMBOL}} {{TARGET_PROJECT_ID}}

<details>
<summary>Technische Herkunft & Routing</summary>

- **Erstellt durch:** {{AGENT_PROVIDER}} / {{AGENT_MODEL}} via {{AGENT_SURFACE}}
- **Claim:** `{{CLAIM_ID}}` · `{{CLAIM_FILE}}`
- **Projektordner:** `{{PROJECT_FOLDER}}`
- **Projektpräsentation:** {{PROJECT_SYMBOL}} {{PROJECT_DISPLAY_NAME}} · `{{PROJECT_COLOR}}`
- **Source Project:** {{SOURCE_PROJECT_SYMBOL}} {{SOURCE_PROJECT_DISPLAY_NAME}} · `{{SOURCE_PROJECT_ID}}` · `{{SOURCE_PROJECT_COLOR}}`
- **Source Projectfolder:** `{{SOURCE_PROJECT_FOLDER}}`
- **Target Project:** {{TARGET_PROJECT_SYMBOL}} {{TARGET_PROJECT_DISPLAY_NAME}} · `{{TARGET_PROJECT_ID}}` · `{{TARGET_PROJECT_COLOR}}`
- **Target Projectfolder:** `{{TARGET_PROJECT_FOLDER}}`

Symbol und Farbe sind nur Präsentationsmetadaten. Projekt-ID, Projektordner, Primary Owner und PVC bleiben die maßgeblichen Identitäten; **Farbe ist nie alleiniger Bedeutungsträger**. Current, Source und Target werden aus `docs/projects/README.md` aufgelöst.
</details>

## 3. 🛠️ Umsetzung

{{IMPLEMENTATION}}

## 4. 📌 Priorität & Roadmap

- **Priorität:** {{PRIORITY}}
- **Warum diese Priorität:** {{PRIORITY_REASON}}
- **Roadmap / Work Package:** {{ROADMAP}}

> P0 🔴 Kritisch · P1 🟠 Hoch · P2 🟡 Normal · P3 🟢 Niedrig

## 5. 🔢 Version & PR-Klasse

- **Versionsimpact:** {{VERSION_IMPACT}}
- **Versionsbegründung:** {{VERSION_IMPACT_REASON}}
- **Version-Manager-Check:** {{VERSION_MANAGER_CHECK}}
- **PR-Klasse:** {{PR_CLASS}}
- **Klassenbegründung:** {{PR_CLASS_REASON}}
- **Erforderliche Checks:** {{EXPECTED_CHECKS}}

> Version: NOT_EVALUATED ⚪ · NONE ➖ · PATCH 🩹 · MINOR ✨ · MAJOR 💥  
> PR-Klasse: D = Doku/Governance · C = Code/Tests/Config · R = Runtime/Dependency/Deployment · M = geschützte externe/produktive Mutation

## 6. ✅ Prüfung & Merge

- **Main synchronisiert:** {{MAIN_SYNC_STATUS}}
- **Changed-File-/Semantic-Overlap:** {{OVERLAP_STATUS}}
- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja
- **Agent-Self-Merge / Auto-Merge:** Nein

## 7. Maschinenlesbare Baseline

{{PRODUCTION_BASELINE_BLOCK}}
