import { createHash } from 'node:crypto';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
  type FinTechCoreDecisionRecord,
  type FinTechCoreOrderIntent,
  type FinTechCoreOrderPriceBounds,
  type FinTechCoreWorkflowContext,
} from '../CoreContracts';
import {
  compareFinTechCoreFixedPoint,
  normalizeFinTechCoreFixedPoint,
  type FinTechCoreFixedPoint,
} from '../Financial/FixedPoint';
import {
  FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
  FINTECH_CORE_RISK_DECISION_TYPE,
} from '../RiskCompliance/RiskComplianceContracts';

export const FINTECH_CORE_ORDER_INTENT_BINDING_VERSION =
  'fintech-core/order-intent-binding/0.2.0' as const;

export type FinTechCoreOrderIntentBindingFailureCode =
  | 'MODE_NOT_ALLOWED'
  | 'RISK_DECISION_NOT_APPROVED'
  | 'COMPLIANCE_DECISION_NOT_APPROVED'
  | 'RISK_DECISION_TYPE_MISMATCH'
  | 'COMPLIANCE_DECISION_TYPE_MISMATCH'
  | 'DECISION_CONTEXT_MISMATCH'
  | 'DECISION_HASH_MISSING'
  | 'POLICY_BINDING_MISSING'
  | 'INVALID_TIMESTAMP'
  | 'EXPIRED_INTENT'
  | 'INVALID_FIXED_POINT'
  | 'INVALID_ORDER_INTENT';

