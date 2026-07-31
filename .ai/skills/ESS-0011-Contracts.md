# ESS-0011-CONTRACTS

## Enterprise Traceability Matrix Contracts

### Version

1.0.0

### Status

Enterprise Specification

---

## Dokumentklassifizierung

Dieses Dokument definiert **ausschließlich** Enterprise Traceability Matrix Contracts.

Es ist kein globaler Enterprise Standard.

Nicht zulässig sind in diesem Dokument

globale Repository Contracts

globale Naming Contracts

globale Layer Contracts

allgemeine Governance

Diese verbleiben ausnahmslos in ESS-0001-CONTRACTS.

Bei Konflikt zwischen diesem Dokument und ESS-0001-CONTRACTS gilt ausnahmslos
ESS-0001-CONTRACTS.

---

## Cross Reference

Dieses Dokument besitzt kein YAML-Frontmatter. Die Referenzen werden als Markdown-Abschnitt
geführt, analog zu ESS-0001-CONTRACTS.

**Depends On**

ESS-0001-CONTRACTS

ESS-0011

**Related ESS**

ESS-0001 — Documentary & Code Intelligence Architect

ESS-0010 — Documentary Engine

ESS-0011 — Enterprise Traceability

**Related ADR**

ADR-0010 — Enterprise Standard Extension

ADR-0013 — ESS Documentation Responsibility Consolidation

**Related Components**

`src/platform/Registry`

`src/platform/Knowledge`

`src/platform/Architecture`

`src/platform/Quality`

**Related Skills**

`.ai/skills/ESS-0011-Enterprise-Traceability.md`

`.ai/skills/ESS-0010-Documentary-Engine.md`

---

# Chapter 1

# Traceability Link Contracts

## Enterprise Purpose

Dieses Kapitel definiert die verbindliche Struktur einer Traceability-Verknüpfung.

---

# Link Contract

Jede Verknüpfung besitzt verbindlich

linkId

sourceId

targetId

linkType

origin

confidence

createdAt

Fehlt ein Feld, ist die Verknüpfung ungültig und wird verworfen.

---

# Identity Contract

`sourceId` und `targetId` verwenden ausschließlich die Knoten-Identität aus
ESS-0001-CONTRACTS Chapter 15.

```text
<type>:<domain>/<name>
```

Beispiele

```text
ess:governance/ESS-0001-CONTRACTS#Chapter-16
adr:governance/ADR-0011
component:platform/Documentary
interface:platform/IKnowledgeBuilder
event:platform/TwinDriftDetectedEvent
exception:governance/EXC-0001
```

Die ID bleibt über sämtliche Versionen stabil.

---

# Link Type Contract

Zulässig sind ausschließlich

SPECIFIES

DECIDES

IMPLEMENTS

EMITS

VALIDATES

COVERS

EXEMPTS

SUPERSEDES

Weitere Verknüpfungsarten erfordern eine ADR.

---

# Direction Contract

Jede Verknüpfung ist gerichtet.

Gegenrichtungen werden berechnet, niemals gespeichert.

Eine Verknüpfung, die ausschließlich in einer Richtung auflösbar ist, erzeugt einen Befund.

---

# Origin Contract

Jede Verknüpfung besitzt einen nachweisbaren Ursprung.

Zulässig sind

KnowledgeGraph

Registry

DigitalTwin

EssRegistry

ExceptionRegistry

AdrDocument

ValidationResult

SourceCode

Eine Verknüpfung ohne Ursprung wird niemals aufgenommen.

---

# Confidence Contract

Verified

aus expliziter Referenz oder Metadaten abgeleitet

---

Derived

aus mehreren Quellen erschlossen

---

Assumed

nicht zulässig

Verknüpfungen mit dem Wert Assumed dürfen niemals in die Matrix aufgenommen werden.

---

# End of Chapter 1

---

# Chapter 2

# Coverage Contracts

## Enterprise Purpose

Dieses Kapitel definiert die verbindliche Messung der Abdeckung.

---

# Coverage Definition

Abdeckung ist der Anteil der Artefakte einer Achse, die mindestens eine gültige Verknüpfung
in der geforderten Richtung besitzen.

Die Berechnung ist deterministisch.

Abdeckung wird niemals geschätzt.

---

# Coverage Axes

Verbindlich gemessen werden

| Achse | Messgröße |
|---|---|
| Specification Coverage | Komponenten mit spezifizierender ESS-Referenz |
| Decision Coverage | Strukturentscheidungen mit ADR |
| Interface Coverage | Interfaces mit Implementierung |
| Event Coverage | Events mit mindestens einem Consumer |
| Test Coverage | Komponenten mit validierendem Test |
| Exception Coverage | Ausnahmen mit Zielzustand und ADR |

---

# Coverage Thresholds

| Konformitätsstufe | geforderte Mindestabdeckung |
|---|---|
| Level 1 — Structural | Specification Coverage ≥ 80 |
| Level 2 — Operational | zusätzlich Event Coverage ≥ 90, Interface Coverage ≥ 90 |
| Level 3 — Enterprise | sämtliche Achsen ≥ 95, Exception Coverage = 100 |

