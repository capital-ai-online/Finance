# CAPITAL-AI Documentation Hygiene Policy

Status: DRAFT IMPLEMENTATION
Date: 2026-08-10
Scope: H0 + H4 + H5

## Deutsch

Diese Policy definiert die kanonische Dokumentationshygiene fuer CAPITAL-AI.

### Root Policy

Im Repository-Root sind nur explizit zugelassene Markdown-Dokumente erlaubt:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`

Neue fachliche, architektonische, operative, Compliance- oder Evidence-Dokumente muessen unter `docs/` in einem fachlich passenden Unterordner abgelegt werden. Historische Evidence wird archiviert statt geloescht.

### Canonical folders

- `docs/architecture/` — Architektur, Roadmaps, technische Entscheidungen und Integrations-Evidence.
- `docs/adr/` — Architecture Decision Records.
- `docs/compliance/` — Compliance-, Datenschutz- und regulatorische Dokumentation.
- `docs/governance/` — Governance Policies, Registry und Dokumentationsregeln.
- `docs/traceability/` — Traceability-Reports und Coverage Evidence.
- `docs/archive/` — historische oder superseded Evidence, sofern nicht bereits in einem fachlichen Archivpfad abgelegt.

### Document identity

Kanonische Dokumente werden ueber eine stabile `documentId` identifiziert. Der Dateipfad ist ein veraenderbares Attribut und keine Identitaet. Registry-Eintraege enthalten mindestens Typ, Owner, Authority, Version, Sprache, Lifecycle-Status und Pfad.

### CI hygiene gate

H5 wird innerhalb des bestehenden Unit-Test-Laufs ausgefuehrt. Es wird kein zusaetzlicher GitHub-Actions-Workflow eingefuehrt. Der Gate prueft mindestens:

1. keine nicht freigegebenen Root-Markdown-Dateien;
2. eindeutige Document IDs;
3. eindeutige Registry-Pfade;
4. vorhandene Registry-Zieldateien;
5. gueltige Lifecycle- und Language-Werte.

Damit bleibt die bestehende Actions-Budgetrichtlinie unveraendert.

## English

This policy establishes the canonical documentation hygiene rules for CAPITAL-AI. Only `README.md`, `AGENTS.md` and `CLAUDE.md` are allowed as root-level Markdown documents. Domain documentation belongs under `docs/` in canonical folders. Canonical documents use stable document IDs; paths are mutable metadata rather than identity. The H5 hygiene gate runs inside the existing unit-test job and therefore does not add another GitHub Actions pipeline.