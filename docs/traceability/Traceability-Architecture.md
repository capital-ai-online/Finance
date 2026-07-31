# Traceability Architecture — Betriebssicht

## Document ID
DOC-ETM-0002
## Version
1.0.0
## Referenz
ESS-0011 Chapter 2 und Chapter 3 (verbindliche Spezifikation)

---

# Zweck

Dieses Dokument beschreibt die ETM aus **Betriebssicht**: welche Daten woher kommen, in
welcher Reihenfolge sie verarbeitet werden und was bei fehlenden Quellen geschieht.

Die verbindliche Architekturdefinition steht in ESS-0011 Chapter 2 und wird hier nicht
wiederholt.

---

# Datenfluss im Betrieb

```text
Repository
    ↓
Documentary Engine (ESS-0010)
    ↓
Knowledge Graph  ──┐
Enterprise Registry ├──→ TraceabilityBuilder
Digital Twin      ──┤
ESS Registry      ──┤
Exception Registry──┤
docs/adr/         ──┤
Validierungsergebnisse ─┘
    ↓
Matrix (.ai/knowledge/traceability/matrix.json)
    ↓
CoverageAnalyzer → coverage.json
OrphanDetector   → orphans.json
    ↓
TraceabilityReporter → docs/quality/
```

Die ETM läuft ausschließlich **nach** der Documentary Engine.

---

# Pflichtquellen

| Quelle | Fehlt sie, dann |
|---|---|
| Knowledge Graph | Abbruch — keine Knotenidentität auflösbar |
| Enterprise Registry | Abbruch — keine Artefaktexistenz prüfbar |
| Digital Twin | Abbruch — kein Ist-Zustand vergleichbar |
| ESS Registry | ESS-Achse wird ausgesetzt, Befund |
| Exception Registry | EXEMPTS-Verknüpfungen fehlen, Befund |
| `docs/adr/` | ADR-Achse wird ausgesetzt, Befund |
| Validierungsergebnisse | Test-Achse wird ausgesetzt, Befund |

Ein ausgesetzter Bereich wird **niemals stillschweigend übersprungen** — er erzeugt immer
einen Befund.

---

# Verzeichniszuordnung

| Verzeichnis | Betriebliche Aufgabe |
|---|---|
| `Core/` | Matrixmodell, Identitätsauflösung |
| `Discovery/` | Erkennung verknüpfbarer Artefakte |
| `Services/` | Ablaufsteuerung eines Matrixlaufs |
| `Registry/` | Persistenz der Matrixeinträge |
| `Validators/` | Selbstprüfung der Matrix |
| `Reports/` | Aufbereitung der Berichtsdaten |
| `Events/` | Veröffentlichung der Lauf-Events |
| `Versioning/` | Matrixversion und Prüfsummen |
| `Models/`, `Interfaces/`, `Contracts/` | Datenmodelle, Schnittstellen, Verträge |

---

# Determinismus im Betrieb

Bei identischem Eingangszustand erzeugt ein Matrixlauf eine **byteidentische** Matrix.

Zeitstempel sind von der Prüfsummenbildung ausgenommen.

Weicht die Prüfsumme bei unverändertem Eingangszustand ab, gilt der Lauf als fehlerhaft und
die Ergebnisse werden verworfen.

---

# End of Document
DOC-ETM-0002
