import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreWorkflowContext,
} from '../../src/platform/FinTechCore/CoreContracts';
import {
  initializePaperAccount,
  replayPaperTradingEvents,
  simulatePaperTrade,
} from '../../src/platform/FinTechCore/PaperTrading/PaperTradingEngine';
import type { PaperTradeSimulationRequest } from '../../src/platform/FinTechCore/PaperTrading/PaperTradingContracts';
import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../../src/platform/Scoring/contracts';

const context: FinTechCoreWorkflowContext = {
  contractVersion: FINTECH_CORE_CONTRACT_VERSION,
  moduleId: 'fintech-core.crypto',
  runId: 'run-ft4-paper-1',
  traceId: 'trace-ft4-paper-1',
  correlationId: 'corr-ft4-paper-1',
  strategyId: 'strategy-paper-1',
  portfolioId: 'portfolio-paper-1',
  decisionVersion: 'decision/paper-v1',
  operatingMode: 'PAPER',
  asset: {
    contractVersion: UNIVERSAL_ASSET_CONTRACT_VERSION,
    assetId: 'crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    source: 'registry',
  },
  startedAt: '2026-08-21T07:30:00.000Z',
};

function initial() {
  return initializePaperAccount(context, {
    eventId: 'paper-init-1',
    accountId: 'paper-account-1',
    quoteAssetId: 'USD',
    assetScale: 8,
    startingQuoteBalance: { atoms: '10000000', scale: 2 },
    occurredAt: '2026-08-21T07:30:00.000Z',
    evidenceRefs: ['evidence://paper/account-config'],
  });
}

function request(side: 'BUY' | 'SELL', eventId: string, referencePriceAtoms: string): PaperTradeSimulationRequest {
  return {
    eventId,
    fillId: `${eventId}-fill`,
    side,
    quantity: { atoms: '1000000', scale: 8 },
    referencePrice: { atoms: referencePriceAtoms, scale: 2 },
    occurredAt: side === 'BUY' ? '2026-08-21T07:31:00.000Z' : '2026-08-21T07:32:00.000Z',
    costEvidence: {
      fee: { status: 'APPLIED', bps: 20, evidenceRefs: ['evidence://paper/fee-model'] },
      slippage: { status: 'APPLIED', bps: 10, evidenceRefs: ['evidence://paper/slippage-model'] },
      funding: {
        status: 'NOT_APPLICABLE',
        amount: { atoms: '0', scale: 2 },
        evidenceRefs: [],
        reason: 'Spot cash paper model has no funding payment.',
      },
    },
    evidenceRefs: ['evidence://market/BTCUSD/reference-price'],
  };
}

describe('FinTech Core FT-4 paper trading', () => {
  it('requires PAPER mode and never initializes from RESEARCH', () => {
    expect(() => initializePaperAccount({ ...context, operatingMode: 'RESEARCH' }, {
      eventId: 'paper-init-research',
      accountId: 'paper-account-research',
      quoteAssetId: 'USD',
      assetScale: 8,
      startingQuoteBalance: { atoms: '10000', scale: 2 },
      occurredAt: '2026-08-21T07:30:00.000Z',
      evidenceRefs: ['evidence://paper/account-config'],
    })).toThrow('operatingMode=PAPER');
  });

  it('simulates a BUY with explicit slippage and fee evidence using fixed-point balances', () => {
    const initialized = initial();
    const result = simulatePaperTrade(initialized.state, request('BUY', 'paper-buy-1', '5000000'));

    expect(result.status).toBe('FILLED');
    if (result.status !== 'FILLED') return;

    expect(result.event.eventType).toBe('PAPER_FILL_SIMULATED');
    expect(result.event.causationId).toBe('paper-init-1');
    expect(result.event.payload.computed.fillPrice).toEqual({ atoms: '5005000', scale: 2 });
    expect(result.event.payload.computed.grossNotional).toEqual({ atoms: '50050', scale: 2 });
    expect(result.event.payload.computed.feeAmount).toEqual({ atoms: '101', scale: 2 });
    expect(result.state.quoteBalance).toEqual({ atoms: '9949849', scale: 2 });
    expect(result.state.assetBalance).toEqual({ atoms: '1000000', scale: 8 });
    expect(result.state.averageEntryPrice).toEqual({ atoms: '5005000', scale: 2 });
    expect(result.state.totalFees).toEqual({ atoms: '101', scale: 2 });
    expect(result.state.totalFunding).toEqual({ atoms: '0', scale: 2 });
    expect(result.state.paperSequence).toBe(1);
  });

  it('closes the cash-long position without shorting and preserves gross realized PnL separately from costs', () => {
    const initialized = initial();
    const bought = simulatePaperTrade(initialized.state, request('BUY', 'paper-buy-1', '5000000'));
    if (bought.status !== 'FILLED') throw new Error('test setup failed');
    const sold = simulatePaperTrade(bought.state, request('SELL', 'paper-sell-1', '5500000'));

    expect(sold.status).toBe('FILLED');
    if (sold.status !== 'FILLED') return;
    expect(sold.event.payload.computed.fillPrice).toEqual({ atoms: '5494500', scale: 2 });
    expect(sold.event.payload.computed.grossNotional).toEqual({ atoms: '54945', scale: 2 });
    expect(sold.event.payload.computed.feeAmount).toEqual({ atoms: '110', scale: 2 });
    expect(sold.state.quoteBalance).toEqual({ atoms: '10004684', scale: 2 });
    expect(sold.state.assetBalance).toEqual({ atoms: '0', scale: 8 });
    expect(sold.state.averageEntryPrice).toEqual({ atoms: '0', scale: 2 });
    expect(sold.state.realizedPnl).toEqual({ atoms: '4895', scale: 2 });
    expect(sold.state.totalFees).toEqual({ atoms: '211', scale: 2 });
    expect(sold.state.paperSequence).toBe(2);
  });

  it('fails closed when a paper SELL would create a short position', () => {
    const initialized = initial();
    const result = simulatePaperTrade(initialized.state, request('SELL', 'paper-sell-short', '5000000'));
    expect(result).toMatchObject({
      status: 'REJECTED',
      code: 'INSUFFICIENT_ASSET_BALANCE',
    });
    expect(result.state).toBe(initialized.state);
  });

  it('replays durable paper events deterministically and detects tampered calculations', () => {
    const initialized = initial();
    const bought = simulatePaperTrade(initialized.state, request('BUY', 'paper-buy-1', '5000000'));
    if (bought.status !== 'FILLED') throw new Error('test setup failed');

    const replay = replayPaperTradingEvents([initialized.event, bought.event]);
    expect(replay).toMatchObject({ status: 'REPLAYED' });
    if (replay.status === 'REPLAYED') {
      expect(replay.state).toEqual(bought.state);
    }

    const tampered = {
      ...bought.event,
      payload: {
        ...bought.event.payload,
        computed: {
          ...bought.event.payload.computed,
          quoteBalanceAfter: { atoms: '1', scale: 2 },
        },
      },
    };
    const rejected = replayPaperTradingEvents([initialized.event, tampered]);
    expect(rejected).toMatchObject({ status: 'REPLAY_REJECTED' });
    if (rejected.status === 'REPLAY_REJECTED') {
      expect(rejected.reason).toContain('does not match deterministic replay');
    }
  });
});
