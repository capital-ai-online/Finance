---
skill:
  id: ESS-0003
  name: Platform Director
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

authority:

  controls:
    - Enterprise Governance
    - Architecture Authority
    - Release Authority
    - Exception Authority
    - AI Orchestration Authority

  collaborates:
    - Supervisor
    - Documentary Engine
    - Version Manager
    - Security Center
    - Compliance Center
    - Quality Center
    - Release Center

  cannot_modify:
    - Trading Logic
    - Portfolio Logic
    - Crypto Scoring Algorithms
    - Stripe Billing Logic
    - OAuth Authentication
    - Database Business Logic
    - Audit Trail

classification:
  type: Component Specification
  role: Komponentenspezifikation Platform Director
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument definiert ausschließlich Contracts des Platform Director.
    Globale Contracts verbleiben in ESS-0001-CONTRACTS.

references:
  - ESS-0001
  - ESS-0001-CONTRACTS
  - ESS-0002
  - ADR-0006
  - ADR-0007

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
    - ESS-0002
  relatedEss:
    - ESS-0010
    - ESS-0011
    - ESS-0011-CONTRACTS
  relatedAdr:
    - ADR-0006
    - ADR-0007
    - ADR-0010
    - ADR-0011
    - ADR-0013
    - ADR-0015
  relatedComponents:
    - src/platform/PlatformDirector
    - src/platform/Release
    - src/platform/Compliance
    - src/platform/Traceability
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0002-Supervisor-Architect.md

created: 2026-07-30
---

# Platform Director

## Enterprise Mission

Der Platform Director ist die oberste Governance-Instanz der CAPITAL-AI Plattform.

Er trifft sämtliche Entscheidungen, die nicht durch bestehende Contracts bereits eindeutig geregelt sind.

Er entscheidet niemals gegen einen Contract.

Er entscheidet ausschließlich innerhalb der durch ESS und ADR gesetzten Grenzen.

Wo eine Entscheidung eine bestehende Regel verändert, entsteht verbindlich ein Architecture Decision Record.

---

# Vision

Die Plattform besitzt jederzeit genau eine verantwortliche Entscheidungsinstanz.

Entscheidungen sind nachvollziehbar.

Entscheidungen sind begründet.

Entscheidungen sind dauerhaft dokumentiert.

---

# Enterprise Philosophy

Die Plattform folgt dem Grundsatz

> Entscheidung erfordert Nachweis.

Der Platform Director entscheidet ausschließlich auf Grundlage

des Digital Twin

des Knowledge Graph

der Supervisor-Bewertung

der Impact Analyse

der Risikobewertung

Er entscheidet niemals auf Grundlage von Annahmen.

---

# Abgrenzung

| Instanz | Verantwortung |
|---|---|
| Documentary Engine | Wissen und Dokumentation |
| Supervisor | Beobachtung und Bewertung |
| Platform Director | Entscheidung und Governance |
| Version Manager | Versionierung |
| Release Center | Auslieferung |

Der Platform Director implementiert nicht.

Der Platform Director dokumentiert nicht.

Der Platform Director überwacht nicht.

Er entscheidet.

---

# Position in der Architektur

Gemäß ESS-0001-CONTRACTS Chapter 6 bildet der Platform Director die oberste Ebene der Layer-Hierarchie.

Er besitzt Zugriff auf sämtliche Plattformkomponenten.

Keine Komponente besitzt Zugriff auf den Platform Director.

---

# Verhältnis zu ADR-0006

ADR-0006 legt die schrittweise Anbindung des Plattform-Direktors innerhalb des Backends fest.

ESS-0003 widerspricht ADR-0006 nicht.

ESS-0003 beschreibt die Enterprise-Governance-Rolle des Platform Director innerhalb der Plattformarchitektur.

ADR-0006 beschreibt die technischen Anbindungsschritte im Backend.

Beide Dokumente ergänzen sich.

Bei Widersprüchen gilt gemäß ESS-0001-CONTRACTS Chapter 1 die ADR.

---

# End of Chapter 1

---

# Chapter 2

# Decision Authority

## Enterprise Purpose

Dieses Kapitel definiert verbindlich, welche Entscheidungen dem Platform Director vorbehalten sind.

---

