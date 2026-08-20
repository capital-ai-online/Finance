import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  FINTECH_CORE_CRYPTO_MODULE_ID,
  finTechCoreEngine,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';

function context(
  operatingMode: FinTechCoreWorkflowContext['operatingMode'] = 'RESEARCH',
  assetClass: FinTechCoreWorkflowContext['asset']['assetClass'] = 'crypto',
): FinTechCoreWorkflowContext {
  return {
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    moduleId: FINTECH_CORE_CRYPTO_MODULE_ID,
    runId: `run-${operatingMode.toLowerCase()}`,
    traceId: 'trace-1',
    correlationId: 'corr-1',
    decisionVersion: 'decision-v1',
    operatingMode,
    asset: createUniversalAssetIdentity({
      symbol: assetClass === 'crypto' ? 'BTC' : 'AAPL',
      assetClass,
      source: 'request',
    }),
    startedAt: '2026-08-20T14:00:00.000Z',
  };
}

describe('FinTech Core engine foundation', () => {
  it('prepares and starts a research workflow without financial side effects', () => {
    const prepared = finTechCoreEngine.prepareWorkflow(context('RESEARCH'));
    expect(prepared.status).toBe('PREPARED');
    if (prepared.status !== 'PREPARED') return;
    expect(prepared.moduleResolution.module.descriptor.moduleId).toBe(FINTECH_CORE_CRYPTO_MODULE_ID);
    expect(prepared.state.status).toBe('CREATED');

    const started = finTechCoreEngine.startWorkflow(
      context('RESEARCH'),
      '2026-08-20T14:00:01.000Z',
    );
    expect(started).toMatchObject({
      status: 'STARTED',
      state: { status: 'RUNNING', sequence: 1 },
    });
  });

  it('fails closed for guarded-live and production before their roadmap gates exist', () => {
    expect(finTechCoreEngine.prepareWorkflow(context('GUARDED_LIVE')).status)
      .toBe('WORKFLOW_NOT_AVAILABLE');
    expect(finTechCoreEngine.prepareWorkflow(context('PRODUCTION')).status)
      .toBe('WORKFLOW_NOT_AVAILABLE');
  });

  it('fails closed when Crypto Module 01 is requested for another asset class', () => {
    const prepared = finTechCoreEngine.prepareWorkflow(context('RESEARCH', 'stock'));
    expect(prepared.status).toBe('WORKFLOW_NOT_AVAILABLE');
  });
});
