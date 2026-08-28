import { describe, expect, it } from 'vitest';
import type { GoPlusTradeSimulationEvidence } from '../../src/platform/MarketData/providers/GoPlusTransactionSimulationProvider';
import {
  CRYPTO_MEME_HONEYPOT_SIMULATION_ADMISSION_VERSION,
  admitMemeHoneypotSimulationEvidence,
  evaluateHoneypotSimulationValidation,
  type CryptoMemeHoneypotSimulationAdmissionPolicy,
  type HoneypotSimulationValidationCase,
} from '../../src/platform/FinTechCore/Modules/Crypto/Validation/HoneypotSimulationValidation';

const TOKEN = '0x1111111111111111111111111111111111111111';
const NOW = '2026-08-28T11:00:00.000Z';
const EVALUATED_AT = '2026-08-28T11:01:00.000Z';

function policy(
  overrides: Partial<CryptoMemeHoneypotSimulationAdmissionPolicy> = {},
): CryptoMemeHoneypotSimulationAdmissionPolicy {
  return {
    contractVersion: CRYPTO_MEME_HONEYPOT_SIMULATION_ADMISSION_VERSION,
    policyId: 'POLICY-P1A-SIMULATION-ADMISSION',
    policyVersion: '0.1.0',
    chainId: '1',
    tokenAddress: TOKEN,
    routeAuthorityId: 'AUTH-CRYPTO-ROUTE-RESEARCH',
    routeAuthorityVersion: '0.1.0',
    coverageAuthorityId: 'AUTH-P1A-COVERAGE-EVIDENCE',
    coverageAuthorityVersion: '0.1.0',
    coverageEvidenceRefs: ['coverage:test-fixture:ethereum'],
    maxObservationAgeMs: 5 * 60_000,
    maxPairObservationSkewMs: 30_000,
    ...overrides,
  };
}

function evidence(
  kind: 'BUY' | 'SELL',
  directionSucceeded: boolean | null,
  overrides: Partial<GoPlusTradeSimulationEvidence> = {},
): GoPlusTradeSimulationEvidence {
  return {
    contractVersion: 'goplus-transaction-simulation-evidence/1.0.0',
    status: 'VERIFIED',
    kind,
    chainId: '1',
    tokenAddress: TOKEN,
    routeAuthorityId: 'AUTH-CRYPTO-ROUTE-RESEARCH',
    routeAuthorityVersion: '0.1.0',
    routeEvidenceRefs: ['route:test-fixture:quote', 'route:test-fixture:calldata'],
    transactionFingerprint: `sha256:${(kind === 'BUY' ? 'a' : 'b').repeat(64)}`,
    retrievedAt: NOW,
    evidenceId: `goplus:test-fixture:${kind.toLowerCase()}`,
    simulated: true,
    reverted: directionSucceeded === false,
    revertReason: directionSucceeded === false ? 'test fixture revert' : null,
    tokenBalanceChangeAtoms: directionSucceeded === null ? null : kind === 'BUY' ? '100' : '-100',
    directionSucceeded,
    riskFlags: [],
    suspiciousAddresses: [],
    executionHandoffEligible: false,
    ...overrides,
  };
}

