import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreDecisionRecord,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore/CoreContracts';
import {
  bindApprovedOrderIntent,
  type FinTechCoreOrderIntentBindingInput,
} from '../../src/platform/FinTechCore/OrderIntent/OrderIntentBinding';
import { reconcileOrderIntentDecisionBinding } from '../../src/platform/FinTechCore/Reconciliation/ReconciliationContracts';
import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../../src/platform/Scoring/contracts';

const context: FinTechCoreWorkflowContext = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  moduleId: 'fintech-core.crypto',
  runId: 'run-ft6-1',
  traceId: 'trace-ft6-1',
  correlationId: 'corr-ft6-1',
  strategyId: 'strategy-ft6-1',
  portfolioId: 'portfolio-ft6-1',
  decisionVersion: 'decision/ft6/v1',
  operatingMode: 'PAPER',
  asset: {
    contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    source: 'registry',
  },
  startedAt: '2026-08-22T00:00:00.000Z',
};

function decision(
  kind: 'risk' | 'compliance',
  overrides: Partial<FinTechCoreDecisionRecord> = {},
): FinTechCoreDecisionRecord {
  const risk = kind === 'risk';
  return {
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    decisionId: risk ? 'risk-ft6-1' : 'compliance-ft6-1',
    decisionType: risk ? 'PRE_TRADE_RISK_GATE' : 'PRE_TRADE_COMPLIANCE_GATE',
    decisionVersion: context.decisionVersion,
    outcome: 'APPROVED',
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    moduleId: context.moduleId,
    assetId: context.asset.assetId,
    policyId: risk ? 'risk-policy' : 'compliance-policy',
    policyVersion: '1',
    inputHash: risk ? 'risk-input' : 'compliance-input',
    outputHash: risk ? 'risk-output' : 'compliance-output',
    evidenceRefs: [risk ? 'evidence://risk' : 'evidence://compliance'],
    decidedAt: '2026-08-22T00:00:10.000Z',
    ...overrides,
  };
}

function bindingInput(
  overrides: Partial<FinTechCoreOrderIntentBindingInput> = {},
): FinTechCoreOrderIntentBindingInput {
  return {
    context,
    riskDecision: decision('risk'),
    complianceDecision: decision('compliance'),
    orderIntentId: 'intent-ft6-1',
    clientOrderId: 'client-order-ft6-1',
    idempotencyKey: 'idempotency-ft6-1',
    side: 'BUY',
    quantity: 0.01,
    orderType: 'LIMIT',
    limitPrice: 100000,
    maxSlippageBps: 25,
    createdAt: '2026-08-22T00:00:20.000Z',
    expiresAt: '2026-08-22T00:05:20.000Z',
    ...overrides,
  };
}

describe('FinTech Core FT-6 deterministic OrderIntent binding', () => {
  it('derives approvals from authoritative FT-5 decisions and binds their output hashes', () => {
    const result = bindApprovedOrderIntent(bindingInput());
    expect(result.status).toBe('BOUND');
    if (result.status !== 'BOUND') throw new Error('test setup failed');

    expect(result.executionHandoffEligible).toBe(false);
    expect(result.intent).toMatchObject({
      riskApproval: 'APPROVED',
      complianceApproval: 'APPROVED',
      riskDecisionId: 'risk-ft6-1',
      riskDecisionOutputHash: 'risk-output',
      complianceDecisionId: 'compliance-ft6-1',
      complianceDecisionOutputHash: 'compliance-output',
      clientOrderId: 'client-order-ft6-1',
      effectClass: 'SIDE_EFFECTING',
    });
    expect(result.intent.intentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(result.evidenceRefs).toContain('decision://risk-ft6-1');
    expect(result.evidenceRefs).toContain('decision://compliance-ft6-1');
  });

  it('produces a deterministic but content-sensitive intent hash', () => {
    const first = bindApprovedOrderIntent(bindingInput());
    const second = bindApprovedOrderIntent(bindingInput());
    const changed = bindApprovedOrderIntent(bindingInput({ quantity: 0.02 }));
    if (first.status !== 'BOUND' || second.status !== 'BOUND' || changed.status !== 'BOUND') {
      throw new Error('test setup failed');
    }
    expect(first.intent.intentHash).toBe(second.intent.intentHash);
    expect(first.intent.intentHash).not.toBe(changed.intent.intentHash);
  });

  it('fails closed for non-approved or context-mismatched decisions', () => {
    const rejected = bindApprovedOrderIntent(bindingInput({
      riskDecision: decision('risk', { outcome: 'REJECTED' }),
    }));
    expect(rejected).toMatchObject({
      status: 'NOT_AUTHORIZED',
      code: 'RISK_DECISION_NOT_APPROVED',
      executionHandoffEligible: false,
    });

    const mismatched = bindApprovedOrderIntent(bindingInput({
      complianceDecision: decision('compliance', { runId: 'run-other' }),
    }));
    expect(mismatched).toMatchObject({
      status: 'NOT_AUTHORIZED',
      code: 'DECISION_CONTEXT_MISMATCH',
    });
  });

  it('keeps live modes blocked in FT-6A even when both decisions are approved', () => {
    const liveContext: FinTechCoreWorkflowContext = { ...context, operatingMode: 'GUARDED_LIVE' };
    const result = bindApprovedOrderIntent(bindingInput({ context: liveContext }));
    expect(result).toMatchObject({
      status: 'NOT_AUTHORIZED',
      code: 'MODE_NOT_ALLOWED',
      executionHandoffEligible: false,
    });
  });

  it('rejects expired, invalid or unbounded order intents', () => {
    const expired = bindApprovedOrderIntent(bindingInput({
      expiresAt: '2026-08-22T00:00:20.000Z',
    }));
    expect(expired).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'EXPIRED_INTENT' });

    const missingLimit = bindApprovedOrderIntent(bindingInput({ limitPrice: undefined }));
    expect(missingLimit).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'INVALID_ORDER_INTENT' });

    const invalidSlippage = bindApprovedOrderIntent(bindingInput({ maxSlippageBps: 10001 }));
    expect(invalidSlippage).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'INVALID_ORDER_INTENT' });
  });

  it('reconciles the decision-to-intent binding and exposes tamper drift as MISMATCH', () => {
    const result = bindApprovedOrderIntent(bindingInput());
    if (result.status !== 'BOUND') throw new Error('test setup failed');

    const matched = reconcileOrderIntentDecisionBinding({
      reconciliationId: 'recon-ft6-1',
      intent: result.intent,
      riskDecision: decision('risk'),
      complianceDecision: decision('compliance'),
      observedAt: '2026-08-22T00:00:30.000Z',
    });
    expect(matched.status).toBe('MATCHED');
    expect(matched.details).toMatchObject({
      settlementFinalityAsserted: false,
      realExecutionAsserted: false,
    });

    const tampered = reconcileOrderIntentDecisionBinding({
      reconciliationId: 'recon-ft6-2',
      intent: { ...result.intent, riskDecisionOutputHash: 'tampered' },
      riskDecision: decision('risk'),
      complianceDecision: decision('compliance'),
      observedAt: '2026-08-22T00:00:31.000Z',
    });
    expect(tampered.status).toBe('MISMATCH');
  });
});
