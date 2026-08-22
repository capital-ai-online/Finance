import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreDecisionRecord,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore/CoreContracts';
import {
  bindApprovedOrderIntent,
  deriveOrderIntentIntegrity,
  type FinTechCoreOrderIntentBindingInput,
} from '../../src/platform/FinTechCore/OrderIntent/OrderIntentBinding';
import {
  reconcileOrderIntentDecisionBinding,
  reconcilePaperOrderIntent,
} from '../../src/platform/FinTechCore/Reconciliation/ReconciliationContracts';
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
    side: 'BUY',
    quantity: { atoms: '1', scale: 2 },
    orderType: 'LIMIT',
    priceBounds: {
      limitPrice: { atoms: '10000000', scale: 2 },
      minPrice: { atoms: '9900000', scale: 2 },
      maxPrice: { atoms: '10100000', scale: 2 },
    },
    maxSlippageBps: 25,
    createdAt: '2026-08-22T00:00:20.000Z',
    expiresAt: '2026-08-22T00:05:20.000Z',
    ...overrides,
  };
}

describe('FinTech Core FT-6 deterministic OrderIntent binding', () => {
  it('derives approvals, policy binding, client identity and idempotency from authoritative FT-5 decisions', () => {
    const result = bindApprovedOrderIntent(bindingInput());
    expect(result.status).toBe('BOUND');
    if (result.status !== 'BOUND') throw new Error('test setup failed');

    expect(result.executionHandoffEligible).toBe(false);
    expect(result.intent).toMatchObject({
      bindingState: 'BOUND',
      riskApproval: 'APPROVED',
      complianceApproval: 'APPROVED',
      riskDecisionId: 'risk-ft6-1',
      riskDecisionHash: 'risk-output',
      riskPolicyId: 'risk-policy',
      riskPolicyVersion: '1',
      complianceDecisionId: 'compliance-ft6-1',
      complianceDecisionHash: 'compliance-output',
      compliancePolicyId: 'compliance-policy',
      compliancePolicyVersion: '1',
      effectClass: 'SIDE_EFFECTING',
    });
    expect(result.intent.clientOrderId).toMatch(/^cai_[0-9a-f]{32}$/);
    expect(result.intent.idempotencyKey).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(result.intent.intentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('produces deterministic replay identity and rejects payload drift through changed hashes', () => {
    const first = bindApprovedOrderIntent(bindingInput());
    const second = bindApprovedOrderIntent(bindingInput());
    const changed = bindApprovedOrderIntent(bindingInput({ quantity: { atoms: '2', scale: 2 } }));
    if (first.status !== 'BOUND' || second.status !== 'BOUND' || changed.status !== 'BOUND') {
      throw new Error('test setup failed');
    }
    expect(first.intent.clientOrderId).toBe(second.intent.clientOrderId);
    expect(first.intent.idempotencyKey).toBe(second.intent.idempotencyKey);
    expect(first.intent.intentHash).toBe(second.intent.intentHash);
    expect(first.intent.clientOrderId).toBe(changed.intent.clientOrderId);
    expect(first.intent.idempotencyKey).not.toBe(changed.intent.idempotencyKey);
    expect(first.intent.intentHash).not.toBe(changed.intent.intentHash);
  });

  it('fails closed when either authoritative decision is missing', () => {
    const missingRisk = bindApprovedOrderIntent({
      ...bindingInput(),
      riskDecision: undefined as unknown as FinTechCoreDecisionRecord,
    });
    expect(missingRisk).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'RISK_DECISION_MISSING' });

    const missingCompliance = bindApprovedOrderIntent({
      ...bindingInput(),
      complianceDecision: undefined as unknown as FinTechCoreDecisionRecord,
    });
    expect(missingCompliance).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'COMPLIANCE_DECISION_MISSING' });
  });

  it('rejects non-approved outcomes, context drift and policy-binding gaps', () => {
    expect(bindApprovedOrderIntent(bindingInput({
      riskDecision: decision('risk', { outcome: 'REJECTED' }),
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'RISK_DECISION_NOT_APPROVED' });

    expect(bindApprovedOrderIntent(bindingInput({
      complianceDecision: decision('compliance', { outcome: 'REVIEW_REQUIRED' }),
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'COMPLIANCE_DECISION_NOT_APPROVED' });

    for (const drift of [
      { runId: 'run-other' },
      { traceId: 'trace-other' },
      { correlationId: 'corr-other' },
      { assetId: 'crypto:ETH' },
      { decisionVersion: 'decision/other' },
    ] as const) {
      expect(bindApprovedOrderIntent(bindingInput({
        complianceDecision: decision('compliance', drift),
      }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'DECISION_CONTEXT_MISMATCH' });
    }

    expect(bindApprovedOrderIntent(bindingInput({
      riskDecision: decision('risk', { policyVersion: undefined }),
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'POLICY_BINDING_MISSING' });
  });

  it('rejects stale/future decisions, expiry errors and non-fixed-point financial values', () => {
    expect(bindApprovedOrderIntent(bindingInput({
      riskDecision: decision('risk', { decidedAt: '2026-08-21T23:59:59.000Z' }),
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'INVALID_TIMESTAMP' });

    expect(bindApprovedOrderIntent(bindingInput({
      complianceDecision: decision('compliance', { decidedAt: '2026-08-22T00:00:30.000Z' }),
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'INVALID_TIMESTAMP' });

    expect(bindApprovedOrderIntent(bindingInput({
      expiresAt: '2026-08-22T00:00:20.000Z',
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'EXPIRED_INTENT' });

    expect(bindApprovedOrderIntent(bindingInput({
      quantity: 0.01 as unknown as FinTechCoreOrderIntentBindingInput['quantity'],
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'INVALID_FIXED_POINT' });

    expect(bindApprovedOrderIntent(bindingInput({
      quantity: { atoms: '1.5', scale: 2 },
    }))).toMatchObject({ status: 'NOT_AUTHORIZED', code: 'INVALID_FIXED_POINT' });
  });

  it('keeps RESEARCH, GUARDED_LIVE and PRODUCTION unable to produce an execution handoff', () => {
    for (const operatingMode of ['RESEARCH', 'GUARDED_LIVE', 'PRODUCTION'] as const) {
      const result = bindApprovedOrderIntent(bindingInput({
        context: { ...context, operatingMode },
      }));
      expect(result).toMatchObject({
        status: 'NOT_AUTHORIZED',
        code: 'MODE_NOT_ALLOWED',
        executionHandoffEligible: false,
      });
    }
  });

  it('reconciles complete decision/policy/hash identity and exposes tamper or expiry as MISMATCH', () => {
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
    expect(matched.supervisorEscalationRequired).toBe(false);

    const tampered = reconcileOrderIntentDecisionBinding({
      reconciliationId: 'recon-ft6-2',
      intent: { ...result.intent, riskPolicyVersion: 'tampered' },
      riskDecision: decision('risk'),
      complianceDecision: decision('compliance'),
      observedAt: '2026-08-22T00:00:31.000Z',
    });
    expect(tampered.status).toBe('MISMATCH');
    expect(tampered.supervisorEscalationRequired).toBe(true);

    const expired = reconcileOrderIntentDecisionBinding({
      reconciliationId: 'recon-ft6-3',
      intent: result.intent,
      riskDecision: decision('risk'),
      complianceDecision: decision('compliance'),
      observedAt: result.intent.expiresAt,
    });
    expect(expired.status).toBe('MISMATCH');
  });

  it('reconciles PAPER fills without auto-repair or settlement claims', () => {
    const result = bindApprovedOrderIntent(bindingInput());
    if (result.status !== 'BOUND') throw new Error('test setup failed');

    const matched = reconcilePaperOrderIntent({
      reconciliationId: 'paper-recon-ft6-1',
      intent: result.intent,
      observed: {
        quantity: { atoms: '1', scale: 2 },
        executionPrice: { atoms: '9999000', scale: 2 },
        feeEvidence: {
          status: 'OBSERVED',
          amount: { atoms: '50', scale: 2 },
          assetId: 'crypto:USDT',
          evidenceRefs: ['paper-fill://fee/1'],
        },
      },
      evidenceRefs: ['paper-fill://1'],
      reconciledAt: '2026-08-22T00:00:40.000Z',
    });
    expect(matched).toMatchObject({
      status: 'MATCHED',
      settlementState: 'NOT_APPLICABLE',
      supervisorEscalationRequired: false,
    });

    const mismatch = reconcilePaperOrderIntent({
      reconciliationId: 'paper-recon-ft6-2',
      intent: result.intent,
      observed: {
        quantity: { atoms: '2', scale: 2 },
        executionPrice: { atoms: '10200000', scale: 2 },
        feeEvidence: {
          status: 'NOT_APPLICABLE',
          evidenceRefs: [],
          reason: 'paper simulation without external venue fee',
        },
      },
      evidenceRefs: ['paper-fill://2'],
      reconciledAt: '2026-08-22T00:00:41.000Z',
    });
    expect(mismatch.status).toBe('MISMATCH');
    expect(mismatch.supervisorEscalationRequired).toBe(true);
    expect(mismatch.details).toMatchObject({ autoRepairAttempted: false, realExecutionAsserted: false });
  });

  it('can independently reproduce canonical intent integrity', () => {
    const result = bindApprovedOrderIntent(bindingInput());
    if (result.status !== 'BOUND') throw new Error('test setup failed');
    const intent = result.intent;
    if (
      !intent.riskDecisionId || !intent.riskDecisionHash || !intent.riskPolicyId || !intent.riskPolicyVersion
      || !intent.complianceDecisionId || !intent.complianceDecisionHash
      || !intent.compliancePolicyId || !intent.compliancePolicyVersion
    ) throw new Error('test setup failed');

    expect(deriveOrderIntentIntegrity({
      orderIntentId: intent.orderIntentId,
      runId: intent.runId,
      traceId: intent.traceId,
      correlationId: intent.correlationId,
      assetId: intent.assetId,
      strategyId: intent.strategyId,
      portfolioId: intent.portfolioId,
      decisionVersion: intent.decisionVersion,
      side: intent.side,
      quantity: intent.quantity,
      orderType: intent.orderType,
      priceBounds: intent.priceBounds,
      maxSlippageBps: intent.maxSlippageBps,
      createdAt: intent.createdAt,
      expiresAt: intent.expiresAt,
      riskDecisionId: intent.riskDecisionId,
      riskDecisionHash: intent.riskDecisionHash,
      riskPolicyId: intent.riskPolicyId,
      riskPolicyVersion: intent.riskPolicyVersion,
      complianceDecisionId: intent.complianceDecisionId,
      complianceDecisionHash: intent.complianceDecisionHash,
      compliancePolicyId: intent.compliancePolicyId,
      compliancePolicyVersion: intent.compliancePolicyVersion,
    })).toEqual({
      idempotencyKey: intent.idempotencyKey,
      clientOrderId: intent.clientOrderId,
      intentHash: intent.intentHash,
    });
  });
});
