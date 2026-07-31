# Traceability Validation

## Document ID
DOC-ETM-0005
## Version
1.0.0
## Referenz
ESS-0011-CONTRACTS Chapter 5, ESS-0001-CONTRACTS Chapter 12

---

# Zweck

Abnahmekriterien und Prüfungen im Betrieb.

Das verbindliche Regelwerk steht in ESS-0011-CONTRACTS und wird hier nicht wiederholt.

---

# Selbstprüfung vor Veröffentlichung

Vor jeder Veröffentlichung der Matrix wird geprüft

✓ sämtliche Verknüpfungen besitzen vollständige Pflichtfelder

✓ sämtliche IDs sind auflösbar

✓ keine Verknüpfung auf nicht existierende Artefakte

✓ keine Assumed-Verknüpfungen

✓ keine doppelten Verknüpfungen

✓ sämtliche Verknüpfungen bidirektional auflösbar

✓ Prüfsumme reproduzierbar

✓ Abdeckungsgrade berechnet

✓ Orphans klassifiziert

Schlägt eine Prüfung fehl, wird die Matrix nicht veröffentlicht.

---

# Abnahmekriterien der Komponente

Die Komponente gilt als abgenommen, wenn

| Kriterium | Nachweis |
|---|---|
| Matrix reproduzierbar | zwei Läufe, identische Prüfsumme |
| Bidirektionalität | Stichprobe je Achse in beide Richtungen |
| Nachweispflicht | kein Eintrag ohne `origin` |
| Determinismus | identischer Eingangszustand, identische Ausgabe |
| Read-Only | keine Schreibzugriffe außerhalb `.ai/knowledge/traceability/` |
| Event-Vollständigkeit | jeder Lauf erzeugt Start- und Abschluss-Event |

---

# Prüfung durch Dritte

Die Matrix wird zusätzlich geprüft durch

| Instanz | Prüfung |
|---|---|
| Governance Validator (ESS-0012) | `GOV-TRACE-001` bis `GOV-TRACE-004` |
| Supervisor (ESS-0002) | Vollständigkeit, Aktualität |
| Contract Tests (Chapter 12) | Schema der Matrixdateien |

Die ETM prüft sich selbst — sie ist damit nicht von der Fremdprüfung befreit.

---

# Umgang mit Nichtprüfbarkeit

Fehlt eine Pflichtquelle, meldet die ETM **Nichtprüfbarkeit**, nicht einen Negativbefund.

Der Unterschied ist wesentlich: Eine fehlende Quelle bedeutet nicht, dass eine Beziehung
nicht existiert — sie bedeutet, dass sie nicht festgestellt werden kann.

---

# End of Document
DOC-ETM-0005
