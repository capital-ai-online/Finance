# ESS-0001-CONTRACTS

## Enterprise Technical Contracts

### Version

1.0.0

### Status

Enterprise Baseline Specification

---

# Chapter 1

# Enterprise Foundation & Governance Contracts

## Enterprise Purpose

ESS-0001-CONTRACTS definiert die verbindlichen technischen Verträge für die Entwicklung des CAPITAL-AI Core.

Während ESS-0001 die Enterprise-Architektur beschreibt, legt ESS-0001-CONTRACTS die technischen Regeln fest, nach denen sämtliche Komponenten implementiert werden müssen.

Diese Spezifikation ist für alle KI-Systeme, Entwickler und automatisierten Build-Prozesse gleichermaßen verbindlich.

---

# Mission

Alle Implementierungen des CAPITAL-AI Core müssen

- deterministisch
- reproduzierbar
- nachvollziehbar
- validierbar
- versionierbar
- testbar
- dokumentierbar

sein.

Kein KI-System darf eigenständig von diesen Verträgen abweichen.

---

# Scope

Diese Spezifikation gilt für sämtliche Bestandteile des CAPITAL-AI Core.

Dazu gehören insbesondere

- Documentary Engine
- Platform Director
- Supervisor
- Version Manager
- Quality Center
- Security Center
- Compliance Center
- AI Gateway
- Orchestratoren
- Agenten
- Services
- APIs
- Datenbankmodelle
- Build- und Deployment-Prozesse

---

# Enterprise Authority

ESS-0001-CONTRACTS besitzt höchste Priorität für technische Implementierungen.

Die Rangfolge lautet

ADR

↓

ESS Contracts

↓

Enterprise Specifications (ESS)

↓

Projektdokumentation

↓

Implementierung

Bei Widersprüchen gilt immer die höher priorisierte Ebene.

---

# AI Deterministic Development

Der CAPITAL-AI Core verfolgt den Grundsatz des deterministischen KI-gestützten Software-Engineerings.

Bei identischem Repository, identischen ESS-Dokumenten, identischen ADRs und identischen Contracts muss jede unterstützte KI denselben logischen Lösungsraum erzeugen.

Implementierungen dürfen sich in Details unterscheiden, jedoch nicht in

- Architektur
- Komponentenstruktur
- Verantwortlichkeiten
- Schnittstellen
- Ereignismodell
- Datenmodellen
- Versionsstrategie

---

# Enterprise Design Principles

Alle Komponenten folgen den folgenden Grundprinzipien.

Repository First

Architecture First

Knowledge First

Event First

Version First

Validation First

Documentation First

Automation First

Security by Design

Compliance by Design

Quality by Design

AI Native by Design

---

# Engineering Principles

Jede Implementierung erfüllt mindestens folgende Eigenschaften

Single Responsibility Principle

Open Closed Principle

Dependency Inversion Principle

Composition over Inheritance

Loose Coupling

High Cohesion

Deterministic Behaviour

Idempotent Operations

Observable Processes

Testability

Reusability

Extensibility

---

# Governance Principles

Keine Architekturentscheidung ohne ADR.

Keine Implementierung ohne Contract.

Keine Änderung ohne Versionierung.

Keine Änderung ohne Dokumentation.

Keine Änderung ohne Event.

Keine Änderung ohne Knowledge Update.

Keine Produktionsänderung ohne Validierung.

---

# Production Readiness

Jede Implementierung muss unmittelbar produktionsfähig sein.

Prototypen

temporäre Lösungen

experimenteller Code

Platzhalter

Mock-Implementierungen

TODO-Kommentare

dürfen nicht Bestandteil produktionsreifer Komponenten sein, sofern sie nicht ausdrücklich als Entwicklungsartefakte gekennzeichnet und durch den Platform Director freigegeben wurden.

---

# AI Behaviour Rules

Unterstützte KI-Systeme dürfen

✓ vorhandenen Code analysieren

✓ bestehende Architektur erweitern

✓ Dokumentation erzeugen

✓ Tests erzeugen

✓ Migrationen vorbereiten

✓ Refactorings vorschlagen

Sie dürfen jedoch nicht

✗ bestehende Architekturprinzipien verändern

