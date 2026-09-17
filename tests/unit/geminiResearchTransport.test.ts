import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GEMINI_INTERACTIONS_ENDPOINT,
  GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION,
  GeminiResearchServerTransport,
  getGeminiResearchShadowTelemetry,
  loadGeminiResearchShadowConfig,
  resetGeminiResearchShadowTelemetry,
  type GeminiResearchShadowConfig,
} from '../../server/researchEvidence/geminiResearchTransport';
import { GEMINI_RESEARCH_RESPONSE_SCHEMA } from '../../src/platform/ResearchEvidence/GeminiResearchEvidenceAdapter';
import { resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';

function enabledConfig(overrides: Partial<GeminiResearchShadowConfig> = {}): GeminiResearchShadowConfig {
  return {
    runtimeVersion: GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION,
    enabled: true,
    ready: true,
    configurationErrors: [],
    apiKey: 'server-secret-test-key',
    model: 'gemini-test-model',
    timeoutMs: 2_000,
    requestsPerMinute: 3,
    dailyRequestBudget: 20,
    dailyTokenBudget: 100_000,
    dailyCostBudgetUsd: 5,
    inputUsdPerMillionTokens: 1,
    outputUsdPerMillionTokens: 2,
    googleSearchUsdPerThousandRequests: 10,
    circuitFailureThreshold: 3,
    circuitCooldownMs: 60_000,
    maxOutputTokens: 512,
    thinkingLevel: 'low',
    ...overrides,
  };
}

const request = {
  correlationId: 'corr-gemini-shadow-1',
  assetId: 'crypto:BTC',
  symbol: 'BTC',
  assetClass: 'crypto',
  fields: ['tokenomics'],
  query: 'Find the current official tokenomics statement for Bitcoin.',
  urls: ['https://example.com/bitcoin'],
  systemInstruction: 'Research only. Never score.',
  tools: ['google_search', 'url_context'] as const,
  responseSchema: GEMINI_RESEARCH_RESPONSE_SCHEMA,
  functionCallingEnabled: false as const,
};

function successfulInteraction(url = 'https://example.com/bitcoin') {
  const text = JSON.stringify({ claims: [{ field: 'tokenomics', value: 'fixed supply', extractionConfidence: 0.9 }] });
  const fieldIndex = text.indexOf('"field"');
  const objectStart = text.lastIndexOf('{', fieldIndex);
  const objectEnd = text.indexOf('}', fieldIndex) + 1;
  const startIndex = Buffer.byteLength(text.slice(0, objectStart), 'utf8');
  const endIndex = Buffer.byteLength(text.slice(0, objectEnd), 'utf8');
  return {
    status: 'completed',
    steps: [{
      type: 'model_output',
      content: [{
        type: 'text',
        text,
        annotations: [{
          type: 'url_citation',
          url,
          title: 'Bitcoin source',
          start_index: startIndex,
          end_index: endIndex,
        }],
      }],
    }],
    usage: {
      total_input_tokens: 100,
      total_output_tokens: 30,
      total_thought_tokens: 10,
      total_tool_use_tokens: 20,
      total_tokens: 160,
      grounding_tool_count: [{ type: 'google_search', count: 1 }],
    },
  };
}

beforeEach(() => {
  resetProviderHealth();
  resetGeminiResearchShadowTelemetry();
});

describe('GeminiResearch server-only shadow transport', () => {
  it('is default-off and requires explicit activation configuration', () => {
    const disabled = loadGeminiResearchShadowConfig(() => '');
    expect(disabled.enabled).toBe(false);
    expect(disabled.ready).toBe(false);
    expect(disabled.apiKey).toBeNull();

    const env: Record<string, string> = {
      GEMINI_RESEARCH_SHADOW_ENABLED: 'true',
      GEMINI_API_KEY: 'secret',
      GEMINI_RESEARCH_MODEL: 'gemini-3.6-flash',
      GEMINI_RESEARCH_INPUT_USD_PER_M: '0.1',
      GEMINI_RESEARCH_OUTPUT_USD_PER_M: '0.2',
      GEMINI_RESEARCH_SEARCH_USD_PER_1K: '14',
      GEMINI_RESEARCH_DAILY_COST_BUDGET_USD: '5',
    };
    const enabled = loadGeminiResearchShadowConfig((key) => env[key] ?? '');
    expect(enabled.enabled).toBe(true);
    expect(enabled.ready).toBe(true);
    expect(enabled.configurationErrors).toEqual([]);
  });

  it('sends a stateless Interactions request and binds claims only to provider citation spans', async () => {
    const telemetry: any[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe(GEMINI_INTERACTIONS_ENDPOINT);
      const headers = init?.headers as Record<string, string>;
      expect(headers['x-goog-api-key']).toBe('server-secret-test-key');
      const body = JSON.parse(String(init?.body));
      expect(body.store).toBe(false);
      expect(body.background).toBe(false);
      expect(body.tools).toEqual([{ type: 'google_search' }, { type: 'url_context' }]);
      expect(body.response_format.schema).toBeTruthy();
      expect(JSON.stringify(body.response_format.schema)).not.toContain('sources');
      return new Response(JSON.stringify(successfulInteraction()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const transport = new GeminiResearchServerTransport(enabledConfig(), {
      fetchImpl: fetchImpl as typeof fetch,
      nowMs: () => Date.parse('2026-08-19T00:00:00.000Z'),
      telemetrySink: (record) => telemetry.push(record),
    });

    const result = await transport.discover(request);
    expect(result.model).toBe('gemini-test-model');
    expect(result.providerCitations).toHaveLength(1);
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].providerCitationIndexes).toEqual([0]);
    expect(telemetry).toHaveLength(1);
    expect(telemetry[0].attributes.shadowMode).toBe(true);
    expect(telemetry[0].attributes.estimatedCostUsd).toBeGreaterThan(0);
    expect(JSON.stringify(telemetry[0])).not.toContain('server-secret-test-key');
    expect(JSON.stringify(telemetry[0])).not.toContain(request.query);
  });

  it('fails closed when provider citations cannot be correlated to the claim span', async () => {
    const payload = successfulInteraction();
    (payload.steps[0].content[0].annotations[0] as any).start_index = undefined;
    (payload.steps[0].content[0].annotations[0] as any).end_index = undefined;
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));
    const transport = new GeminiResearchServerTransport(enabledConfig(), { fetchImpl: fetchImpl as typeof fetch });
    const result = await transport.discover(request);
    expect(result.claims[0].providerCitationIndexes).toEqual([]);
  });

  it('blocks all network calls while the feature flag is off', async () => {
    const fetchImpl = vi.fn();
    const transport = new GeminiResearchServerTransport(enabledConfig({ enabled: false, ready: false }), {
      fetchImpl: fetchImpl as typeof fetch,
    });
    await expect(transport.discover(request)).rejects.toMatchObject({ code: 'FEATURE_DISABLED' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('opens the circuit after the configured provider failure threshold', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 401 }));
    const transport = new GeminiResearchServerTransport(enabledConfig({ circuitFailureThreshold: 1 }), {
      fetchImpl: fetchImpl as typeof fetch,
    });
    await expect(transport.discover(request)).rejects.toMatchObject({ code: 'AUTH_ERROR' });
    await expect(transport.discover(request)).rejects.toMatchObject({ code: 'CIRCUIT_OPEN' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('enforces local RPM and daily cost budgets before additional provider calls', async () => {
    let now = Date.parse('2026-08-19T00:00:00.000Z');
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(successfulInteraction()), { status: 200 }));
    const rateLimited = new GeminiResearchServerTransport(enabledConfig({ requestsPerMinute: 1 }), {
      fetchImpl: fetchImpl as typeof fetch,
      nowMs: () => now,
    });
    await rateLimited.discover(request);
    await expect(rateLimited.discover(request)).rejects.toMatchObject({ code: 'RATE_BUDGET_EXCEEDED' });

    now += 61_000;
    const costLimitedFetch = vi.fn(async () => new Response(JSON.stringify(successfulInteraction()), { status: 200 }));
    const costLimited = new GeminiResearchServerTransport(enabledConfig({
      dailyCostBudgetUsd: 0.000001,
      requestsPerMinute: 10,
    }), {
      fetchImpl: costLimitedFetch as typeof fetch,
      nowMs: () => now,
    });
    await costLimited.discover(request);
    await expect(costLimited.discover(request)).rejects.toMatchObject({ code: 'DAILY_BUDGET_EXCEEDED' });
    expect(costLimitedFetch).toHaveBeenCalledTimes(1);
  });

  it('rests the provider after Free-Tier quota exhaustion and resumes after the quota reset', async () => {
    let now = Date.parse('2026-09-18T06:30:00.000Z');
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response('', { status: 429 });
      return new Response(JSON.stringify(successfulInteraction()), { status: 200 });
    });
    const transport = new GeminiResearchServerTransport(enabledConfig({ requestsPerMinute: 10 }), {
      fetchImpl: fetchImpl as typeof fetch,
      nowMs: () => now,
    });

    await expect(transport.discover(request)).rejects.toMatchObject({ code: 'PROVIDER_RATE_LIMITED' });
    expect(transport.status()).toMatchObject({
      state: 'QUOTA_DORMANT',
      quotaDormantUntil: '2026-09-18T07:00:00.000Z',
    });

    now = Date.parse('2026-09-18T06:59:59.000Z');
    await expect(transport.discover(request)).rejects.toMatchObject({ code: 'FREE_TIER_QUOTA_DORMANT' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    now = Date.parse('2026-09-18T07:00:01.000Z');
    await expect(transport.discover(request)).resolves.toMatchObject({ model: 'gemini-test-model' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(transport.status().quotaDormantUntil).toBeNull();
  });

  it('keeps an audit-safe canonical telemetry ledger when using the default sink', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(successfulInteraction()), { status: 200 }));
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      const transport = new GeminiResearchServerTransport(enabledConfig(), { fetchImpl: fetchImpl as typeof fetch });
      await transport.discover(request);
      const records = getGeminiResearchShadowTelemetry();
      expect(records).toHaveLength(1);
      expect(records[0].eventName).toBe('research.discovery.completed');
      expect(records[0].auditReference).toBe('ADR-0087');
      expect(records[0].attributes?.functionCallingEnabled).toBe(false);
    } finally {
      info.mockRestore();
    }
  });
});
