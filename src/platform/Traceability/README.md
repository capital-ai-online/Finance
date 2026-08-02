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

Diese Komponente ist **teilweise implementiert** (ARCH-AUDIT-0002, N4/N4-Folge, 2026-08-02).

| Stufe | Voraussetzung | Zustand |
|---|---|---|
| 1 | JSON-Schemata, vollständige Metadaten | **umgesetzt** — `Models/traceabilityModels.ts` |
| 2 | Core, Interfaces, Models, Registry | **umgesetzt** — `Core/`, `Interfaces/index.ts`, `Registry/traceabilityRegistry.ts` |
| 3 | Enterprise Event Bus | **teilweise umgesetzt** — jeder Lauf veröffentlicht sechs reale Events über `src/platform/EventMesh/Core/EventBus.ts` (`publishTraceabilityEvent()` in `Services/runTraceability.ts`, best-effort). Nur die Publish-Seite; die fünf `consumes`-Events aus dem Manifest werden nicht abonniert. |
| 4 | Validator-Basisklasse | **umgesetzt** — `Validators/baseValidator.ts` (`abstract class Validator<TTarget, TFinding>`), erste generische Validator-Basis im gesamten Repository. `Validators/traceabilityMatrixValidator.ts` ist die erste konkrete Implementierung und wrappt `Core/orphanDetector.ts`; `Services/runTraceability.ts` nutzt sie jetzt statt `OrphanDetector` direkt zu instanziieren. |

Aufruf: `npm run traceability:build` (`Services/runTraceability.ts`). Baut die Matrix, schreibt
`matrix.json`/`coverage.json`/`orphans.json` unter `.ai/knowledge/traceability/` sowie
`docs/traceability/COVERAGE_REPORT.md`, und führt das `tests`-Feld in allen
Plattform-Manifesten anhand real gefundener Testdateien nach. Kein automatischer Lauf beim
Serverstart — bewusst, siehe AUD2-F-014 (unerwünschte Dokumentmutation bei jedem Start).

**Korrektur zur ursprünglichen Einschätzung:** Die zuvor hier genannte Blockade — ohne
Knowledge Graph und Digital Twin keine Datengrundlage (`GOV-KG-001`, `GOV-TWIN-001`) — traf für
diesen ersten Ausbau nicht zu. Die Achsen ESS↔Component und Component↔Test kommen ohne
Knowledge Graph und Digital Twin aus; sie lesen direkt `.ai/registry/ess-registry.json`,
`docs/adr/adr_history.json`, `src/platform/*/manifest.json` und `tests/`. Die ADR- und
Event-/Interface-Achsen aus Kapitel „Traceability-Achsen" sind noch nicht als geprüfte
Verknüpfung abgebildet (siehe `Core/traceabilityBuilder.ts`, Kommentar am Dateikopf) — dafür
fehlt tatsächlich eine zweite, unabhängige Quelle je Achse.

---

## Notes

Vollständige Dokumentation unter `docs/traceability/`.

Diese Komponente ist die erste im Repository mit vollständigem Metadatensatz einschließlich
`component.yaml` und `CHANGELOG.md`.