✗ Contracts ignorieren

✗ ADRs überschreiben

✗ Versionen eigenständig erhöhen

✗ Sicherheitsmechanismen entfernen

✗ Governance-Regeln umgehen

---

# Human Override

Architekturentscheidungen liegen ausschließlich bei autorisierten Projektverantwortlichen.

KI-Systeme besitzen beratende und implementierende Funktionen.

Sie besitzen keine Entscheidungsbefugnis über Enterprise-Governance.

---

# Documentation Requirement

Jede technische Änderung muss mindestens folgende Artefakte aktualisieren oder erzeugen

- Dokumentation
- Knowledge Graph
- Versionsinformationen
- Event Registry (falls betroffen)
- Architekturreferenzen (falls betroffen)
- Tests (falls erforderlich)

---

# Traceability

Jede Änderung muss eindeutig nachvollziehbar sein.

Mindestens zu erfassen sind

- Ursprung
- Änderungsgrund
- Version
- betroffene Komponenten
- betroffene ADRs
- betroffene Dokumentation
- Zeitpunkt
- verantwortliche Instanz (Mensch oder KI)

---

# Quality Gates

Keine Änderung darf integriert werden, bevor mindestens geprüft wurde

✓ Contract-Konformität

✓ Architektur-Konformität

✓ Versionskonformität

✓ Dokumentationsstatus

✓ Teststatus

✓ Sicherheitsauswirkungen

✓ Compliance-Auswirkungen

✓ Build-Ergebnis

---

# Enterprise Compliance

Alle Komponenten müssen

auditierbar

reproduzierbar

deterministisch

erweiterbar

langfristig wartbar

und unabhängig von einem einzelnen KI-Modell implementierbar sein.

---

# Success Criteria

Dieses Kapitel gilt als erfüllt, wenn

✓ alle nachfolgenden Contracts auf diesen Regeln aufbauen

✓ sämtliche KI-Systeme dieselben Governance-Regeln verwenden

✓ Architekturentscheidungen reproduzierbar bleiben

✓ technische Entscheidungen nachvollziehbar dokumentiert werden

✓ keine Implementierung außerhalb der definierten Contracts erfolgt

---

# Integration

Dieses Kapitel bildet die Grundlage für

Chapter 2

Repository Structure Contract

↓

Chapter 3

Directory Contracts

↓

Chapter 4

TypeScript & Interface Contracts

↓

sämtliche weiteren Enterprise Contracts.

---

# End of Chapter 1
---

# Chapter 2

# Repository Structure Contract

## Enterprise Purpose

Dieses Kapitel definiert die verbindliche Repository-Struktur des CAPITAL-AI Core.

Die Repository-Struktur ist Bestandteil der Enterprise-Architektur.

Sie darf nicht eigenständig verändert oder erweitert werden.

Neue Verzeichnisse oder strukturelle Änderungen benötigen einen Architecture Decision Record (ADR).

---

# Mission

Jede Datei besitzt einen eindeutig definierten Speicherort.

Jeder Ordner besitzt genau eine Verantwortung.

Jede KI erzeugt identische Projektstrukturen.

Die Repository-Struktur bleibt langfristig stabil und reproduzierbar.

---

# Enterprise Principle

Die Struktur folgt dem Prinzip

Architecture before Implementation.

Die Architektur bestimmt den Speicherort.

Nicht die Implementierung.

---

# Repository Root

Die oberste Ebene des Repositories besitzt ausschließlich folgende Verzeichnisse.

```text
.ai/
docs/
scripts/
src/
supabase/
tests/
public/
dist/
```

Weitere Root-Verzeichnisse dürfen ausschließlich über einen ADR eingeführt werden.

---

# Root Responsibilities

## .ai/

Enthält ausschließlich KI-bezogene Artefakte.

Beispiele

Skills

Prompts

Contracts

Templates

Schemas

Registries

Knowledge Seeds

---

## docs/

Enterprise-Dokumentation

Architecture

ADR

Compliance

Security

Migration

Release

Quality

Knowledge

---

## scripts/

Build

Migration

Deployment

Automation

Maintenance

Validation

---

## src/

Gesamter Quellcode der Plattform.

Keine Dokumentation.

Keine Build-Artefakte.

