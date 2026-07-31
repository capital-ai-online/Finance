---
skill:
  id: ESS-0007
  name: Enterprise Release Center
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
  type: Component Specification
  role: Komponentenspezifikation Release Center
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschliesslich die Komponente src/platform/Release.
    Versionierungs- und Release-Contracts verbleiben in ESS-0001-CONTRACTS Chapter 9,
    Automatisierungsregeln in Chapter 19.

authority:

  controls:
    - Release Vorbereitung
    - Release Artefakte
    - Deployment Planung
    - Rollback Ausfuehrung
    - Release Registry

  collaborates:
    - Version Manager
    - Documentary Engine
    - Quality Center
    - Security Center
    - Compliance Center
    - Supervisor
    - Platform Director

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Versionen
    - Quality Gate Ergebnisse

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
    - ESS-0004
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0005
    - ESS-0006
    - ESS-0011
  relatedAdr:
    - ADR-0010
    - ADR-0016
  relatedComponents:
    - src/platform/Release
    - src/platform/VersionManager
    - src/platform/Quality
    - scripts/deployment
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0004-Enterprise-Version-Manager.md

created: 2026-07-31
---

# Enterprise Release Center

## Enterprise Purpose

Dieses Dokument spezifiziert die Komponente `src/platform/Release`.

ESS-0001-CONTRACTS Chapter 9 definiert die verbindlichen Release-Contracts, Chapter 19 die
Automatisierungsverträge.

Dieses Dokument beschreibt ausschließlich, **wie** das Release Center eine Auslieferung
vorbereitet, ausführt und zurücknimmt.

Es definiert keine Versionsregeln und keine Freigabekriterien.

---

# Abgrenzung

| Dokument | Verantwortung |
|---|---|
| ESS-0001-CONTRACTS Chapter 9 | Release Lifecycle, Version Validation, Rollback Contract |
| ESS-0001-CONTRACTS Chapter 19 | Automatisierung, Prozessverträge |
| ESS-0004 | Versionsermittlung |
| ESS-0003 | Freigabeentscheidung |
| **ESS-0007** | **Komponentenspezifikation Release Center** |

Das Release Center liefert aus. Es entscheidet nicht, ob ausgeliefert wird.

---

# Enterprise Principle

Ein Release ist die Zusammenführung bereits geprüfter Ergebnisse.

Das Release Center erzeugt keine neue Wahrheit.

Es fügt zusammen, was Version Manager, Quality Center, Security Center und Documentary
Engine festgestellt haben.

Ein Release ohne Rollback-Plan wird niemals ausgeführt.

---

# Position in der Architektur

Querschnittsmodul mit erweitertem Zugriff gemäß ESS-0001-CONTRACTS Chapter 16 — Release
besitzt ausdrücklich zusätzlichen Zugriff auf Registry, Knowledge, Documentary und Version
Manager, da es deren Ergebnisse zusammenführt.

Unzulässig: Supervisor, Platform Director.

---

# End of Chapter 1

---

# Chapter 2

# Komponentenarchitektur

## Kernkomponenten

### ReleasePreparer

Zusammenführung sämtlicher Release-Bestandteile.

Verantwortung

Sammlung der Artefakte

Prüfung der Vollständigkeit

Erzeugung des Release-Pakets

---

### ReleaseValidator

Prüfung der Freigabevoraussetzungen gemäß Chapter 9.

Geprüft wird

Repository aktuell

Knowledge aktuell

Dokumentation aktuell

Architecture aktuell

ADR aktuell

Tests erfolgreich

Migration vollständig

Quality Gates bestanden

Supervisor synchronisiert

Platform Director synchronisiert

Das Release Center **stellt fest**. Die Freigabe erteilt der Platform Director.

---

### DeploymentPlanner

Erzeugung des Deployment-Plans.

Umgebungen gemäß ESS-0001 Chapter 7: Development, Testing, Staging, Production,
Rollback, Canary, Blue Green, Emergency.

---

### RollbackExecutor

Ausführung der Rücknahme.

Verantwortung

