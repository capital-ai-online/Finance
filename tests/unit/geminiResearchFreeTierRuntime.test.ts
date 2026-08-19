import { describe, expect, it } from 'vitest';
import {
  GEMINI_RESEARCH_FREE_TIER_LOCAL_DAILY_REQUEST_CAP,
  GEMINI_RESEARCH_FREE_TIER_MODEL,
  createGeminiResearchFreeTierRuntime,
} from '../../server/researchEvidence/geminiResearchFreeTierRuntime';

function resolver(values: Record<string, string>): (key: string) => string {
  return (key) => values[key] ?? '';
}

describe('Gemini research free-tier-only runtime', () => {
  it('remains disabled by default and pins the verified Free-Tier model', () => {
    const runtime = createGeminiResearchFreeTierRuntime({ resolve: resolver({}) });

    expect(runtime.config.enabled).toBe(false);
    expect(runtime.config.ready).toBe(false);
    expect(runtime.transport).toBeNull();
    expect(runtime.config.model).toBe(GEMINI_RESEARCH_FREE_TIER_MODEL);
    expect(runtime.freeTierPolicy.freeTierOnly).toBe(true);
    expect(runtime.freeTierPolicy.paidBillingPermitted).toBe(false);
  });

  it('fails closed when enabled without Free-Tier billing attestation', () => {
    const runtime = createGeminiResearchFreeTierRuntime({
      resolve: resolver({
        GEMINI_RESEARCH_SHADOW_ENABLED: 'true',
        GEMINI_RESEARCH_FREE_TIER_ONLY: 'true',
        GEMINI_API_KEY: 'free-tier-test-key',
      }),
    });

    expect(runtime.config.enabled).toBe(true);
    expect(runtime.config.ready).toBe(false);
    expect(runtime.transport).toBeNull();
    expect(runtime.config.configurationErrors.join(' ')).toContain('GEMINI_RESEARCH_FREE_TIER_ATTESTED=true');
  });

  it('rejects any explicit attempt to permit paid Gemini mode', () => {
    const runtime = createGeminiResearchFreeTierRuntime({
      resolve: resolver({
        GEMINI_RESEARCH_SHADOW_ENABLED: 'true',
        GEMINI_RESEARCH_FREE_TIER_ONLY: 'false',
        GEMINI_RESEARCH_FREE_TIER_ATTESTED: 'true',
        GEMINI_API_KEY: 'free-tier-test-key',
      }),
    });

    expect(runtime.config.ready).toBe(false);
    expect(runtime.transport).toBeNull();
    expect(runtime.config.configurationErrors.join(' ')).toContain('paid Gemini research mode is forbidden');
  });

  it('forces zero local unit prices and ignores paid/model configuration overrides', () => {
    const runtime = createGeminiResearchFreeTierRuntime({
      resolve: resolver({
        GEMINI_RESEARCH_SHADOW_ENABLED: 'true',
        GEMINI_RESEARCH_FREE_TIER_ONLY: 'true',
        GEMINI_RESEARCH_FREE_TIER_ATTESTED: 'true',
        GEMINI_API_KEY: 'free-tier-test-key',
        GEMINI_RESEARCH_MODEL: 'gemini-pro-latest',
        GEMINI_RESEARCH_INPUT_USD_PER_M: '999',
        GEMINI_RESEARCH_OUTPUT_USD_PER_M: '999',
        GEMINI_RESEARCH_SEARCH_USD_PER_1K: '999',
        GEMINI_RESEARCH_DAILY_COST_BUDGET_USD: '999',
      }),
    });

    expect(runtime.config.ready).toBe(true);
    expect(runtime.transport).not.toBeNull();
    expect(runtime.config.model).toBe(GEMINI_RESEARCH_FREE_TIER_MODEL);
    expect(runtime.config.inputUsdPerMillionTokens).toBe(0);
    expect(runtime.config.outputUsdPerMillionTokens).toBe(0);
    expect(runtime.config.googleSearchUsdPerThousandRequests).toBe(0);
    expect(runtime.freeTierPolicy.paidBillingPermitted).toBe(false);
  });

  it('caps local daily requests below the documented Free-Tier Search quota', () => {
    const runtime = createGeminiResearchFreeTierRuntime({
      resolve: resolver({
        GEMINI_RESEARCH_SHADOW_ENABLED: 'true',
        GEMINI_RESEARCH_FREE_TIER_ONLY: 'true',
        GEMINI_RESEARCH_FREE_TIER_ATTESTED: 'true',
        GEMINI_API_KEY: 'free-tier-test-key',
        GEMINI_RESEARCH_DAILY_REQUEST_BUDGET: '10000',
      }),
    });

    expect(runtime.config.dailyRequestBudget).toBe(GEMINI_RESEARCH_FREE_TIER_LOCAL_DAILY_REQUEST_CAP);
    expect(runtime.freeTierPolicy.documentedSearchRpd).toBe(500);
    expect(runtime.config.dailyRequestBudget).toBeLessThan(runtime.freeTierPolicy.documentedSearchRpd);
  });
});
