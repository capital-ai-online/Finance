---
skill:
  id: ESS-0012
  name: Documentation Governance
  version: 1.0.0
  status: Enterprise Approved
  maturity: Gold Standard
  owner: Platform Director
  category: Enterprise Architecture
  priority: High

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  architecture: Enterprise
  lifecycle: AI Native Development Lifecycle

classification:
  type: Technical Specification
  role: Spezifikation des Documentation Governance Validator
  contractAuthority: ESS-0001-CONTRACTS
  ownContracts: ESS-0012-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschliesslich die Governance-Pruefung der
    Dokumentation. Validator-Grundregeln verbleiben in ESS-0001-CONTRACTS
    Chapter 12, Traceability in ESS-0011, Twin-Regeln in Chapter 18.

authority:

  controls:
    - Documentation Governance Validation
    - Governance Findings
    - Governance Reports
    - Repository Health Score

  collaborates:
    - Documentary Engine
    - Enterprise Traceability
    - Supervisor
    - Platform Director
    - Version Manager
    - Quality Center

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Knowledge Graph
    - Digital Twin
    - Registry
    - Dokumentation

crossReference:
  dependsOn:
    - ESS-0001-CONTRACTS
    - ESS-0010
  relatedEss:
    - ESS-0001
    - ESS-0002
    - ESS-0003
    - ESS-0011
    - ESS-0011-CONTRACTS
    - ESS-0012-CONTRACTS
  relatedAdr:
    - ADR-0010
    - ADR-0013
    - ADR-0014
  relatedComponents:
    - src/platform/Documentary/Governance
    - src/platform/Documentary
    - src/platform/Knowledge
    - src/platform/Registry
    - src/platform/Quality
  relatedSkills:
    - .ai/skills/ESS-0010-Documentary-Engine.md
    - .ai/skills/ESS-0011-Enterprise-Traceability.md
    - .ai/skills/Documentation-Governance-Validator.md

created: 2026-07-31
---

# Documentation Governance

## Enterprise Purpose

Dieses Dokument spezifiziert den **Documentation Governance Validator** — die Prüfinstanz der
Documentary Engine.

Die Plattform beschreibt sich seit ESS-0010 selbst und verknüpft sich seit ESS-0011
nachvollziehbar. Sie prüft sich bislang jedoch nicht selbst.

Der Governance Validator schließt diese Lücke: Er überprüft sämtliche Dokumentation, Regeln,
Metadaten und Beziehungen automatisch auf Konsistenz, Vollständigkeit und
Governance-Konformität.

Er erzeugt ausschließlich Befunde und Berichte.

Er trifft keine Entscheidungen.

Er verändert keine Dokumentation.

Er behebt keine Verstöße.

---

# Notwendigkeitsnachweis

Vor Anlage dieses Dokumentes wurde gemäß der Prüfliste aus `ARCH-RESP-0001` geprüft, ob der
Regelbereich bereits abgedeckt ist.

| Bereich | Bestehende Regelung | Deckt Governance-Prüfung ab? |
|---|---|---|
| Validator-Grundregeln, Severity, Quality Gates | ESS-0001-CONTRACTS Chapter 12 | teilweise — definiert 16 strukturelle Validatoren, keine dokumentübergreifende Governance-Prüfung |
| Traceability, Coverage, Orphans | ESS-0011-CONTRACTS | nein — prüft Verknüpfungen, nicht Regelwidersprüche |
| Twin-Zustände, Drift | ESS-0001-CONTRACTS Chapter 18 | nein — prüft Synchronität, nicht Dokumentationsqualität |
| Knowledge-Node-Regeln | ESS-0001-CONTRACTS Chapter 15 | nein — prüft Graphkonsistenz, nicht ESS-/ADR-Semantik |
| Metadaten-Pflichtfelder | ESS-0001-CONTRACTS Chapter 7 | teilweise — prüft Existenz, nicht Widerspruchsfreiheit |
| Dokumentverantwortung | `ARCH-RESP-0001` | nein — Zuordnung ohne ausführbare Prüfung |

