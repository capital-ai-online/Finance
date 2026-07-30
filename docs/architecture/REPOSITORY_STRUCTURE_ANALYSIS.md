# CAPITAL-AI Repository Structure Analysis & Implementation Plan

## Enterprise Report

### Document ID

ARCH-STRUCT-0001

### Version

1.0.0

### Status

Enterprise Analysis — Approved for Governance Review

### Basis

ESS-0001-CONTRACTS Chapter 2, 3, 5, 6, 7, 12, 15, 16, 19

ESS-0001 Chapter 2

---

# Enterprise Purpose

Dieser Report vergleicht den tatsächlichen Zustand von

```text
src/platform/
.ai/
docs/
```

mit den verbindlichen Enterprise Contracts.

Er benennt ausschließlich nachweisbare Abweichungen und leitet daraus einen priorisierten Umsetzungsplan ab.

---

# Teil A — src/platform

## Modulvergleich

Chapter 2 definiert 21 fachliche Pflichtmodule.

Chapter 3 und Chapter 6 ergänzen `Core` als technische Basisschicht.

| Modul | Verzeichnis | README | manifest.json | component.yaml | CHANGELOG.md | Implementierung |
|---|---|---|---|---|---|---|
| Core | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Documentary | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| PlatformDirector | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Supervisor | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| VersionManager | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Knowledge | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Architecture | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Discovery | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Registry | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Events | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Contracts | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Models | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Interfaces | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Validators | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Generators | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Plugins | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Telemetry | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Quality | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Security | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Compliance | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Release | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Shared | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

**Ergebnis**

Es fehlt kein Modul.

Es existiert keine einzige Implementierung.

Es existiert kein einziger Component Descriptor.

Es existiert kein einziger Komponenten-Changelog.

---

## Unterstruktur Documentary

Chapter 2 definiert 19 Unterverzeichnisse.

Alle 19 sind vorhanden.

```text
Engine  Discovery  Knowledge  Documentation  Architecture
Migration  Versioning  Events  Registry  Generators
Validators  Templates  Mermaid  Plugins  Types
Models  Interfaces  Contracts  Utils
```

Sämtliche Verzeichnisse enthalten ausschließlich `.gitkeep`.

---

## Unterstruktur Core

Chapter 3 definiert die zulässigen Inhalte des Core.

Vorhanden sind

```text
Base  Contracts  Errors  Events  Interfaces
Lifecycle  Logging  Registry  Telemetry  Types  Utils
```

Die Struktur entspricht dem Contract.

Zusätzlich vorhanden ist die nicht vertragskonforme Datei `basisschicht.md` mit 0 Byte.

---

## Fehlende Interfaces

Aus den Enterprise Contracts ergeben sich verbindlich mindestens folgende öffentliche Interfaces.

| Interface | Contract |
|---|---|
| `IEnterpriseComponent` | Chapter 4, Chapter 7 |
| `IEnterpriseEvent` | Chapter 8 |
| `IEventBus` | Chapter 8 |
| `IEventRegistry` | Chapter 8 |
| `IComponentRegistry` | Chapter 7 |
| `IDiscoveryProvider` | ESS-0001 Chapter 2 |
| `ICodeIntelligenceProvider` | ESS-0001 Chapter 3 |
| `IKnowledgeBuilder` | Chapter 15 |
| `IKnowledgeQuery` | Chapter 15 |
| `IDocumentationGenerator` | ESS-0001 Chapter 5 |
| `IValidator` | Chapter 12 |
| `IQualityGate` | Chapter 12 |
| `IVersionCalculator` | Chapter 9 |
| `IDigitalTwin` | Chapter 18 |
| `ITwinReconciler` | Chapter 18 |
| `IPlugin` | Chapter 13 |
| `IPluginRegistry` | Chapter 13 |
| `ISupervisor` | ESS-0002 |
| `IPlatformDirector` | ESS-0003 |
| `IMigrationPlan` | Chapter 14 |
| `ILegacyAdapter` | Chapter 14 |
| `ISecurityClassifier` | Chapter 11 |
| `IAuditTrail` | Chapter 11 |
| `IAutomationProcess` | Chapter 19 |

