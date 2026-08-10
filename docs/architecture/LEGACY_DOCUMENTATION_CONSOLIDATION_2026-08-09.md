# CAPITAL-AI Legacy Documentation Consolidation

Date: 2026-08-10  
Status: CONSOLIDATION IMPLEMENTED IN DRAFT  
Authority: ESS-0010, ESS-0011, ESS-0012  
Scope: legacy and loose documentation under `docs/`

## Deutsch

### Kanonische Hierarchie
1. ESS/Contracts und Registries unter `.ai/`.
2. ADRs unter `docs/adr/`.
3. Aktuelle Architektur unter `docs/architecture/`.
4. Fachliche Implementierungsdokumentation unter `docs/<domain>/`.
5. Datiertes Evidence-/Audit-Material.
6. `docs/archive/` ausschließlich als historische, nicht-kanonische Quelle.

### Abgeschlossene Konsolidierung

| Früherer Root-Pfad | Neuer Pfad | Status |
|---|---|---|
| `docs/API.md` | `docs/archive/raw-materials/API.md` | historischer API-Snapshot; aktuelle API Authority: `docs/architecture/api/` |
| `docs/Classification-Agent.md` | `docs/archive/raw-materials/Classification-Agent.md` | historisch |
| `docs/Classification-Model.md` | `docs/archive/raw-materials/Classification-Model.md` | historisch |
| `docs/Fundamentals-Agent.md` | `docs/archive/raw-materials/Fundamentals-Agent.md` | historisch |
| `docs/Orchestrator.md` | `docs/archive/raw-materials/Orchestrator.md` | historisch |
| `docs/Risk-Agent.md` | `docs/archive/raw-materials/Risk-Agent.md` | historisch |
| `docs/Scoring-Model.md` | `docs/archive/raw-materials/Scoring-Model.md` | historisch |
| `docs/Valuation-Agent.md` | `docs/archive/raw-materials/Valuation-Agent.md` | historisch |
| `docs/ARCHITECTURE_REVIEW.md` | `docs/archive/legacy/ARCHITECTURE_REVIEW.md` | nicht-kanonischer historischer Review |
| `docs/Documentary.md` | `docs/archive/legacy/Documentary.md` | superseded Blueprint |
| `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` | `docs/archive/legacy/PRODUCTION_DEPLOYMENT_GUIDE.md` | superseded Operations Guide |
| `docs/integration-plan.md` | `docs/archive/legacy/integration-plan.md` | superseded Integrationsplan |
| `docs/COMPLIANCE_REPORT.md` | `docs/archive/evidence/COMPLIANCE_REPORT.md` | historischer Evidence-Snapshot |
| `docs/SECURITY_AUDIT.md` | `docs/archive/evidence/SECURITY_AUDIT.md` | historischer Evidence-Snapshot |
| `docs/changelog-dev.md` | `docs/release/changelog-dev.md` | aktives Release-Artefakt |
| `docs/changelog-prod.md` | `docs/release/changelog-prod.md` | aktives Release-Artefakt |

### Bewusste Root-Ausnahme
`docs/DATENSCHUTZ_PROTOKOLL.md` bleibt temporär am Root, weil `MarkdownOrchestrator` diesen exakten Pfad als initialen Runtime-Lesepfad verwendet. Das Dokument ist fachlich Compliance-/Privacy-Evidence; die spätere Verschiebung nach `docs/compliance/` benötigt eine gekoppelte UI-Pfadmigration.

### Regeln
- Archivdateien sind Evidence, keine aktuelle Authority.
- Neue fachliche Dokumente gehören grundsätzlich in einen bestehenden Fachordner.
- Root-Dateien benötigen einen dokumentierten Entry-Point-, Kompatibilitäts- oder Governance-Grund.
- Keine historische Datei wird gelöscht, solange ihr Evidence-Wert nicht nachweislich entfallen ist.

## English

Legacy root documentation has been consolidated into domain-specific archive locations while preserving Git content and evidence. Active changelogs move to `docs/release/`. Archived documents are explicitly non-canonical; ESS, ADRs and current architecture/API evidence remain authoritative.

`docs/DATENSCHUTZ_PROTOKOLL.md` is a documented temporary root exception because the current `MarkdownOrchestrator` reads that exact path at runtime. Its later move to `docs/compliance/` must be coupled with a UI path migration.
