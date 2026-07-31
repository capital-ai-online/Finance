# Traceability

## Enterprise Component

Status: Development

Version: 1.0.0

Layer: Querschnittsmodul mit erweitertem Zugriff

Owner: Platform Director

---

## Purpose

Die Enterprise Traceability Matrix (ETM) verwaltet die bidirektionalen Beziehungen zwischen
sämtlichen Enterprise-Artefakten.

Sie beantwortet lückenlos und maschinell:

> Welche Anforderung, welche Entscheidung, welche Regel führte zu welchem Artefakt —
> und welches Artefakt erfüllt welche Regel?

Sie erzeugt keine Regeln, keine Dokumentation und keine Artefakte.

Sie verknüpft ausschließlich bereits vorhandene, validierte Enterprise-Artefakte.

---

## Verhältnis zur Spezifikation

Diese Komponente **implementiert** ESS-0011.

| Dokument | Rolle |
|---|---|
| ESS-0011 | Spezifikation der ETM — Architektur, Prozesse, Reports |
| ESS-0011-CONTRACTS | Regelwerk — Link Contract, Coverage, Orphans |
| `docs/traceability/` | operative Dokumentation — Betrieb, Lifecycle, Validierung |
| **diese Komponente** | **Implementierung** |

Die Spezifikation wird hier **nicht wiederholt**. Bei Abweichungen gilt ESS-0011.

---

## Struktur

```text
Traceability/
  Contracts/    komponentenspezifische Contracts
  Core/         Basislogik der Matrix
  Discovery/    Erkennung verknüpfbarer Artefakte
  Events/       Event-Erzeugung und -Konsum
  Interfaces/   öffentliche Schnittstellen
  Models/       Datenmodelle
  Registry/     Registrierung der Matrixeinträge
  Reports/      Berichtsdatenerzeugung
  Services/     Ausführung und Orchestrierung
  Validators/   Prüfung der Matrix
  Versioning/   Versionierung der Matrix
```

Jedes Unterverzeichnis besitzt genau eine Verantwortung gemäß ESS-0001-CONTRACTS Chapter 3.

---

## Traceability-Achsen

Die ETM verknüpft sieben Artefaktklassen:

```text
ESS · ADR · Exception · Component · Interface · Event · Test
```

**Vorwärts** — Regel zu Umsetzung:
`ESS-Kapitel → ADR → Component → Interface → Event → Test`

**Rückwärts** — Umsetzung zu Regel:
`Test → Event → Interface → Component → ADR → ESS-Kapitel`

Eine Verknüpfung, die ausschließlich in einer Richtung existiert, ist ein Befund.

---

## Abhängigkeiten

**Zulässig:** Core, Shared, Registry, Knowledge, Discovery, Documentary

**Unzulässig:** Supervisor, PlatformDirector

Die Kommunikation nach oben erfolgt ausschließlich über Enterprise Events.

Die Einordnung als Querschnittsmodul mit erweitertem Zugriff folgt der bereits für `Release`
etablierten Regelung aus ESS-0001-CONTRACTS Chapter 16 (*Cross Cutting Modules*) und
erfordert keine Änderung der Layer-Hierarchie.

---

## Rollentrennung

| Instanz | Rolle |
|---|---|
| **Traceability (ETM)** | **verknüpft und misst** |
| Governance Validator | prüft Regeln |
| Supervisor | bewertet und eskaliert |
| Platform Director | entscheidet |
| Version Manager | leitet Versionsauswirkung ab |

Die ETM stellt Beziehungen fest. Sie bewertet nicht und entscheidet nicht.

---

## Datenquellen

Die ETM erzeugt keine eigenen Daten. Sie liest ausschließlich:

Knowledge Graph · Enterprise Registry · Digital Twin · ESS Registry ·
Exception Registry · `docs/adr/` · Validierungsergebnisse

Fehlt eine Quelle, meldet die ETM dies als Befund und arbeitet nicht mit Annahmen weiter.

---

## Ablage der Matrix

```text
.ai/knowledge/traceability/
  matrix.json      vollständige Matrix
  coverage.json    Abdeckungskennzahlen
  orphans.json     nicht verknüpfte Artefakte
```

Diese Dateien werden ausschließlich generiert und niemals manuell bearbeitet.

---

## ESS Reference

ESS-0011 — Enterprise Traceability

ESS-0011-CONTRACTS — Enterprise Traceability Matrix Contracts

ESS-0010 — Documentary Engine

ESS-0001-CONTRACTS — Master Enterprise Standard

---

## ADR References

ADR-0015 — Einführung der Traceability-Komponente

ADR-0013 — ESS Documentation Responsibility Consolidation

ADR-0014 — Documentation Governance Validator

---

## Implementierungsstand

Diese Komponente ist **spezifiziert, nicht implementiert**.

| Stufe | Voraussetzung | Zustand |
|---|---|---|
| 1 | JSON-Schemata, vollständige Metadaten | offen |
| 2 | Core, Interfaces, Models, Registry | offen |
| 3 | Enterprise Event Bus | offen |
| 4 | Validator-Basisklasse | offen |

Ohne Knowledge Graph und Digital Twin besitzt die ETM keine Datengrundlage — ein Aufbau
wäre nach ihren eigenen Regeln (`GOV-KG-001`, `GOV-TWIN-001`) nicht durchführbar.

---

## Notes

Vollständige Dokumentation unter `docs/traceability/`.

Diese Komponente ist die erste im Repository mit vollständigem Metadatensatz einschließlich
`component.yaml` und `CHANGELOG.md`.
