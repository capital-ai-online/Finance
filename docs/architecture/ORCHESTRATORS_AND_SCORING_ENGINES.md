# CAPITAL-AI Orchestration & Scoring Architecture

**Document status:** canonical architecture projection  
**Last synchronized:** 2026-08-22  
**Protected scoring authority:** ADR-0087  
**FinTech workflow authority:** ADR-0099  
**DeFi evidence authority:** ADR-0100  
**Combined supersession evidence:** `docs/evidence/fintech-core/FINTECH_VALUE_CHAIN_SUPERSESSION_2026-08-22.md`  
**Meme/DeFi evidence:** `docs/evidence/sc-md/SC2_MEME_DEFI_MODEL_SUPERSESSION_2026-08-22.md`

> Diese Datei beschreibt den aktuellen Runtime-/Authority-Stand. Aeltere Specialized-first-, Universal-Fallback-, Gemini-, direkte Domain-Scoring- und vor-ADR-0087-Blueprint-Darstellungen sind superseded und besitzen keine aktuelle Architektur-Authority.

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
7. Correlated Raw Features duerfen vor validierter De-Korrelation/Latent-Factor-Transformation nicht mehrfach additiv gewichtet werden.
8. LLM-/Agent-Ausgaben sind keine Risk-, Compliance-, IAM-, Trading- oder Execution-Freigabe.

## 2. Rollenmodell

### Orchestrator

Ein Orchestrator komponiert Research-/Evidence-/Workflow-Schritte. Er darf spezialisierte Analysebausteine koordinieren, besitzt aber nicht automatisch Scoring- oder Execution-Authority.

`src/orchestrator/cryptoOrchestrator.ts` bleibt Research/Enrichment und `scoreEligible=false`. Weitere Assetklassen-Orchestratoren muessen dieselben UAI-/Evidence-/Dispatcher-Vertraege wiederverwenden.

### ScoringModelRegistry

Die Registry bestimmt versioniert, welche Modelle fuer welche Domain/Assetklasse produktiv zulaessig sind. Challenger-Modelle werden nicht implizit promoted.

### ScoringDispatcher

Der Dispatcher ist der einzige produktive Ausfuehrungspunkt fuer Scoring. Er delegiert an zugelassene Domain Executor Adapter und liefert `CanonicalScoreResult`.

### Domain Executor Adapter

Ein Adapter verbindet die zentrale Dispatcher-Authority mit einer fachlichen, registrierten Modellimplementierung. Er ist kein zweiter Dispatcher und darf keine eigene Modellselektion etablieren.

### FinTechCore

`src/platform/FinTechCore/` ist Financial Workflow Composition Authority gemaess ADR-0099. Der Core komponiert Research/Paper, Risk/Compliance, OrderIntent und Reconciliation, besitzt aber keine produktive Score-Berechnung und keine autonome reale Execution.

### Supervisor / EventMesh / Traceability

Supervisor und EventMesh beobachten bzw. transportieren Zustands-/Evidence-Signale. Sie duerfen weder Scoring- noch Compliance-/Execution-Entscheidungen heimlich ueberschreiben.

## 3. Crypto-Orchestration und Supersession B

### Research Boundary

Der Crypto-Orchestrator darf Asset-/Category-Kontext, Market-/On-Chain-/DeFi-/Pattern-Evidence sowie Evidence Quality/Availability anreichern. Er darf keine Registry-/Dispatcher-Selektion umgehen, fehlende Evidence synthetisieren oder Risk-/Compliance-/Execution-Freigaben erzeugen.

### Canonical Crypto Champion

Der produktive Crypto-Champion bleibt unveraendert:

```text
crypto-technical-provenance@0.7.0
```

Eine Meme-/DeFi-Klassifikation ist descriptive routing metadata und besitzt keine Model-Promotion-Authority.

### Meme Challenger 0.2.0

