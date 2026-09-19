import { describe, expect, it } from 'vitest';
import {
  buildAltcoinPatternResearchViewEnvelope,
  createAltcoinPatternResearchViewProjection,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchViewContract';
import type { AltcoinPatternResearchScoreAssessment } from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchScorer';
import { fetchAltcoinPatternResearchView } from '../../src/features/crypto/ui/cryptoPatternTrooperClient';

function assessment(): AltcoinPatternResearchScoreAssessment {
  return {
    scorerVersion: 'fintech-core.crypto/altcoin-pattern-research-scorer/0.1.0',
    profileVersion: 'fintech-core.crypto/altcoin-pattern-reference-profile/0.1.0',
    status: 'READY',
    patternId: 'double-bottom',
    timeframe: '1d',
    direction: 'BULLISH',
    referenceBaseScore: 82,
    referenceScore: 95,
    referenceThreshold: 75,
    referenceThresholdMet: true,
    contributions: [
      {
        feature: 'volumeSecondLowLower',
        observedValue: true,
        condition: 'true',
        met: true,
        contribution: 6,
      },
      {
        feature: 'macdHistogramTurnPositive',
        observedValue: true,
        condition: 'true',
        met: true,
        contribution: 7,
      },
    ],
    missingConfirmationFields: [],
    evidenceRefs: ['ohlcv:1', 'backtest:1', 'indicator:1'],
    reasons: ['research-only'],
    scoreEligible: false,
    executionEligible: false,
    canonicalScoreImpact: 'NONE',
    authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE',
  };
}

function envelope() {
  const projection = createAltcoinPatternResearchViewProjection({
    assetId: 'crypto:ETH',
    symbol: 'ETH',
    timeframe: '1d',
    observedAt: '2026-09-20T08:00:00.000Z',
    publishedAt: '2026-09-20T08:00:01.000Z',
    correlationId: 'source-correlation:1',
    assessment: assessment(),
  });
  return buildAltcoinPatternResearchViewEnvelope({
    assetId: 'crypto:ETH',
    symbol: 'ETH',
    readCorrelationId: 'read-correlation:1',
    lanes: { '4h': null, '1d': projection },
  });
}

describe('Crypto Pattern Trooper read client', () => {
  it('uses GET only and accepts the attested FINTECH view envelope without recalculating values', async () => {
    const expected = envelope();
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ input: String(input), init });
      return new Response(JSON.stringify(expected), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const result = await fetchAltcoinPatternResearchView('eth', fakeFetch);
    expect(calls).toHaveLength(1);
    expect(calls[0].input).toBe('/api/crypto/evidence/pattern-research/ETH');
    expect(calls[0].init?.method).toBe('GET');
    expect(calls[0].init?.body).toBeUndefined();
    expect(result?.lanes['1d']?.assessment.referenceScore).toBe(95);
    expect(result?.lanes['1d']?.evidenceRefs).toEqual(['ohlcv:1', 'backtest:1', 'indicator:1']);
    expect(result?.scoreEligible).toBe(false);
    expect(result?.executionEligible).toBe(false);
  });

  it('fails closed when a response attempts to escalate research authority', async () => {
    const unsafe = {
      ...envelope(),
      scoreEligible: true,
    };
    const fakeFetch = (async () => new Response(JSON.stringify(unsafe), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

    await expect(fetchAltcoinPatternResearchView('ETH', fakeFetch)).resolves.toBeNull();
  });

  it('does not send a request for an invalid symbol', async () => {
    let called = false;
    const fakeFetch = (async () => {
      called = true;
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    await expect(fetchAltcoinPatternResearchView('../ETH', fakeFetch)).resolves.toBeNull();
    expect(called).toBe(false);
  });
});
