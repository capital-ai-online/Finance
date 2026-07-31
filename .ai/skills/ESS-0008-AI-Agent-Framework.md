---
skill:
  id: ESS-0008
  name: AI Agent Framework
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
  role: Rahmenwerk fuer fachliche Domaenen-Agenten
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument spezifiziert das Rahmenwerk der fachlichen Domaenen-Agenten.
    Die Orchestrierung der KI-Systeme (Claude Code, Google AI Studio, ChatGPT)
    verbleibt in ESS-0001-CONTRACTS Chapter 10 und Chapter 17.

authority:

  controls:
    - Agent Registry
    - Agent Lifecycle
    - Agent Contracts
    - Orchestrator Registry

  collaborates:
    - Documentary Engine
    - Supervisor
    - Platform Director
    - Version Manager
    - Quality Center

  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Scoring-Algorithmen
    - Trading Logic
    - Portfolio Logic

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0010
    - ESS-0011
  relatedAdr:
    - ADR-0006
    - ADR-0016
  relatedComponents:
    - src/agents
    - src/orchestrator
    - src/services
    - src/platform/Registry
  relatedSkills:
    - .ai/skills/ESS-0001-Contracts.md
    - .ai/skills/ESS-0003-Platform-Director.md

created: 2026-07-31
---

# AI Agent Framework

## Enterprise Purpose

Dieses Dokument spezifiziert das Rahmenwerk der **fachlichen Domänen-Agenten** des
CAPITAL-AI Core.

Es schließt eine echte Regelungslücke: ESS-0001-CONTRACTS Chapter 10 und Chapter 17 regeln
die Orchestrierung der **KI-Entwicklungssysteme** — Claude Code, Google AI Studio, ChatGPT.
Sie regeln **nicht** die Agenten, die im Produktivbetrieb Finanzanalysen durchführen.

Diese Agenten existieren produktiv: acht Agenten unter `src/agents`, zwei Orchestratoren
unter `src/orchestrator`, sieben Scoring-Services unter `src/services`.

Für sie existierte bislang kein Enterprise-Vertrag.

---

# Abgrenzung

| Gegenstand | Zuständiges Dokument |
|---|---|
| KI-Entwicklungssysteme, Wertschöpfungskette | ESS-0001-CONTRACTS Chapter 10, Chapter 17 |
| Agent-Erkennung durch Discovery | ESS-0001 Chapter 3, ESS-0010 |
| **fachliche Domänen-Agenten** | **ESS-0008** |
| Scoring-Algorithmen selbst | unverändert, siehe *Nicht Bestandteil* |

---

# Nicht Bestandteil

Dieses Dokument verändert **niemals**

Scoring-Algorithmen

Bewertungslogik

Gewichtungen

Modellauswahl im Fachkontext

Trading- oder Portfolio-Logik

Es regelt ausschließlich **Struktur, Registrierung, Schnittstellen und Nachvollziehbarkeit**
der Agenten.

Die fachliche Richtigkeit einer Bewertung ist nicht Gegenstand dieses Standards.

---

# Enterprise Principle

Ein Agent ist eine Enterprise-Komponente.

Er besitzt Identität, Version, Owner, Schnittstelle und Registrierung.

Ein Agent ohne Registrierung existiert für die Plattform nicht.

Ein Agent, dessen Ergebnis nicht reproduzierbar ist, ist kein Agent, sondern eine Quelle
zufälliger Werte.

---

# End of Chapter 1

---

# Chapter 2

# Agent Contract

## Pflichtangaben

Jeder Agent beschreibt verbindlich

agentId

name

version

owner

domain

responsibility

inputs

outputs

dependencies

llmUsage

deterministic

events

essReferences

adrReferences

---

# Agent Identity

Format

```text
agent:<domain>/<name>
```

Beispiele

```text
agent:crypto/CryptoRiskAgent
agent:equity/FundamentalsAgent
agent:shared/ClassificationAgent
```

Die ID bleibt über sämtliche Versionen stabil.

---

# Agent Classes

| Klasse | Bedeutung |
|---|---|
| Classification Agent | Einordnung eines Assets |
| Analysis Agent | fachliche Kennzahlenermittlung |
| Risk Agent | Risikobewertung |
| Sentiment Agent | Stimmungsauswertung |
| Valuation Agent | Bewertungsrechnung |
| Composite Agent | Zusammenführung mehrerer Agenten |

---

# Determinism Contract

Ein Agent deklariert verbindlich, ob er deterministisch ist.

| Wert | Bedeutung |
|---|---|
| `deterministic: true` | identische Eingabe erzeugt identische Ausgabe |
| `deterministic: false` | LLM-gestützt, Ergebnis kann variieren |

Nicht deterministische Agenten führen zusätzlich

verwendetes Modell

Temperatur oder gleichwertigen Parameter

Rückfallverhalten bei Nichtverfügbarkeit

Ein nicht deterministischer Agent darf **niemals** als alleinige Quelle einer
sicherheits-, abrechnungs- oder compliancerelevanten Entscheidung dienen.

---

# Data Integrity Contract

Verbindlich gemäß der bestehenden Plattformdirektive

Keine Mock-Daten im Produktivbetrieb.

Keine simulierten Werte, wo Echtdaten erwartet werden.