Die Konformitätsstufen entsprechen ESS-0001-CONTRACTS Chapter 20 und werden hier nicht neu
definiert, sondern ausschließlich um Traceability-Schwellwerte ergänzt.

---

# Measurement Contract

Abdeckung wird ausschließlich aus der Matrix berechnet.

Sie wird niemals manuell gesetzt.

Sie wird niemals aus Dokumentation abgeleitet.

---

# End of Chapter 2

---

# Chapter 3

# Orphan Contracts

## Enterprise Purpose

Dieses Kapitel definiert, welche nicht verknüpften Artefakte als Befund gelten.

---

# Orphan Definition

Ein Orphan ist ein Artefakt ohne gültige Verknüpfung in der geforderten Richtung.

---

# Orphan Classes

| Klasse | Bedeutung | Schweregrad |
|---|---|---|
| UnimplementedRule | ESS-Regel ohne umsetzende Komponente | High |
| UnspecifiedComponent | Komponente ohne spezifizierende Regel | High |
| UndecidedStructure | Strukturabweichung ohne ADR | Critical |
| UnconsumedEvent | Event ohne Consumer | Medium |
| UnimplementedInterface | Interface ohne Implementierung | Medium |
| UntestedComponent | Komponente ohne Test | High |
| UnjustifiedException | Ausnahme ohne ADR oder Zielzustand | Critical |
| DanglingAdr | ADR ohne betroffene Komponente | Low |

---

# Orphan Handling

Jeder Orphan erzeugt verbindlich einen Befund gemäß ESS-0002.

Orphans der Stufe Critical blockieren Produktionsfreigaben.

Ein Orphan wird niemals stillschweigend geschlossen.

---

# End of Chapter 3

---

# Chapter 4

# ETM Event Contracts

## Enterprise Purpose

Dieses Kapitel definiert die Events der ETM.

Sämtliche Namen folgen dem Naming Contract aus ESS-0001-CONTRACTS Chapter 8.

---

# Erzeugte Events

TraceabilityBuildStartedEvent

TraceabilityBuildCompletedEvent

TraceabilityBuildFailedEvent

CoverageCalculatedEvent

CoverageThresholdViolatedEvent

OrphanDetectedEvent

OrphanResolvedEvent

TraceabilityReportGeneratedEvent

---

# Konsumierte Events

KnowledgeUpdatedEvent

TwinSynchronizedEvent

ComponentRegisteredEvent

ExceptionRegisteredEvent

ReleasePreparedEvent

---

# Correlation Contract

Die ETM übernimmt die Correlation ID des auslösenden Events unverändert.

---

# End of Chapter 4

---

# Chapter 5

# ETM Validation Contracts

## Enterprise Purpose

Dieses Kapitel definiert die Prüfung der Matrix selbst.

---

# Matrix Validation

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

---

# Determinism Contract

Bei identischem Eingangszustand erzeugt die ETM eine byteidentische Matrix.

Zeitstempel sind von der Prüfsummenbildung ausgenommen.

Weicht die Prüfsumme bei unverändertem Eingangszustand ab, gilt der Durchlauf als fehlerhaft.

---

# Validator Contract

Die ETM stellt einen Validator gemäß ESS-0001-CONTRACTS Chapter 12 bereit.

```text
TraceabilityValidator
```

Er prüft ausschließlich die Matrix, niemals deren Quellen.

---

# Enterprise Rules

Keine Verknüpfung ohne Ursprung.

Keine Verknüpfung ohne Richtung.

Keine Annahme in der Matrix.

Keine manuelle Änderung der Matrix.

Keine Abdeckungsaussage ohne Messung.

Kein Orphan ohne Befund.

Keine Produktionsfreigabe bei Critical-Orphans.

Dieses Dokument definiert niemals globale Enterprise-Regeln.

---

# Success Criteria

Diese Contracts gelten als erfüllt wenn

✓ sämtliche Verknüpfungen dem Link Contract entsprechen

✓ sämtliche Abdeckungsgrade deterministisch berechnet werden

✓ sämtliche Orphans klassifiziert und gemeldet werden

✓ die Matrix reproduzierbar erzeugt werden kann

✓ der TraceabilityValidator ausführbar ist

✓ keine globale Regel in diesem Dokument definiert wurde

---

# Integration

Dieses Dokument ergänzt

ESS-0011 — Enterprise Traceability

↓

ESS-0001-CONTRACTS Chapter 12 — Validation & Quality Contracts

↓

ESS-0001-CONTRACTS Chapter 20 — Official Enterprise Standard

---

# Governance Statement

ESS-0011-CONTRACTS ist die verbindliche Vertragsgrundlage der Enterprise Traceability Matrix.

Es besitzt keine globale Wirkung.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Fassung der ETM Contracts |

---

# Approval

Document Status

APPROVED

Enterprise Specification

CAPITAL-AI Core Architecture

Version 1.0.0

---

# End of Document

ESS-0011-CONTRACTS

CAPITAL-AI Enterprise Traceability Matrix Contracts

Version 1.0.0
