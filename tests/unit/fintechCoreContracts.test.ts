import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  FINTECH_CORE_OPERATING_MODE_POLICY,
  isOrderIntentEligibleForRealExecution,
  type FinTechCoreOrderIntent,
} from '../../src/platform/FinTechCore/CoreContracts';

function orderIntent(overrides: Partial<FinTechCoreOrderIntent> = {}): FinTechCoreOrderIntent {
  return {
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    orderIntentId: 'intent-1',
    runId: 'run-1',
    traceId: 'trace-1',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    assetId: 'crypto:BTC',
    side: 'BUY',
    quantity: 0.01,
    orderType: 'LIMIT',
    limitPrice: 100_000,
    maxSlippageBps: 25,
    decisionVersion: 'decision-v1',
    riskApproval: 'APPROVED',
    complianceApproval: 'APPROVED',
    expiresAt: '2026-08-20T16:00:00.000Z',
    intentHash: 'sha256:test',
    effectClass: 'SIDE_EFFECTING',
    ...overrides,
  };
}

describe('FinTech Core operating-mode and approval contracts', () => {
  it('keeps real execution disabled in research, paper and emergency modes', () => {
    expect(FINTECH_CORE_OPERATING_MODE_POLICY.RESEARCH.realExecutionAllowed).toBe(false);
    expect(FINTECH_CORE_OPERATING_MODE_POLICY.PAPER.realExecutionAllowed).toBe(false);
    expect(FINTECH_CORE_OPERATING_MODE_POLICY.EMERGENCY.realExecutionAllowed).toBe(false);
  });

  it('requires both risk and compliance approval before real execution eligibility', () => {
    const approved = orderIntent();
    expect(isOrderIntentEligibleForRealExecution(approved, 'GUARDED_LIVE')).toBe(true);

    expect(isOrderIntentEligibleForRealExecution(
      orderIntent({ riskApproval: 'REJECTED' }),
      'GUARDED_LIVE',
    )).toBe(false);

    expect(isOrderIntentEligibleForRealExecution(
      orderIntent({ complianceApproval: 'PENDING' }),
      'GUARDED_LIVE',
    )).toBe(false);
  });

  it('does not allow an otherwise approved OrderIntent to escape a non-live operating mode', () => {
    const approved = orderIntent();
    expect(isOrderIntentEligibleForRealExecution(approved, 'RESEARCH')).toBe(false);
    expect(isOrderIntentEligibleForRealExecution(approved, 'PAPER')).toBe(false);
    expect(isOrderIntentEligibleForRealExecution(approved, 'EMERGENCY')).toBe(false);
  });
});
