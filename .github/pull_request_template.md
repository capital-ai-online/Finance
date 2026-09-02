<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0 -->
`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.6.0`
# CAPITAL-AI Pull Request

<!--
Kanonische kompakte PR-Vorlage für alle GitHub-PR-Erstellungswege.
Der sichtbare Inhalt konzentriert sich auf Herkunft, Projekt/PVC, Umsetzung, Roadmap, Klasse und Prüfung.
Der maschinenlesbare Production-Baseline-Block sowie die Human-/CODEOWNER-Merge-Grenze bleiben verpflichtend.
Nicht zutreffende Angaben werden mit begründetem N/A gefüllt.
-->

## 1. Herkunft

- **Erstellt durch:** {{AGENT_PROVIDER}} / {{AGENT_MODEL}} via {{AGENT_SURFACE}}
- **Claim:** `{{CLAIM_ID}}` · `{{CLAIM_FILE}}`
- **Branch:** `{{HEAD_BRANCH}}` → `main`

## 2. Projektzuordnung

- **Projekt:** {{PROJECT_ID}}
- **Projektordner:** `{{PROJECT_FOLDER}}`
- **Primary Owner:** {{PRIMARY_OWNER}}
- **Betroffene PVC:** {{AFFECTED_PVC}}

## 3. Umsetzung

- **Was wurde umgesetzt:** {{IMPLEMENTATION}}
- **Warum:** {{WHY}}

## 4. Roadmap

- **Roadmap / Work Package:** {{ROADMAP}}
- **Ziel / Exit Gate:** {{EXIT_GATE}}

## 5. PR-Klasse

- **Klasse:** {{PR_CLASS}}
- **Begründung:** {{PR_CLASS_REASON}}
- **Erforderliche Checks:** {{EXPECTED_CHECKS}}

<!-- D = Dokumentation/Governance-Dokumente · C = Code/Tests/Konfiguration · R = Runtime/Dependency/Deployment · M = externe oder produktive Mutation -->

## 6. Prüfung

- **Main synchronisiert:** {{MAIN_SYNC_STATUS}}
- **Changed-File-/Semantic-Overlap:** {{OVERLAP_STATUS}}
- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja
- **Agent-Self-Merge:** Nein

## 7. Maschinenlesbare Baseline

{{PRODUCTION_BASELINE_BLOCK}}
