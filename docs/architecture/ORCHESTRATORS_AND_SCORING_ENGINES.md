# CAPITAL-AI Orchestration & Scoring Architecture

**Document status:** canonical architecture projection  
**Last synchronized:** 2026-08-23  
**Protected scoring authority:** ADR-0087  
**FinTech workflow authority:** ADR-0099  
**DeFi evidence authority:** ADR-0100  
**Meme/DeFi supersession evidence:** `docs/evidence/sc-md/SC2_MEME_DEFI_MODEL_SUPERSESSION_2026-08-22.md`  
**Meme/DeFi research implementation evidence:** `docs/evidence/sc-md/SC3_CRYPTO_MEME_DEFI_ORCHESTRATOR_SCORING_2026-08-22.md`  
**Equity P0 evidence:** `docs/evidence/sc-md/SC2_EQUITY_ORCHESTRATOR_P0_CHALLENGER_2026-08-23.md`  
**Equity P1 evidence:** `docs/evidence/sc-md/SC2_EQUITY_P1_EVIDENCE_RUNTIME_2026-08-23.md`, `docs/evidence/sc-md/SC2_EQUITY_P1_SEC_EDGAR_2026-08-23.md`

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
5. Missing/stale/invalid Evidence wird nicht zu `0`, PASS, neutralem Score oder synthetischer Verfuegbarkeit umgedeutet.
6. Challenger-/Category-/Meme-/DeFi-/Equity-Modelle werden nur ueber explizite Registry-/Governance-Promotion produktiv.
7. Correlated Raw Features duerfen vor validierter De-Korrelation/Latent-Factor-Transformation nicht mehrfach additiv gewichtet werden.
8. LLM-/Agent-Ausgaben sind keine Risk-, Compliance-, IAM-, Trading- oder Execution-Freigabe.
9. Research Scores, Research Trade Scores und Kill-Switch-Empfehlungen sind keine `CanonicalScoreResult`-, Order- oder Policy-Authority.

## 2. Rollenmodell

### Orchestrator

Ein Orchestrator komponiert Research-/Evidence-/Workflow-Schritte. Er darf spezialisierte Analysebausteine koordinieren, besitzt aber nicht automatisch Scoring- oder Execution-Authority.

`src/orchestrator/cryptoOrchestrator.ts` bleibt Research/Enrichment und `scoreEligible=false`. Die Methode `analyzeCategoryResearchModels(...)` delegiert deterministische Meme-/DeFi-/Signal-Research-Modelle an die Scoring-Plattform; sie erzeugt keine produktive Score- oder Order-Authority.

Der Equity-Orchestrator folgt derselben Regel: `EquityOrchestrator` ist eine Domain-Research-Grenze. Produktive Stock-Execution darf erst nach separater Promotion hinter dem bestehenden `ScoringDispatcher` erfolgen.

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

## 3. Crypto-Orchestration und Meme/DeFi Research 0.3.0

### Canonical Crypto Champion

Der produktive Crypto-Champion bleibt unveraendert:

```text
crypto-technical-provenance@0.7.0
```

Meme-/DeFi-Klassifikation, Research Scores, Regime-, Pattern-, Sentiment- und Momentum-Kontext besitzen keine Model-Promotion-Authority.

### Meme Challenger 0.3.0

```text
model=crypto-meme-integrity@0.3.0
featureContract=crypto-meme-research-features/0.3.0
lifecycle=challenger
scoreEligible=false
evidencePolicy=research-only
executor=research-only:not-executable
executableWeights=false
```

Der source-backed Research Evaluator modelliert:

- Execution/Liquidity: Liquidity, Slippage, Volume Consistency, Spread, Liquidity Lock;
- Market Structure: 1h/24h Return Quality, Volume Acceleration, Relative Strength, Breakout, Funding;
- Holder Distribution: Top-10/Top-50, Team, Exchange, Sniper, Dormant Whale;
- Contract/Rug Risk: Mint, Blacklist, Tax, Liquidity Unlock, Proxy Upgrade, Deployer Concentration, Honeypot Simulation;
- Social Authenticity: Unique Authors, Engagement, Mention Velocity, Sentiment Consensus, Influencer Diversity, Bot Resistance;
- Narrative und Exchange Access.

Source-defined top-level research weights:

```text
liquidity        0.25
marketStructure  0.20
sentiment        0.18
narrative        0.15
distribution     0.12
exchangeAccess   0.10
```