export interface FinTechCoreOrderIntentBindingInput {
  readonly context: FinTechCoreWorkflowContext;
  readonly riskDecision: FinTechCoreDecisionRecord;
  readonly complianceDecision: FinTechCoreDecisionRecord;
  readonly orderIntentId: string;
  readonly side: FinTechCoreOrderIntent['side'];
  readonly quantity: FinTechCoreFixedPoint;
  readonly orderType: FinTechCoreOrderIntent['orderType'];
  readonly priceBounds: FinTechCoreOrderPriceBounds;
  readonly maxSlippageBps: number;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export type FinTechCoreOrderIntentBindingResult =
  | Readonly<{
      status: 'BOUND';
      intent: FinTechCoreOrderIntent;
      evidenceRefs: readonly string[];
      executionHandoffEligible: false;
    }>
  | Readonly<{
      status: 'NOT_AUTHORIZED';
      code: FinTechCoreOrderIntentBindingFailureCode;
      reason: string;
      executionHandoffEligible: false;
    }>;

export interface FinTechCoreOrderIntentIntegritySource {
  readonly orderIntentId: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly assetId: string;
  readonly strategyId?: string;
  readonly portfolioId?: string;
  readonly decisionVersion: string;
  readonly side: FinTechCoreOrderIntent['side'];
  readonly quantity: FinTechCoreFixedPoint;
  readonly orderType: FinTechCoreOrderIntent['orderType'];
  readonly priceBounds: FinTechCoreOrderPriceBounds;
  readonly maxSlippageBps: number;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly riskDecisionId: string;
  readonly riskDecisionHash: string;
  readonly riskPolicyId: string;
  readonly riskPolicyVersion: string;
  readonly complianceDecisionId: string;
  readonly complianceDecisionHash: string;
  readonly compliancePolicyId: string;
  readonly compliancePolicyVersion: string;
}

export interface FinTechCoreOrderIntentIntegrity {
  readonly idempotencyKey: string;
  readonly clientOrderId: string;
  readonly intentHash: string;
}

function deny(
  code: FinTechCoreOrderIntentBindingFailureCode,
  reason: string,
): FinTechCoreOrderIntentBindingResult {
  return Object.freeze({
    status: 'NOT_AUTHORIZED' as const,
    code,
    reason,
    executionHandoffEligible: false as const,
  });
}

function isIsoTimestamp(value: string): boolean {
  return Boolean(value.trim()) && Number.isFinite(Date.parse(value));
}

function required(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

function sameDecisionContext(
  context: FinTechCoreWorkflowContext,
  record: FinTechCoreDecisionRecord,
): boolean {
  return record.runId === context.runId
    && record.traceId === context.traceId
    && record.correlationId === context.correlationId
    && record.moduleId === context.moduleId
    && record.assetId === context.asset.assetId
    && record.decisionVersion === context.decisionVersion;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;

  const source = value as Readonly<Record<string, unknown>>;
  return Object.keys(source).sort().reduce<Record<string, unknown>>((result, key) => {
    const entry = source[key];
    if (entry !== undefined) result[key] = canonicalize(entry);
    return result;
  }, {});
}

function sha256(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')}`;
}

function uniqueEvidenceRefs(...groups: readonly (readonly string[])[]): readonly string[] {
  return Object.freeze([
    ...new Set(groups.flat().map((value) => value.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b)));
}

function normalizePriceBounds(
  orderType: FinTechCoreOrderIntent['orderType'],
  bounds: FinTechCoreOrderPriceBounds,
): FinTechCoreOrderPriceBounds {
  const normalized: FinTechCoreOrderPriceBounds = Object.freeze({
    limitPrice: bounds.limitPrice
      ? normalizeFinTechCoreFixedPoint(bounds.limitPrice, 'priceBounds.limitPrice')
      : undefined,
    minPrice: bounds.minPrice
      ? normalizeFinTechCoreFixedPoint(bounds.minPrice, 'priceBounds.minPrice')
      : undefined,
    maxPrice: bounds.maxPrice
      ? normalizeFinTechCoreFixedPoint(bounds.maxPrice, 'priceBounds.maxPrice')
      : undefined,
  });

  const requiresLimitPrice = orderType === 'LIMIT' || orderType === 'POST_ONLY';
  if (requiresLimitPrice && !normalized.limitPrice) {
    throw new Error('LIMIT/POST_ONLY OrderIntent requires priceBounds.limitPrice.');
  }
  if (
    normalized.minPrice
    && normalized.maxPrice
    && compareFinTechCoreFixedPoint(normalized.minPrice, normalized.maxPrice) > 0
  ) {
    throw new Error('priceBounds.minPrice must not exceed priceBounds.maxPrice.');
  }
  if (
    normalized.limitPrice
    && normalized.minPrice
    && compareFinTechCoreFixedPoint(normalized.limitPrice, normalized.minPrice) < 0
  ) {
    throw new Error('priceBounds.limitPrice must not be below priceBounds.minPrice.');
  }
  if (
    normalized.limitPrice
    && normalized.maxPrice
    && compareFinTechCoreFixedPoint(normalized.limitPrice, normalized.maxPrice) > 0
  ) {
    throw new Error('priceBounds.limitPrice must not exceed priceBounds.maxPrice.');
  }

  return normalized;
}

function immutableExecutionPayload(source: FinTechCoreOrderIntentIntegritySource): Readonly<Record<string, unknown>> {
  return Object.freeze({
    orderIntentContractVersion: FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
    bindingVersion: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    orderIntentId: source.orderIntentId,
    runId: source.runId,
    traceId: source.traceId,
    correlationId: source.correlationId,
    assetId: source.assetId,
    strategyId: source.strategyId ?? null,
    portfolioId: source.portfolioId ?? null,
    decisionVersion: source.decisionVersion,
    side: source.side,
    quantity: source.quantity,
    orderType: source.orderType,
    priceBounds: source.priceBounds,
    maxSlippageBps: source.maxSlippageBps,
    createdAt: source.createdAt,
    expiresAt: source.expiresAt,
    riskDecisionId: source.riskDecisionId,
    riskDecisionHash: source.riskDecisionHash,
    riskPolicyId: source.riskPolicyId,
    riskPolicyVersion: source.riskPolicyVersion,
    complianceDecisionId: source.complianceDecisionId,
    complianceDecisionHash: source.complianceDecisionHash,
    compliancePolicyId: source.compliancePolicyId,
    compliancePolicyVersion: source.compliancePolicyVersion,
  });
}

/** Deterministically reproduces all replay identities and the immutable intent hash. */
export function deriveOrderIntentIntegrity(
  source: FinTechCoreOrderIntentIntegritySource,
): FinTechCoreOrderIntentIntegrity {
  const payload = immutableExecutionPayload(source);
  const idempotencyKey = sha256({
    purpose: 'FINTECH_CORE_ORDER_INTENT_IDEMPOTENCY',
    payload,
  });
  const clientOrderHash = sha256({
    purpose: 'FINTECH_CORE_CLIENT_ORDER_ID',
    orderIntentId: source.orderIntentId,
    runId: source.runId,
    assetId: source.assetId,
  });
  const clientOrderId = `cai_${clientOrderHash.slice('sha256:'.length, 'sha256:'.length + 32)}`;
  const intentHash = sha256({ ...payload, clientOrderId, idempotencyKey });
  return Object.freeze({ idempotencyKey, clientOrderId, intentHash });
}

export function isOrderIntentExpired(intent: FinTechCoreOrderIntent, observedAt: string): boolean {
  if (!isIsoTimestamp(observedAt) || !isIsoTimestamp(intent.expiresAt)) return true;
  return Date.parse(observedAt) >= Date.parse(intent.expiresAt);
}

/**
 * FT-6B deterministic binding from authoritative FT-5 decision evidence to the single canonical
 * OrderIntent contract.
 *
 * PAPER is the only allowed mode. Risk/compliance approvals, policy identity, decision hashes,
 * client-order identity and idempotency are derived by this service and cannot be supplied by an
 * LLM/agent/caller as approval flags. GUARDED_LIVE and PRODUCTION remain blocked until FT-7+.
 */
export function bindApprovedOrderIntent(
  input: FinTechCoreOrderIntentBindingInput,
): FinTechCoreOrderIntentBindingResult {
  const { context, riskDecision, complianceDecision } = input;

  if (context.operatingMode !== 'PAPER') {
    return deny(
      'MODE_NOT_ALLOWED',
      `FT-6 OrderIntent binding is PAPER-only; received ${context.operatingMode}.`,
    );
  }
  if (riskDecision.decisionType !== FINTECH_CORE_RISK_DECISION_TYPE) {
    return deny('RISK_DECISION_TYPE_MISMATCH', 'Risk decision type is not PRE_TRADE_RISK_GATE.');
  }
  if (complianceDecision.decisionType !== FINTECH_CORE_COMPLIANCE_DECISION_TYPE) {
    return deny(
      'COMPLIANCE_DECISION_TYPE_MISMATCH',
      'Compliance decision type is not PRE_TRADE_COMPLIANCE_GATE.',
    );
  }
  if (riskDecision.outcome !== 'APPROVED') {
    return deny('RISK_DECISION_NOT_APPROVED', 'Risk decision is not APPROVED.');
  }
  if (complianceDecision.outcome !== 'APPROVED') {
    return deny('COMPLIANCE_DECISION_NOT_APPROVED', 'Compliance decision is not APPROVED.');
  }
  if (!sameDecisionContext(context, riskDecision) || !sameDecisionContext(context, complianceDecision)) {
    return deny(
      'DECISION_CONTEXT_MISMATCH',
      'Risk/compliance decision identity does not match the workflow context.',
    );
  }
  if (!required(riskDecision.outputHash) || !required(complianceDecision.outputHash)) {
    return deny('DECISION_HASH_MISSING', 'Risk/compliance decision output hash is required.');
  }
  if (
    !required(riskDecision.policyId)
    || !required(riskDecision.policyVersion)
    || !required(complianceDecision.policyId)
    || !required(complianceDecision.policyVersion)
  ) {
    return deny(
      'POLICY_BINDING_MISSING',
      'Risk/compliance policyId and policyVersion are required for immutable FT-6 binding.',
    );
  }

  if (
    !isIsoTimestamp(input.createdAt)
    || !isIsoTimestamp(input.expiresAt)
    || !isIsoTimestamp(riskDecision.decidedAt)
    || !isIsoTimestamp(complianceDecision.decidedAt)
  ) {
    return deny('INVALID_TIMESTAMP', 'Decision, createdAt and expiresAt timestamps must be valid ISO timestamps.');
  }
  const createdAtMs = Date.parse(input.createdAt);
  const expiresAtMs = Date.parse(input.expiresAt);
  if (expiresAtMs <= createdAtMs) {
    return deny('EXPIRED_INTENT', 'OrderIntent expiry must be strictly after creation.');
  }
  if (Date.parse(riskDecision.decidedAt) > createdAtMs || Date.parse(complianceDecision.decidedAt) > createdAtMs) {
    return deny('INVALID_TIMESTAMP', 'OrderIntent cannot predate its risk/compliance decisions.');
  }

  if (
    !required(input.orderIntentId)
    || !Number.isInteger(input.maxSlippageBps)
    || input.maxSlippageBps < 0
    || input.maxSlippageBps > 10_000
  ) {
    return deny('INVALID_ORDER_INTENT', 'OrderIntent identity or slippage bounds are invalid.');
  }

  let quantity: FinTechCoreFixedPoint;
  let priceBounds: FinTechCoreOrderPriceBounds;
  try {
    quantity = normalizeFinTechCoreFixedPoint(input.quantity, 'quantity');
    priceBounds = normalizePriceBounds(input.orderType, input.priceBounds);
  } catch (error) {
    return deny(
      'INVALID_FIXED_POINT',
      error instanceof Error ? error.message : 'Invalid fixed-point quantity or price bound.',
    );
  }

  const evidenceRefs = uniqueEvidenceRefs(riskDecision.evidenceRefs, complianceDecision.evidenceRefs, [
    `decision://${riskDecision.decisionId}`,
    `decision://${complianceDecision.decisionId}`,
  ]);

  const integritySource: FinTechCoreOrderIntentIntegritySource = Object.freeze({
    orderIntentId: input.orderIntentId,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    assetId: context.asset.assetId,
    strategyId: context.strategyId,
    portfolioId: context.portfolioId,
    decisionVersion: context.decisionVersion,
    side: input.side,
    quantity,
    orderType: input.orderType,
    priceBounds,
    maxSlippageBps: input.maxSlippageBps,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    riskDecisionId: riskDecision.decisionId,
    riskDecisionHash: riskDecision.outputHash,
    riskPolicyId: riskDecision.policyId,
    riskPolicyVersion: riskDecision.policyVersion,
    complianceDecisionId: complianceDecision.decisionId,
    complianceDecisionHash: complianceDecision.outputHash,
    compliancePolicyId: complianceDecision.policyId,
    compliancePolicyVersion: complianceDecision.policyVersion,
  });
  const integrity = deriveOrderIntentIntegrity(integritySource);

  const intent: FinTechCoreOrderIntent = Object.freeze({
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    orderIntentContractVersion: FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION,
    bindingState: 'BOUND',
    bindingVersion: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
    orderIntentId: input.orderIntentId,
    clientOrderId: integrity.clientOrderId,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    idempotencyKey: integrity.idempotencyKey,
    assetId: context.asset.assetId,
    side: input.side,
    quantity,
    orderType: input.orderType,
    priceBounds,
    maxSlippageBps: input.maxSlippageBps,
    strategyId: context.strategyId,
    portfolioId: context.portfolioId,
    decisionVersion: context.decisionVersion,
    riskApproval: 'APPROVED',
    complianceApproval: 'APPROVED',
    riskDecisionId: riskDecision.decisionId,
    riskDecisionHash: riskDecision.outputHash,
    riskPolicyId: riskDecision.policyId,
    riskPolicyVersion: riskDecision.policyVersion,
    complianceDecisionId: complianceDecision.decisionId,
    complianceDecisionHash: complianceDecision.outputHash,
    compliancePolicyId: complianceDecision.policyId,
    compliancePolicyVersion: complianceDecision.policyVersion,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    intentHash: integrity.intentHash,
    effectClass: 'SIDE_EFFECTING',
  });

  return Object.freeze({
    status: 'BOUND' as const,
    intent,
    evidenceRefs,
    executionHandoffEligible: false as const,
  });
}
