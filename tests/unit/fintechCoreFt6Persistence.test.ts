import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assertConfigured: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  assertPrivilegedSupabaseConfigured: mocks.assertConfigured,
  getPrivilegedServerSupabase: vi.fn(() => ({ rpc: mocks.rpc })),
}));

import { SupabaseFinTechCorePersistenceAdapter } from '../../server/fintechCorePersistence';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
  type FinTechCoreOrderIntent,
} from '../../src/platform/FinTechCore/CoreContracts';
import { FINTECH_CORE_ORDER_INTENT_BINDING_VERSION } from '../../src/platform/FinTechCore/OrderIntent/OrderIntentBinding';
import {
  FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
  type FinTechCoreReconciliationRecord,
} from '../../src/platform/FinTechCore/Reconciliation/ReconciliationContracts';

const boundIntent: FinTechCoreOrderIntent = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  orderIntentContractVersion: FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
  bindingState: 'BOUND',
  bindingVersion: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
  orderIntentId: 'intent-ft6-persist-1',
  clientOrderId: 'cai_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  runId: 'run-ft6-persist-1',
  traceId: 'trace-ft6-persist-1',
  correlationId: 'corr-ft6-persist-1',
  idempotencyKey: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
  assetId: 'crypto:BTC',
  side: 'BUY',
  quantity: { atoms: '1', scale: 2 },
  orderType: 'LIMIT',
  priceBounds: { limitPrice: { atoms: '10000000', scale: 2 } },
  maxSlippageBps: 25,
  strategyId: 'strategy-ft6',
  portfolioId: 'portfolio-ft6',
  decisionVersion: 'decision/ft6/v1',
  riskApproval: 'APPROVED',
  complianceApproval: 'APPROVED',
  riskDecisionId: 'risk-ft6-persist-1',
  riskDecisionHash: 'risk-output-hash',
  riskPolicyId: 'risk-policy',
  riskPolicyVersion: '1',
  complianceDecisionId: 'compliance-ft6-persist-1',
  complianceDecisionHash: 'compliance-output-hash',
  compliancePolicyId: 'compliance-policy',
  compliancePolicyVersion: '1',
  createdAt: '2026-08-22T00:00:20.000Z',
  expiresAt: '2026-08-22T00:05:20.000Z',
  intentHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  effectClass: 'SIDE_EFFECTING',
};

const reconciliation: FinTechCoreReconciliationRecord = {
  reconciliationId: 'recon-ft6-persist-1',
  reconciliationContractVersion: FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
  runId: boundIntent.runId,
  traceId: boundIntent.traceId,
  correlationId: boundIntent.correlationId,
  orderIntentId: boundIntent.orderIntentId,
  clientOrderId: boundIntent.clientOrderId ?? '',
  reconciliationType: 'ORDER_INTENT_DECISION_BINDING',
  status: 'MATCHED',
  settlementState: 'NOT_APPLICABLE',
  sourceSystem: 'fintech_core.decision_records',
  targetSystem: 'fintech_core.order_intents',
  assetId: boundIntent.assetId,
  expectedQuantity: boundIntent.quantity,
  expectedPriceBounds: boundIntent.priceBounds,
  observedAt: '2026-08-22T00:00:30.000Z',
  reconciledAt: '2026-08-22T00:00:30.000Z',
  inputHash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  outputHash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  evidenceRefs: ['decision://risk-ft6-persist-1', 'decision://compliance-ft6-persist-1'],
  supervisorEscalationRequired: false,
  details: { settlementFinalityAsserted: false, realExecutionAsserted: false },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: true, error: null });
});

describe('FinTech Core FT-6 persistence boundary', () => {
  it('persists canonical BOUND OrderIntent through the single persistence port and v2 RPC', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();

    await adapter.appendOrderIntent({
      intent: boundIntent,
      evidenceRefs: ['evidence://ft6/binding'],
    });

    expect(mocks.assertConfigured).toHaveBeenCalledWith('FinTech Core FT-6 order-intent append');
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_order_intent_v2', expect.objectContaining({
      p_order_intent_id: boundIntent.orderIntentId,
      p_order_intent_contract_version: FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
      p_binding_version: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
      p_client_order_id: boundIntent.clientOrderId,
      p_idempotency_key: boundIntent.idempotencyKey,
      p_quantity_fixed: { atoms: '1', scale: 2 },
      p_price_bounds: { limitPrice: { atoms: '10000000', scale: 2 } },
      p_risk_decision_id: boundIntent.riskDecisionId,
      p_risk_decision_hash: boundIntent.riskDecisionHash,
      p_risk_policy_id: boundIntent.riskPolicyId,
      p_risk_policy_version: boundIntent.riskPolicyVersion,
      p_compliance_decision_id: boundIntent.complianceDecisionId,
      p_compliance_decision_hash: boundIntent.complianceDecisionHash,
      p_compliance_policy_id: boundIntent.compliancePolicyId,
      p_compliance_policy_version: boundIntent.compliancePolicyVersion,
      p_intent_hash: boundIntent.intentHash,
      p_evidence_refs: ['evidence://ft6/binding'],
    }));
  });

  it('persists typed reconciliation evidence without asserting execution or settlement finality', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();

    await adapter.appendReconciliationRecord(reconciliation);

    expect(mocks.assertConfigured).toHaveBeenCalledWith('FinTech Core FT-6 reconciliation append');
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_reconciliation_record_v2', expect.objectContaining({
      p_reconciliation_id: reconciliation.reconciliationId,
      p_reconciliation_contract_version: FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
      p_client_order_id: reconciliation.clientOrderId,
      p_reconciliation_type: 'ORDER_INTENT_DECISION_BINDING',
      p_status: 'MATCHED',
      p_settlement_state: 'NOT_APPLICABLE',
      p_expected_quantity: { atoms: '1', scale: 2 },
      p_expected_price_bounds: { limitPrice: { atoms: '10000000', scale: 2 } },
      p_supervisor_escalation_required: false,
      p_details: expect.objectContaining({
        settlementFinalityAsserted: false,
        realExecutionAsserted: false,
      }),
    }));
  });

  it('persists unresolved MISMATCH evidence with mandatory supervisor escalation', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    await adapter.appendReconciliationRecord({
      ...reconciliation,
      reconciliationId: 'recon-ft6-persist-mismatch',
      status: 'MISMATCH',
      supervisorEscalationRequired: true,
    });

    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_reconciliation_record_v2', expect.objectContaining({
      p_status: 'MISMATCH',
      p_supervisor_escalation_required: true,
    }));
  });

  it('fails closed when a BOUND OrderIntent is missing immutable decision/policy binding', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    await expect(adapter.appendOrderIntent({
      intent: { ...boundIntent, riskPolicyVersion: undefined },
    })).rejects.toThrow('missing immutable binding fields');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('fails closed when the private persistence boundary rejects an FT-6 append', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });

    await expect(adapter.appendOrderIntent({ intent: boundIntent })).rejects.toThrow('permission denied');
  });
});
