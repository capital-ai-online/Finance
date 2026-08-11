import type { CryptoScoringInputs } from '../../src/types/crypto';
import type { MemeCoinInputs } from '../../src/types/memeCoin';
import type { TraditionalAssetScoringInputs } from '../../src/services/traditionalAssetScoring';

/**
 * Versioned deterministic golden dataset for scoring-regression gates.
 *
 * These are synthetic TEST FIXTURES, not production financial observations. They exist only to
 * verify deterministic formula stability and must never be exposed as market evidence.
 */
export const SCORING_GOLDEN_DATASET_VERSION = 'scoring-golden/1.0.0';

export const cryptoGoldenCase: { input: CryptoScoringInputs; expectedFinalScore: number } = {
  input: {
    coin: 'GOLDEN-CRYPTO',
    trend: 0.5,
    momentum: 0.5,
    volatility_quality: 0.5,
    breakout_quality: 0.5,
    relative_strength: 0.5,
    avg_daily_volume: 0.5,
    exchange_liquidity: 0.5,
    supply_dynamics: 0.5,
    regime_bonus: 0.5,
    data_quality_risk: 0.1,
  },
  // Positive factors contribute 48.0 points; inverted data-quality-risk contributes 3.6.
  expectedFinalScore: 51.6,
};

export const memeGoldenCase: { input: MemeCoinInputs; expectedFinalScore: number } = {
  input: {
    coin: 'GOLDEN-MEME',
    liquidity: 0.5,
    trend_structure: 0.5,
    momentum: 0.5,
    volatility_quality: 0.5,
  },
  expectedFinalScore: 50,
};

export const stockGoldenCase: { input: TraditionalAssetScoringInputs; expectedScore: number } = {
  input: {
    symbol: 'GOLDEN-STOCK',
    assetType: 'stock',
    trend: 0.5,
    momentum: 0.5,
    breakout_quality: 0.5,
    volatility_quality: 0.5,
    relative_strength: 0.5,
    value: 0.5,
    dividend: 0.5,
    quality: 0.5,
  },
  expectedScore: 50,
};

export const forexGoldenCase: { input: TraditionalAssetScoringInputs; expectedScore: number } = {
  input: {
    symbol: 'GOLDEN-FX',
    assetType: 'forex',
    trend: 0.5,
    momentum: 0.5,
    breakout_quality: 0.5,
    volatility_quality: 0.5,
    relative_strength: 0.5,
  },
  expectedScore: 50,
};
