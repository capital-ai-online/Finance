# ESS-0012-CONTRACTS

## Documentation Governance Contracts

### Version

1.0.0

### Status

Enterprise Specification

---

## Dokumentklassifizierung

Dieses Dokument definiert **ausschließlich** Documentation Governance Contracts.

Es ist kein globaler Enterprise Standard.

Nicht zulässig sind in diesem Dokument

globale Repository Contracts

globale Naming Contracts

globale Layer Contracts

allgemeine Governance

Validator-Basisregeln, Severity-Definitionen und Quality Gates

Diese verbleiben ausnahmslos in ESS-0001-CONTRACTS.

Bei Konflikt zwischen diesem Dokument und ESS-0001-CONTRACTS gilt ausnahmslos
ESS-0001-CONTRACTS.

---

## Cross Reference

**Depends On**

ESS-0001-CONTRACTS

ESS-0012

**Related ESS**

ESS-0001 — Documentary & Code Intelligence Architect

ESS-0010 — Documentary Engine

ESS-0011 — Enterprise Traceability

ESS-0011-CONTRACTS — Enterprise Traceability Matrix Contracts

ESS-0012 — Documentation Governance

**Related ADR**

ADR-0010 — Enterprise Standard Extension

ADR-0013 — ESS Documentation Responsibility Consolidation

ADR-0014 — Documentation Governance Validator

**Related Components**

`src/platform/Documentary/Governance`

`src/platform/Documentary`

`src/platform/Knowledge`

`src/platform/Registry`

`src/platform/Quality`

**Related Skills**

`.ai/skills/ESS-0012-Documentation-Governance.md`

`.ai/skills/Documentation-Governance-Validator.md`

---

# Chapter 1

# Rule Contracts

## Enterprise Purpose

Dieses Kapitel definiert die verbindliche Struktur einer Governance-Regel.

---

# Rule Contract

Jede Regel besitzt verbindlich

ruleId

name

area

description

severity

rationale

essReference

evidenceType

version

Fehlt ein Feld, ist die Regel ungültig und wird nicht ausgeführt.

---

# Rule Identity

Die Regel-ID ist plattformweit eindeutig und stabil.

Format

```text
GOV-<AREA>-<NNN>
```

Zulässige Bereichskürzel

```text
ESS   ADR   REPO   CONTRACT   DOC   TRACE   KG   TWIN   VER
```

Beispiele

```text
GOV-ESS-001
GOV-ADR-004
GOV-REPO-002
GOV-TWIN-003
```

Die ID bleibt über sämtliche Versionen unverändert.

Eine zurückgezogene Regel wird als `Revoked` gekennzeichnet, ihre ID wird niemals
wiederverwendet.

---

# Severity

Die Severity-Stufen aus ESS-0001-CONTRACTS Chapter 12 gelten unverändert:

```text
Critical   High   Medium   Low   Information
```

Dieses Dokument definiert keine eigenen Stufen, sondern ordnet ausschließlich zu.

---

# Evidence Contract

Jeder Befund besitzt verbindlich einen Nachweis.

Zulässige Nachweistypen

| Typ | Bedeutung |
|---|---|
| `FileReference` | Pfad und Zeile |
| `RegistryEntry` | Eintrag aus einer Registry |
| `KnowledgeNode` | Knoten oder Beziehung |
| `TwinDelta` | Abweichung zwischen Repository und Twin |
| `MatrixLink` | fehlende oder widersprüchliche Verknüpfung |
| `VersionValue` | konkrete Versionsangabe |

Ein Befund ohne Nachweis wird verworfen.

Eine Vermutung ist niemals ein Befund.

---

# End of Chapter 1

---

# Chapter 2

# Regelwerk

## Enterprise Purpose

Dieses Kapitel definiert das verbindliche Mindestregelwerk.

Erweiterungen erfordern keine ADR, solange sie keine bestehende Regel ändern.

---

# 2.1 ESS-Regeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-ESS-001 | ESS-Nummer nicht in der ESS Registry geführt | Critical |
| GOV-ESS-002 | ESS-Dokument ohne Dokumentklasse | High |
| GOV-ESS-003 | ESS-Dokument ohne vollständige Cross-References | High |
| GOV-ESS-004 | identische Regel in mehreren ESS-Dokumenten | High |
| GOV-ESS-005 | widersprüchliche Regeln in zwei ESS-Dokumenten ohne Vorrangregel | Critical |
| GOV-ESS-006 | Komponente ohne ESS-Referenz | Medium |
| GOV-ESS-007 | ESS-Referenz auf nicht existierendes Dokument | Critical |
| GOV-ESS-008 | Lücke im ESS-Nummernraum | Medium |

---

# 2.2 ADR-Regeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-ADR-001 | Strukturänderung ohne ADR | Critical |
| GOV-ADR-002 | Breaking Change ohne ADR | Critical |
| GOV-ADR-003 | ADR-Nummer ohne Dokument | High |
| GOV-ADR-004 | zwei ADRs mit widersprüchlicher Entscheidung ohne `SUPERSEDED` | Critical |
| GOV-ADR-005 | ADR ohne `Implementation-Status` | Medium |
| GOV-ADR-006 | ADR mit Status `COMPLETE` außerhalb von `resolved/` | Low |
| GOV-ADR-007 | ADR ohne betroffene Komponente | Low |
| GOV-ADR-008 | ADR-Registrierung unvollständig gegenüber Dateibestand | High |

