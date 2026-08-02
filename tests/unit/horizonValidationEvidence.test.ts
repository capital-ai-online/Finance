import { describe, expect, it } from 'vitest';
import { selectHorizonValidationEvidence } from '../../src/services/horizonValidationEvidence';

describe('horizonValidationEvidence', () => {
  it('selects the nearest verified observation inside the horizon window', () => {
    const result = selectHorizonValidationEvidence({
      snapshotDate: '2026-06-01T00:00:00.000Z',
      horizonDays: 30,
      points: [
        { observedAt: '2026-07-01T02:00:00.000Z', price: 110, provider: 'ExampleProvider', evidenceId: 'ev-1' },
        { observedAt: '2026-07-02T00:00:00.000Z', price: 112, provider: 'ExampleProvider', evidenceId: 'ev-2' },
      ],
    });
    expect(result.status).toBe('READY');
    expect(result.selected?.evidenceId).toBe('ev-1');
    expect(result.syntheticEvidenceAllowed).toBe(false);
    expect(result.interpolationAllowed).toBe(false);
  });

  it('fails closed when no verified observation exists in the allowed window', () => {
    const result = selectHorizonValidationEvidence({
      snapshotDate: '2026-06-01T00:00:00.000Z',
      horizonDays: 30,
      maxDistanceMs: 6 * 60 * 60 * 1000,
      points: [
        { observedAt: '2026-07-03T00:00:00.000Z', price: 112, provider: 'ExampleProvider', evidenceId: 'ev-2' },
      ],
    });
    expect(result.status).toBe('NO_VERIFIED_POINT_IN_WINDOW');
    expect(result.selected).toBeNull();
  });

  it('rejects invalid prices and evidence without provider identity', () => {
    const result = selectHorizonValidationEvidence({
      snapshotDate: '2026-06-01T00:00:00.000Z',
      horizonDays: 30,
      points: [
        { observedAt: '2026-07-01T00:00:00.000Z', price: 0, provider: 'ExampleProvider', evidenceId: 'bad-price' },
        { observedAt: '2026-07-01T00:00:00.000Z', price: 110, provider: '', evidenceId: 'no-provider' },
      ],
    });
    expect(result.status).toBe('NO_VERIFIED_POINT_IN_WINDOW');
  });
});
