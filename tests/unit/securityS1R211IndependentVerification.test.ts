import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  EVIDENCE_IDENTITY_FRESHNESS_CONTRACT_VERSION,
  evaluateEvidenceIdentityFreshness,
} from '../../src/platform/MarketData/evidenceIdentityFreshness';

const REQUIRED = {
  assetId: 'asset:equity:US:AAPL',
  providerId: 'provider.alpaca',
  capability: 'quote',
  field: 'last',
} as const;

function evidence(
  overrides: Partial<MarketEvidenceQualityRecord> = {},
): MarketEvidenceQualityRecord {
  return {
    assetId: REQUIRED.assetId,
    providerId: REQUIRED.providerId,
    capability: REQUIRED.capability,
    field: REQUIRED.field,
    observedAt: '2026-09-15T18:00:00.000Z',
    retrievedAt: '2026-09-15T18:00:01.000Z',
    freshness: {
      ageMs: 1_000,
      maxAgeMs: 60_000,
      evaluatedAt: '2026-09-15T18:00:02.000Z',
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: 'evd:security-verification:AAPL:last:20260915T180000Z',
    ...overrides,
  };
}

const WRONG_IDENTITY_CASES: ReadonlyArray<readonly [
  string,
  Partial<MarketEvidenceQualityRecord>,
]> = [
  ['assetId', { assetId: 'asset:equity:US:MSFT' }],
  ['providerId', { providerId: 'provider.other' }],
  ['capability', { capability: 'bars' }],
  ['field', { field: 'close' }],
];

describe('CAPITAL-AI-SEC independent S1-R2-11 verification', () => {
  it('authorizes CURRENT only for fresh verified evidence bound to the exact required identity', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence(),
    });

    expect(result.contractVersion).toBe(EVIDENCE_IDENTITY_FRESHNESS_CONTRACT_VERSION);
    expect(result.state).toBe('CURRENT');
    expect(result.authorizesCurrent).toBe(true);
    expect(result.reason).toBe('identity-bound-fresh-verified-evidence');
  });

  for (const [dimension, mutation] of WRONG_IDENTITY_CASES) {
    it(`rejects wrong immutable identity dimension ${dimension}`, () => {
      const result = evaluateEvidenceIdentityFreshness({
        requiredIdentity: REQUIRED,
        observation: evidence(mutation),
      });

      expect(result.state).toBe('STALE');
      expect(result.authorizesCurrent).toBe(false);
      expect(result.reason).toBe('wrong-identity');
    });
  }

  it('keeps stale evidence non-current even when freshness clocks are rewritten to look fresh', () => {
    const rewritten = evidence({
      qualityStatus: 'STALE',
      freshness: {
        ageMs: 250,
        maxAgeMs: 60_000,
        evaluatedAt: '2026-09-15T18:10:00.000Z',
      },
    });

    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: rewritten,
      priorState: 'STALE',
    });

    expect(result.state).toBe('STALE');
    expect(result.authorizesCurrent).toBe(false);
    expect(result.reason).toBe('stale-or-inadmissible-evidence');
  });

  it('keeps an untrusted refresh fail-closed even when the replacement evidence is otherwise fresh and exact', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({
        qualityStatus: 'STALE',
        freshness: {
          ageMs: 120_000,
          maxAgeMs: 60_000,
          evaluatedAt: '2026-09-15T18:02:00.000Z',
        },
      }),
      priorState: 'STALE',
      refresh: {
        trusted: false,
        observation: evidence({
          observedAt: '2026-09-15T18:05:00.000Z',
          retrievedAt: '2026-09-15T18:05:01.000Z',
          evidenceRef: 'evd:security-verification:AAPL:last:20260915T180500Z',
        }),
      },
    });

    expect(result.state).toBe('STALE_RETRY_REQUIRED');
    expect(result.authorizesCurrent).toBe(false);
    expect(result.reason).toBe('untrusted-or-missing-refresh');
  });

  it('rejects a trusted refresh when the replacement is bound to the wrong immutable identity', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({ qualityStatus: 'STALE' }),
      priorState: 'STALE',
      refresh: {
        trusted: true,
        observation: evidence({ providerId: 'provider.other' }),
      },
    });

    expect(result.state).toBe('STALE');
    expect(result.authorizesCurrent).toBe(false);
    expect(result.reason).toBe('refresh-wrong-identity');
  });

  it('promotes stale state only after a trusted fresh refresh bound to the exact required identity', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({
        qualityStatus: 'STALE',
        freshness: {
          ageMs: 180_000,
          maxAgeMs: 60_000,
          evaluatedAt: '2026-09-15T18:03:00.000Z',
        },
      }),
      priorState: 'STALE',
      refresh: {
        trusted: true,
        observation: evidence({
          observedAt: '2026-09-15T18:05:00.000Z',
          retrievedAt: '2026-09-15T18:05:01.000Z',
          evidenceRef: 'evd:security-verification:AAPL:last:20260915T180500Z',
          freshness: {
            ageMs: 500,
            maxAgeMs: 60_000,
            evaluatedAt: '2026-09-15T18:05:01.500Z',
          },
        }),
      },
    });

    expect(result.state).toBe('CURRENT_AFTER_REFRESH');
    expect(result.authorizesCurrent).toBe(true);
    expect(result.reason).toBe('trusted-refresh-bound-to-required-identity');
  });

  it('requires retry when no observation exists', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: null,
    });

    expect(result.state).toBe('STALE_RETRY_REQUIRED');
    expect(result.authorizesCurrent).toBe(false);
    expect(result.reason).toBe('missing-observation');
  });
});
