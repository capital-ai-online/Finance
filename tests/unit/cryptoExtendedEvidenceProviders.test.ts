import { describe, expect, it, vi } from 'vitest';
import { ResearchEvidenceProviderHttp } from '../../src/platform/MarketData/providers/ResearchEvidenceProviderHttp';
import { GoPlusTokenSecurityProvider } from '../../src/platform/MarketData/providers/GoPlusTokenSecurityProvider';
import { DuneQueryEvidenceProvider } from '../../src/platform/MarketData/providers/DuneQueryEvidenceProvider';
import {
  PROVIDER_MATRIX,
  getProviderMatrixEntry,
  providersBehindGateway,
  rateLimitOverridesFromMatrix,
} from '../../src/platform/MarketData/ProviderMatrix';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('SC4 extended crypto evidence providers', () => {
  it('keeps every new evidence provider outside MarketDataGateway routing', () => {
    const ids = ['goplus', 'coinglass', 'lunarcrush', 'messari', 'dune', 'newsapi'];
    for (const id of ids) {
      const entry = getProviderMatrixEntry(id);
      expect(entry).toBeDefined();
      expect(entry?.gatewayStatus).toBe('not_wired');
      expect(rateLimitOverridesFromMatrix()[id]).toBeUndefined();
      expect(providersBehindGateway().some(item => item.id === id)).toBe(false);
    }
    expect(new Set(PROVIDER_MATRIX.map(item => item.id)).size).toBe(PROVIDER_MATRIX.length);
  });

  it('fails closed before transport when a key-required provider has no key', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }));
    const http = new ResearchEvidenceProviderHttp('coinglass', 'derivatives', {
      baseUrl: 'https://provider.example',
      apiKey: null,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-22T05:00:00.000Z'),
    });

    const result = await http.requestJson('/data');
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.data).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('supports an explicitly governed keyless provider without adding an Authorization header', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ code: 1, result: {} }));
    const http = new ResearchEvidenceProviderHttp('goplus', 'security', {
      baseUrl: 'https://provider.example',
      apiKey: null,
      apiKeyRequired: false,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-22T05:00:00.000Z'),
    });

    const result = await http.requestJson('/security');
    expect(result.status).toBe('READY');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('maps provider entitlement rejection to a fail-closed unavailable result', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ message: 'forbidden' }, 403));
    const http = new ResearchEvidenceProviderHttp('coinglass', 'derivatives', {
      baseUrl: 'https://provider.example',
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-22T05:00:00.000Z'),
    });

    const result = await http.requestJson('/data');
    expect(result.status).toBe('SOURCE_UNAVAILABLE');
    expect(result.data).toBeNull();
    expect(result.reason).toMatch(/authentication|entitlement/i);
  });

  it('allows GoPlus public Security API operation without a configured key', async () => {
    const contractAddress = '0x1111111111111111111111111111111111111111';
    const fetchImpl = vi.fn(async () => jsonResponse({
      code: 1,
      result: {
        [contractAddress]: {
          is_open_source: '1',
          is_proxy: '0',
          is_mintable: '0',
          is_honeypot: '0',
          holders: [],
          lp_holders: [],
        },
      },
    }));
    const provider = new GoPlusTokenSecurityProvider({
      env: {},
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse('2026-08-22T05:00:00.000Z'),
    });

    const result = await provider.getTokenSecurity({ chainId: '1', contractAddress });
    expect(result.status).toBe('VERIFIED');
    expect(result.isOpenSource).toBe(true);
    expect(result.isHoneypot).toBe(false);
    expect(result.evidenceId).toContain(contractAddress);
  });

  it('rejects ungoverned Dune query IDs before any network call', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ result: { rows: [{ value: 1 }] } }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key',
      allowedQueryIds: [123],
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
    });

    const result = await provider.getLatestSavedQuery(999, ['value']);
    expect(result.status).toBe('QUERY_NOT_GOVERNED');
    expect(result.rows).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fails closed on Dune saved-query output schema drift', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      execution_id: 'exec-1',
      result: { rows: [{ wrong_column: 1 }] },
    }));
    const provider = new DuneQueryEvidenceProvider({
      apiKey: 'test-key',
      allowedQueryIds: [123],
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
    });

    const result = await provider.getLatestSavedQuery(123, ['required_column']);
    expect(result.status).toBe('INVALID');
    expect(result.rows).toEqual([]);
    expect(result.reason).toMatch(/schema drift/i);
  });
});
