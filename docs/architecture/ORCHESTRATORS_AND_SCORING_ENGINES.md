# CAPITAL-AI Orchestration & Scoring Architecture

**Document status:** canonical architecture projection  
**Last synchronized:** 2026-08-22  
**Protected scoring authority:** ADR-0087  
**FinTech workflow authority:** ADR-0099  

> Diese Datei beschreibt den aktuellen Runtime-/Authority-Stand. Aeltere Specialized-first-, Universal-Fallback-, Gemini- und direkte Domain-Scoring-Darstellungen sind superseded und besitzen keine aktuelle Architektur-Authority.

## 1. Grundprinzip

CAPITAL-AI trennt Research-Orchestration, Evidence Acquisition, produktive Scoring-Ausfuehrung und Financial Workflow Composition strikt.

Die kanonische produktive Scoring-Kette lautet:

```text
Universal Asset Identity (UAI)
  -> Evidence Acquisition
  -> Evidence / Data Quality Gate
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor Adapter
  -> CanonicalScoreResult
  -> Ranking / Eligibility
  -> EventMesh / Traceability / Supervisor
```

### Nicht verhandelbare Regeln

1. `ScoringDispatcher` ist die einzige produktive Scoring-Execution-Authority.
2. `ScoringModelRegistry` ist die einzige produktive Model-Registry-Authority.
3. Domain-Orchestratoren duerfen Research/Evidence anreichern, aber keine produktive Score-Authority bilden.
4. Kein Specialized-first-/Fallback-Routing darf `ScoringDispatcher` umgehen.
5. Missing/stale/invalid Evidence wird nicht zu `0`, PASS oder synthetischer Verfuegbarkeit umgedeutet.
6. Challenger-/Category-/Meme-/DeFi-Modelle werden nur ueber explizite Registry-/Governance-Promotion produktiv.
7. LLM-/Agent-Ausgaben sind keine Risk-, Compliance-, IAM-, Trading- oder Execution-Freigabe.

## 2. Rollenmodell

### Orchestrator

Ein Orchestrator komponiert Research-/Evidence-/Workflow-Schritte. Er darf spezialisierte Analysebausteine koordinieren, besitzt aber nicht automatisch Scoring- oder Execution-Authority.

Beispiele:

- `src/orchestrator/cryptoOrchestrator.ts` — Research/Enrichment, `scoreEligible=false`;
- weitere Assetklassen-Orchestratoren duerfen dieselben UAI-/Evidence-/Dispatcher-Vertraege wiederverwenden, ohne eigene produktive Scoring-Architektur zu erzeugen.

### ScoringModelRegistry

Die Registry bestimmt versioniert, welche Modelle fuer welche Domain/Assetklasse produktiv zulaessig sind. Challenger-Modelle werden nicht implizit promoted.

### ScoringDispatcher

Der Dispatcher ist der einzige produktive Ausfuehrungspunkt fuer Scoring. Er delegiert an zugelassene Domain Executor Adapter und liefert `CanonicalScoreResult`.

### Domain Executor Adapter

Ein Adapter verbindet die zentrale Dispatcher-Authority mit einer fachlichen, registrierten Modellimplementierung. Er ist kein zweiter Dispatcher und darf keine eigene Modellselektion etablieren.

### FinTechCore

`src/platform/FinTechCore/` ist Financial Workflow Composition Authority gemaess ADR-0099. Der Core komponiert Research/Paper, Risk/Compliance, OrderIntent und Reconciliation, aber besitzt keine produktive Score-Berechnung und keine autonome reale Execution.

### Supervisor / EventMesh / Traceability

Supervisor und EventMesh beobachten bzw. transportieren Zustands-/Evidence-Signale. Sie duerfen weder Scoring- noch Compliance-/Execution-Entscheidungen heimlich ueberschreiben.

## 3. Crypto-Orchestration

### Research Boundary

Der Crypto-Orchestrator darf unter anderem:

- Asset-/Category-Kontext anreichern;
- Market-/On-Chain-/DeFi-/Pattern-Evidence zusammentragen;
- Evidence Quality/Availability sichtbar machen;
- Research-Resultate fuer nachgelagerte kanonische Contracts vorbereiten.

Er darf nicht:

- direkt einen produktiven finalen Score autorisieren;
- Registry-/Dispatcher-Model Selection umgehen;
- fehlende Evidence synthetisieren;
- Risk-/Compliance-Approval erteilen;
- OrderIntent oder reale Order ausfuehren.

### DeFiLlama

DeFiLlama ist read-only Evidence Acquisition fuer DeFi-Protokolldaten. Es ist kein Score, kein Ranking, kein Eligibility Gate und keine Order Authority.

### Meme / DeFi Challenger

Meme-/DeFi-spezifische Modelllogik kann als Challenger oder registrierter Domain Executor existieren. Produktiv wird sie nur nach expliziter Registry-/Governance-Promotion. Direkte Server-/UI-Aufrufe duerfen keine parallele produktive Authority etablieren.

