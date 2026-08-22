import type { FinTechCoreDomainEvent, FinTechCoreWorkflowContext } from '../CoreContracts';
import type { FinTechCoreFixedPoint } from '../Financial/FixedPoint';

export const FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION =
  'fintech-core/paper-trading/0.1.0' as const;
export const FINTECH_CORE_PAPER_TRADING_EVENT_VERSION =
  'fintech-core/paper-trading-event/0.1.0' as const;
export const PAPER_ACCOUNTING_MODE = 'CASH_LONG_ONLY' as const;

export const PAPER_TRADING_EVENT_TYPES = Object.freeze({
  ACCOUNT_INITIALIZED: 'PAPER_ACCOUNT_INITIALIZED',
  FILL_SIMULATED: 'PAPER_FILL_SIMULATED',
} as const);

/**
 * Backward-compatible FT-4 alias of the single FinTechCore fixed-point representation.
 * No separate paper-only numeric authority exists after FT-6B.
 */
export type PaperFixedPoint = FinTechCoreFixedPoint;

export type PaperCostStatus = 'APPLIED' | 'NOT_APPLICABLE';

export interface PaperBpsCostEvidence {
  readonly status: PaperCostStatus;
  readonly bps: number;
  readonly evidenceRefs: readonly string[];
  readonly reason?: string;
}

export interface PaperFundingCostEvidence {
  readonly status: PaperCostStatus;
  readonly amount: PaperFixedPoint;
  readonly evidenceRefs: readonly string[];
  readonly reason?: string;
}

export interface PaperExecutionCostEvidence {
  readonly fee: PaperBpsCostEvidence;
  readonly slippage: PaperBpsCostEvidence;
  readonly funding: PaperFundingCostEvidence;
}

export interface PaperAccountInitializationInput {
  readonly eventId: string;
  readonly accountId: string;
  readonly quoteAssetId: string;
  readonly assetScale: number;
  readonly startingQuoteBalance: PaperFixedPoint;
  readonly occurredAt: string;
  readonly evidenceRefs: readonly string[];
}

export interface PaperTradeSimulationRequest {
  readonly eventId: string;
  readonly fillId: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: PaperFixedPoint;
  readonly referencePrice: PaperFixedPoint;
  readonly occurredAt: string;
  readonly costEvidence: PaperExecutionCostEvidence;
  readonly evidenceRefs: readonly string[];
}

export interface PaperAccountState {
  readonly paperContractVersion: typeof FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION;
  readonly accountingMode: typeof PAPER_ACCOUNTING_MODE;
  readonly accountId: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly moduleId: string;
  readonly decisionVersion: string;
  readonly assetId: string;
  readonly quoteAssetId: string;
  readonly quoteBalance: PaperFixedPoint;
  readonly assetBalance: PaperFixedPoint;
  readonly averageEntryPrice: PaperFixedPoint;
  readonly realizedPnl: PaperFixedPoint;
  readonly totalFees: PaperFixedPoint;
  readonly totalFunding: PaperFixedPoint;
  readonly paperSequence: number;
  readonly updatedAt: string;
  readonly lastEventId: string;
}

export interface PaperFillComputation {
  readonly fillPrice: PaperFixedPoint;
  readonly grossNotional: PaperFixedPoint;
  readonly feeAmount: PaperFixedPoint;
  readonly fundingAmount: PaperFixedPoint;
  readonly quoteBalanceBefore: PaperFixedPoint;
  readonly quoteBalanceAfter: PaperFixedPoint;
  readonly assetBalanceBefore: PaperFixedPoint;
  readonly assetBalanceAfter: PaperFixedPoint;
  readonly averageEntryPriceBefore: PaperFixedPoint;
  readonly averageEntryPriceAfter: PaperFixedPoint;
  readonly realizedPnlDelta: PaperFixedPoint;
  readonly realizedPnlAfter: PaperFixedPoint;
  readonly totalFeesAfter: PaperFixedPoint;
  readonly totalFundingAfter: PaperFixedPoint;
}

export type PaperAccountInitializedPayload = Readonly<{
  paperContractVersion: typeof FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION;
  kind: typeof PAPER_TRADING_EVENT_TYPES.ACCOUNT_INITIALIZED;
  paperSequence: 0;
  accountingMode: typeof PAPER_ACCOUNTING_MODE;
  accountId: string;
  quoteAssetId: string;
  assetScale: number;
  startingQuoteBalance: PaperFixedPoint;
}>;

export type PaperFillSimulatedPayload = Readonly<{
  paperContractVersion: typeof FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION;
  kind: typeof PAPER_TRADING_EVENT_TYPES.FILL_SIMULATED;
  paperSequence: number;
  accountId: string;
  request: PaperTradeSimulationRequest;
  computed: PaperFillComputation;
}>;

export type PaperTradingDomainEvent =
  | FinTechCoreDomainEvent<PaperAccountInitializedPayload>
  | FinTechCoreDomainEvent<PaperFillSimulatedPayload>;

export interface PaperAccountInitializationResult {
  readonly state: PaperAccountState;
  readonly event: FinTechCoreDomainEvent<PaperAccountInitializedPayload>;
}

export type PaperTradeSimulationResult =
  | {
      readonly status: 'FILLED';
      readonly state: PaperAccountState;
      readonly event: FinTechCoreDomainEvent<PaperFillSimulatedPayload>;
    }
  | {
      readonly status: 'REJECTED';
      readonly state: PaperAccountState;
      readonly code:
        | 'INSUFFICIENT_QUOTE_BALANCE'
        | 'INSUFFICIENT_ASSET_BALANCE'
        | 'INVALID_COST_EVIDENCE'
        | 'INVALID_REQUEST';
      readonly reason: string;
    };

export type PaperReplayResult =
  | { readonly status: 'REPLAYED'; readonly state: PaperAccountState }
  | { readonly status: 'REPLAY_REJECTED'; readonly reason: string };

export type PaperTradingWorkflowContext = FinTechCoreWorkflowContext;