Hard Gates umfassen Buy-/Sell-Simulation, Liquidity Lock, Transfer Tax, Contract Integrity und Manipulation Evidence. Weniger als zwei unabhaengige Market Confirmations fuer Social Evidence ergibt `NOT_COMPUTABLE`.

Die historische 35/25/20/20-Formel aus `MemeCoinScoringService` bleibt non-authorizing.

### DeFi Challenger 0.3.0

```text
model=crypto-defi-fundamental@0.3.0
featureContract=crypto-defi-research-features/0.3.0
lifecycle=challenger
scoreEligible=false
evidencePolicy=research-only
executor=research-only:not-executable
executableWeights=false
```

Der source-backed Research Evaluator modelliert:

- Utilization: Users, Transactions, Organic Volume, TVL Stability, Retention, Developer Activity;
- Revenue/Fundamentals: Fees, Revenue, Growth, Diversification;
- Liquidity: Pool Depth, Volume/Liquidity, Slippage, Persistence, Market Count, Diversification;
- Smart-Contract Security;
- Oracle Integrity;
- Tokenomics;
- Governance;
- Ecosystem;
- Contract/Liquidity/Oracle/Governance/Fundamental/Tokenomics/Bridge Risk.

Source-defined top-level research weights:

```text
fundamentals      0.20
utilization       0.18
liquidity         0.17
contractSecurity  0.15
governance        0.12
tokenomics        0.10
ecosystem         0.08
```

`protocol.tvlUsd`, `protocol.feesUsd` und `protocol.revenueUsd` bleiben gemeinsam in `defi-scale-activity`; sie werden nicht als drei unabhaengige additive Top-Level-Signale verwendet.

Hard Gates blockieren insbesondere unverifizierte Smart-Contract Evidence, Oracle Risk ausserhalb Policy, unbekannte Mint-Authority und unresolved Exploits.

### Research Scoring vs. Productive Promotion

`CryptoCategoryResearchScoring.ts` besitzt source-defined Research-Gewichte und erzeugt Fingerprint-Lineage fuer den Research-Lauf. Das ist **nicht** gleichbedeutend mit produktiven/executable Registry Weights.

Eine produktive Promotion benoetigt weiterhin:

- verifizierte Feature-Provider mit DQ/Freshness;
- versionierte executable weights;
- Out-of-sample/Backtesting/Stress-Evidence;
- Korrelations-/Double-Counting-Pruefung;
- explizite Owner-Freigabe;
- Binding ueber dieselbe `ScoringModelRegistry -> ScoringDispatcher`-Authority.

### DeFiLlama

ADR-0100 akzeptiert DeFiLlama ausschliesslich als Evidence-Provider. Es ist kein Score, Ranking, Eligibility Gate, Dispatcher, Orchestrator oder Order Authority.

`defi-protocol-evidence/1.1.0` bleibt fail-closed:

```text
READY              -> alle emittierten Features VERIFIED
PARTIAL            -> mindestens ein VERIFIED, Set nicht vollstaendig verified
STALE              -> kein VERIFIED, stale Evidence vorhanden
SOURCE_UNAVAILABLE -> keine verified/stale Evidence verfuegbar
```

`STALE`, `NOT_AVAILABLE` und `INVALID` erfuellen keine REQUIRED-/HARD_GATE-Semantik.

## 4. Added Feature Kit: Sentiment, Momentum, Regime, Pattern, Signal Fusion

### Sentiment

`crypto-sentiment-research/0.1.0` verbindet Polarity, Intensity, Novelty, Credibility, Bot Probability, Recency Decay, Source Weight, Mention Intensity, Regime Adjustment und Evidence References.

Fehlt informative Evidence, gilt `NOT_COMPUTABLE`; der im Source-Beispiel verwendete Neutral-Default `50` ist fuer CAPITAL-AI superseded.

### Momentum

`crypto-momentum-research/0.1.0` verbindet H1/H4/D1 Returns, Trend Strength, Relative Strength, Volume Ratio, Volume Acceleration, Open Interest, Liquidity Change sowie RSI/Funding/Liquidity Penalties.

Missing Open Interest wird nicht zu `0`, sondern durch deterministische Effective-Weight-Renormalisierung behandelt und als Missing Field ausgewiesen.

MACD Histogram, ADX, Trend Slope, ATR Percent und Volume Expansion aus dem neuen Kit sind im Research Output inventarisiert. Da das Source-Material keine kanonische Gewichtsmatrix fuer diese Erweiterung festlegt, bleiben sie bis zu einer Modellrevision unweighted telemetry.