Keine generierten Reports.

---

## supabase/

Migrationen

Policies

Functions

RPC

Schema

Seed-Dateien

Storage-Konfiguration

---

## tests/

Integration

Unit

Contract

Architecture

Performance

Security

End-to-End

---

## public/

Statische Web-Ressourcen.

---

## dist/

Build-Ausgabe.

Dieses Verzeichnis wird niemals manuell geändert.

---

# Source Structure

Der gesamte Plattformcode befindet sich ausschließlich unter

```text
src/
```

---

# Platform Structure

Die Enterprise-Komponenten befinden sich ausschließlich unter

```text
src/platform/
```

Die Platform-Ebene enthält ausschließlich zentrale Plattformdienste.

---

# Mandatory Platform Modules

```text
src/platform/

Documentary/

PlatformDirector/

Supervisor/

VersionManager/

Knowledge/

Architecture/

Discovery/

Registry/

Events/

Contracts/

Models/

Interfaces/

Validators/

Generators/

Plugins/

Telemetry/

Quality/

Security/

Compliance/

Release/

Shared/
```

Diese Struktur ist verbindlich.

---

# Documentary Structure

```text
src/platform/Documentary/

Engine/

Discovery/

Knowledge/

Documentation/

Architecture/

Migration/

Versioning/

Events/

Registry/

Generators/

Validators/

Templates/

Mermaid/

Plugins/

Types/

Models/

Interfaces/

Contracts/

Utils/
```

Jedes Unterverzeichnis besitzt genau eine Verantwortung.

---

# Shared Structure

Gemeinsam genutzte Komponenten befinden sich ausschließlich unter

```text
src/platform/Shared/
```

Beispiele

Utilities

Logger

Errors

Configuration

Constants

Types

Base Classes

Helper

---

# Feature Isolation

Geschäftslogik gehört niemals in

Shared

Platform

oder Documentary.

Sie wird ausschließlich in ihren jeweiligen Domänen implementiert.

Beispiele

```text
src/features/

crypto/

stocks/

portfolio/

billing/

news/

users/

settings/
```

---

# Configuration

Konfigurationen befinden sich ausschließlich unter

```text
src/config/
```

Keine Konfiguration innerhalb von Services.

---

# Environment

```text
.env.example

.env.local

.env.production
```

Secrets werden niemals im Repository gespeichert.

---

# Naming Rules

Verzeichnisse verwenden ausschließlich PascalCase.

Beispiele

```text
PlatformDirector/

VersionManager/

Knowledge/

Documentary/
```

Keine Leerzeichen.

Keine Sonderzeichen.

Keine Abkürzungen ohne Definition.

---

# File Placement Rules

Jede Datei besitzt genau einen Speicherort.

Eine Datei darf niemals dieselbe Verantwortung wie eine andere Datei besitzen.

Keine doppelten Implementierungen.

Keine alternativen Versionen derselben Klasse.

---

# Generated Files

Automatisch erzeugte Dateien werden ausschließlich innerhalb definierter Generator-Verzeichnisse gespeichert.

Beispiele

```text
Generated/

Reports/

Snapshots/
```

Generierter Code darf produktiven Code niemals überschreiben.

---

# Documentation Placement

Dokumentation befindet sich ausschließlich in

```text
docs/
```

Ausnahmen

README.md

CHANGELOG.md

LICENSE

CODE_OF_CONDUCT.md

CONTRIBUTING.md

---

# AI Resources

Alle KI-Artefakte befinden sich ausschließlich unter

```text
.ai/
```

Beispiele

```text
.ai/

skills/

prompts/

contracts/

templates/

schemas/

registry/

knowledge/
```

---

# Import Boundaries

Eine Komponente darf ausschließlich auf definierte Ebenen zugreifen.

Beispiel

```text
Shared

↓

Contracts

↓

Models

↓

Services

↓

Generators

↓

Documentary

↓

Supervisor

↓

Platform Director
```

Zirkuläre Abhängigkeiten sind nicht zulässig.

---

# Repository Validation

Vor jedem Build wird geprüft

✓ Ordnerstruktur vollständig

✓ keine unbekannten Root-Verzeichnisse

✓ keine doppelten Komponenten

