# CAPITAL-AI Vocabulary Governance — Phase 3 Safe Rename Gate

Status: Implemented on feature branch  
Datum / Date: 2026-08-10  
Authority: ESS-0017 / ESS-0017-CONTRACTS  
Architecture Decision: ADR-0046  
CI Cost Governance: `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`

## Deutsch

### Ziel

Phase 3 führt einen read-only Rename-Impact-Analyzer ein. Er bewertet vorgeschlagene technische Renames, bevor bestehender Anwendungscode verändert wird. Die Analyse ist ein vorgelagertes Governance-Gate und führt selbst keine Umbenennungen durch.

### Kommando

```text
npx tsx scripts/automation/validateRenameImpact.ts --from <SourceTerm> --to <ApprovedCanonicalTerm>
```

Optional kann mit `--root <path>` ein alternativer Repository-Root angegeben werden.

### Klassifikation

- `SAFE`: keine Runtime-Referenzen und keine Blocker; nachgelagerte technische Gates bleiben trotzdem verpflichtend.
- `CONDITIONAL`: Runtime-Referenzen existieren, aber kein harter Blocker. Eine dependency-aware Migration ist erforderlich.
- `BLOCKED`: mindestens ein harter Governance-/Dependency-Blocker wurde gefunden.

### Harte Blocker

Der Analyzer blockiert insbesondere:

- Zielbegriffe, die nicht als `approved` `canonicalCodeTerm` in der Canonical Vocabulary Registry registriert sind;
- `forbiddenTerms` aus der Vocabulary Registry;
- technische Zielnamen außerhalb des Identifier-Regex `^[A-Za-z_$][A-Za-z0-9_$]*$`;
- Case-only-Renames, weil Dateisystem- und Deploy-Verhalten zwischen Linux, Windows und macOS divergieren kann;
- sensitive Treffer in Environment-/Config-Referenzen;
- API-/Route-Referenzen;
- Dynamic Imports / Lazy Loading;
- Schema-/Contract-Flächen.

### Referenzscan

Der Analyzer durchsucht textbasierte Repository-Artefakte und ignoriert generierte oder externe Verzeichnisse wie `node_modules`, `dist`, `coverage`, `.git` und Build-Caches. Runtime-Flächen (`src/`, `server.ts`, `scripts/`, `config/`, `.github/`) werden von Dokumentationsflächen (`docs/`, `.ai/`) getrennt bewertet.

### Regex- und Vocabulary-Integration

Der Analyzer escaped Quellbegriffe vor der Regex-Verwendung und verwendet identifier-aware Boundaries, damit Teilstrings nicht als vollständige technische Referenzen klassifiziert werden. Zielbegriffe werden direkt gegen die in Phase 2 eingeführte Canonical Vocabulary Registry geprüft. Es wird keine zweite Terminologiequelle aufgebaut.

### CI- und Kostenintegration

Phase 3 erzeugt keinen eigenen GitHub-Actions-Workflow für die Rename-Analyse. Der Analyzer ist ein lokaler/read-only Preflight. Für einen PR-Head-SHA wird die technische Evidence aus dem bestehenden einzelnen vollständigen CI-Lauf wiederverwendet. Die Richtlinie `GITHUB_ACTIONS_BUDGET_POLICY.md` gilt verbindlich: keine duplizierte npm/Test/Build-Pipeline, keine Synchronisierung ohne echten main-Drift, kein manueller `Re-run all jobs` zur Statuskosmetik und höchstens ein gezielter Wiederholungslauf nach einer tatsächlichen Fehlerkorrektur.

Bei der Phase-3-Synchronisierung wurde ein verbliebener Verstoß gegen diese Richtlinie erkannt: Der Google-Marketing-Schutzworkflow duplizierte `npm ci`, Typecheck und Production Build auch bei einer reinen `package.json`-Scriptänderung. Die Korrektur verlagert den nach dem Build erforderlichen CSP-Delivery-Test in den einzigen CI-Hauptlauf und reduziert den spezialisierten Marketing-Guard auf eine kostengünstige statische Schutzprüfung. Gleichzeitig wird der Docker-Image-Build auf Pull Requests gemäß Budgetrichtlinie nur noch bei Docker-/Runtime-/Dependency-/Deployment-relevanten Änderungen ausgeführt; auf `main` bleibt er vor Production-Deploy verpflichtend.

### Nachgelagerte Gates

Auch ein `SAFE`-Ergebnis ersetzt keine technische Validierung. Vor einem tatsächlichen Rename bleiben mindestens erforderlich:

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. `npm run predeploy:check`

Diese Gates werden nicht als separater Phase-3-Workflow dupliziert, sondern über die bestehende CI-Evidence genutzt.

Phase 3 erzeugt ausschließlich Evidence. Aktive Renames sind weiterhin Phase 6 vorbehalten.

### Architektur- und Deploy-Grenze

Diese Phase ändert keine bestehenden Komponenten-, Datei-, Import-/Export-, API-, Schema-, Environment- oder Event-Namen. Die einzigen Workflow-Anpassungen konsolidieren bereits vorhandene technische Evidence und setzen die verbindliche 15-EUR-CI-Kostenrichtlinie um; sie verändern nicht den Render-Deploy-Hook oder dessen fail-closed main-Grenze.

## English

### Goal

Phase 3 introduces a read-only rename impact analyzer. It evaluates proposed technical renames before existing application code is changed. The analyzer is a governance gate and never performs a rename itself.

### Classification

`SAFE` means no runtime references and no hard blockers were detected. `CONDITIONAL` means runtime references require a dependency-aware migration. `BLOCKED` means at least one hard governance or dependency blocker exists.

### Integration

Target names are validated against the Phase 2 Canonical Vocabulary Registry. The analyzer scans repository references, separates runtime and documentation surfaces, applies identifier-aware regex matching, blocks case-only renames and sensitive dependency surfaces, and preserves the existing lint/test/build/predeploy gates.

### CI cost boundary

Phase 3 adds no independent rename-analysis workflow. Existing CI evidence is reused under `GITHUB_ACTIONS_BUDGET_POLICY.md`. The previously duplicated Google Marketing install/typecheck/build path is consolidated into the single main CI path, and PR Docker builds become conditional on Docker/runtime/dependency/deployment relevance while remaining mandatory on main before production deployment.

### Safety boundary

Phase 3 produces evidence only. No active component, file, import/export, API, schema, environment or event identifiers are renamed. Actual incremental migrations remain Phase 6 work.