### Regime

Es entsteht keine zweite Regime-Authority. Source-Phasen werden auf den bestehenden `MarketRegime`-Vertrag projiziert:

```text
TREND_UP      -> BULL
TREND_DOWN    -> BEAR
ACCUMULATION  -> RANGE + annotation
PANIC         -> STRESS
ILLIQUID      -> STRESS
DISTRIBUTION  -> UNKNOWN + transition=true
VOLATILE      -> HIGH_VOLATILITY nur mit governed threshold
NEUTRAL       -> RANGE
```

### Multi-Timeframe Pattern Confluence

Die bestehende `PatternResearchEngine`/`PatternSignalResolver`-Authority wird wiederverwendet. Das neue Confluence-Modul akzeptiert nur `SUPPORTED_CONTEXT`, fordert mindestens zwei gleichgerichtete Timeframes und mindestens eine Higher-Timeframe-Bestaetigung `>=4h`.

Es entsteht kein neuer Pattern Detector und kein paralleles Pattern-Routing.

### Signal Fusion

Source-defined Research Fusion:

```text
regimeFit        0.30
momentum         0.25
patternQuality   0.20
sentiment        0.15
executionQuality 0.10
```

`tradeScore >= 70` und `regimeFit >= 60` werden nur als `sourceThresholdsMet` gespiegelt. Das Ergebnis ist `RESEARCH_CONTEXT_ONLY_NOT_TRADE_AUTHORIZATION` und `executionEligible=false`.

## 5. Kill-Switch Research Telemetry

Das hinzugefuegte L1-L4-Modell wird als read-only Risk Telemetry abgebildet:

```text
L1_SOFT_PAUSE
L2_SESSION_HALT
L3_BROKER_DISCONNECT
L4_HARD_KILL
```

Der Evaluator liefert Trigger, Recommended Actions und `manualUnlockRequired`, fuehrt aber keine Aktion aus. Er besitzt weder Broker-/Order-/Risk-Policy- noch Runtime-Mutation-Authority.

Die im Source-Kit genannten Limits (u. a. Daily Loss, Session Loss, Consecutive Losses, Reject Rate, Slippage) sind `RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY`.

Die im Source-Kit ebenfalls enthaltenen `deployment.environment=production` / `mode=live` Angaben werden nicht uebernommen.

## 6. FinTech Core Crypto Module 01

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

```text
RESEARCH      real=false simulated=false newOrders=false
PAPER         real=false simulated=true  newOrders=true
GUARDED_LIVE  real=false simulated=false newOrders=false
PRODUCTION    real=false simulated=false newOrders=false
EMERGENCY     real=false simulated=false newOrders=false
```

`isOrderIntentEligibleForRealExecution(...)` bleibt fuer jeden Modus `false`. FT-7+ benoetigt eine separate Architektur-/Security-Entscheidung.

### Legacy Persistence Projection

Kanonische BOUND-FT-6B-Intents verwenden den v2-Persistence-RPC. Der weiterhin vorhandene v1-`UNBOUND`-Pfad ist ausschliesslich Legacy-/Research-Kompatibilitaet und keine zweite OrderIntent- oder Execution-Authority.

## 7. Superseded Topologien

Folgende fruehere Aussagen gelten nicht mehr als aktuelle Authority:

- Specialized-first / Universal Fallback;
- direkte Crypto-/Meme-/DeFi-/Equity-Scoring-Authority aus API-/UI-/Orchestrator-Pfaden;
- providergebundene Gemini-/LLM-Scoring-Architektur;
- historische Crypto-/Meme-/DeFi-Gewichte ausserhalb der aktuellen Registry-/Model-Governance;
- implizite DeFiLlama-to-Score-Verbindungen;
- additive Mehrfachgewichtung korrelierter DeFi-, Meme- oder Equity-Rohsignale;
- parallele Regime-/Pattern-Authorities neben den bestehenden FinTechCore Contracts;
- Research Trade Score als Execution-Freigabe.

Aktuell gilt produktiv immer:

```text
Registry -> Dispatcher -> registrierter Domain Executor -> CanonicalScoreResult
```

## 8. Assetklassen-Erweiterung — Equity P1 / Model 0.2.0

Der Aktien-spezifische Domain-Orchestrator ist als Research-Challenger innerhalb derselben Plattformvertraege implementiert:

```text
UAI(stock)
  -> existing Fundamentals / Market History / SEC Evidence Acquisition
  -> market-evidence-dq/1.0.0
  -> equity-classification/0.1.0
  -> equity-multifactor-features/0.2.0
  -> Equity Feature / Filing / Comparable Composition
  -> ScoringModelRegistry: equity-multifactor@0.2.0 challenger
  -> EquityOrchestrator research-only
  -> kein CanonicalScoreResult / kein Ranking / keine Execution
```

Die research-only Runtime-Projektion lautet:

```text
AlphaVantage/FMP Fundamentals
  + TwelveData/EODHD provenance-aware History
  + SEC CompanyFacts current/prior as-of
  -> EquityFeatureComposer
  -> EquityVendorDerivedFeatureComposer
  -> EquityFilingDerivedMetrics / EquityFilingFeatureComposer
  -> EquityComparableFilingMetrics / EquityComparableFilingFeatureComposer
  -> EquityOrchestrator
```

`equity-research-runtime/0.4.0` besitzt keine oeffentliche Route, keinen Persistence Writer, keinen `CanonicalScoreResult` und keine Ranking-/Execution-Authority.

Der produktive Pfad bleibt unveraendert:

```text
stock -> traditional-scoring@2.1.0 -> ScoringDispatcher -> CanonicalScoreResult
```

### Equity Factor Families

Equity 0.2.0 verwendet sechs korrelationsgebundene Top-Level-Familien:

- Quality;
- Valuation;
- Growth;
- Momentum;
- Financial Strength;
- Capital Allocation.

Nur diese Familien erhalten Top-Level-Gewichte. Raw-/Derived-Subfeatures werden innerhalb ihrer oekonomischen Familie komponiert und duerfen nicht erneut als generischer Bonus eingehen.

Aktueller Research-Stand:

| Family | Evidence / Composition |
|---|---|
| Quality | Profitability/Operating Margin/ROE plus same-provider/same-observation TTM FCF Conversion when admissible |
| Valuation | P/E, Price-to-Book plus attributable FCF/share / fresh real close FCF Yield |
| Growth | vendor quarterly fallback; comparable SEC Revenue/EPS/FCF YoY supersedes same-correlation proxies when sufficiently covered |
| Momentum | 12-1 and 6-1 from real dated provenance-aware history |
| Financial Strength | vendor leverage fallback; SEC Current Ratio/Debt/Interest Coverage may supersede same-correlation vendor evidence |
| Capital Allocation | comparable Share-Count Change + Distribution Coverage jointly required; Reinvestment Intensity context-only |

FCF Conversion wird nicht aus gemergten AlphaVantage/FMP-Displaywerten berechnet, sondern nur aus einem gleichen Provider-/Observation-Paar. FCF Yield benoetigt attributable FCF/share und einen frischen realen Market-History-Close. Beide Features duerfen nur bestehende Quality-/Valuation-Familien anreichern und keine Family-Coverage allein herstellen.

### SEC Evidence Boundary

SEC EDGAR bleibt Evidence Acquisition:

- keyless CompanyFacts;
- deklarierter User-Agent/Fair-Access;
- SEC-publizierte Ticker/CIK-Zuordnung;
- `filedAt <= asOf`;
- getrennte Instant/Periodic/YTD-Kontexte;
- providerneutrale Filing Bridges;
- aktuelle und vergleichbare Vorperioden ueber denselben gecachten Adapter;
- keine SEC-spezifische Score-/Registry-/DQ-/Ranking-Authority.

Industry-/Taxonomy-Metadaten, Size Bucket, Style Tags und das Primary Scoring Profile sind getrennt. GICS kann nur als lizenz-/providerzulaessige externe Klassifikation verwendet werden und wird nicht als proprietaerer Datensatz in CAPITAL-AI hardcodiert.

Regime, Sektorrotation, Sentiment und Pattern bleiben in Equity 0.2.0 `context-only` ohne `scoreImpact`/`rankingImpact`. Missing/stale/unverified Evidence bleibt missing. Ein Research-Composite verlangt mindestens vier admissible Familien, mindestens 70 Prozent nominale Gewichtsabdeckung und profile-semantische Pflichtfamilien.

Eine spaetere produktive Promotion muss `stock` atomar aus `traditional-scoring` herausloesen und einen Equity-Champion hinter demselben `ScoringDispatcher` registrieren. Ein zweiter Dispatcher, eine zweite Registry, ein route-lokaler Equity-Score oder zwei gleichberechtigte canonical Stock-Champions bleiben verboten.