`crypto-meme-integrity@0.2.0` verwendet `crypto-meme-research-features/0.2.0` und bleibt:

```text
lifecycle=challenger
scoreEligible=false
evidencePolicy=research-only
executor=research-only:not-executable
executableWeights=false
```

Die historische 35/25/20/20-Formel des `MemeCoinScoringService` ist non-authorizing und wird nicht in den Challenger uebernommen.

Korrelation:

- `technical.trend`
- `technical.momentum`
- `risk.volatilityQuality`

liegen gemeinsam in `meme-price-path`. Vor einer spaeteren Gewichtung ist ein validierter Latent-Factor/De-Korrelationsschritt erforderlich. Liquidity darf weder Community/Popularity noch Manipulation Risk ersetzen. Contract-Integrity und Manipulation-Risk sind Promotion-Gates.

### DeFi Challenger 0.2.0

`crypto-defi-fundamental@0.2.0` verwendet `crypto-defi-research-features/0.2.0` und bleibt ebenfalls non-executable.

Die Raw-Evidence-Werte

- `protocol.tvlUsd`
- `protocol.feesUsd`
- `protocol.revenueUsd`

liegen gemeinsam in `defi-scale-activity`. Drei unabhaengige additive positive Gewichte sind ohne validierte De-Korrelation oder Latent-Factor-Transformation nicht zulaessig.

### DeFiLlama

ADR-0100 akzeptiert DeFiLlama ausschliesslich als Evidence-Provider. Es ist kein Score, Ranking, Eligibility Gate, Dispatcher, Orchestrator oder Order Authority.

`defi-protocol-evidence/1.1.0` ist fail-closed:

```text
READY              -> alle emittierten Features VERIFIED
PARTIAL            -> mindestens ein VERIFIED, Set nicht vollstaendig verified
STALE              -> kein VERIFIED, stale Evidence vorhanden
SOURCE_UNAVAILABLE -> keine verified/stale Evidence verfuegbar
```

`STALE`, `NOT_AVAILABLE` und `INVALID` erfuellen keine REQUIRED-/HARD_GATE-Semantik.

## 4. FinTech Core Crypto Module 01

Die Financial Workflow Chain lautet bis FT-6B:

```text
Research / Evidence
  -> canonical Scoring Result (falls fuer Workflow benoetigt)
  -> deterministic Portfolio/Risk inputs
  -> FT-5 Risk Decision Record
  -> FT-5 Compliance Decision Record
  -> FT-6B canonical OrderIntent binding
  -> PAPER-only simulated handoff
  -> typed Reconciliation
  -> durable Evidence / Supervisor signal
```

### FT-6B Invarianten

- ein `FinTechCoreOrderIntent`;
- ein `FinTechCoreFixedPoint` fuer execution-relevante Quantity/Price/Money-Werte;
- Risk-/Compliance-Approval ausschliesslich aus deterministischen FT-5 Decision Records;
- Decision ID/Hash und Policy ID/Version werden immutable gebunden;
- `clientOrderId`, `idempotencyKey`, `intentHash` werden deterministisch erzeugt;
- PAPER bleibt Simulation;
- Reconciliation-Mismatch bleibt unresolved Evidence und wird nicht automatisch repariert;
- keine reale Exchange-/Wallet-/Custody-Capability vor FT-7+.

### Operating Modes — Owner-approved fail-closed

Die stale Future-Capability-Projektion wurde nach expliziter Owner-Freigabe korrigiert:

```text
RESEARCH      real=false simulated=false newOrders=false
PAPER         real=false simulated=true  newOrders=true
GUARDED_LIVE  real=false simulated=false newOrders=false
PRODUCTION    real=false simulated=false newOrders=false
EMERGENCY     real=false simulated=false newOrders=false
```

`isOrderIntentEligibleForRealExecution(...)` bleibt fuer jeden Modus `false`. FT-7+ benoetigt eine separate Architektur-/Security-Entscheidung.

