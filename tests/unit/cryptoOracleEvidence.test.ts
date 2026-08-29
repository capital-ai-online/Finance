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
    providerId: 'provider-b',
    sourceAuthorityId: 'source-b',
    evidenceRefs: ['evidence:b'],
    ...overrides,
  });
}

describe('crypto oracle evidence', () => {
  it('passes only with fresh in-policy evidence and independent source authorities', () => {
    const result = evaluateCryptoOracleEvidence(feed, [observation(), independentObservation()], policy, NOW);
    expect(result.state).toBe('PASS');
    expect(result.oracleRiskWithinPolicy).toBe(true);
    expect(result.independentSourceAuthorityCount).toBe(2);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('fails closed when evidence is missing, stale as observation, or identity-mismatched', () => {
    expect(evaluateCryptoOracleEvidence(feed, undefined, policy, NOW).state).toBe('NOT_COMPUTABLE');

    const staleObservation = observation({ observedAtMs: NOW - policy.maxObservationAgeMs - 1 });
    expect(evaluateCryptoOracleEvidence(feed, [staleObservation], policy, NOW).state).toBe('NOT_COMPUTABLE');

    const wrongFeed = observation({ feedId: 'btc-usd' });
    expect(evaluateCryptoOracleEvidence(feed, [wrongFeed], policy, NOW).state).toBe('NOT_COMPUTABLE');
  });

  it('blocks a stale feed even when the observation itself is fresh', () => {
    const staleFeed = observation({ feedUpdatedAtMs: NOW - policy.maxFeedUpdateAgeMs - 1 });
    const result = evaluateCryptoOracleEvidence(feed, [staleFeed, independentObservation()], policy, NOW);
    expect(result.state).toBe('BLOCKED');
    expect(result.oracleRiskWithinPolicy).toBe(false);
  });

  it('blocks unavailable, excessive-deviation, and excessive-confidence observations', () => {
    const unavailable = evaluateCryptoOracleEvidence(
      feed,
      [observation({ availability: 'UNAVAILABLE' }), independentObservation()],
      policy,
      NOW,
    );
    expect(unavailable.state).toBe('BLOCKED');

    const deviation = evaluateCryptoOracleEvidence(
      feed,
      [observation({ deviationBps: policy.maxDeviationBps + 1 }), independentObservation()],
      policy,
      NOW,
    );
    expect(deviation.state).toBe('BLOCKED');

    const confidence = evaluateCryptoOracleEvidence(
      feed,
      [observation({ confidenceBps: policy.maxConfidenceBps + 1 }), independentObservation()],
      policy,
      NOW,
    );
    expect(confidence.state).toBe('BLOCKED');
  });

  it('does not invent PASS from missing quality metrics or insufficient independence', () => {
    const missingMetric = evaluateCryptoOracleEvidence(
      feed,
      [observation({ confidenceBps: null }), independentObservation()],
      policy,
      NOW,
    );
    expect(missingMetric.state).toBe('NOT_COMPUTABLE');

    const sameSource = independentObservation({ sourceAuthorityId: 'source-a' });
    const insufficient = evaluateCryptoOracleEvidence(feed, [observation(), sameSource], policy, NOW);
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

  it('does not allow fallback evidence to mask a stale primary feed', () => {
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
});