Vorhanden sind **null** Interfaces.

---

## Fehlende Models

| Model | Contract |
|---|---|
| `ComponentManifest` | Chapter 7 |
| `ComponentDescriptor` | Chapter 7 |
| `RegistryEntry` | Chapter 7 |
| `EnterpriseEvent` | Chapter 8 |
| `EventDefinition` | Chapter 8 |
| `KnowledgeNode` | Chapter 15 |
| `KnowledgeRelation` | Chapter 15 |
| `ValidationResult` | Chapter 12 |
| `Finding` | ESS-0002 |
| `QualityScore` | Chapter 12 |
| `VersionRecommendation` | Chapter 9 |
| `TwinState` | Chapter 18 |
| `MigrationPlan` | Chapter 14 |
| `LegacyEntry` | Chapter 14 |
| `Exception` | Chapter 16 |
| `Decision` | ESS-0003 |
| `RiskEntry` | Chapter 11 |

Vorhanden sind **null** Models.

---

## Fehlende Registries

| Registry | Contract |
|---|---|
| Component Registry | Chapter 7 |
| Event Registry | Chapter 8 |
| Interface Registry | Chapter 4 |
| Plugin Registry | Chapter 13 |
| Validator Registry | Chapter 12 |
| Generator Registry | Chapter 19 |
| Version Registry | Chapter 9 |
| Exception Registry | Chapter 16 |
| Legacy Registry | Chapter 14 |
| ESS Registry | Chapter 16 |
| ADR Registry | Chapter 16 |

Vorhanden ist ausschließlich die ESS Registry als Knowledge Seed.

---

## Fehlende Validatoren

Chapter 12 definiert 16 Pflichtvalidatoren.

```text
RepositoryStructureValidator     DirectoryResponsibilityValidator
NamingValidator                  LayerValidator
DependencyValidator              InterfaceValidator
ManifestValidator                ComponentValidator
MetadataValidator                DocumentationValidator
EventValidator                   VersionValidator
SecurityValidator                ComplianceValidator
KnowledgeValidator               TwinValidator
```

Vorhanden sind **null** Validatoren.

---

## Fehlende Generatoren

| Generator | Quelle |
|---|---|
| `ManifestGenerator` | Chapter 7 |
| `ComponentDescriptorGenerator` | Chapter 7 |
| `ReadmeGenerator` | Chapter 7 |
| `ChangelogGenerator` | Chapter 7, Chapter 9 |
| `RegistryGenerator` | Chapter 7 |
| `KnowledgeGenerator` | Chapter 15 |
| `TwinGenerator` | Chapter 18 |
| `ArchitectureGenerator` | ESS-0001 Chapter 5 |
| `MermaidGenerator` | ESS-0001 Chapter 5 |
| `ADRGenerator` | ESS-0001 Chapter 5 |
| `ReleaseGenerator` | Chapter 9 |
| `ReportGenerator` | Chapter 19 |

Vorhanden sind **null** Generatoren.

---

## Fehlende Events

Chapter 8, 11, 12, 13, 14, 15, 16, 17, 18 und 19 definieren zusammen über 80 verbindliche Enterprise Events.

Implementiert sind **null**.

Vorhanden ist ausschließlich ein nicht vertragskonformes Systemprotokoll in `server/systemEvents.ts`.

---

# Teil B — .ai

| Verzeichnis | Contract | Zustand |
|---|---|---|
| `.ai/skills/` | Chapter 2 | ESS-0001, ESS-0001-CONTRACTS, ESS-0002, ESS-0003 |
| `.ai/prompts/` | Chapter 2 | leer |
| `.ai/contracts/` | Chapter 2 | leer |
| `.ai/templates/` | Chapter 2 | leer |
| `.ai/schemas/` | Chapter 2, Chapter 15 | leer |
| `.ai/registry/` | Chapter 7, Chapter 16 | ESS Registry Seed |
| `.ai/knowledge/` | Chapter 15 | leer |

