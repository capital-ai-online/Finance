---
skill:
  id: ESS-0010
  name: Documentary Engine
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
  type: Technical Specification
  role: Technische Spezifikation der Documentary Engine
  contractAuthority: ESS-0001-CONTRACTS
  foundationalDocument: ESS-0001
  note: >
    Dieses Dokument enthält ausschließlich technische Spezifikationsinhalte.
    Vision, Motivation und historische Architekturbegründung verbleiben in ESS-0001.

authority:

  controls:
    - Repository Discovery
    - Code Discovery
    - Knowledge Graph
    - Enterprise Registry
    - Contract Validation
    - Architecture Reports
    - Release Reports
    - Impact Analysis
    - Version Reports
    - AI Audit Trail
    - Digital Twin

  collaborates:
    - Platform Director
    - Supervisor
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
    - Enterprise Specifications
    - Architecture Decision Records

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0011
    - ESS-0011-CONTRACTS
  relatedAdr:
    - ADR-0010
    - ADR-0011
    - ADR-0012
  relatedComponents:
    - src/platform/Documentary
    - src/platform/Knowledge
    - src/platform/Discovery
    - src/platform/Registry
    - src/platform/Architecture
    - src/platform/Generators
    - src/platform/Validators
    - src/platform/Events
  relatedSkills:
    - .ai/skills/ESS-0001-Documentary-Architect.md
    - .ai/skills/ESS-0001-Contracts.md

created: 2026-07-31
---

# Documentary Engine

## Enterprise Purpose

Dieses Dokument ist die verbindliche technische Spezifikation der CAPITAL-AI Documentary
Engine.

ESS-0001 beschreibt die Vision und den ursprünglichen Architekturentwurf.

ESS-0001-CONTRACTS definiert die globalen Enterprise Contracts, denen die Documentary Engine
unterliegt — insbesondere Chapter 15 (Knowledge Graph), Chapter 17 (AI Orchestration),
Chapter 18 (Digital Twin) und Chapter 19 (Automation).

Dieses Dokument beschreibt ausschließlich, **wie** die Documentary Engine technisch aufgebaut
ist: Komponenten, Services, APIs, Events, Workflows, Trigger, Discovery, Registry, Digital Twin
und Integration.

Es enthält keine Vision, keine Motivation und keine historischen Inhalte.

---

# Abgrenzung

| Dokument | Verantwortung |
|---|---|
| ESS-0001 | Vision, Zielbild, Designprinzipien, ursprünglicher Entwurf |
| ESS-0001-CONTRACTS | globale Contracts, denen die Engine unterliegt |
| **ESS-0010** | **technische Spezifikation der Engine** |
| ESS-0011 | Traceability Matrix, die die Engine speist |

Bei Abweichungen zwischen ESS-0001 und diesem Dokument besitzt dieses Dokument Vorrang.

Bei Abweichungen zwischen diesem Dokument und ESS-0001-CONTRACTS besitzt
ESS-0001-CONTRACTS Vorrang.

---

# Position in der Architektur

Gemäß ESS-0001-CONTRACTS Chapter 6 befindet sich die Documentary Engine im Documentary Layer.

```text
Platform Director
        │
Supervisor
        │
Version Manager
        │
Documentary          ← ESS-0010
        │
Knowledge
        │
Discovery
        │
Registry
        │
Shared
        │
Core
```

Zulässige Abhängigkeiten: Core, Shared, Registry, Discovery, Knowledge.

Die Documentary Engine besitzt niemals Abhängigkeiten auf Version Manager, Supervisor oder
Platform Director. Die Kommunikation nach oben erfolgt ausschließlich über Enterprise Events.

---

# End of Chapter 1

---

# Chapter 2

# Komponentenarchitektur

## Enterprise Purpose

Dieses Kapitel definiert die verbindliche innere Struktur der Documentary Engine.

---

# Verzeichnisstruktur

