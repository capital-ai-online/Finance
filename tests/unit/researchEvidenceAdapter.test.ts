import { describe, expect, it } from 'vitest';
import { UNIVERSAL_ASSET_CONTRACT_VERSION, type UniversalAssetIdentity } from '../../src/platform/Scoring/contracts';
import {
  GeminiResearchEvidenceAdapter,
  GEMINI_RESEARCH_MAX_URLS,
  type GeminiResearchTransport,
  type GeminiResearchTransportRequest,
} from '../../src/platform/ResearchEvidence/GeminiResearchEvidenceAdapter';
import {
  validateResearchEvidenceDiscovery,
  validatePublicResearchUrl,
} from '../../src/platform/ResearchEvidence/sourcePolicy';
import type { ResearchEvidenceSourcePolicy } from '../../src/platform/ResearchEvidence/contracts';

const asset: UniversalAssetIdentity = {
  contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
  assetId: 'stock:AAPL',
  symbol: 'AAPL',
  assetClass: 'stock',
  name: 'Apple Inc.',
  source: 'request',
};

function request(overrides: Partial<Parameters<GeminiResearchEvidenceAdapter['discover']>[0]> = {}) {
  return {
    asset,
    correlationId: 'corr-research-1',
    fields: ['revenue'],
    query: 'Find the latest official revenue evidence for Apple.',
    ...overrides,
  };
}

function transportWith(
  response: Awaited<ReturnType<GeminiResearchTransport['discover']>>,
  capture?: (req: GeminiResearchTransportRequest) => void,
): GeminiResearchTransport {
  return {
    async discover(req) {
      capture?.(req);
      return response;
    },
  };
}

