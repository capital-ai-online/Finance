import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDefiProtocolEvidence,
  isDefiLlamaEvidenceEnabled,
  resetDefiProtocolEvidenceProviderForTests,
} from '../../src/services/defiProtocolEvidence';
import { resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';

function protocolPayload() {
  return {
    name: 'AAVE',
    tvl: [{ date: 1_723_680_000, totalLiquidityUSD: 10_800_000_000 }],
  };
}

function feesOverviewPayload() {
  return {
    protocols: [{ name: 'AAVE', slug: 'aave', total24h: 250_000, dailyRevenue: 90_000 }],
  };
}

beforeEach(() => {
  resetDefiProtocolEvidenceProviderForTests();
  resetProviderHealth();
});

describe('isDefiLlamaEvidenceEnabled', () => {
  it('defaults to enabled and only disables on the literal string "false"', () => {
    expect(isDefiLlamaEvidenceEnabled({} as NodeJS.ProcessEnv)).toBe(true);
    expect(isDefiLlamaEvidenceEnabled({ DEFILLAMA_EVIDENCE_ENABLED: 'false' } as NodeJS.ProcessEnv)).toBe(false);
  });
});

describe('fetchDefiProtocolEvidence', () => {
  it('returns UNSUPPORTED_ASSET for a symbol without a curated DeFiLlama slug, without a network call', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchDefiProtocolEvidence('NOTMAPPED', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.status).toBe('UNSUPPORTED_ASSET');
    expect(result.slug).toBeNull();
    expect(result.evidence).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns DISABLED without a network call when the evidence flag is off', async () => {
    const fetchImpl = vi.fn();
    const result = await fetchDefiProtocolEvidence('AAVE', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      env: { DEFILLAMA_EVIDENCE_ENABLED: 'false' } as NodeJS.ProcessEnv,
    });
    expect(result.status).toBe('DISABLED');
    expect(result.evidence).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns READY with three populated feature-evidence entries for a fully verified mapped symbol', async () => {
    const fetchImpl = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => (url.includes('/protocol/') ? protocolPayload() : feesOverviewPayload()),
    })) as unknown as typeof fetch;

    const result = await fetchDefiProtocolEvidence('AAVE', { fetchImpl });
    expect(result.status).toBe('READY');
    expect(result.slug).toBe('aave');
    expect(result.evidence).toHaveLength(3);
    expect(result.evidence.map((e) => e.key)).toEqual(
      expect.arrayContaining(['protocol.tvlUsd', 'protocol.feesUsd', 'protocol.revenueUsd']),
    );
    expect(result.evidence.every((e) => e.status === 'VERIFIED')).toBe(true);
  });

  it('returns PARTIAL when only some evidence keys are verified', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/protocol/')) return { ok: true, status: 200, json: async () => protocolPayload() };
      return { ok: false, status: 500, json: async () => ({}) };
    }) as unknown as typeof fetch;

    const result = await fetchDefiProtocolEvidence('AAVE', { fetchImpl, maxAttempts: 1 });
    expect(result.status).toBe('PARTIAL');
    const tvl = result.evidence.find((e) => e.key === 'protocol.tvlUsd');
    const fees = result.evidence.find((e) => e.key === 'protocol.feesUsd');
    expect(tvl?.status).toBe('VERIFIED');
    expect(fees?.status).toBe('NOT_AVAILABLE');
    expect(fees?.value).toBeNull();
  });

  it('returns SOURCE_UNAVAILABLE without any invented value when the upstream is fully down', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch;
    const result = await fetchDefiProtocolEvidence('AAVE', { fetchImpl, maxAttempts: 1 });
    expect(result.status).toBe('SOURCE_UNAVAILABLE');
    expect(result.evidence.every((e) => e.value === null)).toBe(true);
  });
});