**Ergebnis**

Nicht abgedeckt sind ausschließlich die **semantischen, dokumentübergreifenden**
Governance-Prüfungen:

- doppelte und widersprüchliche ESS-Regeln
- widersprüchliche und veraltete ADRs
- doppelte, widersprüchliche und nicht referenzierte Contracts
- Breaking Changes ohne ADR
- aggregierte Governance- und Repository-Reife

Ein eigenes Dokument ist damit gerechtfertigt und kein Duplikat.

---

# Abgrenzung

Dieses Dokument enthält **nicht**:

| Inhalt | Zuständiges Dokument |
|---|---|
| Validator-Basisvertrag, Severity-Stufen, Quality Gates | ESS-0001-CONTRACTS Chapter 12 |
| Coverage-Schwellwerte, Orphan-Klassen | ESS-0011-CONTRACTS |
| Twin-Zustände, Drift-Toleranz, Reconciliation | ESS-0001-CONTRACTS Chapter 18 |
| Knoten- und Beziehungsregeln | ESS-0001-CONTRACTS Chapter 15 |
| Metadaten-Pflichtfelder | ESS-0001-CONTRACTS Chapter 7 |
| Event-Namenskonvention, Event-Vertrag | ESS-0001-CONTRACTS Chapter 8 |
| globale Repository-, Naming-, Layer-, Governance-Regeln | ESS-0001-CONTRACTS |

Diese Regeln werden referenziert, niemals wiederholt.

---

# Enterprise Principle

Eine Regel, die nicht geprüft wird, ist eine Empfehlung.

Der Validator stellt fest.

Der Supervisor bewertet.

Der Platform Director entscheidet.

Der Validator korrigiert niemals selbst — eine Prüfinstanz, die den Prüfgegenstand verändert,
kann ihn nicht mehr unabhängig beurteilen.

---

# Position in der Architektur

Der Governance Validator ist Bestandteil der Documentary Engine und damit des Documentary
Layer.

```text
src/platform/Documentary/Governance/
```

Zulässige Abhängigkeiten: Core, Shared, Registry, Discovery, Knowledge.

Unzulässig: Version Manager, Supervisor, Platform Director.

Die Kommunikation nach oben erfolgt ausschließlich über Enterprise Events.

---

# End of Chapter 1

---

# Chapter 2

# Komponentenarchitektur

## Enterprise Purpose

Dieses Kapitel definiert den inneren Aufbau des Governance Validator.

---

# Verzeichnisstruktur

```text
src/platform/Documentary/Governance/

Contracts/     komponentenspezifische Contracts
Validators/    Einzelvalidatoren je Prüfbereich
Rules/         deklaratives Regelwerk
Services/      Ausführung und Orchestrierung
Reports/       Berichtserzeugung
Events/        Event-Erzeugung und -Konsum
Models/        Datenmodelle
Interfaces/    öffentliche Schnittstellen
```

Jedes Unterverzeichnis besitzt genau eine Verantwortung gemäß Chapter 3.

---

# Kernkomponenten

## GovernanceEngine

Ausführungssteuerung.

Verantwortung

Reihenfolge der Prüfbereiche

Regelauswahl

Ergebniszusammenführung

Event-Erzeugung

---

## RuleRegistry

Verwaltung des Regelwerks.

Verantwortung

Registrierung der Regeln

Versionierung der Regeln

Auflösung von Regelabhängigkeiten

---

## GovernanceValidators

Neun Einzelvalidatoren je Prüfbereich, siehe Chapter 3.

---

## FindingCollector

Sammlung und Klassifizierung der Befunde.

Verantwortung

Befunderzeugung

Schweregradzuordnung

Deduplizierung

Nachweisführung

---

## ScoreCalculator

Berechnung der Reifekennzahlen.

Verantwortung

Governance Score

Repository Health Score

Dokumentationsqualität

Die Berechnung ist deterministisch und wird niemals manuell gesetzt.

---

## GovernanceReporter

