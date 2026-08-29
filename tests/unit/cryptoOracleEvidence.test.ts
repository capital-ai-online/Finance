import { describe, expect, it } from 'vitest';
import {
  evaluateCryptoOracleEvidence,
  type CryptoOracleEvidencePolicy,
  type CryptoOracleFeedIdentity,
  type CryptoOracleObservation,
} from '../../src/platform/Scoring/CryptoOracleEvidence';

const NOW = 2_000_000;

const feed: CryptoOracleFeedIdentity = {
  protocolId: 'protocol-a',
  chainId: 'eip155:1',
  oracleId: 'oracle-a',
  feedId: 'eth-usd',
  baseAssetId: 'ETH',
  quoteAssetId: 'USD',
};

const policy: CryptoOracleEvidencePolicy = {
  policyId: 'oracle-policy',
  policyVersion: '1.0.0',
  maxObservationAgeMs: 60_000,
  maxFeedUpdateAgeMs: 30_000,
  maxDeviationBps: 100,
  maxConfidenceBps: 75,
  minIndependentSourceAuthorities: 2,
  fallbackRequirement: 'NOT_REQUIRED',
};

function observation(overrides: Partial<CryptoOracleObservation> = {}): CryptoOracleObservation {
  return {
    ...feed,
    role: 'PRIMARY',
    availability: 'AVAILABLE',
    observedAtMs: NOW - 5_000,
    feedUpdatedAtMs: NOW - 4_000,
    providerId: 'provider-a',
    authorityId: 'oracle-evidence-adapter',
    authorityVersion: '1.0.0',
    sourceAuthorityId: 'source-a',
    sourceAuthorityVersion: '1.0.0',
    deviationBps: 25,
    confidenceBps: 20,
    evidenceRefs: ['evidence:a'],
    ...overrides,
  };
}

function independentObservation(overrides: Partial<CryptoOracleObservation> = {}): CryptoOracleObservation {
  return observation({
    role: 'FALLBACK',
    oracleId: 'oracle-b',
    feedId: 'eth-usd-fallback',
    providerId: 'provider-b',
    sourceAuthorityId: 'source-b',
    evidenceRefs: ['evidence:b'],
    ...overrides,
  });
}

