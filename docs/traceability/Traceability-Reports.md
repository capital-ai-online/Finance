# Traceability Reports

## Document ID
DOC-ETM-0007
## Version
1.0.0
## Referenz
ESS-0011 Chapter 5

---

# Zweck

Verwendung der ETM-Berichte im Betrieb.

Die verbindliche Berichtsdefinition steht in ESS-0011 Chapter 5.

---

# Berichte und ihre Adressaten

| Bericht | Adressat | Beantwortet |
|---|---|---|
| Architecture Traceability Report | Platform Director | Ist die Architektur durchgängig belegt? |
| ESS Coverage Report | Platform Director | Welche Regeln sind nicht umgesetzt? |
| ADR Coverage Report | Platform Director | Welche Entscheidungen sind ohne Wirkung? |
| Component Coverage Report | Supervisor | Welche Komponenten sind unbelegt? |
| Documentation Coverage Report | Documentary Engine | Welche Artefakte sind undokumentiert? |
| Test Coverage Report | Quality Center | Welche Komponenten sind ungetestet? |
| Version Coverage Report | Version Manager | Welche Änderungen sind unversioniert? |
| Governance Report | Supervisor | Welche Governance-Lücken bestehen? |
| Enterprise Readiness Report | Platform Director | Ist eine Freigabe vertretbar? |

---

# Erzeugung

Die ETM liefert **Daten**, nicht Dokumente.

Die physische Erzeugung erfolgt durch die Documentary Engine gemäß ESS-0010.

Ablage: `docs/quality/`

Sämtliche Berichte tragen die Kennzeichnung als generiert gemäß ESS-0001-CONTRACTS
Chapter 19.

---

# Enterprise Readiness Report

Der aussagekräftigste Bericht. Er fasst zusammen

- Abdeckungsgrad je Achse
- offene Orphans nach Schweregrad
- Breaking Changes ohne `SUPERSEDES`
- fehlende Testverknüpfungen
- Matrixversion und Prüfsumme

Er ist die Entscheidungsgrundlage des Platform Director vor einer Produktionsfreigabe.

---

# Interpretationshinweis

Ein hoher Abdeckungsgrad bedeutet **nicht**, dass die Umsetzung korrekt ist.

Er bedeutet ausschließlich, dass eine Beziehung nachweisbar existiert.

Die inhaltliche Korrektheit prüfen Tests, nicht die ETM.

---

# End of Document
DOC-ETM-0007
