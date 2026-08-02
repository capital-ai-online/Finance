import { afterEach, describe, expect, it } from 'vitest';
import {
  getMarketDataProviderTelemetry,
  rankMarketDataProviders,
  recordMarketDataProviderOutcome,
  resetMarketDataProviderTelemetry,
  type MarketDataProviderDescriptor,
} from '../../src/services/marketDataProviderRouter';

const providers: MarketDataProviderDescriptor[] = [
  { id: 'Primary', assetClasses: ['crypto'], capabilities: ['history'], basePriority: 1, enabled: true },
  { id: 'Secondary', assetClasses: ['crypto'], capabilities: ['history'], basePriority: 2, enabled: true },
  { id: 'Disabled', assetClasses: ['crypto'], capabilities: ['history'], basePriority: 0, enabled: false },
];

afterEach(() => resetMarketDataProviderTelemetry());

describe('marketDataProviderRouter', () => {
  it('keeps governance base priority when providers are healthy', () => {
    const ranked = rankMarketDataProviders(providers, { assetClass: 'crypto', capability: 'history', nowMs: 1_000 });
    expect(ranked.map(item => item.provider.id)).toEqual(['Primary', 'Secondary']);
  });

  it('moves a provider behind a healthy fallback while it is cooling down', () => {
    recordMarketDataProviderOutcome({ provider: 'Primary', success: false, nowMs: 1_000, failureCooldownMs: 60_000 });
    const ranked = rankMarketDataProviders(providers, { assetClass: 'crypto', capability: 'history', nowMs: 2_000 });
    expect(ranked.map(item => item.provider.id)).toEqual(['Secondary', 'Primary']);
  });

  it('recovers routing preference after a successful primary observation', () => {
    recordMarketDataProviderOutcome({ provider: 'Primary', success: false, nowMs: 1_000, failureCooldownMs: 1_000 });
    recordMarketDataProviderOutcome({ provider: 'Primary', success: true, nowMs: 3_000, latencyMs: 120 });
    recordMarketDataProviderOutcome({ provider: 'Secondary', success: true, nowMs: 3_000, latencyMs: 800 });
    const ranked = rankMarketDataProviders(providers, { assetClass: 'crypto', capability: 'history', nowMs: 4_000 });
    expect(ranked[0].provider.id).toBe('Primary');
    expect(getMarketDataProviderTelemetry().find(item => item.provider === 'Primary')?.lastSuccessAt).toBeDefined();
  });
});
