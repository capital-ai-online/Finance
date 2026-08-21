import { describe, expect, it } from 'vitest';
import {
  PATTERN_DETECTION_CONTRACT_VERSION,
  validatePatternDetectionRequest,
  type PatternDetectionRequest,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternDetectionContracts';

function request(overrides: Partial<PatternDetectionRequest> = {}): PatternDetectionRequest {
  return {
    contractVersion: PATTERN_DETECTION_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    timeframe: '4h',
    marketRegime: 'BULL',
    dataQuality: 0.95,
    bars: [
      {
        observedAt: '2026-08-20T08:00:00.000Z',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1_000,
        evidenceRefs: ['ohlcv:1'],
      },
      {
        observedAt: '2026-08-20T12:00:00.000Z',
        open: 105,
        high: 115,
        low: 100,
        close: 112,
        volume: 1_200,
        evidenceRefs: ['ohlcv:2'],
      },
    ],
    evidenceRefs: ['series:btc:4h'],
    ...overrides,
  };
}

describe('FinTech Core detector-agnostic pattern contracts', () => {
  it('accepts ordered provenance-backed OHLCV research input', () => {
    expect(() => validatePatternDetectionRequest(request())).not.toThrow();
  });

  it('rejects out-of-order bars', () => {
    const valid = request();
    expect(() => validatePatternDetectionRequest({
      ...valid,
      bars: [...valid.bars].reverse(),
    })).toThrow(/strictly increasing/i);
  });

  it('rejects impossible OHLC geometry and missing bar evidence', () => {
    const valid = request();
    expect(() => validatePatternDetectionRequest({
      ...valid,
      bars: [{
        ...valid.bars[0],
        high: 99,
      }],
    })).toThrow(/OHLC geometry/i);

    expect(() => validatePatternDetectionRequest({
      ...valid,
      bars: [{ ...valid.bars[0], evidenceRefs: [] }],
    })).toThrow(/evidence reference/i);
  });

  it('rejects invalid normalized data quality', () => {
    expect(() => validatePatternDetectionRequest(request({ dataQuality: 1.1 }))).toThrow(/0\.\.1/i);
  });
});