✓ keine verbotenen Speicherorte

✓ keine Architekturverletzungen

✓ keine verwaisten Dateien

---

# Enterprise Rules

Keine Datei außerhalb der definierten Struktur.

Keine spontanen Verzeichnisse.

Keine gemischten Verantwortlichkeiten.

Keine Dokumentation innerhalb produktiver Komponenten.

Keine Build-Artefakte im Quellcode.

Keine Testdateien außerhalb des Testbereichs.

---

# Success Criteria

Dieses Kapitel gilt als erfüllt wenn

✓ jede Datei eindeutig eingeordnet werden kann

✓ jede KI dieselbe Repository-Struktur erzeugt

✓ keine Architekturentscheidungen während der Implementierung getroffen werden müssen

✓ alle Komponenten eindeutig lokalisiert sind

✓ die Repository-Struktur langfristig stabil bleibt

---

# Integration

Dieses Kapitel bildet die Grundlage für

Chapter 3

Directory Contracts

↓

Chapter 4

Interface Contracts

↓

Chapter 5

Enterprise Naming Contracts

↓

sämtliche nachfolgenden technischen Contracts.

---

# End of Chapter 2
---

# Chapter 3

# Directory Responsibility Contracts

## Enterprise Purpose

Dieses Kapitel definiert die verbindlichen Verantwortlichkeiten sämtlicher Verzeichnisse innerhalb des CAPITAL-AI Core.

Jedes Verzeichnis besitzt genau eine klar definierte Aufgabe.

Verantwortlichkeiten dürfen sich nicht überschneiden.

Jede Klasse, jedes Interface, jedes Datenmodell und jede Ressource besitzt einen eindeutig definierten Speicherort.

---

# Mission

Die Directory Contracts gewährleisten

- eindeutige Verantwortlichkeiten
- reproduzierbare Projektstrukturen
- deterministische Codegenerierung
- klare Abhängigkeitsregeln
- langfristige Wartbarkeit
- modulare Erweiterbarkeit

---

# Enterprise Principle

Ein Verzeichnis besitzt genau eine Verantwortung.

Eine Verantwortung besitzt genau ein Verzeichnis.

---

# Directory Contract Model

Jedes Verzeichnis definiert

- Zweck
- erlaubte Inhalte
- verbotene Inhalte
- zulässige Abhängigkeiten
- verbotene Abhängigkeiten
- Eigentümer
- Lebenszyklus

---

# Core Directory

## src/platform/Core

### Purpose

Technische Basis der gesamten Plattform.

### Contains

Base Classes

Core Interfaces

Core Types

Core Events

Core Contracts

Core Errors

Lifecycle

Logging

Telemetry

Utilities

### Forbidden

Business Logic

Feature Code

API Endpoints

UI

Database Queries

Domain Services

### Accessible by

Alle Plattformkomponenten.

---

# Documentary Directory

## src/platform/Documentary

### Purpose

Codebasierte Dokumentation und Repository Intelligence.

### Contains

Repository Discovery

Architecture Discovery

Knowledge Generation

Documentation Generation

Migration Analysis

Impact Analysis

Version Intelligence

Documentation Templates

Mermaid Generator

Markdown Generator

Registry Synchronisation

### Forbidden

Business Logic

Frontend

REST APIs

Feature Implementierungen

Produktive Geschäftsprozesse

---

# Knowledge Directory

## src/platform/Knowledge

### Purpose

Zentrale Wissensbasis der Plattform.

### Contains

Knowledge Graph

Knowledge Objects

Relationships

Semantic Models

Knowledge Registry

Knowledge Validation

### Forbidden

Dokumentengenerierung

Frontend

Business Services

---

# Platform Director

## src/platform/PlatformDirector

### Purpose

Strategische Steuerung der gesamten Plattform.

### Contains

Governance

Policy Engine

Enterprise Coordination

Decision Engine

Workflow Orchestration

### Forbidden

Business Logic

Repository Analyse

Dokumentengenerierung

---

# Supervisor

## src/platform/Supervisor

### Purpose

Operative Überwachung sämtlicher Plattformprozesse.

### Contains

Health Monitoring

Lifecycle Management

Status Monitoring

Event Coordination

Alerting

Recovery

