export type DataConnectionConceptName =
  | 'Tier 1-4'
  | 'Data Authority & Evidence'
  | 'Hybrid'
  | 'Individual';

export type AnalysisContractStatus =
  | 'CANONICAL'
  | 'RESEARCH_ONLY'
  | 'CONTEXT_ONLY'
  | 'DISABLED';

export type AnalysisAssetClass =
  | 'crypto'
  | 'stock'
  | 'forex'
  | 'index'
  | 'commodity'
  | 'bond'
  | 'portfolio'
  | 'multi-asset';

export interface AnalysisBenchmarkProfile {
  readonly runtimeCostClass: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly evidenceStrength: 1 | 2 | 3 | 4 | 5;
  readonly integrationComplexity: 1 | 2 | 3 | 4 | 5;
  readonly providerLatencyMeasured: false;
}

export interface AnalysisConnectionContract {
  readonly id: string;
  readonly conceptName: DataConnectionConceptName;
  readonly toolName: string;
  readonly kind: 'SCORING' | 'ANALYSIS' | 'RANKING' | 'PORTFOLIO';
  readonly assetClasses: readonly AnalysisAssetClass[];
  readonly subclasses: readonly string[];
  readonly bestConcept: string;
  readonly status: AnalysisContractStatus;
  readonly bindingSequence: readonly string[];
  readonly providerApplicationServices: readonly string[];
  readonly storageModels: readonly string[];
  readonly uiFlow: readonly string[];
  readonly scoringModel: string;
  readonly formula: string;
  readonly sourceRefs: readonly string[];
  readonly benchmark: AnalysisBenchmarkProfile;
}

export interface DataConnectionConceptDefinition {
  readonly name: DataConnectionConceptName;
  readonly summary: string;
  readonly layers: readonly string[];
}

export const DATA_CONNECTION_CONCEPTS: readonly DataConnectionConceptDefinition[] = Object.freeze([
  {
    name: 'Tier 1-4',
    summary: 'Live-Market-Data-Pipeline von Multi-Provider Ingestion bis Client/Scorer, optimiert für niedrige Latenz und Fan-out.',
    layers: [
      'Tier 1 · ProviderRegistry → ProviderMatrix → MarketDataGateway',
      'Tier 2 · CircuitBreaker / RateLimitBudget / RequestCoalescer → MarketTickGate / DataQualityService',
      'Tier 3 · MarketDataCache / RingBuffer / PubSub / WebSocket Fan-out',
      'Tier 4 · LiveClientFeed → Scoring/Analysis Consumer → UI',
    ],
  },
  {
    name: 'Data Authority & Evidence',
    summary: 'Evidence-first Pfad mit Provenance, Freshness, Data Quality, Feature- und Scoring-Lineage vor jeder UI-Projektion.',
    layers: [
      'Provider / Evidence Adapter',
      'Evidence Identity + Provenance + Freshness',
      'ValidatedDataInput → ValidatedFeatureInput',
      'ScoringModelRegistry → ScoringDispatcher → CanonicalScoreResult',
      'Read-only UI / Ranking / Decision Support',
    ],
  },
  {
    name: 'Hybrid',
    summary: 'Kombiniert den Live-Tier-1-4-Pfad mit Evidence-/Authority-Gates vor dem produktiven Scoring.',
    layers: [
      'Live Provider Ingestion',
      'Gate & Norm',
      'Cache / Fan-out',
      'Evidence + DQ + Feature Lineage',
      'Canonical Scoring / Analysis',
      'UI',
    ],
  },
  {
    name: 'Individual',
    summary: 'Spezialisierter Adapter- und Feature-Pfad für einzelne Asset-Unterklassen; produktive Scores bleiben trotzdem an kanonische Gates gebunden.',
    layers: [
      'Dedicated Provider Adapter',
      'Specialized Evidence Contract',
      'Specialized Feature Engineering',
      'Domain Engine / Research Evaluator',
      'Canonical Adapter when productive',
      'UI',
    ],
  },
]);