**Fehlend**

sämtliche JSON Schemata

sämtliche Dokumenttemplates

sämtliche Knowledge-Dateien

das Twin-Verzeichnis `.ai/knowledge/twin/`

sämtliche Registry-Dateien außer der ESS Registry

---

# Teil C — docs

| Verzeichnis | Zustand | Bewertung |
|---|---|---|
| `docs/adr/` | 4 aktive, 3 abgeschlossene ADRs | unvollständig, siehe GAP-026 |
| `docs/architecture/` | zuvor leer, nun Enterprise Reports | belegt |
| `docs/backend/` | 1 Dokument | vorhanden |
| `docs/frontend/` | 1 Dokument | vorhanden |
| `docs/security/` | 1 Dokument | ohne ESS-Bezug |
| `docs/compliance/` | leer | Compliance Report liegt unter `docs/` |
| `docs/knowledge/` | leer | Knowledge Reports fehlen |
| `docs/migration/` | leer | Migration Reports fehlen |
| `docs/quality/` | leer | Quality Reports fehlen |
| `docs/release/` | leer | Release Reports fehlen |
| `docs/reports/` | 3 Berichte | vorhanden |
| `docs/qa/`, `docs/ceo/`, `docs/seo/`, `docs/backlog/`, `docs/code-quality/`, `docs/content-creator/` | belegt | nicht in Chapter 2 benannt, jedoch innerhalb `docs/` zulässig |

**Fehlend**

Compliance Reports

Knowledge Reports

Migration Reports

Quality Reports

Release Reports

Governance Reports

Drift Reports

---

# Teil D — Tests

| Verzeichnis | Contract | Zustand |
|---|---|---|
| `tests/unit/` | Chapter 4, Chapter 12 | leer |
| `tests/integration/` | Chapter 4, Chapter 12 | leer |
| `tests/contract/` | Chapter 12 | leer |
| `tests/architecture/` | Chapter 12 | leer |
| `tests/security/` | Chapter 11, Chapter 12 | leer |
| `tests/performance/` | Chapter 12 | leer |
| `tests/e2e/` | Chapter 12 | leer |

Es existiert kein Test-Runner.

`package.json` kennt ausschließlich `lint` als `tsc --noEmit`.

---

# Teil E — Scripts

| Verzeichnis | Contract | Zustand |
|---|---|---|
| `scripts/automation/` | Chapter 19 | leer |
| `scripts/validation/` | Chapter 19 | leer |
| `scripts/migration/` | Chapter 19 | leer |
| `scripts/deployment/` | Chapter 19 | leer |
| `scripts/maintenance/` | Chapter 19 | leer |

Der in den generierten READMEs referenzierte Enterprise Bootstrapper existiert nicht.

---

# Priorisierter Umsetzungsplan

Die Reihenfolge folgt zwingend der Abhängigkeitsrichtung der Contracts.

Keine Stufe darf vorgezogen werden, da jede Stufe die Grundlage der folgenden bildet.

---

## Stufe 0 — Governance Baseline

**Priorität** Critical

**Ziel** Der Standard ist vollständig und widerspruchsfrei.

| Maßnahme | Contract |
|---|---|
| Chapter 11 bis 20 ergänzen | Chapter 10 Integration |
| ESS Registry führen | Chapter 16 |
| ADR für die Standarderweiterung | Chapter 2, Chapter 16 |
| Normative Klarstellungen verabschieden | Chapter 20 |

**Ergebnis** Sämtliche nachfolgenden Stufen besitzen eine verbindliche Grundlage.

**Status** Mit dieser Lieferung abgeschlossen.

---

## Stufe 1 — Schema & Metadata Foundation

**Priorität** Critical

| Maßnahme | Contract | Ergebnis |
|---|---|---|
| JSON Schemata unter `.ai/schemas/` | Chapter 7, 15 | Metadaten werden validierbar |
| `manifest.json` je Komponente vervollständigen | Chapter 7 | Registry wird aufbaubar |
| `component.yaml` je Komponente | Chapter 7 | Menschen- und KI-lesbare Beschreibung |
| `CHANGELOG.md` je Komponente | Chapter 7, 9 | Komponentenversionierung wird nachvollziehbar |
| `basisschicht.md` überführen und entfernen | Chapter 2, 5 | Strukturkonformität |