---

# 2.3 Repository-Regeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-REPO-001 | Komponente ohne README | High |
| GOV-REPO-002 | Komponente ohne CHANGELOG | High |
| GOV-REPO-003 | Komponente ohne manifest.json | Critical |
| GOV-REPO-004 | Komponente ohne component.yaml | High |
| GOV-REPO-005 | Komponente ohne Ownership oder mit pauschalem Owner | High |
| GOV-REPO-006 | README enthält ausschließlich Platzhaltertext | Medium |
| GOV-REPO-007 | manifest.json ohne Pflichtfelder aus Chapter 7 | High |
| GOV-REPO-008 | leere Beschreibung im Manifest | Medium |
| GOV-REPO-009 | nicht registrierte Strukturabweichung | Critical |

---

# 2.4 Contract-Regeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-CONTRACT-001 | identischer Contract in mehreren Dokumenten | High |
| GOV-CONTRACT-002 | widersprüchliche Contracts ohne Vorrangregel | Critical |
| GOV-CONTRACT-003 | Contract ohne definierten Geltungsbereich | High |
| GOV-CONTRACT-004 | Contract von keiner Komponente referenziert | Medium |
| GOV-CONTRACT-005 | Contract mit globaler Wirkung außerhalb ESS-0001-CONTRACTS | Critical |
| GOV-CONTRACT-006 | Contract ohne Validator | Medium |

---

# 2.5 Dokumentationsregeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-DOC-001 | Dokument ohne Version | High |
| GOV-DOC-002 | Dokument ohne ESS- oder ADR-Referenz | Medium |
| GOV-DOC-003 | Dokument älter als die zuletzt geänderte referenzierte Komponente | Medium |
| GOV-DOC-004 | Dokument entspricht nicht der Struktur seiner Dokumentklasse | Medium |
| GOV-DOC-005 | Dokumentation außerhalb `docs/` ohne registrierte Ausnahme | High |
| GOV-DOC-006 | generiertes Dokument ohne Generator-Kennzeichnung | Medium |
| GOV-DOC-007 | Dokument mit unaufgelöstem Verweis | Low |

---

# 2.6 Traceability-Regeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-TRACE-001 | Traceability Matrix nicht vorhanden | High |
| GOV-TRACE-002 | Kettenglied ohne Verknüpfung | High |
| GOV-TRACE-003 | Komponente ohne Test in der Matrix | High |
| GOV-TRACE-004 | Release ohne Verknüpfung zur Version | Medium |

Coverage-Schwellwerte und Orphan-Klassen stehen ausschließlich in ESS-0011-CONTRACTS und
werden hier nicht wiederholt.

---

# 2.7 Knowledge-Graph-Regeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-KG-001 | Knowledge Graph nicht vorhanden | Critical |
| GOV-KG-002 | verwaister Knoten ohne Beziehung | Medium |
| GOV-KG-003 | doppelte Beziehung zwischen identischem Knotenpaar | Low |
| GOV-KG-004 | Beziehung auf nicht existierenden Knoten | Critical |
| GOV-KG-005 | inkonsistente Gegenrichtung | High |

---

# 2.8 Digital-Twin-Regeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-TWIN-001 | Digital Twin nicht vorhanden | Critical |
| GOV-TWIN-002 | Komponente im Repository, nicht im Twin | High |
| GOV-TWIN-003 | Komponente im Twin, nicht im Repository | High |
| GOV-TWIN-004 | Twin-Zustand ungleich `Synchronized` | Critical |
| GOV-TWIN-005 | Twin älter als die letzte Repository-Änderung | High |

Twin-Zustände und Drift-Toleranz stehen in ESS-0001-CONTRACTS Chapter 18.

---

# 2.9 Versionsregeln

| ID | Prüfung | Severity |
|---|---|---|
| GOV-VER-001 | widersprüchliche Repository-Versionsangaben | Critical |
| GOV-VER-002 | Komponentenversion ohne Changelog-Eintrag | High |
| GOV-VER-003 | Dokumentversion weicht von Komponentenversion ab | Medium |
| GOV-VER-004 | ESS-Version im Dokument weicht von der Registry ab | High |
| GOV-VER-005 | Version ohne Rollback-Artefakt | High |

---

# End of Chapter 2

---

# Chapter 3

# Scoring Contracts

## Enterprise Purpose

Dieses Kapitel definiert die verbindliche Berechnung der Reifekennzahlen.

---

# Berechnungsgrundsatz

Kennzahlen werden ausschließlich aus Befunden berechnet.

Sie werden niemals manuell gesetzt.

Sie werden niemals aus Dokumentation abgeleitet.

---

# Governance Score

```text
Governance Score = 100 − (Critical × 10 + High × 4 + Medium × 1,5 + Low × 0,5)
```

Der Wert wird bei 0 abgeschnitten.

