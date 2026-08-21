import type { CryptoCategory } from '../../types/crypto.types';

/**
 * FT-0 contract foundation for CAPITAL-AI FinTech Core / Crypto Module 01.
 *
 * IMPORTANT AUTHORITY BOUNDARY:
 * - This module defines analysis/evidence contracts only.
 * - It must not calculate or expose a productive CanonicalScoreResult.
 * - Productive scoring remains ScoringModelRegistry -> ScoringDispatcher only.
 */
export const FINTECH_CORE_CRYPTO_MODULE_ID = 'fintech-core.crypto' as const;
export const FINTECH_CORE_CRYPTO_CONTRACT_VERSION = 'fintech-core.crypto/contracts/0.1.0' as const;

export type CryptoAnalysisProfileId =
  | 'layer1'
  | 'layer2'
  | 'defi'
  | 'rwa'
  | 'nft'
  | 'stablecoin'
  | 'exchange-token'
  | 'gamefi'
  | 'ai-depin'
  | 'meme'
  | 'generic';

export type CryptoProfileSourceStatus = 'SOURCE_DEFINED' | 'PENDING_EVIDENCE';
export type CryptoProfileBinding = 'DIRECT' | 'CONDITIONAL' | 'GENERIC';
export type CryptoMetricDirection = 'POSITIVE' | 'PENALTY';

export interface CryptoProfileMetricWeight {
  readonly metric: string;
  readonly weight: number;
  readonly direction: CryptoMetricDirection;
}

export interface CryptoCategoryAnalysisProfile {
  readonly id: CryptoAnalysisProfileId;
  readonly sourceStatus: CryptoProfileSourceStatus;
  /**
   * Research/configuration weights from the Owner-provided orchestration model.
   * They are not an executable production scoring formula and are not LLM-mutable.
   */
  readonly metrics: readonly CryptoProfileMetricWeight[];
  /** Metrics that the source requires as penalties but for which no explicit numeric weight was supplied. */
  readonly unweightedPenaltyMetrics?: readonly string[];
  /** Gate identities only. Thresholds/policies are governed separately. */
  readonly hardGates?: readonly string[];
  readonly normalization: 'WITHIN_PROFILE';
  readonly scoreAuthority: 'SCORING_DISPATCHER_ONLY';
}

export interface CryptoCategoryProfileBinding {
  readonly profileId: CryptoAnalysisProfileId;
  readonly binding: CryptoProfileBinding;
  readonly reason: string;
}

const positive = (metric: string, weight: number): CryptoProfileMetricWeight => ({
  metric,
  weight,
  direction: 'POSITIVE',
});

const penalty = (metric: string, weight: number): CryptoProfileMetricWeight => ({
  metric,
  weight,
  direction: 'PENALTY',
});

/**
 * Category-profile configurations are source-derived research contracts.
 * A PENDING_EVIDENCE profile deliberately has no invented weights.
 */