Vor Promotion bleiben Peer-/Sector-relative Normalisierung, Winsorization/Outlier Policy, kontrolliertes Rolling/OOS-Backtesting, Correlation Review und Owner Approval zwingend.

Die gleichen Plattformvertraege gelten fuer weitere Orchestratoren fuer Rohstoffe, Indizes und Forex. Assetklassen duerfen eigene Research-/Feature-/Executor-Module besitzen, aber keine zweite Dispatcher-, Registry-, Evidence-, Queue-, Persistence- oder Governance-Architektur.

## 9. Security / Governance Boundaries

- IAM/AuthN/AuthZ bleibt bei der bestehenden IAM Authority.
- Compliance Legal Applicability bleibt ausserhalb des FinTechCore-Evaluators.
- Risk-/Compliance-Policy-Werte sind versionierte externe Policy Snapshots.
- LLM/Agents duerfen keine Approval States setzen.
- Exchange Credentials, Wallet Keys und Custody Secrets liegen nicht im Research-/FT-6 Domain Layer.
- `public.outbox_jobs` bleibt Queue-/Lease-Authority.
- `fintech_core` bleibt privates Financial-Persistence-Schema.
- Production-/Guarded-Live-Cutover ist ein separater, human-gated FT-7+ Prozess.
- Meme/DeFi-Model-Promotion ist ein eigener human-gated Model-Governance-Prozess innerhalb ADR-0087, keine neue Architektur.
- Equity-Model-Promotion ist ebenfalls ein eigener human-gated Model-Governance-Prozess innerhalb ADR-0087 und muss den bestehenden Stock-Champion atomar abloesen.
- FinBERT/social/news/orderbook/derivatives/contract-scanner/holder-clustering/honeypot/oracle/audit Provider muessen ueber bestehende Provider-/Evidence-/DQ-Vertraege angebunden werden; ihre blosse Nennung im Source-Kit erteilt keine Provider-Authority.

## 10. Dokumenten-Authority

Bei Widerspruch gilt folgende Reihenfolge:

1. aktive ADR-/Governance-Authorities, insbesondere ADR-0087, ADR-0099 und ADR-0100;
2. kanonische Runtime Contracts/Registries;
3. aktuelle Roadmaps/Evidence;
4. diese Architekturprojektion;
5. historische/superseded Beschreibungen.

Diese Datei darf nicht verwendet werden, um eine zweite Scoring-, Orchestrator-, Financial-Control- oder Execution-Authority zu begruenden.

## 11. Historischer Supersession-Index

| Historischer Pfad | Rolle heute | Current-state replacement |
|---|---|---|
| `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` | historischer Audit-Snapshot | ADR-0087 + ADR-0099 + aktuelle Registries |
| `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_NACHAUDIT.md` | historischer Audit-Snapshot | ADR-0087 + ADR-0099 + aktuelle Registries |
| `docs/architecture/ENTERPRISE_FINTECH_FINALIZATION_REPORT.md` | historischer Remediation-Snapshot | aktuelle FinTech-Core-Roadmap + ADR-0087/0099/0100 |
| `docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md` | superseded Pre-Single-Dispatcher Blueprint | ADR-0087 / `ScoringModelRegistry` / `ScoringDispatcher` |

Physische Verschiebung/Loeschung dieser Artefakte ist nicht erforderlich, solange ihre historische Rolle eindeutig und die Referenzierbarkeit fuer Audit/RAG/Tests erhalten bleibt.

## 12. Current State

```text
original Equity branch baseline = 800b05261c1792fed5138a8125cf6a00b1f5af07
latest main synchronized into Equity branch = deaf7a5411efdc4aa4638757b7d6958a75c094cc
crypto champion = crypto-technical-provenance@0.7.0 unchanged
Meme research challenger = crypto-meme-integrity@0.3.0
DeFi research challenger = crypto-defi-fundamental@0.3.0
Equity research challenger = equity-multifactor@0.2.0
Equity feature contract = equity-multifactor-features/0.2.0
Equity research runtime = equity-research-runtime/0.4.0
productive stock champion = traditional-scoring@2.1.0 unchanged
Equity productive promotion = BLOCKED pending peer normalization/backtest/correlation/governance and atomic stock cutover
Meme/DeFi productive promotion = BLOCKED pending evidence/backtest/governance
FT-7 = BLOCKED
FT-8 = PLANNED
FT-9 = PLANNED
```
