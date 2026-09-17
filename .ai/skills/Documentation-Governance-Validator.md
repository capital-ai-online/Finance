---
skill:
  id: SKILL-GOV-0001
  name: Documentation Governance Validator
  version: 1.0.0
  status: Enterprise Approved
  maturity: Gold Standard
  owner: Documentary Engine
  category: Enterprise Governance
  priority: High

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  architecture: Enterprise
  lifecycle: AI Native Development Lifecycle

classification:
  type: Operational Skill
  role: Handlungsanweisung für KI-Systeme zur Governance-Prüfung
  specification: ESS-0012
  contractAuthority: ESS-0012-CONTRACTS
  note: >
    Dieser Skill ist kein ESS-Dokument und belegt keine ESS-Nummer. Er beschreibt
    ausschliesslich die Anwendung des in ESS-0012 spezifizierten Validators.
    Bei Abweichungen gelten ESS-0012 und ESS-0012-CONTRACTS.

authority:

  controls:
    - Governance-Prüflauf
    - Befunderzeugung
    - Berichtsanforderung

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Dokumentation
    - Knowledge Graph
    - Digital Twin
    - Registry

crossReference:
  dependsOn:
    - ESS-0012
    - ESS-0012-CONTRACTS
  relatedEss:
    - ESS-0001-CONTRACTS
    - ESS-0002
    - ESS-0003
    - ESS-0010
    - ESS-0011
  relatedAdr:
    - ADR-0014
  relatedComponents:
    - src/platform/Documentary/Governance
  relatedSkills:
    - .ai/skills/ESS-0012-Documentation-Governance.md
    - .ai/skills/ESS-0012-Contracts.md

created: 2026-07-31
---

# Documentation Governance Validator

## Zweck dieses Skills

Dieser Skill beschreibt, **wie** ein KI-System den Documentation Governance Validator anwendet.

Er ersetzt keine Spezifikation. Die verbindlichen Regeln stehen in

ESS-0012 — Spezifikation

ESS-0012-CONTRACTS — Regelwerk, Scoring, Events

Bei jeder Abweichung zwischen diesem Skill und den ESS-Dokumenten gelten die ESS-Dokumente.

---

# Grundregel

> Der Validator stellt fest. Er entscheidet nicht. Er korrigiert nicht.

Ein KI-System, das eine Änderung vornimmt, prüft sie **vor** der Übergabe an die nächste
Stufe der Wertschöpfungskette.

Ein KI-System behebt einen Befund niemals im selben Arbeitsschritt, in dem es ihn erzeugt hat,
ohne die Korrektur erneut zu prüfen.

---

# Aufgaben

| Aufgabe | Beschreibung |
|---|---|
| Prüflauf ausführen | Neun Prüfbereiche gemäß ESS-0012 Chapter 3 |
| Befunde erzeugen | jeweils mit Regel-ID, Severity und Nachweis |
| Kennzahlen berechnen | Governance Score, Repository Health, Documentation Quality |
| Berichte anfordern | zehn Berichte gemäß ESS-0012 Chapter 5 |
| Events veröffentlichen | sechs Events gemäß ESS-0012-CONTRACTS Chapter 4 |
| Supervisor informieren | bei Severity Critical und High |

---

# Trigger

Der Skill wird verbindlich angewendet bei

| Auslöser | Umfang |
|---|---|
| vor jeder Übergabe an die nächste Stufe der Wertschöpfungskette | inkrementell |
| nach jeder Dokumentenerzeugung | inkrementell |
| nach jeder Metadatenänderung | inkrementell |
| bei ESS-Änderung | vollständig |
| bei ADR-Änderung | vollständig |
| bei Versionsänderung | vollständig |
| vor jeder Release-Vorbereitung | vollständig |
| bei zeitgesteuerter Vollprüfung | vollständig |

Vor jeder Produktionsfreigabe ist ein vollständiger Durchlauf verbindlich.

---

# Validierungsregeln

Das vollständige Regelwerk umfasst **57 Regeln in neun Bereichen** und steht in
ESS-0012-CONTRACTS Chapter 2.

Übersicht der Bereiche:

| Kürzel | Bereich | Regeln |
|---|---|---|
| `GOV-ESS-*` | ESS-Konsistenz | 8 |
| `GOV-ADR-*` | ADR-Konsistenz | 8 |
| `GOV-REPO-*` | Repository-Metadaten | 9 |
| `GOV-CONTRACT-*` | Contract-Konsistenz | 6 |
| `GOV-DOC-*` | Dokumentationsqualität | 7 |
| `GOV-TRACE-*` | Traceability | 4 |
| `GOV-KG-*` | Knowledge Graph | 5 |
| `GOV-TWIN-*` | Digital Twin | 5 |
| `GOV-VER-*` | Versionierung | 5 |

Die Regeln werden in diesem Skill **nicht wiederholt**. Er verweist ausschließlich.

---

# Anwendungsreihenfolge