**Abhängigkeit** keine

**Blockiert** Stufe 2, 3, 4

---

## Stufe 2 — Core & Contracts Implementation

**Priorität** Critical

| Maßnahme | Contract |
|---|---|
| Basisklassen, Errors, Lifecycle, Logging im Core | Chapter 3, 4 |
| Öffentliche Enterprise Interfaces | Chapter 4 |
| Enterprise Models | Chapter 7, 8, 12, 15, 18 |
| Component Registry | Chapter 7 |

**Abhängigkeit** Stufe 1

**Blockiert** sämtliche Plattformmodule

---

## Stufe 3 — Enterprise Event Bus

**Priorität** Critical

| Maßnahme | Contract |
|---|---|
| Event-Basismodell mit Version, Correlation ID, Schema | Chapter 8 |
| Event Registry | Chapter 8 |
| Event Bus mit Routing | Chapter 8 |
| Event Persistence und Replay | ESS-0001 Chapter 8 |
| Anbindung von `server/systemEvents.ts` als Consumer über Adapter | Chapter 14 |

**Abhängigkeit** Stufe 2

**Blockiert** jede Automatisierung, jede Documentary-Auslösung, die gesamte Wertschöpfungskette

**Begründung der Priorität** ESS-0001 Chapter 8 legt fest, dass keine Dokumentation, keine Versionierung und keine Migration ohne Event erfolgt. Ohne Event Bus bleibt die Plattform vollständig manuell.

---

## Stufe 4 — Validation & Architecture Tests

**Priorität** Critical

| Maßnahme | Contract |
|---|---|
| Validator-Basisklasse und Ergebnisstruktur | Chapter 12 |
| 16 Pflichtvalidatoren | Chapter 12 |
| Architecture Tests | Chapter 12 |
| Contract Tests | Chapter 12 |
| Quality Gates als ausführbare Prüfungen | Chapter 1, 12 |
| Test-Runner in `package.json` | Chapter 12 |

**Abhängigkeit** Stufe 1 bis 3

**Wirkung** Ab dieser Stufe sind die Enterprise Contracts erstmals durchsetzbar statt beschrieben.

---

## Stufe 5 — Discovery, Knowledge Graph, Digital Twin

**Priorität** High

| Maßnahme | Contract |
|---|---|
| Repository Discovery | ESS-0001 Chapter 2 |
| Code Intelligence | ESS-0001 Chapter 3 |
| Knowledge Builder und Knowledge Files | Chapter 15 |
| Knowledge Validation | Chapter 15 |
| Digital Twin Aufbau, Drift Detection, Snapshots | Chapter 18 |

**Abhängigkeit** Stufe 2 bis 4

**Wirkung** Die Plattform beschreibt sich erstmals selbst.

---

## Stufe 6 — Documentary Engine & Generatoren

**Priorität** High

| Maßnahme | Contract |
|---|---|
| Documentation Engine | ESS-0001 Chapter 5 |
| Generatoren für README, Manifest, Descriptor, Changelog | Chapter 7, 19 |
| Architecture- und Mermaid-Generatoren | ESS-0001 Chapter 5 |
| Report-Generatoren für Security, Compliance, Quality, Governance | Chapter 11, 12, 16 |

**Abhängigkeit** Stufe 5

**Wirkung** Dokumentation entsteht nur noch generiert.

---

## Stufe 7 — Version Manager & Release

**Priorität** High

| Maßnahme | Contract |
|---|---|
| Versionsbewertung aus Impact Analyse | Chapter 9 |
| Versionssynchronisation über sämtliche Quellen | Chapter 9 |
| Auflösung der vier widersprüchlichen Versionsstände | GAP-019 |
| Changelog- und Release-Notes-Erzeugung | Chapter 9 |
| Rollback-Artefakte | Chapter 9, 14 |
| Anbindung von `server/versionManager.ts` über Adapter | Chapter 14 |

