# Traceability Versioning

## Document ID
DOC-ETM-0006
## Version
1.0.0
## Referenz
ESS-0001-CONTRACTS Chapter 9, ESS-0011 Chapter 4

---

# Zweck

Versionierung der Matrix und ihr Beitrag zur Versionsbewertung der Plattform.

---

# Matrixversion

Die Matrix besitzt eine eigene Version.

Sie wird erhöht bei

- neuen Verknüpfungsarten
- neuen Achsen
- strukturellen Änderungen des Matrixmodells
- geänderter Prüfsummenbildung
- vollständigem Neuaufbau

Jeder Matrixstand speichert zusätzlich

```text
Repository Version
Knowledge Version
Architecture Version
Twin Version
```

---

# Beitrag zur Versionsbewertung

Der Version Manager verwendet die ETM als **Regelachse** der Versionsbewertung.

| Feststellung der ETM | Versionsauswirkung |
|---|---|
| Interface entfällt, Verknüpfung `IMPLEMENTS` bricht | Major |
| Event entfällt, Verknüpfung `EMITS` bricht | Major |
| neue Komponente mit vollständiger Verknüpfung | Minor |
| neue Verknüpfung ohne Strukturänderung | Patch |
| Verknüpfung fehlt bei bestehender Regel | blockiert Release |

Die ETM **empfiehlt keine Version**. Sie liefert die Feststellungen, aus denen der Version
Manager die Version ableitet.

---

# Breaking-Change-Erkennung

Ein Breaking Change liegt aus ETM-Sicht vor, wenn eine zuvor bestehende Verknüpfung
entfällt, ohne dass ein Ersatz erzeugt wurde.

Beispiel

```text
Version n    interface:platform/IKnowledgeBuilder ←IMPLEMENTS← component:platform/Knowledge
Version n+1  Verknüpfung fehlt, kein SUPERSEDES vorhanden
             → Breaking Change
```

Ein `SUPERSEDES` auf ein Nachfolgeartefakt verhindert die Einstufung.

---

# Snapshot je Release

Zu jedem Release wird ein Matrixstand gesichert.

Dadurch ist rückwirkend nachvollziehbar, welche Regel zum Releasezeitpunkt durch welches
Artefakt erfüllt war.

---

# End of Document
DOC-ETM-0006
