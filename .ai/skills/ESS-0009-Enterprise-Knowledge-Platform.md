---
skill:
  id: ESS-0009
  name: Enterprise Knowledge Platform
  version: 1.0.0
  status: Enterprise Approved
  maturity: Gold Standard
  owner: Platform Director
  category: Enterprise Architecture
  priority: Critical

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  architecture: Enterprise
  lifecycle: AI Native Development Lifecycle

classification:
  type: Component Specification
  role: Komponentenspezifikation Knowledge Engine
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschliesslich die Komponente src/platform/Knowledge.
    Das Wissensmodell und seine Regeln verbleiben in ESS-0001 Chapter 4 und
    ESS-0001-CONTRACTS Chapter 15.

authority:

  controls:
    - Knowledge Builder
    - Knowledge Query
    - Knowledge Validation
    - Knowledge Versionierung

  collaborates:
    - Documentary Engine
    - Enterprise Traceability
    - Supervisor
    - Platform Director
    - Version Manager

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Quellcode
    - Metadaten
    - Registry

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0010
    - ESS-0011
    - ESS-0012
  relatedAdr:
    - ADR-0010
    - ADR-0016
  relatedComponents:
    - src/platform/Knowledge
    - src/platform/Discovery
    - src/platform/Registry
    - src/platform/Documentary
  relatedSkills:
    - .ai/skills/ESS-0001-Documentary-Architect.md
    - .ai/skills/ESS-0010-Documentary-Engine.md

created: 2026-07-31
---

# Enterprise Knowledge Platform

## Enterprise Purpose

Dieses Dokument spezifiziert die Komponente `src/platform/Knowledge`.

ESS-0001 Chapter 4 beschreibt das Wissensmodell der Plattform.

ESS-0001-CONTRACTS Chapter 15 definiert die verbindlichen Knowledge-Graph-Contracts —
Knotenidentität, Beziehungstypen, Ursprung, Vertrauenswert, Determinismus.

Dieses Dokument beschreibt ausschließlich, **wie** die Komponente den Graphen aufbaut,
prüft, versioniert und bereitstellt.

Es definiert keine Knoten- und keine Beziehungsregeln.

---

# Abgrenzung

| Dokument | Verantwortung |
|---|---|
| ESS-0001 Chapter 4 | Wissensmodell, Vision |
| ESS-0001-CONTRACTS Chapter 15 | Node Contract, Relationship Contract, Origin, Confidence |
| ESS-0010 | Documentary Engine, die den Aufbau auslöst |
| ESS-0011 | Traceability Matrix, die den Graphen nutzt |
| **ESS-0009** | **Komponentenspezifikation Knowledge Engine** |

---

# Enterprise Principle

Wissen entsteht ausschließlich aus Analyse.

Wissen wird niemals geschrieben, nur abgeleitet.

Ein Knoten ohne Ursprung ist kein Wissen, sondern eine Behauptung.

Der Graph ist die einzige autorisierte Quelle für Architekturwissen — sämtliche KI-Systeme
verwenden ihn, keines analysiert das Repository erneut selbst.

---

# Position in der Architektur

Knowledge Layer gemäß ESS-0001-CONTRACTS Chapter 6.

Zulässige Abhängigkeiten: Core, Shared, Registry, Discovery.

Unzulässig: Documentary, Version Manager, Supervisor, Platform Director.

Der Graph wird von oben gelesen, nicht von oben geschrieben.

---

# End of Chapter 1

---

# Chapter 2

# Komponentenarchitektur

## Kernkomponenten

### KnowledgeBuilder

Aufbau des Graphen.

Verantwortung

Knotenerzeugung aus Discovery-Ergebnissen

Beziehungsableitung

Ursprungszuordnung

Vertrauenswertbestimmung

Prüfsummenbildung

---

### KnowledgeValidator

Konsistenzprüfung gemäß Chapter 15.

Geprüft wird

Knoten ohne Typ

Knoten ohne Ursprung

Beziehungen auf nicht existierende Knoten

doppelte IDs

zyklische OWNS-Beziehungen

widersprüchliche Versionsangaben

verwaiste Knoten

Assumed-Beziehungen werden verworfen, niemals aufgenommen.

---

### KnowledgeQuery

Bereitstellung der Abfragefähigkeit.

Beantwortet verbindlich die Fragen aus Chapter 15, *Query Contract* — unter anderem

Welche Komponenten besitzen keine ADR?

Welche Events besitzen keinen Consumer?

Welche Interfaces besitzen keine Implementierung?

Welche Komponenten verletzen die Layer-Hierarchie?

Welche Legacy-Komponenten besitzen keinen Adapter?

---

### KnowledgeVersioner

Versionierung des Wissensbestands.

Die Knowledge Version wird erhöht bei neuen Knotentypen, neuen Beziehungstypen,
strukturellen Änderungen des Modells oder vollständigem Neuaufbau.

