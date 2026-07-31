# Traceability Governance

## Document ID
DOC-ETM-0004
## Version
1.0.0
## Referenz
ESS-0011 Chapter 6, ESS-0002, ESS-0003, ARCH-RESP-0001

---

# Zweck

Zuständigkeiten und Eskalationswege im Betrieb der ETM.

---

# Rollentrennung

| Instanz | Rolle | Darf nicht |
|---|---|---|
| **ETM** | verknüpft und misst | bewerten, entscheiden, Quellen ändern |
| Governance Validator | prüft Regeln | verknüpfen, entscheiden |
| Supervisor | bewertet, eskaliert | entscheiden, dokumentieren |
| Platform Director | entscheidet | implementieren |
| Version Manager | leitet Version ab | entscheiden über Freigabe |

Diese Trennung ist die tragende Governance-Aussage der ETM: Eine Instanz, die misst,
darf nicht zugleich bewerten — sonst ist die Messung nicht mehr unabhängig.

---

# Eskalationsweg

```text
Orphan oder Coverage-Unterschreitung
    ↓
Befund mit Nachweis
    ↓
Supervisor (ESS-0002) bewertet
    ↓
bei Critical: Blockade der Freigabe
    ↓
Platform Director (ESS-0003) entscheidet
    ↓
Ausnahme nur mit ADR
```

Die ETM selbst blockiert niemals.

---

# Zuständigkeiten

| Gegenstand | Verantwortlich |
|---|---|
| Matrixaufbau | Traceability-Komponente |
| Regelwerk | ESS-0011-CONTRACTS |
| Schwellwerte | ESS-0011-CONTRACTS Chapter 2 |
| Befundbewertung | Supervisor |
| Ausnahmen | Platform Director, ausschließlich per ADR |
| Berichtserzeugung | Documentary Engine |

---

# AI-Verbindlichkeit

Sämtliche KI-Systeme verwenden **dieselbe zentrale ETM**.

Nicht zulässig sind

- eigene Traceability-Modelle
- lokale Matrixkopien
- abweichende Verknüpfungsarten
- Verknüpfungen ohne Nachweis

Ein KI-System, das Beziehungen benötigt, fragt die ETM ab.

---

# End of Document
DOC-ETM-0004
