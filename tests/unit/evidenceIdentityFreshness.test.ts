import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  EVIDENCE_IDENTITY_FRESHNESS_CONTRACT_VERSION,
  evaluateEvidenceIdentityFreshness,
  identitiesMatch,
  isCurrentAuthorizingState,
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
    observedAt: '2026-09-07T07:00:00.000Z',
    retrievedAt: '2026-09-07T07:00:01.000Z',
    freshness: {
      ageMs: 1_000,
      maxAgeMs: 60_000,
      evaluatedAt: '2026-09-07T07:00:02.000Z',
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: 'evd:alpaca:AAPL:last:20260907T070000Z',
    ...overrides,
  };
}

describe('S1-R2-11 evidence identity freshness', () => {
  it('authorizes CURRENT only for identity-bound fresh verified evidence', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence(),
    });

    expect(result.contractVersion).toBe(EVIDENCE_IDENTITY_FRESHNESS_CONTRACT_VERSION);
    expect(result.state).toBe('CURRENT');
    expect(result.authorizesCurrent).toBe(true);
    expect(isCurrentAuthorizingState(result.state)).toBe(true);
  });

  it('treats wrong-identity evidence as STALE and never current', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({ assetId: 'asset:equity:US:MSFT' }),
    });

    expect(identitiesMatch(REQUIRED, evidence({ assetId: 'asset:equity:US:MSFT' }))).toBe(false);
    expect(result.state).toBe('STALE');
    expect(result.authorizesCurrent).toBe(false);
    expect(result.reason).toBe('wrong-identity');
  });

  it('does not let a stale record self-authorize CURRENT by rewriting freshness labels', () => {
    const stale = evidence({
      qualityStatus: 'STALE',
      freshness: {
        ageMs: 120_000,
        maxAgeMs: 60_000,
        evaluatedAt: '2026-09-07T07:00:02.000Z',
      },
    });
    const rewrittenClock = evidence({
      ...stale,
      freshness: {
        ageMs: 1_000,
        maxAgeMs: 60_000,
        evaluatedAt: '2026-09-07T08:00:00.000Z',
      },
    });

    const withoutRefresh = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: rewrittenClock,
      priorState: 'STALE',
    });

    expect(withoutRefresh.state).toBe('STALE');
    expect(withoutRefresh.authorizesCurrent).toBe(false);
  });

  it('promotes only after a trusted refresh bound to the required immutable identity', () => {
    const stale = evidence({
      qualityStatus: 'STALE',
      freshness: {
        ageMs: 180_000,
        maxAgeMs: 60_000,
        evaluatedAt: '2026-09-07T07:03:00.000Z',
      },
    });
    const refreshed = evidence({
      observedAt: '2026-09-07T07:05:00.000Z',
      retrievedAt: '2026-09-07T07:05:01.000Z',
      evidenceRef: 'evd:alpaca:AAPL:last:20260907T070500Z',
      freshness: {
        ageMs: 500,
        maxAgeMs: 60_000,
        evaluatedAt: '2026-09-07T07:05:01.500Z',
      },
    });

    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: stale,
      priorState: 'STALE',
      refresh: { trusted: true, observation: refreshed },
    });

    expect(result.state).toBe('CURRENT_AFTER_REFRESH');
    expect(result.authorizesCurrent).toBe(true);
  });

  it('keeps STALE_RETRY_REQUIRED when refresh is missing, untrusted or incomplete', () => {
    expect(evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: null,
    }).state).toBe('STALE_RETRY_REQUIRED');

    expect(evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({ qualityStatus: 'STALE' }),
      priorState: 'STALE',
      refresh: { trusted: false, observation: evidence() },
    }).state).toBe('STALE_RETRY_REQUIRED');

    expect(evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({ qualityStatus: 'STALE' }),
      priorState: 'STALE',
      refresh: { trusted: true, observation: null },
    }).state).toBe('STALE_RETRY_REQUIRED');

    expect(evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({ qualityStatus: 'UNAVAILABLE', observedAt: null, evidenceRef: null }),
    }).state).toBe('STALE_RETRY_REQUIRED');
  });

  it('rejects a trusted refresh that is bound to the wrong identity', () => {
    const result = evaluateEvidenceIdentityFreshness({
      requiredIdentity: REQUIRED,
      observation: evidence({ qualityStatus: 'STALE' }),
      priorState: 'STALE',
      refresh: {
        trusted: true,
        observation: evidence({ assetId: 'asset:equity:US:MSFT' }),
      },
    });

    expect(result.state).toBe('STALE');
    expect(result.authorizesCurrent).toBe(false);
    expect(result.reason).toBe('refresh-wrong-identity');
  });
});