Jede Antwort wird strukturell validiert, bevor sie weiterverarbeitet wird.

Fehlende Daten führen zu einem erkennbaren Fehlerzustand, niemals zu einem erfundenen Wert.

---

# End of Chapter 2

---

# Chapter 3

# Orchestrator Contract

## Zweck

Ein Orchestrator führt mehrere Agenten zu einem Ergebnis zusammen.

## Pflichtangaben

orchestratorId

domain

beteiligte Agenten

Ausführungsreihenfolge

Zusammenführungsregel

Rückfallverhalten

Zeitgrenzen

---

# Auswahlregel

Die bestehende Hierarchie bleibt unverändert gültig:

Spezialisierte Orchestratoren werden zuerst befragt, sofern ein Asset ihrer Domäne
entspricht.

Die universelle Fallback-Engine ist ausschließlich für Assets zuständig, für die kein
spezialisierter Orchestrator existiert.

Dieser Grundsatz stammt aus der bestehenden Plattformdokumentation und wird hier nicht
verändert, sondern als Vertrag festgehalten.

---

# Isolation

Ein Agent ruft niemals einen anderen Agenten direkt auf.

Die Zusammenführung erfolgt ausschließlich über den Orchestrator.

---

# End of Chapter 3

---

# Chapter 4

# Registrierung und Events

## Agent Registry

Jeder Agent wird in der Enterprise Registry gemäß ESS-0001-CONTRACTS Chapter 7 geführt.

Registriert werden ID, Version, Klasse, Domäne, Owner, Determinismus, Health Status,
Schnittstelle, Events.

Nicht registrierte Agenten werden niemals ausgeführt.

---

## Events

### Erzeugte Events

AgentRegisteredEvent

AgentExecutedEvent

AgentFailedEvent

AgentDeprecatedEvent

OrchestratorExecutedEvent

ScoringCompletedEvent

### Konsumierte Events

ComponentRegisteredEvent

VersionChangedEvent

---

# Telemetrie

Jede Ausführung protokolliert Dauer, Ergebnisstatus, verwendetes Modell, Correlation ID.

Telemetriedaten enthalten niemals personenbezogene Daten.

---

# End of Chapter 4

---

# Chapter 5

# Integration und Bestand

## Bekannter Bestand

| Bereich | Umfang |
|---|---|
| `src/agents/` | acht Agenten |
| `src/orchestrator/` | zwei Orchestratoren (Crypto, Raw Materials) |
| `src/services/` | sieben Scoring- und Ranking-Services |
| `src/lib/requestOrchestrator.ts` | modellunabhängiges Routing |

Sämtliche Agenten folgen bereits einem einheitlichen Muster: exportierte Klasse je Agent,
teilweise mit exportiertem Ergebnis-Interface.

Diese Implementierung ist **produktiv** und wird gemäß ESS-0001-CONTRACTS Chapter 14
registriert und gekapselt — **niemals neu entwickelt**.

## Offene Befunde

| Befund | Regel |
|---|---|
| kein Agent besitzt einen Registry-Eintrag | Chapter 7 |
| kein Agent deklariert Determinismus | ESS-0008 Chapter 2 |
| Agenten liegen außerhalb von `src/features/<domain>` | GAP-009 |
| keine Agent-Events implementiert | Chapter 8 |
| keine Tests für Agenten | Chapter 12 |

## Supervisor

Überwacht Agent-Ausfälle, Zeitüberschreitungen, nicht registrierte Agenten und fehlende
Determinismus-Deklarationen.

## Documentary Engine

Erkennt Agenten gemäß ESS-0001 Chapter 3 automatisch und erzeugt Agent Registry sowie
Agent-Dokumentation.

---

# Enterprise Rules

Kein Agent ohne Registrierung.

Kein Agent ohne Determinismus-Deklaration.

Kein direkter Agent-zu-Agent-Aufruf.

Keine Mock-Daten im Produktivbetrieb.

Kein nicht deterministischer Agent als alleinige Quelle kritischer Entscheidungen.

Keine Änderung an Scoring-Algorithmen durch diesen Standard.

---

# Success Criteria

✓ sämtliche Agenten registriert

✓ sämtliche Agenten deklarieren Determinismus

✓ sämtliche Orchestratoren beschreiben ihre Zusammenführungsregel

✓ sämtliche Ausführungen erzeugen Telemetrie

✓ keine Mock-Daten im Produktivpfad

✓ Bestandsimplementierung gekapselt statt ersetzt

---

# Enterprise Final Summary

**Document ID** ESS-0008

**Titel** CAPITAL-AI AI Agent Framework

**Status** Enterprise Specification

**Version** 1.0.0

---

# Governance Statement

ESS-0008 ist die verbindliche Spezifikation des Rahmenwerks fachlicher Domänen-Agenten.

Sie verändert keine fachliche Bewertungslogik.

Abweichungen erfordern eine neue Architecture Decision Record.

---

# Version History

| Version | Status | Beschreibung |
|----------|--------|--------------|
| 1.0.0 | Initial Release | Erste Spezifikation des Agent-Rahmenwerks |

---

# End of Document

ESS-0008

CAPITAL-AI AI Agent Framework

Version 1.0.0