Die in ESS-0001-CONTRACTS Chapter 2 festgelegte Struktur ist verbindlich.

```text
src/platform/Documentary/

Engine/          Ausführungssteuerung und Orchestrierung
Discovery/       Repository- und Code-Erkennung
Knowledge/       Wissensaufbau
Documentation/   Dokumenterzeugung
Architecture/    Architekturanalyse
Migration/       Migrationsanalyse
Versioning/      Versionsbewertung
Events/          Event-Erzeugung und -Konsum
Registry/        Registrierung erzeugter Artefakte
Generators/      Generatoren je Dokumenttyp
Validators/      Validatoren der Engine
Templates/       Dokumentvorlagen
Mermaid/         Diagrammerzeugung
Plugins/         Erweiterungen
Types/           Typdefinitionen
Models/          Datenmodelle
Interfaces/      öffentliche Schnittstellen
Contracts/       komponentenspezifische Contracts
Utils/           Hilfsfunktionen
```

Jedes Unterverzeichnis besitzt genau eine Verantwortung gemäß Chapter 3.

---

# Kernkomponenten

Die Documentary Engine besteht aus sieben Kernkomponenten.

## DocumentaryEngine

Zentrale Ausführungssteuerung.

Verantwortung

Ablaufsteuerung

Reihenfolge der Analysestufen

Fehlerbehandlung

Ergebniszusammenführung

Event-Erzeugung

---

## DiscoveryService

Repository- und Code-Erkennung.

Verantwortung

Dateierkennung

Klassifizierung

Metadatenerfassung

Technologieerkennung

Duplikaterkennung

---

## KnowledgeBuilder

Aufbau des Enterprise Knowledge Graph.

Verantwortung

Knotenerzeugung

Beziehungsableitung

Ursprungsnachweis

Prüfsummenbildung

---

## ArchitectureAnalyzer

Architekturanalyse.

Verantwortung

Layer-Prüfung

Abhängigkeitsanalyse

Verletzungserkennung

Metrikberechnung

---

## DocumentationGenerator

Dokumenterzeugung.

Verantwortung

Auswahl des Generators

Anwendung der Vorlage

Metadatenanreicherung

Kennzeichnung als generiert

---

## TwinSynchronizer

Digital-Twin-Abgleich.

Verantwortung

Twin-Aufbau

Drift-Erkennung

Snapshot-Erzeugung

Zustandsbestimmung

---

## ReportEngine

Berichtserzeugung.

Verantwortung

Architecture Reports

Release Reports

Impact Analysen

Version Reports

Governance Reports

---

# Komponentenbeziehungen

```text
DocumentaryEngine
        │
        ├─→ DiscoveryService ──→ Repository
        │
        ├─→ KnowledgeBuilder ──→ Knowledge Graph
        │
        ├─→ ArchitectureAnalyzer
        │
        ├─→ TwinSynchronizer ──→ Digital Twin
        │
        ├─→ DocumentationGenerator ──→ docs/
        │
        └─→ ReportEngine ──→ docs/
```

Die Reihenfolge ist verbindlich und deterministisch.

Keine Komponente überspringt eine vorgelagerte Stufe.

---

# End of Chapter 2

---

# Chapter 3

# Services und Interfaces

## Enterprise Purpose

Dieses Kapitel definiert die öffentlichen Schnittstellen der Documentary Engine.

---

# Interface Contract

Sämtliche Interfaces folgen den Regeln aus ESS-0001-CONTRACTS Chapter 4.

Verbindlich sind folgende öffentliche Interfaces.

---

## IDocumentaryEngine

```text
execute(trigger)          vollständiger Durchlauf
executeIncremental(scope) teilweiser Durchlauf
describe()                Selbstbeschreibung
```

---

## IDiscoveryProvider

```text
scanRepository()          vollständiger Repository-Scan
scanPath(path)            gezielter Scan
classify(file)            Klassifizierung genau einer Datei
detectDuplicates()        Duplikaterkennung
```

---

