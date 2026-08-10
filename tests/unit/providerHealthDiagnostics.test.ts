import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProviderHealth,
  recordProviderHealth,
  resetProviderHealth,
} from '../../src/platform/Supervisor/providerHealth';

describe('provider health diagnostics contract', () => {
  beforeEach(() => resetProviderHealth());

  it('distinguishes configured transport success from usable provider payload', () => {
    recordProviderHealth({
      provider: 'CoinMarketCap',
      capability: 'crypto-global-market-snapshot',
      state: 'degraded',
      diagnosticCode: 'rate_limited',
      payloadUsable: false,
      circuitOpenUntil: '2026-08-10T22:00:00.000Z',
      message: 'HTTP 429',
    });

    expect(getProviderHealth()).toEqual([
      expect.objectContaining({
        provider: 'CoinMarketCap',
        state: 'degraded',
        diagnosticCode: 'rate_limited',
        payloadUsable: false,
        circuitOpenUntil: '2026-08-10T22:00:00.000Z',
      }),
    ]);
  });

  it('resets consecutive failures after usable live evidence', () => {
    recordProviderHealth({
      provider: 'CoinGecko',
      capability: 'crypto-global-market-snapshot',
      state: 'unavailable',
      diagnosticCode: 'transport_error',
      payloadUsable: false,
    });
    recordProviderHealth({
      provider: 'CoinGecko',
      capability: 'crypto-global-market-snapshot',
      state: 'healthy',
      diagnosticCode: 'healthy',
      payloadUsable: true,
      cacheMode: 'live',
    });

    const health = getProviderHealth()[0];
    expect(health.state).toBe('healthy');
    expect(health.payloadUsable).toBe(true);
    expect(health.consecutiveFailures).toBe(0);
    expect(health.lastSuccessAt).toBeTruthy();
    expect(health.lastFailureAt).toBeTruthy();
  });
});
