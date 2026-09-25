# Analyse- und Scoring-Anbindungsinventar

**Project:** CAPITAL-AI-FINTECH  
**PVC:** PVC-09..17  
**UI consumer:** CAPITAL-AI-FE (cross-cutting, keine Scoring-Authority)  
**Canonical runtime registry:** \`src/platform/Scoring/AnalysisConnectionRegistry.ts\`  
**User route:** \`/datacalculator\`

## Zweck

Dieses Inventar beschreibt pro Analyse-/Scoring-Komponente einen eigenen versionierbaren Anbindungsvertrag. Der Vertrag legt fest:

1. verwendetes Anbindungskonzept und Reihenfolge der Ebenen;
2. Provider-/Application-Services;
3. Datenspeicher-/Evidence-Modelle;
4. Datenfluss bis zur UI;
5. Scoringmodell bzw. Analyse-Semantik und Formel;
6. Produktivstatus (\`CANONICAL\`, \`RESEARCH_ONLY\`, \`CONTEXT_ONLY\`, \`DISABLED\`).

Die Registry ist eine Verifikations-/Indexoberfläche. Sie ersetzt weder \`ProviderRegistry\`, \`ScoringModelRegistry\`, \`ScoringDispatcher\` noch bestehende Evidence-/DQ-Verträge.

## Inventar

| Datenbankanbindung Konzept Name | Analysetool Name | Betroffene Asset-Klassen / Unterklassen | Bestes anwendbares Konzept |
|---|---|---|---|
| Hybrid | Verified Crypto Technical Scorer | Crypto · BTC, ETH, Altcoins mit verifizierter History-/Snapshot-Evidence | Tier-1-4 Live-Pfad + Data-Authority/Evidence-Gate vor dem kanonischen Scoring |
| Hybrid | Traditional Stock Scoring | Aktien · Equities mit verifizierter Historie und optionalen Fundamentals | Live/History Pricing + Evidence-first Fundamentals + Canonical Dispatcher |
| Tier 1-4 | Traditional FX / Index Scoring | Forex · FX-Paare; Index · Marktindizes | Tier 1-4 für Kurs-/History-Lieferung, bestehende DQ-/Dispatcher-Gates bleiben bindend |
| Data Authority & Evidence | Commodity Market Evidence Scorer | Rohstoffe · Commodity Benchmarks | Vollständige verifizierte History-Evidence vor produktiver Score-Ausführung |
| Data Authority & Evidence | Sovereign Benchmark Yield Scorer | Bonds · ausschließlich Government Benchmark Yields | Evidence-first; Renditebeobachtungen sind Evidence, keine Execution-Preise |
| Individual | Meme-Coin Integrity Research | Crypto · Meme Coins | Spezialisierter Security/On-chain/Social-Evidence-Graph, Research-only bis Promotion-Gates erfüllt sind |
| Individual | DeFi Fundamental Research | Crypto · DeFi-Protokolle/-Tokens | Spezialisierte Protocol/On-chain/Contract-Evidence über Data Authority; Research-only |
| Hybrid | Commodity Energy Research | Rohstoffe · Energy Benchmarks | Market-History + spezialisierte Energie-/EIA-Evidence; Challenger bleibt nicht ausführbar |
| Hybrid | Industrial / Critical Metals Research | Rohstoffe · Industrial Metals, Critical Metals | Market-Evidence + Physical-Supply-/Criticality-Evidence |
| Hybrid | Precious Metals Research | Rohstoffe · Gold, Silber, Precious-Metal Benchmarks | Market-Evidence + Macro/Risk Context; keine Vermischung mit Resource-Project-Metriken |
| Hybrid | Agriculture Commodity Research | Rohstoffe · Agriculture Benchmarks | Market-History + point-in-time USDA/Physical Evidence |
| Data Authority & Evidence | AI Market Sentiment Evidence Projection | Multi-Asset · Crypto, Aktien, Forex, Index, Rohstoffe | Jede numerische Sentiment-Feature-Dimension muss separat attestiert sein; Research-only |
| Data Authority & Evidence | Macro Yield-Curve Risk Regime | Multi-Asset · Cross-Asset Macro Context | FRED Evidence Context, ausdrücklich kein Asset-Score und kein Execution-Preis |
| Data Authority & Evidence | Cross-Asset Ranking | Multi-Asset · nur vergleichbare kanonische Score-Kohorten | Downstream von CanonicalScoreResult + Governance-/Comparability-Evidence |
| Individual | Deterministic Portfolio Allocator | Portfolio / Multi-Asset · Research/Paper, long-only, unlevered | Governed Target Weights; keine automatische Gewichtserzeugung aus Scores |
| Individual | Individual Bond Scoring Proposal | Bonds · individuelle Staats-/Unternehmensanleihen | DISABLED bis Review + Golden-Dataset-Backtest + explizite Promotion abgeschlossen sind |
| Individual | Altcoin Pattern Research Scorer | Crypto · Altcoin Pattern Research | Spezialisierte OHLC-/Pattern-Evidence, nur Research-Kontext bis unabhängig validiert |
| Hybrid | Profi Market Screener | Multi-Asset · verifiziertes Screening | Live Discovery + kanonische Score-/Evidence-Projektion; keine route-lokale Score-Erzeugung |

## Vertragsprofile

### 1. Tier 1-4

\`\`\`text
Tier 1 · ProviderRegistry → ProviderMatrix → MarketDataGateway
Tier 2 · CircuitBreaker / RateLimitBudget / RequestCoalescer
       → MarketTickGate / DataQualityService
Tier 3 · MarketDataCache / RingBuffer / PubSub / WebSocket Fan-out
Tier 4 · LiveClientFeed → Analysis/Scoring Consumer → UI
\`\`\`

**Empfehlung:** verwenden, wenn niedrige Latenz und wiederverwendbarer Live-Fan-out die primäre Anforderung sind. Produktive Scores dürfen die Evidence-/DQ-Grenzen nicht umgehen.

### 2. Data Authority & Evidence

\`\`\`text
Provider/Evidence Adapter
→ Evidence Identity
→ Provenance / Freshness
→ Data Quality Gate
→ ValidatedDataInput
→ ValidatedFeatureInput
→ ScoringModelRegistry / Domain Evaluator
→ ScoringDispatcher / Canonical Adapter
→ CanonicalScoreResult oder Research Projection
→ UI / Ranking / Decision Support
\`\`\`

**Empfehlung:** Standard für Evidence-sensitive Analysen, Scoring, Ranking und regulatorisch nachvollziehbare Projektionen.

### 3. Hybrid

\`\`\`text
Tier 1 Live Ingestion
→ Tier 2 Gate & Norm
→ Tier 3 Cache/Fan-out
→ Evidence Identity / DQ / Feature Lineage
→ Canonical Scoring oder Research Evaluation
→ Tier 4 UI Consumer
\`\`\`

**Empfehlung:** bevorzugtes Profil für produktives Multi-Asset-Live-Scoring, weil Latenz/Fan-out und Evidence-/Scoring-Integrität verbunden werden.

### 4. Individual

\`\`\`text
Dedicated Provider Adapter
→ Specialized Evidence Contract
→ Specialized Feature Engineering
→ Domain Engine / Research Evaluator
→ Canonical Adapter (nur nach Promotion)
→ UI
\`\`\`

**Empfehlung:** nur für echte Unterklassen-Spezifika verwenden. Der Individual-Pfad darf keine parallele Provider-, Dispatcher-, Persistence- oder Scoring-Authority erzeugen.

## Scoringmodelle und Formeln

### Verified Crypto Technical Scorer — canonical

Modell: \`crypto-technical-provenance/0.7.0\`

Nominale Gewichte:

\`\`\`text
trend                22.2222 %
momentum             17.7778 %
volatility_quality   13.3333 %
breakout_quality     11.1111 %
relative_strength    13.3333 %
avg_daily_volume      8.8889 %
supply_dynamics       8.8889 %
data_quality_risk     4.4444 %  (invertiert)
\`\`\`

Fehlende belegte Faktoren werden ausgeschlossen; die verbleibenden Gewichte werden dynamisch renormalisiert. Es werden keine erfundenen Ersatzwerte eingesetzt.

### Traditional Stock Scoring — canonical

Modell: \`traditional-scoring/2.1.0\`

\`\`\`text
trend 18 % + momentum 14 % + breakout 10 % + volatility_quality 10 %
+ relative_strength 13 % + value 15 % + dividend 8 % + quality 12 %
\`\`\`

Zusatzformeln:

\`\`\`text
value    = clamp(100 - (P/E / 40) × 100)
dividend = clamp((dividendYieldPct / 6) × 100)
quality  = clamp((profitMarginPct / 25) × 100)
\`\`\`

### Traditional FX / Index Scoring — canonical

\`\`\`text
trend 30 % + momentum 25 % + breakout 15 %
+ volatility_quality 15 % + relative_strength 15 %
\`\`\`

### Commodity Market Evidence Scorer — canonical

Modell: \`commodity-evidence-scoring/1.0.0\`

\`\`\`text
trend 30 % + momentum 25 % + breakout_quality 20 % + volatility_quality 25 %
\`\`\`

Produktive Voraussetzungen: 100 % Feature-Coverage, mindestens 20 History-Punkte, Evidence-Freshness innerhalb des Vertragsfensters.

### Sovereign Benchmark Yield Scorer — canonical

Modell: \`sovereign-benchmark-yield-scoring/1.0.0\`

\`\`\`text
yield_level_percentile 45 %
yield_trend            30 %
yield_stability        25 %

yield_stability = clamp(100 - (dailyYieldChangeStdevBps / 15) × 100)
yield_trend     = clamp(50 + zScore(currentYield) × 15)
\`\`\`

Nur Benchmark-Yield-Semantik; kein Individual-Bond-, Credit-, Duration-, Liquidity- oder Total-Return-Score.

### Macro Yield-Curve Risk Regime — context only

\`\`\`text
spread10y2yBps = (DGS10 - DGS2) × 100

spread < -10 bps → INVERTED_CURVE
spread >  10 bps → NORMAL_CURVE
sonst            → FLAT_CURVE
\`\`\`

Kein Asset-Score.

### Cross-Asset Ranking — canonical downstream

Nur \`READY\` Canonical Scores mit vollständiger Model-/Feature-/Dispatcher-Lineage und bestätigter Vergleichbarkeit werden in dieselbe Kohorte aufgenommen.

\`\`\`text
cohort = verified comparability key
ranking = descending(rankingValue)
tie-break = assetId
\`\`\`

### Deterministic Portfolio Allocator — canonical governed proposal

Kein Score-Optimizer. Target Weights werden von einer extern govern-ten Authority geliefert.

\`\`\`text
targetNotional = totalEquity × targetWeightBps / 10000
rebalanceRequired = abs(targetWeightBps - currentWeightBps) >= rebalanceThresholdBps
cashReserveBps = 10000 - totalTargetWeightBps
\`\`\`

### Individual Bond Scoring — disabled draft

Draft \`bond-scoring-weights-proposal/0.1.0-draft\`:

\`\`\`text
interest-rate sensitivity 22 %
yield attractiveness      18 %
credit quality            20 %
liquidity                 12 %
price momentum            12 %
curve/regime context      10 %
currency risk              6 %
\`\`\`

Der Vertrag ist nicht produktiv ausführbar.

## /datacalculator

Die öffentliche Route \`/datacalculator\` konsumiert ausschließlich \`AnalysisConnectionRegistry\`.

Funktionen:

- Filter nach Konzept und Asset-Klasse;
- exakte 4-Spalten-Inventaransicht;
- Contract Inspector für Formel, Provider Application Services, Storage Models und UI-Datenfluss;
- Visual Workflow Composer zum Hinzufügen, Entfernen und Umordnen von Ebenen;
- fünf lokale Validierungsgates:
  1. Ingress/Provider,
  2. Evidence vor Evaluation,
  3. Canonical Boundary,
  4. UI nur downstream,
  5. Contract Status Gate;
- lokaler Benchmark mit \`performance.now()\`;
- deterministischer \`Architecture Fit\` aus Evidence-Stärke, Gate-Vollständigkeit, Produktivstatus und Integrationskomplexität.

**Nicht Bestandteil des Benchmarks:** erfundene Provider-Latenzen. Netzwerk-/Provider-Latenzen bleiben \`NOT_MEASURED\`, bis ein echter serverseitiger Benchmarkadapter reale Messungen liefert.

## Source References

- \`src/platform/MarketData/ProviderRegistry.ts\`
- \`src/platform/MarketData/ProviderMatrix.ts\`
- \`src/platform/MarketData/MarketDataGateway.ts\`
- \`src/platform/MarketData/DataQualityService.ts\`
- \`src/platform/MarketData/ValidatedDataInput.ts\`
- \`src/platform/MarketData/ValidatedFeatureInput.ts\`
- \`src/platform/Scoring/ScoringModelRegistry.ts\`
- \`src/platform/Scoring/ScoringDispatcher.ts\`
- \`src/services/cryptoScoringService.ts\`
- \`src/services/traditionalAssetScoring.ts\`
- \`src/services/commodityEvidenceScoring.ts\`
- \`src/services/sovereignBenchmarkEvidenceScoring.ts\`
- \`src/platform/Scoring/CryptoResearchModelContracts.ts\`
- \`src/platform/Scoring/CommodityResearchModelContracts.ts\`
- \`src/platform/Scoring/SentimentEvidenceProjection.ts\`
- \`src/platform/Ranking/CrossAssetRanking.ts\`
- \`src/platform/FinTechCore/Portfolio/DeterministicPortfolioAllocator.ts\`