**Abhängigkeit** Stufe 3 bis 6

---

## Stufe 8 — Supervisor & Platform Director

**Priorität** High

| Maßnahme | Contract |
|---|---|
| Supervisor Observation und Findings | ESS-0002 |
| Health- und Lifecycle-Überwachung | ESS-0002 |
| Blockierende Bedingungen | ESS-0002 |
| Platform Director Entscheidungsmodell | ESS-0003 |
| Ausnahmen- und Eigentümerverwaltung | Chapter 16, ESS-0003 |

**Abhängigkeit** Stufe 4 bis 7

---

## Stufe 9 — Security & Compliance

**Priorität** High

| Maßnahme | Contract |
|---|---|
| Sicherheitsklassifizierung sämtlicher Komponenten | Chapter 11 |
| Security Metadata in sämtlichen Manifesten | Chapter 11 |
| Audit Trail | Chapter 11 |
| Security- und Compliance-Validatoren | Chapter 11, 12 |
| Security Tests | Chapter 12 |

**Abhängigkeit** Stufe 1, 4

**Hinweis** Kann parallel zu Stufe 5 bis 8 ausgeführt werden.

---

## Stufe 10 — Automation & Bootstrapper

**Priorität** Medium

| Maßnahme | Contract |
|---|---|
| Enterprise Bootstrapper | Chapter 19 |
| Prozessregistrierung und Protokollierung | Chapter 19 |
| Ereignisgesteuerte Auslösung sämtlicher Prozesse | Chapter 17, 19 |
| Zeitgesteuerte Vollprüfungen | Chapter 19, ESS-0002 |

**Abhängigkeit** Stufe 3 bis 9

---

## Stufe 11 — Legacy Migration

**Priorität** Medium

| Maßnahme | Contract |
|---|---|
| Legacy Registry für `server/` | Chapter 14 |
| Adapter für documentHygiene, systemEvents, versionManager, decisionEngine | Chapter 14 |
| Migrationspläne mit Rollback | Chapter 14 |
| ADR für Bestandsschutz von `server/` und `sql/` | Chapter 16 |
| Schrittweise Überführung der Domänenlogik nach `src/features/` | Chapter 2 |

**Abhängigkeit** Stufe 8, 10

**Hinweis** Produktionsreife Bestandskomponenten werden niemals neu entwickelt.

---

# Umsetzungsreihenfolge im Überblick

```text
Stufe 0   Governance Baseline          Critical   abgeschlossen
Stufe 1   Schema & Metadata            Critical
Stufe 2   Core & Contracts             Critical
Stufe 3   Enterprise Event Bus         Critical
Stufe 4   Validation & Tests           Critical
Stufe 5   Knowledge & Digital Twin     High
Stufe 6   Documentary & Generatoren    High
Stufe 7   Version Manager & Release    High
Stufe 8   Supervisor & Director        High
Stufe 9   Security & Compliance        High
Stufe 10  Automation & Bootstrapper    Medium
Stufe 11  Legacy Migration             Medium
```

---

# Enterprise Rules für die Umsetzung

Keine Stufe ohne abgeschlossene Vorstufe.

Keine Implementierung ohne Contract-Referenz.

Keine Komponente ohne Metadaten.

Keine Neuentwicklung produktionsreifer Bestandskomponenten.

Keine Strukturänderung ohne ADR.

Keine Stufe ohne Validierung.

---

# Related Documents

ARCH-GAP-0001 — Architecture Gap Report

ARCH-CONS-0001 — Component Consistency Report

ARCH-CHAIN-0001 — AI Value Chain Validation

ARCH-MAT-0001 — Enterprise Maturity Report

ADR-0010 — Enterprise Standard Extension

---

# Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Initial Release | Strukturvergleich und priorisierter Umsetzungsplan |

---

# End of Document

ARCH-STRUCT-0001

CAPITAL-AI Repository Structure Analysis

Version 1.0.0