### Forbidden

Architekturentscheidungen

Business Services

Feature Code

---

# Version Manager

## src/platform/VersionManager

### Purpose

Versionierung der gesamten Plattform.

### Contains

Semantic Versioning

Release Preparation

Version Registry

Version Validation

Impact Classification

Change Tracking

### Forbidden

Business Logic

Feature Code

REST APIs

---

# Registry

## src/platform/Registry

### Purpose

Zentrale Registrierung aller Plattformobjekte.

### Contains

Component Registry

Service Registry

Plugin Registry

Generator Registry

Agent Registry

Workflow Registry

Template Registry

### Forbidden

Business Services

Knowledge Generation

UI

---

# Discovery

## src/platform/Discovery

### Purpose

Erkennung neuer Plattformkomponenten.

### Contains

Repository Scanner

Dependency Scanner

Architecture Scanner

Module Scanner

Component Discovery

### Forbidden

Dokumentengenerierung

Business Code

---

# Events

## src/platform/Events

### Purpose

Enterprise Event Definitionen.

### Contains

Event Definitions

Event Types

Event Registry

Event Contracts

Event Metadata

### Forbidden

Business Logic

Repository Scan

Versioning

---

# Contracts

## src/platform/Contracts

### Purpose

Globale technische Verträge.

### Contains

Interfaces

Contracts

Schemas

Validation Rules

### Forbidden

Implementierungen

Business Logic

---

# Models

## src/platform/Models

### Purpose

Gemeinsame Enterprise Datenmodelle.

### Contains

DTOs

Entities

Metadata

Shared Models

### Forbidden

Services

Controller

Business Logic

---

# Interfaces

## src/platform/Interfaces

### Purpose

Globale Plattforminterfaces.

### Contains

Interface Definitionen

Public Contracts

Shared Interfaces

### Forbidden

Implementierungen

---

# Validators

## src/platform/Validators

### Purpose

Validierung sämtlicher Plattformobjekte.

### Contains

Schema Validation

Contract Validation

Architecture Validation

Repository Validation

Knowledge Validation

### Forbidden

Business Logic

---

# Generators

## src/platform/Generators

### Purpose

Automatische Code- und Dokumentengenerierung.

### Contains

Markdown Generator

ADR Generator

Mermaid Generator

Code Generator

Documentation Generator

### Forbidden

Repository Discovery

Business Services

---

# Plugins

## src/platform/Plugins

### Purpose

Erweiterungspunkte der Plattform.

### Contains

Plugin Loader

Plugin Contracts

Plugin Registry

Plugin Metadata

### Forbidden

Business Logik

---

# Telemetry

## src/platform/Telemetry

### Purpose

Technische Metriken.

### Contains

Metrics

Tracing

Performance

Observability

Health Metrics

### Forbidden

Business Logic

---

# Quality

## src/platform/Quality

### Purpose

Qualitätssicherung.

### Contains

Quality Gates

Architecture Checks

Static Analysis

Coverage

Code Metrics

### Forbidden

Business Logic

---

# Security

## src/platform/Security

### Purpose

Technische Sicherheitsdienste.

### Contains

Security Validation

Security Policies

Secrets Validation

IAM Integration

Risk Detection

### Forbidden

Business Features

---

# Compliance

## src/platform/Compliance

### Purpose

Compliance und Audit.

### Contains

Audit Reports

Compliance Rules

Policy Validation

Risk Reports

Governance Reports

### Forbidden

Business Logic

---

# Release

## src/platform/Release

### Purpose

Release Management.

### Contains

Release Planning

Deployment Reports

Release Validation

Rollback Planning

### Forbidden

Repository Discovery

Knowledge Generation

---

# Shared

## src/platform/Shared

### Purpose

Gemeinsam genutzte Infrastruktur.

### Contains

Shared Utilities

Constants

Shared Types

Configuration Helpers

### Forbidden

Business Logic

Feature Implementierungen

---

# Directory Ownership

Jedes Verzeichnis besitzt genau einen fachlichen Eigentümer.

Änderungen an einem Verzeichnis dürfen ausschließlich innerhalb seiner definierten Verantwortung erfolgen.

---

# Directory Expansion Rules

