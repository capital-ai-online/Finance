# CAPITAL-AI Documentation & Scripts Hygiene Audit

Date: 2026-08-10  
Scope: `docs/`, `scripts/`  
Basis: verified `main` at `69d6315c72f49b1a50f8a77a8f5e5218d7d972e0`

## Deutsch

### Ergebnis
Der Audit trennt aktuelle Dokumentation, historische Evidence und verwaiste Platzhalter. Inhalte werden nicht aufgrund ihres Alters gelöscht. Veraltete Dokumente werden unter `docs/archive/` erhalten und verlieren dort ausdrücklich ihren kanonischen Status.

### Eindeutig veraltet / historisch
Folgende Root-Dokumente sind alte Blueprint-, 0.5.x-/0.6.0-Snapshots oder durch aktuelle Architektur-/API-Evidence überholt:

- `API.md`
- `ARCHITECTURE_REVIEW.md`
- `COMPLIANCE_REPORT.md`
- `Classification-Agent.md`
- `Classification-Model.md`
- `Documentary.md`
- `Fundamentals-Agent.md`
- `Orchestrator.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
- `Risk-Agent.md`
- `SECURITY_AUDIT.md`
- `Scoring-Model.md`
- `Valuation-Agent.md`
- `integration-plan.md`

Sie werden in fachlich getrennte Archivpfade verschoben. Die kanonischen Authorities bleiben ESS, ADR, aktuelle Architektur-, API-Inventar-, Security-/Compliance- und Production-Evidence-Dokumente.

### Lose, aber weiterhin aktive Dokumente
- `changelog-dev.md` -> `docs/release/changelog-dev.md`
- `changelog-prod.md` -> `docs/release/changelog-prod.md`

`DATENSCHUTZ_PROTOKOLL.md` bleibt in diesem PR bewusst am Root. `MarkdownOrchestrator` verwendet den Root-Pfad als initialen Runtime-Lesepfad. Eine Verschiebung ohne gleichzeitige kontrollierte UI-Migration würde `/api/docs-file` mit 404 beantworten. Der Root-Stand ist deshalb kein unklassifizierter Rest, sondern eine dokumentierte Kompatibilitätsausnahme.

### Scripts
Keine ausführbare Script-Datei wird gelöscht. Entfernt werden ausschließlich redundante `.gitkeep`-Artefakte und leere Placeholder-Verzeichnisse:

- `scripts/.gitkeep`
- `scripts/automation/.gitkeep`
- `scripts/maintenance/.gitkeep`
- `scripts/migration/.gitkeep`
- `scripts/validation/.gitkeep`

Die aktiven Bereiche `automation`, `deployment`, `pr` und `security` bleiben unverändert.

### Schutzregeln
1. Historische Dokumente dürfen nicht als aktuelle Architektur-Autorität zitiert werden.
2. Archivierung ändert keinen Runtime-Code und keine externen Contracts.
3. Aktive Scripts werden nur nach nachgewiesener Referenz-/Runtime-Analyse entfernt.
4. Root-Dokumente benötigen künftig entweder einen expliziten Entry-Point-/Compatibility-Grund oder einen Fachordner.
5. Verschiebungen müssen bei Runtime- oder CI-Pfadabhängigkeiten vorab auf Blast Radius geprüft werden.

## English

The audit separates current documentation, historical evidence and orphan placeholders. Historical content is preserved under `docs/archive/` and explicitly becomes non-canonical. The two changelogs move to `docs/release/`. No executable script is deleted; only redundant `.gitkeep` files and empty placeholder directories are removed.

`DATENSCHUTZ_PROTOKOLL.md` intentionally remains at the docs root in this change because the current `MarkdownOrchestrator` initializes its runtime document reader with that exact root path. Moving it requires a dedicated UI/path migration to avoid a runtime 404.
