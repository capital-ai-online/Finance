import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getProviderMatrixEntry } from '../../src/platform/MarketData/ProviderMatrix';
import {
  resetProviderRuntimeObservability,
  summarizeProviderRuntime,
} from '../../src/platform/MarketData/providerRuntimeObservability';
import { getProviderHealth, resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';
import {
  getTwelveDataCommodityEvidence,
  resetCommodityReferenceCache,
} from '../../src/services/commodityMarketEvidence';

function jsonResponse(data: unknown): Response {
  return { ok: true, status: 200, json: async () => data } as Response;
}

describe('Commodity P0/P1 provider governance', () => {
  it('registers Commodity providers in the canonical ProviderMatrix', () => {
    const twelve = getProviderMatrixEntry('twelvedata');
    expect(twelve?.assetClasses).toContain('commodity');
    expect(twelve?.capabilities).toContain('history');
    expect(twelve?.gatewayStatus).toBe('behind_gateway');

    for (const providerId of ['eia', 'usda-fas-psd', 'cftc-cot', 'usgs-mcs', 'eu-crma']) {
      const provider = getProviderMatrixEntry(providerId);
      expect(provider?.assetClasses).toContain('commodity');
      expect(provider?.enabled).toBe(true);
    }
  });

  it('acquires TwelveData commodity history through governed transport + HistoryGateway', async () => {
    resetCommodityReferenceCache();
    const values = Array.from({ length: 20 }, (_, index) => ({
      datetime: `2026-08-${String(index + 1).padStart(2, '0')}`,
      close: String(400 + index),
    }));
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/commodities')) return jsonResponse({ data: [{ symbol: 'C_1', name: 'Corn' }] });
      if (url.includes('/time_series')) {
        return jsonResponse({ meta: { symbol: 'C_1', type: 'Commodity', currency: 'USD' }, values });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof fetch;

    const evidence = await getTwelveDataCommodityEvidence('CMD_CORN_CBOT', 20, {
      apiKey: 'test',
      fetchImpl,
      nowMs: () => Date.parse('2026-08-23T12:00:00.000Z'),
    });

    expect(evidence.provider).toBe('TwelveData');
    expect(evidence.providerId).toBe('twelvedata');
    expect(evidence.providerSymbol).toBe('C_1');
    expect(evidence.points).toHaveLength(20);
    expect(evidence.evidenceIds).toHaveLength(20);
    expect(evidence.evidenceIds.every(id => id.startsWith('commodity:twelvedata:C_1:'))).toBe(true);
  });

  it('fails closed on application-level provider errors and records unusable provider health', async () => {
    resetCommodityReferenceCache();
    resetProviderHealth();
    resetProviderRuntimeObservability();
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/commodities')) return jsonResponse({ data: [{ symbol: 'C_1', name: 'Corn' }] });
      if (url.includes('/time_series')) {
        return jsonResponse({ code: 429, message: 'provider-internal-detail', status: 'error' });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof fetch;

    await expect(getTwelveDataCommodityEvidence('CMD_CORN_CBOT', 20, {
      apiKey: 'test',
      fetchImpl,
      nowMs: () => Date.parse('2026-08-23T12:00:00.000Z'),
    })).rejects.toThrow('All approved history providers were unavailable or returned invalid data.');

    const health = getProviderHealth().find(item => item.provider === 'twelvedata' && item.capability === 'commodity-history');
    expect(health?.state).toBe('unavailable');
    expect(health?.diagnosticCode).toBe('provider_error');
    expect(health?.payloadUsable).toBe(false);
    expect(health?.message).toBe('Provider returned an application-level error response.');
    expect(health?.message).not.toContain('provider-internal-detail');

    const runtime = summarizeProviderRuntime('twelvedata', 'commodity-history');
    expect(runtime.sampleCount).toBe(2);
    expect(runtime.requestAttemptCount).toBe(2);
    expect(runtime.localDenialCount).toBe(0);
    expect(runtime.availabilityRate).toBe(0.5);
    expect(runtime.errorRate).toBe(0.5);
    expect(runtime.currentCircuitState).toBe('CLOSED');
  });

  it('contains no route-local direct TwelveData time-series fetch path', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/services/commodityMarketEvidence.ts'), 'utf8');
    expect(source).toContain('MarketDataHistoryGateway');
    expect(source).toContain('ResearchEvidenceProviderHttp');
    expect(source).toContain('TwelveDataCommodityHistoryProvider');
    expect(source).not.toContain('fetchJsonWithTimeout');
    expect(source).not.toMatch(/fetch\s*\(/);
  });

  it('keeps official fundamental transports evidence-only rather than scoring authorities', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/services/commodityOfficialEvidence.ts'), 'utf8');
    expect(source).toContain('ResearchEvidenceProviderHttp');
    expect(source).toContain('scoreEligible: false');
    expect(source).not.toContain('dispatchCanonicalScore');
    expect(source).not.toContain('ScoringModelRegistry');
    expect(source).not.toContain('CanonicalScoreResult');
  });

  it('does not expose raw caught exception messages from commodity 5xx routes', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/routes/rawMaterialsRoutes.ts'), 'utf8');
    expect(source).toContain("code: 'COMMODITY_EVIDENCE_UNAVAILABLE'");
    expect(source).toContain("code: 'RAW_MATERIAL_ANALYSIS_FAILED'");
    expect(source).toContain("code: 'RAW_MATERIAL_SCORING_FAILED'");
    expect(source).not.toContain("reason: error instanceof Error ? error.message : String(error)");
    expect(source).not.toContain("error: error.message || 'Internal Server Error'");
  });
});