---

### KnowledgeStore

Persistenz.

```text
.ai/knowledge/
  repository.json    architecture.json   components.json
  interfaces.json    services.json       events.json
  agents.json        orchestrators.json  database.json
  api.json           security.json       documentation.json
  dependencies.json  workflows.json      policies.json
  versions.json      releases.json       plugins.json
  risks.json         graph.json
```

Jede Datei besitzt ein Schema unter `.ai/schemas/`.

Sämtliche Dateien werden ausschließlich generiert.

---

# End of Chapter 2

---

# Chapter 3

# Interfaces

## IKnowledgeBuilder

```text
build()                  vollständiger Aufbau
update(delta)            inkrementelle Aktualisierung
checksum()               reproduzierbare Prüfsumme
```

## IKnowledgeValidator

```text
validate()               vollständige Konsistenzprüfung
conflicts()              erkannte Widersprüche
```

## IKnowledgeQuery

```text
node(id)                 Knoten abrufen
relations(id, type)      Beziehungen abrufen
query(expression)        semantische Abfrage
```

## IKnowledgeVersioner

```text
version()                aktuelle Knowledge Version
snapshot(version)        Sicherung
```

---

# End of Chapter 3

---

# Chapter 4

# Events

## Erzeugte Events

KnowledgeBuildStartedEvent

KnowledgeCreatedEvent

KnowledgeUpdatedEvent

KnowledgeLinkedEvent

KnowledgeValidatedEvent

KnowledgeConflictDetectedEvent

KnowledgeVersionChangedEvent

## Konsumierte Events

RepositoryScannedEvent

CodeAnalyzedEvent

ComponentRegisteredEvent

MigrationCompletedEvent

---

# Determinismus

Bei identischem Repository-Zustand erzeugt jeder Aufbau identische Knoten, IDs, Beziehungen
und Prüfsummen.

Zeitstempel und Laufzeitinformationen sind von der Prüfsummenbildung ausgenommen.

Weicht die Prüfsumme bei unverändertem Eingangszustand ab, gilt der Aufbau als fehlerhaft.

---

# End of Chapter 4

---

# Chapter 5

# Integration und Bestand

## Documentary Engine

Der Knowledge Builder wird ausschließlich durch die Documentary Engine ausgelöst (ESS-0010).

Die Knowledge Engine löst sich nicht selbst aus.

## Enterprise Traceability

Die Matrix aus ESS-0011 verwendet den Graphen als Pflichtquelle. Fehlt er, bricht der
Matrixaufbau ab (`GOV-KG-001`, Critical).

## Sämtliche KI-Systeme

Verwenden ausschließlich diesen Graphen zur Architekturinterpretation. Eigene
Repository-Analysen zur Wissensbildung, lokale Wissensspeicher und manuelle Ergänzungen sind
unzulässig.

---

# Bekannter Bestand

`.ai/knowledge/` enthält ausschließlich `.gitkeep`.

Es existiert **kein einziger Knoten**.

Damit ist die zentrale Aussage aus ESS-0001 Chapter 4 — sämtliche KI-Agenten verwenden
dieselbe Wissensbasis — derzeit nicht erfüllt. Jedes KI-System analysiert das Repository
erneut selbst.

Dies ist Befund `GOV-KG-001` (Critical) und blockiert zugleich Digital Twin und Traceability
Matrix.

Die Knowledge Engine ist damit die Komponente mit der größten Hebelwirkung: Ihr Aufbau
schaltet zwei weitere Subsysteme frei.

Umsetzung gemäß Stufe 5 aus `docs/architecture/REPOSITORY_STRUCTURE_ANALYSIS.md`.

---

# Enterprise Rules

Wissen entsteht ausschließlich aus Analyse.

Kein Knoten ohne Ursprung.

Keine Beziehung ohne Richtung.

Keine Assumed-Beziehung im Graphen.

Keine manuelle Änderung des Wissensbestands.

Keine parallele Wissensbasis.

Kein Selbstauslösen des Aufbaus.

---

# Success Criteria

✓ sämtliche Komponenten als Knoten vorhanden

✓ sämtliche Beziehungen abgeleitet und gerichtet

✓ Graph reproduzierbar aufbaubar

✓ sämtliche Wissensdateien schemakonform

✓ Query Contract vollständig beantwortbar

✓ sämtliche KI-Systeme verwenden denselben Graphen

---

# Enterprise Final Summary

**Document ID** ESS-0009

**Titel** CAPITAL-AI Enterprise Knowledge Platform

**Status** Enterprise Specification

**Version** 1.0.0

---

# Governance Statement

ESS-0009 ist die verbindliche Komponentenspezifikation der Knowledge Engine.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation der Knowledge Engine |

---

# End of Document

ESS-0009

CAPITAL-AI Enterprise Knowledge Platform

Version 1.0.0
