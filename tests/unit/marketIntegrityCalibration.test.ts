import { describe, expect, it } from 'vitest';
import {
  buildMarketIntegrityCalibrationReport,
  MARKET_INTEGRITY_CALIBRATION_VERSION,
} from '../../src/services/marketIntegrityCalibration';
import type { MarketIntegrityObservation } from '../../src/platform/Supervisor/marketIntegrityRuntime';

function observation(
  index: number,
  state: MarketIntegrityObservation['state'],
  capability: MarketIntegrityObservation['capability'] = 'spot-consensus',
): MarketIntegrityObservation {
  return {
    id: `obs-${index}`,
    symbol: index % 2 === 0 ? 'BTC' : 'ETH',
    capability,
    state,
    correlationId: `corr-${index}`,
    observedAt: `2026-08-02T10:${String(index % 60).padStart(2, '0')}:00.000Z`,
    providers: ['CoinAPI', 'TwelveData'],
    evidenceIds: [`evidence-${index}`],
  };
}

describe('market integrity calibration report', () => {
  it('does not invent calibration evidence when no runtime observations exist', () => {
    const result = buildMarketIntegrityCalibrationReport([], 5);
    expect(result.contractVersion).toBe(MARKET_INTEGRITY_CALIBRATION_VERSION);
    expect(result.status).toBe('NO_RUNTIME_EVIDENCE');
    expect(result.hardGateEnabled).toBe(false);
    expect(result.hardGateRecommended).toBe(false);
  });

  it('collects state distributions below the review sample without enabling a hard gate', () => {
    const records = [
      observation(1, 'consistent'),
      observation(2, 'consistent'),
      observation(3, 'conflict'),
    ];
    const result = buildMarketIntegrityCalibrationReport(records, 5);
    const spot = result.capabilities.find(item => item.capability === 'spot-consensus');

    expect(result.status).toBe('COLLECTING');
    expect(result.observations).toBe(3);
    expect(spot?.consistencyRate).toBe(0.6667);
    expect(spot?.conflictRate).toBe(0.3333);
    expect(result.hardGateEnabled).toBe(false);
  });

  it('requires manual review even after the minimum sample is reached', () => {
    const records = Array.from({ length: 5 }, (_, index) => observation(index, 'consistent'));
    const result = buildMarketIntegrityCalibrationReport(records, 5);
    expect(result.status).toBe('READY_FOR_MANUAL_REVIEW');
    expect(result.hardGateRecommended).toBe(false);
    expect(result.reason).toContain('reviewed');
  });
});