# Exclusive Decisions

Ausschließlich der Platform Director entscheidet über

Einführung neuer Layer

Einführung neuer Plattformmodule

Einführung neuer Root-Verzeichnisse

Änderung der Repository-Struktur

Vergabe von ESS-Nummern

Freigabe neuer Enterprise Contracts

Freigabe neuer Erweiterungsarten

Freigabe neuer KI-Systeme

Genehmigung von Ausnahmen

Akzeptanz von Risiken

Freigabe von Produktionsversionen

Entfernung von Legacy-Bestand

Deprecation-Zeitpunkte

Priorisierung der Enterprise Roadmap

---

# Delegated Decisions

Folgende Entscheidungen sind vertraglich bereits geregelt und werden nicht erneut entschieden.

| Gegenstand | Regelnde Instanz |
|---|---|
| Versionsstufe | Version Manager gemäß Chapter 9 |
| Quality Gate Ergebnis | Validatoren gemäß Chapter 12 |
| Health Status | Supervisor gemäß ESS-0002 |
| Dokumentationsinhalt | Documentary Engine gemäß ESS-0001 |
| Knowledge-Beziehungen | Knowledge Engine gemäß Chapter 15 |
| Twin-Zustand | Digital Twin gemäß Chapter 18 |

Der Platform Director überschreibt diese Ergebnisse niemals ohne ADR.

---

# Decision Contract

Jede Entscheidung besitzt verbindlich

Decision ID

Titel

Gegenstand

Entscheidungsgrundlage

Alternativen

Begründung

Risikobewertung

betroffene Komponenten

betroffene Contracts

Version

ADR Referenz

Zeitpunkt

Entscheider

Correlation ID

---

# Decision Types

Architecture Decision

Governance Decision

Release Decision

Exception Decision

Risk Decision

Priority Decision

Emergency Decision

Jede Architecture Decision erzeugt verbindlich einen ADR.

---

# Decision Prerequisites

Eine Entscheidung wird ausschließlich getroffen, wenn vorliegen

Supervisor Assessment

Impact Analyse

Risikobewertung

Digital Twin im Zustand Synchronized

vollständige Entscheidungsgrundlage

Fehlt eine Grundlage, wird die Entscheidung zurückgestellt.

Eine Zurückstellung ist ebenfalls eine dokumentierte Entscheidung.

---

# Emergency Decisions

Notfallentscheidungen sind ausschließlich zulässig bei

Sicherheitsvorfällen

Produktionsausfällen

Datenschutzverletzungen

kritischen Datenfehlern

Für jede Notfallentscheidung gilt verbindlich

sofortige Protokollierung

Nachdokumentation innerhalb der laufenden Version

verbindliche ADR

Nachbewertung durch den Supervisor

---

# End of Chapter 2

---

# Chapter 3

# Governance Model

## Enterprise Purpose

Der Platform Director verantwortet die Einhaltung der gesamten Enterprise Governance.

---

# Governance Scope

Verantwortet werden

Enterprise Specifications

Enterprise Contracts

Architecture Decision Records

Repository Governance

AI Governance

Security Governance

Compliance Governance

Release Governance

---

# Standard Ownership

Der Platform Director ist Eigentümer

sämtlicher ESS-Dokumente

sämtlicher Enterprise Contracts

des ESS-Nummernraums

des ADR-Nummernraums

der Ausnahmenregistrierung

Er ändert diese Dokumente ausschließlich über den in Chapter 20 definierten Change Contract.

---

# Exception Authority

Ausnahmen werden ausschließlich durch den Platform Director genehmigt.

Jede Ausnahme besitzt verbindlich

Exception ID

verletzten Contract

Begründung

Risiko

Zielzustand

Status

ADR Referenz

Zulässige Status

Approved

Time Limited

Permanent

Revoked

Abgelaufene Ausnahmen werden automatisch zu Befunden.

---

# Ownership Assignment

Der Platform Director weist jedem Repository-Bereich und jeder Komponente genau einen Eigentümer zu.

Ohne Eigentümer existiert keine zulässige Komponente.

Eigentümerwechsel erzeugen verbindlich ein Enterprise Event.

---

# Roadmap Authority

Der Platform Director führt die Enterprise Roadmap.

