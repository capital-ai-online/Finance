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
import { FINTECH_CORE_CONTRACT_VERSION } from '../../src/platform/FinTechCore/CoreContracts';
import {
  FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
  type FinTechCoreBoundOrderIntent,
} from '../../src/platform/FinTechCore/OrderIntent/OrderIntentBinding';
import {
  FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
  type FinTechCoreReconciliationRecord,
} from '../../src/platform/FinTechCore/Reconciliation/ReconciliationContracts';

const boundIntent: FinTechCoreBoundOrderIntent = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  bindingVersion: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
  orderIntentId: 'intent-ft6-persist-1',
  clientOrderId: 'client-ft6-persist-1',
  runId: 'run-ft6-persist-1',
  traceId: 'trace-ft6-persist-1',
  correlationId: 'corr-ft6-persist-1',
  idempotencyKey: 'idem-ft6-persist-1',
  assetId: 'crypto:BTC',
  side: 'BUY',
  quantity: 0.01,
  orderType: 'LIMIT',
  limitPrice: 100000,
  maxSlippageBps: 25,
  strategyId: 'strategy-ft6',
  portfolioId: 'portfolio-ft6',
  decisionVersion: 'decision/ft6/v1',
  riskApproval: 'APPROVED',
  complianceApproval: 'APPROVED',
  riskDecisionId: 'risk-ft6-persist-1',
  riskDecisionOutputHash: 'risk-output-hash',
  complianceDecisionId: 'compliance-ft6-persist-1',
  complianceDecisionOutputHash: 'compliance-output-hash',
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
  reconciliationType: 'ORDER_INTENT_DECISION_BINDING',
  status: 'MATCHED',
  sourceSystem: 'fintech_core.decision_records',
  targetSystem: 'fintech_core.order_intents',
  assetId: boundIntent.assetId,
  observedAt: '2026-08-22T00:00:30.000Z',
  inputHash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  outputHash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  evidenceRefs: ['decision://risk-ft6-persist-1', 'decision://compliance-ft6-persist-1'],
  details: { settlementFinalityAsserted: false, realExecutionAsserted: false },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: true, error: null });
});

describe('FinTech Core FT-6 persistence boundary', () => {
  it('persists bound OrderIntent identity through the dedicated service-role RPC', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();

    await adapter.appendBoundOrderIntent({
      intent: boundIntent,
      evidenceRefs: ['evidence://ft6/binding'],
    });

    expect(mocks.assertConfigured).toHaveBeenCalledWith('FinTech Core FT-6 bound order-intent append');
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_bound_order_intent_v1', expect.objectContaining({
      p_order_intent_id: boundIntent.orderIntentId,
      p_binding_version: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
      p_client_order_id: boundIntent.clientOrderId,
      p_idempotency_key: boundIntent.idempotencyKey,
      p_risk_decision_id: boundIntent.riskDecisionId,
      p_risk_decision_output_hash: boundIntent.riskDecisionOutputHash,
      p_compliance_decision_id: boundIntent.complianceDecisionId,
      p_compliance_decision_output_hash: boundIntent.complianceDecisionOutputHash,
      p_intent_hash: boundIntent.intentHash,
      p_evidence_refs: ['evidence://ft6/binding'],
    }));
  });

  it('persists typed reconciliation evidence without asserting execution or settlement finality', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();

    await adapter.appendReconciliationRecord(reconciliation);

    expect(mocks.assertConfigured).toHaveBeenCalledWith('FinTech Core FT-6 reconciliation append');
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_reconciliation_record_v1', expect.objectContaining({
      p_reconciliation_id: reconciliation.reconciliationId,
      p_reconciliation_type: 'ORDER_INTENT_DECISION_BINDING',
      p_status: 'MATCHED',
      p_source_system: 'fintech_core.decision_records',
      p_target_system: 'fintech_core.order_intents',
      p_details: expect.objectContaining({
        reconciliationContractVersion: FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
        settlementFinalityAsserted: false,
        realExecutionAsserted: false,
      }),
    }));
  });

  it('fails closed when the private persistence boundary rejects an FT-6 append', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });

    await expect(adapter.appendBoundOrderIntent({ intent: boundIntent })).rejects.toThrow('permission denied');
  });
});
