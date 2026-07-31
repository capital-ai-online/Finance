# ADR-0015: Einführung der Traceability-Komponente als Plattformmodul

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — Komponentenstruktur, vollständiger Metadatensatz und operative
Dokumentation sind angelegt. Die **Implementierung** ist nicht begonnen und setzt die
Umsetzungsstufen 1 bis 5 aus `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus —
insbesondere Knowledge Graph und Digital Twin, die Pflichtquellen der Matrix sind.

## Datum

2026-07-31

## Verantwortlich

Platform Director

## Betroffene Artefakte

`src/platform/Traceability/` (neu, 11 Unterverzeichnisse)

`docs/traceability/` (neu, 7 Dokumente)

`.ai/registry/ess-registry.json` (fortgeschrieben)

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` (erweitert)

---

## Kontext

ESS-0011 und ESS-0011-CONTRACTS spezifizieren die Enterprise Traceability Matrix seit
ADR-0013 vollständig. Es fehlt jedoch der **Ort** ihrer Umsetzung: Die Spezifikation nennt
`src/platform/Registry`, `Knowledge` und `Architecture` als verwandte Komponenten, ohne eine
eigene Komponente zu definieren.

Ohne eigene Komponente müsste die Matrixlogik auf drei bestehende Module verteilt werden.
Das verstößt gegen ESS-0001-CONTRACTS Chapter 3 (*eine Verantwortung, genau ein
Verzeichnis*) und würde die Zuständigkeit für die Matrix dauerhaft unklar lassen.

Zusätzlich fordert Chapter 2 für jedes neue Plattformmodul einen ADR.

---

## Entscheidung

### 1. Traceability wird eigenständiges Plattformmodul

```text
src/platform/Traceability/
  Contracts/  Core/       Discovery/  Events/
  Interfaces/ Models/     Registry/   Reports/
  Services/   Validators/ Versioning/
```

Die Struktur folgt der in der Aufgabenstellung geforderten Aufteilung. Jedes Unterverzeichnis
besitzt genau eine Verantwortung gemäß Chapter 3.

### 2. Einordnung als Querschnittsmodul mit erweitertem Zugriff

Die ETM benötigt Zugriff auf Core, Shared, Registry, Knowledge, Discovery und Documentary —
mehr als Chapter 16 für gewöhnliche Querschnittsmodule zulässt (nur Core und Shared).

Chapter 16 kennt für genau diesen Fall bereits eine Regelung: **Release** besitzt erweiterten
Zugriff, „da es deren Ergebnisse zusammenführt". Die ETM ist derselbe Fall.

Sie wird daher analog eingeordnet. **Die Layer-Hierarchie aus Chapter 6 bleibt unverändert**;
es wird keine neue Ebene eingeführt.

Verboten bleiben Abhängigkeiten auf Supervisor und Platform Director — die Kommunikation nach
oben erfolgt ausschließlich über Enterprise Events.

### 3. Vollständiger Metadatensatz als Referenzimplementierung

Die Komponente führt als **erste im Repository**

| Datei | Regel |
|---|---|
| `manifest.json` mit allen Chapter-7-Feldern | `GOV-REPO-007` |
| `component.yaml` | `GOV-REPO-004` |
| `CHANGELOG.md` | `GOV-REPO-002` |
| `README.md` mit belegtem Inhalt | `GOV-REPO-006` |
| fachlicher Owner statt Pauschalwert | `GOV-REPO-005` |

Damit existiert erstmals ein Muster für die Nachpflege der 23 Bestandskomponenten
(GAP-013, GAP-014, GAP-015).

### 4. `docs/traceability/` als operative Ebene — bewusst ohne Spezifikationsinhalt

Die sieben Dokumente beschreiben **Betrieb, Anwendung und Nachvollzug**. Sie enthalten
ausdrücklich **keine** Spezifikation und **keine** Regeln.

| Ebene | Ort |
|---|---|
| Spezifikation | ESS-0011 |
| Regelwerk | ESS-0011-CONTRACTS |
| operative Doku | `docs/traceability/` |
| Implementierung | `src/platform/Traceability/` |