describe('GeminiResearchEvidenceAdapter dormant re-entry boundary', () => {
  it('maps provider-cited structured claims to non-score-bearing evidence discoveries', async () => {
    let captured: GeminiResearchTransportRequest | undefined;
    const adapter = new GeminiResearchEvidenceAdapter(
      transportWith({
        model: 'gemini-test-model',
        providerCitations: [{
          url: 'https://www.sec.gov/Archives/edgar/data/320193/example.htm',
          title: 'Apple filing',
          startIndex: 20,
          endIndex: 80,
        }],
        claims: [{
          field: 'revenue',
          value: 123.45,
          unit: 'USD billion',
          observedAt: '2026-06-30T00:00:00.000Z',
          extractionConfidence: 0.92,
          providerCitationIndexes: [0],
        }],
      }, (req) => { captured = req; }),
      () => new Date('2026-08-19T00:00:00.000Z'),
    );

    const result = await adapter.discover(request());

    expect(result.status).toBe('DISCOVERED');
    expect(result.discoveries).toHaveLength(1);
    expect(result.discoveries[0]).toMatchObject({
      status: 'AI_DISCOVERED_EVIDENCE',
      scoreEligible: false,
      source: {
        hostname: 'www.sec.gov',
        sourceClass: 'unknown',
      },
      citation: {
        startIndex: 20,
        endIndex: 80,
      },
      claim: {
        field: 'revenue',
        value: 123.45,
      },
    });
    expect(result.discoveries[0].discoveryId).toBe('corr-research-1:gemini:0:0');
    expect(adapter.descriptor.enabledByDefault).toBe(false);
    expect(adapter.descriptor.functionCallingEnabled).toBe(false);
    expect(captured?.tools).toEqual(['google_search']);
    expect(captured?.functionCallingEnabled).toBe(false);
    expect(JSON.stringify(captured?.responseSchema)).not.toContain('sources');
  });

  it('enables URL context only for explicitly supplied public URLs', async () => {
    let captured: GeminiResearchTransportRequest | undefined;
    const adapter = new GeminiResearchEvidenceAdapter(
      transportWith({
        model: 'gemini-test-model',
        providerCitations: [],
        claims: [],
      }, (req) => { captured = req; }),
    );

    await adapter.discover(request({ urls: ['https://www.apple.com/newsroom/'] }));

    expect(captured?.tools).toEqual(['google_search', 'url_context']);
    expect(captured?.urls).toEqual(['https://www.apple.com/newsroom/']);
  });

  it('fails closed on claims without provider-owned citation binding', async () => {
    const adapter = new GeminiResearchEvidenceAdapter(transportWith({
      model: 'gemini-test-model',
      providerCitations: [{ url: 'https://www.sec.gov/Archives/example.htm' }],
      claims: [{ field: 'revenue', value: 123, providerCitationIndexes: [99] }],
    }));

    const result = await adapter.discover(request());

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.discoveries).toEqual([]);
    expect(result.diagnostics.join(' ')).toContain('no valid provider citation binding');
  });

  it('rejects private/non-HTTPS input URLs before a provider transport is called', async () => {
    let called = false;
    const adapter = new GeminiResearchEvidenceAdapter({
      async discover() {
        called = true;
        throw new Error('must not be reached');
      },
    });

    const result = await adapter.discover(request({ urls: ['http://localhost:3000/secrets'] }));

    expect(result.status).toBe('REJECTED');
    expect(called).toBe(false);
    expect(validatePublicResearchUrl('https://127.0.0.1/test').ok).toBe(false);
    expect(validatePublicResearchUrl('https://example.com/test').ok).toBe(true);
  });

  it('enforces the URL-context request cap at the provider-neutral boundary', async () => {
    let called = false;
    const adapter = new GeminiResearchEvidenceAdapter({
      async discover() {
        called = true;
        return { model: 'unused', providerCitations: [], claims: [] };
      },
    });
    const urls = Array.from({ length: GEMINI_RESEARCH_MAX_URLS + 1 }, (_, i) => `https://example${i}.com/data`);

    const result = await adapter.discover(request({ urls }));

    expect(result.status).toBe('REJECTED');
    expect(called).toBe(false);
  });

  it('can validate an approved primary source without making it score-eligible', async () => {
    const adapter = new GeminiResearchEvidenceAdapter(transportWith({
      model: 'gemini-test-model',
      providerCitations: [{ url: 'https://www.sec.gov/Archives/example.htm', title: 'SEC filing' }],
      claims: [{ field: 'revenue', value: 123, providerCitationIndexes: [0] }],
    }));
    const discoveryResult = await adapter.discover(request());
    const discovery = discoveryResult.discoveries[0];
    const policy: ResearchEvidenceSourcePolicy = {
      policyVersion: 'test-policy/1.0.0',
      entries: [{
        hostname: 'sec.gov',
        includeSubdomains: true,
        sourceClass: 'regulated-primary',
        allowedUses: ['research', 'extraction', 'scoring-evidence-after-validation'],
      }],
    };

    const validation = validateResearchEvidenceDiscovery(
      discovery,
      policy,
      new Date('2026-08-19T00:01:00.000Z'),
    );

    expect(validation.discoveryId).toBe(discovery.discoveryId);
    expect(validation.status).toBe('VALIDATED_PRIMARY_SOURCE');
    expect(validation.sourceClass).toBe('regulated-primary');
    expect(validation.allowedUses).toContain('scoring-evidence-after-validation');
    expect(validation.scoreEligible).toBe(false);
  });

  it('keeps unknown sources research-only and rejects citation/source mismatches', async () => {
    const adapter = new GeminiResearchEvidenceAdapter(transportWith({
      model: 'gemini-test-model',
      providerCitations: [{ url: 'https://example.com/article' }],
      claims: [{ field: 'revenue', value: 'reported value', providerCitationIndexes: [0] }],
    }));
    const discoveryResult = await adapter.discover(request());
    const discovery = discoveryResult.discoveries[0];

    const researchOnly = validateResearchEvidenceDiscovery(discovery);
    expect(researchOnly.status).toBe('RESEARCH_ONLY');
    expect(researchOnly.scoreEligible).toBe(false);

    const mismatched = {
      ...discovery,
      citation: { ...discovery.citation, url: 'https://other.example.com/source' },
    };
    const rejected = validateResearchEvidenceDiscovery(mismatched);
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.scoreEligible).toBe(false);
  });
});
