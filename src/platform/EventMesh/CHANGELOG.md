# Changelog — EventMesh

Alle Änderungen an dieser Komponente werden hier dokumentiert.

Format gemäß ESS-0001-CONTRACTS Chapter 7, *CHANGELOG Contract*: Version, Datum,
Beschreibung, Breaking Changes, Autor.

Die Versionierung folgt ESS-0001-CONTRACTS Chapter 9 (Semantic Versioning).

---

## [1.0.0] — 2026-07-31

### Hinzugefügt

- Komponentenstruktur mit zwölf Unterverzeichnissen gemäß ADR-0018
  (`Contracts`, `Core`, `Discovery`, `Events`, `Interfaces`, `Models`, `Policies`,
  `Registry`, `Reports`, `Services`, `Tests`, `Validators`)
- `manifest.json` mit vollständigem Metadatensatz nach Chapter 7
- `component.yaml` als menschen- und KI-lesbarer Komponentendeskriptor
- `README.md` mit Verantwortungsabgrenzung, umgekehrter Abhängigkeitsregel und
  Standard-Event-Katalog-Verweis
- Diese Changelog-Datei

### Referenzen

- ESS-0001-CONTRACTS Chapter 8 — Enterprise Event & Messaging Contracts (Regelwerk, unverändert)
- ESS-0013 — Enterprise Event Mesh (Spezifikation)
- ESS-0013-CONTRACTS — Event-Katalog, Kompatibilitäts- und Policy-Regeln
- ADR-0018 — Einführung der Enterprise Event Mesh als Plattformmodul

### Breaking Changes

Keine. Die Komponente wird ergänzend eingeführt und verändert keine bestehende
Komponente, keinen bestehenden Contract und keinen produktiven Code.

### Implementierungsstand

Spezifiziert, nicht implementiert. Es existiert kein ausführbarer Code.

Die Umsetzung entspricht Stufe 3 aus `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`
(Enterprise Event Bus) und setzt Stufe 1 und 2 (Schema/Metadata Foundation,
Core/Contracts) voraus.

### Autor

Platform Director

---

## Hinweis zur Erstfassung

Diese Komponente ist die **zweite** im Repository mit vollständigem Metadatensatz
(`component.yaml`, `CHANGELOG.md`), nach `src/platform/Traceability/` (ADR-0015), und
folgt demselben Muster.
