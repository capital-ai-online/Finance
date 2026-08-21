import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  createInitialFinTechCoreWorkflowState,
  transitionFinTechCoreWorkflow,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';

function context(): FinTechCoreWorkflowContext {
  return {
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    moduleId: 'fintech-core.crypto',
    runId: 'run-1',
    traceId: 'trace-1',
    correlationId: 'corr-1',
    decisionVersion: 'decision-v1',
    operatingMode: 'PAPER',
    asset: createUniversalAssetIdentity({
      symbol: 'BTC',
      assetClass: 'crypto',
      source: 'request',
    }),
    startedAt: '2026-08-20T14:00:00.000Z',
  };
}

describe('FinTech Core workflow state machine', () => {
  it('creates deterministic CREATED state and advances sequence monotonically', () => {
    const initial = createInitialFinTechCoreWorkflowState(context());
    expect(initial).toMatchObject({ status: 'CREATED', sequence: 0, runId: 'run-1' });

    const running = transitionFinTechCoreWorkflow(
      initial,
      'RUNNING',
      '2026-08-20T14:00:01.000Z',
    );
    expect(running.status).toBe('TRANSITIONED');
    if (running.status !== 'TRANSITIONED') return;
    expect(running.state).toMatchObject({
      status: 'RUNNING',
      previousStatus: 'CREATED',
      sequence: 1,
    });

    const waiting = transitionFinTechCoreWorkflow(
      running.state,
      'WAITING_FOR_APPROVAL',
      '2026-08-20T14:00:02.000Z',
    );
    expect(waiting.status).toBe('TRANSITIONED');
    if (waiting.status !== 'TRANSITIONED') return;
    expect(waiting.state.sequence).toBe(2);
  });

  it('allows approval waiting to resume but rejects implicit terminal-state reopening', () => {
    const initial = createInitialFinTechCoreWorkflowState(context());
    const running = transitionFinTechCoreWorkflow(initial, 'RUNNING', 't1');
    if (running.status !== 'TRANSITIONED') throw new Error('fixture transition failed');
    const waiting = transitionFinTechCoreWorkflow(running.state, 'WAITING_FOR_APPROVAL', 't2');
    if (waiting.status !== 'TRANSITIONED') throw new Error('fixture transition failed');

    const resumed = transitionFinTechCoreWorkflow(waiting.state, 'RUNNING', 't3');
    expect(resumed.status).toBe('TRANSITIONED');
    if (resumed.status !== 'TRANSITIONED') return;

    const completed = transitionFinTechCoreWorkflow(resumed.state, 'COMPLETED', 't4');
    expect(completed.status).toBe('TRANSITIONED');
    if (completed.status !== 'TRANSITIONED') return;

    expect(transitionFinTechCoreWorkflow(completed.state, 'RUNNING', 't5')).toMatchObject({
      status: 'TRANSITION_REJECTED',
      state: { status: 'COMPLETED' },
    });
  });

  it('supports fail-safe emergency stop and rejects missing transition timestamps', () => {
    const initial = createInitialFinTechCoreWorkflowState(context());
    const emergency = transitionFinTechCoreWorkflow(
      initial,
      'EMERGENCY_STOPPED',
      '2026-08-20T14:00:03.000Z',
    );
    expect(emergency.status).toBe('TRANSITIONED');

    expect(transitionFinTechCoreWorkflow(initial, 'RUNNING', '   ')).toMatchObject({
      status: 'TRANSITION_REJECTED',
      state: { status: 'CREATED' },
    });
  });
});
