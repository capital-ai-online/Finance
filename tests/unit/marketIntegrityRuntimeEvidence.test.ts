import { beforeEach, describe, expect, it } from 'vitest';
import {
  recordMarketIntegrityObservation,
  resetMarketIntegrityObservations,
} from '../../src/platform/Supervisor/marketIntegrityRuntime';
import { buildMarketIntegrityEvidenceScanner } from '../../src/platform/Compliance/marketIntegrityEvidence';

beforeEach(() => resetMarketIntegrityObservations());

describe('market integrity runtime compliance evidence', () => {
  it('creates a HIGH finding for observed source conflict', () => {
    recordMarketIntegrityObservation({
      symbol: 'BTC',
      capability: 'snapshot-consensus',
      state: 'conflict',
      correlationId: 'test-correlation',
      providers: ['CoinGecko', 'CoinMarketCap'],
      evidenceIds: ['e1', 'e2'],
      message: 'Market cap disagreement',
    });
    const scanner = buildMarketIntegrityEvidenceScanner();
    expect(scanner?.id).toBe('RUNTIME-MARKET-INTEGRITY-01');
    expect(scanner?.findings).toHaveLength(1);
    expect(scanner?.findings[0].severity).toBe('HIGH');
    expect(scanner?.riskScore).toBeGreaterThan(0);
  });

  it('does not create findings for consistent observed evidence', () => {
    recordMarketIntegrityObservation({
      symbol: 'ETH',
      capability: 'spot-consensus',
      state: 'consistent',
      correlationId: 'test-correlation-2',
      providers: ['CoinAPI', 'TwelveData'],
      evidenceIds: ['e3', 'e4'],
    });
    const scanner = buildMarketIntegrityEvidenceScanner();
    expect(scanner?.findings).toHaveLength(0);
    expect(scanner?.complianceScore).toBe(100);
  });
});