Neue Unterverzeichnisse dürfen ausschließlich entstehen wenn

- eine neue Verantwortung entsteht
- keine bestehende Verantwortung erweitert werden kann
- ein ADR die Erweiterung genehmigt

---

# Directory Validation

Vor jeder Integration wird geprüft

✓ Verantwortlichkeit eindeutig

✓ keine doppelte Verantwortung

✓ keine Architekturverletzung

✓ keine unerlaubten Inhalte

✓ Contract-Konformität

✓ Import-Konformität

---

# Enterprise Rules

Keine Klasse außerhalb ihrer Verantwortung.

Keine Vermischung technischer und fachlicher Logik.

Keine mehrfachen Implementierungen derselben Verantwortung.

Keine Querverweise außerhalb der definierten Abhängigkeitsregeln.

---

# Success Criteria

Dieses Kapitel gilt als erfüllt wenn

✓ jede Datei einem eindeutigen Verzeichnis zugeordnet werden kann

✓ keine Verantwortungsüberschneidungen existieren

✓ sämtliche KI-Systeme identische Ablagestrukturen erzeugen

✓ die Plattform langfristig modular erweiterbar bleibt

---

# Integration

Dieses Kapitel bildet die Grundlage für

Chapter 4

TypeScript & Interface Contracts

↓

Chapter 5

Enterprise Naming Contracts

↓

Chapter 6

Dependency Contracts

---

# End of Chapter 3
---

# Chapter 4

# TypeScript & Interface Contracts

## Enterprise Purpose

Dieses Kapitel definiert die verbindlichen TypeScript-, Interface- und Contract-Regeln des CAPITAL-AI Core.

Alle Plattformkomponenten verwenden dieselben technischen Standards.

Es dürfen keine individuellen Implementierungsstile entstehen.

Alle KI-Systeme müssen identische öffentliche Schnittstellen erzeugen.

---

# Mission

Die TypeScript Contracts gewährleisten

- deterministische Codegenerierung

- starke Typisierung

- reproduzierbare APIs

- modulare Erweiterbarkeit

- hohe Testbarkeit

- langfristige Wartbarkeit

---

# Enterprise Principle

Interfaces beschreiben Verhalten.

Klassen implementieren Verhalten.

Typen beschreiben Daten.

Contracts definieren Regeln.

Keine Implementierung existiert ohne Contract.

---

# TypeScript Standard

Der gesamte CAPITAL-AI Core verwendet ausschließlich

TypeScript

Strict Mode

ES Modules

ECMAScript Latest

Node LTS

---

# Compiler Rules

Folgende Compileroptionen sind verpflichtend

strict

noImplicitAny

strictNullChecks

noUncheckedIndexedAccess

exactOptionalPropertyTypes

noImplicitOverride

useUnknownInCatchVariables

noFallthroughCasesInSwitch

noImplicitReturns

forceConsistentCasingInFileNames

---

# Language Rules

Verboten

any

var

namespace

enum

Nicht typisierte Funktionen

Nicht typisierte Parameter

Implizite Rückgabetypen

Erlaubt

interface

type

class

readonly

async/await

Generics

Union Types

Discriminated Unions

---

# Interface Contracts

Alle öffentlichen Komponenten besitzen mindestens ein Interface.

Beispiel

RepositoryScanner

↓

IRepositoryScanner

KnowledgeRegistry

↓

IKnowledgeRegistry

VersionManager

↓

IVersionManager

DocumentGenerator

↓

IDocumentGenerator

Supervisor

↓

ISupervisor

---

# Interface Responsibilities

Interfaces enthalten ausschließlich

Methodensignaturen

Eigenschaften

Dokumentation

Typdefinitionen

Keine Logik.

Keine Implementierung.

---

# Base Interfaces

Die Plattform definiert zentrale Basisinterfaces.

Mindestens

IComponent

IService

IEngine

IRegistry

IValidator

IGenerator

IProvider

IConsumer

IPlugin

IEvent

ILifecycle

IHealthCheck

IRepositoryObject

IKnowledgeObject

IVersioned

---

# Class Contracts

Jede Klasse

implementiert mindestens ein Interface

besitzt genau eine Verantwortung

ist vollständig typisiert

ist testbar