Erzeugung der zehn Berichte gemäß Chapter 5.

---

# Ablaufreihenfolge

```text
GovernanceEngine
        │
        ├─→ RuleRegistry           Regelwerk laden
        │
        ├─→ GovernanceValidators   neun Prüfbereiche
        │
        ├─→ FindingCollector       Befunde sammeln
        │
        ├─→ ScoreCalculator        Kennzahlen berechnen
        │
        └─→ GovernanceReporter     Berichte erzeugen
```

Die Reihenfolge ist verbindlich und deterministisch.

---

# End of Chapter 2

---

# Chapter 3

# Prüfbereiche

## Enterprise Purpose

Dieses Kapitel definiert die neun verbindlichen Prüfbereiche.

Die konkreten Regeln, Schweregrade und Bezeichner stehen in ESS-0012-CONTRACTS.

---

# 3.1 EssValidator

Prüft

doppelte ESS-Regeln über Dokumentgrenzen hinweg

fehlende ESS-Referenzen in Komponenten und Dokumenten

ungültige oder nicht registrierte ESS-Nummern

fehlende Cross-References

widersprüchliche ESS-Regeln

Grundlage: `.ai/registry/ess-registry.json`, `ARCH-RESP-0001`.

---

# 3.2 AdrValidator

Prüft

fehlende ADR-Referenzen bei Architekturentscheidungen

widersprüchliche ADRs

veraltete ADRs ohne `SUPERSEDED`-Kennzeichnung

Breaking Changes ohne zugehörigen ADR

ADR-Nummern ohne Dokument

Grundlage: `docs/adr/`, `adr_history.json`.

---

# 3.3 RepositoryValidator

Prüft je Komponente

README vorhanden und inhaltlich belegt

CHANGELOG vorhanden

manifest.json vorhanden und vollständig

component.yaml vorhanden

Ownership definiert und nicht pauschal

Ein Platzhaltertext gilt als nicht belegt.

---

# 3.4 ContractValidator

Prüft

doppelte Contracts über Dokumentgrenzen hinweg

widersprüchliche Contracts

ungültige Contracts ohne Geltungsbereich

nicht referenzierte Contracts

Contracts mit globaler Wirkung außerhalb von ESS-0001-CONTRACTS

---

# 3.5 DocumentationValidator

Prüft

Vollständigkeit gegenüber der Dokumentklasse

Aktualität gegenüber der letzten Codeänderung

Versionierung

Konsistenz zwischen Dokument und Metadaten

Struktur gemäß Dokumentklasse

Formatierung

Enterprise-Konformität

---

# 3.6 TraceabilityValidator

Prüft die Kette

```text
ESS → ADR → Code → Tests → Dokumentation → Versionierung → Releases → Production
```

auf fehlende Beziehungen.

Der Validator **verwendet** die Matrix aus ESS-0011 und erzeugt sie nicht.

Coverage-Schwellwerte und Orphan-Klassen stehen ausschließlich in ESS-0011-CONTRACTS.

---

# 3.7 KnowledgeGraphValidator

Prüft

verwaiste Knoten

doppelte Beziehungen

fehlende Beziehungen

inkonsistente Beziehungen

Die Knoten- und Beziehungsregeln selbst stehen in ESS-0001-CONTRACTS Chapter 15.

---

# 3.8 DigitalTwinValidator

Vergleicht Repository gegen Digital Twin und erkennt

fehlende Komponenten

neue Komponenten

gelöschte Komponenten

nicht synchronisierte Komponenten

Twin-Zustände und Drift-Toleranz stehen in ESS-0001-CONTRACTS Chapter 18.

---

# 3.9 VersionValidator

Prüft auf Konflikte zwischen

Dokumentationsversion

Komponentenversion

Repository-Version

ESS-Version

ADR-Version

Die Versionsstrategie selbst steht in ESS-0001-CONTRACTS Chapter 9.

---

# End of Chapter 3

---

# Chapter 4

# Trigger und Workflow

## Enterprise Purpose