describe('crypto oracle evidence', () => {
  it('passes only with fresh in-policy evidence and independent source authorities', () => {
    const requiredFallback = { ...policy, fallbackRequirement: 'REQUIRED' as const };
    const result = evaluateCryptoOracleEvidence(feed, [observation(), independentObservation()], requiredFallback, NOW);
    expect(result.state).toBe('PASS');
    expect(result.oracleRiskWithinPolicy).toBe(true);
    expect(result.independentSourceAuthorityCount).toBe(2);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('fails closed when evidence is missing, stale as observation, or primary identity-mismatched', () => {
    expect(evaluateCryptoOracleEvidence(feed, undefined, policy, NOW).state).toBe('NOT_COMPUTABLE');

    const staleObservation = observation({ observedAtMs: NOW - policy.maxObservationAgeMs - 1 });
    expect(evaluateCryptoOracleEvidence(feed, [staleObservation], policy, NOW).state).toBe('NOT_COMPUTABLE');

    const wrongFeed = observation({ feedId: 'btc-usd' });
    expect(evaluateCryptoOracleEvidence(feed, [wrongFeed], policy, NOW).state).toBe('NOT_COMPUTABLE');
  });

  it('allows a separately identified fallback only within the same protocol/chain/asset risk identity', () => {
    const requiredFallback = { ...policy, fallbackRequirement: 'REQUIRED' as const };
    const valid = evaluateCryptoOracleEvidence(feed, [observation(), independentObservation()], requiredFallback, NOW);
    expect(valid.state).toBe('PASS');

    const wrongAssetFallback = independentObservation({ baseAssetId: 'BTC' });
    const invalid = evaluateCryptoOracleEvidence(feed, [observation(), wrongAssetFallback], requiredFallback, NOW);
    expect(invalid.state).toBe('NOT_COMPUTABLE');
  });

  it('blocks a stale primary feed even when the observation itself is fresh', () => {
    const staleFeed = observation({ feedUpdatedAtMs: NOW - policy.maxFeedUpdateAgeMs - 1 });
    const result = evaluateCryptoOracleEvidence(feed, [staleFeed], { ...policy, minIndependentSourceAuthorities: 1 }, NOW);
    expect(result.state).toBe('BLOCKED');
    expect(result.oracleRiskWithinPolicy).toBe(false);
  });

  it('blocks unavailable, excessive-deviation, and excessive-confidence primary observations', () => {
    const singleSourcePolicy = { ...policy, minIndependentSourceAuthorities: 1 };
    const unavailable = evaluateCryptoOracleEvidence(
      feed,
      [observation({ availability: 'UNAVAILABLE' })],
      singleSourcePolicy,
      NOW,
    );
    expect(unavailable.state).toBe('BLOCKED');

    const deviation = evaluateCryptoOracleEvidence(
      feed,
      [observation({ deviationBps: policy.maxDeviationBps + 1 })],
      singleSourcePolicy,
      NOW,
    );
    expect(deviation.state).toBe('BLOCKED');

    const confidence = evaluateCryptoOracleEvidence(
      feed,
      [observation({ confidenceBps: policy.maxConfidenceBps + 1 })],
      singleSourcePolicy,
      NOW,
    );
    expect(confidence.state).toBe('BLOCKED');
  });

  it('does not invent PASS from missing quality metrics or insufficient independence', () => {
    const missingMetric = evaluateCryptoOracleEvidence(
      feed,
      [observation({ confidenceBps: null })],
      { ...policy, minIndependentSourceAuthorities: 1 },
      NOW,
    );
    expect(missingMetric.state).toBe('NOT_COMPUTABLE');

    const secondPrimarySameSource = observation({
      providerId: 'provider-b',
      authorityId: 'oracle-evidence-adapter-b',
      sourceAuthorityId: 'source-a',
      evidenceRefs: ['evidence:b'],
    });
    const insufficient = evaluateCryptoOracleEvidence(feed, [observation(), secondPrimarySameSource], policy, NOW);
    expect(insufficient.state).toBe('NOT_COMPUTABLE');
    expect(insufficient.independentSourceAuthorityCount).toBe(1);
  });

  it('requires fallback evidence when the policy explicitly requires it', () => {
    const requiredFallback = { ...policy, minIndependentSourceAuthorities: 1, fallbackRequirement: 'REQUIRED' as const };
    const missingFallback = evaluateCryptoOracleEvidence(feed, [observation()], requiredFallback, NOW);
    expect(missingFallback.state).toBe('NOT_COMPUTABLE');

    const withFallback = evaluateCryptoOracleEvidence(feed, [observation(), independentObservation()], requiredFallback, NOW);
    expect(withFallback.state).toBe('PASS');
  });

  it('does not allow required fallback evidence to mask a stale primary feed', () => {
    const requiredFallback = { ...policy, fallbackRequirement: 'REQUIRED' as const };
    const result = evaluateCryptoOracleEvidence(
      feed,
      [
        observation({ feedUpdatedAtMs: NOW - policy.maxFeedUpdateAgeMs - 1 }),
        independentObservation(),
      ],
      requiredFallback,
      NOW,
    );
    expect(result.state).toBe('BLOCKED');
  });

  it('does not let an optional fallback affect primary-only gate semantics', () => {
    const primaryOnlyPolicy = { ...policy, minIndependentSourceAuthorities: 1 };
    const unhealthyOptionalFallback = independentObservation({ availability: 'UNAVAILABLE' });
    const result = evaluateCryptoOracleEvidence(
      feed,
      [observation(), unhealthyOptionalFallback],
      primaryOnlyPolicy,
      NOW,
    );
    expect(result.state).toBe('PASS');
    expect(result.acceptedObservationCount).toBe(1);
  });
});