export const CRYPTO_CATEGORY_ANALYSIS_PROFILES: Readonly<Record<CryptoAnalysisProfileId, CryptoCategoryAnalysisProfile>> = {
  layer1: {
    id: 'layer1',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('fundamental', 0.35),
      positive('onchain', 0.25),
      positive('technical', 0.25),
      positive('liquidity', 0.10),
      positive('sentiment', 0.05),
    ],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  layer2: {
    id: 'layer2',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('fundamental', 0.30),
      positive('usage', 0.30),
      positive('technical', 0.25),
      positive('liquidity', 0.10),
      positive('sentiment', 0.05),
    ],
    hardGates: ['rollupLiveness', 'bridgeSecurity'],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  defi: {
    id: 'defi',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('revenue', 0.30),
      positive('tvlQuality', 0.20),
      penalty('protocolRisk', 0.20),
      positive('technical', 0.20),
      positive('liquidity', 0.10),
    ],
    hardGates: ['smartContractEvidence', 'oracleRiskEvidence'],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  rwa: {
    id: 'rwa',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('backing', 0.30),
      positive('legalAndCustody', 0.25),
      positive('yield', 0.20),
      positive('liquidity', 0.15),
      positive('technical', 0.10),
    ],
    hardGates: ['legalOwnershipVerified', 'custodyVerified', 'redemptionRightsVerified'],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  nft: {
    id: 'nft',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('collectionQuality', 0.30),
      positive('liquidity', 0.25),
      positive('rarity', 0.20),
      positive('community', 0.15),
      positive('technical', 0.10),
    ],
    unweightedPenaltyMetrics: ['washTradingProbability'],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  stablecoin: {
    id: 'stablecoin',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('pegStability', 0.35),
      positive('reserves', 0.30),
      positive('redemption', 0.20),
      positive('liquidity', 0.10),
      positive('technical', 0.05),
    ],
    hardGates: ['pegDeviation', 'reserveCoverage', 'redemptionStatus', 'reserveAttestation'],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  'exchange-token': {
    id: 'exchange-token',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('exchangeRevenue', 0.25),
      positive('volumeGrowth', 0.15),
      positive('tokenUtility', 0.15),
      positive('burnRate', 0.15),
      positive('reserveTransparency', 0.10),
      positive('liquidity', 0.10),
      penalty('counterpartyRisk', 0.10),
    ],
    hardGates: ['exchangeOperationalHealth'],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  gamefi: {
    id: 'gamefi',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('dailyActiveUsers', 0.25),
      positive('dauMauRatio', 0.20),
      positive('inGameRevenue', 0.15),
      positive('userRetention', 0.15),
      positive('nftActivity', 0.10),
      positive('tokenUtility', 0.15),
    ],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  'ai-depin': {
    id: 'ai-depin',
    sourceStatus: 'SOURCE_DEFINED',
    metrics: [
      positive('activeNodes', 0.25),
      positive('usefulWork', 0.20),
      positive('networkRevenue', 0.15),
      positive('customerGrowth', 0.15),
      positive('nodeUtilization', 0.10),
      positive('tokenUtility', 0.15),
    ],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  meme: {
    id: 'meme',
    sourceStatus: 'PENDING_EVIDENCE',
    metrics: [],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
  generic: {
    id: 'generic',
    sourceStatus: 'PENDING_EVIDENCE',
    metrics: [],
    normalization: 'WITHIN_PROFILE',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  },
};

/**
 * Mapping preserves the existing canonical CryptoCategory taxonomy.
 * CONDITIONAL means the category alone is insufficient to prove the narrower analysis profile.
 */
export const CRYPTO_CATEGORY_PROFILE_BINDINGS: Readonly<Record<CryptoCategory, CryptoCategoryProfileBinding>> = {
  'Layer 1': { profileId: 'layer1', binding: 'DIRECT', reason: 'Source-defined Layer-1 analysis model.' },
  'Layer 2': { profileId: 'layer2', binding: 'DIRECT', reason: 'Source-defined Layer-2/Rollup analysis model.' },
  DeFi: { profileId: 'defi', binding: 'DIRECT', reason: 'Source-defined DeFi analysis model.' },
  'Smart Contract Platform': { profileId: 'generic', binding: 'GENERIC', reason: 'Category alone does not prove Layer-1 semantics.' },
  Infrastructure: { profileId: 'generic', binding: 'GENERIC', reason: 'No dedicated source formula.' },
  Oracle: { profileId: 'generic', binding: 'GENERIC', reason: 'No dedicated source formula.' },
  Gaming: { profileId: 'gamefi', binding: 'DIRECT', reason: 'Source-defined Gaming/GameFi model.' },
  'AI / Data': { profileId: 'ai-depin', binding: 'CONDITIONAL', reason: 'AI/Data category needs additional evidence before DePIN-specific metrics apply.' },
  Payments: { profileId: 'generic', binding: 'GENERIC', reason: 'No dedicated source formula.' },
  Privacy: { profileId: 'generic', binding: 'GENERIC', reason: 'No dedicated source formula.' },
  Meme: { profileId: 'meme', binding: 'DIRECT', reason: 'Dedicated slot exists, but formula remains pending evidence.' },
  Stablecoin: { profileId: 'stablecoin', binding: 'DIRECT', reason: 'Source-defined peg/reserve/redemption model.' },
  'Exchange Token': { profileId: 'exchange-token', binding: 'DIRECT', reason: 'Source-defined exchange-token model.' },
  Governance: { profileId: 'generic', binding: 'GENERIC', reason: 'No dedicated source formula.' },
  'Real World Assets': { profileId: 'rwa', binding: 'DIRECT', reason: 'Source-defined RWA backing/legal/custody model.' },
  'Storage / Compute': { profileId: 'generic', binding: 'GENERIC', reason: 'Storage/Compute is not automatically DePIN.' },
  Interoperability: { profileId: 'generic', binding: 'GENERIC', reason: 'No dedicated source formula.' },
  'Liquid Staking': { profileId: 'generic', binding: 'GENERIC', reason: 'Requires a separately validated staking/yield profile.' },
  Restaking: { profileId: 'generic', binding: 'GENERIC', reason: 'Requires a separately validated restaking-risk profile.' },
  Bridging: { profileId: 'generic', binding: 'GENERIC', reason: 'Bridge risk is handled as evidence/gate before a dedicated profile is approved.' },
  'NFT / Creator': { profileId: 'nft', binding: 'CONDITIONAL', reason: 'NFT metrics require proof that the asset represents an NFT/collection context.' },
  Derivatives: { profileId: 'generic', binding: 'GENERIC', reason: 'Derivative-specific leverage/funding risk requires a separately validated profile.' },
  'DAO / Community': { profileId: 'generic', binding: 'GENERIC', reason: 'No dedicated source formula.' },
  'Index / Basket': { profileId: 'generic', binding: 'GENERIC', reason: 'Basket/index semantics require composition evidence.' },
  'Utility Token': { profileId: 'generic', binding: 'GENERIC', reason: 'Utility alone is insufficient for a specialized source profile.' },
  Unknown: { profileId: 'generic', binding: 'GENERIC', reason: 'Fail-closed unknown classification.' },
};

export function resolveCryptoAnalysisProfile(category: CryptoCategory): CryptoCategoryProfileBinding {
  return CRYPTO_CATEGORY_PROFILE_BINDINGS[category];
}

export const STABLECOIN_RESEARCH_GATE_DEFAULTS = Object.freeze({
  pegDeviationPctMax: 1.0,
  reserveCoverageMin: 1.0,
  redemptionStatusRequired: true,
  reserveAttestationRequired: true,
  abnormalOutflowAlert: true,
  authority: 'RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY',
} as const);

export type PatternGroupId =
  | 'STRUCTURE_REVERSAL'
  | 'STRUCTURE_CONTINUATION'
  | 'BREAKOUT_STRUCTURE'
  | 'WEDGE'
  | 'CANDLESTICK_REVERSAL'
  | 'CANDLESTICK_CONTINUATION'
  | 'SINGLE_CANDLE'
  | 'MICRO_PATTERN';

export const PATTERN_GROUP_BASE_WEIGHTS: Readonly<Record<PatternGroupId, number>> = Object.freeze({
  STRUCTURE_REVERSAL: 1.00,
  STRUCTURE_CONTINUATION: 0.90,
  BREAKOUT_STRUCTURE: 0.85,
  WEDGE: 0.80,
  CANDLESTICK_REVERSAL: 0.65,
  CANDLESTICK_CONTINUATION: 0.60,
  SINGLE_CANDLE: 0.40,
  MICRO_PATTERN: 0.25,
});

export interface PatternCatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly group: PatternGroupId;
  readonly requiresGapCapableMarketData?: boolean;
}

/**
 * Initial source-backed pattern catalog. Detection algorithms are deliberately not implemented in FT-0.
 */
export const PATTERN_CATALOG: readonly PatternCatalogEntry[] = [
  { id: 'head-and-shoulders', name: 'Head and Shoulders', group: 'STRUCTURE_REVERSAL' },
  { id: 'inverse-head-and-shoulders', name: 'Inverse Head and Shoulders', group: 'STRUCTURE_REVERSAL' },
  { id: 'double-top', name: 'Double Top', group: 'STRUCTURE_REVERSAL' },
  { id: 'double-bottom', name: 'Double Bottom', group: 'STRUCTURE_REVERSAL' },
  { id: 'triple-top', name: 'Triple Top', group: 'STRUCTURE_REVERSAL' },
  { id: 'triple-bottom', name: 'Triple Bottom', group: 'STRUCTURE_REVERSAL' },
  { id: 'cup-and-handle', name: 'Cup and Handle', group: 'STRUCTURE_CONTINUATION' },
  { id: 'ascending-triangle', name: 'Ascending Triangle', group: 'STRUCTURE_CONTINUATION' },
  { id: 'descending-triangle', name: 'Descending Triangle', group: 'STRUCTURE_CONTINUATION' },
  { id: 'flag', name: 'Flag', group: 'STRUCTURE_CONTINUATION' },
  { id: 'pennant', name: 'Pennant', group: 'STRUCTURE_CONTINUATION' },
  { id: 'range-breakout', name: 'Range Breakout', group: 'BREAKOUT_STRUCTURE' },
  { id: 'volatility-squeeze', name: 'Volatility Squeeze', group: 'BREAKOUT_STRUCTURE' },
  { id: 'channel-breakout', name: 'Channel Breakout', group: 'BREAKOUT_STRUCTURE' },
  { id: 'rising-wedge', name: 'Rising Wedge', group: 'WEDGE' },
  { id: 'falling-wedge', name: 'Falling Wedge', group: 'WEDGE' },
  { id: 'bullish-engulfing', name: 'Bullish Engulfing', group: 'CANDLESTICK_REVERSAL' },
  { id: 'bearish-engulfing', name: 'Bearish Engulfing', group: 'CANDLESTICK_REVERSAL' },
  { id: 'morning-star', name: 'Morning Star', group: 'CANDLESTICK_REVERSAL' },
  { id: 'evening-star', name: 'Evening Star', group: 'CANDLESTICK_REVERSAL' },
  { id: 'hammer', name: 'Hammer', group: 'CANDLESTICK_REVERSAL' },
  { id: 'inverted-hammer', name: 'Inverted Hammer', group: 'CANDLESTICK_REVERSAL' },
  { id: 'shooting-star', name: 'Shooting Star', group: 'CANDLESTICK_REVERSAL' },
  { id: 'hanging-man', name: 'Hanging Man', group: 'CANDLESTICK_REVERSAL' },
  { id: 'piercing-line', name: 'Piercing Line', group: 'CANDLESTICK_REVERSAL' },
  { id: 'dark-cloud-cover', name: 'Dark Cloud Cover', group: 'CANDLESTICK_REVERSAL' },
  { id: 'tweezer-bottom', name: 'Tweezer Bottom', group: 'CANDLESTICK_REVERSAL' },
  { id: 'tweezer-top', name: 'Tweezer Top', group: 'CANDLESTICK_REVERSAL' },
  { id: 'dragonfly-doji', name: 'Dragonfly Doji', group: 'CANDLESTICK_REVERSAL' },
  { id: 'gravestone-doji', name: 'Gravestone Doji', group: 'CANDLESTICK_REVERSAL' },
  { id: 'bullish-harami', name: 'Bullish Harami', group: 'CANDLESTICK_REVERSAL' },
  { id: 'bearish-harami', name: 'Bearish Harami', group: 'CANDLESTICK_REVERSAL' },
  { id: 'abandoned-baby', name: 'Abandoned Baby', group: 'CANDLESTICK_REVERSAL' },
  { id: 'three-white-soldiers', name: 'Three White Soldiers', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'three-black-crows', name: 'Three Black Crows', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'rising-three-methods', name: 'Rising Three Methods', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'falling-three-methods', name: 'Falling Three Methods', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'three-line-strike', name: 'Three-Line Strike', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'mat-hold', name: 'Mat Hold', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'separating-lines', name: 'Separating Lines', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'marubozu-continuation', name: 'Marubozu Continuation', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'inside-bar-continuation', name: 'Inside Bar Continuation', group: 'CANDLESTICK_CONTINUATION' },
  { id: 'breakaway-gap', name: 'Breakaway Gap', group: 'CANDLESTICK_CONTINUATION', requiresGapCapableMarketData: true },
  { id: 'doji', name: 'Doji', group: 'SINGLE_CANDLE' },
  { id: 'spinning-top', name: 'Spinning Top', group: 'SINGLE_CANDLE' },
  { id: 'long-legged-doji', name: 'Long-Legged Doji', group: 'SINGLE_CANDLE' },
  { id: 'standard-marubozu', name: 'Standard Marubozu', group: 'SINGLE_CANDLE' },
  { id: 'pin-bar', name: 'Pin Bar', group: 'SINGLE_CANDLE' },
  { id: 'high-wave-candle', name: 'High-Wave Candle', group: 'SINGLE_CANDLE' },
  { id: 'micro-flag', name: 'Micro Flag', group: 'MICRO_PATTERN' },
  { id: 'micro-double-bottom', name: 'Micro Double Bottom', group: 'MICRO_PATTERN' },
] as const;

export type PatternDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type MarketRegime = 'BULL' | 'BEAR' | 'RANGE' | 'HIGH_VOLATILITY' | 'STRESS' | 'UNKNOWN';

export interface PatternEvidence {
  readonly contractVersion: typeof FINTECH_CORE_CRYPTO_CONTRACT_VERSION;
  readonly assetId: string;
  readonly patternId: string;
  readonly group: PatternGroupId;
  readonly direction: PatternDirection;
  readonly timeframe: string;
  readonly baseWeight: number;
  readonly patternQuality: number;
  readonly contextScore: number;
  readonly volumeConfirmation: number;
  readonly breakoutScore: number;
  readonly retestScore: number;
  readonly timeframeConfirmation: number;
  readonly marketRegime: MarketRegime;
  readonly marketRegimeScore: number;
  readonly historicalEdge: number;
  readonly assetReliability: number;
  readonly dataQuality: number;
  readonly evidenceRefs: readonly string[];
  readonly observedAt: string;
  readonly validationVersion: string;
  readonly scoreEligible: false;
}

export interface PatternReliabilityKey {
  readonly assetId: string;
  readonly profileId: CryptoAnalysisProfileId;
  readonly timeframe: string;
  readonly marketRegime: MarketRegime;
  readonly patternId: string;
  readonly validationVersion: string;
}

export const PATTERN_VALIDATION_RESEARCH_DEFAULTS = Object.freeze({
  minimumOccurrences: 100,
  trainWindowDays: 730,
  validationWindowDays: 180,
  walkForward: true,
  includeFees: true,
  includeSlippage: true,
  includeFunding: true,
  regimeSplit: ['BULL', 'BEAR', 'RANGE', 'HIGH_VOLATILITY'] as const,
  rejectIf: {
    sharpeBelow: 0.5,
    expectancyBelow: 0,
    maxDrawdownAbovePct: 25,
  },
  authority: 'RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY',
} as const);

export function getProfileAbsoluteWeight(profile: CryptoCategoryAnalysisProfile): number {
  return Number(profile.metrics.reduce((sum, metric) => sum + Math.abs(metric.weight), 0).toFixed(10));
}
