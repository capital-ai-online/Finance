import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreDomainEvent,
} from '../CoreContracts';
import {
  FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION,
  FINTECH_CORE_PAPER_TRADING_EVENT_VERSION,
  PAPER_ACCOUNTING_MODE,
  PAPER_TRADING_EVENT_TYPES,
  type PaperAccountInitializationInput,
  type PaperAccountInitializationResult,
  type PaperAccountInitializedPayload,
  type PaperAccountState,
  type PaperBpsCostEvidence,
  type PaperFillComputation,
  type PaperFillSimulatedPayload,
  type PaperFixedPoint,
  type PaperFundingCostEvidence,
  type PaperReplayResult,
  type PaperTradeSimulationRequest,
  type PaperTradeSimulationResult,
  type PaperTradingWorkflowContext,
} from './PaperTradingContracts';

const MAX_SCALE = 18;
const BPS_DENOMINATOR = 10_000n;
const INTEGER_PATTERN = /^-?(?:0|[1-9]\d*)$/;

function pow10(scale: number): bigint {
  return 10n ** BigInt(scale);
}

function parseAmount(value: PaperFixedPoint, field: string): bigint {
  if (!Number.isInteger(value.scale) || value.scale < 0 || value.scale > MAX_SCALE) {
    throw new Error(`[FinTechCore][Paper] ${field}.scale must be an integer between 0 and ${MAX_SCALE}.`);
  }
  if (!INTEGER_PATTERN.test(value.atoms)) {
    throw new Error(`[FinTechCore][Paper] ${field}.atoms must be a canonical integer string.`);
  }
  return BigInt(value.atoms);
}

function amount(atoms: bigint, scale: number): PaperFixedPoint {
  return Object.freeze({ atoms: atoms.toString(), scale });
}

function amountEquals(left: PaperFixedPoint, right: PaperFixedPoint): boolean {
  return left.scale === right.scale && left.atoms === right.atoms;
}

function freezeRefs(refs: readonly string[]): readonly string[] {
  return Object.freeze([...refs]);
}

function validateRefs(refs: readonly string[], field: string): void {
  if (refs.length === 0 || refs.some((ref) => !ref.trim())) {
    throw new Error(`[FinTechCore][Paper] ${field} must contain at least one non-empty evidence reference.`);
  }
}

function validateBpsEvidence(value: PaperBpsCostEvidence, field: string): void {
  if (!Number.isInteger(value.bps) || value.bps < 0 || value.bps >= 10_000) {
    throw new Error(`[FinTechCore][Paper] ${field}.bps must be an integer in [0, 10000).`);
  }
  if (value.status === 'APPLIED') {
    validateRefs(value.evidenceRefs, `${field}.evidenceRefs`);
    return;
  }
  if (value.bps !== 0 || !value.reason?.trim()) {
    throw new Error(`[FinTechCore][Paper] ${field} NOT_APPLICABLE requires bps=0 and a reason.`);
  }
}

function validateFundingEvidence(value: PaperFundingCostEvidence, quoteScale: number): bigint {
  const atoms = parseAmount(value.amount, 'costEvidence.funding.amount');
  if (value.amount.scale !== quoteScale || atoms < 0n) {
    throw new Error('[FinTechCore][Paper] funding amount must be non-negative and use the quote scale.');
  }
  if (value.status === 'APPLIED') {
    validateRefs(value.evidenceRefs, 'costEvidence.funding.evidenceRefs');
    return atoms;
  }
  if (atoms !== 0n || !value.reason?.trim()) {
    throw new Error('[FinTechCore][Paper] funding NOT_APPLICABLE requires amount=0 and a reason.');
  }
  return 0n;
}

function ceilDivPositive(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator;
}

