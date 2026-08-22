import { createHash } from 'node:crypto';
import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreDecisionRecord,
  type FinTechCoreOrderIntent,
  type FinTechCoreWorkflowContext,
} from '../CoreContracts';
import {
  FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
  FINTECH_CORE_RISK_DECISION_TYPE,
} from '../RiskCompliance/RiskComplianceContracts';

export const FINTECH_CORE_ORDER_INTENT_BINDING_VERSION =
  'fintech-core/order-intent-binding/0.1.0' as const;

export type FinTechCoreOrderIntentBindingFailureCode =
  | 'MODE_NOT_ALLOWED'
  | 'RISK_DECISION_NOT_APPROVED'
  | 'COMPLIANCE_DECISION_NOT_APPROVED'
  | 'RISK_DECISION_TYPE_MISMATCH'
  | 'COMPLIANCE_DECISION_TYPE_MISMATCH'
  | 'DECISION_CONTEXT_MISMATCH'
  | 'DECISION_HASH_MISSING'
  | 'INVALID_TIMESTAMP'
  | 'EXPIRED_INTENT'
  | 'INVALID_ORDER_INTENT';

export interface FinTechCoreBoundOrderIntent extends FinTechCoreOrderIntent {
  readonly bindingVersion: typeof FINTECH_CORE_ORDER_INTENT_BINDING_VERSION;
  readonly clientOrderId: string;
  readonly createdAt: string;
  readonly riskDecisionId: string;
  readonly riskDecisionOutputHash: string;
  readonly complianceDecisionId: string;
  readonly complianceDecisionOutputHash: string;
}

