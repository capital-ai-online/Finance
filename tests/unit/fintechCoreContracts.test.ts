import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  FINTECH_CORE_OPERATING_MODE_POLICY,
  FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
  isOrderIntentEligibleForRealExecution,
  type FinTechCoreOrderIntent,
} from '../../src/platform/FinTechCore/CoreContracts';

function orderIntent(overrides: Partial<FinTechCoreOrderIntent> = {}): FinTechCoreOrderIntent {
  return {
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    orderIntentContractVersion: FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
    bindingState: 'BOUND',
    bindingVersion: 'fintech-core/order-intent-binding/0.2.0',
    orderIntentId: 'intent-1',
    runId: 'run-1',
    traceId: 'trace-1',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    clientOrderId: 'client-1',
    assetId: 'crypto:BTC',
    side: 'BUY',
    quantity: { atoms: '1', scale: 2 },
    orderType: 'LIMIT',
    priceBounds: { limitPrice: { atoms: '10000000', scale: 2 } },
    maxSlippageBps: 25,
    decisionVersion: 'decision-v1',
    riskApproval: 'APPROVED',
    complianceApproval: 'APPROVED',
    riskDecisionId: 'risk-1',
    riskDecisionHash: 'risk-hash-1',
    riskPolicyId: 'risk-policy',
    riskPolicyVersion: '1',
    complianceDecisionId: 'compliance-1',
    complianceDecisionHash: 'compliance-hash-1',
    compliancePolicyId: 'compliance-policy',
    compliancePolicyVersion: '1',
    createdAt: '2026-08-20T15:55:00.000Z',
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

  it('keeps FT-6 real execution hard-blocked even for manually approved intents', () => {
    const approved = orderIntent();
    expect(isOrderIntentEligibleForRealExecution(approved, 'GUARDED_LIVE')).toBe(false);
    expect(isOrderIntentEligibleForRealExecution(approved, 'PRODUCTION')).toBe(false);

    expect(isOrderIntentEligibleForRealExecution(
      orderIntent({ riskApproval: 'REJECTED' }),
      'GUARDED_LIVE',
    )).toBe(false);
  });

  it('does not allow an OrderIntent to escape any non-live or future live operating mode in FT-6', () => {
    const approved = orderIntent();
    for (const mode of ['RESEARCH', 'PAPER', 'GUARDED_LIVE', 'PRODUCTION', 'EMERGENCY'] as const) {
      expect(isOrderIntentEligibleForRealExecution(approved, mode)).toBe(false);
    }
  });
});
