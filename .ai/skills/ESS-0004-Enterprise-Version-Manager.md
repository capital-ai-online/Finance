---
skill:
  id: ESS-0004
  name: Enterprise Version Manager
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
  role: Komponentenspezifikation Version Manager
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschliesslich die Komponente
    src/platform/VersionManager. Die globalen Versionierungsregeln verbleiben in
    ESS-0001-CONTRACTS Chapter 9 und ESS-0001 Chapter 9.

authority:

  controls:
    - Version Registry
    - Versionsempfehlung
    - Versionssynchronisation
    - Rollback-Planung
    - Release-Vorbereitung

  collaborates:
    - Documentary Engine
    - Enterprise Traceability
    - Supervisor
    - Platform Director
    - Release Center
    - Quality Center

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Quellcode
    - Knowledge Graph
    - Digital Twin

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0007
    - ESS-0010
    - ESS-0011
  relatedAdr:
    - ADR-0010
    - ADR-0016
  relatedComponents:
    - src/platform/VersionManager
    - src/platform/Release
    - src/platform/Registry
    - src/platform/Traceability
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0011-Enterprise-Traceability.md

created: 2026-07-31
---

# Enterprise Version Manager

## Enterprise Purpose

Dieses Dokument spezifiziert die Komponente `src/platform/VersionManager`.

ESS-0001 Chapter 9 beschreibt die Versionsstrategie der Plattform.

ESS-0001-CONTRACTS Chapter 9 definiert die verbindlichen Versionierungs- und
Release-Contracts.

Dieses Dokument beschreibt ausschließlich, **wie** die Komponente aufgebaut ist, welche
Schnittstellen sie veröffentlicht und wie sie in die Plattform eingebettet ist.

Es enthält keine globalen Versionierungsregeln.

---

# Abgrenzung

| Dokument | Verantwortung |
|---|---|
| ESS-0001 Chapter 9 | Versionsstrategie, Versionskategorien |
| ESS-0001-CONTRACTS Chapter 9 | verbindliche Versionierungs- und Release-Contracts |
| ESS-0001-CONTRACTS Chapter 14 | Lifecycle, Vocabulary Mapping |
| **ESS-0004** | **Komponentenspezifikation Version Manager** |
| ESS-0007 | Release Center |

Bei Abweichungen gilt ausnahmslos ESS-0001-CONTRACTS.

---

# Enterprise Principle

Der Version Manager bestimmt die Version.

Er entscheidet nicht über die Freigabe.

Er berechnet ausschließlich aus nachweisbaren Änderungen — niemals aus Absichtserklärungen.

Eine Version ohne Impact Analyse ist eine Behauptung.

---

# Position in der Architektur

Gemäß ESS-0001-CONTRACTS Chapter 6 liegt der Version Manager oberhalb der Documentary Engine
und unterhalb des Supervisor.

```text
Supervisor
        │
Version Manager      ← ESS-0004
        │
Documentary
        │
Knowledge
```

Zulässige Abhängigkeiten: Core, Shared, Registry, Knowledge, Documentary.

Unzulässig: Supervisor, Platform Director.

---

# End of Chapter 1

---

# Chapter 2

# Komponentenarchitektur

## Verzeichnisstruktur

```text
src/platform/VersionManager/
```

Die innere Struktur folgt der allgemeinen Modulstruktur aus ESS-0001-CONTRACTS Chapter 3.

---

# Kernkomponenten

## VersionCalculator

Berechnung der Versionsempfehlung.

Verantwortung

Auswertung der Impact Analyse

Einstufung nach Major, Minor, Patch

Erkennung von Breaking Changes

Begründung der Einstufung

---

## VersionRegistry

Persistenz sämtlicher Versionsstände.

Verantwortung

Repository-Version

Komponentenversionen

Knowledge Version

Architecture Version

Documentation Version

Twin Version

---

## VersionSynchronizer

Abgleich der Versionsquellen.

Verantwortung

Erkennung widersprüchlicher Versionsstände

Meldung von Abweichungen

Bereitstellung des maßgeblichen Standes

Der Synchronizer **korrigiert nicht selbsttätig**. Er meldet Abweichungen als Befund.

---

## RollbackPlanner

Erzeugung der Rollback-Artefakte.

Verantwortung

Rollback-Version

Rollback-Reihenfolge

Rollback-Voraussetzungen

Rollback-Risiken

---

## ChangelogGenerator

Erzeugung der Änderungsdokumentation.

Verantwortung

Komponenten-Changelog

Release Notes

Versionshistorie

