import { describe, expect, it } from 'vitest';
import { CryptoScoringService } from '../../src/services/cryptoScoringService';
import { MemeCoinScoringService } from '../../src/services/memeCoinScoringService';
import { TraditionalAssetScoringService } from '../../src/services/traditionalAssetScoring';
import {
  cryptoGoldenCase,
  forexGoldenCase,
  memeGoldenCase,
  SCORING_GOLDEN_DATASET_VERSION,
  stockGoldenCase,
} from '../fixtures/scoringGoldenV1';

describe(`scoring golden regression ${SCORING_GOLDEN_DATASET_VERSION}`, () => {
  it('locks the deterministic crypto score', () => {
    const result = CryptoScoringService.scoreCrypto(cryptoGoldenCase.input, SCORING_GOLDEN_DATASET_VERSION);
    expect(result.final_score).toBe(cryptoGoldenCase.expectedFinalScore);
  });

  it('locks the deterministic meme-coin score', () => {
    const result = MemeCoinScoringService.scoreMemeCoin(memeGoldenCase.input, SCORING_GOLDEN_DATASET_VERSION);
    expect(result.final_score).toBe(memeGoldenCase.expectedFinalScore);
  });

  it('locks the deterministic stock score', () => {
    const result = TraditionalAssetScoringService.scoreTraditionalAsset(stockGoldenCase.input);
    expect(result.score).toBe(stockGoldenCase.expectedScore);
  });

  it('locks the deterministic forex score', () => {
    const result = TraditionalAssetScoringService.scoreTraditionalAsset(forexGoldenCase.input);
    expect(result.score).toBe(forexGoldenCase.expectedScore);
  });

  it('does not silently score an empty traditional input as evidence-backed', () => {
    const result = TraditionalAssetScoringService.scoreTraditionalAsset({
      symbol: 'NO-DATA',
      assetType: 'stock',
    });
    expect(result.usedFactors).toHaveLength(0);
    expect(result.missingFactors.length).toBeGreaterThan(0);
  });
});