## IKnowledgeBuilder

```text
build()                   vollständiger Aufbau
update(delta)             inkrementelle Aktualisierung
validate()                Konsistenzprüfung
checksum()                reproduzierbare Prüfsumme
```

---

## IDocumentationGenerator

```text
supports(type)            Typunterstützung
generate(input)           Artefakterzeugung
version()                 Generatorversion
```

---

## IDigitalTwin

```text
synchronize()             Abgleich mit dem Repository
state()                   aktueller Twin-Zustand
drift()                   erkannte Abweichungen
snapshot(version)         Zustandssicherung
simulate(plan)            geplanter Zwilling
```

---

## IReportEngine

```text
generate(reportType)      Berichtserzeugung
list()                    verfügbare Berichtstypen
```

---

# Interface Rules

Sämtliche Methoden sind asynchron gemäß Chapter 4, *Async Contracts*.

Sämtliche Methoden sind idempotent.

Kein Interface gibt veränderbare interne Zustände zurück.

Kein Interface erlaubt Schreibzugriff auf produktiven Code.

---

# End of Chapter 3

---

# Chapter 4

# Workflows und Trigger

## Enterprise Purpose

Dieses Kapitel definiert die verbindlichen Abläufe der Documentary Engine.

---

# Hauptworkflow

```text
Trigger
   ↓
Discovery
   ↓
Code Intelligence
   ↓
Knowledge Build
   ↓
Knowledge Validation
   ↓
Architecture Analysis
   ↓
Twin Synchronisation
   ↓
Drift Detection
   ↓
Documentation Generation
   ↓
Report Generation
   ↓
Registry Update
   ↓
Event Publication
```

Keine Stufe darf übersprungen werden.

Bricht eine Stufe ab, werden nachgelagerte Stufen nicht ausgeführt.

---

# Trigger Contract

Die Documentary Engine wird ausschließlich ereignisgesteuert ausgelöst.

Verbindlich gemäß ESS-0001-CONTRACTS Chapter 17, *Documentary Trigger Contract*:

| Auslöser | Umfang |
|---|---|
| Repository-Änderung | inkrementell |
| Metadatenänderung | inkrementell |
| Contract-Änderung | vollständig |
| ESS-Änderung | vollständig |
| ADR-Änderung | inkrementell |
| Versionsänderung | vollständig |
| Migration | vollständig |
| Plugin-Registrierung | inkrementell |
| Security Review | inkrementell |
| Compliance Review | inkrementell |

Die Documentary Engine ist niemals optional.

---

# Incremental Execution

Ein inkrementeller Durchlauf verarbeitet ausschließlich den geänderten Umfang und dessen
Abhängigkeiten gemäß Knowledge Graph.

Ein inkrementeller Durchlauf erzeugt dieselben Ergebnisse wie ein vollständiger Durchlauf,
beschränkt auf den betroffenen Teilgraphen.

Weicht das Ergebnis ab, gilt der inkrementelle Durchlauf als fehlerhaft.

---

# Abort Contract

Ein Durchlauf bricht verbindlich ab bei

fehlender Repository-Lesbarkeit

Schema-Verletzung in Metadaten

Wissenskonflikt ohne Auflösung

nicht reproduzierbarer Prüfsumme

Jeder Abbruch erzeugt ein Fehler-Event und einen Befund.

---

# End of Chapter 4

---

# Chapter 5

# Discovery und Registry

## Enterprise Purpose

Dieses Kapitel definiert Erkennung und Registrierung.

---

# Discovery Scope

Die Discovery erfasst verbindlich

Repository-Struktur

Dateien und Klassifizierung

Konfigurationsdateien

Plattformmodule

Feature-Domänen

Datenbankartefakte

Dokumentation

AI-Artefakte

Legacy-Bestand

Ausnahmen gemäß Exception Registry

---

# Classification Contract

Jede Datei erhält exakt eine Hauptklassifizierung.

Eine Doppelklassifizierung ist unzulässig.