function roundedDivPositive(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

function notionalAtoms(
  quantityAtoms: bigint,
  quantityScale: number,
  priceAtoms: bigint,
  roundUp: boolean,
): bigint {
  const numerator = quantityAtoms * priceAtoms;
  const denominator = pow10(quantityScale);
  return roundUp ? ceilDivPositive(numerator, denominator) : numerator / denominator;
}

function normalizedState(state: PaperAccountState): PaperAccountState {
  return Object.freeze({
    ...state,
    quoteBalance: amount(BigInt(state.quoteBalance.atoms), state.quoteBalance.scale),
    assetBalance: amount(BigInt(state.assetBalance.atoms), state.assetBalance.scale),
    averageEntryPrice: amount(BigInt(state.averageEntryPrice.atoms), state.averageEntryPrice.scale),
    realizedPnl: amount(BigInt(state.realizedPnl.atoms), state.realizedPnl.scale),
    totalFees: amount(BigInt(state.totalFees.atoms), state.totalFees.scale),
    totalFunding: amount(BigInt(state.totalFunding.atoms), state.totalFunding.scale),
  });
}

export function initializePaperAccount(
  context: PaperTradingWorkflowContext,
  input: PaperAccountInitializationInput,
): PaperAccountInitializationResult {
  if (context.operatingMode !== 'PAPER') {
    throw new Error('[FinTechCore][Paper] Paper account initialization requires operatingMode=PAPER.');
  }
  if (!input.eventId.trim() || !input.accountId.trim() || !input.quoteAssetId.trim() || !input.occurredAt.trim()) {
    throw new Error('[FinTechCore][Paper] Paper account identity and timestamps are required.');
  }
  validateRefs(input.evidenceRefs, 'initialization.evidenceRefs');
  if (!Number.isInteger(input.assetScale) || input.assetScale < 0 || input.assetScale > MAX_SCALE) {
    throw new Error(`[FinTechCore][Paper] assetScale must be an integer between 0 and ${MAX_SCALE}.`);
  }
  const startingQuoteAtoms = parseAmount(input.startingQuoteBalance, 'startingQuoteBalance');
  if (startingQuoteAtoms <= 0n) {
    throw new Error('[FinTechCore][Paper] startingQuoteBalance must be greater than zero.');
  }

  const zeroQuote = amount(0n, input.startingQuoteBalance.scale);
  const zeroAsset = amount(0n, input.assetScale);
  const state: PaperAccountState = normalizedState({
    paperContractVersion: FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION,
    accountingMode: PAPER_ACCOUNTING_MODE,
    accountId: input.accountId,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    moduleId: context.moduleId,
    decisionVersion: context.decisionVersion,
    assetId: context.asset.assetId,
    quoteAssetId: input.quoteAssetId,
    quoteBalance: input.startingQuoteBalance,
    assetBalance: zeroAsset,
    averageEntryPrice: zeroQuote,
    realizedPnl: zeroQuote,
    totalFees: zeroQuote,
    totalFunding: zeroQuote,
    paperSequence: 0,
    updatedAt: input.occurredAt,
    lastEventId: input.eventId,
  });

  const payload: PaperAccountInitializedPayload = Object.freeze({
    paperContractVersion: FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION,
    kind: PAPER_TRADING_EVENT_TYPES.ACCOUNT_INITIALIZED,
    paperSequence: 0,
    accountingMode: PAPER_ACCOUNTING_MODE,
    accountId: input.accountId,
    quoteAssetId: input.quoteAssetId,
    assetScale: input.assetScale,
    startingQuoteBalance: amount(startingQuoteAtoms, input.startingQuoteBalance.scale),
  });

  const event: FinTechCoreDomainEvent<PaperAccountInitializedPayload> = Object.freeze({
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    eventId: input.eventId,
    eventType: PAPER_TRADING_EVENT_TYPES.ACCOUNT_INITIALIZED,
    eventVersion: FINTECH_CORE_PAPER_TRADING_EVENT_VERSION,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    moduleId: context.moduleId,
    assetId: context.asset.assetId,
    decisionVersion: context.decisionVersion,
    occurredAt: input.occurredAt,
    evidenceRefs: freezeRefs(input.evidenceRefs),
    payload,
  });

  return Object.freeze({ state, event });
}

function reject(
  state: PaperAccountState,
  code: Extract<PaperTradeSimulationResult, { status: 'REJECTED' }>['code'],
  reason: string,
): PaperTradeSimulationResult {
  return Object.freeze({ status: 'REJECTED', state, code, reason });
}

export function simulatePaperTrade(
  state: PaperAccountState,
  request: PaperTradeSimulationRequest,
): PaperTradeSimulationResult {
  if (!request.eventId.trim() || !request.fillId.trim() || !request.occurredAt.trim()) {
    return reject(state, 'INVALID_REQUEST', 'eventId, fillId and occurredAt are required.');
  }
  try {
    validateRefs(request.evidenceRefs, 'trade.evidenceRefs');
    validateBpsEvidence(request.costEvidence.fee, 'costEvidence.fee');
    validateBpsEvidence(request.costEvidence.slippage, 'costEvidence.slippage');
  } catch (error) {
    return reject(state, 'INVALID_COST_EVIDENCE', error instanceof Error ? error.message : String(error));
  }

  let quantityAtoms: bigint;
  let referencePriceAtoms: bigint;
  let fundingAtoms: bigint;
  try {
    quantityAtoms = parseAmount(request.quantity, 'quantity');
    referencePriceAtoms = parseAmount(request.referencePrice, 'referencePrice');
    if (request.quantity.scale !== state.assetBalance.scale || request.referencePrice.scale !== state.quoteBalance.scale) {
      return reject(state, 'INVALID_REQUEST', 'quantity/referencePrice scales must match the paper account scales.');
    }
    if (quantityAtoms <= 0n || referencePriceAtoms <= 0n) {
      return reject(state, 'INVALID_REQUEST', 'quantity and referencePrice must be greater than zero.');
    }
    fundingAtoms = validateFundingEvidence(request.costEvidence.funding, state.quoteBalance.scale);
  } catch (error) {
    return reject(state, 'INVALID_COST_EVIDENCE', error instanceof Error ? error.message : String(error));
  }

  const quoteScale = state.quoteBalance.scale;
  const quoteBefore = parseAmount(state.quoteBalance, 'state.quoteBalance');
  const assetBefore = parseAmount(state.assetBalance, 'state.assetBalance');
  const avgBefore = parseAmount(state.averageEntryPrice, 'state.averageEntryPrice');
  const realizedBefore = parseAmount(state.realizedPnl, 'state.realizedPnl');
  const feesBefore = parseAmount(state.totalFees, 'state.totalFees');
  const fundingBefore = parseAmount(state.totalFunding, 'state.totalFunding');
  const slippageBps = BigInt(request.costEvidence.slippage.bps);
  const feeBps = BigInt(request.costEvidence.fee.bps);

  const fillPriceAtoms = request.side === 'BUY'
    ? ceilDivPositive(referencePriceAtoms * (BPS_DENOMINATOR + slippageBps), BPS_DENOMINATOR)
    : (referencePriceAtoms * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;
  if (fillPriceAtoms <= 0n) {
    return reject(state, 'INVALID_REQUEST', 'slippage evidence produced a non-positive simulated fill price.');
  }

  const grossNotionalAtoms = notionalAtoms(
    quantityAtoms,
    request.quantity.scale,
    fillPriceAtoms,
    request.side === 'BUY',
  );
  const feeAtoms = request.costEvidence.fee.status === 'APPLIED'
    ? ceilDivPositive(grossNotionalAtoms * feeBps, BPS_DENOMINATOR)
    : 0n;

  let quoteAfter: bigint;
  let assetAfter: bigint;
  let avgAfter: bigint;
  let realizedDelta = 0n;

  if (request.side === 'BUY') {
    const debit = grossNotionalAtoms + feeAtoms + fundingAtoms;
    if (quoteBefore < debit) {
      return reject(state, 'INSUFFICIENT_QUOTE_BALANCE', 'simulated quote balance is insufficient for notional plus explicit costs.');
    }
    quoteAfter = quoteBefore - debit;
    assetAfter = assetBefore + quantityAtoms;
    const weightedEntryNumerator = avgBefore * assetBefore + fillPriceAtoms * quantityAtoms;
    avgAfter = assetAfter === 0n ? 0n : roundedDivPositive(weightedEntryNumerator, assetAfter);
  } else {
    if (assetBefore < quantityAtoms) {
      return reject(state, 'INSUFFICIENT_ASSET_BALANCE', 'CASH_LONG_ONLY paper mode does not permit short selling.');
    }
    const proceedsAfterCosts = grossNotionalAtoms - feeAtoms - fundingAtoms;
    if (proceedsAfterCosts < 0n) {
      return reject(state, 'INVALID_COST_EVIDENCE', 'explicit costs exceed simulated gross proceeds.');
    }
    quoteAfter = quoteBefore + proceedsAfterCosts;
    assetAfter = assetBefore - quantityAtoms;
    realizedDelta = ((fillPriceAtoms - avgBefore) * quantityAtoms) / pow10(request.quantity.scale);
    avgAfter = assetAfter === 0n ? 0n : avgBefore;
  }

  const realizedAfter = realizedBefore + realizedDelta;
  const totalFeesAfter = feesBefore + feeAtoms;
  const totalFundingAfter = fundingBefore + fundingAtoms;
  const nextSequence = state.paperSequence + 1;

  const nextState = normalizedState({
    ...state,
    quoteBalance: amount(quoteAfter, quoteScale),
    assetBalance: amount(assetAfter, state.assetBalance.scale),
    averageEntryPrice: amount(avgAfter, quoteScale),
    realizedPnl: amount(realizedAfter, quoteScale),
    totalFees: amount(totalFeesAfter, quoteScale),
    totalFunding: amount(totalFundingAfter, quoteScale),
    paperSequence: nextSequence,
    updatedAt: request.occurredAt,
    lastEventId: request.eventId,
  });

  const computed: PaperFillComputation = Object.freeze({
    fillPrice: amount(fillPriceAtoms, quoteScale),
    grossNotional: amount(grossNotionalAtoms, quoteScale),
    feeAmount: amount(feeAtoms, quoteScale),
    fundingAmount: amount(fundingAtoms, quoteScale),
    quoteBalanceBefore: amount(quoteBefore, quoteScale),
    quoteBalanceAfter: nextState.quoteBalance,
    assetBalanceBefore: amount(assetBefore, state.assetBalance.scale),
    assetBalanceAfter: nextState.assetBalance,
    averageEntryPriceBefore: amount(avgBefore, quoteScale),
    averageEntryPriceAfter: nextState.averageEntryPrice,
    realizedPnlDelta: amount(realizedDelta, quoteScale),
    realizedPnlAfter: nextState.realizedPnl,
    totalFeesAfter: nextState.totalFees,
    totalFundingAfter: nextState.totalFunding,
  });

  const payload: PaperFillSimulatedPayload = Object.freeze({
    paperContractVersion: FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION,
    kind: PAPER_TRADING_EVENT_TYPES.FILL_SIMULATED,
    paperSequence: nextSequence,
    accountId: state.accountId,
    request: Object.freeze({
      ...request,
      evidenceRefs: freezeRefs(request.evidenceRefs),
      costEvidence: Object.freeze({
        fee: Object.freeze({ ...request.costEvidence.fee, evidenceRefs: freezeRefs(request.costEvidence.fee.evidenceRefs) }),
        slippage: Object.freeze({ ...request.costEvidence.slippage, evidenceRefs: freezeRefs(request.costEvidence.slippage.evidenceRefs) }),
        funding: Object.freeze({ ...request.costEvidence.funding, evidenceRefs: freezeRefs(request.costEvidence.funding.evidenceRefs) }),
      }),
    }),
    computed,
  });

  const event: FinTechCoreDomainEvent<PaperFillSimulatedPayload> = Object.freeze({
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    eventId: request.eventId,
    eventType: PAPER_TRADING_EVENT_TYPES.FILL_SIMULATED,
    eventVersion: FINTECH_CORE_PAPER_TRADING_EVENT_VERSION,
    runId: state.runId,
    traceId: state.traceId,
    correlationId: state.correlationId,
    causationId: state.lastEventId,
    moduleId: state.moduleId,
    assetId: state.assetId,
    decisionVersion: state.decisionVersion,
    occurredAt: request.occurredAt,
    evidenceRefs: freezeRefs(request.evidenceRefs),
    payload,
  });

  return Object.freeze({ status: 'FILLED', state: nextState, event });
}

function paperSequence(event: FinTechCoreDomainEvent): number | null {
  const value = (event.payload as Record<string, unknown>).paperSequence;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function isPaperEvent(event: FinTechCoreDomainEvent): boolean {
  return event.eventType === PAPER_TRADING_EVENT_TYPES.ACCOUNT_INITIALIZED
    || event.eventType === PAPER_TRADING_EVENT_TYPES.FILL_SIMULATED;
}

function computationEquals(left: PaperFillComputation, right: PaperFillComputation): boolean {
  return amountEquals(left.fillPrice, right.fillPrice)
    && amountEquals(left.grossNotional, right.grossNotional)
    && amountEquals(left.feeAmount, right.feeAmount)
    && amountEquals(left.fundingAmount, right.fundingAmount)
    && amountEquals(left.quoteBalanceBefore, right.quoteBalanceBefore)
    && amountEquals(left.quoteBalanceAfter, right.quoteBalanceAfter)
    && amountEquals(left.assetBalanceBefore, right.assetBalanceBefore)
    && amountEquals(left.assetBalanceAfter, right.assetBalanceAfter)
    && amountEquals(left.averageEntryPriceBefore, right.averageEntryPriceBefore)
    && amountEquals(left.averageEntryPriceAfter, right.averageEntryPriceAfter)
    && amountEquals(left.realizedPnlDelta, right.realizedPnlDelta)
    && amountEquals(left.realizedPnlAfter, right.realizedPnlAfter)
    && amountEquals(left.totalFeesAfter, right.totalFeesAfter)
    && amountEquals(left.totalFundingAfter, right.totalFundingAfter);
}

export function replayPaperTradingEvents(events: readonly FinTechCoreDomainEvent[]): PaperReplayResult {
  const paperEvents = events.filter(isPaperEvent);
  if (paperEvents.length === 0) {
    return { status: 'REPLAY_REJECTED', reason: 'No durable paper-trading events exist for the workflow run.' };
  }

  const sorted = [...paperEvents].sort((left, right) => {
    const leftSequence = paperSequence(left) ?? Number.MAX_SAFE_INTEGER;
    const rightSequence = paperSequence(right) ?? Number.MAX_SAFE_INTEGER;
    return leftSequence - rightSequence || left.eventId.localeCompare(right.eventId);
  });

  const first = sorted[0];
  if (first.eventType !== PAPER_TRADING_EVENT_TYPES.ACCOUNT_INITIALIZED || paperSequence(first) !== 0) {
    return { status: 'REPLAY_REJECTED', reason: 'Paper replay must start with PAPER_ACCOUNT_INITIALIZED sequence 0.' };
  }
  if (first.contractVersion !== FINTECH_CORE_CONTRACT_VERSION
      || first.eventVersion !== FINTECH_CORE_PAPER_TRADING_EVENT_VERSION) {
    return { status: 'REPLAY_REJECTED', reason: 'Paper initialization uses an unsupported event contract version.' };
  }

  const initPayload = first.payload as PaperAccountInitializedPayload;
  if (initPayload.paperContractVersion !== FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION
      || initPayload.kind !== PAPER_TRADING_EVENT_TYPES.ACCOUNT_INITIALIZED) {
    return { status: 'REPLAY_REJECTED', reason: 'Paper initialization payload is not canonical.' };
  }

  let state: PaperAccountState;
  try {
    const startingQuoteAtoms = parseAmount(initPayload.startingQuoteBalance, 'replay.startingQuoteBalance');
    if (startingQuoteAtoms <= 0n || !Number.isInteger(initPayload.assetScale) || initPayload.assetScale < 0 || initPayload.assetScale > MAX_SCALE) {
      return { status: 'REPLAY_REJECTED', reason: 'Paper initialization payload contains invalid balances or scales.' };
    }
    const zeroQuote = amount(0n, initPayload.startingQuoteBalance.scale);
    state = normalizedState({
      paperContractVersion: FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION,
      accountingMode: PAPER_ACCOUNTING_MODE,
      accountId: initPayload.accountId,
      runId: first.runId,
      traceId: first.traceId,
      correlationId: first.correlationId,
      moduleId: first.moduleId,
      decisionVersion: first.decisionVersion,
      assetId: first.assetId,
      quoteAssetId: initPayload.quoteAssetId,
      quoteBalance: amount(startingQuoteAtoms, initPayload.startingQuoteBalance.scale),
      assetBalance: amount(0n, initPayload.assetScale),
      averageEntryPrice: zeroQuote,
      realizedPnl: zeroQuote,
      totalFees: zeroQuote,
      totalFunding: zeroQuote,
      paperSequence: 0,
      updatedAt: first.occurredAt,
      lastEventId: first.eventId,
    });
  } catch (error) {
    return { status: 'REPLAY_REJECTED', reason: error instanceof Error ? error.message : String(error) };
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const event = sorted[index];
    if (event.eventType !== PAPER_TRADING_EVENT_TYPES.FILL_SIMULATED || paperSequence(event) !== index) {
      return { status: 'REPLAY_REJECTED', reason: `Paper event sequence is not contiguous at index ${index}.` };
    }
    if (event.runId !== state.runId
        || event.traceId !== state.traceId
        || event.correlationId !== state.correlationId
        || event.moduleId !== state.moduleId
        || event.assetId !== state.assetId
        || event.decisionVersion !== state.decisionVersion
        || event.causationId !== state.lastEventId) {
      return { status: 'REPLAY_REJECTED', reason: `Paper event ${event.eventId} breaks workflow correlation or causation.` };
    }
    if (event.contractVersion !== FINTECH_CORE_CONTRACT_VERSION
        || event.eventVersion !== FINTECH_CORE_PAPER_TRADING_EVENT_VERSION) {
      return { status: 'REPLAY_REJECTED', reason: `Paper event ${event.eventId} uses an unsupported event contract version.` };
    }

    const payload = event.payload as PaperFillSimulatedPayload;
    if (payload.paperContractVersion !== FINTECH_CORE_PAPER_TRADING_CONTRACT_VERSION
        || payload.kind !== PAPER_TRADING_EVENT_TYPES.FILL_SIMULATED
        || payload.accountId !== state.accountId
        || payload.paperSequence !== index
        || payload.request.eventId !== event.eventId) {
      return { status: 'REPLAY_REJECTED', reason: `Paper event ${event.eventId} has a non-canonical payload.` };
    }

    const simulated = simulatePaperTrade(state, payload.request);
    if (simulated.status !== 'FILLED') {
      return { status: 'REPLAY_REJECTED', reason: `Paper event ${event.eventId} cannot be deterministically re-simulated: ${simulated.reason}` };
    }
    if (!computationEquals(simulated.event.payload.computed, payload.computed)) {
      return { status: 'REPLAY_REJECTED', reason: `Paper event ${event.eventId} computation does not match deterministic replay.` };
    }
    state = simulated.state;
  }

  return Object.freeze({ status: 'REPLAYED', state });
}