export interface FinTechCoreOrderIntentBindingInput {
  readonly context: FinTechCoreWorkflowContext;
  readonly riskDecision: FinTechCoreDecisionRecord;
  readonly complianceDecision: FinTechCoreDecisionRecord;
  readonly orderIntentId: string;
  readonly clientOrderId: string;
  readonly idempotencyKey: string;
  readonly side: FinTechCoreOrderIntent['side'];
  readonly quantity: number;
  readonly orderType: FinTechCoreOrderIntent['orderType'];
  readonly limitPrice?: number;
  readonly maxSlippageBps: number;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export type FinTechCoreOrderIntentBindingResult =
  | Readonly<{
      status: 'BOUND';
      intent: FinTechCoreBoundOrderIntent;
      evidenceRefs: readonly string[];
      executionHandoffEligible: false;
    }>
  | Readonly<{
      status: 'NOT_AUTHORIZED';
      code: FinTechCoreOrderIntentBindingFailureCode;
      reason: string;
      executionHandoffEligible: false;
    }>;

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

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function required(value: string): boolean {
  return Boolean(value.trim());
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

function sha256(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function uniqueEvidenceRefs(...groups: readonly (readonly string[])[]): readonly string[] {
  return Object.freeze([
    ...new Set(groups.flat().map((value) => value.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b)));
}

/**
 * FT-6A deterministic binding from authoritative FT-5 decision evidence to an immutable OrderIntent.
 *
 * This function deliberately supports PAPER mode only. It does not authorize an exchange, custody,
 * wallet or settlement side effect. GUARDED_LIVE/PRODUCTION remain blocked until later roadmap gates.
 * Risk/compliance approval values are derived from the referenced decision records and are never
 * accepted as caller-controlled flags.
 */
export function bindApprovedOrderIntent(
  input: FinTechCoreOrderIntentBindingInput,
): FinTechCoreOrderIntentBindingResult {
  const { context, riskDecision, complianceDecision } = input;

  if (context.operatingMode !== 'PAPER') {
    return deny(
      'MODE_NOT_ALLOWED',
      `FT-6A OrderIntent binding is PAPER-only; received ${context.operatingMode}.`,
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

  if (!isIsoTimestamp(input.createdAt) || !isIsoTimestamp(input.expiresAt)) {
    return deny('INVALID_TIMESTAMP', 'createdAt and expiresAt must be valid ISO timestamps.');
  }
  const createdAtMs = Date.parse(input.createdAt);
  const expiresAtMs = Date.parse(input.expiresAt);
  if (expiresAtMs <= createdAtMs) {
    return deny('EXPIRED_INTENT', 'OrderIntent expiry must be strictly after creation.');
  }
  if (Date.parse(riskDecision.decidedAt) > createdAtMs || Date.parse(complianceDecision.decidedAt) > createdAtMs) {
    return deny('INVALID_TIMESTAMP', 'OrderIntent cannot predate its risk/compliance decisions.');
  }

  const requiresLimitPrice = input.orderType === 'LIMIT' || input.orderType === 'POST_ONLY';
  if (
    !required(input.orderIntentId)
    || !required(input.clientOrderId)
    || !required(input.idempotencyKey)
    || !isPositiveFinite(input.quantity)
    || !isNonNegativeFinite(input.maxSlippageBps)
    || input.maxSlippageBps > 10_000
    || (input.limitPrice !== undefined && !isPositiveFinite(input.limitPrice))
    || (requiresLimitPrice && input.limitPrice === undefined)
  ) {
    return deny('INVALID_ORDER_INTENT', 'OrderIntent identity, quantity, price or slippage bounds are invalid.');
  }

  const evidenceRefs = uniqueEvidenceRefs(riskDecision.evidenceRefs, complianceDecision.evidenceRefs, [
    `decision://${riskDecision.decisionId}`,
    `decision://${complianceDecision.decisionId}`,
  ]);

  const canonical = Object.freeze({
    bindingVersion: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    assetId: context.asset.assetId,
    strategyId: context.strategyId ?? null,
    portfolioId: context.portfolioId ?? null,
    decisionVersion: context.decisionVersion,
    orderIntentId: input.orderIntentId,
    clientOrderId: input.clientOrderId,
    idempotencyKey: input.idempotencyKey,
    side: input.side,
    quantity: input.quantity,
    orderType: input.orderType,
    limitPrice: input.limitPrice ?? null,
    maxSlippageBps: input.maxSlippageBps,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    riskDecisionId: riskDecision.decisionId,
    riskDecisionOutputHash: riskDecision.outputHash,
    riskPolicyId: riskDecision.policyId ?? null,
    riskPolicyVersion: riskDecision.policyVersion ?? null,
    complianceDecisionId: complianceDecision.decisionId,
    complianceDecisionOutputHash: complianceDecision.outputHash,
    compliancePolicyId: complianceDecision.policyId ?? null,
    compliancePolicyVersion: complianceDecision.policyVersion ?? null,
    evidenceRefs,
  });

  const intent: FinTechCoreBoundOrderIntent = Object.freeze({
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    bindingVersion: FINTECH_CORE_ORDER_INTENT_BINDING_VERSION,
    orderIntentId: input.orderIntentId,
    clientOrderId: input.clientOrderId,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    idempotencyKey: input.idempotencyKey,
    assetId: context.asset.assetId,
    side: input.side,
    quantity: input.quantity,
    orderType: input.orderType,
    limitPrice: input.limitPrice,
    maxSlippageBps: input.maxSlippageBps,
    strategyId: context.strategyId,
    portfolioId: context.portfolioId,
    decisionVersion: context.decisionVersion,
    riskApproval: 'APPROVED',
    complianceApproval: 'APPROVED',
    riskDecisionId: riskDecision.decisionId,
    riskDecisionOutputHash: riskDecision.outputHash,
    complianceDecisionId: complianceDecision.decisionId,
    complianceDecisionOutputHash: complianceDecision.outputHash,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    intentHash: sha256(canonical),
    effectClass: 'SIDE_EFFECTING',
  });

  return Object.freeze({
    status: 'BOUND' as const,
    intent,
    evidenceRefs,
    executionHandoffEligible: false as const,
  });
}