Dieses Kapitel definiert Auslösung und Ablauf.

---

# Hauptworkflow

```text
Trigger
   ↓
Regelwerk laden
   ↓
Prüfbereiche ausführen (3.1 bis 3.9)
   ↓
Befunde sammeln und klassifizieren
   ↓
Kennzahlen berechnen
   ↓
Berichte erzeugen
   ↓
Events veröffentlichen
```

Der Governance Validator läuft ausschließlich **nach** der Documentary Engine und **nach** der
Traceability Matrix, da er deren Ergebnisse verwendet.

---

# Trigger Contract

| Auslöser | Umfang |
|---|---|
| `DocumentationGeneratedEvent` | inkrementell |
| `KnowledgeUpdatedEvent` | inkrementell |
| `TwinSynchronizedEvent` | inkrementell |
| `ComponentRegisteredEvent` | inkrementell |
| `VersionChangedEvent` | vollständig |
| ESS-Änderung | vollständig |
| ADR-Änderung | vollständig |
| `ReleasePreparedEvent` | vollständig |
| zeitgesteuerte Vollprüfung | vollständig |

Vor jeder Produktionsfreigabe erfolgt ein vollständiger Durchlauf.

---

# Determinismus

Bei identischem Repository-Zustand erzeugt der Validator

identische Befunde

identische Schweregrade

identische Kennzahlen

Zeitstempel sind ausgenommen.

Weicht das Ergebnis bei unverändertem Eingangszustand ab, gilt der Durchlauf als fehlerhaft.

---

# Read Only Contract

Der Governance Validator besitzt **keinen** Schreibzugriff auf

Quellcode

Dokumentation

Metadaten

Registry

Knowledge Graph

Digital Twin

ESS-Dokumente

ADR-Dokumente

Er schreibt ausschließlich in seinen eigenen Befund- und Berichtsspeicher.

---

# End of Chapter 4

---

# Chapter 5

# Reports

## Enterprise Purpose

Dieses Kapitel definiert die zehn verbindlichen Berichte.

---

| Bericht | Inhalt |
|---|---|
| **Documentation Health Report** | Vollständigkeit, Aktualität, Struktur je Dokument |
| **Governance Report** | sämtliche Governance-Verstöße mit Schweregrad |
| **ESS Coverage Report** | Abdeckung der ESS-Regeln durch Komponenten |
| **ADR Coverage Report** | Abdeckung der Architekturentscheidungen |
| **Traceability Report** | fehlende Beziehungen entlang der Kette |
| **Repository Health Report** | Metadaten, Ownership, Struktur je Komponente |
| **Digital Twin Report** | Abweichungen Repository gegen Twin |
| **Knowledge Graph Report** | verwaiste, doppelte und inkonsistente Beziehungen |
| **Contract Report** | Duplikate, Widersprüche, nicht referenzierte Contracts |
| **Architecture Compliance Report** | Layer-, Abhängigkeits- und Strukturkonformität |

---

# Berichtsablage

```text
docs/quality/
```

Die physische Erzeugung erfolgt durch die Documentary Engine gemäß ESS-0010.

Der Governance Validator liefert die Daten, nicht das Dokument.

Sämtliche Berichte tragen die Kennzeichnung als generiert gemäß
ESS-0001-CONTRACTS Chapter 19, *Generated Artifact Contract*.

---

# End of Chapter 5

---

# Chapter 6

# Integration

## Enterprise Purpose

Dieses Kapitel definiert die Einbettung in die Plattform.

---

# Documentary Engine

Der Governance Validator ist Bestandteil der Documentary Engine.

Er verwendet deren Ergebnisse: Knowledge Graph, Registry, Digital Twin, erzeugte Dokumentation.

Er schreibt niemals in diese Quellen zurück.

---

# Enterprise Traceability

Der Governance Validator verwendet die Matrix aus ESS-0011.

Er erzeugt sie nicht und verändert sie nicht.

Fehlt die Matrix, meldet er dies als Befund und setzt den Traceability-Prüfbereich aus.

