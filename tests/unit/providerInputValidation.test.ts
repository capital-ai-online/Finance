import { describe, expect, it } from 'vitest';
import {
  PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION,
  validateProviderHistoryInput,
  validateProviderSnapshotInput,
  type ProviderHistoryInput,
  type ProviderSnapshotInput,
} from '../../src/platform/MarketData/providerInputValidation';

function snapshot(overrides: Partial<ProviderSnapshotInput> = {}): ProviderSnapshotInput {
  return {
    providerId: 'provider.alpaca',
    symbol: 'AAPL',
    assetClass: 'stock',
    price: 190.25,
    sourceTimestamp: '2026-09-07T10:00:00.000Z',
    ingestedAt: '2026-09-07T10:00:01.000Z',
    correlationId: 'corr-data-14-001',
    evidenceRef: 'evd:alpaca:AAPL:price:20260907T100000Z',
    ...overrides,
  };
}

function history(overrides: Partial<ProviderHistoryInput> = {}): ProviderHistoryInput {
  return {
    providerId: 'provider.alpaca',
    symbol: 'AAPL',
    assetClass: 'stock',
    receivedAt: '2026-09-07T10:00:01.000Z',
    correlationId: 'corr-data-14-002',
    evidenceRef: 'evd:alpaca:AAPL:history:20260907',
    points: [
      { timestamp: '2026-09-06T10:00:00.000Z', close: 188.1 },
      { timestamp: '2026-09-07T10:00:00.000Z', close: 190.25 },
    ],
    ...overrides,
  };
}

describe('DATA-14 provider input validation', () => {
  it('accepts a complete snapshot payload', () => {
    const result = validateProviderSnapshotInput(snapshot());
    expect(result.contractVersion).toBe(PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION);
    expect(result.admissibility).toBe('ADMISSIBLE');
    expect(result.violations).toEqual([]);
  });

  it('rejects missing identity, non-finite price and invalid timestamps', () => {
    expect(validateProviderSnapshotInput(snapshot({ providerId: '  ' })).violations).toContain('providerId');
    expect(validateProviderSnapshotInput(snapshot({ symbol: null })).violations).toContain('symbol');
    expect(validateProviderSnapshotInput(snapshot({ assetClass: 'wallet' })).violations).toContain('assetClass');
    expect(validateProviderSnapshotInput(snapshot({ price: 0 })).violations).toContain('price');
    expect(validateProviderSnapshotInput(snapshot({ price: Number.NaN })).violations).toContain('price');
    expect(validateProviderSnapshotInput(snapshot({ sourceTimestamp: 'soon' })).violations).toContain('sourceTimestamp');
    expect(validateProviderSnapshotInput(snapshot({ evidenceRef: null })).admissibility).toBe('NON_ADMISSIBLE');
  });

  it('rejects empty, non-finite or untimestamped history points', () => {
    expect(validateProviderHistoryInput(history()).admissibility).toBe('ADMISSIBLE');
    expect(validateProviderHistoryInput(history({ points: [] })).violations).toContain('points');
    expect(validateProviderHistoryInput(history({
      points: [{ timestamp: '2026-09-07T10:00:00.000Z', close: -1 }],
    })).violations).toContain('points');
    expect(validateProviderHistoryInput(history({
      points: [{ timestamp: null, close: 10 }],
    })).admissibility).toBe('NON_ADMISSIBLE');
  });

  it('does not invent a synthetic admissible fallback', () => {
    const result = validateProviderSnapshotInput(snapshot({ price: null, evidenceRef: null }));
    expect(result.admissibility).toBe('NON_ADMISSIBLE');
    expect(result.reason).toContain('provider-snapshot-invalid');
    expect(result.violations).toEqual(expect.arrayContaining(['price', 'evidenceRef']));
  });
});
