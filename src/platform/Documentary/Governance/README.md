# Documentation Governance Validator

## Enterprise Component

Status: Unspecified (vollständig spezifiziert per ESS-0012, jedoch 0 Code-Dateien — siehe „Implementierungsstand" unten)

Version: 1.0.0

Layer: Documentary

Owner: Documentary Engine

---

## Purpose

Der Documentation Governance Validator ist die Prüfinstanz der Documentary Engine.

Er überprüft sämtliche Dokumentation, Regeln, Metadaten und Beziehungen des Repositories
automatisch auf Konsistenz, Vollständigkeit und Governance-Konformität.

Er erzeugt ausschließlich Befunde und Berichte.

Er trifft keine Entscheidungen, verändert keine Dokumentation und behebt keine Verstöße.

---

## Abgrenzung

| Instanz | Verantwortung |
|---|---|
| Documentary Engine (ESS-0010) | erzeugt Wissen und Dokumentation |
| **Governance Validator (ESS-0012)** | **prüft Dokumentation und Governance** |
| Enterprise Traceability (ESS-0011) | verknüpft Artefakte bidirektional |
| Supervisor (ESS-0002) | bewertet Befunde und eskaliert |
| Platform Director (ESS-0003) | entscheidet |

Der Validator stellt fest. Der Supervisor bewertet. Der Platform Director entscheidet.

---

## Struktur

```text
Governance/
  Contracts/    komponentenspezifische Contracts
  Validators/   Einzelvalidatoren je Prüfbereich
  Rules/        Regelwerk, deklarativ
  Services/     Ausführung und Orchestrierung
  Reports/      Berichtserzeugung
  Events/       Event-Erzeugung und -Konsum
  Models/       Datenmodelle
  Interfaces/   öffentliche Schnittstellen
```

Jedes Unterverzeichnis besitzt genau eine Verantwortung gemäß ESS-0001-CONTRACTS Chapter 3.

---

## Prüfbereiche

| Bereich | Gegenstand |
|---|---|
| ESS | doppelte Regeln, fehlende Referenzen, ungültige Nummern, fehlende Cross-References, Widersprüche |
| ADR | fehlende Referenzen, Widersprüche, veraltete ADRs, Breaking Changes ohne ADR |
| Repository | README, CHANGELOG, manifest.json, component.yaml, Ownership |
| Contracts | Duplikate, Widersprüche, ungültige und nicht referenzierte Contracts |
| Dokumentation | Vollständigkeit, Aktualität, Versionierung, Konsistenz, Struktur, Formatierung |
| Traceability | fehlende Beziehungen entlang ESS → ADR → Code → Test → Doku → Version → Release |
| Knowledge Graph | verwaiste Knoten, doppelte, fehlende und inkonsistente Beziehungen |
| Digital Twin | fehlende, neue, gelöschte und nicht synchronisierte Komponenten |
| Versionierung | Versionskonflikte über Dokument-, Komponenten-, Repository-, ESS- und ADR-Version |

---

## ESS Reference

ESS-0012 — Documentation Governance

ESS-0012-CONTRACTS — Documentation Governance Contracts

ESS-0010 — Documentary Engine

ESS-0011 — Enterprise Traceability

ESS-0001-CONTRACTS — Master Enterprise Standard

---

## ADR References

ADR-0014 — Documentation Governance Validator

ADR-0013 — ESS Documentation Responsibility Consolidation

ADR-0010 — Enterprise Standard Extension

---

## Dependencies

Zulässig: Core, Shared, Registry, Discovery, Knowledge

Unzulässig: VersionManager, Supervisor, PlatformDirector

Die Kommunikation nach oben erfolgt ausschließlich über Enterprise Events.

---

## Events

**Erzeugt**

DocumentationValidatedEvent

GovernanceViolationDetectedEvent

DuplicateContractDetectedEvent

TraceabilityViolationEvent

DigitalTwinOutOfSyncEvent

RepositoryHealthUpdatedEvent

**Konsumiert**

RepositoryScannedEvent

KnowledgeUpdatedEvent

TwinSynchronizedEvent

ComponentRegisteredEvent

DocumentationGeneratedEvent

VersionChangedEvent

---

## Implementierungsstand

Diese Komponente ist **spezifiziert, nicht implementiert**.

Die Implementierung setzt die Umsetzungsstufen 1 bis 4 aus
`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus:

| Stufe | Voraussetzung | Zustand |
|---|---|---|
| 1 | JSON-Schemata, vollständige Metadaten | offen |
| 2 | Core, Interfaces, Models, Registry | offen |
| 3 | Enterprise Event Bus | offen |
| 4 | Validator-Basisklasse, Quality Gates | offen |

Ohne diese Grundlagen wäre der Validator ein isoliertes Skript ohne Event-Anbindung,
ohne Registry-Eintrag und ohne Twin-Integration — und damit selbst ein Governance-Verstoß.

---

## Notes

Spezifikation vollständig in ESS-0012 und ESS-0012-CONTRACTS.

Skill-Beschreibung unter `.ai/skills/Documentation-Governance-Validator.md`.