**Begründung.** Ohne diese Trennung wäre `docs/traceability/` ein Duplikat von ESS-0011 und
verstieße gegen *Zero Duplication* (ESS-0001) sowie gegen die eigene Regel `GOV-ESS-004`.
Jedes der sieben Dokumente verweist deshalb auf das zuständige ESS-Kapitel, statt es zu
wiederholen.

### 5. Kein neues ESS-Dokument

ESS-0011 und ESS-0011-CONTRACTS existieren bereits und decken den Regelbedarf vollständig ab.

Die Aufgabenstellung forderte ihre Erstellung — sie waren zum Zeitpunkt der Anforderung
jedoch bereits mit ADR-0013 angelegt. Eine erneute Anlage wäre ein Duplikat gewesen.

---

## Alternativen

**A) Matrixlogik auf Registry, Knowledge und Architecture verteilen.**
Verworfen. Verstößt gegen Chapter 3. Die Zuständigkeit für die Matrix wäre dauerhaft
unklar, und eine Änderung am Matrixmodell würde drei Komponenten gleichzeitig berühren.

**B) Traceability als Unterkomponente von Documentary (analog Governance).**
Verworfen. Die ETM verknüpft auch Artefakte, die außerhalb der Documentary Engine entstehen
— ADRs, Exceptions, Tests, Releases. Eine Unterordnung hätte ihre Reichweite künstlich
begrenzt. Der Governance Validator prüft Dokumentation und gehört deshalb unter Documentary;
die ETM verknüpft die gesamte Plattform.

**C) Neue Layer-Ebene für Traceability einführen.**
Verworfen. Chapter 6 definiert die Hierarchie abschließend. Eine neue Ebene wäre eine
Änderung am Master Enterprise Standard, obwohl Chapter 16 mit der Release-Regelung bereits
eine passende Einordnung bereithält.

**D) `docs/traceability/` mit Spezifikationsinhalt füllen.**
Verworfen. Duplikat zu ESS-0011.

---

## Konsequenzen

### Positiv

- Die ETM besitzt einen eindeutigen Ort und eine eindeutige Zuständigkeit.
- Erste Komponente mit vollständigem Metadatensatz — Referenz für 23 Bestandskomponenten.
- Erste `component.yaml` und erste `CHANGELOG.md` im Repository; zwei Befundklassen aus
  ESS-0012-CONTRACTS sind damit erstmals an einer Komponente erfüllt.
- Die Trennung Spezifikation / operative Doku / Implementierung ist erstmals an einem
  konkreten Beispiel durchgezogen.

### Negativ / Aufwand

- Ein weiteres Plattformmodul ohne Implementierung. Die Zahl der Komponenten steigt auf 24,
  die Zahl der implementierten bleibt bei 0.
- Die ETM kann erst nach Knowledge Graph und Digital Twin (Stufe 5) überhaupt laufen — sie
  ist damit die Komponente mit der längsten Vorlaufkette.
- `docs/traceability/` erhöht die Dokumentationsmenge um sieben Dateien, die bis zur
  Implementierung ausschließlich beschreibenden Charakter haben.

### Neutral

- Kein produktiver Code verändert.
- Kein bestehendes ESS- oder ADR-Dokument verändert.
- Layer-Hierarchie unverändert.

---

## Folgeentscheidungen

1. Implementierung (Stufen 1 bis 5).
2. Nachpflege der 23 Bestandskomponenten nach dem hier etablierten Metadatenmuster.
3. Aktivierung der Coverage-Schwellwerte aus ESS-0011-CONTRACTS Chapter 2 — erst sinnvoll,
   wenn die Matrix aufgebaut werden kann.

---

## Referenzen

- ESS-0011 — Enterprise Traceability
- ESS-0011-CONTRACTS — Link Contract, Coverage, Orphans
- ESS-0001-CONTRACTS — Chapter 2, 3, 6, 7, 9, 12, 16, 19
- ESS-0012-CONTRACTS — `GOV-REPO-002`, `GOV-REPO-004` bis `GOV-REPO-007`, `GOV-TRACE-*`
- ADR-0013 — ESS Documentation Responsibility Consolidation
- ADR-0014 — Documentation Governance Validator
- `docs/traceability/` — operative Dokumentation
- `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` — Umsetzungsstufen
