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
  type FinTechCoreDecisionRecord,
  type FinTechCoreDomainEvent,
  type FinTechCoreOrderIntent,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore/CoreContracts';
import {
  createInitialFinTechCoreWorkflowState,
  transitionFinTechCoreWorkflow,
} from '../../src/platform/FinTechCore/Runtime/WorkflowStateMachine';
import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../../src/platform/Scoring/contracts';

const context: FinTechCoreWorkflowContext = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  moduleId: 'fintech-core.crypto',
  runId: 'run-ft3-1',
  traceId: 'trace-ft3-1',
  correlationId: 'corr-ft3-1',
  strategyId: 'strategy-research-1',
  portfolioId: 'portfolio-paper-1',
  decisionVersion: 'decision/v1',
  operatingMode: 'PAPER',
  asset: {
    contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    source: 'registry',
  },
  startedAt: '2026-08-21T00:30:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: true, error: null });
});

describe('SupabaseFinTechCorePersistenceAdapter', () => {
  it('persists canonical workflow identity through the service-role-only creation RPC', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const state = createInitialFinTechCoreWorkflowState(context);
    await adapter.createWorkflowRun({ context, state, evidenceRefs: ['evidence://ft3/create'] });

    expect(mocks.assertConfigured).toHaveBeenCalledWith('FinTech Core workflow creation');
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_create_workflow_run_v1', expect.objectContaining({
      p_run_id: context.runId,
      p_contract_version: FINTECH_CORE_CONTRACT_VERSION,
      p_trace_id: context.traceId,
      p_correlation_id: context.correlationId,
      p_asset_id: 'crypto:BTC',
      p_asset_identity: context.asset,
      p_status: 'CREATED',
      p_sequence: 0,
      p_evidence_refs: ['evidence://ft3/create'],
    }));
  });

  it('rejects an invalid initial state before any database RPC', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const initial = createInitialFinTechCoreWorkflowState(context);
    const invalid = { ...initial, status: 'RUNNING' as const, sequence: 1 };

    await expect(adapter.createWorkflowRun({ context, state: invalid })).rejects.toThrow('CREATED sequence 0');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('persists a compare-and-set workflow transition with expected predecessor state', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const initial = createInitialFinTechCoreWorkflowState(context);
    const transitioned = transitionFinTechCoreWorkflow(initial, 'RUNNING', '2026-08-21T00:31:00.000Z');
    if (transitioned.status !== 'TRANSITIONED') throw new Error('test setup failed');

    await adapter.persistWorkflowTransition({ previousState: initial, nextState: transitioned.state });
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_advance_workflow_run_v1', {
      p_run_id: context.runId,
      p_expected_status: 'CREATED',
      p_expected_sequence: 0,
      p_next_status: 'RUNNING',
      p_next_sequence: 1,
      p_updated_at: '2026-08-21T00:31:00.000Z',
      p_completed_at: null,
    });
  });

  it('marks terminal workflow persistence with completed_at equal to the deterministic transition time', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const initial = createInitialFinTechCoreWorkflowState(context);
    const running = transitionFinTechCoreWorkflow(initial, 'RUNNING', '2026-08-21T00:31:00.000Z');
    if (running.status !== 'TRANSITIONED') throw new Error('test setup failed');
    const completed = transitionFinTechCoreWorkflow(running.state, 'COMPLETED', '2026-08-21T00:32:00.000Z');
    if (completed.status !== 'TRANSITIONED') throw new Error('test setup failed');

    await adapter.persistWorkflowTransition({ previousState: running.state, nextState: completed.state });
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_advance_workflow_run_v1', expect.objectContaining({
      p_expected_status: 'RUNNING',
      p_next_status: 'COMPLETED',
      p_completed_at: '2026-08-21T00:32:00.000Z',
    }));
  });

  it('appends domain-event evidence without opening a table/schema Data API path', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const event: FinTechCoreDomainEvent = {
      contractVersion: FINTECH_CORE_CONTRACT_VERSION,
      eventId: 'event-ft3-1',
      eventType: 'WORKFLOW_STARTED',
      eventVersion: '1',
      runId: context.runId,
      traceId: context.traceId,
      correlationId: context.correlationId,
      moduleId: context.moduleId,
      assetId: context.asset.assetId,
      decisionVersion: context.decisionVersion,
      occurredAt: '2026-08-21T00:31:00.000Z',
      evidenceRefs: ['evidence://ft3/event'],
      payload: { status: 'RUNNING' },
    };

    await adapter.appendDomainEvent(event);
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_domain_event_v1', expect.objectContaining({
      p_event_id: 'event-ft3-1',
      p_run_id: context.runId,
      p_payload: { status: 'RUNNING' },
    }));
  });

  it('appends immutable decision evidence through the versioned RPC', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const record: FinTechCoreDecisionRecord = {
      contractVersion: FINTECH_CORE_CONTRACT_VERSION,
      decisionId: 'decision-ft3-1',
      decisionType: 'RESEARCH_GATE',
      decisionVersion: context.decisionVersion,
      outcome: 'REVIEW_REQUIRED',
      runId: context.runId,
      traceId: context.traceId,
      correlationId: context.correlationId,
      moduleId: context.moduleId,
      assetId: context.asset.assetId,
      policyId: 'policy-research-gate',
      policyVersion: '1',
      inputHash: 'input-hash',
      outputHash: 'output-hash',
      evidenceRefs: ['evidence://ft3/decision'],
      decidedAt: '2026-08-21T00:31:30.000Z',
    };

    await adapter.appendDecisionRecord(record);
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_decision_record_v1', expect.objectContaining({
      p_decision_id: 'decision-ft3-1',
      p_outcome: 'REVIEW_REQUIRED',
      p_input_hash: 'input-hash',
      p_output_hash: 'output-hash',
    }));
  });

  it('keeps legacy UNBOUND intent evidence on v1 while serializing fixed point exactly', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const intent: FinTechCoreOrderIntent = {
      contractVersion: FINTECH_CORE_CONTRACT_VERSION,
      orderIntentContractVersion: FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
      bindingState: 'UNBOUND',
      orderIntentId: 'intent-ft3-1',
      runId: context.runId,
      traceId: context.traceId,
      correlationId: context.correlationId,
      idempotencyKey: 'intent-key-ft3-1',
      assetId: context.asset.assetId,
      side: 'BUY',
      quantity: { atoms: '1', scale: 2 },
      orderType: 'LIMIT',
      priceBounds: { limitPrice: { atoms: '5000000', scale: 2 } },
      maxSlippageBps: 25,
      strategyId: context.strategyId,
      portfolioId: context.portfolioId,
      decisionVersion: context.decisionVersion,
      riskApproval: 'PENDING',
      complianceApproval: 'PENDING',
      createdAt: '2026-08-21T00:31:45.000Z',
      expiresAt: '2030-01-01T00:00:00.000Z',
      intentHash: 'intent-hash-ft3-1',
      effectClass: 'SIDE_EFFECTING',
    };

    await adapter.appendOrderIntent({ intent, evidenceRefs: ['evidence://ft3/intent'] });
    expect(mocks.assertConfigured).toHaveBeenCalledWith('FinTech Core legacy UNBOUND order-intent append');
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_append_order_intent_v1', expect.objectContaining({
      p_order_intent_id: 'intent-ft3-1',
      p_quantity: '0.01',
      p_limit_price: '50000.00',
      p_idempotency_key: 'intent-key-ft3-1',
      p_risk_approval: 'PENDING',
      p_compliance_approval: 'PENDING',
      p_effect_class: 'SIDE_EFFECTING',
      p_evidence_refs: ['evidence://ft3/intent'],
    }));
  });

  it('fails closed when Supabase rejects persistence', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const state = createInitialFinTechCoreWorkflowState(context);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } });

    await expect(adapter.createWorkflowRun({ context, state })).rejects.toThrow('permission denied');
  });
});