describe('P1-A honeypot simulation admission', () => {
  it('admits an exact, fresh and sufficiently synchronized BUY/SELL pair', () => {
    const result = admitMemeHoneypotSimulationEvidence(
      evidence('BUY', true),
      evidence('SELL', true, { retrievedAt: '2026-08-28T11:00:10.000Z' }),
      EVALUATED_AT,
      policy(),
    );

    expect(result.status).toBe('ADMITTED');
    expect(result.evidence?.status).toBe('READY');
    expect(result.buyObservationAgeMs).toBe(60_000);
    expect(result.sellObservationAgeMs).toBe(50_000);
    expect(result.pairObservationSkewMs).toBe(10_000);
    expect(result.coverageEvidenceRefs).toEqual(['coverage:test-fixture:ethereum']);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('fails closed when either observation is stale', () => {
    const result = admitMemeHoneypotSimulationEvidence(
      evidence('BUY', true),
      evidence('SELL', true),
      '2026-08-28T11:06:00.000Z',
      policy(),
    );

    expect(result.status).toBe('NOT_ADMITTED');
    expect(result.reason).toContain('stale');
    expect(result.evidence).toBeNull();
  });

  it('fails closed when BUY and SELL exceed governed pair skew', () => {
    const result = admitMemeHoneypotSimulationEvidence(
      evidence('BUY', true),
      evidence('SELL', true, { retrievedAt: '2026-08-28T11:00:45.000Z' }),
      EVALUATED_AT,
      policy(),
    );

    expect(result.status).toBe('NOT_ADMITTED');
    expect(result.pairObservationSkewMs).toBe(45_000);
    expect(result.reason).toContain('skew');
  });

  it('does not infer coverage when chain/token/route identity differs from policy', () => {
    const result = admitMemeHoneypotSimulationEvidence(
      evidence('BUY', true),
      evidence('SELL', true),
      EVALUATED_AT,
      policy({ chainId: '8453' }),
    );

    expect(result.status).toBe('NOT_ADMITTED');
    expect(result.reason).toContain('coverage policy identity');
  });

  it('keeps a fresh but incomplete target-token observation non-admitted', () => {
    const result = admitMemeHoneypotSimulationEvidence(
      evidence('BUY', null),
      evidence('SELL', true),
      EVALUATED_AT,
      policy(),
    );

    expect(result.status).toBe('NOT_ADMITTED');
    expect(result.evidence?.status).toBe('NOT_COMPUTABLE');
    expect(result.reason).toContain('NOT_COMPUTABLE');
  });
});

describe('P1-A independently labelled validation harness', () => {
  function admitted(kind: 'SAFE' | 'BLOCKED', suffix: string) {
    return admitMemeHoneypotSimulationEvidence(
      evidence('BUY', true, { evidenceId: `goplus:${suffix}:buy` }),
      evidence('SELL', kind === 'SAFE', { evidenceId: `goplus:${suffix}:sell` }),
      EVALUATED_AT,
      policy({ coverageEvidenceRefs: [`coverage:${suffix}`] }),
    );
  }

  function validationCase(
    caseId: string,
    expectedOutcome: 'SAFE' | 'BLOCKED',
    observed: ReturnType<typeof admitted>,
    overrides: Partial<HoneypotSimulationValidationCase> = {},
  ): HoneypotSimulationValidationCase {
    return {
      caseId,
      expectedOutcome,
      labelProviderId: 'independent-test-label-provider',
      labelAuthorityId: 'AUTH-INDEPENDENT-TEST-LABELS',
      labelAuthorityVersion: '0.1.0',
      labelEvidenceRefs: [`label:test-fixture:${caseId}`],
      admission: observed,
      ...overrides,
    };
  }

  it('computes deterministic metrics while inconclusive cases lower coverage', () => {
    const safe = admitted('SAFE', 'safe');
    const blocked = admitted('BLOCKED', 'blocked');
    const inconclusive = admitMemeHoneypotSimulationEvidence(
      evidence('BUY', null),
      evidence('SELL', true),
      EVALUATED_AT,
      policy({ coverageEvidenceRefs: ['coverage:inconclusive'] }),
    );

    const report = evaluateHoneypotSimulationValidation([
      validationCase('safe-1', 'SAFE', safe),
      validationCase('blocked-1', 'BLOCKED', blocked),
      validationCase('missed-block-1', 'BLOCKED', safe),
      validationCase('inconclusive-1', 'SAFE', inconclusive),
    ], EVALUATED_AT);

    expect(report.acceptedCaseCount).toBe(4);
    expect(report.computableCaseCount).toBe(3);
    expect(report.inconclusiveCaseCount).toBe(1);
    expect(report.trueSafeCount).toBe(1);
    expect(report.trueBlockedCount).toBe(1);
    expect(report.falseSafeCount).toBe(1);
    expect(report.falseBlockedCount).toBe(0);
    expect(report.computableRate).toBe(0.75);
    expect(report.safeAcceptanceRate).toBe(0.5);
    expect(report.blockedDetectionRate).toBe(0.5);
    expect(report.promotionEligible).toBe(false);
    expect(report.executionEligible).toBe(false);
  });

  it('rejects labels supplied by the provider under validation and duplicate case IDs', () => {
    const safe = admitted('SAFE', 'safe');
    const report = evaluateHoneypotSimulationValidation([
      validationCase('case-1', 'SAFE', safe, { labelProviderId: 'goplus' }),
      validationCase('case-2', 'SAFE', safe),
      validationCase('case-2', 'SAFE', safe),
    ], EVALUATED_AT);

    expect(report.acceptedCaseCount).toBe(1);
    expect(report.rejectedCaseCount).toBe(2);
    expect(report.acceptedCaseIds).toEqual(['case-2']);
    expect(report.promotionEligible).toBe(false);
  });
});
