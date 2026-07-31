# Traceability Lifecycle

## Document ID
DOC-ETM-0003
## Version
1.0.0
## Referenz
ESS-0011 Chapter 4 (verbindliche Spezifikation)

---

# Zweck

Lebenszyklus eines Matrixeintrags im Betrieb.

Die verbindlichen Trigger und Workflows stehen in ESS-0011 Chapter 4.

---

# Lebenszyklus einer Verknüpfung

```text
Erkennung        Artefakt wird in einer Pflichtquelle gefunden
    ↓
Ableitung        Beziehung wird aus Quelle abgeleitet
    ↓
Nachweis         Ursprung wird zugeordnet
    ↓
Bewertung        Vertrauenswert Verified oder Derived
    ↓
Aufnahme         Eintrag in die Matrix
    ↓
Prüfung          Bidirektionale Auflösbarkeit
    ↓
Gültig           Eintrag ist Bestandteil der Matrix
    ↓
Verwaisung       Endpunkt entfällt → Orphan-Befund
    ↓
Entfernung       Eintrag wird beim nächsten Lauf nicht neu erzeugt
```

Ein Eintrag mit Vertrauenswert `Assumed` wird **niemals** aufgenommen.

---

# Auslöser eines Matrixlaufs

| Ereignis | Umfang |
|---|---|
| `KnowledgeUpdatedEvent` | inkrementell |
| `TwinSynchronizedEvent` | inkrementell |
| `ComponentRegisteredEvent` | inkrementell |
| `ExceptionRegisteredEvent` | inkrementell |
| ADR-Änderung | vollständig |
| ESS-Änderung | vollständig |
| `ReleasePreparedEvent` | vollständig |

Vor jeder Produktionsfreigabe erfolgt ein vollständiger Lauf.

---

# Inkrementell gegen vollständig

Ein inkrementeller Lauf verarbeitet ausschließlich den geänderten Umfang und dessen
Abhängigkeiten laut Knowledge Graph.

Er muss dasselbe Ergebnis liefern wie ein vollständiger Lauf, beschränkt auf den betroffenen
Teilgraphen.

Weicht das Ergebnis ab, gilt der inkrementelle Lauf als fehlerhaft.

---

# Umgang mit Orphans

Ein Orphan wird nicht automatisch entfernt.

Er erzeugt einen Befund und bleibt bis zur Behebung sichtbar.

Orphans der Stufe Critical blockieren Produktionsfreigaben.

---

# End of Document
DOC-ETM-0003