Nicht klassifizierbare Dateien erhalten `Unknown` und erzeugen einen Befund.

---

# Registry Contract

Die Documentary Engine registriert erzeugte und erkannte Artefakte in der Enterprise Registry
gemäß ESS-0001-CONTRACTS Chapter 7.

Verbindlich registriert werden

Komponenten

Interfaces

Events

Plugins

Generatoren

Validatoren

Dokumente

Legacy-Bestand

Die Documentary Engine ist erzeugende Instanz der Registry.

Sie verändert niemals Registry-Einträge, die von anderen Instanzen stammen.

---

# Registry Boundaries

Die Registry beschreibt Existenz, Identität und Status.

Der Knowledge Graph beschreibt Bedeutung, Beziehungen und Historie.

Die Trennung ist in ESS-0001-CONTRACTS Chapter 15, *Registry Relationship*, verbindlich
festgelegt und wird hier nicht erweitert.

---

# End of Chapter 5

---

# Chapter 6

# Events

## Enterprise Purpose

Dieses Kapitel definiert die von der Documentary Engine erzeugten und konsumierten Events.

Sämtliche Namen folgen dem Naming Contract aus ESS-0001-CONTRACTS Chapter 8.

---

# Erzeugte Events

DocumentaryExecutionStartedEvent

DocumentaryExecutionCompletedEvent

DocumentaryExecutionFailedEvent

RepositoryScannedEvent

CodeAnalyzedEvent

KnowledgeBuildStartedEvent

KnowledgeCreatedEvent

KnowledgeUpdatedEvent

KnowledgeValidatedEvent

KnowledgeConflictDetectedEvent

ArchitectureScannedEvent

ArchitectureValidatedEvent

TwinSynchronizedEvent

TwinDriftDetectedEvent

TwinSnapshotCreatedEvent

DocumentationGeneratedEvent

DocumentationValidatedEvent

DiagramGeneratedEvent

ReportGeneratedEvent

ComponentRegisteredEvent

ContractViolationEvent

---

# Konsumierte Events

ImplementationCompletedEvent

VersionChangedEvent

MigrationCompletedEvent

PluginRegisteredEvent

ExceptionRegisteredEvent

SecurityScanCompletedEvent

ComplianceValidatedEvent

---

# Correlation

Die Documentary Engine übernimmt die Correlation ID des auslösenden Events unverändert.

Eine eigene Correlation ID entsteht ausschließlich bei zeitgesteuerten Vollprüfungen.

---

# End of Chapter 6

---

# Chapter 7

# Digital Twin

## Enterprise Purpose

Dieses Kapitel definiert die technische Umsetzung des Digital Twin.

Die verbindlichen Regeln stehen in ESS-0001-CONTRACTS Chapter 18 und werden hier nicht
wiederholt, sondern ausschließlich technisch konkretisiert.

---

# Twin Aufbau

```text
Repository
   ↓
Discovery
   ↓
Knowledge Graph
   ↓
TwinSynchronizer
   ↓
.ai/knowledge/twin/
```

Der Abgleich erfolgt ausschließlich in dieser Richtung.

Der Twin verändert niemals Repository oder Metadaten.

---

# Twin Artefakte

```text
.ai/knowledge/twin/
  current.json     aktueller Zustand
  planned.json     geplanter Zustand
  drift.json       erkannte Abweichungen
  history/         Snapshots je Version
```

---

# Drift Detection

Drift wird ausschließlich durch Vergleich von Prüfsummen und Strukturen erkannt.

Verglichen werden

Quellcode gegen Twin-Modell

Metadaten gegen Twin-Modell

Registry gegen Twin-Modell

Knowledge Graph gegen Twin-Modell

Version gegen Twin-Version

Die zulässige Drift beträgt null.

---

# Twin Zustände

Synchronized

Drifted

Stale

Incomplete

Unknown

Ausschließlich `Synchronized` ist produktionsfreigabefähig.

---

