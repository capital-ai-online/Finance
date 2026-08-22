export const CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION =
  'crypto-meme-research-features/0.2.0' as const;
export const CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION =
  'crypto-defi-research-features/0.2.0' as const;

export type CryptoResearchModelId = 'crypto-meme-integrity' | 'crypto-defi-fundamental';
export type CryptoResearchFeatureRole = 'RAW_EVIDENCE' | 'HARD_GATE';

export interface CryptoResearchFeatureBinding {
  readonly key: string;
  readonly source: string;
  readonly latentFactor: string;
  readonly correlationGroup: string;
  readonly role: CryptoResearchFeatureRole;
  readonly requiredForResearch: boolean;
}

export interface CryptoResearchModelContract {
  readonly modelId: CryptoResearchModelId;
  readonly modelVersion: '0.2.0';
  readonly featureContractVersion:
    | typeof CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION
    | typeof CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION;
  readonly lifecycle: 'challenger';
  readonly scoreEligible: false;
  readonly executableWeights: false;
  readonly features: readonly CryptoResearchFeatureBinding[];
  readonly antiCorrelationRules: readonly string[];
  readonly promotionRequirements: readonly string[];
}

const feature = (
  key: string,
  source: string,
  latentFactor: string,
  correlationGroup: string,
  role: CryptoResearchFeatureRole = 'RAW_EVIDENCE',
  requiredForResearch = true,
): CryptoResearchFeatureBinding => Object.freeze({
  key,
  source,
  latentFactor,
  correlationGroup,
  role,
  requiredForResearch,
});

/**
 * Supersession-B research contract for Meme assets.
 *
 * The legacy MemeCoinScoringService 35/25/20/20 formula is deliberately NOT copied. Verified
 * price-path observations may be inventoried, but correlated trend/momentum/volatility signals
 * belong to one latent factor and have no executable weights until an explicitly reviewed model
 * promotion provides manipulation/contract-risk evidence and reproducible fingerprints.
 */
export const CRYPTO_MEME_RESEARCH_MODEL_CONTRACT: CryptoResearchModelContract = Object.freeze({
  modelId: 'crypto-meme-integrity',
  modelVersion: '0.2.0',
  featureContractVersion: CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
  lifecycle: 'challenger',
  scoreEligible: false,
  executableWeights: false,
  features: Object.freeze([
    feature('technical.trend', 'verifiedCryptoTechnicalScoring.inputs.trend', 'pricePath', 'meme-price-path'),
    feature('technical.momentum', 'verifiedCryptoTechnicalScoring.inputs.momentum', 'pricePath', 'meme-price-path'),
    feature('risk.volatilityQuality', 'verifiedCryptoTechnicalScoring.inputs.volatility_quality', 'pricePath', 'meme-price-path'),
    feature('liquidity.marketQuality', 'verifiedCryptoTechnicalScoring.inputs.avg_daily_volume', 'marketLiquidity', 'meme-market-liquidity'),
    feature('risk.contractIntegrityVerified', 'governed-onchain-evidence', 'contractIntegrity', 'meme-contract-risk', 'HARD_GATE'),
    feature('risk.manipulationEvidenceWithinPolicy', 'governed-market-integrity-evidence', 'marketIntegrity', 'meme-manipulation-risk', 'HARD_GATE'),
  ]),
  antiCorrelationRules: Object.freeze([
    'trend, momentum and volatilityQuality are correlated price-path observations and MUST be reduced to one validated latent factor before any future weighting.',
    'market volume/liquidity evidence MUST NOT be reused as community, popularity or manipulation evidence.',
    'classification, social narrative, LLM sentiment and caller-provided confidence MUST NOT become score evidence.',
    'missing, stale or unverified contract/manipulation evidence MUST remain NOT_COMPUTABLE; never substitute 0, PASS or a neutral default.',
  ]),
  promotionRequirements: Object.freeze([
    'explicit Owner-approved model promotion through the existing ScoringModelRegistry/ScoringDispatcher',
    'validated contract-integrity and market-manipulation evidence providers with freshness/DQ policy',
    'versioned executable weights with effective-feature and effective-weight fingerprints',
    'out-of-sample validation against the canonical crypto champion and documented false-positive/false-negative analysis',
    'no parallel Meme dispatcher, registry, persistence authority or route-local canonical scorer',
  ]),
});

/**
 * Supersession-B research contract for DeFi assets.
 *
 * TVL, fees and revenue are retained as raw protocol evidence but are explicitly correlation-bound:
 * they describe overlapping protocol scale/activity and cannot become three independently weighted
 * score factors without a validated de-correlation/latent-factor transform.
 */
export const CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT: CryptoResearchModelContract = Object.freeze({
  modelId: 'crypto-defi-fundamental',
  modelVersion: '0.2.0',
  featureContractVersion: CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION,
  lifecycle: 'challenger',
  scoreEligible: false,
  executableWeights: false,
  features: Object.freeze([
    feature('protocol.tvlUsd', 'fintech-core.crypto/category-features/0.1.0', 'protocolScaleActivity', 'defi-scale-activity'),
    feature('protocol.feesUsd', 'fintech-core.crypto/category-features/0.1.0', 'protocolScaleActivity', 'defi-scale-activity'),
    feature('protocol.revenueUsd', 'fintech-core.crypto/category-features/0.1.0', 'protocolScaleActivity', 'defi-scale-activity'),
    feature('risk.badDebtUsd', 'fintech-core.crypto/category-features/0.1.0', 'creditRisk', 'defi-credit-risk'),
    feature('tokenomics.emissions', 'fintech-core.crypto/category-features/0.1.0', 'tokenEconomics', 'defi-token-economics'),
    feature('liquidity.lpConcentration', 'fintech-core.crypto/category-features/0.1.0', 'liquidityConcentration', 'defi-liquidity-concentration'),
    feature('protocol.smartContractEvidenceVerified', 'fintech-core.crypto/category-features/0.1.0', 'smartContractIntegrity', 'defi-contract-risk', 'HARD_GATE'),
    feature('risk.oracleRiskWithinPolicy', 'fintech-core.crypto/category-features/0.1.0', 'oracleIntegrity', 'defi-oracle-risk', 'HARD_GATE'),
  ]),
  antiCorrelationRules: Object.freeze([
    'TVL, fees and revenue share protocol scale/activity exposure and MUST NOT receive independent additive weights without a validated de-correlation or latent-factor transform.',
    'token price/market-cap evidence MUST remain separate from protocol usage/fundamental evidence.',
    'DeFiLlama is an evidence provider only; provider availability, ranking or brand MUST NOT affect score weight or eligibility.',
    'STALE, NOT_AVAILABLE or INVALID evidence MUST NOT satisfy REQUIRED/HARD_GATE semantics and MUST never be converted to 0 or PASS.',
  ]),
  promotionRequirements: Object.freeze([
    'explicit Owner-approved model promotion through the existing ScoringModelRegistry/ScoringDispatcher',
    'validated category-specific DQ/freshness thresholds and protocol-to-token identity mapping',
    'versioned executable weights with effective-feature and effective-weight fingerprints',
    'documented treatment of protocol forks, multi-chain deployments, token/protocol mismatch and double-counted TVL',
    'no second DeFi dispatcher, evidence registry, queue, persistence authority or direct provider-to-score path',
  ]),
});

export const CRYPTO_RESEARCH_MODEL_CONTRACTS = Object.freeze([
  CRYPTO_MEME_RESEARCH_MODEL_CONTRACT,
  CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT,
] as const);