Die Roadmap enthält verbindlich

Zielarchitektur

geplante Komponenten

geplante Migrationen

geplante Deprecations

Prioritäten

Zielversionen

Die Roadmap wird ausschließlich gegen den geplanten Digital Twin geführt.

---

# End of Chapter 3

---

# Chapter 4

# AI Orchestration Authority

## Enterprise Purpose

Der Platform Director koordiniert sämtliche KI-Systeme gemäß ESS-0001-CONTRACTS Chapter 10 und Chapter 17.

---

# Authority over AI Systems

Der Platform Director entscheidet über

Zulassung neuer KI-Systeme

Verantwortungszuschnitt je KI-System

Reihenfolge der Wertschöpfungskette

Abbruch laufender Ketten

Wiederholung von Stufen

Modellwechsel

---

# Value Chain Governance

Die verbindliche Wertschöpfungskette lautet

Google AI Studio

↓

Claude Code

↓

Documentary Engine

↓

Supervisor

↓

Platform Director

↓

Version Manager

↓

Release

↓

Production

Der Platform Director bildet die Freigabestufe dieser Kette.

Ohne seine Entscheidung erreicht keine Änderung den Version Manager.

---

# Model Independence

Der Platform Director stellt sicher, dass

kein Ergebnis von einem einzelnen Modell abhängt

kein KI-System eigene Governance-Regeln etabliert

sämtliche KI-Systeme dieselben Contracts erfüllen

sämtliche KI-Systeme dieselbe Wissensbasis verwenden

---

# AI Boundaries

Der Platform Director stellt verbindlich sicher, dass kein KI-System

Architekturentscheidungen trifft

Contracts verändert

ESS-Dokumente verändert

ADRs überschreibt

Versionen eigenständig erhöht

Sicherheitsmechanismen abschwächt

Ausnahmen selbst genehmigt

---

# Handover Governance

Jede Übergabe zwischen KI-Stufen wird verbindlich

protokolliert

validiert

versioniert

im Audit Trail geführt

Unvollständige Übergaben führen zum Abbruch der Kette.

---

# End of Chapter 4

---

# Chapter 5

# Release Authority

## Enterprise Purpose

Der Platform Director erteilt sämtliche Produktionsfreigaben.

---

# Release Prerequisites

Eine Produktionsfreigabe erfolgt ausschließlich wenn

✓ sämtliche Quality Gates bestanden sind

✓ keine blockierenden Befunde offen sind

✓ der Digital Twin synchron ist

✓ der Knowledge Graph aktuell ist

✓ die Dokumentation vollständig erzeugt wurde

✓ die Version bestimmt wurde

✓ ein Rollback-Plan existiert

✓ Security und Compliance bestätigt sind

✓ die AI-Wertschöpfungskette vollständig durchlaufen wurde

---

# Release Decision

Die Freigabeentscheidung besitzt verbindlich

Version

Release-Typ

Entscheidungsgrundlage

Risikobewertung

Rollback-Plan

Freigabezeitpunkt

Entscheider

---

# Rollback Authority

Der Platform Director entscheidet über

Auslösung eines Rollbacks

Umfang des Rollbacks

Wiederaufnahme des Betriebs

Nachbereitung

Rollbacks werden niemals stillschweigend durchgeführt.

---

# Production Governance

Produktionsänderungen erfordern zusätzlich

Version Manager Freigabe

Supervisor Freigabe

Quality Center Freigabe

Compliance Center Prüfung

Security Center Prüfung

Deployment Validation

Knowledge Synchronisation

Diese Anforderungen entsprechen ESS-0001 Chapter 7.

---

# End of Chapter 5

---

# Chapter 6

# Platform Director Contracts

## Enterprise Purpose

Dieses Kapitel definiert die verbindlichen technischen Anforderungen an die Implementierung des Platform Director.

---

# Location

Der Platform Director befindet sich ausschließlich unter

```text
src/platform/PlatformDirector/
```

---

# Interface Contract

Der Platform Director veröffentlicht ausschließlich öffentliche Enterprise Interfaces.

Verbindlich sind

decide

approve

reject

defer

grantException

assignOwnership

describe

---

# Consumed Events

Verbindlich abonniert werden

SupervisorValidatedEvent

SupervisorEscalatedEvent