# End of Chapter 7

---

# Chapter 8

# Integration

## Enterprise Purpose

Dieses Kapitel definiert die Einbettung der Documentary Engine in die Plattform.

---

# Stellung in der Wertschöpfungskette

Die Documentary Engine bildet Stufe 3 der in ESS-0001-CONTRACTS Chapter 17 definierten
AI-Wertschöpfungskette.

```text
Google AI Studio → Claude Code → Documentary Engine → Supervisor →
Platform Director → Version Manager → Release → Production
```

**Eingang** Implementierungsartefakte, Repository-Zustand, Events der Vorstufen

**Ausgang** Knowledge Update, Dokumentation, Architecture Report, Validation Report,
Twin Update

---

# Supervisor Integration

Die Documentary Engine liefert dem Supervisor gemäß ESS-0002

Validierungsergebnisse

Twin-Zustand

Befunde

Dokumentationsstatus

Sie empfängt vom Supervisor keine Weisungen. Der Supervisor bewertet ausschließlich.

---

# Platform Director Integration

Die Documentary Engine liefert dem Platform Director gemäß ESS-0003 die
Entscheidungsgrundlagen.

Sie trifft selbst keine Entscheidungen.

---

# Version Manager Integration

Die Documentary Engine liefert die Grundlage der Versionsbewertung:

geänderte Komponenten

geänderte Interfaces

geänderte Events

Breaking Changes

Impact-Umfang

Die Versionsentscheidung selbst trifft der Version Manager.

---

# Legacy Integration

Bestehende produktionsreife Komponenten werden gemäß ESS-0001-CONTRACTS Chapter 14 über
Adapter angebunden, niemals neu entwickelt.

Betroffen sind insbesondere

`server/documentHygiene.ts`

`server/documentSanitizer.ts`

`server/fileWatcher.ts`

`server/decisionEngine.ts`

Diese Komponenten sind als Legacy zu registrieren und zu kapseln.

Die Zielzuordnung ist in ADR-0011 verbindlich festgelegt.

---

# Enterprise Rules

Keine Dokumentation ohne Knowledge-Referenz.

Keine Ausführung ohne Trigger.

Keine Stufe ohne Event.

Kein Schreibzugriff auf produktiven Code.

Keine Neuentwicklung produktionsreifer Bestandskomponenten.

Keine Entscheidung durch die Documentary Engine.

---

# Success Criteria

Die Documentary Engine gilt als erfolgreich implementiert wenn

✓ jede relevante Änderung sie automatisch auslöst

✓ jeder Durchlauf reproduzierbar identische Ergebnisse erzeugt

✓ der Knowledge Graph vollständig aufgebaut wird

✓ der Digital Twin nach jedem Durchlauf synchron ist

✓ sämtliche Dokumentation generiert statt gepflegt wird

✓ sämtliche erzeugten Artefakte registriert sind

✓ Supervisor und Platform Director jederzeit versorgt sind

---

# Integration

Dieses Dokument bildet die Grundlage für

ESS-0011 — Enterprise Traceability

ESS-0011-CONTRACTS — Enterprise Traceability Matrix Contracts

---

# Enterprise Final Summary

## ESS-0010 Status

**Document ID** ESS-0010

**Titel** CAPITAL-AI Documentary Engine

**Status** Enterprise Specification

**Version** 1.0.0

**Lifecycle Status** Approved Enterprise Specification

---

# Governance Statement

ESS-0010 ist die verbindliche technische Spezifikation der Documentary Engine innerhalb des
CAPITAL-AI Core.

Sie baut vollständig auf ESS-0001 und ESS-0001-CONTRACTS auf.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste technische Spezifikation der Documentary Engine |

---

# Approval

Document Status

APPROVED

Enterprise Specification

CAPITAL-AI Core Architecture

Version 1.0.0

---

# End of Document

ESS-0010

CAPITAL-AI Documentary Engine

Enterprise Specification

Version 1.0.0