const hybridLiveSequence = [
  'ProviderRegistry',
  'ProviderMatrix',
  'MarketDataGateway',
  'CircuitBreaker / RateLimitBudget / RequestCoalescer',
  'MarketTickGate / DataQualityService',
  'MarketDataCache / Fanout',
  'Evidence Identity / Provenance',
  'ValidatedDataInput',
  'ValidatedFeatureInput',
  'ScoringModelRegistry',
  'ScoringDispatcher',
  'CanonicalScoreResult',
  'UI',
] as const;

const evidenceSequence = [
  'Provider / Evidence Adapter',
  'Evidence Identity / Provenance / Freshness',
  'Data Quality Gate',
  'ValidatedDataInput',
  'ValidatedFeatureInput',
  'Domain Evaluation',
  'Canonical Adapter or Research Projection',
  'UI',
] as const;

export const ANALYSIS_CONNECTION_CONTRACTS: readonly AnalysisConnectionContract[] = Object.freeze([
  {
    id: 'crypto-technical-provenance',
    conceptName: 'Hybrid',
    toolName: 'Verified Crypto Technical Scorer',
    kind: 'SCORING',
    assetClasses: ['crypto'],
    subclasses: ['BTC', 'ETH', 'Altcoins with verified market-history and snapshot evidence'],
    bestConcept: 'Hybrid: Tier 1-4 live market path + Data Authority/Evidence gate before canonical scoring.',
    status: 'CANONICAL',
    bindingSequence: hybridLiveSequence,
    providerApplicationServices: ['ProviderRegistry', 'ProviderMatrix', 'MarketDataGateway', 'MarketDataHistoryGateway', 'ScoringDispatcher'],
    storageModels: ['MarketDataCache', 'MarketDataRingBuffer', 'CanonicalScoreResult lineage', 'score_snapshots when persisted'],
    uiFlow: ['LiveClientFeed / verified history', 'evaluateVerifiedCryptoTechnicalScore', 'ScoringDispatcher', 'CanonicalScoreResult', 'Enterprise Scorer / Ranking UI'],
    scoringModel: 'crypto-technical-provenance/0.7.0',
    formula: 'renormalized weighted score: trend 22.22% + momentum 17.78% + volatility_quality 13.33% + breakout_quality 11.11% + relative_strength 13.33% + liquidity 8.89% + supply_dynamics 8.89% + inverted data_quality_risk 4.44%. Missing factors are excluded and weights are renormalized.',
    sourceRefs: ['src/services/verifiedCryptoTechnicalScoring.ts', 'src/services/cryptoScoringService.ts', 'src/platform/Scoring/ScoringModelRegistry.ts'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 5, integrationComplexity: 4, providerLatencyMeasured: false },
  },
  {
    id: 'traditional-scoring-stock',
    conceptName: 'Hybrid',
    toolName: 'Traditional Stock Scoring',
    kind: 'SCORING',
    assetClasses: ['stock'],
    subclasses: ['Equities with verified history and optional fundamentals'],
    bestConcept: 'Hybrid: live/history pricing plus Evidence-first fundamentals and canonical dispatcher.',
    status: 'CANONICAL',
    bindingSequence: hybridLiveSequence,
    providerApplicationServices: ['MarketDataGateway', 'MarketDataHistoryGateway', 'Fundamentals provider adapter', 'ScoringDispatcher'],
    storageModels: ['MarketDataCache', 'FinancialFieldProvenance', 'CanonicalScoreResult lineage'],
    uiFlow: ['Verified history + fundamentals', 'TraditionalAssetScoringService', 'ScoringDispatcher', 'Canonical score', 'Stock analysis UI'],
    scoringModel: 'traditional-scoring/2.1.0 · stock profile',
    formula: 'renormalized weighted score: trend 18% + momentum 14% + breakout 10% + volatility_quality 10% + RSI 13% + value 15% + dividend 8% + quality 12%.',
    sourceRefs: ['src/services/traditionalAssetScoring.ts', 'src/platform/Scoring/ScoringExecutorAdapters.ts'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 4, integrationComplexity: 3, providerLatencyMeasured: false },
  },
  {
    id: 'traditional-scoring-fx-index',
    conceptName: 'Tier 1-4',
    toolName: 'Traditional FX / Index Scoring',
    kind: 'SCORING',
    assetClasses: ['forex', 'index'],
    subclasses: ['FX pairs', 'Market indices'],
    bestConcept: 'Tier 1-4 for price/history delivery, with the existing DQ and dispatcher gates retained.',
    status: 'CANONICAL',
    bindingSequence: hybridLiveSequence,
    providerApplicationServices: ['ProviderRegistry', 'MarketDataGateway', 'MarketDataHistoryGateway', 'ScoringDispatcher'],
    storageModels: ['MarketDataCache', 'Historical price series', 'CanonicalScoreResult lineage'],
    uiFlow: ['Verified price history', 'TraditionalAssetScoringService', 'ScoringDispatcher', 'Canonical score', 'Market analysis UI'],
    scoringModel: 'traditional-scoring/2.1.0 · FX/index profile',
    formula: 'renormalized weighted score: trend 30% + momentum 25% + breakout 15% + volatility_quality 15% + RSI 15%.',
    sourceRefs: ['src/services/traditionalAssetScoring.ts', 'src/platform/Scoring/ScoringModelRegistry.ts'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 4, integrationComplexity: 3, providerLatencyMeasured: false },
  },
  {
    id: 'commodity-market-evidence',
    conceptName: 'Data Authority & Evidence',
    toolName: 'Commodity Market Evidence Scorer',
    kind: 'SCORING',
    assetClasses: ['commodity'],
    subclasses: ['Commodity benchmarks'],
    bestConcept: 'Data Authority & Evidence; commodity score requires complete verified history evidence before execution.',
    status: 'CANONICAL',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['TwelveDataCommodityHistoryProvider', 'MarketDataHistoryGateway', 'ScoringDispatcher'],
    storageModels: ['CommodityMarketEvidence', 'Evidence refs', 'CanonicalScoreResult lineage'],
    uiFlow: ['Commodity history evidence', 'scoreCommodityMarketEvidence', 'ScoringDispatcher', 'Canonical score', 'Raw Materials UI'],
    scoringModel: 'commodity-evidence-scoring/1.0.0',
    formula: 'trend 30% + momentum 25% + breakout_quality 20% + volatility_quality 25%; 100% factor coverage and minimum history gate required.',
    sourceRefs: ['src/services/commodityEvidenceScoring.ts', 'src/platform/Scoring/ScoringModelRegistry.ts'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 5, integrationComplexity: 3, providerLatencyMeasured: false },
  },
  {
    id: 'sovereign-benchmark-yield',
    conceptName: 'Data Authority & Evidence',
    toolName: 'Sovereign Benchmark Yield Scorer',
    kind: 'SCORING',
    assetClasses: ['bond'],
    subclasses: ['Government benchmark yields only'],
    bestConcept: 'Data Authority & Evidence; sovereign yield observations are evidence, not execution prices.',
    status: 'CANONICAL',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['EODHD bond evidence adapter', 'Macro/FRED evidence context', 'ScoringDispatcher'],
    storageModels: ['BondEvidenceResult', 'Evidence refs', 'CanonicalScoreResult lineage'],
    uiFlow: ['Benchmark-yield history', 'scoreSovereignBenchmarkEvidence', 'ScoringDispatcher', 'Canonical score', 'Bond benchmark UI'],
    scoringModel: 'sovereign-benchmark-yield-scoring/1.0.0',
    formula: 'yield_level_percentile 45% + standardized yield_trend 30% + yield_stability 25%; full evidence coverage required.',
    sourceRefs: ['src/services/sovereignBenchmarkEvidenceScoring.ts', 'src/services/eodhdBondEvidence.ts'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 5, integrationComplexity: 3, providerLatencyMeasured: false },
  },
  {
    id: 'crypto-meme-integrity',
    conceptName: 'Individual',
    toolName: 'Meme-Coin Integrity Research',
    kind: 'ANALYSIS',
    assetClasses: ['crypto'],
    subclasses: ['Meme coins'],
    bestConcept: 'Individual specialized evidence graph feeding the Data Authority plane; keep research-only until promotion gates are satisfied.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['GoPlus security/simulation adapters', 'DexScreener evidence', 'Market history adapters', 'Social evidence adapters'],
    storageModels: ['Research evidence refs', 'Feature attestations', 'Research evaluation output'],
    uiFlow: ['Specialized evidence adapters', 'Crypto meme research contract', 'Research evaluator', 'Research-only projection', 'UI'],
    scoringModel: 'crypto-meme-integrity/0.3.0 challenger',
    formula: 'No productive executable weight set. Feature families include execution liquidity, market structure, holder distribution, contract/rug risk, social authenticity, narrative, venue access and hard gates.',
    sourceRefs: ['src/platform/Scoring/CryptoResearchModelContracts.ts', 'src/services/memeCoinScoringService.ts'],
    benchmark: { runtimeCostClass: 'HIGH', evidenceStrength: 4, integrationComplexity: 5, providerLatencyMeasured: false },
  },
  {
    id: 'crypto-defi-fundamental',
    conceptName: 'Individual',
    toolName: 'DeFi Fundamental Research',
    kind: 'ANALYSIS',
    assetClasses: ['crypto'],
    subclasses: ['DeFi protocols / tokens'],
    bestConcept: 'Individual protocol/on-chain evidence adapters joined through Data Authority & Evidence; research-only until promotion.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['DefiLlamaProtocolProvider', 'Contract evidence adapters', 'Oracle/security evidence adapters'],
    storageModels: ['Protocol evidence', 'Contract-security evidence', 'Research feature attestations'],
    uiFlow: ['Protocol/on-chain evidence', 'DeFi feature contract', 'Research evaluator', 'Research projection', 'DeFi UI'],
    scoringModel: 'crypto-defi-fundamental/0.3.0 challenger',
    formula: 'No productive executable weight set. Research factors cover utilization, protocol scale/activity, revenue quality, liquidity, concentration, contract security, oracle, tokenomics, governance and ecosystem evidence.',
    sourceRefs: ['src/platform/Scoring/CryptoResearchModelContracts.ts', 'src/platform/MarketData/providers/DefiLlamaProtocolProvider.ts'],
    benchmark: { runtimeCostClass: 'HIGH', evidenceStrength: 4, integrationComplexity: 5, providerLatencyMeasured: false },
  },
  {
    id: 'commodity-energy-hybrid',
    conceptName: 'Hybrid',
    toolName: 'Commodity Energy Research',
    kind: 'ANALYSIS',
    assetClasses: ['commodity'],
    subclasses: ['Energy benchmarks'],
    bestConcept: 'Hybrid: market history + specialized energy fundamentals/evidence; challenger remains non-executable.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['Commodity history adapter', 'Energy/EIA evidence adapter', 'Research evaluator'],
    storageModels: ['Commodity evidence', 'Research feature snapshot'],
    uiFlow: ['Market + energy evidence', 'Category research contract', 'Research evaluation', 'UI'],
    scoringModel: 'commodity-energy-hybrid/0.1.0 challenger',
    formula: 'Research-only category composition; no productive canonical weight execution.',
    sourceRefs: ['src/platform/Scoring/CommodityResearchModelContracts.ts'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 3, integrationComplexity: 4, providerLatencyMeasured: false },
  },
  {
    id: 'commodity-industrial-metals-hybrid',
    conceptName: 'Hybrid',
    toolName: 'Industrial / Critical Metals Research',
    kind: 'ANALYSIS',
    assetClasses: ['commodity'],
    subclasses: ['Industrial metals', 'Critical metals'],
    bestConcept: 'Hybrid with market evidence plus physical-supply/criticality evidence.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['Commodity history adapter', 'USGS/physical supply evidence', 'Research evaluator'],
    storageModels: ['Commodity evidence', 'Supply/criticality evidence snapshot'],
    uiFlow: ['Market + physical evidence', 'Category contract', 'Research evaluation', 'UI'],
    scoringModel: 'commodity-industrial-metals-hybrid/0.1.0 challenger',
    formula: 'Research-only category composition; physical supply and criticality remain separate evidence dimensions.',
    sourceRefs: ['src/platform/Scoring/CommodityResearchModelContracts.ts'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 3, integrationComplexity: 4, providerLatencyMeasured: false },
  },
  {
    id: 'commodity-precious-metals-hybrid',
    conceptName: 'Hybrid',
    toolName: 'Precious Metals Research',
    kind: 'ANALYSIS',
    assetClasses: ['commodity'],
    subclasses: ['Gold', 'Silver', 'Precious-metal benchmarks'],
    bestConcept: 'Hybrid: canonical market evidence plus macro/risk context, without mixing resource-project metrics into benchmark scoring.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['Commodity history adapter', 'Macro evidence adapter', 'Research evaluator'],
    storageModels: ['Commodity evidence', 'Macro context evidence'],
    uiFlow: ['Market + macro evidence', 'Category contract', 'Research evaluation', 'UI'],
    scoringModel: 'commodity-precious-metals-hybrid/0.1.0 challenger',
    formula: 'Research-only category composition; no productive canonical weight execution.',
    sourceRefs: ['src/platform/Scoring/CommodityResearchModelContracts.ts'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 3, integrationComplexity: 4, providerLatencyMeasured: false },
  },
  {
    id: 'commodity-agriculture-hybrid',
    conceptName: 'Hybrid',
    toolName: 'Agriculture Commodity Research',
    kind: 'ANALYSIS',
    assetClasses: ['commodity'],
    subclasses: ['Agriculture benchmarks'],
    bestConcept: 'Hybrid with market history plus point-in-time USDA/physical evidence.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['Commodity history adapter', 'USDA/physical evidence adapter', 'Research evaluator'],
    storageModels: ['Commodity evidence', 'Point-in-time release/revision lineage'],
    uiFlow: ['Market + agriculture evidence', 'Category contract', 'Research evaluation', 'UI'],
    scoringModel: 'commodity-agriculture-hybrid/0.1.0 challenger',
    formula: 'Research-only category composition; point-in-time validation is mandatory before any promotion.',
    sourceRefs: ['src/platform/Scoring/CommodityResearchModelContracts.ts'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 3, integrationComplexity: 4, providerLatencyMeasured: false },
  },
  {
    id: 'market-sentiment-evidence',
    conceptName: 'Data Authority & Evidence',
    toolName: 'AI Market Sentiment Evidence Projection',
    kind: 'ANALYSIS',
    assetClasses: ['crypto', 'stock', 'forex', 'index', 'commodity', 'multi-asset'],
    subclasses: ['Research context only'],
    bestConcept: 'Data Authority & Evidence because every numeric sentiment feature must be separately attested.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['News evidence providers', 'Financial-NLP adapter', 'SentimentEvidenceProjection'],
    storageModels: ['Sentiment feature attestations', 'Evidence refs', 'Research projection'],
    uiFlow: ['News/social evidence', 'Feature attestation', 'Sentiment research evaluator', 'Read-only sentiment UI'],
    scoringModel: 'crypto-sentiment-research · research context only',
    formula: 'A score is emitted only when every required feature is attested and fresh; no default/neutral replacement score is allowed.',
    sourceRefs: ['src/platform/Scoring/SentimentEvidenceProjection.ts', 'src/platform/Scoring/SentimentNewsFeatureEvidenceAdapter.ts'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 4, integrationComplexity: 4, providerLatencyMeasured: false },
  },
  {
    id: 'macro-risk-regime',
    conceptName: 'Data Authority & Evidence',
    toolName: 'Macro Yield-Curve Risk Regime',
    kind: 'ANALYSIS',
    assetClasses: ['multi-asset'],
    subclasses: ['Cross-asset macro context'],
    bestConcept: 'Data Authority & Evidence; macro context must never masquerade as an execution price or asset score.',
    status: 'CONTEXT_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['FRED macro evidence adapter'],
    storageModels: ['MacroRiskRegimeEvidence', 'Evidence IDs'],
    uiFlow: ['FRED DGS2/DGS10 evidence', 'buildMacroRiskRegime', 'Context projection', 'UI'],
    scoringModel: 'macro-risk-regime/1.1.0 context contract',
    formula: 'spread10y2yBps = (DGS10 - DGS2) × 100; < -10 = inverted, > 10 = normal, otherwise flat. No asset score.',
    sourceRefs: ['src/services/macroRiskRegime.ts', 'src/services/macroRateEvidence.ts'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 5, integrationComplexity: 2, providerLatencyMeasured: false },
  },
  {
    id: 'cross-asset-ranking',
    conceptName: 'Data Authority & Evidence',
    toolName: 'Cross-Asset Ranking',
    kind: 'RANKING',
    assetClasses: ['multi-asset'],
    subclasses: ['Comparable canonical-score cohorts', 'Verified normalized-score cohorts'],
    bestConcept: 'Data Authority & Evidence; ranking is downstream of canonical score/evidence lineage and never invents comparability.',
    status: 'CANONICAL',
    bindingSequence: ['CanonicalScoreResult', 'Governance eligibility', 'Comparability evidence', 'Cohort builder', 'Descending ranking', 'Ranking UI'],
    providerApplicationServices: ['ScoringDispatcher outputs', 'CrossAssetRanking'],
    storageModels: ['Canonical score lineage', 'Comparability evidence', 'Ranking projection'],
    uiFlow: ['Canonical scores', 'rankCanonicalUniverse', 'RankingBoard'],
    scoringModel: 'cross-asset-ranking contract',
    formula: 'Candidates are grouped only by verified comparability cohort and sorted descending by rankingValue; ties are deterministic by assetId.',
    sourceRefs: ['src/platform/Ranking/CrossAssetRanking.ts'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 5, integrationComplexity: 3, providerLatencyMeasured: false },
  },
  {
    id: 'deterministic-portfolio-allocation',
    conceptName: 'Individual',
    toolName: 'Deterministic Portfolio Allocator',
    kind: 'PORTFOLIO',
    assetClasses: ['portfolio', 'multi-asset'],
    subclasses: ['Research/Paper long-only unlevered allocation'],
    bestConcept: 'Individual governed allocation contract consuming external target weights; do not derive weights directly from scores.',
    status: 'CANONICAL',
    bindingSequence: ['Governed target weights', 'Portfolio evidence', 'Policy validation', 'Deterministic fixed-point allocation', 'Risk/Compliance handoff', 'Portfolio UI'],
    providerApplicationServices: ['DeterministicPortfolioAllocator', 'Risk/Compliance gate downstream'],
    storageModels: ['Portfolio allocation proposal', 'Input/output hashes', 'Evidence refs'],
    uiFlow: ['Governed targets', 'evaluateDeterministicPortfolioAllocation', 'Proposal', 'Risk/Compliance', 'Portfolio UI'],
    scoringModel: 'allocation contract; not a score-derived optimizer',
    formula: 'targetNotional = totalEquity × targetWeightBps / 10000; rebalance only when absolute drift reaches policy threshold; cash reserve is derived.',
    sourceRefs: ['src/platform/FinTechCore/Portfolio/DeterministicPortfolioAllocator.ts'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 5, integrationComplexity: 3, providerLatencyMeasured: false },
  },
  {
    id: 'individual-bond-scoring-draft',
    conceptName: 'Individual',
    toolName: 'Individual Bond Scoring Proposal',
    kind: 'SCORING',
    assetClasses: ['bond'],
    subclasses: ['Individual government/corporate bonds'],
    bestConcept: 'Individual evidence contract, but keep disabled until formal review, Golden Dataset backtest and explicit promotion.',
    status: 'DISABLED',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['Bond evidence adapter', 'Macro reference evidence'],
    storageModels: ['Bond feature candidate', 'Draft weight proposal', 'Review evidence'],
    uiFlow: ['Bond evidence', 'Draft feature contract', 'Review/backtest only', 'No productive route'],
    scoringModel: 'bond-scoring-weights-proposal/0.1.0-draft',
    formula: 'Draft only: duration sensitivity 22% + yield attractiveness 18% + credit quality 20% + liquidity 12% + momentum 12% + curve/regime 10% + currency risk 6%. Productive scoring is disabled.',
    sourceRefs: ['src/services/bondScoringWeightsProposal.ts', 'docs/adr/ADR-0022-bond-scoring-evidence-architecture.md'],
    benchmark: { runtimeCostClass: 'MEDIUM', evidenceStrength: 2, integrationComplexity: 4, providerLatencyMeasured: false },
  },
  {
    id: 'altcoin-pattern-research',
    conceptName: 'Individual',
    toolName: 'Altcoin Pattern Research Scorer',
    kind: 'ANALYSIS',
    assetClasses: ['crypto'],
    subclasses: ['Altcoin pattern research'],
    bestConcept: 'Individual OHLC/pattern evidence pipeline joined only as research context until independently validated.',
    status: 'RESEARCH_ONLY',
    bindingSequence: evidenceSequence,
    providerApplicationServices: ['Market history provider', 'PatternSignalResolver', 'AltcoinPatternResearchScorer'],
    storageModels: ['Pattern evidence', 'Research signal'],
    uiFlow: ['OHLC/history evidence', 'Pattern resolver', 'Research scorer', 'UI context'],
    scoringModel: 'FinTechCore altcoin pattern research',
    formula: 'Deterministic research signal from evidenced pattern inputs; must not be double-counted with momentum/breakout factors.',
    sourceRefs: ['src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchScorer.ts', 'src/platform/FinTechCore/Modules/Crypto/Pattern/PatternSignalResolver.ts'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 3, integrationComplexity: 3, providerLatencyMeasured: false },
  },
  {
    id: 'market-screener-projection',
    conceptName: 'Hybrid',
    toolName: 'Profi Market Screener',
    kind: 'ANALYSIS',
    assetClasses: ['multi-asset'],
    subclasses: ['Verified multi-asset screening'],
    bestConcept: 'Hybrid consumer: live discovery + canonical score/evidence projection; no route-local score generation.',
    status: 'CANONICAL',
    bindingSequence: ['Asset discovery', 'Verified market/evidence data', 'Canonical score/ranking', 'Screen filters', 'Market Screener UI'],
    providerApplicationServices: ['MarketDataGateway', 'ScoringDispatcher', 'CrossAssetRanking'],
    storageModels: ['Verified asset catalog', 'Canonical score projection'],
    uiFlow: ['Verified assets', 'Canonical score/ranking', 'MarketScreener'],
    scoringModel: 'No independent formula; consumes canonical scores and verified evidence.',
    formula: 'Filter/sort projection only. Any score displayed must originate from the canonical scoring path.',
    sourceRefs: ['src/components/MarketScreener.tsx', 'src/app/public/PublicAnalysisWorkbench.tsx'],
    benchmark: { runtimeCostClass: 'LOW', evidenceStrength: 5, integrationComplexity: 2, providerLatencyMeasured: false },
  },
]);

export function validateAnalysisConnectionContracts(
  contracts: readonly AnalysisConnectionContract[] = ANALYSIS_CONNECTION_CONTRACTS,
): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const contract of contracts) {
    if (ids.has(contract.id)) errors.push('duplicate-id:' + contract.id);
    ids.add(contract.id);

    if (contract.assetClasses.length === 0) errors.push('missing-asset-class:' + contract.id);
    if (contract.bindingSequence.length < 3) errors.push('binding-sequence-too-short:' + contract.id);
    if (contract.providerApplicationServices.length === 0) errors.push('missing-provider-service:' + contract.id);
    if (contract.storageModels.length === 0) errors.push('missing-storage-model:' + contract.id);
    if (contract.uiFlow.length === 0) errors.push('missing-ui-flow:' + contract.id);
    if (!contract.formula.trim()) errors.push('missing-formula:' + contract.id);
    if (contract.sourceRefs.length === 0) errors.push('missing-source-ref:' + contract.id);

    if (contract.status === 'DISABLED' && /CANONICAL/i.test(contract.scoringModel)) {
      errors.push('disabled-contract-claims-canonical-model:' + contract.id);
    }
  }

  return Object.freeze(errors);
}