SupervisorBlockedEvent

TwinDriftDetectedEvent

VersionCalculatedEvent

SecurityViolationDetectedEvent

ComplianceViolationDetectedEvent

StructureViolationDetectedEvent

ExceptionExpiredEvent

---

# Produced Events

Verbindlich veröffentlicht werden

PlatformDecisionEvent

PlatformApprovalEvent

PlatformRejectionEvent

ExceptionRegisteredEvent

OwnershipChangedEvent

ReleaseApprovedEvent

RollbackOrderedEvent

EmergencyDecisionEvent

---

# Traceability Contract

Jede Entscheidung ist dauerhaft nachvollziehbar.

Entscheidungen werden niemals gelöscht.

Widerrufene Entscheidungen erhalten den Status Revoked und bleiben erhalten.

---

# Documentation Contract

Der Platform Director erzeugt keine Dokumentation.

Sämtliche Entscheidungsdokumente werden durch die Documentary Engine erzeugt.

Erzeugt werden

Decision Report

Approval Report

Exception Report

Governance Report

Roadmap Report

---

# Validation

Vor jeder Freigabe des Platform Director wird geprüft

✓ sämtliche Entscheidungen besitzen eine Grundlage

✓ sämtliche Architekturentscheidungen besitzen eine ADR

✓ sämtliche Ausnahmen besitzen einen Status

✓ sämtliche Entscheidungen sind versioniert

✓ sämtliche Entscheidungen sind im Audit Trail geführt

✓ keine Entscheidung widerspricht einem bestehenden Contract

---

# Enterprise Rules

Keine Entscheidung ohne Grundlage.

Keine Architekturentscheidung ohne ADR.

Keine Ausnahme ohne Registrierung.

Keine Freigabe ohne Supervisor Assessment.

Keine Produktionsfreigabe bei offenen blockierenden Befunden.

Keine Entscheidung gegen einen bestehenden Contract.

Keine Entscheidung durch ein KI-System.

---

# Success Criteria

Der Platform Director gilt als erfolgreich implementiert wenn

✓ sämtliche Entscheidungen dokumentiert sind

✓ sämtliche Entscheidungen nachvollziehbar bleiben

✓ sämtliche Ausnahmen registriert sind

✓ sämtliche Freigaben nachweisbasiert erfolgen

✓ keine Änderung ohne Freigabe die Produktion erreicht

✓ die Wertschöpfungskette jederzeit steuerbar bleibt

✓ die Plattform genau eine Entscheidungsinstanz besitzt

---

# End of Chapter 6

---

# Enterprise Final Summary

## ESS-0003 Status

**Document ID**

ESS-0003

**Titel**

CAPITAL-AI Platform Director

**Status**

Enterprise Specification

**Version**

1.0.0

**Lifecycle Status**

Approved Enterprise Specification

---

# Mission Statement

Der Platform Director bildet die oberste Governance-Instanz der CAPITAL-AI Plattform.

Er entscheidet ausschließlich auf nachweisbarer Grundlage.

Er entscheidet niemals gegen bestehende Contracts.

Jede Entscheidung bleibt dauerhaft nachvollziehbar.

---

# Architectural Scope

ESS-0003 definiert

✓ Decision Authority

✓ Governance Model

✓ Exception Authority

✓ Ownership Assignment

✓ AI Orchestration Authority

✓ Release Authority

✓ Platform Director Implementation Contracts

---

# Governance Statement

ESS-0003 ist die verbindliche Enterprise-Spezifikation des Platform Director innerhalb des CAPITAL-AI Core.

Sie baut vollständig auf ESS-0001, ESS-0001-CONTRACTS und ESS-0002 auf und ergänzt ADR-0006.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste vollständige Enterprise-Spezifikation des Platform Director |

---

# Related Enterprise Specifications

ESS-0001 — Documentary & Code Intelligence Architect

ESS-0001-CONTRACTS — Enterprise Technical Contracts

ESS-0002 — Supervisor Architect

---

# Approval

Document Status

APPROVED

Enterprise Specification

CAPITAL-AI Core Architecture

Version 1.0.0

---

# End of Document

ESS-0003

CAPITAL-AI Platform Director

Enterprise Specification

Version 1.0.0
