# GOV-PR-LABEL-01 — Full-Set Pull Request Label Classification

**Project:** `CAPITAL-AI-GOV`  
**Primary PVC:** `PVC-05`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@fb8b9dd3c661ecf5d202d570fe435496cbe47461`  
**Status:** `IMPLEMENTED_BRANCH / HOSTED_VALIDATION_PENDING`

## Ziel

Jeder Pull Request wird anhand seines vollständigen angehängten Label-Sets mehrdimensional eingeordnet. Kein vorhandenes Label darf still ignoriert oder durch ein einzelnes Hauptlabel ersetzt werden.

Die Klassifikation ist Evidence/Metadaten. Sie erzeugt keine Merge-Autorität und kann den Human-Owner-Merge nicht ersetzen.

## Klassifikationsdimensionen

| Dimension | Beispiele | Semantik |
|---|---|---|
| Project / Scope | `project:*`, `scope:*`, `owner:*`, `pvc:*`, `CAPITAL-AI-*` | fachliche/organisatorische Einordnung |
| Priority | `P0..P3`, `priority:*` | strengstes erkanntes Prioritätssignal |
| Risk / Security | Security, Compliance, Privacy, IAM, Secrets, Billing, Production | Risikokontext; mehrere Signale erlaubt |
| Change Type | Bug/Fix, Feature, Docs, Refactor, Tests, Chore, Dependencies | Art des Changes; mehrere Signale erlaubt |
| Version Impact | Major, Minor, Patch, None | strengster erkannter Versionsimpact |
| Governance / Workflow | Governance, Policy, Workflow, CI, Automation, Self-Healing, Autofix | Development-Chain-/Governance-Kontext |
| Status / Blocker | Blocked, Ready, Pending, WIP, Draft, Needs Changes | deskriptiver Status; Konflikte werden Drift |
| Automation / Source | ChatGPT/OpenAI, DeepSeek, Dependabot, Renovate, Bot/Agent, CodeQL | technische Herkunft |
| Component / Domain | `component:*`, `area:*`, `domain:*`, `team:*`, `module:*` | Komponenten-/Domänenbezug |

## Deterministische Regeln

1. Das komplette `pull_request.labels`-Array ist Input; Name, Farbe und Beschreibung werden erhalten.
2. Ein Label darf mehreren Dimensionen zugeordnet werden.
3. Unbekannte Labels bleiben unter `unmapped` vollständig erhalten und ergeben `PARTIAL_CLASSIFICATION`, aber keinen stillen Datenverlust.
4. Mehrere unterschiedliche Prioritäten ergeben `PRIORITY_CONFLICT`; effektiv gilt das strengste Signal `P0 > P1 > P2 > P3`.
5. Mehrere unterschiedliche Versionsimpacts ergeben `VERSION_IMPACT_CONFLICT`; effektiv gilt `MAJOR > MINOR > PATCH > NONE`.
6. Gleichzeitige Blocked-/Ready-Signale ergeben `STATUS_CONFLICT` und `LABEL_DRIFT`.
7. Label-Drift wird im Workflow fail-closed als fehlgeschlagene Klassifikation sichtbar.
8. Labels sind niemals Merge-Freigabe. `labels_can_authorize_merge=false` ist Bestandteil jedes Resultats.

## Umsetzung

- `scripts/pr/prLabelClassification.mjs`: reiner Klassifikationsvertrag + CLI + GitHub Output/Step Summary.
- `scripts/pr/prLabelClassification.test.mjs`: Regressionen für Full-Set-Verarbeitung, unbekannte Labels, Konflikte, strengste Signale und Workflow-Sicherheitsgrenzen.
- `.github/workflows/pr-label-classification.yml`: read-only `pull_request`-Workflow auf Open/Reopen/Sync/Edit/Label/Unlabel/Ready/Draft.
- `.ai/work-claims/GOV-PR-LABEL-CLASSIFICATION-20260920.json`: exakter Branch-/Scope-Claim.

## Korrelation mit offenem PR #1140

PR #1140 ändert das Human-Decision-PR-Template v1.7. Dieses Arbeitspaket ändert keine seiner Dateien und besitzt daher keinen Changed-File-Overlap. Eine spätere Darstellung der Label-Klassifikation direkt in der v1.7 Decision Card kann nach Merge von #1140 als eigener konsumierender Slice erfolgen; die hier eingeführte Klassifikation ist bereits selbstständig als Workflow-Evidence nutzbar.

## Exit Gate

- kompletter Label-Input wird ohne Verlust verarbeitet;
- unbekannte Labels bleiben sichtbar;
- Prioritäts-, Versions- und Statuskonflikte werden deterministisch erkannt;
- Workflow besitzt ausschließlich Read-Berechtigungen und kein `pull_request_target`;
- keine Auto-Merge-/Merge-Mutation;
- `npm run pr:governance:test` bzw. die darin enthaltenen Node-Tests validieren den Vertrag;
- Hosted PR Governance/Workflow Security müssen PASS liefern;
- finaler Merge ausschließlich Human Owner.