### Legacy Persistence Projection

Kanonische BOUND-FT-6B-Intents verwenden den v2-Persistence-RPC. Der weiterhin vorhandene v1-`UNBOUND`-Pfad ist ausschliesslich Legacy-/Research-Kompatibilitaet und keine zweite OrderIntent- oder Execution-Authority. Seine physische Entfernung benoetigt Consumer-/Replay-/Bestandsdaten-Evidence und bei Security-/Persistence-Boundary-Aenderung eine separate Owner-Freigabe.

## 5. Superseded Topologien

Folgende fruehere Aussagen gelten nicht mehr als aktuelle Authority:

- Specialized-first / Universal Fallback;
- direkte Crypto-/Meme-Scoring-Authority aus API-/UI-Pfaden;
- providergebundene Gemini-/LLM-Scoring-Architektur;
- historische Crypto-/Meme-/DeFi-Gewichte ausserhalb der aktuellen Registry-/Model-Governance;
- implizite DeFiLlama-to-Score-Verbindungen;
- additive Mehrfachgewichtung korrelierter DeFi- oder Meme-Rohsignale ohne validierte De-Korrelation.

Aktuell gilt immer:

```text
Registry -> Dispatcher -> registrierter Domain Executor -> CanonicalScoreResult
```

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
- Meme/DeFi-Model-Promotion ist ein eigener human-gated Model-Governance-Prozess innerhalb ADR-0087, keine neue Architektur.

## 8. Dokumenten-Authority

Bei Widerspruch gilt folgende Reihenfolge:

1. aktive ADR-/Governance-Authorities, insbesondere ADR-0087, ADR-0099 und ADR-0100;
2. kanonische Runtime Contracts/Registries;
3. aktuelle Roadmaps/Evidence;
4. diese Architekturprojektion;
5. historische/superseded Beschreibungen.

Diese Datei darf nicht verwendet werden, um eine zweite Scoring-, Orchestrator-, Financial-Control- oder Execution-Authority zu begruenden.

## 9. Expliziter Supersession-Index fuer historische FinTech-Projektionen

| Historischer Pfad | Rolle heute | Current-state replacement |
|---|---|---|
| `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` | historischer Audit-Snapshot 2026-07-31 | ADR-0087 + ADR-0099 + aktuelle Registries |
| `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_NACHAUDIT.md` | historischer Audit-Snapshot 2026-08-02 | ADR-0087 + ADR-0099 + aktuelle Registries |
| `docs/architecture/ENTERPRISE_FINTECH_FINALIZATION_REPORT.md` | historischer Finalisierungs-/Remediation-Snapshot 2026-07-31 | aktuelle FinTech-Core-Roadmap + ADR-0087/0099/0100 |
| `docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md` | superseded Pre-Single-Dispatcher Blueprint | ADR-0087 / `ScoringModelRegistry` / `ScoringDispatcher` |

Physische Verschiebung/Loeschung dieser Artefakte ist nicht erforderlich, solange ihre historische Rolle eindeutig und die Referenzierbarkeit fuer Audit/RAG/Tests erhalten bleibt. Eine spaetere Archiv-Migration darf nur mit Referenz-/Consumer-Pruefung erfolgen.

## 10. Current State

```text
FT-0 ... FT-6B = DONE on main
Supersession A = IMPLEMENTED in branch / pending PR
Supersession B = IMPLEMENTED in same branch / pending PR
crypto champion = crypto-technical-provenance@0.7.0 unchanged
Meme/DeFi productive promotion = BLOCKED
FT-7 = BLOCKED
FT-8 = PLANNED
FT-9 = PLANNED
```

Verbleibende Meme-/DeFi-Arbeiten sind Evidence-/Validation-/Promotion-Arbeit innerhalb der bestehenden Architektur. Sie begruenden keinen weiteren Dispatcher, keine weitere Registry und keine zweite Persistence-/Governance-Authority.
