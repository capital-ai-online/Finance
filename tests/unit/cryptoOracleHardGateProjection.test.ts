import { describe, expect, it } from 'vitest';
import { projectDefiOracleRiskHardGate } from '../../src/platform/Scoring/CryptoOracleHardGateProjection';
import type { CryptoOracleEvidenceEvaluation } from '../../src/platform/Scoring/CryptoOracleEvidence';

function evaluation(
  state: 'PASS' | 'BLOCKED' | 'NOT_COMPUTABLE',
  oracleRiskWithinPolicy: boolean | null,
): CryptoOracleEvidenceEvaluation {
  return {
    contractVersion: 'crypto-oracle-evidence/0.1.0',
    feed: {
      protocolId: 'protocol-a',
      chainId: 'eip155:1',
      oracleId: 'oracle-a',
      feedId: 'eth-usd',
      baseAssetId: 'ETH',
      quoteAssetId: 'USD',
    },
    state,
    oracleRiskWithinPolicy,
    acceptedObservationCount: 2,
    independentSourceAuthorityCount: 2,
    authorityIds: ['adapter@1.0.0'],
    sourceAuthorityIds: ['source-a@1.0.0', 'source-b@1.0.0'],
    evidenceRefs: ['evidence:a', 'evidence:b'],
    reason: `state=${state}`,
    scoreEligible: false,
    executionEligible: false,
    authority: 'RESEARCH_EVIDENCE_ONLY',
  };
}

describe('crypto oracle hard-gate projection', () => {
  it('fails closed without computable oracle evidence', () => {
    expect(projectDefiOracleRiskHardGate(undefined).state).toBe('NOT_COMPUTABLE');
    expect(projectDefiOracleRiskHardGate(evaluation('NOT_COMPUTABLE', null)).state).toBe('NOT_COMPUTABLE');
  });

  it('maps blocked oracle evidence to the existing defi gate', () => {
    const gate = projectDefiOracleRiskHardGate(evaluation('BLOCKED', false));
    expect(gate.key).toBe('oracleRiskWithinPolicy');
    expect(gate.state).toBe('BLOCKED');
    expect(gate.sourcePath).toBe('oracleEvidence.oracleRiskWithinPolicy');
  });

  it('passes only an explicit in-policy oracle evaluation', () => {
    const gate = projectDefiOracleRiskHardGate(evaluation('PASS', true));
    expect(gate.key).toBe('oracleRiskWithinPolicy');
    expect(gate.state).toBe('PASS');
  });
});