Der Wertebereich beträgt 0 bis 100.

---

# Repository Health Score

Mittelwert aus

Metadatenvollständigkeit

Ownership-Abdeckung

Dokumentationsabdeckung

Strukturkonformität

Jede Teilgröße ist der Anteil konformer Komponenten in Prozent.

---

# Documentation Quality Score

Mittelwert aus

Vollständigkeit

Aktualität

Versionierung

Strukturkonformität

---

# Schwellwerte

| Kennzahl | Mindestwert für Produktionsfreigabe |
|---|---|
| Governance Score | 80 |
| Repository Health Score | 80 |
| Documentation Quality Score | 75 |

Zusätzlich gilt unabhängig von den Kennzahlen: **kein Critical-Befund**.

Ein hoher Score ersetzt niemals die Behebung eines Critical-Befundes.

---

# End of Chapter 3

---

# Chapter 4

# Event Contracts

## Enterprise Purpose

Dieses Kapitel definiert die Events des Governance Validator.

Sämtliche Namen folgen dem Naming Contract aus ESS-0001-CONTRACTS Chapter 8.

---

# Erzeugte Events

| Event | Auslöser |
|---|---|
| `DocumentationValidatedEvent` | Durchlauf abgeschlossen |
| `GovernanceViolationDetectedEvent` | Befund ab Severity High |
| `DuplicateContractDetectedEvent` | GOV-CONTRACT-001 oder GOV-ESS-004 |
| `TraceabilityViolationEvent` | Befund im Bereich TRACE |
| `DigitalTwinOutOfSyncEvent` | Befund im Bereich TWIN |
| `RepositoryHealthUpdatedEvent` | Repository Health Score neu berechnet |

---

# Konsumierte Events

`RepositoryScannedEvent`

`KnowledgeUpdatedEvent`

`TwinSynchronizedEvent`

`ComponentRegisteredEvent`

`DocumentationGeneratedEvent`

`VersionChangedEvent`

---

# Event Payload

Jedes erzeugte Event führt zusätzlich zu den Pflichtfeldern aus Chapter 8

runId

ruleId (sofern befundbezogen)

severity

evidence

scoreSnapshot

Der Payload enthält niemals Dateiinhalte, sondern ausschließlich Referenzen.

---

# Correlation

Der Validator übernimmt die Correlation ID des auslösenden Events unverändert.

Eine eigene Correlation ID entsteht ausschließlich bei zeitgesteuerten Vollprüfungen.

---

# End of Chapter 4

---

# Chapter 5

# Validation

## Enterprise Purpose

Dieses Kapitel definiert die Prüfung des Validators selbst.

---

# Selbstprüfung

Vor jeder Veröffentlichung von Befunden wird geprüft

✓ sämtliche geladenen Regeln besitzen vollständige Pflichtfelder

✓ sämtliche Regel-IDs sind eindeutig

✓ sämtliche Befunde besitzen einen Nachweis

✓ keine Befunde ohne zugeordnete Regel

✓ sämtliche Kennzahlen berechnet

✓ Determinismus nachgewiesen

✓ kein Schreibzugriff außerhalb des Befundspeichers

---

# Determinism Contract

Bei identischem Repository-Zustand erzeugt der Validator eine byteidentische Befundmenge.

Zeitstempel und Laufzeitangaben sind ausgenommen.

Weicht das Ergebnis ab, gilt der Durchlauf als fehlerhaft und die Befunde werden verworfen.

---

# Enterprise Rules

Keine Regel ohne ID und Severity.

Kein Befund ohne Nachweis.

Keine Kennzahl ohne Berechnung.

Keine Vermutung als Befund.

Kein Schreibzugriff auf den Prüfgegenstand.

Keine Produktionsfreigabe bei Critical-Befunden.

Kein Prüfergebnis ohne Ausführung.

Dieses Dokument definiert niemals globale Enterprise-Regeln.

---

# Success Criteria

Diese Contracts gelten als erfüllt wenn

✓ sämtliche Regeln dem Rule Contract entsprechen

✓ sämtliche neun Bereiche durch Regeln abgedeckt sind

✓ sämtliche Kennzahlen deterministisch berechnet werden

✓ sämtliche Events dem Event Contract entsprechen

✓ der Validator sich selbst prüft

✓ keine globale Regel in diesem Dokument definiert wurde

---

# Integration

Dieses Dokument ergänzt

ESS-0012 — Documentation Governance

↓

ESS-0001-CONTRACTS Chapter 12 — Validation & Quality Contracts

↓

ESS-0011-CONTRACTS — Enterprise Traceability Matrix Contracts

---

# Governance Statement

ESS-0012-CONTRACTS ist die verbindliche Vertragsgrundlage des Documentation Governance
Validator.

Es besitzt keine globale Wirkung.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Fassung der Documentation Governance Contracts, 57 Regeln in neun Bereichen |

---

# Approval

Document Status

APPROVED

Enterprise Specification

CAPITAL-AI Core Architecture

Version 1.0.0

---

# End of Document

ESS-0012-CONTRACTS

CAPITAL-AI Documentation Governance Contracts

Version 1.0.0
