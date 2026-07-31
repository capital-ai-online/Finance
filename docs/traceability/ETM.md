# Enterprise Traceability Matrix — Übersicht

## Document ID

DOC-ETM-0001

## Version

1.0.0

## Status

Operative Dokumentation

## Referenzen

ESS-0011 — Enterprise Traceability (Spezifikation)

ESS-0011-CONTRACTS — Regelwerk

ADR-0015 — Einführung der Komponente

`src/platform/Traceability/` — Implementierung

---

# Zweck dieses Dokumentensatzes

Die Dokumente unter `docs/traceability/` bilden die **operative Ebene** der ETM.

Sie beschreiben Betrieb, Anwendung und Nachvollzug.

Sie enthalten **keine** Spezifikation und **keine** Regeln.

## Abgrenzung

| Ebene | Ort | Inhalt |
|---|---|---|
| Spezifikation | ESS-0011 | Architektur, Komponenten, Prozesse, Reports, Integration |
| Regelwerk | ESS-0011-CONTRACTS | Link Contract, Coverage, Orphans, Events, Validation |
| **Operative Doku** | **`docs/traceability/`** | **Betrieb, Lifecycle, Anwendung, Nachvollzug** |
| Implementierung | `src/platform/Traceability/` | Code |

Bei Abweichungen gilt ausnahmslos ESS-0011 beziehungsweise ESS-0011-CONTRACTS.

Diese Trennung ist verbindlich, um eine Doppelregelung zu vermeiden — sie entspricht der
Verantwortungsabgrenzung aus `ARCH-RESP-0001` und dem Grundsatz *Zero Duplication* aus
ESS-0001.

---

# Dokumentensatz

| Dokument | Inhalt |
|---|---|
| `ETM.md` | dieses Dokument — Übersicht und Abgrenzung |
| `Traceability-Architecture.md` | Aufbau im Betrieb, Datenflüsse, Quellen |
| `Traceability-Lifecycle.md` | Lebenszyklus eines Matrixeintrags |
| `Traceability-Governance.md` | Zuständigkeiten, Rollentrennung, Eskalation |
| `Traceability-Validation.md` | Prüfungen und Abnahmekriterien |
| `Traceability-Versioning.md` | Versionierung der Matrix |
| `Traceability-Reports.md` | Berichte und ihre Verwendung |

---

# Was die ETM beantwortet

Die ETM beantwortet lückenlos und bidirektional:

> Welche Anforderung, welche Entscheidung, welche Regel führte zu welchem Artefakt —
> und welches Artefakt erfüllt welche Regel?

**Vorwärts**

```text
ESS-Kapitel → ADR → Component → Interface → Event → Test
```

**Rückwärts**

```text
Test → Event → Interface → Component → ADR → ESS-Kapitel
```

---

# Was die ETM nicht tut

Die ETM erzeugt keine Regeln.

Die ETM erzeugt keine Dokumentation.

Die ETM verändert keine Quelle.

Die ETM bewertet nicht.

Die ETM entscheidet nicht.

Sie verknüpft und misst.

---

# Aktueller Stand

Die ETM ist **spezifiziert und strukturell angelegt, nicht implementiert**.

Ein Matrixaufbau ist derzeit nicht möglich, da Knowledge Graph und Digital Twin fehlen —
beide sind Pflichtquellen. Der Versuch würde nach den eigenen Regeln `GOV-KG-001` und
`GOV-TWIN-001` abbrechen.

Der Umsetzungspfad ist in `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`
(Stufen 1 bis 5) festgelegt.

---

# End of Document

DOC-ETM-0001
