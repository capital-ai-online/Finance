import { beforeEach, describe, expect, it } from 'vitest';
import { CryptoOrchestrator } from '../../src/orchestrator/cryptoOrchestrator';
import {
  ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
} from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchScorer';
import { altcoinPatternResearchProjectionStore } from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchProjectionStore';

function resolution(
  assetId: string,
  patternId: string,
  timeframe = '4h',
  direction: 'BULLISH' | 'BEARISH' = 'BULLISH',
) {
  return {
    resolverVersion: 'fintech-core.crypto/pattern-signal-resolver/0.1.0',
    disposition: 'SUPPORTED_CONTEXT',
    direction,
    primary: {
      evidence: {
        assetId,
        patternId,
        timeframe,
        direction,
        evidenceRefs: ['ohlcv:verified:1'],
      },
      reliability: {
        evidenceRefs: ['backtest:asset-timeframe-regime:1'],
      },
      timeframeMinutes: timeframe === '1d' ? 1440 : 240,
    },
    supporting: [],
    suppressed: [],
    rejected: [],
    reasons: [],
    scoreEligible: false,
    executionEligible: false,
    authority: 'RESEARCH_CONTEXT_ONLY',
  } as any;
}

describe('altcoin pattern research backend view wiring', () => {
  beforeEach(() => {
    altcoinPatternResearchProjectionStore.clear();
  });

  it('publishes an attested 4h assessment with provenance and no authority escalation', () => {
    const orchestrator = new CryptoOrchestrator(null);
    const assessment = orchestrator.analyzeAltcoinPatternResearch({
      resolution: resolution('crypto:ETH', 'inverse-head-and-shoulders'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'inverse-head-and-shoulders',
        timeframe: '4h',
        observedAt: '2026-09-20T08:00:00.000Z',
        evidenceRefs: ['indicator:evidence:eth:1'],
        volumeBreakoutRatio: 1.4,
        rsi14CrossAbove50: true,
        priceNearMajorSupport: true,
      },
    }, {
      symbol: 'ETH',
      correlationId: 'pattern-read:eth:4h:1',
      publishedAt: '2026-09-20T08:00:01.000Z',
    });

    expect(assessment.status).toBe('READY');
    const projection = altcoinPatternResearchProjectionStore.read('crypto:ETH', '4h');
    expect(projection).not.toBeNull();
    expect(projection).toMatchObject({
      assetId: 'crypto:ETH',
      symbol: 'ETH',
      timeframe: '4h',
      observedAt: '2026-09-20T08:00:00.000Z',
      correlationId: 'pattern-read:eth:4h:1',
      scoreEligible: false,
      executionEligible: false,
      canonicalScoreImpact: 'NONE',
      authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE',
    });
    expect(projection?.assessment).toBe(assessment);
    expect(projection?.evidenceRefs).toEqual([
      'ohlcv:verified:1',
      'backtest:asset-timeframe-regime:1',
      'indicator:evidence:eth:1',
    ]);
  });

  it('preserves upstream provenance even when the reference scorer remains NOT_COMPUTABLE', () => {
    const orchestrator = new CryptoOrchestrator(null);
    const assessment = orchestrator.analyzeAltcoinPatternResearch({
      resolution: resolution('crypto:ETH', 'flag'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'flag',
        timeframe: '4h',
        observedAt: '2026-09-20T08:00:00.000Z',
        evidenceRefs: ['indicator:evidence:eth:catalog-only'],
      },
    }, {
      symbol: 'ETH',
      correlationId: 'pattern-read:eth:not-computable',
      publishedAt: '2026-09-20T08:00:01.000Z',
    });

    expect(assessment.status).toBe('NOT_COMPUTABLE');
    expect(assessment.evidenceRefs).toEqual([]);
    expect(altcoinPatternResearchProjectionStore.read('crypto:ETH', '4h')?.evidenceRefs).toEqual([
      'ohlcv:verified:1',
      'backtest:asset-timeframe-regime:1',
      'indicator:evidence:eth:catalog-only',
    ]);
  });

  it('rejects a view context whose symbol does not match the resolved UAI asset identity', () => {
    const orchestrator = new CryptoOrchestrator(null);
    expect(() => orchestrator.analyzeAltcoinPatternResearch({
      resolution: resolution('crypto:ETH', 'double-bottom'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'double-bottom',
        timeframe: '4h',
        observedAt: '2026-09-20T08:00:00.000Z',
        evidenceRefs: ['indicator:evidence:eth:2'],
        volumeSecondLowLower: true,
        macdHistogramTurnPositive: true,
      },
    }, {
      symbol: 'SOL',
      correlationId: 'pattern-read:mismatch',
    })).toThrow('ALTCOIN_PATTERN_VIEW_PRIMARY_ASSET_MISMATCH');

    expect(altcoinPatternResearchProjectionStore.read('crypto:SOL', '4h')).toBeNull();
  });

  it('does not publish unsupported timeframe projections into the 4h/1d read model', () => {
    const orchestrator = new CryptoOrchestrator(null);
    expect(() => orchestrator.analyzeAltcoinPatternResearch({
      resolution: resolution('crypto:ETH', 'double-bottom', '1h'),
      confirmation: {
        contractVersion: ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION,
        patternId: 'double-bottom',
        timeframe: '1h',
        observedAt: '2026-09-20T08:00:00.000Z',
        evidenceRefs: ['indicator:evidence:eth:3'],
      },
    }, {
      symbol: 'ETH',
      correlationId: 'pattern-read:unsupported',
    })).toThrow('ALTCOIN_PATTERN_VIEW_UNSUPPORTED_TIMEFRAME');

    expect(altcoinPatternResearchProjectionStore.read('crypto:ETH', '4h')).toBeNull();
    expect(altcoinPatternResearchProjectionStore.read('crypto:ETH', '1d')).toBeNull();
  });
});