```text
1. Regelwerk aus ESS-0012-CONTRACTS laden
2. Prüfbereiche in fester Reihenfolge ausführen
3. Befunde mit Nachweis sammeln
4. Kennzahlen berechnen
5. Berichte anfordern
6. Events veröffentlichen
7. Bei Critical: Supervisor informieren und anhalten
```

Die Reihenfolge ist verbindlich und darf nicht verändert werden.

---

# Nachweispflicht

Jeder Befund führt verbindlich einen Nachweis gemäß ESS-0012-CONTRACTS Chapter 1.

Zulässig sind

`FileReference`, `RegistryEntry`, `KnowledgeNode`, `TwinDelta`, `MatrixLink`, `VersionValue`

**Nicht zulässig** ist ein Befund, der ausschließlich auf einer Vermutung beruht.

Findet ein KI-System keinen Nachweis, meldet es keinen Befund — es meldet die
Nichtprüfbarkeit.

---

# Reports

Zehn Berichte gemäß ESS-0012 Chapter 5:

Documentation Health · Governance · ESS Coverage · ADR Coverage · Traceability ·
Repository Health · Digital Twin · Knowledge Graph · Contract · Architecture Compliance

Ablage: `docs/quality/`

Die physische Erzeugung erfolgt durch die Documentary Engine. Der Validator liefert die Daten.

---

# ETM-Integration

Der Validator **verwendet** die Traceability Matrix aus ESS-0011.

Er erzeugt sie nicht und verändert sie nicht.

Fehlt die Matrix, gilt `GOV-TRACE-001` (Severity High) und der Traceability-Prüfbereich wird
ausgesetzt — er wird niemals übersprungen ohne Befund.

Coverage-Schwellwerte und Orphan-Klassen stehen ausschließlich in ESS-0011-CONTRACTS.

---

# Documentary-Integration

Der Validator ist Bestandteil der Documentary Engine (ESS-0010) und läuft **nach** ihr.

Er verwendet:

Knowledge Graph · Enterprise Registry · Digital Twin · erzeugte Dokumentation

Er schreibt in keine dieser Quellen zurück.

---

# Versionierungsregeln

Der Version Manager leitet aus den Befunden ab:

| Befundklasse | Versionsauswirkung |
|---|---|
| Breaking Change ohne ADR | blockiert Release |
| Contract-Widerspruch | Major |
| neue Regel oder Komponente | Minor |
| Dokumentationslücke | Patch |

Der Validator empfiehlt keine Version. Er liefert die Befunde, aus denen der Version Manager
sie ableitet.

---

# Pflichten je KI-System

| System | Pflicht |
|---|---|
| **Claude Code** | prüft Implementierung und Repository-Änderungen vor Übergabe an die Documentary Engine |
| **Google AI Studio** | prüft Entwürfe vor Übergabe an Claude Code |
| **ChatGPT** | prüft Architektur- und Governance-Vorschläge vor Aufnahme in ESS oder ADR |
| **Future Enterprise AI** | identische Pflicht nach Governance-Prüfung |

Verbindlich für alle:

✗ keine eigenen Prüfregeln

✗ keine Deaktivierung von Regeln

✗ keine Änderung von Schweregraden

✗ keine Prüfergebnisse ohne Ausführung

✗ kein Schließen eines Befundes ohne Korrektur

✗ keine Selbstfreigabe bei Critical-Befunden

---

# Abbruchbedingungen

Der Prüflauf bricht ab bei

fehlendem Regelwerk

nicht lesbarem Repository

fehlendem Knowledge Graph (`GOV-KG-001`, Critical)

fehlendem Digital Twin (`GOV-TWIN-001`, Critical)

nicht reproduzierbarem Ergebnis

Jeder Abbruch erzeugt ein Fehler-Event und wird dem Supervisor gemeldet.

---

# Aktueller Anwendungsstand

Dieser Skill ist **spezifiziert, nicht ausführbar**.

Die Ausführung setzt die Umsetzungsstufen 1 bis 4 aus
`docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md` voraus — insbesondere den Enterprise
Event Bus und die Validator-Basisklasse.

Bis dahin wenden KI-Systeme die Regeln aus ESS-0012-CONTRACTS **manuell** an und
dokumentieren das Ergebnis im jeweiligen Arbeitsergebnis.

Eine manuelle Anwendung ersetzt keine automatisierte Prüfung und ist als solche zu
kennzeichnen.

---

# Related Documents

ESS-0012 — Documentation Governance

ESS-0012-CONTRACTS — Documentation Governance Contracts

ESS-0010 — Documentary Engine

ESS-0011 — Enterprise Traceability

ESS-0001-CONTRACTS — Chapter 8, Chapter 9, Chapter 12, Chapter 15, Chapter 18

ADR-0014 — Documentation Governance Validator

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Fassung des Governance-Skills |

---

# End of Document

SKILL-GOV-0001

CAPITAL-AI Documentation Governance Validator

Version 1.0.0
