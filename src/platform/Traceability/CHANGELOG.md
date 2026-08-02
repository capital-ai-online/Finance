# Changelog — Traceability

Alle Änderungen an dieser Komponente werden hier dokumentiert.

Format gemäß ESS-0001-CONTRACTS Chapter 7, *CHANGELOG Contract*: Version, Datum,
Beschreibung, Breaking Changes, Autor.

Die Versionierung folgt ESS-0001-CONTRACTS Chapter 9 (Semantic Versioning).

---

## [1.0.0] — 2026-07-31

### Hinzugefügt

- Komponentenstruktur mit elf Unterverzeichnissen gemäß ADR-0015
  (`Contracts`, `Core`, `Discovery`, `Events`, `Interfaces`, `Models`, `Registry`,
  `Reports`, `Services`, `Validators`, `Versioning`)
- `manifest.json` mit vollständigem Metadatensatz nach Chapter 7
- `component.yaml` als menschen- und KI-lesbarer Komponentendeskriptor
- `README.md` mit Verantwortungsabgrenzung und Abhängigkeitsregeln
- Diese Changelog-Datei

### Referenzen

- ESS-0011 — Enterprise Traceability (Spezifikation)
- ESS-0011-CONTRACTS — Link Contract, Coverage Contracts, Orphan Contracts
- ADR-0015 — Einführung der Traceability-Komponente

### Breaking Changes

Keine. Die Komponente wird ergänzend eingeführt und verändert keine bestehende
Komponente.

### Implementierungsstand

Spezifiziert, nicht implementiert. Es existiert kein ausführbarer Code.

Die Umsetzung setzt die Stufen 1 bis 4 aus
`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus — insbesondere den
Enterprise Event Bus und die Validator-Basisklasse.

### Autor

Platform Director

---

## [1.1.0] — 2026-08-02

### Hinzugefügt

- `Models/traceabilityModels.ts` — Datenmodelle (EssArtifact, AdrArtifact, ComponentArtifact,
  TestArtifact, TraceabilityLink, TraceabilityMatrix, CoverageReport, OrphanFinding)
- `Interfaces/index.ts` — `ITraceabilityBuilder`, `ICoverageAnalyzer`, `IOrphanDetector`,
  `ITraceabilityReporter`, `ITraceabilityLink`
- `Discovery/artifactDiscovery.ts` — liest ESS-Registry, ADR-Historie, alle
  Plattform-Manifeste (rekursiv) und alle Testdateien unter `tests/`
- `Core/traceabilityBuilder.ts` — baut die Achsen ESS↔Component und Component↔Test
- `Core/coverageAnalyzer.ts`, `Core/orphanDetector.ts`
- `Registry/traceabilityRegistry.ts` — Prozessregistrierung des zuletzt gebauten Standes
- `Reports/traceabilityReporter.ts` — schreibt `matrix.json`/`coverage.json`/`orphans.json`
  unter `.ai/knowledge/traceability/` und `docs/traceability/COVERAGE_REPORT.md`
- `Services/runTraceability.ts` — CLI, `npm run traceability:build`; führt zusätzlich das
  `tests`-Feld in allen 25 Plattform-Manifesten anhand real gefundener Testdateien nach

### Geändert

- `manifest.json`: `status` von `specified` auf `development`; Klarstellung, dass die
  deklarierten Events (noch) nicht ausgelöst/konsumiert werden und die deklarierten
  Abhängigkeiten (Core, Shared, Registry, Knowledge, Discovery) mangels eigenen Codes nicht
  importiert werden
- `README.md`: Implementierungsstand aktualisiert (Stufe 1–2 umgesetzt, 3–4 offen); die
  zuvor genannte KG-/Digital-Twin-Blockade als für diesen Ausbau nicht zutreffend korrigiert

### Referenzen

- ARCH-AUDIT-0002, Kapitel 14.4, Maßnahme N4

### Breaking Changes

Keine.

### Autor

Platform Director

---

## [1.2.0] — 2026-08-02

### Hinzugefügt

- `Validators/baseValidator.ts` — erste generische Validator-Basisklasse im gesamten
  Repository (`abstract class Validator<TTarget, TFinding>`)
- `Validators/traceabilityMatrixValidator.ts` — erste konkrete Implementierung, wrappt
  `Core/orphanDetector.ts` (Konstruktor-Injektion fuer Testbarkeit)
- `Services/runTraceability.ts`: sechs reale Events ueber den Enterprise Event Bus
  (`publishTraceabilityEvent()`, best-effort) - TraceabilityBuildStartedEvent,
  TraceabilityBuildCompletedEvent, TraceabilityBuildFailedEvent, CoverageCalculatedEvent,
  OrphanDetectedEvent, TraceabilityReportGeneratedEvent
- `tests/unit/traceabilityValidator.test.ts`

### Geändert

- `src/platform/EventMesh/Events/StandardEventCatalog.ts`: vier fehlende
  Traceability-Events ergaenzt (nur `TraceabilityBuildCompletedEvent` war zuvor katalogisiert)
- `Services/runTraceability.ts` nutzt jetzt `TraceabilityMatrixValidator` statt
  `OrphanDetector` direkt zu instanziieren
- `manifest.json`, `README.md`, `component.yaml`: Implementierungsstand Stufe 3 (teilweise:
  Publish-Seite umgesetzt, keine Subscriptions) und Stufe 4 (umgesetzt) aktualisiert

### Referenzen

- ARCH-AUDIT-0002, Kapitel 14.4, Massnahme N4 (Folgearbeit)

### Breaking Changes

Keine.

### Autor

Platform Director

---

## Hinweis zur Erstfassung

Diese Datei ist zusammen mit `component.yaml` die **erste ihrer Art im Repository**.

Die 23 bestehenden Komponenten führen weder `CHANGELOG.md` noch `component.yaml` —
dokumentiert als GAP-013 und GAP-014 in `docs/architecture/ARCHITECTURE_GAP_REPORT.md`
sowie als Regeln `GOV-REPO-002` und `GOV-REPO-004` in ESS-0012-CONTRACTS.

Diese Komponente dient insoweit als Referenzimplementierung des Metadata Contracts.
