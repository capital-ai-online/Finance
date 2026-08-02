import { describe, expect, it } from 'vitest';
import { buildRuntimeEvidenceScanner } from '../../src/platform/Compliance/runtimeEvidence';

describe('runtime compliance evidence', () => {
  it('does not invent a scanner result when no runtime provider was observed', () => {
    expect(buildRuntimeEvidenceScanner([])).toBeNull();
  });

  it('converts observed degraded/unavailable provider health into findings', () => {
    const result = buildRuntimeEvidenceScanner([
      {
        provider: 'CoinGecko',
        capability: 'crypto-history',
        state: 'healthy',
        lastObservedAt: '2026-08-02T06:00:00.000Z',
        lastSuccessAt: '2026-08-02T06:00:00.000Z',
        consecutiveFailures: 0,
        cacheMode: 'fresh',
      },
      {
        provider: 'CoinGecko',
        capability: 'crypto-snapshot',
        state: 'degraded',
        lastObservedAt: '2026-08-02T06:01:00.000Z',
        lastFailureAt: '2026-08-02T06:01:00.000Z',
        consecutiveFailures: 1,
        cacheMode: 'last-known-good',
      },
    ]);

    expect(result?.id).toBe('RUNTIME-01');
    expect(result?.findings).toHaveLength(1);
    expect(result?.findings[0].severity).toBe('MEDIUM');
    expect(result?.complianceScore).toBeLessThan(100);
    expect(result?.evidence).toContain('1 healthy');
    expect(result?.evidence).toContain('1 degraded');
  });

  it('treats an actually unavailable data provider as a blocking high finding', () => {
    const result = buildRuntimeEvidenceScanner([
      {
        provider: 'CoinGecko',
        capability: 'crypto-history',
        state: 'unavailable',
        lastObservedAt: '2026-08-02T06:00:00.000Z',
        lastFailureAt: '2026-08-02T06:00:00.000Z',
        consecutiveFailures: 3,
      },
    ]);
    expect(result?.findings[0].severity).toBe('HIGH');
    expect(result?.riskScore).toBe(25);
  });
});
