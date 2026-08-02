import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProviderHealth,
  recordProviderHealth,
  resetProviderHealth,
} from '../../src/platform/Supervisor/providerHealth';
import { getSupervisorStatus } from '../../src/platform/Supervisor/supervisor';

beforeEach(() => resetProviderHealth());

describe('provider health registry', () => {
  it('tracks healthy, degraded and failure transitions without fabricated providers', () => {
    recordProviderHealth({ provider: 'CoinGecko', capability: 'crypto-history', state: 'healthy', at: '2026-08-02T06:00:00.000Z', cacheMode: 'fresh' });
    recordProviderHealth({ provider: 'CoinGecko', capability: 'crypto-history', state: 'degraded', at: '2026-08-02T06:01:00.000Z', cacheMode: 'last-known-good' });

    const health = getProviderHealth();
    expect(health).toHaveLength(1);
    expect(health[0].state).toBe('degraded');
    expect(health[0].lastSuccessAt).toBe('2026-08-02T06:00:00.000Z');
    expect(health[0].lastFailureAt).toBe('2026-08-02T06:01:00.000Z');
    expect(health[0].consecutiveFailures).toBe(1);
  });

  it('is exposed by the central supervisor status contract', () => {
    recordProviderHealth({ provider: 'CoinGecko', capability: 'crypto-snapshot', state: 'healthy', at: '2026-08-02T06:00:00.000Z' });
    const status = getSupervisorStatus();
    expect(status.capabilities.providerHealth).toBe(true);
    expect(status.providerHealth.some((item) => item.capability === 'crypto-snapshot')).toBe(true);
  });
});