---

# Supervisor

Der Supervisor erhält gemäß ESS-0002 automatisch Meldung bei

kritischen Dokumentationsfehlern

fehlenden ESS-Referenzen

fehlenden ADR-Referenzen

Governance-Verstößen

Traceability-Verlust

Versionskonflikten

Der Supervisor bewertet die Befunde und entscheidet über Blockade.

Der Validator blockiert selbst niemals.

---

# Platform Director

Der Platform Director erhält gemäß ESS-0003

Governance-Reife

Dokumentationsqualität

Architekturqualität

Repository-Reife

und leitet daraus Handlungsempfehlungen ab.

Die Empfehlungen erzeugt der Platform Director, nicht der Validator.

---

# Version Manager

Der Version Manager verwendet die Ergebnisse zur Versionsbewertung gemäß
ESS-0001-CONTRACTS Chapter 9.

| Befundklasse | Versionsauswirkung |
|---|---|
| Breaking Change ohne ADR | blockiert Release |
| Contract-Widerspruch | Major |
| neue Regel oder Komponente | Minor |
| Dokumentationslücke | Patch |

Die Versionsentscheidung trifft der Version Manager, nicht der Validator.

---

# AI Integration

Sämtliche KI-Systeme verwenden verbindlich denselben Governance Validator.

| System | Pflicht |
|---|---|
| Claude Code | prüft Änderungen vor Übergabe an die Documentary Engine |
| Google AI Studio | prüft Entwürfe vor Übergabe an Claude Code |
| ChatGPT | prüft Architektur- und Governance-Vorschläge |
| Future Enterprise AI | identische Pflicht |

Kein KI-System verwendet eigene Prüfregeln.

Kein KI-System deaktiviert Regeln.

Kein KI-System erzeugt Prüfergebnisse ohne Ausführung.

Dies konkretisiert ESS-0001-CONTRACTS Chapter 10 und Chapter 17 für die Dokumentations-Governance.

---

# Enterprise Rules

Der Validator stellt fest, er entscheidet nicht.

Der Validator verändert niemals den Prüfgegenstand.

Keine Regel ohne Bezeichner und Schweregrad.

Kein Befund ohne Nachweis.

Keine Kennzahl ohne Berechnung.

Keine Produktionsfreigabe bei Critical-Befunden.

Kein Prüfergebnis ohne Ausführung.

---

# Success Criteria

Der Governance Validator gilt als erfolgreich implementiert wenn

✓ sämtliche neun Prüfbereiche ausführbar sind

✓ jeder Befund einen Nachweis besitzt

✓ jede Kennzahl deterministisch berechnet wird

✓ sämtliche zehn Berichte automatisch erzeugt werden

✓ der Supervisor sämtliche kritischen Befunde erhält

✓ der Platform Director Reifekennzahlen erhält

✓ der Version Manager Versionsauswirkungen ableiten kann

✓ sämtliche KI-Systeme denselben Validator verwenden

✓ der Validator keinen Prüfgegenstand verändert

---

# Integration

Dieses Dokument bildet die Grundlage für

ESS-0012-CONTRACTS — Documentation Governance Contracts

---

# Enterprise Final Summary

## ESS-0012 Status

**Document ID** ESS-0012

**Titel** CAPITAL-AI Documentation Governance

**Status** Enterprise Specification

**Version** 1.0.0

**Lifecycle Status** Approved Enterprise Specification

---

# Governance Statement

ESS-0012 ist die verbindliche Spezifikation des Documentation Governance Validator innerhalb
des CAPITAL-AI Core.

Sie baut vollständig auf ESS-0001-CONTRACTS, ESS-0010 und ESS-0011 auf.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Spezifikation des Documentation Governance Validator |

---

# Approval

Document Status

APPROVED

Enterprise Specification

CAPITAL-AI Core Architecture

Version 1.0.0

---

# End of Document

ESS-0012

CAPITAL-AI Documentation Governance

Enterprise Specification

Version 1.0.0
