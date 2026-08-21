import { describe, expect, it, vi } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreDomainEvent,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore/CoreContracts';
import { PaperTradingWorkflowService } from '../../src/platform/FinTechCore/PaperTrading/PaperTradingWorkflowService';
import type { PaperTradeSimulationRequest } from '../../src/platform/FinTechCore/PaperTrading/PaperTradingContracts';
import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../../src/platform/Scoring/contracts';

const context: FinTechCoreWorkflowContext = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  moduleId: 'fintech-core.crypto',
  runId: 'run-ft4-service-1',
  traceId: 'trace-ft4-service-1',
  correlationId: 'corr-ft4-service-1',
  decisionVersion: 'decision/paper-v1',
  operatingMode: 'PAPER',
  asset: {
    contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    source: 'registry',
  },
  startedAt: '2026-08-21T08:00:00.000Z',
};

function trade(): PaperTradeSimulationRequest {
  return {
    eventId: 'paper-service-buy-1',
    fillId: 'paper-service-fill-1',
    side: 'BUY',
    quantity: { atoms: '1000000', scale: 8 },
    referencePrice: { atoms: '5000000', scale: 2 },
    occurredAt: '2026-08-21T08:01:00.000Z',
    costEvidence: {
      fee: { status: 'APPLIED', bps: 20, evidenceRefs: ['evidence://fee'] },
      slippage: { status: 'APPLIED', bps: 10, evidenceRefs: ['evidence://slippage'] },
      funding: { status: 'NOT_APPLICABLE', amount: { atoms: '0', scale: 2 }, evidenceRefs: [], reason: 'spot' },
    },
    evidenceRefs: ['evidence://market/reference'],
  };
}

describe('PaperTradingWorkflowService', () => {
  it('persists initialization and later reconstructs state from the durable event journal', async () => {
    const events: FinTechCoreDomainEvent[] = [];
    const store = {
      listDomainEvents: vi.fn(async () => events),
      appendDomainEvent: vi.fn(async (event: FinTechCoreDomainEvent) => { events.push(event); }),
    };
    const service = new PaperTradingWorkflowService(store);

    const initialized = await service.initialize(context, {
      eventId: 'paper-service-init-1',
      accountId: 'paper-service-account-1',
      quoteAssetId: 'USD',
      assetScale: 8,
      startingQuoteBalance: { atoms: '10000000', scale: 2 },
      occurredAt: context.startedAt,
      evidenceRefs: ['evidence://paper/config'],
    });

    expect(initialized.paperSequence).toBe(0);
    expect(store.appendDomainEvent).toHaveBeenCalledTimes(1);

    const loaded = await service.load(context.runId);
    expect(loaded).toEqual(initialized);
  });

  it('replays before every fill and persists only successful simulated fills', async () => {
    const events: FinTechCoreDomainEvent[] = [];
    const store = {
      listDomainEvents: vi.fn(async () => events),
      appendDomainEvent: vi.fn(async (event: FinTechCoreDomainEvent) => { events.push(event); }),
    };
    const service = new PaperTradingWorkflowService(store);
    await service.initialize(context, {
      eventId: 'paper-service-init-1', accountId: 'paper-service-account-1', quoteAssetId: 'USD', assetScale: 8,
      startingQuoteBalance: { atoms: '10000000', scale: 2 }, occurredAt: context.startedAt,
      evidenceRefs: ['evidence://paper/config'],
    });

    const result = await service.simulateAndPersist(context.runId, trade());
    expect(result.status).toBe('FILLED');
    expect(events).toHaveLength(2);
    expect(events[1].eventType).toBe('PAPER_FILL_SIMULATED');
  });

  it('fails closed instead of replacing an existing paper-account initialization', async () => {
    const events: FinTechCoreDomainEvent[] = [];
    const store = {
      listDomainEvents: vi.fn(async () => events),
      appendDomainEvent: vi.fn(async (event: FinTechCoreDomainEvent) => { events.push(event); }),
    };
    const service = new PaperTradingWorkflowService(store);
    const input = {
      eventId: 'paper-service-init-1', accountId: 'paper-service-account-1', quoteAssetId: 'USD', assetScale: 8,
      startingQuoteBalance: { atoms: '10000000', scale: 2 }, occurredAt: context.startedAt,
      evidenceRefs: ['evidence://paper/config'],
    } as const;
    await service.initialize(context, input);
    await expect(service.initialize(context, { ...input, eventId: 'paper-service-init-2' })).rejects.toThrow('already has a paper account');
  });
});