## 4. FinTech Core Crypto Module 01

Die Financial Workflow Chain lautet bis FT-6:

```text
Research / Evidence
  -> canonical Scoring Result (falls fuer Workflow benoetigt)
  -> deterministic Portfolio/Risk inputs
  -> FT-5 Risk Decision Record
  -> FT-5 Compliance Decision Record
  -> FT-6 canonical OrderIntent binding
  -> PAPER-only simulated handoff
  -> typed Reconciliation
  -> durable Evidence / Supervisor signal
```

### FT-6 Invarianten

- ein `FinTechCoreOrderIntent`;
- ein `FinTechCoreFixedPoint` fuer execution-relevante Quantity/Price/Money-Werte;
- Risk-/Compliance-Approval ausschliesslich aus deterministischen FT-5 Decision Records;
- Decision ID/Hash und Policy ID/Version werden immutable gebunden;
- `clientOrderId`, `idempotencyKey`, `intentHash` werden deterministisch erzeugt;
- `RESEARCH`, `GUARDED_LIVE`, `PRODUCTION` erzeugen in FT-6 keinen Execution-Handoff;
- PAPER bleibt Simulation;
- Reconciliation-Mismatch bleibt unresolved Evidence und wird nicht automatisch repariert;
- keine reale Exchange-/Wallet-/Custody-Capability vor FT-7+.

## 5. Superseded Topologien

Folgende fruehere Aussagen gelten **nicht** mehr als aktuelle Authority:

### Specialized-first / Universal Fallback

Die fruehere Topologie

```text
Specialized Scoring Service first
  else Universal Fallback Engine
```

ist superseded. Sie wuerde eine parallele Modellselektion ausserhalb der Registry-/Dispatcher-Kette erlauben.

Aktuell gilt immer:

```text
Registry -> Dispatcher -> registrierter Domain Executor -> CanonicalScoreResult
```

### Direkte Crypto-/Meme-Scoring-Authority

Historische Beschreibungen, nach denen `CryptoScoringService`, `MemeCoinScoringService` oder andere Services direkt aus API-/UI-Pfaden die produktive Gesamt-Scoring-Authority bilden, sind superseded. Solche Implementierungen duerfen nur hinter dem kanonischen Dispatcher/Adapter-Vertrag produktive Autoritaet erhalten.

### Gemini-/Provider-Abhaengigkeit

Eine fruehere Beschreibung, wonach spezialisierte Orchestratoren zwingend `@google/genai`, `gemini-2.5-flash` oder einen anderen konkreten LLM-Provider benoetigen, ist superseded.

Research-/Agent-Provider sind austauschbare, nicht-autorisierende Komponenten. Die produktive Scoring- und Financial-Control-Authority bleibt deterministisch und providerunabhaengig.

### Historische Scoring-Formeln

Aeltere in diesem Dokument gefuehrte Crypto-/Meme-/Commodity-Gewichte und Formeln sind keine aktuelle Model-Registry-Authority. Aktive Gewichte, Versionen und Promotion-Status werden ausschliesslich durch die kanonische Scoring-Modell-/Registry-Governance bestimmt.

## 6. Assetklassen-Erweiterung

Kuenftige Orchestratoren fuer Aktien, Rohstoffe, Indizes und Forex muessen dieselben Plattformvertraege wiederverwenden:

```text
UAI
Evidence / DQ
Feature Contract
ScoringModelRegistry
ScoringDispatcher
CanonicalScoreResult
Ranking / Eligibility
EventMesh / Traceability
```

Assetklassen duerfen eigene Research-/Feature-/Executor-Module besitzen, aber keine zweite Dispatcher-, Registry-, Evidence-, Queue-, Persistence- oder Governance-Architektur.

## 7. Security / Governance Boundaries

- IAM/AuthN/AuthZ bleibt bei der bestehenden IAM Authority.
- Compliance Legal Applicability bleibt ausserhalb des FinTechCore-Evaluators.
- Risk-/Compliance-Policy-Werte sind versionierte externe Policy Snapshots.
- LLM/Agents duerfen keine Approval States setzen.
- Exchange Credentials, Wallet Keys und Custody Secrets liegen nicht im FT-6 Domain Layer.
- `public.outbox_jobs` bleibt Queue-/Lease-Authority.
- `fintech_core` bleibt privates Financial-Persistence-Schema.
- Production-/Guarded-Live-Cutover ist ein separater, human-gated FT-7+ Prozess.

## 8. Dokumenten-Authority

Bei Widerspruch gilt folgende Reihenfolge:

1. aktive ADR-/Governance-Authorities, insbesondere ADR-0087 und ADR-0099;
2. kanonische Runtime Contracts/Registries;
3. aktuelle Roadmaps/Evidence;
4. diese Architekturprojektion;
5. historische/superseded Beschreibungen.

Diese Datei darf nicht verwendet werden, um eine zweite Scoring-, Orchestrator-, Financial-Control- oder Execution-Authority zu begruenden.