Ausführung des vom Version Manager erzeugten Rollback-Plans

Reihenfolge

Prüfung der Voraussetzungen

Bestätigung des erreichten Zustands

Das Release Center erzeugt den Rollback-Plan nicht — es führt ihn aus.

---

### ReleaseRegistry

Persistenz sämtlicher Releases.

Je Release: Version, Zeitpunkt, Artefakte, Umgebung, Freigabegrundlage, Twin-Snapshot,
Traceability-Snapshot, Rollback-Version.

---

# End of Chapter 2

---

# Chapter 3

# Interfaces

## IReleasePreparer

```text
prepare(version)         Release-Paket erzeugen
artifacts(version)       Bestandteile auflisten
```

## IReleaseValidator

```text
validate(release)        sämtliche Voraussetzungen prüfen
blockers(release)        blockierende Befunde
```

## IDeploymentPlanner

```text
plan(release, target)    Deployment-Plan erzeugen
validate(plan)           Durchführbarkeit prüfen
```

## IRollbackExecutor

```text
execute(plan)            Rollback ausführen
verify()                 erreichten Zustand bestätigen
```

---

# End of Chapter 3

---

# Chapter 4

# Events

## Erzeugte Events

ReleasePreparedEvent

ReleaseValidatedEvent

ReleaseBlockedEvent

ReleasePublishedEvent

DeploymentStartedEvent

DeploymentCompletedEvent

RollbackStartedEvent

RollbackCompletedEvent

## Konsumierte Events

VersionChangedEvent

QualityGatePassedEvent

QualityGateFailedEvent

SecurityScanCompletedEvent

ComplianceValidatedEvent

TwinSynchronizedEvent

PlatformDecisionEvent

RollbackOrderedEvent

---

# End of Chapter 4

---

# Chapter 5

# Integration

## Wertschöpfungskette

Das Release Center bildet Stufe 7 der Kette aus ESS-0001-CONTRACTS Chapter 17.

**Eingang** Version, Dokumentation, Validierungsergebnisse

**Ausgang** Release-Paket, Deployment-Plan, Release Report

## Snapshot-Pflicht

Zu jedem Release werden verbindlich gesichert

Digital Twin Snapshot gemäß Chapter 18

Traceability-Matrix-Snapshot gemäß ESS-0011

Versionsstand gemäß ESS-0004

Dadurch ist rückwirkend nachvollziehbar, welcher Architektur- und Regelzustand ausgeliefert
wurde.

---

# Bekannter Bestand

Der Auslieferungsweg existiert technisch: `package.json` (`build`, `start`), `Dockerfile`
mit zweistufigem Build, `render.yaml`.

Er ist jedoch **nicht an die Governance-Kette gebunden** — ein Release ist derzeit ohne
Durchlauf von Documentary Engine, Quality Center und Version Manager möglich.

`scripts/deployment/` ist leer.

Dies ist der Befund `CHAIN-07` aus `ARCH-CHAIN-0001`.

---

# Enterprise Rules

Kein Release ohne bestandene Quality Gates.

Kein Release ohne Freigabe des Platform Director.

Kein Release ohne Rollback-Plan.

Kein Release ohne Twin- und Traceability-Snapshot.

Keine Versionsentscheidung durch das Release Center.

Kein Rollback ohne dokumentierte Begründung.

---

# Success Criteria

✓ jedes Release durchläuft die vollständige Kette

✓ jedes Release besitzt Snapshots von Twin und Matrix

✓ jedes Release besitzt einen ausführbaren Rollback-Plan

✓ kein Release umgeht die Quality Gates

✓ sämtliche Release-Artefakte werden generiert

---

# Enterprise Final Summary

**Document ID** ESS-0007

**Titel** CAPITAL-AI Enterprise Release Center

**Status** Enterprise Specification

**Version** 1.0.0

---

# Governance Statement

ESS-0007 ist die verbindliche Komponentenspezifikation des Release Center.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Komponentenspezifikation des Release Center |

---

# End of Document

ESS-0007

CAPITAL-AI Enterprise Release Center

Version 1.0.0
