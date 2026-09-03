import { describe, expect, it } from 'vitest';
import {
  createUniversalAssetIdentity,
  scoringModelRegistry,
} from '../../src/platform/Scoring';

describe('Equity P1-A productive registry boundary', () => {
  it('keeps the Equity research model outside productive registry admission', () => {
    expect(scoringModelRegistry.get('equity-multifactor')).toBeNull();
  });

  it('keeps traditional-scoring@2.1.0 as the sole productive stock champion', () => {
    const resolution = scoringModelRegistry.resolve(
      createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' }),
    );

    expect(resolution.status).toBe('RESOLVED');
    if (resolution.status !== 'RESOLVED') return;
    expect(resolution.model.modelId).toBe('traditional-scoring');
    expect(resolution.model.version).toBe('2.1.0');
    expect(resolution.model.alias).toBe('champion');
    expect(resolution.model.lifecycle).toBe('canonical');
    expect(resolution.model.scoreEligible).not.toBe(false);
  });
});