ist dokumentiert

---

# Constructor Rules

Abhängigkeiten werden ausschließlich über Dependency Injection übergeben.

Keine Klasse erzeugt ihre eigenen Abhängigkeiten.

---

# Type Contracts

Komplexe Daten werden ausschließlich über

type

oder

interface

beschrieben.

Inline-Objekte sind zu vermeiden.

---

# Generic Contracts

Generics werden verwendet wenn

Komponenten mehrfach wiederverwendbar sind.

Beispiel

Registry<T>

Generator<T>

Validator<T>

Provider<T>

Repository<T>

---

# Naming Rules

Interfaces

IRepositoryScanner

IKnowledgeRegistry

IVersionProvider

ISupervisor

IPlatformComponent

Klassen

RepositoryScanner

KnowledgeRegistry

VersionManager

Supervisor

PlatformDirector

Typen

RepositoryMetadata

KnowledgeNode

EventPayload

ArchitectureSnapshot

---

# Export Rules

Jede öffentliche Komponente exportiert ausschließlich

öffentliche Interfaces

öffentliche Typen

öffentliche Klassen

Interne Hilfsklassen bleiben privat.

---

# File Structure

Pro Datei

eine Hauptklasse

ein Hauptinterface

zusätzliche Helper ausschließlich wenn logisch zusammengehörig.

Keine Sammeldateien mit mehreren unabhängigen Klassen.

---

# Dependency Injection

Pflicht

Constructor Injection

Factory Injection

Provider Injection

Nicht erlaubt

globale Singletons

versteckte Abhängigkeiten

Service Locator Pattern

---

# Async Contracts

Asynchrone Methoden liefern ausschließlich

Promise<T>

Keine Callback APIs.

Keine EventEmitter-Abhängigkeiten innerhalb der Businesslogik.

---

# Error Contracts

Fehler werden ausschließlich über typisierte Error-Klassen behandelt.

Keine

throw "Error"

throw "String"

throw 123

Erlaubt

throw new RepositoryError()

throw new ValidationError()

throw new ContractViolationError()

---

# Documentation Rules

Jede öffentliche Klasse

besitzt

Beschreibung

Zweck

Parameter

Rückgabewerte

Beispiele

ESS Referenz

ADR Referenz

---

# Testing Contracts

Jede öffentliche Klasse besitzt mindestens

Unit Test

Contract Test

Optional

Integration Test

Performance Test

Architecture Test

---

# Import Rules

Relative Imports nur innerhalb derselben Komponente.

Komponentenübergreifend ausschließlich Alias Imports.

Beispiel

@platform/Core

@platform/Documentary

@platform/Supervisor

@platform/VersionManager

---

# Forbidden

Keine zyklischen Imports.

Keine impliziten Typen.

Keine any-Typen.

Keine globalen Variablen.

Keine statischen Utility-Klassen ohne Begründung.

Keine versteckten Seiteneffekte.

---

# Validation

Vor jeder Integration wird geprüft

✓ Strict Mode

✓ Typisierung vollständig

✓ Interface vorhanden

✓ Contract erfüllt

✓ Dependency Injection

✓ Test vorhanden

✓ Dokumentation vorhanden

✓ Naming korrekt

---

# Enterprise Rules

Jede öffentliche Klasse implementiert mindestens ein Interface.

Jede Klasse besitzt genau eine Verantwortung.

Jede öffentliche API ist vollständig typisiert.

Jede Änderung bleibt rückwärts nachvollziehbar.

Alle Interfaces sind Bestandteil der Enterprise Contracts.

---

# Success Criteria

Dieses Kapitel gilt als erfüllt wenn

✓ keine Klasse ohne Interface existiert

✓ keine Klasse "any" verwendet

✓ sämtliche APIs vollständig typisiert sind

✓ alle Komponenten dieselben Interface-Regeln verwenden

✓ alle KI-Systeme identische Schnittstellen erzeugen

✓ der gesamte Core deterministisch implementierbar bleibt

---

# Integration

Dieses Kapitel bildet die Grundlage für

Chapter 5

Enterprise Naming Contracts

↓

Chapter 6

Dependency Contracts

↓

Chapter 7

Enterprise Data Models

---

# End of Chapter 4