Die physische Dokumenterzeugung erfolgt durch die Documentary Engine gemäß ESS-0010.

---

# End of Chapter 2

---

# Chapter 3

# Interfaces

Sämtliche Interfaces folgen ESS-0001-CONTRACTS Chapter 4.

## IVersionCalculator

```text
calculate(impact)        Versionsempfehlung aus Impact Analyse
classify(change)         Einstufung einer Einzeländerung
detectBreaking(delta)    Erkennung von Breaking Changes
```

## IVersionRegistry

```text
current(scope)           aktueller Versionsstand
history(scope)           Versionshistorie
record(version)          Aufnahme eines Versionsstandes
```

## IVersionSynchronizer

```text
compare()                Abgleich sämtlicher Versionsquellen
conflicts()              erkannte Widersprüche
authoritative()          maßgeblicher Stand
```

## IRollbackPlanner

```text
plan(version)            Rollback-Plan zu einer Version
validate(plan)           Prüfung der Durchführbarkeit
```

Sämtliche Methoden sind asynchron und idempotent.

---

# End of Chapter 3

---

# Chapter 4

# Events

Namen folgen dem Naming Contract aus ESS-0001-CONTRACTS Chapter 8.

## Erzeugte Events

VersionCalculatedEvent

VersionChangedEvent

VersionConflictDetectedEvent

BreakingChangeDetectedEvent

RollbackPlanCreatedEvent

ChangelogGeneratedEvent

ReleasePreparedEvent

## Konsumierte Events

ImplementationCompletedEvent

DocumentationGeneratedEvent

KnowledgeUpdatedEvent

TwinSynchronizedEvent

TraceabilityBuildCompletedEvent

PlatformDecisionEvent

---

# End of Chapter 4

---

# Chapter 5

# Integration

## Wertschöpfungskette

Der Version Manager bildet Stufe 6 der Kette aus ESS-0001-CONTRACTS Chapter 17.

**Eingang** Freigabe des Platform Director, Impact Analyse, Änderungsumfang

**Ausgang** Version, Changelog, Release Notes, Rollback-Plan

## Documentary Engine

Liefert Impact-Daten: geänderte Komponenten, Interfaces, Events, Breaking Changes.

## Enterprise Traceability

Liefert die Regelachse gemäß ESS-0011: welche Regeln eine Änderung berührt und welche
Verknüpfungen entfallen sind.

Eine entfallene Verknüpfung ohne `SUPERSEDES` ist ein Breaking Change.

## Supervisor

Bestätigt vor jeder Versionsänderung Vollständigkeit der Dokumentation, Validierung und
Twin-Synchronität.

## Platform Director

Trifft die Freigabeentscheidung. Der Version Manager führt sie aus, er ersetzt sie nicht.

---

# Bekannter Bestand

`server/versionManager.ts` führt produktiv Version, Build-Nummer, Git-Tag, Docker-Tag und
Release Notes.

Diese Implementierung ist gemäß ESS-0001-CONTRACTS Chapter 14 als Legacy zu registrieren und
über einen Adapter anzubinden — **nicht** neu zu entwickeln.

Offener Befund: Es bestehen vier widersprüchliche Versionsstände im Repository
(GAP-019, Regel `GOV-VER-001`). Die Auflösung ist Voraussetzung für den produktiven Betrieb
dieser Komponente.

---

# Enterprise Rules

Keine Version ohne Impact Analyse.

Keine Version ohne Rollback-Plan.

Keine Versionsänderung ohne Event.

Kein selbsttätiges Korrigieren widersprüchlicher Versionsstände.

Keine Freigabeentscheidung durch den Version Manager.

---

# Success Criteria

✓ jede Änderung erhält eine begründete Versionsempfehlung

✓ Breaking Changes werden aus der Traceability abgeleitet, nicht geschätzt

✓ sämtliche Versionsquellen sind abgeglichen

✓ jede Version besitzt einen Rollback-Plan

✓ Changelog und Release Notes entstehen generiert

✓ keine widersprüchlichen Versionsstände verbleiben

---

# Enterprise Final Summary

**Document ID** ESS-0004

**Titel** CAPITAL-AI Enterprise Version Manager

**Status** Enterprise Specification

**Version** 1.0.0

---

# Governance Statement

ESS-0004 ist die verbindliche Komponentenspezifikation des Version Manager.

Sie baut vollständig auf ESS-0001 und ESS-0001-CONTRACTS auf.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation des Version Manager |

---

# End of Document

ESS-0004

CAPITAL-AI Enterprise Version Manager

Version 1.0.0
